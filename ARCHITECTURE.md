# 🏗️ ARCHITECTURE.md — Tode and the Last Lilypad

> **System Audit & Technical Architecture Document**  
> **Audited by:** Agent 0 (Senior Systems Architect)  
> **Target System:** JetBrains Academy / Coursera Course Project ("Build a Game with an AI Coding Agent")  
> **Repository Root:** `C:\Users\nilay\WebstormProjects\Build a Game with an AI Coding Agent\game`

---

## 1. Engine, Libraries, and Environment

| Component | Technology | Version | Location / Config |
| :--- | :--- | :--- | :--- |
| **3D Engine** | Three.js | `^0.181.2` | `game/package.json` |
| **Bundler & Dev Server** | Vite | `^7.2.4` (running `v7.3.7`) | `game/package.json` |
| **Module Format** | ECMAScript Modules (ESM) | Native browser ESM | `"type": "module"` in `package.json` |
| **Audio Engine** | Web Audio API | Native browser W3C spec | `src/components/Audio.js` (100% procedural oscillators & noise) |
| **Target Platforms** | Modern Browsers | Chrome, Edge, Firefox, Safari | WebGL 2.0 / Web Audio compliant |
| **Backend / DB** | Firebase / Firestore | *Not yet configured* | Planned for Phase P1-P4 |

---

## 2. Project Folder & Module Map

```
game/
├── .gitignore                     # Git ignore for node_modules and dist
├── index.html                     # Application entry HTML & HUD DOM elements
├── package.json                   # Dependencies (Three.js, Vite) & scripts
├── package-lock.json              # Resolved lockfile
├── README.md                      # Public project documentation & cookbook
├── ARCHITECTURE.md                # [This file] Complete architectural audit
├── public/
│   ├── tode.svg                   # Browser favicon
│   └── models/
│       ├── tode.glb               # Hero frog 3D model
│       ├── small_house.glb        # Cottage house 3D obstacle model
│       └── enemy.glb              # Legacy course enemy model (unused in v2)
└── src/
    ├── main.js                    # Game entry point, master animation loop, event wiring
    ├── constants.js               # Centralized gameplay numbers, colors, recipes
    ├── eventBus.js                # Decoupled publish/subscribe event coordinator
    ├── style.css                  # HUD styles, overlays, animations, typography
    ├── utils/
    │   └── prng.js                # Mulberry32 deterministic seeded PRNG for Daily Challenge
    └── components/
        ├── Atmosphere.js          # Day/Night lighting transitions & ambient fireflies
        ├── Audio.js               # Procedural Web Audio API sound & music synthesis
        ├── Bugs.js                # Elemental bugs (Ember, Frost, Spark, Crumb) spawning
        ├── Camera.js              # Perspective camera, smooth follow, trauma shake, FOV kick
        ├── Enemies.js             # Procedural enemy hierarchy (Gnomes, Beetles, Wasps, Crows, Boss)
        ├── Enemy.js               # Legacy course enemy GLTF loader (retained for baseline reference)
        ├── Environment.js         # Perimeter fence posts & procedural trees
        ├── FloatingText.js        # 3D-to-screen projected arcade floating damage/score text
        ├── Fusion.js              # Elemental projectile behaviors, ground hazards, AoE
        ├── House.js               # GLTF cottage houses with 2D circle collision detection
        ├── Map.js                 # Arena ground, anisotropic grass texture, rim stones, pond
        ├── Particles.js           # Pooled particle emitters (sparks, dust, bursts, explosions)
        ├── Player.js              # Tode controller, hops, squash/stretch, shockwave, slam
        ├── PowerUps.js            # Legacy course power-ups (Shield, Speed, Freeze, Bomb, Heal)
        ├── Renderer.js            # Three.js WebGLRenderer, PCFSoftShadowMap, pixel ratio
        ├── Stomach.js             # 2-slot stomach, digest countdowns, burp knockback, streaks
        ├── Tadpoles.js            # 5 swimming pond tadpoles with abduction mechanics
        ├── TutorialTarget.js      # Wave 0 training scarecrow dummy
        └── UI.js                  # HUD updates, tutorial prompt, phase banner, victory modal
```

