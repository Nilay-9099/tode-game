// TODE AND THE LAST LILYPAD - Robust Tongue & Snatch Engine
// Smooth elastic whip with NaN-guarded geometry alignment, bug reeling, and clean collection.

import * as THREE from 'three';
import { GAME_CONSTANTS } from '../constants.js';
import { sounds } from './Audio.js';

export class TongueSystem {
  constructor(scene) {
    this.scene = scene;
    this.cooldown = GAME_CONSTANTS.SNATCH_COOLDOWN;
    this.timer = 0;
    this.baseRange = GAME_CONSTANTS.SNATCH_RANGE;
    this.range = this.baseRange;
    this.maxSnatchCount = 1;
    this.state = 'idle'; // 'idle', 'extending', 'retracting'
    this.progress = 0;
    this.extendSpeed = 6.0;
    this.retractSpeed = 7.5;

    this.startPos = new THREE.Vector3();
    this.targetPos = new THREE.Vector3();
    this.currentTip = new THREE.Vector3();
    this.midPoint = new THREE.Vector3();
    this.hitTarget = null;
    this.hitType = null; // 'bug' or 'enemy' or 'boss_fuel'

    // 3D Tongue Mesh
    const tongueGeo = new THREE.CylinderGeometry(1.6, 2.4, 1, 8);
    tongueGeo.rotateX(Math.PI / 2);
    const tongueMat = new THREE.MeshPhongMaterial({
      color: 0xff3366,
      emissive: 0xff0055,
      emissiveIntensity: 0.35,
      shininess: 90,
    });
    this.mesh = new THREE.Mesh(tongueGeo, tongueMat);
    this.mesh.up.set(0, 0, 1);
    this.mesh.visible = false;
    this.scene.add(this.mesh);

    // Sticky tip orb
    const tipGeo = new THREE.SphereGeometry(3.5, 8, 8);
    const tipMat = new THREE.MeshPhongMaterial({ color: 0xff0055, shininess: 100 });
    this.tipMesh = new THREE.Mesh(tipGeo, tipMat);
    this.tipMesh.up.set(0, 0, 1);
    this.tipMesh.visible = false;
    this.scene.add(this.tipMesh);
  }

  reset() {
    this.state = 'idle';
    this.progress = 0;
    this.timer = 0;
    this.hitTarget = null;
    this.hitType = null;
    if (this.mesh) this.mesh.visible = false;
    if (this.tipMesh) this.tipMesh.visible = false;
  }

  canShoot() {
    return this.timer <= 0 && this.state === 'idle';
  }

  shoot(player, bugs, enemies, optionalAimPoint = null) {
    if (!this.canShoot()) return false;

    this.timer = this.cooldown;
    this.state = 'extending';
    this.progress = 0;
    this.hitTarget = null;
    this.hitType = null;

    const pPos = player.group.position;
    this.startPos.set(pPos.x, pPos.y, 8);

    const aimDir = player.getForwardVector
      ? player.getForwardVector()
      : new THREE.Vector2(-Math.sin(player.model.rotation.y), Math.cos(player.model.rotation.y)).normalize();

    let bestDist = this.range;
    let targetX = pPos.x + aimDir.x * this.range;
    let targetY = pPos.y + aimDir.y * this.range;

    // Optional direct aim point (e.g. from mouse click)
    if (optionalAimPoint) {
      const clickDist = Math.hypot(optionalAimPoint.x - pPos.x, optionalAimPoint.y - pPos.y);
      if (clickDist <= this.range) {
        targetX = optionalAimPoint.x;
        targetY = optionalAimPoint.y;
      } else {
        const dir = new THREE.Vector2(optionalAimPoint.x - pPos.x, optionalAimPoint.y - pPos.y).normalize();
        targetX = pPos.x + dir.x * this.range;
        targetY = pPos.y + dir.y * this.range;
      }
    }

    // 1. Check for Flavor Bugs
    if (bugs && bugs.length > 0) {
      // If clicked directly near a bug (within 35 units), prioritize it directly
      if (optionalAimPoint) {
        for (const bug of bugs) {
          const dClick = Math.hypot(bug.group.position.x - optionalAimPoint.x, bug.group.position.y - optionalAimPoint.y);
          const dPlayer = Math.hypot(bug.group.position.x - pPos.x, bug.group.position.y - pPos.y);
          if (dClick < 38 && dPlayer <= this.range) {
            this.hitTarget = bug;
            this.hitType = 'bug';
            targetX = bug.group.position.x;
            targetY = bug.group.position.y;
            break;
          }
        }
      }

      // Forward cone lock-on
      if (!this.hitTarget) {
        for (const bug of bugs) {
          const dx = bug.group.position.x - pPos.x;
          const dy = bug.group.position.y - pPos.y;
          const d = Math.hypot(dx, dy);
          if (d <= this.range) {
            const dot = (dx / d) * aimDir.x + (dy / d) * aimDir.y;
            if (dot > 0.35 && d < bestDist) {
              bestDist = d;
              targetX = bug.group.position.x;
              targetY = bug.group.position.y;
              this.hitTarget = bug;
              this.hitType = 'bug';
            }
          }
        }
      }
    }

    // 2. Check for Enemies if no bug targeted
    if (!this.hitTarget && enemies && enemies.length > 0) {
      if (optionalAimPoint) {
        for (const enemy of enemies) {
          if (enemy.config.armored && !enemy.isFlipped) continue;
          const dClick = Math.hypot(enemy.group.position.x - optionalAimPoint.x, enemy.group.position.y - optionalAimPoint.y);
          const dPlayer = Math.hypot(enemy.group.position.x - pPos.x, enemy.group.position.y - pPos.y);
          if (dClick < 38 && dPlayer <= this.range) {
            this.hitTarget = enemy;
            this.hitType = enemy.config.id === 'boss_mower' ? 'boss_fuel' : 'enemy';
            targetX = enemy.group.position.x;
            targetY = enemy.group.position.y;
            break;
          }
        }
      }

      if (!this.hitTarget) {
        for (const enemy of enemies) {
          if (enemy.config.armored && !enemy.isFlipped) continue;

          const dx = enemy.group.position.x - pPos.x;
          const dy = enemy.group.position.y - pPos.y;
          const d = Math.hypot(dx, dy);
          if (d <= this.range) {
            const dot = (dx / d) * aimDir.x + (dy / d) * aimDir.y;
            if (dot > 0.45 && d < bestDist) {
              bestDist = d;
              targetX = enemy.group.position.x;
              targetY = enemy.group.position.y;
              this.hitTarget = enemy;
              this.hitType = enemy.config.id === 'boss_mower' ? 'boss_fuel' : 'enemy';
            }
          }
        }
      }
    }

    if (this.hitTarget && this.hitType === 'bug') {
      this.hitTarget.isBeingPulled = true;
    }

    this.targetPos.set(targetX, targetY, 6);
    this.mesh.visible = true;
    this.tipMesh.visible = true;

    sounds.playTongue();
    return true;
  }

