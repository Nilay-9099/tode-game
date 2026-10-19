// TODE AND THE LAST LILYPAD - Master Game Loop
// Central coordinator connecting Flavor Fusion, Tadpole Defense, Atmosphere, Enemies, and UI.

import * as THREE from 'three';
import './style.css';
import { GAME_CONSTANTS } from './constants.js';
import { eventBus } from './eventBus.js';
import { sounds } from './components/Audio.js';
import { createCamera } from './components/Camera.js';
import { createRenderer } from './components/Renderer.js';
import { createMap } from './components/Map.js';
import { createHouses } from './components/House.js';
import { ParticleSystem } from './components/Particles.js';
import { createPlayer } from './components/Player.js';
import { TongueSystem } from './components/Tongue.js';
import { StomachSystem } from './components/Stomach.js';
import { FusionSystem } from './components/Fusion.js';
import { BugManager } from './components/Bugs.js';
import { TadpoleManager } from './components/Tadpoles.js';
import { EnemyManager } from './components/Enemies.js';
import { AtmosphereManager } from './components/Atmosphere.js';
import { UIManager } from './components/UI.js';
import { createTutorialScarecrow } from './components/TutorialTarget.js';
import { FloatingTextManager } from './components/FloatingText.js';
import { createDailyRandom } from './utils/prng.js';
import { debugHarness } from './core/Debug.js';
import { QualityManager } from './core/Quality.js';
import { gameState, GAME_STATES, RUN_SUBSTATES } from './core/StateMachine.js';
import { saveManager } from './core/Save.js';
import { initFirebase } from './net/firebase.js';
import { FLAVOR_BUGS, ENEMY_CONFIGS } from './constants.js';
import { perkManager } from './components/Perks.js';
import wavesData from './data/waves.json';
import { PostFX } from './components/PostFX.js';