---

## 3. Application Lifecycle & Game Loop

### 3.1 Bootstrap (`src/main.js`)
1. **Renderer & Scene Initialization**: Canvas mounted from DOM (`canvas.game`), Three.js Scene created with background color and exponential fog (`FogExp2`).
2. **Camera & Lighting**: Perspective camera (`GameCamera`) with Z-up orientation; Directional light with shadow camera bounds (1024x1024 map) and soft Ambient light.
3. **Environment Generation**: Procedural grass map with anisotropic filtering, perimeter rim stone walls, water disc, and GLTF cottages with collision footprints.
4. **Player & Systems**: Hero model loaded from `public/models/tode.glb`, initialized with belly tint orbs, shockwave ring mesh, and slam ring mesh.
5. **Event Bus Subscriptions**: Events registered for `bug:snatched`, `fusion:created`, `tadpole:saved`, `stomach:burp`, `stomach:changed`, and `game:over`.
6. **Input Listeners**: Keyboard (<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>, <kbd>Space</kbd>, <kbd>E</kbd>, <kbd>Q</kbd>, <kbd>R</kbd>), Mouse aim raycaster on ground plane `Z=0`, Left/Right clicks, Mute, Daily Challenge toggle, and Restart button.

### 3.2 Main Animation Loop
Executed via `renderer.setAnimationLoop`:
```
┌────────────────────────────────────────────────────────┐
│               renderer.setAnimationLoop                │
└──────────────────────────┬─────────────────────────────┘
                           │
 1. Delta Time Clamping ───┼──> Math.min(clock.getDelta(), 0.1)
                           │
 2. Environment & Sky ─────┼──> atmosphere.update(delta), map.update(time)
                           │
 3. Bug System ────────────┼──> bugManager.update(delta, player, tongue, stomach)
                           │
 4. Stomach & Digestion ───┼──> stomach.update(delta)
                           │
 5. Fusion Projectiles ────┼──> fusionSystem.update(delta, enemies, onEnemyKilled)
                           │
 6. Objective Tadpoles ────┼──> tadpoleManager.update(delta)
                           │
 7. Enemy Hierarchy ───────┼──> enemyManager.update(delta, player, houses, onEnemyKilled)
                           │
 8. Player Movement ───────┼──> player.update(delta, keys, collisionChecker, mouseAim)
                           │
 9. Tongue Action ─────────┼──> tongue.update(delta, playerPos, bugs, enemies)
                           │
10. Camera Follow & Shake ─┼──> gameCamera.update(delta, playerPos)
                           │
11. Particles & Popups ────┼──> particles.update(delta), floatingText.update(delta)
                           │
12. Final Render Pass ─────┴──> renderer.render(scene, gameCamera.camera)
```

---

## 4. Subsystem Audits

### 4.1 Player & Movement (`src/components/Player.js`)
- **Model**: `tode.glb` scaled to `GAME_CONSTANTS.PLAYER_SCALE: 28` with pivot alignment.
- **Motion**: Analog-feel hopping cycle (`jumpProgress`, `isJumping`) with height parabolic arc (`z = sin(p * PI) * JUMP_HEIGHT`) and landing squash/stretch (`scale.x/y/z` morphing).
- **Aiming**: Dynamic dual-scheme: Keyboard directional hopping + real-time ground raycast cursor aiming (`getGroundIntersection`).
- **Defensive Actions**:
  - **Spacebar Shockwave**: Charges up to 1.2s, emits radial ring expanding to radius 110, squashes gnomes, flips armored beetles, and shatters frozen enemies.
  - **E Meteor Slam**: Unlocked at 100% ultimate energy, vertical leap and ground impact with radius 175 and camera FOV punch.

### 4.2 Enemies & Wave Director (`src/components/Enemies.js` & `src/main.js`)
- **Architecture**: Procedural low-poly meshes (zero GLTF network hitches during wave spawns).
- **Roster**:
  - `Gnome Raider`: Heads toward pond, abducts tadpoles, flees toward arena edges.
  - `Armored Beetle`: High defense; impervious to frontal attacks until flipped onto its back by a Spacebar Shockwave.
  - `Stinger Wasp`: Fast aerial sinusoidal dive-bomber.
  - `Pond Crow`: High-health swooping aerial predator.
  - `Boss Lawn Mower` (Wave 5): 80 HP, dual rotary blades, linear charges, fuel-can weak spot on back.
