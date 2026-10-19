import * as THREE from 'three';
import { sounds } from './Audio.js';

export const POWER_UP_TYPES = {
  SHIELD: {
    id: 'shield',
    name: 'Energy Shield',
    color: 0x00b4d8,
    icon: '🛡️',
    geometry: new THREE.SphereGeometry(6, 12, 12),
  },
  SPEED: {
    id: 'speed',
    name: 'Speed Surge',
    color: 0xffd166,
    icon: '⚡',
    geometry: new THREE.OctahedronGeometry(6),
  },
  FREEZE: {
    id: 'freeze',
    name: 'Frost Freeze',
    color: 0x48cae4,
    icon: '❄️',
    geometry: new THREE.IcosahedronGeometry(6),
  },
  BOMB: {
    id: 'bomb',
    name: 'Mega Bomb',
    color: 0xef476f,
    icon: '💣',
    geometry: new THREE.DodecahedronGeometry(6),
  },
  HEAL: {
    id: 'heal',
    name: 'Health Heart',
    color: 0x06d6a0,
    icon: '💖',
    geometry: new THREE.TorusGeometry(4.5, 2, 8, 16),
  },
};

export class PowerUpManager {
  constructor(scene, particles) {
    this.scene = scene;
    this.particles = particles;
    this.items = [];
    this.spawnTimer = 0;
    this.spawnInterval = 10;
    this.maxActive = 4;

    this.shieldActive = false;
    this.speedTimer = 0;
    this.freezeTimer = 0;
  }

  spawnRandom(mapBounds = 320) {
    if (this.items.length >= this.maxActive) return;

    const typeKeys = Object.keys(POWER_UP_TYPES);
    const chosenType = POWER_UP_TYPES[typeKeys[Math.floor(Math.random() * typeKeys.length)]];

    const group = new THREE.Group();

    const mat = new THREE.MeshPhongMaterial({
      color: chosenType.color,
      emissive: chosenType.color,
      emissiveIntensity: 0.45,
      shininess: 90,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(chosenType.geometry, mat);
    mesh.castShadow = true;
    group.add(mesh);

    const ringGeo = new THREE.RingGeometry(5, 7, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: chosenType.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.z = 0.3;
    group.add(ring);

    const step = 40;
    const x = (Math.floor(Math.random() * (mapBounds * 2 / step)) - (mapBounds / step)) * step;
    const y = (Math.floor(Math.random() * (mapBounds * 2 / step)) - (mapBounds / step)) * step;
    group.position.set(x, y, 10);

    this.scene.add(group);

    this.items.push({
      type: chosenType,
      group,
      mesh,
      ring,
      baseZ: 10,
      timeOffset: Math.random() * 10,
    });
  }

  collectItem(index, player, onCollect) {
    const item = this.items[index];
    sounds.playPowerUp();
    if (this.particles) {
      this.particles.emitCollectSparkle(
        item.group.position.x,
        item.group.position.y,
        item.group.position.z + 5,
        item.type.color
      );
    }

    this.applyBuff(item.type, player);
    player.addUltEnergy(20); // Collectible charges +20 Ult energy

    if (onCollect) onCollect(item.type);

    this.scene.remove(item.group);
    this.items.splice(index, 1);
  }

  update(delta, player, onCollect) {
    if (this.speedTimer > 0) {
      this.speedTimer = Math.max(0, this.speedTimer - delta);
    }
    if (this.freezeTimer > 0) {
      this.freezeTimer = Math.max(0, this.freezeTimer - delta);
    }

    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnRandom();
    }

    const playerPos = player.group.position;
    const time = performance.now() * 0.003;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];

      item.mesh.rotation.y += delta * 2.5;
      item.mesh.rotation.x += delta * 1.5;
      item.mesh.position.z = Math.sin(time + item.timeOffset) * 3;

      const ringScale = 1 + Math.sin(time * 3 + item.timeOffset) * 0.15;
      item.ring.scale.set(ringScale, ringScale, 1);

      const dist = Math.hypot(
        playerPos.x - item.group.position.x,
        playerPos.y - item.group.position.y
      );

      if (dist < 26) {
        this.collectItem(i, player, onCollect);
      }
    }
  }

  applyBuff(type, player) {
    if (type.id === 'shield') {
      this.shieldActive = true;
    } else if (type.id === 'speed') {
      this.speedTimer = 8.0;
    } else if (type.id === 'freeze') {
      this.freezeTimer = 4.5;
    } else if (type.id === 'heal') {
      if (player.hp < player.maxHp) {
        player.hp++;
      }
    }
  }

  clear() {
    for (const item of this.items) {
      this.scene.remove(item.group);
    }
    this.items.length = 0;
    this.shieldActive = false;
    this.speedTimer = 0;
    this.freezeTimer = 0;
    this.spawnTimer = 0;
  }
}
