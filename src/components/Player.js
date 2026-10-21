// TODE AND THE LAST LILYPAD - Hero Player Engine
// Scaled-up Tode with 2-slot belly flavor tinting, squash-and-stretch hopping, shockwave, spit, and slam.

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GAME_CONSTANTS } from '../constants.js';
import { eventBus } from '../eventBus.js';
import { sounds } from './Audio.js';
import { perkManager } from './Perks.js';

export async function createPlayer() {
  const group = new THREE.Group();
  group.position.set(0, 0, 0);

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync('/models/tode.glb');
  const gltfScene = gltf.scene;

  // Orient gltf scene so frog's face aligns forward (local +Z rotates to face world +Y)
  gltfScene.rotation.y = Math.PI;

  // Scaled up for heroic presence (Section 6.2)
  const meshHolder = new THREE.Group();
  meshHolder.scale.setScalar(GAME_CONSTANTS.PLAYER_SCALE);
  meshHolder.add(gltfScene);

  // Model group: animatable root for ClipPlayer (scale 1.0 base) and controller rotation
  const model = new THREE.Group();
  model.rotation.x = Math.PI / 2; // Align with Z-up coordinate system
  model.scale.set(1, 1, 1);
  model.add(meshHolder);

  meshHolder.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(meshHolder);
  const modelBaseZ = -box.min.z;
  model.position.z = modelBaseZ;
  group.add(model);

  // 1. Two-Slot Belly Flavor Tint Orbs (Section 6.7)
  const bellyGroup = new THREE.Group();
  bellyGroup.position.set(0, 10, -8); // Positioned on front belly

  const orbGeo = new THREE.SphereGeometry(3.2, 12, 12);
  const bellyMat1 = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    emissive: 0x000000,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.85,
    shininess: 90,
  });
  const bellyMat2 = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    emissive: 0x000000,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.85,
    shininess: 90,
  });

  const bellyOrb1 = new THREE.Mesh(orbGeo, bellyMat1);
  bellyOrb1.position.set(-3.5, 0, 0);
  bellyOrb1.visible = false;
  bellyGroup.add(bellyOrb1);

  const bellyOrb2 = new THREE.Mesh(orbGeo, bellyMat2);
  bellyOrb2.position.set(3.5, 0, 0);
  bellyOrb2.visible = false;
  bellyGroup.add(bellyOrb2);

  model.add(bellyGroup);

  // 2. Shockwave visual ring
  const shockwaveGeo = new THREE.RingGeometry(1, GAME_CONSTANTS.SHOCKWAVE_RADIUS, 36);
  const shockwaveMat = new THREE.MeshBasicMaterial({
    color: 0xffea00,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const shockwaveMesh = new THREE.Mesh(shockwaveGeo, shockwaveMat);
  shockwaveMesh.position.set(0, 0, 0.25);
  shockwaveMesh.visible = false;

  // 3. Meteor Slam targeting ring
  const slamGeo = new THREE.RingGeometry(
    GAME_CONSTANTS.SLAM_RADIUS - 6,
    GAME_CONSTANTS.SLAM_RADIUS,
    48
  );
  const slamMat = new THREE.MeshBasicMaterial({
    color: 0xff0055,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const slamMesh = new THREE.Mesh(slamGeo, slamMat);
  slamMesh.position.set(0, 0, 0.26);
  slamMesh.visible = false;

  // Player State Object
  const playerState = {
    group,
    model,
    modelBaseZ,
    bellyOrb1,
    bellyOrb2,
    bellyMat1,
    bellyMat2,
    shockwaveMesh,
    slamMesh,

    hp: GAME_CONSTANTS.MAX_HEARTS,
    maxHp: GAME_CONSTANTS.MAX_HEARTS,
    moveSpeed: GAME_CONSTANTS.BASE_MOVE_SPEED,
    jumpHeight: GAME_CONSTANTS.JUMP_HEIGHT,
    jumpDistance: GAME_CONSTANTS.JUMP_DISTANCE,
    isMoving: false,
    moveStart: new THREE.Vector2(),
    moveTarget: new THREE.Vector2(),
    moveProgress: 0,
    inputQueue: [],

    shockwaveCooldown: GAME_CONSTANTS.SHOCKWAVE_COOLDOWN,
    shockwaveTimer: 0,
    shockwaveVisualTimer: 0,

    ultEnergy: 0,
    isMeteorSlamming: false,
    slamTimer: 0,

    invulnerableTimer: 0,
    hitStopTimer: 0,
    squashX: 1,
    squashZ: 1,

    addUltEnergy(amount) {
      const mult = perkManager?.modifiers?.ultGainMult || 1.0;
      this.ultEnergy = Math.min(GAME_CONSTANTS.SLAM_MAX_ENERGY, this.ultEnergy + amount * mult);
    },

    getForwardVector() {
      const angle = this.model.rotation.y;
      return new THREE.Vector2(-Math.sin(angle), Math.cos(angle)).normalize();
    },

    setFacingDirection(dx, dy) {
      if (this.isMeteorSlamming) return;
      this.model.rotation.y = Math.atan2(-dx, dy);
    },

    setFacingDirectionByName(dir) {
      if (this.isMeteorSlamming) return;
      switch (dir) {
        case 'up':
          this.model.rotation.y = 0;
          break;
        case 'down':
          this.model.rotation.y = Math.PI;
          break;
        case 'left':
          this.model.rotation.y = Math.PI / 2;
          break;
        case 'right':
          this.model.rotation.y = -Math.PI / 2;
          break;
      }
    },

    queueMove(direction) {
      if (this.isMeteorSlamming || this.hp <= 0) return;
      if (this.inputQueue.length < 2) {
        this.inputQueue.push(direction);
      }
    },

    startJump(dir, isBlockedFn) {
      const startX = this.group.position.x;
      const startY = this.group.position.y;
      let targetX = startX;
      let targetY = startY;
      let targetAngle = this.model.rotation.y;

      switch (dir) {
        case 'up':
          targetY += this.jumpDistance;
          targetAngle = 0;
          break;
        case 'down':
          targetY -= this.jumpDistance;
          targetAngle = Math.PI;
          break;
        case 'left':
          targetX -= this.jumpDistance;
          targetAngle = Math.PI / 2;
          break;
        case 'right':
          targetX += this.jumpDistance;
          targetAngle = -Math.PI / 2;
          break;
      }

      this.model.rotation.y = targetAngle;

      if (isBlockedFn && isBlockedFn(targetX, targetY)) {
        return;
      }

      this.isMoving = true;
      this.moveProgress = 0;
      this.moveStart.set(startX, startY);
      this.moveTarget.set(targetX, targetY);

      sounds.playJump();
      eventBus.emit('player:hop');
    },

    triggerShockwave(enemies, particles, onKill) {
      if (this.shockwaveTimer > 0 || this.isMeteorSlamming) return false;

      this.shockwaveTimer = this.shockwaveCooldown;
      this.shockwaveVisualTimer = 0.28;

      sounds.playAttack();

      this.shockwaveMesh.position.set(this.group.position.x, this.group.position.y, 0.25);
      this.shockwaveMesh.scale.set(1, 1, 1);
      this.shockwaveMesh.material.opacity = 0.85;
      this.shockwaveMesh.visible = true;

      if (particles) {
        particles.emitShockwaveSparks(
          this.group.position.x,
          this.group.position.y,
          GAME_CONSTANTS.SHOCKWAVE_RADIUS
        );
      }

      eventBus.emit('shockwave:fired');
      return true;
    },

    triggerMeteorSlam() {
      if (this.ultEnergy < GAME_CONSTANTS.SLAM_MAX_ENERGY || this.isMeteorSlamming) return false;

      this.ultEnergy = 0;
      this.isMeteorSlamming = true;
      this.slamTimer = 1.2;

      this.slamMesh.position.set(this.group.position.x, this.group.position.y, 0.26);
      this.slamMesh.visible = true;
      this.slamMesh.material.opacity = 0.85;

      sounds.playJump();
      eventBus.emit('slam:used');
      eventBus.emit('slam:fired');
      return true;
    },

    takeDamage() {
      if (this.invulnerableTimer > 0 || this.isMeteorSlamming || this.hp <= 0) return false;

      this.hp--;
      sounds.playHurt();
      this.invulnerableTimer = 1.6;

      eventBus.emit('player:damaged', this.hp);

      if (this.hp <= 0) {
        eventBus.emit('game:over', 'player_dead');
        return true;
      }
      return false;
    },

    updateBellyTint(stomach) {
      if (!stomach) return;
      const snap = stomach.getSnapshot();
      if (snap.slots[0]) {
        this.bellyOrb1.visible = true;
        this.bellyMat1.color.setHex(snap.slots[0].colorHex);
        this.bellyMat1.emissive.setHex(snap.slots[0].colorHex);
      } else {
        this.bellyOrb1.visible = false;
      }

      if (snap.slots[1]) {
        this.bellyOrb2.visible = true;
        this.bellyMat2.color.setHex(snap.slots[1].colorHex);
        this.bellyMat2.emissive.setHex(snap.slots[1].colorHex);
      } else {
        this.bellyOrb2.visible = false;
      }
    },

    update(delta, checkCollision, particles, stomach, onSlamImpact) {
      // Cooldown timer
      if (this.shockwaveTimer > 0) {
        this.shockwaveTimer = Math.max(0, this.shockwaveTimer - delta);
      }

      // Invulnerability blinking
      if (this.invulnerableTimer > 0) {
        this.invulnerableTimer -= delta;
        const blink = Math.floor(this.invulnerableTimer * 12) % 2 === 0;
        this.model.visible = blink;
      } else {
        this.model.visible = true;
      }

      // Shockwave visual fade out
      if (this.shockwaveVisualTimer > 0) {
        this.shockwaveVisualTimer -= delta;
        if (this.shockwaveVisualTimer <= 0) {
          this.shockwaveMesh.visible = false;
        } else {
          const pct = this.shockwaveVisualTimer / 0.28;
          this.shockwaveMesh.material.opacity = Math.max(0, pct) * 0.85;
          const expand = (1 - pct) * 1.2 + 0.2;
          this.shockwaveMesh.scale.set(expand, expand, 1);
        }
      }

      // Meteor Slam vault handling
      if (this.isMeteorSlamming) {
        this.slamTimer -= delta;
        if (this.slamTimer > 0.4) {
          const upProgress = (1.2 - this.slamTimer) / 0.8;
          this.group.position.z = 0;
          this.model.position.z = this.modelBaseZ + Math.sin(upProgress * Math.PI * 0.5) * 115;
          this.model.rotation.y += delta * 12;
        } else {
          const downProgress = (0.4 - this.slamTimer) / 0.4;
          this.group.position.z = 0;
          this.model.position.z = this.modelBaseZ + THREE.MathUtils.lerp(115, 0, downProgress);

          if (this.slamTimer <= 0) {
            this.isMeteorSlamming = false;
            this.group.position.z = 0;
            this.model.position.z = this.modelBaseZ;
            this.slamMesh.visible = false;

            if (onSlamImpact) {
              onSlamImpact();
            }
          }
        }
        return;
      }

      // Normal Hop Movement
      if (this.isMoving) {
        this.moveProgress += delta * this.moveSpeed;

        if (this.moveProgress >= 1) {
          this.moveProgress = 1;
          this.group.position.x = this.moveTarget.x;
          this.group.position.y = this.moveTarget.y;
          this.group.position.z = 0;
          this.model.position.z = this.modelBaseZ;
          this.isMoving = false;

          if (particles) {
            particles.emitJumpDust(this.group.position.x, this.group.position.y);
          }
          eventBus.emit('player:landed', this.group.position);
        } else {
          this.group.position.x = THREE.MathUtils.lerp(this.moveStart.x, this.moveTarget.x, this.moveProgress);
          this.group.position.y = THREE.MathUtils.lerp(this.moveStart.y, this.moveTarget.y, this.moveProgress);
          this.group.position.z = 0;
          this.model.position.z = this.modelBaseZ + Math.sin(this.moveProgress * Math.PI) * this.jumpHeight;
        }
      } else {
        if (this.inputQueue.length > 0) {
          const nextDir = this.inputQueue.shift();
          this.startJump(nextDir, checkCollision);
        }
      }
    },

    reset() {
      this.group.position.set(0, 0, 0);
      this.group.visible = true;
      this.model.visible = true;
      this.model.position.z = this.modelBaseZ;
      this.hp = this.maxHp;
      this.invulnerableTimer = 0;
      this.hitStopTimer = 0;
      this.isMoving = false;
      this.moveProgress = 0;
      this.inputQueue = [];
      this.shockwaveTimer = 0;
      this.shockwaveVisualTimer = 0;
      this.shockwaveMesh.visible = false;
      this.slamMesh.visible = false;
      this.model.rotation.y = 0;
      this.ultEnergy = 0;
      this.isMeteorSlamming = false;
      this.squashX = 1;
      this.squashZ = 1;
    },
  };

  return playerState;
}
