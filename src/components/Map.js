// TODE AND THE LAST LILYPAD - Arena Map & World Environment
// Anti-moiré procedural grass with anisotropic filtering, stone arena rim, instanced grass tufts, flowers, rocks, and pond.

import * as THREE from 'three';
import { GAME_CONSTANTS } from '../constants.js';

// Procedural soft organic grass texture
function createGrassTexture(renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base lush garden green
  ctx.fillStyle = '#2d6a4f';
  ctx.fillRect(0, 0, 512, 512);

  // Organic soft mottling and grass flecks
  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radius = 1 + Math.random() * 2.5;
    const shade = Math.random();
    if (shade < 0.4) {
      ctx.fillStyle = '#40916c';
    } else if (shade < 0.7) {
      ctx.fillStyle = '#52b788';
    } else if (shade < 0.9) {
      ctx.fillStyle = '#1b4332';
    } else {
      ctx.fillStyle = '#74c69d';
    }
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(14, 14);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;

  if (renderer && renderer.capabilities) {
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }

  return texture;
}

export function createMap(renderer) {
  const mapGroup = new THREE.Group();
  const arenaSize = GAME_CONSTANTS.ARENA_SIZE;
  const half = GAME_CONSTANTS.ARENA_HALF;

  // 1. Soft Grass Ground Plane (Zero moiré, anisotropic filtered)
  const grassTexture = createGrassTexture(renderer);
  const groundGeo = new THREE.PlaneGeometry(arenaSize, arenaSize);
  const groundMat = new THREE.MeshLambertMaterial({
    map: grassTexture,
    roughness: 0.85,
  });

  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  ground.position.z = 0;
  mapGroup.add(ground);

  // 2. Stone Arena Border Rim (Encloses the arena so it doesn't float into the void)
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0x5c677d });
  const rimBlockGeo = new THREE.BoxGeometry(38, 12, 8);
  const rimBlockGeoAlt = new THREE.BoxGeometry(12, 38, 8);

  for (let x = -half; x <= half; x += 38) {
    // Top & Bottom walls
    const topStone = new THREE.Mesh(rimBlockGeo, stoneMat);
    topStone.position.set(x, half, 4);
    topStone.castShadow = true;
    topStone.receiveShadow = true;
    mapGroup.add(topStone);

    const btmStone = new THREE.Mesh(rimBlockGeo, stoneMat);
    btmStone.position.set(x, -half, 4);
    btmStone.castShadow = true;
    btmStone.receiveShadow = true;
    mapGroup.add(btmStone);
  }

  for (let y = -half + 38; y < half; y += 38) {
    // Left & Right walls
    const leftStone = new THREE.Mesh(rimBlockGeoAlt, stoneMat);
    leftStone.position.set(-half, y, 4);
    leftStone.castShadow = true;
    leftStone.receiveShadow = true;
    mapGroup.add(leftStone);

    const rightStone = new THREE.Mesh(rimBlockGeoAlt, stoneMat);
    rightStone.position.set(half, y, 4);
    rightStone.castShadow = true;
    rightStone.receiveShadow = true;
    mapGroup.add(rightStone);
  }

  // 3. The Sacred Lily Pond at (-200, 200)
  const pondCenter = GAME_CONSTANTS.POND_CENTER;
  const pondRadius = GAME_CONSTANTS.POND_RADIUS;

  const pondGroup = new THREE.Group();
  pondGroup.position.set(pondCenter.x, pondCenter.y, 0.15);

  // Shimmering Water surface
  const waterGeo = new THREE.CircleGeometry(pondRadius, 32);
  const waterMat = new THREE.MeshPhongMaterial({
    color: 0x0077b6,
    emissive: 0x023e8a,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.88,
    shininess: 120,
  });
  const waterDisc = new THREE.Mesh(waterGeo, waterMat);
  pondGroup.add(waterDisc);

  // Pond stone rim
  const stoneRimMat = new THREE.MeshLambertMaterial({ color: 0x6c757d });
  const stoneCount = 18;
  for (let i = 0; i < stoneCount; i++) {
    const angle = (i / stoneCount) * Math.PI * 2;
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(5 + (i % 3) * 1.5),
      stoneRimMat
    );
    stone.position.set(
      Math.cos(angle) * (pondRadius + 2),
      Math.sin(angle) * (pondRadius + 2),
      2.5
    );
    stone.castShadow = true;
    pondGroup.add(stone);
  }

  // Lily pads
  const lilyPadMat = new THREE.MeshLambertMaterial({ color: 0x52b788 });
  const padPositions = [
    { x: -18, y: 14, r: 8 },
    { x: 16, y: -20, r: 7 },
    { x: 22, y: 15, r: 9 },
    { x: -10, y: -24, r: 6.5 },
  ];
  for (const p of padPositions) {
    const pad = new THREE.Mesh(new THREE.CircleGeometry(p.r, 16), lilyPadMat);
    pad.position.set(p.x, p.y, 0.35);
    pondGroup.add(pad);
  }

  mapGroup.add(pondGroup);

  // 4. Instanced Grass Tufts & Flowers across the arena
  const tuftCount = 180;
  const bladeGeo = new THREE.ConeGeometry(0.8, 5, 4);
  bladeGeo.rotateX(Math.PI / 2);
  const tuftMat = new THREE.MeshLambertMaterial({ color: 0x74c69d });
  const tuftMesh = new THREE.InstancedMesh(bladeGeo, tuftMat, tuftCount);

  const dummy = new THREE.Object3D();
  for (let i = 0; i < tuftCount; i++) {
    const gx = (Math.random() - 0.5) * (arenaSize - 80);
    const gy = (Math.random() - 0.5) * (arenaSize - 80);
    // Don't place inside pond
    if (Math.hypot(gx - pondCenter.x, gy - pondCenter.y) < pondRadius + 15) continue;

    dummy.position.set(gx, gy, 2.5);
    dummy.scale.set(1 + Math.random() * 0.5, 1 + Math.random() * 0.5, 1 + Math.random() * 0.8);
    dummy.rotation.z = Math.random() * Math.PI * 2;
    dummy.updateMatrix();
    tuftMesh.setMatrixAt(i, dummy.matrix);
  }
  tuftMesh.castShadow = false;
  tuftMesh.receiveShadow = true;
  mapGroup.add(tuftMesh);

  // Flowers
  const flowerColors = [0xff4d6d, 0xffd166, 0x00f5d4, 0xffffff];
  const flowerGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.6, 6);
  flowerGeo.rotateX(Math.PI / 2);

  for (let i = 0; i < 45; i++) {
    const fMat = new THREE.MeshLambertMaterial({
      color: flowerColors[i % flowerColors.length],
    });
    const flower = new THREE.Mesh(flowerGeo, fMat);
    const fx = (Math.random() - 0.5) * (arenaSize - 90);
    const fy = (Math.random() - 0.5) * (arenaSize - 90);
    if (Math.hypot(fx - pondCenter.x, fy - pondCenter.y) < pondRadius + 15) continue;

    flower.position.set(fx, fy, 0.4);
    mapGroup.add(flower);
  }

  // Mushrooms
  const stemMat = new THREE.MeshLambertMaterial({ color: 0xf1faee });
  const capMat = new THREE.MeshLambertMaterial({ color: 0xe63946 });
  for (let i = 0; i < 20; i++) {
    const shroom = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 3, 6), stemMat);
    stem.rotation.x = Math.PI / 2;
    stem.position.z = 1.5;
    shroom.add(stem);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 8), capMat);
    cap.scale.set(1, 1, 0.5);
    cap.position.z = 3.2;
    shroom.add(cap);

    const mx = (Math.random() - 0.5) * (arenaSize - 100);
    const my = (Math.random() - 0.5) * (arenaSize - 100);
    shroom.position.set(mx, my, 0);
    mapGroup.add(shroom);
  }

  return {
    group: mapGroup,
    waterDisc,
    pondCenter,
    pondRadius,
    update(time) {
      waterDisc.rotation.z = Math.sin(time * 0.4) * 0.04;
    },
  };
}
