import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { sounds } from './Audio.js';

export const BASE_ENEMY_SPEED = 48;
export const BASE_SPAWN_DELAY = 2.5;
export const ENEMY_COLLISION_RADIUS = 20;
export const PLAYER_COLLISION_RADIUS = 20;

export const SPAWN_CORNERS = [
  new THREE.Vector2(-350, -350),
  new THREE.Vector2(350, -350),
  new THREE.Vector2(-350, 350),
  new THREE.Vector2(350, 350),
];

// Enemy Types Configuration
export const ENEMY_TYPES = {
  NORMAL: {
    id: 'normal',
    name: 'Armabee Scout',
    scale: 6.0,
    speedMultiplier: 1.0,
    maxHp: 1,
    colorHex: 0xffaa00,
    scoreValue: 10,
  },
  DASHER: {
    id: 'dasher',
    name: 'Speed Wasp',
    scale: 4.5,
    speedMultiplier: 1.7,
    maxHp: 1,
    colorHex: 0xf72585,
    scoreValue: 15,
  },
  TANK: {
    id: 'tank',
    name: 'Hornet Brute',
    scale: 9.5,
    speedMultiplier: 0.65,
    maxHp: 3,
    colorHex: 0xd90429,
    scoreValue: 35,
  },
  BOSS: {
    id: 'boss',
    name: 'Queen Hornet Prime',
    scale: 16.0,
    speedMultiplier: 0.5,
    maxHp: 20,
    colorHex: 0xffb703,
    scoreValue: 200,
  },
};

