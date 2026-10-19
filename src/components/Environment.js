import * as THREE from 'three';

export function createEnvironment(scene, mapBounds = 400) {
  const envGroup = new THREE.Group();

  const woodMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0x7f8c8d });
  const leafMat1 = new THREE.MeshLambertMaterial({ color: 0x2d6a4f });
  const leafMat2 = new THREE.MeshLambertMaterial({ color: 0x40916c });
  const waterMat = new THREE.MeshPhongMaterial({
    color: 0x0077b6,
    transparent: true,
    opacity: 0.85,
    shininess: 100,
  });
  const flowerMats = [
    new THREE.MeshLambertMaterial({ color: 0xff4d6d }),
    new THREE.MeshLambertMaterial({ color: 0xffd166 }),
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
  ];

  // 1. Perimeter boundary posts
  const postGeo = new THREE.CylinderGeometry(2, 2.5, 12, 6);
  postGeo.rotateX(Math.PI / 2);

  const step = 40;
  for (let x = -mapBounds; x <= mapBounds; x += step) {
    [-mapBounds, mapBounds].forEach((y) => {
      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.set(x, y, 6);
      post.castShadow = true;
      envGroup.add(post);
    });
  }
  for (let y = -mapBounds + step; y < mapBounds; y += step) {
    [-mapBounds, mapBounds].forEach((x) => {
      const post = new THREE.Mesh(postGeo, woodMat);
      post.position.set(x, y, 6);
      post.castShadow = true;
      envGroup.add(post);
    });
  }

  // 2. Low-Poly Trees along perimeter
  function createTree(x, y, scale = 1) {
    const tree = new THREE.Group();
    tree.position.set(x, y, 0);

    const trunkGeo = new THREE.CylinderGeometry(2 * scale, 3 * scale, 16 * scale, 6);
    trunkGeo.rotateX(Math.PI / 2);
    const trunk = new THREE.Mesh(trunkGeo, woodMat);
    trunk.position.z = 8 * scale;
    trunk.castShadow = true;
    tree.add(trunk);

    const c1 = new THREE.Mesh(
      new THREE.ConeGeometry(12 * scale, 18 * scale, 6),
      leafMat1
    );
    c1.geometry.rotateX(Math.PI / 2);
    c1.position.z = 20 * scale;
    c1.castShadow = true;
    tree.add(c1);

    const c2 = new THREE.Mesh(
      new THREE.ConeGeometry(9 * scale, 14 * scale, 6),
      leafMat2
    );
    c2.geometry.rotateX(Math.PI / 2);
    c2.position.z = 27 * scale;
    c2.castShadow = true;
    tree.add(c2);

    return tree;
  }

  for (let i = -mapBounds - 35; i <= mapBounds + 35; i += 75) {
    envGroup.add(createTree(i, -mapBounds - 40, 0.8 + Math.random() * 0.4));
    envGroup.add(createTree(i, mapBounds + 40, 0.8 + Math.random() * 0.4));
    envGroup.add(createTree(-mapBounds - 40, i, 0.8 + Math.random() * 0.4));
    envGroup.add(createTree(mapBounds + 40, i, 0.8 + Math.random() * 0.4));
  }

  // 3. Decorative Flowers
  const petalGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.6, 5);
  petalGeo.rotateX(Math.PI / 2);

  for (let i = 0; i < 40; i++) {
    const mat = flowerMats[i % flowerMats.length];
    const flower = new THREE.Mesh(petalGeo, mat);
    const fx = (Math.random() - 0.5) * (mapBounds * 1.7);
    const fy = (Math.random() - 0.5) * (mapBounds * 1.7);
    flower.position.set(fx, fy, 0.3);
    envGroup.add(flower);
  }

  // 4. Decorative Lily Pond
  const pond = new THREE.Group();
  pond.position.set(-220, 220, 0.2);

  const waterDisc = new THREE.Mesh(
    new THREE.CircleGeometry(45, 24),
    waterMat
  );
  pond.add(waterDisc);

  const stoneCount = 14;
  for (let i = 0; i < stoneCount; i++) {
    const angle = (i / stoneCount) * Math.PI * 2;
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(4 + Math.random() * 2),
      stoneMat
    );
    stone.position.set(Math.cos(angle) * 44, Math.sin(angle) * 44, 1.5);
    stone.castShadow = true;
    pond.add(stone);
  }

  const lilyPadMat = new THREE.MeshLambertMaterial({ color: 0x38b000 });
  for (let i = 0; i < 4; i++) {
    const pad = new THREE.Mesh(new THREE.CircleGeometry(6, 12), lilyPadMat);
    pad.position.set(
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 40,
      0.4
    );
    pond.add(pad);
  }

  envGroup.add(pond);
  scene.add(envGroup);

  return {
    group: envGroup,
    update(time) {
      // Gentle water ripple rotation
      waterDisc.rotation.z = Math.sin(time * 0.5) * 0.05;
    },
  };
}