async function init() {
  // 1. Scene & Lighting Setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe3ff);
  scene.fog = new THREE.FogExp2(0xbfe3ff, 0.0007);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(-150, -150, 260);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.camera.near = 10;
  dirLight.shadow.camera.far = 950;
  dirLight.shadow.camera.left = -480;
  dirLight.shadow.camera.right = 480;
  dirLight.shadow.camera.top = 480;
  dirLight.shadow.camera.bottom = -480;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  // 2. Camera & Renderer
  const gameCamera = createCamera();
  const renderer = createRenderer();
  const postFX = new PostFX(renderer, scene, gameCamera.camera);

  // 3. Dynamic Systems
  const particles = new ParticleSystem(scene);
  const atmosphere = new AtmosphereManager(scene, ambientLight, dirLight);
  const ui = new UIManager();
  const quality = new QualityManager(renderer, postFX);
  initFirebase().catch(() => {});

  // 4. Map & Houses
  const map = createMap(renderer);
  scene.add(map.group);

  const houses = await createHouses(3, 340);
  for (const h of houses.houseGroups) {
    map.group.add(h);
  }

  // 5. Hero Player
  const player = await createPlayer();
  scene.add(player.group);
  scene.add(player.shockwaveMesh);
  scene.add(player.slamMesh);

  // 6. Gameplay Systems
  const tongue = new TongueSystem(scene);
  const stomach = new StomachSystem();
  const fusionSystem = new FusionSystem(scene, particles);
  const bugManager = new BugManager(scene, particles);
  const tadpoleManager = new TadpoleManager(scene, particles);
  const enemyManager = new EnemyManager(scene, particles);
  const floatingText = new FloatingTextManager(gameCamera.camera);

  // 7. Game State
  let isGameOver = false;
  let score = 0;
  let highScore = parseInt(localStorage.getItem('tode_high_score') || '0', 10);
  let wave = 0; // Wave 0 = Safe Tutorial
  let waveKills = 0;
  let waveTarget = 1;
  let currentWaveQueue = [];
  let isEndlessMode = false;
  let tutorialStep = 1;
  let tutorialDummy = createTutorialScarecrow(scene);
  const clock = new THREE.Clock();

  // Spawn initial 3 tutorial bugs near Tode
  function spawnTutorialBugs() {
    bugManager.spawnRandom(140);
    bugManager.spawnRandom(140);
    bugManager.spawnRandom(140);
  }
  spawnTutorialBugs();
  ui.updateTutorial(1);

  // 8. Event Bus Hooks
  eventBus.on('stomach:burp', (expelledBug) => {
    // Burp knockback
    sounds.playBurp();
    gameCamera.addTrauma(0.25);
    particles.emitShockwaveSparks(player.group.position.x, player.group.position.y, GAME_CONSTANTS.BURP_KNOCKBACK_RADIUS);

    const burpDmg = perkManager.modifiers.burpDamage || 0;

    for (let i = enemyManager.enemies.length - 1; i >= 0; i--) {
      const e = enemyManager.enemies[i];
      const d = Math.hypot(e.group.position.x - player.group.position.x, e.group.position.y - player.group.position.y);
      if (d <= GAME_CONSTANTS.BURP_KNOCKBACK_RADIUS + e.radius) {
        const push = new THREE.Vector2(e.group.position.x - player.group.position.x, e.group.position.y - player.group.position.y).normalize();
        e.group.position.x += push.x * GAME_CONSTANTS.BURP_KNOCKBACK_FORCE;
        e.group.position.y += push.y * GAME_CONSTANTS.BURP_KNOCKBACK_FORCE;

        if (burpDmg > 0) {
          e.hp -= burpDmg;
          if (e.hp <= 0) {
            onEnemyKilled(e, { id: 'burp_boom', name: 'Burp Boom' });
          }
        }
      }
    }
  });

  eventBus.on('stomach:changed', () => {
    player.updateBellyTint(stomach);
  });

  eventBus.on('bug:snatched', (bug) => {
    floatingText.spawn(`+${bug.name}!`, player.group.position.x, player.group.position.y, 14, bug.element === 'ice' ? 'shatter' : bug.element === 'fire' ? 'fire' : 'special');
  });

  eventBus.on('fusion:created', (fusion) => {
    floatingText.spawn(`✨ ${fusion.name}!`, player.group.position.x, player.group.position.y, 18, 'special');
    const isNew = saveManager.discoverFusion(fusion.id);
    if (isNew) {
      sounds.playDiscovery();
      ui.showDiscoveryToast(fusion.name);
      ui.renderCodex();
    }
  });

  eventBus.on('tadpole:saved', (tadpole) => {
    score += GAME_CONSTANTS.SCORE_TADPOLE_SAVED;
    ui.updateScore(score, highScore);
    floatingText.spawn('+75 SAVED! 🐟', GAME_CONSTANTS.POND_CENTER.x, GAME_CONSTANTS.POND_CENTER.y, 15, 'saved');
  });

  eventBus.on('game:over', (reason) => {
    if (isGameOver) return;
    isGameOver = true;
    player.group.visible = false;
    sounds.playGameOver();
    ui.showGameOver(score, highScore, wave, tadpoleManager.getSafeCount(), stomach.longestStreak, reason);
  });

  function startNextWave() {
    wave++;
    waveKills = 0;
    enemyManager.wave = wave;

    const wConfig = wavesData.waves.find((w) => w.wave === wave);
    currentWaveQueue = [];

    if (wConfig && !isEndlessMode) {
      waveTarget = wConfig.targetKills || 10;
      enemyManager.spawnInterval = wConfig.spawnInterval || 2.2;

      // Populate currentWaveQueue with exact enemy quotas from waves.json
      if (wConfig.enemies && wConfig.enemies.length > 0) {
        wConfig.enemies.forEach((entry) => {
          let cfg = null;
          if (entry.type === 'gnome') cfg = ENEMY_CONFIGS.GNOME;
          else if (entry.type === 'armored_beetle' || entry.type === 'beetle') cfg = ENEMY_CONFIGS.ARMORED_BEETLE;
          else if (entry.type === 'wasp') cfg = ENEMY_CONFIGS.WASP;
          else if (entry.type === 'crow') cfg = ENEMY_CONFIGS.CROW;
          else cfg = ENEMY_CONFIGS.GNOME;

          for (let c = 0; c < entry.count; c++) {
            currentWaveQueue.push(cfg);
          }
        });

        // Shuffle queue
        for (let i = currentWaveQueue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [currentWaveQueue[i], currentWaveQueue[j]] = [currentWaveQueue[j], currentWaveQueue[i]];
        }
      }

      // Atmosphere Phase
      const phaseConfig = atmosphere.setPhaseForWave(wave, wConfig.phase);
      bugManager.setPhase(atmosphere.currentPhaseKey);
      enemyManager.setPhase(atmosphere.currentPhaseKey);

      // Boss Spawn
      if (wConfig.boss) {
        enemyManager.spawnBoss(wConfig.bossDifficulty || 'normal');
        if (ui.bossBarContainer) ui.bossBarContainer.style.display = 'block';
        if (ui.bossName) {
          ui.bossName.textContent = wConfig.bossDifficulty === 'hard' ? '👑 LAWN MOWER KING (APEX)' : '👑 LAWN MOWER KING';
        }
      } else {
        if (ui.bossBarContainer) ui.bossBarContainer.style.display = 'none';
      }

      ui.showPhaseBanner(phaseConfig.name, wConfig.notes || phaseConfig.banner);
      if (ui.waveBadge) ui.waveBadge.textContent = `WAVE ${wave}`;
    } else {
      // Endless Mode (Wave 11+)
      isEndlessMode = true;
      waveTarget = 14 + (wave - 10) * 3;
      enemyManager.spawnInterval = Math.max(1.1, 1.8 - (wave - 10) * 0.04);

      const count = waveTarget;
      const types = [ENEMY_CONFIGS.GNOME, ENEMY_CONFIGS.ARMORED_BEETLE, ENEMY_CONFIGS.WASP, ENEMY_CONFIGS.CROW];
      for (let i = 0; i < count; i++) {
        currentWaveQueue.push(types[Math.floor(Math.random() * types.length)]);
      }

      if (wave % 5 === 0) {
        enemyManager.spawnBoss('hard');
        if (ui.bossBarContainer) ui.bossBarContainer.style.display = 'block';
        if (ui.bossName) ui.bossName.textContent = `👑 LAWN MOWER KING (TIER ${Math.floor(wave / 5)})`;
      } else {
        if (ui.bossBarContainer) ui.bossBarContainer.style.display = 'none';
      }

      const cyclePhases = ['MORNING', 'NOON', 'DUSK', 'NIGHT', 'BOSS_ARENA'];
      const pKey = cyclePhases[wave % cyclePhases.length];
      const phaseConfig = atmosphere.setPhaseForWave(wave, pKey);
      bugManager.setPhase(atmosphere.currentPhaseKey);
      enemyManager.setPhase(atmosphere.currentPhaseKey);

      ui.showPhaseBanner('🌊 ENDLESS INVASION', `Wave ${wave}: Defend the sacred pond at all costs!`);
      if (ui.waveBadge) ui.waveBadge.textContent = `ENDLESS ${wave}`;
    }

    sounds.playWaveClear();
    score += wave * GAME_CONSTANTS.SCORE_WAVE_CLEAR;
    ui.updateScore(score, highScore);

    // Tadpole Blessing perk check: restore 1 lost tadpole every N waves
    if (
      perkManager.modifiers.tadpoleRegenInterval > 0 &&
      wave > 1 &&
      wave % perkManager.modifiers.tadpoleRegenInterval === 0
    ) {
      tadpoleManager.restoreOneLostTadpole();
      ui.updateTadpoles(tadpoleManager);
    }

    // Trigger Roguelite Perk Draft ("Bug Buffet") for waves >= 2
    if (wave >= 2) {
      gameState.setSubstate(RUN_SUBSTATES.PERK_DRAFT);
      const offers = perkManager.getDraftOffers(3);
      ui.showPerkDraft(offers, (selectedPerk) => {
        perkManager.applyPerk(selectedPerk.id, player, stomach, tongue, tadpoleManager, ui);
        gameState.setSubstate(RUN_SUBSTATES.COMBAT);
        ui.showVictoryBanner('BUFFET CONSUMED!', `Acquired: ${selectedPerk.name}`);
      });
    }
  }

  function onEnemyKilled(enemy, attackDetails = {}) {
    const mult = (attackDetails.scoreMultiplier || 1.0) * (stomach.flavorStreak >= 2 ? GAME_CONSTANTS.STREAK_MULTIPLIERS[Math.min(stomach.flavorStreak, 3)] : 1.0);
    const gained = Math.floor((enemy.config.score || 15) * mult);
    score += gained;
    player.addUltEnergy(10);
    waveKills++;

    if (score > highScore) {
      highScore = Math.floor(score);
      localStorage.setItem('tode_high_score', highScore.toString());
    }
    ui.updateScore(score, highScore);

    // Floating Arcade Numbers & Popups
    let text = `+${gained}`;
    let type = 'score';
    if (attackDetails.id === 'glacier_shatter') {
      text = `+${gained} SHATTER!`;
      type = 'shatter';
    } else if (attackDetails.id === 'shockwave') {
      text = `+${gained} CRUSH!`;
      type = 'fire';
    } else if (enemy.config.id === 'boss_mower') {
      text = `+${gained} BOSS DOWN!`;
      type = 'special';
      sounds.playWaveClear();
      particles.emitCollectSparkle(player.group.position.x, player.group.position.y, 10, 0xffd166);

      // Check Wave 10 Apex Victory
      if (wave === 10 && !isEndlessMode) {
        gameState.setState(GAME_STATES.VICTORY);
        ui.showWave10Victory(
          score,
          tadpoleManager.getSafeCount(),
          stomach.longestStreak,
          () => {
            isEndlessMode = true;
            gameState.setState(GAME_STATES.RUN, RUN_SUBSTATES.COMBAT);
            startNextWave();
          },
          () => {
            resetGame();
          }
        );
        floatingText.spawn(text, enemy.group.position.x, enemy.group.position.y, 12, type);
        return;
      } else {
        ui.showVictoryBanner('🏆 VICTORY! POND DEFENDED!', 'All 5 Tadpoles are safe! Entering Master Waves...');
      }
    }
    floatingText.spawn(text, enemy.group.position.x, enemy.group.position.y, 12, type);

    // Wave progression check
    if (wave > 0 && waveKills >= waveTarget && (!enemyManager.boss || enemyManager.boss.hp <= 0)) {
      startNextWave();
    }
  }

  function resetGame() {
    isGameOver = false;
    isEndlessMode = false;
    currentWaveQueue = [];
    ui.hideGameOver();
    ui.hideWave10Victory();
    ui.closeCodex();
    score = 0;
    wave = 1;
    waveKills = 0;
    waveTarget = 10;
    enemyManager.wave = 1;

    if (ui.waveBadge) ui.waveBadge.textContent = 'WAVE 1';
    atmosphere.setPhaseForWave(1);
    bugManager.setPhase('MORNING');
    enemyManager.setPhase('MORNING');

    if (ui.bossBarContainer) ui.bossBarContainer.style.display = 'none';

    player.reset();
    tongue.reset();
    stomach.slots = [];
    stomach.resetStreak();
    tadpoleManager.reset();
    enemyManager.clearAll();
    bugManager.clear();
    fusionSystem.clear();
    particles.clear();
    floatingText.clear();

    if (tutorialDummy) {
      tutorialDummy.destroy();
      tutorialDummy = null;
    }
    ui.updateTutorial(0);

    ui.updateHearts(player.hp);
    ui.updateScore(score, highScore);
    ui.updateUlt(player.ultEnergy);
    ui.updateTadpoles(tadpoleManager);

    perkManager.reset();
    ui.hidePerkDraft();
    gameState.setState(GAME_STATES.RUN, RUN_SUBSTATES.COMBAT);

    clock.getDelta();
  }

  // 7b. Debug Bindings for QA Harness (Spec Section 4.12)
  if (window.__tode) {
    window.__tode.setWave = (n) => {
      wave = Math.max(0, parseInt(n, 10) - 1);
      startNextWave();
      console.log(`⏩ [Debug] Jumped to Wave ${wave}`);
    };
    window.__tode.giveBug = (type) => {
      const bugKey = String(type || 'ember').toUpperCase();
      const b = FLAVOR_BUGS[bugKey] || FLAVOR_BUGS.EMBER;
      stomach.addBug(b);
      console.log(`🐛 [Debug] Given bug: ${b.name}`);
    };
    window.__tode.spawn = (type = 'gnome', count = 1) => {
      const cfgKey = String(type).toUpperCase();
      const cfg = ENEMY_CONFIGS[cfgKey] || ENEMY_CONFIGS.GNOME;
      for (let i = 0; i < count; i++) {
        enemyManager.spawn(cfg, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 120);
      }
      console.log(`👾 [Debug] Spawned ${count}x ${cfg.name}`);
    };
    window.__tode.setPhase = (name) => {
      atmosphere.currentPhaseKey = String(name).toUpperCase();
      atmosphere.setPhaseForWave(wave);
      console.log(`🌅 [Debug] Phase set to: ${name}`);
    };
    window.__tode.draftPerk = () => {
      gameState.setSubstate(RUN_SUBSTATES.PERK_DRAFT);
      const offers = perkManager.getDraftOffers(3);
      ui.showPerkDraft(offers, (selectedPerk) => {
        perkManager.applyPerk(selectedPerk.id, player, stomach, tongue, tadpoleManager, ui);
        gameState.setSubstate(RUN_SUBSTATES.COMBAT);
        ui.showVictoryBanner('BUFFET CONSUMED!', `Acquired: ${selectedPerk.name}`);
      });
      console.log('🐛 [Debug] Triggered Perk Draft Modal');
    };
    window.__tode.winNow = () => {
      ui.showVictoryBanner('🏆 VICTORY (DEBUG)', 'All Tadpoles Protected!');
      gameState.setState(GAME_STATES.VICTORY);
    };
    window.__tode.loseNow = () => {
      eventBus.emit('game:over', 'Debug Force Defeat');
    };
  }

  // Raycasting for Mouse Aiming
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const planeIntersect = new THREE.Vector3();

  function getGroundIntersection(clientX, clientY) {
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, gameCamera.camera);
    if (raycaster.ray.intersectPlane(groundPlane, planeIntersect)) {
      return planeIntersect.clone();
    }
    return null;
  }

  function updateAimFromPointer(clientX, clientY) {
    if (isGameOver) return;
    const hit = getGroundIntersection(clientX, clientY);
    if (hit) {
      const dx = hit.x - player.group.position.x;
      const dy = hit.y - player.group.position.y;
      if (Math.hypot(dx, dy) > 8 && !player.isMoving) {
        player.setFacingDirection(dx, dy);
      }
    }
  }

  window.addEventListener('pointermove', (e) => {
    updateAimFromPointer(e.clientX, e.clientY);
  });

  // 9. Input & Controls
  window.addEventListener('keydown', (e) => {
    // Space to restart on Game Over
    if (isGameOver) {
      if (e.code === 'Space') {
        resetGame();
      }
      return;
    }

    // Directional Hops or Turn In Place (Shift + WASD)
    const isShift = e.shiftKey;
    if (['ArrowUp', 'KeyW'].includes(e.code)) {
      if (isShift) {
        player.setFacingDirectionByName('up');
      } else {
        player.queueMove('up');
      }
    } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
      if (isShift) {
        player.setFacingDirectionByName('down');
      } else {
        player.queueMove('down');
      }
    } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
      if (isShift) {
        player.setFacingDirectionByName('left');
      } else {
        player.queueMove('left');
      }
    } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
      if (isShift) {
        player.setFacingDirectionByName('right');
      } else {
        player.queueMove('right');
      }
    }

    // Shockwave (SPACE)
    if (e.code === 'Space') {
      const fired = player.triggerShockwave(enemyManager.enemies, particles, onEnemyKilled);
      if (fired) {
        enemyManager.onShockwave(
          player.group.position.x,
          player.group.position.y,
          GAME_CONSTANTS.SHOCKWAVE_RADIUS,
          onEnemyKilled,
          tadpoleManager
        );
        gameCamera.addTrauma(0.3);
      }
    }

    // Tongue Snatch (Q)
    if (e.code === 'KeyQ') {
      const shot = tongue.shoot(player, bugManager.bugs, enemyManager.enemies);
      if (shot && tutorialStep === 1) {
        tutorialStep = 2;
        ui.updateTutorial(2);
      }
    }

    // Spit Flavor Attack (R)
    if (e.code === 'KeyR') {
      const fusion = stomach.consume();
      fusionSystem.spit(player, fusion);
      gameCamera.addTrauma(0.2);

      if (tutorialStep >= 2) {
        tutorialStep = 3;
        ui.updateTutorial(3);
      }
    }

    // Elemental Meteor Slam (E)
    if (e.code === 'KeyE') {
      const canSlam = player.triggerMeteorSlam();
      if (canSlam) {
        gameCamera.kickFov(GAME_CONSTANTS.CAMERA_SLAM_FOV_KICK);
      }
    }
  });

  // Mouse Controls (Left click: Snatch, Right click: Spit)
  window.addEventListener('click', (e) => {
    if (!isGameOver) {
      const hit = getGroundIntersection(e.clientX, e.clientY);
      if (hit) {
        player.setFacingDirection(hit.x - player.group.position.x, hit.y - player.group.position.y);
      }
      tongue.shoot(player, bugManager.bugs, enemyManager.enemies, hit);
      if (tutorialStep === 1) {
        tutorialStep = 2;
        ui.updateTutorial(2);
      }
    }
  });

  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (!isGameOver) {
      const hit = getGroundIntersection(e.clientX, e.clientY);
      if (hit) {
        player.setFacingDirection(hit.x - player.group.position.x, hit.y - player.group.position.y);
      }
      const fusion = stomach.consume();
      fusionSystem.spit(player, fusion, hit);
      gameCamera.addTrauma(0.2);

      if (tutorialStep >= 2) {
        tutorialStep = 3;
        ui.updateTutorial(3);
      }
    }
  });

  // Audio Context Unlock
  function unlockAudio() {
    sounds.ensureContext();
    sounds.startBGM();
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('click', unlockAudio);
  }
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('click', unlockAudio);

  // Mute button
  const muteBtn = document.getElementById('muteBtn');
  if (muteBtn) {
    muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const muted = sounds.toggleMute();
      muteBtn.textContent = muted ? '🔇' : '🔊';
    });
  }

  const restartBtn = document.getElementById('restartBtn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => resetGame());
  }

  // Daily Challenge Mode Toggle (Extension Feature)
  const dailyBtn = document.getElementById('dailyBtn');
  let isDailyMode = false;
  if (dailyBtn) {
    dailyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isDailyMode = !isDailyMode;
      if (isDailyMode) {
        const daily = createDailyRandom();
        enemyManager.setRng(daily.random);
        bugManager.setRng(daily.random);
        dailyBtn.classList.add('active');
        dailyBtn.textContent = `📅 ${daily.seedStr}`;
        ui.showVictoryBanner('📅 DAILY CHALLENGE', `Seeded Run Active: ${daily.seedStr}`);
        resetGame();
      } else {
        enemyManager.setRng(null);
        bugManager.setRng(null);
        dailyBtn.classList.remove('active');
        dailyBtn.textContent = '📅 Daily';
        resetGame();
      }
    });
  }

  window.addEventListener('resize', () => {
    gameCamera.handleResize();
    renderer.setSize(window.innerWidth, window.innerHeight);
    postFX.handleResize();
  });

  function isPlayerDestinationBlocked(targetX, targetY) {
    if (Math.abs(targetX) > GAME_CONSTANTS.ARENA_HALF - 20 || Math.abs(targetY) > GAME_CONSTANTS.ARENA_HALF - 20) {
      return true;
    }
    return houses.checkCollision(targetX, targetY, 20);
  }

  // 10. Main Animation Loop
  renderer.setAnimationLoop(() => {
    const delta = Math.min(clock.getDelta(), 0.1);
    const time = performance.now() * 0.001;

    // Atmosphere & Environment
    atmosphere.update(delta);
    map.update(time);

    if (!isGameOver && gameState.isSimActive()) {
      // Passive score
      score += 0.1 * delta;
      ui.updateScore(score, highScore);

      // Check Pond Dip: standing in the pond resets stomach
      const distToPond = Math.hypot(
        player.group.position.x - GAME_CONSTANTS.POND_CENTER.x,
        player.group.position.y - GAME_CONSTANTS.POND_CENTER.y
      );
      if (distToPond < GAME_CONSTANTS.POND_RADIUS) {
        if (stomach.slots.length > 0) {
          sounds.playPondDip();
          particles.emitCollectSparkle(player.group.position.x, player.group.position.y, 8, 0x00f5d4);
        }
        stomach.clearPondDip();
      }

      // Update Stomach Digest Timers
      stomach.update(delta);

      // Update Bugs
      bugManager.update(delta, player, stomach);

      // Update Tadpoles
      tadpoleManager.update(delta, time);
      ui.updateTadpoles(tadpoleManager);

      // Update Tongue Snatch
      tongue.update(delta, player, (hitType, target) => {
        if (hitType === 'bug') {
          const idx = bugManager.bugs.indexOf(target);
          if (idx !== -1) {
            bugManager.collect(idx, player, stomach);
          }
        }
      });

      // Update Fusion Projectiles & Ground Hazards
      fusionSystem.update(delta, enemyManager.enemies, onEnemyKilled);

      // Check Scarecrow dummy hit in Wave 0 Tutorial
      if (tutorialDummy) {
        tutorialDummy.update(delta);
        for (const p of fusionSystem.projectiles) {
          const d = Math.hypot(p.mesh.position.x - tutorialDummy.group.position.x, p.mesh.position.y - tutorialDummy.group.position.y);
          if (d <= tutorialDummy.radius + p.radius) {
            const dead = tutorialDummy.takeHit(p.damage, particles);
            p.life = p.maxLife; // consume projectile
            if (dead) {
              tutorialDummy = null;
              ui.updateTutorial(0);
              ui.showPhaseBanner('🎉 Tutorial Complete!', 'Defend your tadpoles from garden invaders!');
              startNextWave();
            }
            break;
          }
        }
      }

      // Update Enemies (Wave 1+)
      if (wave > 0) {
        enemyManager.spawnTimer += delta;
        if (enemyManager.spawnTimer >= enemyManager.spawnInterval) {
          enemyManager.spawnTimer = 0;
          if (currentWaveQueue.length > 0) {
            const nextCfg = currentWaveQueue.shift();
            const side = Math.floor(Math.random() * 4);
            let x = 0, y = 0;
            const edge = GAME_CONSTANTS.ARENA_HALF - 20;
            if (side === 0) { x = -edge; y = (Math.random() - 0.5) * edge * 2; }
            else if (side === 1) { x = edge; y = (Math.random() - 0.5) * edge * 2; }
            else if (side === 2) { x = (Math.random() - 0.5) * edge * 2; y = -edge; }
            else { x = (Math.random() - 0.5) * edge * 2; y = edge; }
            enemyManager.spawn(nextCfg, x, y);
          } else if (isEndlessMode || enemyManager.enemies.length === 0) {
            enemyManager.spawnRandomWaveEnemy();
          }
        }

        enemyManager.update(
          delta,
          player,
          tadpoleManager,
          () => {
            const isDead = player.takeDamage();
            ui.updateHearts(player.hp);
            gameCamera.addTrauma(0.4);
            if (isDead) {
              eventBus.emit('game:over', 'player_dead');
            }
          },
          onEnemyKilled
        );
      }

      // Boss Health Bar update
      if (enemyManager.boss && ui.bossBarFill) {
        const pct = Math.max(0, (enemyManager.boss.hp / enemyManager.boss.maxHp) * 100);
        ui.bossBarFill.style.width = `${pct}%`;
      }

      // Update Player
      player.update(
        delta,
        isPlayerDestinationBlocked,
        particles,
        stomach,
        () => {
          // Meteor Slam Impact!
          gameCamera.addTrauma(0.7);
          particles.emitMeteorSlam(player.group.position.x, player.group.position.y, GAME_CONSTANTS.SLAM_RADIUS);
          const fusion = stomach.consume();
          fusionSystem.elementalSlam(player, fusion, enemyManager.enemies, onEnemyKilled);

          // Record Slam in Codex
          if (fusion) {
            let slamId = null;
            let slamName = null;
            if (fusion.id.includes('fire') || fusion.id === 'inferno') {
              slamId = 'slam_fire';
              slamName = 'Firestorm Slam';
            } else if (fusion.id.includes('ice') || fusion.id === 'glacier') {
              slamId = 'slam_ice';
              slamName = 'Blizzard Slam';
            } else if (fusion.id.includes('spark') || fusion.id.includes('electric') || fusion.id === 'chain_lightning') {
              slamId = 'slam_lightning';
              slamName = 'Tempest Slam';
            }
            if (slamId) {
              const isNew = saveManager.discoverFusion(slamId);
              if (isNew) {
                sounds.playDiscovery();
                ui.showDiscoveryToast(`✨ Discovered: ${slamName}!`);
                ui.renderCodex();
              }
            }
          }

          // Massive damage to all enemies in radius
          for (let i = enemyManager.enemies.length - 1; i >= 0; i--) {
            const e = enemyManager.enemies[i];
            const d = Math.hypot(e.group.position.x - player.group.position.x, e.group.position.y - player.group.position.y);
            if (d <= GAME_CONSTANTS.SLAM_RADIUS) {
              e.hp -= 4.0;
              if (e.hp <= 0) {
                onEnemyKilled(e, { scoreMultiplier: 2.0 });
              }
            }
          }
        }
      );

      ui.updateCooldown(player.shockwaveTimer);
      ui.updateUlt(player.ultEnergy);
    }

    // Camera follow & Trauma shake
    gameCamera.update(delta, player.group.position);

    // Particles & Render
    particles.update(delta);
    floatingText.update(delta);
    quality.update();
    debugHarness.updateMetrics(enemyManager.enemies.length + bugManager.bugs.length);
    postFX.render(delta);
  });
}

init().catch((err) => {
  console.error('Failed to initialize Tode and the Last Lilypad:', err);
});