export async function createEnemyManager() {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync('/models/enemy.glb');
  const templateModel = gltf.scene;
  const animations = gltf.animations || [];

  templateModel.rotation.x = Math.PI / 2;

  const enemies = [];
  const projectiles = [];

  const projGeo = new THREE.SphereGeometry(3.5, 8, 8);
  const projMat = new THREE.MeshBasicMaterial({ color: 0xff3838 });

  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  return {
    enemies,
    projectiles,
    spawnDelay: BASE_SPAWN_DELAY,
    enemySpeed: BASE_ENEMY_SPEED,
    spawnTimer: 0,
    wave: 1,
    bossSpawned: false,

    spawnAt(scene, x, y, type = ENEMY_TYPES.NORMAL) {
      const group = new THREE.Group();
      group.position.set(x, y, 0);

      const model = clone(templateModel);
      model.scale.setScalar(type.scale);
      model.rotation.x = Math.PI / 2;

      model.traverse((child) => {
        if (child.isMesh) {
          child.frustumCulled = false;
          child.castShadow = true;
          child.receiveShadow = false;

          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material = child.material.map((m) => m.clone());
            } else {
              child.material = child.material.clone();
            }

            if (type.id === 'tank') {
              (Array.isArray(child.material) ? child.material : [child.material]).forEach((m) => {
                m.color.setHex(0xd90429);
              });
            } else if (type.id === 'dasher') {
              (Array.isArray(child.material) ? child.material : [child.material]).forEach((m) => {
                m.color.setHex(0xf72585);
              });
            } else if (type.id === 'boss') {
              (Array.isArray(child.material) ? child.material : [child.material]).forEach((m) => {
                m.color.setHex(0xffb703);
                m.emissive = new THREE.Color(0xff5500);
                m.emissiveIntensity = 0.4;
              });
            }
          }
        }
      });

      model.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(model);
      const heightOffset = isFinite(b.min.z) ? -b.min.z + 4.0 : 8.0;
      model.position.z = heightOffset;

      group.add(model);

      const shadowGeo = new THREE.CircleGeometry(type.scale * 1.6, 16);
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.position.z = 0.25;
      group.add(shadow);

      scene.add(group);

      let mixer = null;
      if (animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        const clip =
          THREE.AnimationClip.findByName(animations, 'CharacterArmature|Fast_Flying') ||
          THREE.AnimationClip.findByName(animations, 'CharacterArmature|Flying_Idle') ||
          animations[0];
        if (clip) {
          const action = mixer.clipAction(clip);
          action.play();
        }
      }

      const enemy = {
        group,
        model,
        mixer,
        type,
        hp: type.maxHp,
        maxHp: type.maxHp,
        shootTimer: Math.random() * 3 + 2,
        radius: type.id === 'boss' ? 45 : (type.id === 'tank' ? 32 : (type.scale * 3.5)),
      };

      enemies.push(enemy);
      return enemy;
    },

    spawnRandomCorner(scene, wave = 1) {
      const corner = SPAWN_CORNERS[Math.floor(Math.random() * SPAWN_CORNERS.length)];
      let type = ENEMY_TYPES.NORMAL;
      const rand = Math.random();

      if (wave >= 4 && rand < 0.25) {
        type = ENEMY_TYPES.TANK;
      } else if (wave >= 2 && rand < 0.4) {
        type = ENEMY_TYPES.DASHER;
      }

      return this.spawnAt(scene, corner.x, corner.y, type);
    },

    spawnBoss(scene) {
      this.bossSpawned = true;
      sounds.playWaveClear();
      return this.spawnAt(scene, 0, 320, ENEMY_TYPES.BOSS);
    },

    spawnCorners(scene) {
      for (const corner of SPAWN_CORNERS) {
        this.spawnAt(scene, corner.x, corner.y, ENEMY_TYPES.NORMAL);
      }
    },

    clearAll(scene) {
      for (const enemy of enemies) {
        scene.remove(enemy.group);
      }
      enemies.length = 0;

      for (const p of projectiles) {
        scene.remove(p.mesh);
      }
      projectiles.length = 0;

      this.spawnTimer = 0;
      this.bossSpawned = false;
    },

    update(
      delta,
      player,
      scene,
      isGameOver,
      isFrozen,
      checkObstacleCollision,
      onPlayerHit,
      particles
    ) {
      if (isGameOver) return;

      for (const enemy of enemies) {
        if (enemy.mixer && !isFrozen) {
          enemy.mixer.update(delta);
        }
      }

      this.spawnTimer += delta;
      if (this.spawnTimer >= this.spawnDelay) {
        this.spawnTimer = 0;
        this.spawnRandomCorner(scene, this.wave);
      }

      const playerPos = player.group.position;
      const gameOverThreshold = PLAYER_COLLISION_RADIUS + ENEMY_COLLISION_RADIUS;

      // Projectiles
      for (let pIdx = projectiles.length - 1; pIdx >= 0; pIdx--) {
        const p = projectiles[pIdx];
        p.mesh.position.x += p.vx * delta;
        p.mesh.position.y += p.vy * delta;
        p.life -= delta;

        const distToPlayer = Math.hypot(
          playerPos.x - p.mesh.position.x,
          playerPos.y - p.mesh.position.y
        );

        if (distToPlayer < 24) {
          scene.remove(p.mesh);
          projectiles.splice(pIdx, 1);
          if (onPlayerHit) onPlayerHit();
          continue;
        }

        if (p.life <= 0) {
          scene.remove(p.mesh);
          projectiles.splice(pIdx, 1);
        }
      }

      // Enemies
      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        const ex = enemy.group.position.x;
        const ey = enemy.group.position.y;

        const dx = playerPos.x - ex;
        const dy = playerPos.y - ey;
        const distToPlayer = Math.hypot(dx, dy);

        const hitDistance = enemy.radius + PLAYER_COLLISION_RADIUS;
        if (distToPlayer <= hitDistance) {
          if (onPlayerHit) {
            onPlayerHit();
            return;
          }
        }

        enemy.model.rotation.y = Math.atan2(dx, -dy);

        if (isFrozen) {
          continue;
        }

        // Boss periodic projectile attack
        if (enemy.type.id === 'boss') {
          enemy.shootTimer -= delta;
          if (enemy.shootTimer <= 0) {
            enemy.shootTimer = 2.8;
            const pMesh = new THREE.Mesh(projGeo, projMat);
            pMesh.position.set(ex, ey, 14);
            scene.add(pMesh);
            const speed = 120;
            projectiles.push({
              mesh: pMesh,
              vx: (dx / distToPlayer) * speed,
              vy: (dy / distToPlayer) * speed,
              life: 5.0,
            });
          }
        }

        if (distToPlayer > 0.001) {
          const moveDist = this.enemySpeed * enemy.type.speedMultiplier * delta;
          const targetX = ex + (dx / distToPlayer) * moveDist;
          const targetY = ey + (dy / distToPlayer) * moveDist;

          const hitsObstacle =
            checkObstacleCollision &&
            checkObstacleCollision(targetX, targetY, enemy.radius);

          let hitsOtherEnemy = false;
          for (let j = 0; j < enemies.length; j++) {
            if (i === j) continue;
            const other = enemies[j];
            const dOther = Math.hypot(
              targetX - other.group.position.x,
              targetY - other.group.position.y
            );
            if (dOther < enemy.radius + other.radius) {
              hitsOtherEnemy = true;
              break;
            }
          }

          if (!hitsObstacle && !hitsOtherEnemy) {
            enemy.group.position.x = targetX;
            enemy.group.position.y = targetY;
          }
        }
      }
    },
  };
}
