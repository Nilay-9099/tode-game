// TODE AND THE LAST LILYPAD - Optimized Flavor Bugs Engine
// Pre-created materials and geometries to eliminate runtime allocation and shader compile freezes.

import * as THREE from 'three';
import { FLAVOR_BUGS, DAY_PHASES } from '../constants.js';
import { eventBus } from '../eventBus.js';
import { sounds } from './Audio.js';

export class BugManager {
  constructor(scene, particles) {
    this.scene = scene;
    this.particles = particles;
    this.bugs = [];
    this.spawnTimer = 0;
    this.spawnInterval = 3.5;
    this.maxActive = 8;
    this.currentPhaseKey = 'MORNING';
    this.rng = Math.random;

    this.initSharedResources();
  }

  setRng(fn) {
    this.rng = fn || Math.random;
  }

  initSharedResources() {
    // Shared geometries
    this.flyGeo = new THREE.DodecahedronGeometry(4.5);
    this.wingGeo = new THREE.PlaneGeometry(3.5, 6);
    this.wingGeo.rotateX(Math.PI / 2);
    this.ringGeo = new THREE.RingGeometry(4.5, 6.5, 16);

    // Shared materials by bug id
    this.wingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });

    this.bodyMats = {
      ember: new THREE.MeshPhongMaterial({ color: 0xff5400, emissive: 0xff3700, emissiveIntensity: 0.7, shininess: 100 }),
      frost: new THREE.MeshPhongMaterial({ color: 0x00f5d4, emissive: 0x00b4d8, emissiveIntensity: 0.7, shininess: 100 }),
      spark: new THREE.MeshPhongMaterial({ color: 0xfee440, emissive: 0xffb703, emissiveIntensity: 0.7, shininess: 100 }),
      crumb: new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xcccccc, emissiveIntensity: 0.5, shininess: 80 }),
    };

    this.ringMats = {
      ember: new THREE.MeshBasicMaterial({ color: 0xff5400, side: THREE.DoubleSide, transparent: true, opacity: 0.45, depthWrite: false }),
      frost: new THREE.MeshBasicMaterial({ color: 0x00f5d4, side: THREE.DoubleSide, transparent: true, opacity: 0.45, depthWrite: false }),
      spark: new THREE.MeshBasicMaterial({ color: 0xfee440, side: THREE.DoubleSide, transparent: true, opacity: 0.45, depthWrite: false }),
      crumb: new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.35, depthWrite: false }),
    };
  }

  setPhase(phaseKey) {
    this.currentPhaseKey = phaseKey;
  }

  spawnRandom(bounds = 320) {
    if (this.bugs.length >= this.maxActive) return;

    const phase = DAY_PHASES[this.currentPhaseKey] || DAY_PHASES.MORNING;
    const weights = phase.bugWeights || { ember: 0.33, frost: 0.33, spark: 0.34 };

    const r = this.rng();
    let chosenBug = FLAVOR_BUGS.EMBER;
    if (r < weights.ember) {
      chosenBug = FLAVOR_BUGS.EMBER;
    } else if (r < weights.ember + weights.frost) {
      chosenBug = FLAVOR_BUGS.FROST;
    } else {
      chosenBug = FLAVOR_BUGS.SPARK;
    }

    if (this.rng() < 0.15) {
      chosenBug = FLAVOR_BUGS.CRUMB;
    }

    const group = new THREE.Group();

    // Reusing pre-created materials
    const bodyMat = this.bodyMats[chosenBug.id] || this.bodyMats.crumb;
    const body = new THREE.Mesh(this.flyGeo, bodyMat);
    body.castShadow = true;
    group.add(body);

    const leftWing = new THREE.Mesh(this.wingGeo, this.wingMat);
    leftWing.position.set(-3.5, 0, 2);
    group.add(leftWing);

    const rightWing = new THREE.Mesh(this.wingGeo, this.wingMat);
    rightWing.position.set(3.5, 0, 2);
    group.add(rightWing);

    const ringMat = this.ringMats[chosenBug.id] || this.ringMats.crumb;
    const groundRing = new THREE.Mesh(this.ringGeo, ringMat);
    groundRing.position.z = 0.25;
    group.add(groundRing);

    const step = 40;
    const x = (Math.floor(this.rng() * (bounds * 2 / step)) - (bounds / step)) * step;
    const y = (Math.floor(this.rng() * (bounds * 2 / step)) - (bounds / step)) * step;
    group.position.set(x, y, 7);

    this.scene.add(group);

    this.bugs.push({
      config: chosenBug,
      group,
      body,
      leftWing,
      rightWing,
      groundRing,
      baseZ: 7,
      timeOffset: this.rng() * 10,
    });
  }

  collect(index, player, stomach) {
    const bug = this.bugs[index];
    if (!bug) return;

    if (this.particles) {
      this.particles.emitCollectSparkle(
        bug.group.position.x,
        bug.group.position.y,
        bug.group.position.z,
        bug.config.colorHex
      );
    }

    if (bug.config.element !== 'plain') {
      stomach.addBug(bug.config);
      player.addUltEnergy(6);
    } else {
      sounds.playPowerUp();
      player.addUltEnergy(4);
    }

    eventBus.emit('bug:snatched', bug.config);

    this.scene.remove(bug.group);
    this.bugs.splice(index, 1);
  }

  update(delta, player, stomach) {
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnRandom();
    }

    const time = performance.now() * 0.003;
    const pPos = player.group.position;

    for (let i = this.bugs.length - 1; i >= 0; i--) {
      const b = this.bugs[i];

      // If the bug is currently hooked and being reeled by the tongue,
      // let the tongue handle movement and clean collection upon reaching Tode's mouth.
      if (b.isBeingPulled) {
        continue;
      }

      b.group.position.z = b.baseZ + Math.sin(time * 3 + b.timeOffset) * 2.5;
      b.leftWing.rotation.y = Math.sin(time * 24 + b.timeOffset) * 0.7;
      b.rightWing.rotation.y = -Math.sin(time * 24 + b.timeOffset) * 0.7;
      b.body.rotation.z += delta * 1.5;

      const dist = Math.hypot(pPos.x - b.group.position.x, pPos.y - b.group.position.y);
      if (dist < 26) {
        this.collect(i, player, stomach);
      }
    }
  }

  clear() {
    for (const b of this.bugs) {
      this.scene.remove(b.group);
    }
    this.bugs = [];
    this.spawnTimer = 0;
  }
}
