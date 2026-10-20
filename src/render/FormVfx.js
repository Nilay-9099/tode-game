// TODE AND THE LAST LILYPAD - Form & Feast VFX (v3 Spec Section 7.4)
// Screen edge tints, feast countdown ground rings, and recipe strip glow effects.

import * as THREE from 'three';
import { eventBus, V3_EVENTS } from '../eventBus.js';
import recipesData from '../data/recipes.json';

export class FormVfx {
  constructor(scene) {
    this.scene = scene;

    // 1. Feast Screen Edge Tint
    this.screenTint = document.createElement('div');
    this.screenTint.id = 'feastScreenTint';
    this.screenTint.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 500;
      opacity: 0;
      transition: opacity 0.5s ease-out;
      box-shadow: inset 0 0 100px 30px rgba(255, 84, 0, 0.4);
    `;
    document.body.appendChild(this.screenTint);

    // 2. Ground Countdown Ring
    const ringGeo = new THREE.RingGeometry(22, 25, 32);
    ringGeo.rotateX(-Math.PI / 2);
    this.ringMat = new THREE.MeshBasicMaterial({
      color: 0xff5400,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.ringMesh = new THREE.Mesh(ringGeo, this.ringMat);
    this.ringMesh.position.z = 0.28;
    this.scene.add(this.ringMesh);

    this.activeFeastId = null;
    this.totalDuration = 18;
    this.initListeners();
  }

  initListeners() {
    eventBus.on(V3_EVENTS.FEAST_STARTED, (recipeId, duration) => {
      this.onFeastStarted(recipeId, duration);
    });

    eventBus.on(V3_EVENTS.FEAST_TICK, (recipeId, remaining) => {
      this.onFeastTick(remaining);
    });

    eventBus.on(V3_EVENTS.FEAST_ENDED, () => {
      this.onFeastEnded();
    });
  }

  onFeastStarted(recipeId, duration) {
    this.activeFeastId = recipeId;
    this.totalDuration = duration || 18;

    const colors = {
      bonfire: 'rgba(255, 84, 0, 0.45)',
      coldsnap: 'rgba(0, 245, 212, 0.45)',
      thunder: 'rgba(254, 228, 64, 0.45)',
      sauna: 'rgba(244, 241, 222, 0.4)',
      slush: 'rgba(162, 210, 255, 0.45)',
      fireworks: 'rgba(247, 37, 133, 0.45)',
      rainbow: 'rgba(114, 9, 183, 0.45)',
      banquet: 'rgba(255, 215, 0, 0.55)',
    };

    const ringColors = {
      bonfire: 0xff5400,
      coldsnap: 0x00f5d4,
      thunder: 0xfee440,
      sauna: 0x94d2bd,
      slush: 0xa2d2ff,
      fireworks: 0xf72585,
      rainbow: 0x7209b7,
      banquet: 0xffd700,
    };

    const tintColor = colors[recipeId] || colors.bonfire;
    this.screenTint.style.boxShadow = `inset 0 0 110px 35px ${tintColor}`;
    this.screenTint.style.opacity = '1';

    this.ringMat.color.setHex(ringColors[recipeId] || 0xff5400);
    this.ringMat.opacity = 0.85;
  }

  onFeastTick(remaining) {
    if (this.totalDuration > 0) {
      const pct = Math.max(0, remaining / this.totalDuration);
      this.ringMat.opacity = 0.4 + pct * 0.45;
    }
  }

  onFeastEnded() {
    this.activeFeastId = null;
    this.screenTint.style.opacity = '0';
    this.ringMat.opacity = 0;
  }

  update(playerPos) {
    if (this.ringMat.opacity > 0 && playerPos) {
      this.ringMesh.position.set(playerPos.x, playerPos.y, 0.28);
      this.ringMesh.rotation.z += 0.02;
    }
  }
}
