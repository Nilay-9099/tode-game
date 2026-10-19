// TODE AND THE LAST LILYPAD - Tadpole Defense System
// 5 animated swimming tadpoles in the pond. Enemies attempt to kidnap them!

import * as THREE from 'three';
import { GAME_CONSTANTS } from '../constants.js';
import { eventBus } from '../eventBus.js';
import { sounds } from './Audio.js';

export class TadpoleManager {
  constructor(scene, particles) {
    this.scene = scene;
    this.particles = particles;
    this.pondCenter = GAME_CONSTANTS.POND_CENTER;
    this.pondRadius = GAME_CONSTANTS.POND_RADIUS;
    this.tadpoles = [];
    this.tadpoleCount = GAME_CONSTANTS.INITIAL_TADPOLES;

    this.initTadpoles();
  }

  initTadpoles() {
    // Clear existing
    for (const t of this.tadpoles) {
      this.scene.remove(t.group);
    }
    this.tadpoles = [];

    // Tadpole 3D geometry: Teardrop body + flexible tail
    const bodyGeo = new THREE.SphereGeometry(2.5, 8, 8);
    bodyGeo.scale(1.4, 0.9, 0.7);

    const tailGeo = new THREE.ConeGeometry(0.8, 3.5, 5);
    tailGeo.rotateX(Math.PI / 2);

    const tadpoleMat = new THREE.MeshPhongMaterial({
      color: 0x1b4332,
      emissive: 0x2d6a4f,
      emissiveIntensity: 0.35,
      shininess: 80,
    });

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < this.tadpoleCount; i++) {
      const group = new THREE.Group();

      const body = new THREE.Mesh(bodyGeo, tadpoleMat);
      body.castShadow = true;
      group.add(body);

      const tail = new THREE.Mesh(tailGeo, tadpoleMat);
      tail.position.y = -2.2;
      group.add(tail);

      // Two cute shiny eyes
      const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 6), eyeMat);
      eye1.position.set(1.1, 1.2, 0.9);
      group.add(eye1);

      const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 6), eyeMat);
      eye2.position.set(-1.1, 1.2, 0.9);
      group.add(eye2);

      const angle = (i / this.tadpoleCount) * Math.PI * 2;
      const dist = 12 + Math.random() * (this.pondRadius - 18);
      const x = this.pondCenter.x + Math.cos(angle) * dist;
      const y = this.pondCenter.y + Math.sin(angle) * dist;
      group.position.set(x, y, 0.5);

      this.scene.add(group);

      this.tadpoles.push({
        id: i,
        group,
        tail,
        state: 'swimming', // 'swimming', 'stolen', 'returning', 'lost'
        thief: null,
        angle,
        orbitRadius: dist,
        orbitSpeed: 0.8 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  getSafeCount() {
    return this.tadpoles.filter((t) => t.state === 'swimming' || t.state === 'returning').length;
  }

  getTotalAliveCount() {
    return this.tadpoles.filter((t) => t.state !== 'lost').length;
  }

  claimTadpole(enemy) {
    const available = this.tadpoles.find((t) => t.state === 'swimming');
    if (!available) return null;

    available.state = 'stolen';
    available.thief = enemy;
    enemy.stolenTadpole = available;

    sounds.playTadpoleAlarm();
    eventBus.emit('tadpole:stolen', available, enemy);
    return available;
  }

  releaseTadpole(tadpole) {
    if (!tadpole || tadpole.state !== 'stolen') return;

    tadpole.state = 'returning';
    tadpole.thief = null;

    if (this.particles) {
      this.particles.emitCollectSparkle(
        tadpole.group.position.x,
        tadpole.group.position.y,
        tadpole.group.position.z + 2,
        0x00f5d4
      );
    }

    sounds.playTadpoleSaved();
    eventBus.emit('tadpole:saved', tadpole);
  }

  loseTadpole(tadpole) {
    if (!tadpole || tadpole.state === 'lost') return;

    tadpole.state = 'lost';
    tadpole.group.visible = false;
    tadpole.thief = null;

    eventBus.emit('tadpole:lost', tadpole);

    if (this.getTotalAliveCount() <= 0) {
      eventBus.emit('game:over', 'all_tadpoles_lost');
    }
  }

  restoreOneLostTadpole() {
    const lost = this.tadpoles.find((t) => t.state === 'lost');
    if (!lost) return false;
    lost.state = 'swimming';
    lost.group.visible = true;
    lost.group.position.set(this.pondCenter.x, this.pondCenter.y, 0.4);
    if (this.particles) {
      this.particles.emitCollectSparkle(this.pondCenter.x, this.pondCenter.y, 1, 0x00f5d4);
    }
    sounds.playTadpoleSaved();
    eventBus.emit('tadpole:saved', lost);
    return true;
  }

  update(delta, time) {
    for (const t of this.tadpoles) {
      if (t.state === 'swimming') {
        // Orbit inside pond
        t.angle += delta * t.orbitSpeed;
        const targetX = this.pondCenter.x + Math.cos(t.angle) * t.orbitRadius;
        const targetY = this.pondCenter.y + Math.sin(t.angle) * t.orbitRadius;

        t.group.position.x = THREE.MathUtils.lerp(t.group.position.x, targetX, delta * 3);
        t.group.position.y = THREE.MathUtils.lerp(t.group.position.y, targetY, delta * 3);
        t.group.position.z = 0.5 + Math.sin(time * 3 + t.phase) * 0.4;

        // Face movement direction
        t.group.rotation.z = t.angle + Math.PI / 2;

        // Tail wiggle
        t.tail.rotation.z = Math.sin(time * 12 + t.phase) * 0.45;
      } else if (t.state === 'stolen') {
        if (t.thief && t.thief.group) {
          // Carry on thief's head
          t.group.position.x = t.thief.group.position.x;
          t.group.position.y = t.thief.group.position.y;
          t.group.position.z = 18;
          t.group.rotation.z += delta * 6;
          t.tail.rotation.z = Math.sin(time * 20) * 0.7;

          // Check if thief reached border
          const ex = Math.abs(t.thief.group.position.x);
          const ey = Math.abs(t.thief.group.position.y);
          if (ex >= GAME_CONSTANTS.ARENA_HALF - 15 || ey >= GAME_CONSTANTS.ARENA_HALF - 15) {
            this.loseTadpole(t);
          }
        } else {
          // Thief died without release hook
          this.releaseTadpole(t);
        }
      } else if (t.state === 'returning') {
        // Swim back into the pond quickly
        const dx = this.pondCenter.x - t.group.position.x;
        const dy = this.pondCenter.y - t.group.position.y;
        const dist = Math.hypot(dx, dy);

        if (dist > this.pondRadius * 0.6) {
          t.group.position.x += (dx / dist) * 120 * delta;
          t.group.position.y += (dy / dist) * 120 * delta;
          t.group.position.z = 0.6;
          t.group.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
          t.tail.rotation.z = Math.sin(time * 16) * 0.5;
        } else {
          t.state = 'swimming';
        }
      }
    }
  }

  reset() {
    this.initTadpoles();
  }
}
