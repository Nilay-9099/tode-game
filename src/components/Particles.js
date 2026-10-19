// TODE AND THE LAST LILYPAD - High-Performance Particle Engine
// Reusable shared geometries and materials with zero buffer destruction or memory leaks.

import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];

    // Shared geometries - NEVER DISPOSE DURING RUNTIME
    this.cubeGeo = new THREE.BoxGeometry(2.5, 2.5, 2.5);
    this.largeCubeGeo = new THREE.BoxGeometry(4.5, 4.5, 4.5);
    this.sparkGeo = new THREE.SphereGeometry(1.2, 4, 4);

    // Shared cached materials
    this.sparkMats = new Map();
    this.cubeMats = new Map();

    this.yellowMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    this.orangeMat = new THREE.MeshBasicMaterial({ color: 0xff7b00 });
    this.redMat = new THREE.MeshBasicMaterial({ color: 0xd90429 });
    this.whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  }

  getSparkMat(color) {
    if (!this.sparkMats.has(color)) {
      this.sparkMats.set(color, new THREE.MeshBasicMaterial({ color }));
    }
    return this.sparkMats.get(color);
  }

  getCubeMat(color) {
    if (!this.cubeMats.has(color)) {
      this.cubeMats.set(color, new THREE.MeshLambertMaterial({ color }));
    }
    return this.cubeMats.get(color);
  }

  // Jump landing dust puff
  emitJumpDust(x, y) {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 15 + Math.random() * 20;
      const mesh = new THREE.Mesh(this.sparkGeo, this.whiteMat);
      mesh.position.set(x + (Math.random() - 0.5) * 6, y + (Math.random() - 0.5) * 6, 1);
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 10 + Math.random() * 15,
        life: 0.3,
        maxLife: 0.3,
        gravity: -60,
      });
    }
  }

  // Attack shockwave burst
  emitShockwaveSparks(x, y, radius = 75) {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const speed = radius * 2.2 + Math.random() * 30;
      const mat = i % 2 === 0 ? this.yellowMat : this.orangeMat;
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.set(x, y, 1.5);
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 15 + Math.random() * 20,
        life: 0.35,
        maxLife: 0.35,
        gravity: -50,
        drag: 0.92,
      });
    }
  }

  // Giant Meteor Slam shockwave
  emitMeteorSlam(x, y, radius = 160) {
    const count = 35;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = radius * 1.8 + Math.random() * 50;
      const mat = i % 2 === 0 ? this.redMat : this.orangeMat;
      const mesh = new THREE.Mesh(this.largeCubeGeo, mat);
      mesh.position.set(x, y, 2);
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 50 + Math.random() * 60,
        rx: (Math.random() - 0.5) * 15,
        ry: (Math.random() - 0.5) * 15,
        life: 0.65,
        maxLife: 0.65,
        gravity: -160,
        drag: 0.94,
      });
    }
  }

  // Enemy death explosion
  emitEnemyExplosion(x, y, z = 10, colorHex = 0x9b5de5) {
    const count = 12;
    const mat = this.getCubeMat(colorHex);
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.cubeGeo, mat);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 35 + Math.random() * 45,
        rx: (Math.random() - 0.5) * 12,
        ry: (Math.random() - 0.5) * 12,
        life: 0.5,
        maxLife: 0.5,
        gravity: -140,
        drag: 0.96,
      });
    }
  }

  // Powerup / Bug collection sparkle
  emitCollectSparkle(x, y, z = 10, color = 0x00f5d4) {
    const count = 10;
    const mat = this.getSparkMat(color);
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);

      const angle = (i / count) * Math.PI * 2;
      const speed = 25 + Math.random() * 25;
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 25 + Math.random() * 25,
        life: 0.4,
        maxLife: 0.4,
        gravity: -40,
      });
    }
  }

  update(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        // DO NOT DISPOSE SHARED GEOMETRIES OR MATERIALS
        this.particles.splice(i, 1);
        continue;
      }

      if (p.drag) {
        p.vx *= p.drag;
        p.vy *= p.drag;
      }

      p.vz += (p.gravity || 0) * delta;
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;

      if (p.rx) p.mesh.rotation.x += p.rx * delta;
      if (p.ry) p.mesh.rotation.y += p.ry * delta;

      const scale = Math.max(0.01, p.life / p.maxLife);
      p.mesh.scale.set(scale, scale, scale);
    }
  }

  clear() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
    }
    this.particles = [];
  }
}
