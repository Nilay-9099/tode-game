// TODE AND THE LAST LILYPAD - Atmosphere & Time-of-Day Engine
// Smooth 3-second lerping between Morning, Noon, Dusk, Night, and Boss Arena.

import * as THREE from 'three';
import { DAY_PHASES } from '../constants.js';
import { eventBus } from '../eventBus.js';
import { sounds } from './Audio.js';

export class AtmosphereManager {
  constructor(scene, ambientLight, dirLight) {
    this.scene = scene;
    this.ambientLight = ambientLight;
    this.dirLight = dirLight;
    this.currentPhaseKey = 'MORNING';

    const initial = DAY_PHASES.MORNING;
    this.targetSky = new THREE.Color(initial.skyColor);
    this.targetAmbient = new THREE.Color(initial.ambientColor);
    this.targetSun = new THREE.Color(initial.sunColor);
    this.targetSunIntensity = initial.sunIntensity;
    this.targetAmbientIntensity = initial.ambientIntensity;
    this.targetFogDensity = initial.fogDensity;

    // Bioluminescent ambient fireflies / pollen (Single InstancedMesh: 1 draw call)
    this.fireflyCount = 45;
    const fireflyGeo = new THREE.SphereGeometry(1.2, 4, 4);
    const fireflyMat = new THREE.MeshBasicMaterial({
      color: 0xfee440,
      transparent: true,
      opacity: 0.85,
    });

    this.fireflyInstanced = new THREE.InstancedMesh(fireflyGeo, fireflyMat, this.fireflyCount);
    this.fireflyInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.dummy = new THREE.Object3D();

    this.fireflies = [];

    for (let i = 0; i < this.fireflyCount; i++) {
      const x = (Math.random() - 0.5) * 720;
      const y = (Math.random() - 0.5) * 720;
      const z = 8 + Math.random() * 45;

      this.fireflies.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        speedX: 0.3 + Math.random() * 0.7,
        speedY: 0.3 + Math.random() * 0.7,
        speedZ: 0.5 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
      });
    }

    this.scene.add(this.fireflyInstanced);
  }

  setPhaseForWave(wave, explicitPhaseKey = null) {
    let phaseKey = explicitPhaseKey;
    if (!phaseKey) {
      if (wave === 0) {
        phaseKey = 'MORNING';
      } else if (wave % 5 === 0) {
        phaseKey = 'BOSS_ARENA';
      } else {
        const cycle = ((wave - 1) % 4);
        if (cycle === 0) phaseKey = 'MORNING';
        else if (cycle === 1) phaseKey = 'NOON';
        else if (cycle === 2) phaseKey = 'DUSK';
        else if (cycle === 3) phaseKey = 'NIGHT';
      }
    }

    this.currentPhaseKey = phaseKey;
    const config = DAY_PHASES[phaseKey] || DAY_PHASES.MORNING;

    this.targetSky.setHex(config.skyColor);
    this.targetAmbient.setHex(config.ambientColor);
    this.targetSun.setHex(config.sunColor);
    this.targetSunIntensity = config.sunIntensity;
    this.targetAmbientIntensity = config.ambientIntensity;
    this.targetFogDensity = config.fogDensity;

    sounds.setPhase(config.id);
    eventBus.emit('phase:changed', phaseKey, config);

    return config;
  }

  update(delta) {
    const lerpSpeed = delta * 1.6;

    // Smooth color & intensity blending
    this.scene.background.lerp(this.targetSky, lerpSpeed);
    if (this.scene.fog) {
      this.scene.fog.color.lerp(this.targetSky, lerpSpeed);
      this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, this.targetFogDensity, lerpSpeed);
    }
    this.ambientLight.color.lerp(this.targetAmbient, lerpSpeed);
    this.ambientLight.intensity = THREE.MathUtils.lerp(
      this.ambientLight.intensity,
      this.targetAmbientIntensity,
      lerpSpeed
    );

    this.dirLight.color.lerp(this.targetSun, lerpSpeed);
    this.dirLight.intensity = THREE.MathUtils.lerp(
      this.dirLight.intensity,
      this.targetSunIntensity,
      lerpSpeed
    );

    // Animate Fireflies / Pollen (Single InstancedMesh)
    const time = performance.now() * 0.0015;
    for (let i = 0; i < this.fireflies.length; i++) {
      const f = this.fireflies[i];
      const x = f.baseX + Math.sin(time * f.speedX + f.phase) * 25;
      const y = f.baseY + Math.cos(time * f.speedY + f.phase) * 25;
      const z = f.baseZ + Math.sin(time * f.speedZ + f.phase) * 14;
      const pulse = 0.5 + Math.sin(time * 3 + f.phase) * 0.5;

      this.dummy.position.set(x, y, z);
      this.dummy.scale.set(pulse, pulse, pulse);
      this.dummy.updateMatrix();
      this.fireflyInstanced.setMatrixAt(i, this.dummy.matrix);
    }
    this.fireflyInstanced.instanceMatrix.needsUpdate = true;
  }
}
