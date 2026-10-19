import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export async function createHouses(count = 3, mapBounds = 340) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync('/models/small_house.glb');
  const templateModel = gltf.scene;

  // Scale: 65 as specified
  templateModel.scale.setScalar(65);

  // Rotate Math.PI / 2 around X-axis to align with Z-up coordinate system
  templateModel.rotation.x = Math.PI / 2;

  // Calculate bounding box so house sits exactly on ground level (Z = 0)
  templateModel.updateMatrixWorld(true);
  const rawBox = new THREE.Box3().setFromObject(templateModel);
  templateModel.position.z = -rawBox.min.z;

  const houseGroups = [];
  const houseBoxes = [];

  const chosenPositions = [];
  const corners = [
    { x: -350, y: -350 },
    { x: 350, y: -350 },
    { x: -350, y: 350 },
    { x: 350, y: 350 },
  ];

  for (let i = 0; i < count; i++) {
    let x = 0;
    let y = 0;
    let valid = false;
    let attempts = 0;

    while (!valid && attempts < 100) {
      attempts++;
      const step = 40;
      const minStep = -Math.floor(mapBounds / step);
      const maxStep = Math.floor(mapBounds / step);
      x = (Math.floor(Math.random() * (maxStep - minStep + 1)) + minStep) * step;
      y = (Math.floor(Math.random() * (maxStep - minStep + 1)) + minStep) * step;

      // Distance from center player spawn (0, 0)
      if (Math.hypot(x, y) < 120) continue;

      // Distance from spawn corners
      const tooCloseToCorner = corners.some((c) => Math.hypot(x - c.x, y - c.y) < 110);
      if (tooCloseToCorner) continue;

      // Distance from existing houses
      const tooCloseToOther = chosenPositions.some((p) => Math.hypot(x - p.x, y - p.y) < 180);
      if (tooCloseToOther) continue;

      valid = true;
    }

    chosenPositions.push({ x, y });

    const houseGroup = new THREE.Group();
    houseGroup.position.set(x, y, 0);

    const houseModel = templateModel.clone(true);

    // Assign each house a random rotation around Y-axis in multiples of Math.PI / 2
    const randomMultiplier = Math.floor(Math.random() * 4);
    houseModel.rotation.y = randomMultiplier * (Math.PI / 2);

    houseModel.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    houseGroup.add(houseModel);
    houseGroup.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(houseGroup);
    houseBoxes.push(box);
    houseGroups.push(houseGroup);
  }

  // Check collision against all houses with circle-to-box detection
  function checkCollision(x, y, radius = 10) {
    for (const box of houseBoxes) {
      const closestX = Math.max(box.min.x, Math.min(x, box.max.x));
      const closestY = Math.max(box.min.y, Math.min(y, box.max.y));
      const distance = Math.hypot(x - closestX, y - closestY);

      if (distance < radius) {
        return true;
      }
    }
    return false;
  }

  return {
    houseGroups,
    houseBoxes,
    checkCollision,
  };
}