  update(delta, player, onCatch) {
    if (this.timer > 0) {
      this.timer = Math.max(0, this.timer - delta);
    }

    if (this.state === 'idle') {
      this.mesh.visible = false;
      this.tipMesh.visible = false;
      return;
    }

    const pPos = player.group.position;
    this.startPos.set(pPos.x, pPos.y, 8);

    if (this.state === 'extending') {
      this.progress += delta * this.extendSpeed;
      if (this.progress >= 1) {
        this.progress = 1;
        this.state = 'retracting';

        if (this.hitType === 'enemy' && this.hitTarget) {
          // If crow is diving, cancel dive and pull it down
          if (this.hitTarget.config && this.hitTarget.config.id === 'crow') {
            this.hitTarget.isDiving = false;
            this.hitTarget.diveTimer = 1.2;
            this.hitTarget.group.position.z = 6;
          }
          this.hitTarget.hp -= 2;
          sounds.playHurt();
        } else if (this.hitType === 'boss_fuel' && this.hitTarget) {
          // Weak spot snatched on Lawn Mower King!
          this.hitTarget.bossStunTimer = 3.0;
          this.hitTarget.bossIsCharging = false;
          this.hitTarget.bossIsTelegraphing = false;
          this.hitTarget.hp -= 3.0; // Bonus weak spot damage
          sounds.playHurt();
        }
      }
    } else if (this.state === 'retracting') {
      this.progress -= delta * this.retractSpeed;

      // Smoothly reel target along with retracting tongue
      if (this.hitTarget && this.hitTarget.group) {
        const reelProgress = Math.max(0, Math.min(1, this.progress));
        this.hitTarget.group.position.x = THREE.MathUtils.lerp(this.startPos.x, this.targetPos.x, reelProgress);
        this.hitTarget.group.position.y = THREE.MathUtils.lerp(this.startPos.y, this.targetPos.y, reelProgress);
        this.hitTarget.group.position.z = THREE.MathUtils.lerp(this.startPos.z, this.targetPos.z, reelProgress);
      }

      if (this.progress <= 0) {
        this.progress = 0;
        this.state = 'idle';
        this.mesh.visible = false;
        this.tipMesh.visible = false;

        const captured = this.hitTarget;
        const capturedType = this.hitType;
        this.hitTarget = null;
        this.hitType = null;

        if (captured && onCatch) {
          onCatch(capturedType, captured);
        }
        return;
      }
    }

    // Guard against collinear/zero distance NaN matrix calculation
    this.currentTip.lerpVectors(this.startPos, this.targetPos, Math.max(0, Math.min(1, this.progress)));
    this.midPoint.addVectors(this.startPos, this.currentTip).multiplyScalar(0.5);
    const length = this.startPos.distanceTo(this.currentTip);

    this.tipMesh.position.copy(this.currentTip);
    this.tipMesh.visible = true;

    if (length > 2.5) {
      this.mesh.position.copy(this.midPoint);
      this.mesh.scale.set(1, 1, length);
      this.mesh.lookAt(this.currentTip);
      this.mesh.visible = true;
    } else {
      this.mesh.visible = false;
    }
  }
}