- **Wave Progression**: Managed in `main.js` (`startNextWave`), dynamically scaling enemy counts (`8 + wave * 4`), setting day/night atmosphere phase, and spawning boss every 5 waves.

### 4.3 Objective: Tadpole Defense (`src/components/Tadpoles.js`)
- 5 procedural tadpoles swim in organic orbits inside the sacred pond (`POND_CENTER: { x: -200, y: 200 }`).
- Enemies can attach a tadpole (`e.stolenTadpole = t`). If an enemy reaches the arena perimeter (`Math.abs(x) > ARENA_HALF - 15`), the tadpole is permanently lost (`eventBus.emit('tadpole:lost')`).
- If the thief is slain before escaping, the tadpole returns safely (`eventBus.emit('tadpole:saved')`).
- Loss condition: 0 hearts OR all 5 tadpoles lost.

### 4.4 Flavor Fusion Engine (`src/components/Stomach.js` & `src/components/Fusion.js`)
- Two-slot stomach with individual 12s digestion countdown timers.
- **Recipes**:
  - `Ember + Ember` $\rightarrow$ **Inferno** (Burning ground hazard puddle)
  - `Frost + Frost` $\rightarrow$ **Glacier** (Freezes enemies solid; vulnerable to instant Shockwave shatter)
  - `Spark + Spark` $\rightarrow$ **Chain Lightning** (High-voltage electrical arc jumping to 3 targets)
  - `Ember + Frost` $\rightarrow$ **Steam Burst** (Expansive AoE smoke cloud blinding enemies)
  - `Ember + Spark` $\rightarrow$ **Plasma Flare** (High-damage piercing plasma orb)
  - `Frost + Spark` $\rightarrow$ **Superconductor** (Cryo-stun electrical field)
  - `Crumb combinations` $\rightarrow$ **Breadcrumb Decoy** (Distracts gnomes away from tadpoles)
- Overeating triggers an instant **Burp** (`eventBus.emit('stomach:burp')`) with radial knockback.
- Standing in the sacred pond triggers **Pond Dip** clearing stomach contents.

### 4.5 Audio Synthesis (`src/components/Audio.js`)
- 100% procedural Web Audio API with zero external audio assets or licensing constraints.
- Real-time oscillators (sine, square, triangle, sawtooth), noise generation buffers, biquad filter sweeps, and gain envelopes.
- Synthesizes: `playJump`, `playTongueShoot`, `playGulp`, `playSpit`, `playFusionDing`, `playShockwave`, `playBurp`, `playShatter`, `playBossRoar`, `playGameOver`, `playWaveClear`, and ambient background generative chords that shift key and tempo with the day/night cycle.
- Autoplay policy handled gracefully with key/click resume listeners.

### 4.6 Ground Rendering & Horizon Striping (`src/components/Map.js`)
- **Status of Issue**: The original course skeleton suffered from moiré striping near the horizon due to high-frequency un-mipmapped textures.
- **Current Fix**: `src/components/Map.js` generates a 512x512 soft organic grass canvas texture with `LinearMipmapLinearFilter`, `RepeatWrapping (14, 14)`, and maximum hardware anisotropic filtering (`renderer.capabilities.getMaxAnisotropy()`). In addition, a stone border rim block wall lines the perimeter (`ARENA_HALF: 380`), and exponential distance fog (`FogExp2`) blends the arena edges into the sky.

### 4.7 Firebase & Cloud Services
- **Audit Finding**: Currently, **NO Firebase configuration or SDK packages exist** in `game/package.json` or `package.json`. No `firebase.json` or `.firebaserc` files are present.
- **Requirement for Extension**: Phase P1/P4 will add Firebase Web SDK dependencies (`firebase/app`, `firebase/firestore`, `firebase/auth`) to enable anonymous authentication, Firestore global leaderboards, and the community Pond Counter.

