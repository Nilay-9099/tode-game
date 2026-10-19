// TODE AND THE LAST LILYPAD - Wave 0 Tutorial Scarecrow Dummy
// Safe practice target in front of Tode to test Flavor Fusion before enemies invade.

import * as THREE from 'three';
import { sounds } from './Audio.js';

export function createTutorialScarecrow(scene) {
  const group = new THREE.Group();
  group.position.set(0, 80, 0);

  const woodMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
  const sackMat = new THREE.MeshLambertMaterial({ color: 0xd4a373 });
  const hatMat = new THREE.MeshLambertMaterial({ color: 0xfaedcd });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

  // Wooden cross post
  const post = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 24, 6), woodMat);
  post.rotation.x = Math.PI / 2;
  post.position.z = 12;
  group.add(post);

  const crossBeam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 18, 6), woodMat);
  crossBeam.rotation.z = Math.PI / 2;
  crossBeam.position.z = 16;
  group.add(crossBeam);

  // Burlap Sack Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(4.5, 8, 8), sackMat);
  head.position.z = 21;
  group.add(head);

  // Straw Hat
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 0.8, 12), hatMat);
  hatBrim.rotation.x = Math.PI / 2;
  hatBrim.position.z = 24.5;
  group.add(hatBrim);

  const hatCrown = new THREE.Mesh(new THREE.ConeGeometry(4, 5, 8), hatMat);
  hatCrown.rotation.x = Math.PI / 2;
  hatCrown.position.z = 27;
  group.add(hatCrown);

  // Button eyes
  const eyeL = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.4, 6), eyeMat);
  eyeL.position.set(-1.8, -4.2, 21);
  group.add(eyeL);

  const eyeR = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.4, 6), eyeMat);
  eyeR.position.set(1.8, -4.2, 21);
  group.add(eyeR);

  // Shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(10, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false })
  );
  shadow.position.z = 0.22;
  group.add(shadow);

  scene.add(group);

  return {
    group,
    hp: 3,
    maxHp: 3,
    radius: 16,
    isDummy: true,
    wiggleTimer: 0,

    takeHit(damage = 1, particles) {
      this.hp -= damage;
      sounds.playHurt();
      this.wiggleTimer = 0.3;

      if (particles) {
        particles.emitShockwaveSparks(this.group.position.x, this.group.position.y, 20);
      }

      if (this.hp <= 0) {
        sounds.playEnemyDeath();
        if (particles) {
          particles.emitEnemyExplosion(this.group.position.x, this.group.position.y, 25, 0xd4a373);
        }
        scene.remove(this.group);
        return true;
      }
      return false;
    },

    update(delta) {
      if (this.wiggleTimer > 0) {
        this.wiggleTimer -= delta;
        this.group.rotation.z = Math.sin(this.wiggleTimer * 30) * 0.15;
      } else {
        this.group.rotation.z = 0;
      }
    },

    destroy() {
      scene.remove(this.group);
    },
  };
}
