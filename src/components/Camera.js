// TODE AND THE LAST LILYPAD - Dynamic Tightened Camera Engine
// Smooth follow lerp, trauma-based decaying screen shake, and slam FOV kick.

import * as THREE from 'three';
import { GAME_CONSTANTS } from '../constants.js';

export class GameCamera {
  constructor() {
    const aspect = window.innerWidth / window.innerHeight;
    this.baseFov = GAME_CONSTANTS.CAMERA_FOV;
    this.targetFov = this.baseFov;

    this.camera = new THREE.PerspectiveCamera(this.baseFov, aspect, 0.1, 9000);
    this.camera.up.set(0, 0, 1);

    this.offset = new THREE.Vector3(
      GAME_CONSTANTS.CAMERA_OFFSET.x,
      GAME_CONSTANTS.CAMERA_OFFSET.y,
      GAME_CONSTANTS.CAMERA_OFFSET.z
    );

    this.trauma = 0;
    this.currentLookAt = new THREE.Vector3(0, 0, 0);

    this.camera.position.copy(this.offset);
    this.camera.lookAt(this.currentLookAt);
  }

  addTrauma(amount) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  kickFov(targetFov = GAME_CONSTANTS.CAMERA_SLAM_FOV_KICK) {
    this.targetFov = targetFov;
  }

  update(delta, playerPosition) {
    // 1. Smoothly follow player
    const desiredPos = new THREE.Vector3(
      playerPosition.x + this.offset.x,
      playerPosition.y + this.offset.y,
      this.offset.z
    );

    // 2. Screen Shake with Decaying Trauma squared
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - delta * GAME_CONSTANTS.TRAUMA_DECAY);
      const shake = this.trauma * this.trauma * 14;
      desiredPos.x += (Math.random() - 0.5) * shake;
      desiredPos.y += (Math.random() - 0.5) * shake;
    }

    const lerpRate = Math.min(1.0, delta * GAME_CONSTANTS.CAMERA_LERP_SPEED);
    this.camera.position.lerp(desiredPos, lerpRate);

    // Smooth LookAt player position
    this.currentLookAt.lerp(
      new THREE.Vector3(playerPosition.x, playerPosition.y, 6),
      lerpRate
    );
    this.camera.lookAt(this.currentLookAt);

    // 3. FOV Kick Recovery
    if (Math.abs(this.camera.fov - this.targetFov) > 0.1) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFov, delta * 8);
      this.camera.updateProjectionMatrix();
    } else if (this.targetFov !== this.baseFov) {
      this.targetFov = this.baseFov;
    }
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}

export function createCamera() {
  return new GameCamera();
}
