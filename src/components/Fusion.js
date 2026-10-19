// TODE AND THE LAST LILYPAD - Fusion Attack & Projectiles Engine
// Implements all 6 fusion projectile behaviors, ground puddles, steam clouds, and elemental slams.

import * as THREE from 'three';
import { GAME_CONSTANTS } from '../constants.js';
import { eventBus } from '../eventBus.js';
import { sounds } from './Audio.js';

export class FusionSystem {
  constructor(scene, particles) {
    this.scene = scene;
    this.particles = particles;
    this.projectiles = [];
    this.groundHazards = []; // Burning puddles, steam clouds

    // Shared geometries and materials
    this.sphereGeo = new THREE.SphereGeometry(3.5, 12, 12);
    this.largeSphereGeo = new THREE.SphereGeometry(6.5, 16, 16);
    this.shardGeo = new THREE.ConeGeometry(2, 6, 5);
    this.shardGeo.rotateX(Math.PI / 2);

    this.fireGeo = new THREE.CircleGeometry(42, 20);
    this.fireMat = new THREE.MeshBasicMaterial({
      color: 0xff3800,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.steamGeo = new THREE.CircleGeometry(75, 20);
    this.steamMat = new THREE.MeshBasicMaterial({
      color: 0xc8b6ff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.matCache = new Map();
  }

  getMat(color) {
    if (!this.matCache.has(color)) {
      this.matCache.set(
        color,
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.95,
        })
      );
    }
    return this.matCache.get(color);
  }

  spit(player, fusion, optionalTargetPoint = null) {
    if (!fusion) return false;

    let dir;
    let angle = player.model.rotation.y;
    const pPos = player.group.position;

    if (optionalTargetPoint) {
      dir = new THREE.Vector2(optionalTargetPoint.x - pPos.x, optionalTargetPoint.y - pPos.y).normalize();
      angle = Math.atan2(-dir.x, dir.y);
    } else {
      dir = player.getForwardVector
        ? player.getForwardVector()
        : new THREE.Vector2(-Math.sin(angle), Math.cos(angle)).normalize();
    }

    const startX = pPos.x + dir.x * 16;
    const startY = pPos.y + dir.y * 16;
    const startZ = 7;

    const element = fusion.element || (fusion.id.includes('fire') ? 'fire' : fusion.id.includes('ice') ? 'ice' : fusion.id.includes('electric') ? 'electric' : 'plain');
    sounds.playSpit(element);

    if (fusion.id === 'shatter_shot') {
      // 5 shards in a cone
      const count = 5;
      const spread = 0.55;
      for (let i = 0; i < count; i++) {
        const offset = (i / (count - 1) - 0.5) * spread;
        const shardAngle = angle + offset;
        const sDir = new THREE.Vector2(-Math.sin(shardAngle), Math.cos(shardAngle)).normalize();
        this.spawnProjectile({
          fusion,
          x: startX,
          y: startY,
          z: startZ,
          dir: sDir,
          speed: 520,
          radius: 4,
          damage: fusion.damage || 1.5,
          color: fusion.colorHex,
          maxLife: 0.8,
          geometry: this.shardGeo,
        });
      }
    } else if (fusion.id === 'plasma_orb') {
      // Piercing slow giant orb
      this.spawnProjectile({
        fusion,
        x: startX,
        y: startY,
        z: startZ + 2,
        dir,
        speed: 310,
        radius: 8.5,
        damage: fusion.damage || 4.5,
        color: fusion.colorHex,
        pierce: true,
        maxLife: 1.8,
        geometry: this.largeSphereGeo,
        hitList: new Set(),
      });
    } else if (fusion.id === 'inferno') {
      // Inferno fireball
      this.spawnProjectile({
        fusion,
        x: startX,
        y: startY,
        z: startZ,
        dir,
        speed: 460,
        radius: 6.5,
        damage: fusion.damage || 3.5,
        color: fusion.colorHex,
        createsFireGround: true,
        maxLife: 1.2,
        geometry: this.largeSphereGeo,
      });
    } else {
      // Standard / Glacier / Chain Lightning / Steam Burst / Single element
      this.spawnProjectile({
        fusion,
        x: startX,
        y: startY,
        z: startZ,
        dir,
        speed: 480,
        radius: 4.5,
        damage: fusion.damage || 2.0,
        color: fusion.colorHex,
        maxLife: 1.2,
        geometry: this.sphereGeo,
      });
    }

    eventBus.emit('spit:fired', fusion);
    return true;
  }

  spawnProjectile(params) {
    const mat = this.getMat(params.color);
    const mesh = new THREE.Mesh(params.geometry, mat);
    mesh.position.set(params.x, params.y, params.z);
    mesh.lookAt(params.x + params.dir.x, params.y + params.dir.y, params.z);
    this.scene.add(mesh);

    this.projectiles.push({
      ...params,
      mesh,
      mat,
      life: 0,
    });
  }

  createFireGround(x, y, radius = 40, duration = 4.0) {
    const mesh = new THREE.Mesh(this.fireGeo, this.fireMat.clone());
    mesh.position.set(x, y, 0.28);
    this.scene.add(mesh);

    this.groundHazards.push({
      type: 'fire',
      mesh,
      mat: mesh.material,
      x,
      y,
      radius,
      duration,
      life: 0,
      tickTimer: 0,
      damagePerTick: 0.8,
    });
  }

  createSteamCloud(x, y, radius = 75, duration = 3.5) {
    const mesh = new THREE.Mesh(this.steamGeo, this.steamMat.clone());
    mesh.position.set(x, y, 0.32);
    this.scene.add(mesh);

    this.groundHazards.push({
      type: 'steam',
      mesh,
      mat: mesh.material,
      x,
      y,
      radius,
      duration,
      life: 0,
    });
  }

  elementalSlam(player, fusion, enemies, onKill) {
    const pPos = player.group.position;
    const slamX = pPos.x;
    const slamY = pPos.y;
    const slamRadius = GAME_CONSTANTS.SLAM_RADIUS;

    sounds.playMeteorSlam();

    if (fusion && fusion.id !== 'plain_spit') {
      if (fusion.id.includes('fire') || fusion.id === 'inferno') {
        this.createFireGround(slamX, slamY, slamRadius * 0.9, 5.0);
      }
      if (fusion.id.includes('ice') || fusion.id === 'glacier') {
        for (const e of enemies) {
          const d = Math.hypot(e.group.position.x - slamX, e.group.position.y - slamY);
          if (d <= slamRadius * 1.2) {
            e.freezeTimer = 4.0;
          }
        }
      }
      if (fusion.id.includes('electric') || fusion.id === 'chain_lightning') {
        for (const e of enemies) {
          e.hp -= 2.0;
        }
      }
    }
  }

  update(delta, enemies, onKill) {
    // 1. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life += delta;

      p.mesh.position.x += p.dir.x * p.speed * delta;
      p.mesh.position.y += p.dir.y * p.speed * delta;

      // Particle trail
      if (this.particles && Math.random() < 0.6) {
        this.particles.emitCollectSparkle(
          p.mesh.position.x,
          p.mesh.position.y,
          p.mesh.position.z,
          p.color
        );
      }

      let destroyed = false;

      // Check collision with enemies
      for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
        const e = enemies[eIdx];
        if (p.pierce && p.hitList && p.hitList.has(e)) continue;

        const dist = Math.hypot(
          e.group.position.x - p.mesh.position.x,
          e.group.position.y - p.mesh.position.y
        );

        if (dist <= p.radius + (e.radius || 18)) {
          // Check armored beetle immunity if not flipped
          if (e.config && e.config.armored && !e.isFlipped) {
            sounds.playFlip();
            if (this.particles) {
              this.particles.emitShockwaveSparks(p.mesh.position.x, p.mesh.position.y, 20);
            }
            destroyed = true;
            break;
          }

          // Apply Damage
          e.hp -= p.damage;
          sounds.playHurt();
          eventBus.emit('enemy:hit', e, p.damage, p.fusion);

          // Apply Special Fusion Effects
          if (p.fusion.id === 'glacier') {
            e.freezeTimer = p.fusion.freezeDuration || 2.5;
            sounds.playShatter();
          } else if (p.fusion.id === 'chain_lightning') {
            // Arc to nearby foes
            this.triggerChainLightning(e, enemies, p.fusion.chainCount || 3, p.fusion.chainRadius || 100);
          } else if (p.fusion.id === 'steam_burst') {
            this.createSteamCloud(e.group.position.x, e.group.position.y, 75, 3.5);
          }

          if (this.particles) {
            this.particles.emitShockwaveSparks(e.group.position.x, e.group.position.y, 25);
          }

          if (e.hp <= 0) {
            if (onKill) onKill(e, p.fusion);
          }

          if (p.pierce) {
            p.hitList.add(e);
          } else {
            if (p.createsFireGround) {
              this.createFireGround(p.mesh.position.x, p.mesh.position.y, 42, 4.0);
            }
            destroyed = true;
            break;
          }
        }
      }

      // Check bounds or max lifetime
      if (
        destroyed ||
        p.life >= p.maxLife ||
        Math.abs(p.mesh.position.x) > GAME_CONSTANTS.ARENA_HALF ||
        Math.abs(p.mesh.position.y) > GAME_CONSTANTS.ARENA_HALF
      ) {
        if (!destroyed && p.createsFireGround) {
          this.createFireGround(p.mesh.position.x, p.mesh.position.y, 42, 4.0);
        }
        this.scene.remove(p.mesh);
        p.mat.dispose();
        this.projectiles.splice(i, 1);
      }
    }

    // 2. Update Ground Hazards (Fire Puddles & Steam Clouds)
    for (let hIdx = this.groundHazards.length - 1; hIdx >= 0; hIdx--) {
      const h = this.groundHazards[hIdx];
      h.life += delta;

      // Pulse opacity
      h.mat.opacity = (1 - h.life / h.duration) * 0.7;

      if (h.type === 'fire') {
        h.tickTimer += delta;
        if (h.tickTimer >= 0.3) {
          h.tickTimer = 0;
          for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
            const e = enemies[eIdx];
            const dist = Math.hypot(e.group.position.x - h.x, e.group.position.y - h.y);
            if (dist <= h.radius) {
              e.hp -= h.damagePerTick;
              if (this.particles && Math.random() < 0.4) {
                this.particles.emitEnemyExplosion(e.group.position.x, e.group.position.y, 4, 0xff3800);
              }
              if (e.hp <= 0 && onKill) {
                onKill(e, { id: 'inferno', name: 'Inferno Fire' });
              }
            }
          }
        }
      } else if (h.type === 'steam') {
        // Blind enemies inside cloud
        for (const e of enemies) {
          const dist = Math.hypot(e.group.position.x - h.x, e.group.position.y - h.y);
          if (dist <= h.radius) {
            e.blindTimer = 1.0; // Keeps wandering blindly
          }
        }
      }

      if (h.life >= h.duration) {
        this.scene.remove(h.mesh);
        h.mat.dispose();
        this.groundHazards.splice(hIdx, 1);
      }
    }
  }

  triggerChainLightning(originEnemy, enemies, maxArcs = 3, maxDist = 100) {
    let chained = 0;
    for (const e of enemies) {
      if (e === originEnemy) continue;
      const d = Math.hypot(
        e.group.position.x - originEnemy.group.position.x,
        e.group.position.y - originEnemy.group.position.y
      );
      if (d <= maxDist) {
        e.hp -= 2.0;
        if (this.particles) {
          this.particles.emitShockwaveSparks(e.group.position.x, e.group.position.y, 28);
        }
        chained++;
        if (chained >= maxArcs) break;
      }
    }
  }

  clear() {
    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
      p.mat.dispose();
    }
    this.projectiles = [];

    for (const h of this.groundHazards) {
      this.scene.remove(h.mesh);
      h.mat.dispose();
    }
    this.groundHazards = [];
  }
}