---

## 5. Safest Insertion Points for New Architecture Modules

| Module to Add | Target Location | Insertion Strategy |
| :--- | :--- | :--- |
| **Data Files** | `src/data/*.json` | Externalize `fusions.json`, `enemies.json`, `waves.json`, `perks.json`, `phases.json`, and `codex.json`. Load asynchronously or via direct ESM imports. |
| **State Machine** | `src/core/StateMachine.js` | Replace informal boolean flags (`isGameOver`, tutorial checks) with an explicit FSM: `BOOT -> TITLE -> TUTORIAL -> RUN (INTERMISSION, PERK_DRAFT, COMBAT, BOSS) -> PAUSED -> GAME_OVER / VICTORY`. |
| **Fixed Timestep Loop** | `src/core/Loop.js` | Integrate fixed accumulator (`sim.step(dt = 1/60)`) with time scale multiplier (supporting 50-100ms hit-stop and boss death slow-mo) while keeping rendering interpolated. |
| **Perk Draft ("Bug Buffet")** | `src/components/Perks.js` & `UI.js` | Trigger between waves 2+; displays 3 cards picked from seeded PRNG; applies stat modifiers (e.g., 3rd stomach slot, echo spit, pond blessing). |
| **Post-Processing Chain** | `src/components/PostFX.js` | Wrap `renderer.render()` with Three.js `EffectComposer` (Tilt-shift blur, selective bloom, vignette, warm color grading), with `PostFX.setQuality(level)` for adaptive scaling. |
| **Firebase Leaderboard & Auth** | `src/net/firebase.js` | Initialize Firebase app, anonymous sign-in, Firestore collection reads/writes for all-time scores, daily challenge scores, and sharded global Pond Counter. |

---

## 6. Recommended File Ownership Split for 3 Agents

To ensure strict zero-conflict parallel development across Agents A, B, and C:

```
                          ┌─────────────────────────────┐
                          │   LEAD / SHARED (core/*)    │
                          │ Constants.js, EventBus.js,  │
                          │ Rng.js, Loop.js, State.js   │
                          └──────────────┬──────────────┘
               ┌─────────────────────────┼─────────────────────────┐
               ▼                         ▼                         ▼
   ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
   │        AGENT A        │ │        AGENT B        │ │        AGENT C        │
   │ Gameplay & Simulation │ │ Rendering & Visuals   │ │  UI, Audio & Backend  │
   ├───────────────────────┤ ├───────────────────────┤ ├───────────────────────┤
   │ • src/data/*.json     │ │ • src/render/*        │ │ • src/ui/*            │
   │ • src/sim/Stomach.js  │ │ • src/render/Map.js   │ │ • src/ui/Hud.js       │
   │ • src/sim/Fusion.js   │ │ • src/render/PostFX.js│ │ • src/ui/PerkDraft.js │
   │ • src/sim/Enemies.js  │ │ • src/render/Camera.js│ │ • src/ui/Codex.js     │
   │ • src/sim/Tadpoles.js │ │ • src/render/Parts.js │ │ • src/audio/Audio.js  │
   │ • src/sim/Perks.js    │ │ • src/render/Atmos.js │ │ • src/net/firebase.js │
   │ • src/sim/Spawner.js  │ │ • Models & shaders    │ │ • index.html/style.css│
   └───────────────────────┘ └───────────────────────┘ └───────────────────────┘
```

- **Agent A (Gameplay & Simulation)** owns all rule logic, collision queries, combat status effects, perk calculations, and data definitions. Communicates exclusively through the Event Bus.
- **Agent B (Rendering & Atmosphere)** owns the Three.js scene graph, shaders, tilt-shift post-processing, particle systems, dynamic lighting, and camera trauma. Listens to events; never alters simulation state.
- **Agent C (UI, Audio, Backend)** owns all DOM elements, HUD animations, audio synthesizers, generative music, Firebase anonymous auth, Firestore leaderboards, and the community Pond Counter.

---

*Verified runnable with Vite v7.3.7 & Three.js v0.181.2. Baseline committed and tagged `course-base`.*
