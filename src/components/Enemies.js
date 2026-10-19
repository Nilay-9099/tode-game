// TODE AND THE LAST LILYPAD - Optimized Enemy Hierarchy Engine
// Pre-created geometries and materials with cloned templates to eliminate shader compilation freezes.

import * as THREE from 'three';
import { ENEMY_CONFIGS, GAME_CONSTANTS } from '../constants.js';
import { eventBus } from '../eventBus.js';
import { sounds } from './Audio.js';

export class EnemyManager {
  constructor(scene, particles) {
    this.scene = scene;
    this.particles = particles;
    this.enemies = [];
    this.boss = null;
    this.spawnTimer = 0;
    this.spawnInterval = 2.8;
    this.wave = 1;
    this.currentPhaseKey = 'MORNING';
    this.rng = Math.random;

    this.initSharedResources();
    this.initTemplates();
  }

  setRng(fn) {
    this.rng = fn || Math.random;
  }

  initSharedResources() {
    // 1. Shared Materials
    this.shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // Gnome Materials
    this.gnomeBodyMat = new THREE.MeshLambertMaterial({ color: 0x2a9d8f });
    this.gnomeHatMat = new THREE.MeshLambertMaterial({ color: 0xe63946 });
    this.gnomeBeardMat = new THREE.MeshLambertMaterial({ color: 0xf1faee });
    this.gnomeSkinMat = new THREE.MeshLambertMaterial({ color: 0xffcdb2 });

    // Beetle Materials
    this.beetleShellMat = new THREE.MeshPhongMaterial({ color: 0x495057, shininess: 90 });
    this.beetleUnderMat = new THREE.MeshLambertMaterial({ color: 0x212529 });

    // Wasp Materials
    this.waspBodyMat = new THREE.MeshLambertMaterial({ color: 0xf72585 });
    this.waspStripeMat = new THREE.MeshLambertMaterial({ color: 0x240046 });
    this.waspWingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });

    // Crow Materials
    this.crowFeatherMat = new THREE.MeshLambertMaterial({ color: 0x1d3557 });
    this.crowBeakMat = new THREE.MeshLambertMaterial({ color: 0xf4a261 });
    this.crowEyeMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });

    // Boss Materials
    this.bossBodyMat = new THREE.MeshPhongMaterial({ color: 0xd90429, shininess: 80 });
    this.bossMetalMat = new THREE.MeshPhongMaterial({ color: 0x495057, shininess: 100 });
    this.bossFuelMat = new THREE.MeshBasicMaterial({ color: 0xffb703 });

    // 2. Shared Geometries
    this.gnomeBodyGeo = new THREE.CylinderGeometry(4, 5, 8, 8);
    this.gnomeBodyGeo.rotateX(Math.PI / 2);
    this.gnomeHeadGeo = new THREE.SphereGeometry(3.5, 8, 8);
    this.gnomeHatGeo = new THREE.ConeGeometry(3.8, 9, 8);
    this.gnomeHatGeo.rotateX(Math.PI / 2);
    this.gnomeBeardGeo = new THREE.ConeGeometry(3.2, 5, 6);
    this.gnomeBeardGeo.rotateX(-Math.PI / 3);

    this.beetleShellGeo = new THREE.SphereGeometry(7, 10, 8);
    this.beetleShellGeo.scale(1.1, 1.4, 0.7);
    this.beetleHornGeo = new THREE.ConeGeometry(1.8, 6, 6);
    this.beetleHornGeo.rotateX(-Math.PI / 3);
    this.beetleLegGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 4);

    this.waspThoraxGeo = new THREE.SphereGeometry(3.5, 8, 8);
    this.waspAbdomenGeo = new THREE.ConeGeometry(3, 8, 8);
    this.waspAbdomenGeo.rotateX(-Math.PI / 2.5);
    this.waspWingGeo = new THREE.PlaneGeometry(5, 10);

    this.crowBodyGeo = new THREE.ConeGeometry(4, 11, 7);
    this.crowBodyGeo.rotateX(Math.PI / 2.5);
    this.crowBeakGeo = new THREE.ConeGeometry(1.5, 4, 5);
    this.crowBeakGeo.rotateX(-Math.PI / 2);
    this.crowEyeGeo = new THREE.SphereGeometry(0.8, 4, 4);

    this.bossChassisGeo = new THREE.BoxGeometry(22, 30, 10);
    this.bossBladeGeo = new THREE.CylinderGeometry(12, 12, 4, 16);
    this.bossBladeGeo.rotateX(Math.PI / 2);
    this.bossExhaustGeo = new THREE.CylinderGeometry(1.5, 1.5, 10, 6);
    this.bossFuelGeo = new THREE.BoxGeometry(7, 7, 9);
  }

  initTemplates() {
    this.templates = {};

    // Gnome Template
    const gnome = new THREE.Group();
    const gBody = new THREE.Mesh(this.gnomeBodyGeo, this.gnomeBodyMat);
    gBody.position.z = 5;
    gnome.add(gBody);
    const gHead = new THREE.Mesh(this.gnomeHeadGeo, this.gnomeSkinMat);
    gHead.position.z = 10;
    gnome.add(gHead);
    const gHat = new THREE.Mesh(this.gnomeHatGeo, this.gnomeHatMat);
    gHat.position.z = 15;
    gnome.add(gHat);
    const gBeard = new THREE.Mesh(this.gnomeBeardGeo, this.gnomeBeardMat);
    gBeard.position.set(0, -2.2, 8.5);
    gnome.add(gBeard);
    const gShadow = new THREE.Mesh(new THREE.CircleGeometry(10, 12), this.shadowMat);
    gShadow.position.z = 0.22;
    gnome.add(gShadow);
    this.templates.gnome = gnome;

    // Beetle Template
    const beetle = new THREE.Group();
    const bShell = new THREE.Mesh(this.beetleShellGeo, this.beetleShellMat);
    bShell.position.z = 5;
    beetle.add(bShell);
    const bHorn = new THREE.Mesh(this.beetleHornGeo, this.beetleShellMat);
    bHorn.position.set(0, -8, 7);
    beetle.add(bHorn);
    const legsGroup = new THREE.Group();
    for (let i = -1; i <= 1; i++) {
      const lL = new THREE.Mesh(this.beetleLegGeo, this.beetleUnderMat);
      lL.position.set(-6, i * 4, 2);
      lL.rotation.z = Math.PI / 3;
      legsGroup.add(lL);
      const rL = new THREE.Mesh(this.beetleLegGeo, this.beetleUnderMat);
      rL.position.set(6, i * 4, 2);
      rL.rotation.z = -Math.PI / 3;
      legsGroup.add(rL);
    }
    beetle.add(legsGroup);
    beetle.name = 'beetle';
    const bShadow = new THREE.Mesh(new THREE.CircleGeometry(12, 12), this.shadowMat);
    bShadow.position.z = 0.22;
    beetle.add(bShadow);
    this.templates.beetle = beetle;

    // Wasp Template
    const wasp = new THREE.Group();
    const wThorax = new THREE.Mesh(this.waspThoraxGeo, this.waspBodyMat);
    wThorax.position.z = 12;
    wasp.add(wThorax);
    const wAbdomen = new THREE.Mesh(this.waspAbdomenGeo, this.waspStripeMat);
    wAbdomen.position.set(0, 5, 10);
    wasp.add(wAbdomen);
    const wL = new THREE.Mesh(this.waspWingGeo, this.waspWingMat);
    wL.position.set(-4, 0, 14);
    wL.name = 'wingL';
    wasp.add(wL);
    const wR = new THREE.Mesh(this.waspWingGeo, this.waspWingMat);
    wR.position.set(4, 0, 14);
    wR.name = 'wingR';
    wasp.add(wR);
    const wShadow = new THREE.Mesh(new THREE.CircleGeometry(9, 12), this.shadowMat);
    wShadow.position.z = 0.22;
    wasp.add(wShadow);
    this.templates.wasp = wasp;

    // Crow Template
    const crow = new THREE.Group();
    const cBody = new THREE.Mesh(this.crowBodyGeo, this.crowFeatherMat);
    cBody.position.z = 25;
    crow.add(cBody);
    const cBeak = new THREE.Mesh(this.crowBeakGeo, this.crowBeakMat);
    cBeak.position.set(0, -7, 26);
    crow.add(cBeak);
    const cEyeL = new THREE.Mesh(this.crowEyeGeo, this.crowEyeMat);
    cEyeL.position.set(-2, -4, 27);
    crow.add(cEyeL);
    const cEyeR = new THREE.Mesh(this.crowEyeGeo, this.crowEyeMat);
    cEyeR.position.set(2, -4, 27);
    crow.add(cEyeR);
    const cShadow = new THREE.Mesh(new THREE.CircleGeometry(11, 14), this.shadowMat);
    cShadow.position.z = 0.22;
    cShadow.name = 'shadow';
    crow.add(cShadow);
    this.templates.crow = crow;

    // Boss Template
    const boss = new THREE.Group();
    const bChassis = new THREE.Mesh(this.bossChassisGeo, this.bossBodyMat);
    bChassis.position.z = 7;
    boss.add(bChassis);
    const bBlades = new THREE.Mesh(this.bossBladeGeo, this.bossMetalMat);
    bBlades.position.set(0, -18, 4);
    boss.add(bBlades);
    const bExhaust = new THREE.Mesh(this.bossExhaustGeo, this.bossMetalMat);
    bExhaust.position.set(-8, 8, 14);
    boss.add(bExhaust);
    const bFuel = new THREE.Mesh(this.bossFuelGeo, this.bossFuelMat);
    bFuel.position.set(0, 16, 8);
    boss.add(bFuel);
    const bS = new THREE.Mesh(new THREE.CircleGeometry(24, 16), this.shadowMat);
    bS.position.z = 0.22;
    boss.add(bS);
    this.templates.boss_mower = boss;
  }

  setPhase(phaseKey) {
    this.currentPhaseKey = phaseKey;
  }

  spawn(config, x, y) {
    const template = this.templates[config.id] || this.templates.gnome;
    const group = template.clone(true);
    group.position.set(x, y, 0);
    this.scene.add(group);

    // Find animated nodes in cloned hierarchy
    const shadowMesh = group.getObjectByName('shadow');
    const wingL = group.getObjectByName('wingL');
    const wingR = group.getObjectByName('wingR');
    const legsGroup = group.children.find((c) => c.isGroup);

    const enemy = {
      config,
      group,
      shadowMesh,
      wingL,
      wingR,
      legsGroup,
      hp: config.hp,
      maxHp: config.hp,
      speed: config.speed,
      radius: config.scale * 0.75,
      isFlipped: false,
      flipTimer: 0,
      freezeTimer: 0,
      blindTimer: 0,
      stolenTadpole: null,
      diveTimer: config.diveBomber ? config.shadowTelegraphTime : 0,
      isDiving: false,
      bossPhase: 1,
      bossChargeTimer: 0,
      bossIsCharging: false,
      bossChargeDir: new THREE.Vector2(),
      bossStunTimer: 0,
      timeOffset: Math.random() * 10,
    };

    if (config.id === 'boss_mower') {
      this.boss = enemy;
      sounds.playBossRoar();
    }

    this.enemies.push(enemy);
    return enemy;
  }

  spawnRandomWaveEnemy() {
    const p = this.currentPhaseKey;
    let chosenConfig = ENEMY_CONFIGS.GNOME;

    if (p === 'MORNING') {
      chosenConfig = ENEMY_CONFIGS.GNOME;
    } else if (p === 'NOON') {
      chosenConfig = this.rng() < 0.5 ? ENEMY_CONFIGS.GNOME : ENEMY_CONFIGS.ARMORED_BEETLE;
    } else if (p === 'DUSK') {
      chosenConfig = this.rng() < 0.6 ? ENEMY_CONFIGS.WASP : ENEMY_CONFIGS.GNOME;
    } else if (p === 'NIGHT') {
      chosenConfig = this.rng() < 0.55 ? ENEMY_CONFIGS.CROW : ENEMY_CONFIGS.ARMORED_BEETLE;
    } else if (p === 'BOSS_ARENA') {
      chosenConfig = this.rng() < 0.5 ? ENEMY_CONFIGS.GNOME : ENEMY_CONFIGS.WASP;
    }

    const side = Math.floor(this.rng() * 4);
    let x = 0, y = 0;
    const edge = GAME_CONSTANTS.ARENA_HALF - 20;
    if (side === 0) { x = -edge; y = (this.rng() - 0.5) * edge * 2; }
    else if (side === 1) { x = edge; y = (this.rng() - 0.5) * edge * 2; }
    else if (side === 2) { x = (this.rng() - 0.5) * edge * 2; y = -edge; }
    else { x = (this.rng() - 0.5) * edge * 2; y = edge; }

    this.spawn(chosenConfig, x, y);
  }

  spawnBoss() {
    if (this.boss) return;
    this.spawn(ENEMY_CONFIGS.BOSS_MOWER, 0, 260);
  }

  onShockwave(shockX, shockY, radius, onKill, tadpoleManager) {
    const damage = GAME_CONSTANTS.SHOCKWAVE_DAMAGE || 2.5;
    const tMgr = tadpoleManager || this.tadpoleManager;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const d = Math.hypot(e.group.position.x - shockX, e.group.position.y - shockY);

      if (d <= radius + e.radius) {
        // 1. Glacier Shatter check
        if (e.freezeTimer > 0) {
          sounds.playShatter();
          if (this.particles) {
            this.particles.emitEnemyExplosion(e.group.position.x, e.group.position.y, 18, 0x00f5d4);
          }
          if (e.stolenTadpole && tMgr) {
            tMgr.releaseTadpole(e.stolenTadpole);
            e.stolenTadpole = null;
          }
          if (e === this.boss) this.boss = null;
          this.scene.remove(e.group);
          this.enemies.splice(i, 1);
          if (onKill) onKill(e, { id: 'glacier_shatter', name: 'Glacier Shatter', scoreMultiplier: 2.0 });
          continue;
        }

        // 2. Armored Beetle Flip check
        if (e.config.armored && !e.isFlipped) {
          e.isFlipped = true;
          e.flipTimer = e.config.flipDuration || 3.5;
          e.group.rotation.x = Math.PI;
          e.group.position.z = 4;
          sounds.playFlip();
          if (this.particles) {
            this.particles.emitShockwaveSparks(e.group.position.x, e.group.position.y, 25);
          }
          continue;
        }

        // 3. Direct Shockwave Damage (Squashes Gnomes, Wasps, Flipped Beetles)
        e.hp -= damage;
        if (this.particles) {
          this.particles.emitShockwaveSparks(e.group.position.x, e.group.position.y, 30);
        }

        if (e.hp <= 0) {
          sounds.playEnemyDeath();
          if (e.stolenTadpole && tMgr) {
            tMgr.releaseTadpole(e.stolenTadpole);
            e.stolenTadpole = null;
          }
          if (this.particles) {
            this.particles.emitEnemyExplosion(e.group.position.x, e.group.position.y, 18, e.config.colorHex);
          }
          if (e === this.boss) this.boss = null;
          this.scene.remove(e.group);
          this.enemies.splice(i, 1);
          if (onKill) onKill(e, { id: 'shockwave', name: 'Shockwave Stomp', scoreMultiplier: 1.0 });
        } else {
          sounds.playHurt();
          const pushDir = new THREE.Vector2(e.group.position.x - shockX, e.group.position.y - shockY).normalize();
          e.group.position.x += pushDir.x * 45;
          e.group.position.y += pushDir.y * 45;
        }
      }
    }
  }

  update(delta, player, tadpoleManager, onPlayerHit, onKill) {
    this.tadpoleManager = tadpoleManager;
    const time = performance.now() * 0.003;
    const pPos = player.group.position;
    const pondCenter = GAME_CONSTANTS.POND_CENTER;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      if (e.freezeTimer > 0) {
        e.freezeTimer -= delta;
        continue;
      }

      if (e.isFlipped) {
        e.flipTimer -= delta;
        if (e.legsGroup) {
          e.legsGroup.rotation.z = Math.sin(time * 25) * 0.5;
        }
        if (e.flipTimer <= 0) {
          e.isFlipped = false;
          e.group.rotation.x = 0;
          e.group.position.z = 0;
        }
        continue;
      }

      if (e.blindTimer > 0) {
        e.blindTimer -= delta;
        e.group.position.x += Math.sin(time * 5 + e.timeOffset) * e.speed * delta;
        e.group.position.y += Math.cos(time * 5 + e.timeOffset) * e.speed * delta;
        continue;
      }

      if (e.config.id === 'gnome') {
        if (!e.stolenTadpole) {
          const dx = pondCenter.x - e.group.position.x;
          const dy = pondCenter.y - e.group.position.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 35) {
            e.group.position.x += (dx / dist) * e.speed * delta;
            e.group.position.y += (dy / dist) * e.speed * delta;
            e.group.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
          } else {
            tadpoleManager.claimTadpole(e);
          }
        } else {
          const targetEdgeX = Math.sign(e.group.position.x) * GAME_CONSTANTS.ARENA_HALF;
          const targetEdgeY = Math.sign(e.group.position.y) * GAME_CONSTANTS.ARENA_HALF;
          const dx = targetEdgeX - e.group.position.x;
          const dy = targetEdgeY - e.group.position.y;
          const dist = Math.hypot(dx, dy);

          e.group.position.x += (dx / dist) * (e.speed * 1.15) * delta;
          e.group.position.y += (dy / dist) * (e.speed * 1.15) * delta;
          e.group.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;

          // Escapes arena with stolen tadpole
          if (
            Math.abs(e.group.position.x) > GAME_CONSTANTS.ARENA_HALF - 25 ||
            Math.abs(e.group.position.y) > GAME_CONSTANTS.ARENA_HALF - 25
          ) {
            tadpoleManager.loseTadpole(e.stolenTadpole);
            e.stolenTadpole = null;
            this.scene.remove(e.group);
            this.enemies.splice(i, 1);
            continue;
          }
        }
      } else if (e.config.id === 'beetle') {
        const dx = pPos.x - e.group.position.x;
        const dy = pPos.y - e.group.position.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 15) {
          e.group.position.x += (dx / dist) * e.speed * delta;
          e.group.position.y += (dy / dist) * e.speed * delta;
          e.group.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
        }
      } else if (e.config.id === 'wasp') {
        if (e.wingL && e.wingR) {
          e.wingL.rotation.y = Math.sin(time * 35) * 0.8;
          e.wingR.rotation.y = -Math.sin(time * 35) * 0.8;
        }
        const dx = pPos.x - e.group.position.x;
        const dy = pPos.y - e.group.position.y;
        const dist = Math.hypot(dx, dy);

        const wobbleX = Math.sin(time * 6 + e.timeOffset) * 20;
        const wobbleY = Math.cos(time * 6 + e.timeOffset) * 20;

        e.group.position.x += ((dx + wobbleX) / dist) * e.speed * delta;
        e.group.position.y += ((dy + wobbleY) / dist) * e.speed * delta;
        e.group.position.z = 10 + Math.sin(time * 5) * 4;
        e.group.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
      } else if (e.config.id === 'crow') {
        if (!e.isDiving) {
          e.diveTimer -= delta;
          const progress = 1 - Math.max(0, e.diveTimer / e.config.shadowTelegraphTime);
          if (e.shadowMesh) {
            e.shadowMesh.scale.set(1 + progress * 2.5, 1 + progress * 2.5, 1);
          }

          if (e.diveTimer <= 0) {
            e.isDiving = true;
            e.diveTarget = pPos.clone();
          }
        } else {
          const dx = e.diveTarget.x - e.group.position.x;
          const dy = e.diveTarget.y - e.group.position.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 15) {
            e.group.position.x += (dx / dist) * e.speed * delta;
            e.group.position.y += (dy / dist) * e.speed * delta;
            e.group.position.z = THREE.MathUtils.lerp(e.group.position.z, 2, delta * 8);
          } else {
            e.isDiving = false;
            e.diveTimer = e.config.shadowTelegraphTime;
            e.group.position.z = 25;
          }
        }
      } else if (e.config.id === 'boss_mower') {
        if (e.bossStunTimer > 0) {
          e.bossStunTimer -= delta;
          if (this.particles && Math.random() < 0.3) {
            this.particles.emitShockwaveSparks(e.group.position.x, e.group.position.y, 25);
          }
          continue;
        }

        e.bossChargeTimer += delta;
        if (!e.bossIsCharging && e.bossChargeTimer >= 3.0) {
          e.bossIsCharging = true;
          e.bossChargeTimer = 0;
          e.bossChargeDir.set(pPos.x - e.group.position.x, pPos.y - e.group.position.y).normalize();
          e.group.rotation.z = Math.atan2(e.bossChargeDir.y, e.bossChargeDir.x) - Math.PI / 2;
          sounds.playBossRoar();
        } else if (e.bossIsCharging) {
          e.group.position.x += e.bossChargeDir.x * e.config.chargeSpeed * delta;
          e.group.position.y += e.bossChargeDir.y * e.config.chargeSpeed * delta;

          if (
            Math.abs(e.group.position.x) > GAME_CONSTANTS.ARENA_HALF - 30 ||
            Math.abs(e.group.position.y) > GAME_CONSTANTS.ARENA_HALF - 30 ||
            e.bossChargeTimer >= 2.0
          ) {
            e.bossIsCharging = false;
            e.bossChargeTimer = 0;
          }
        }
      }

      const distToPlayer = Math.hypot(pPos.x - e.group.position.x, pPos.y - e.group.position.y);
      if (distToPlayer < 24) {
        onPlayerHit();
      }

      if (e.hp <= 0) {
        if (e.stolenTadpole) {
          tadpoleManager.releaseTadpole(e.stolenTadpole);
        }
        if (this.particles) {
          this.particles.emitEnemyExplosion(e.group.position.x, e.group.position.y, 16, e.config.colorHex);
        }
        this.scene.remove(e.group);
        if (e === this.boss) this.boss = null;
        this.enemies.splice(i, 1);
        if (onKill) onKill(e);
      }
    }
  }

  clearAll() {
    for (const e of this.enemies) {
      this.scene.remove(e.group);
    }
    this.enemies = [];
    this.boss = null;
  }
}
