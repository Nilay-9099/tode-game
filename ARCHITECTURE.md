# 🏗️ ARCHITECTURE.md — Tode and the Last Lilypad

> **System Audit & Technical Architecture Document (v3: Evolution by Appetite, Secret Recipes & Animation Overhaul)**  
> **Audited by:** Agent 0 (Senior Systems Architect)  
> **Target System:** JetBrains Academy / Coursera Course Project ("Build a Game with an AI Coding Agent")  
> **Repository Root:** `C:\Users\nilay\WebstormProjects\Build a Game with an AI Coding Agent\game`  
> **Base Tag:** `v2-base` (Commit: `790eda7`)

---

## 1. Engine, Libraries, and Environment

| Component | Technology | Version | Location / Config |
| :--- | :--- | :--- | :--- |
| **3D Engine** | Three.js | `^0.181.2` | `game/package.json` |
| **Bundler & Dev Server** | Vite | `^7.2.4` (running `v7.3.7`) | `game/package.json` |
| **Module Format** | ECMAScript Modules (ESM) | Native browser ESM | `"type": "module"` in `package.json` |
| **Audio Engine** | Web Audio API | Native browser W3C spec | `src/components/Audio.js` (100% procedural oscillators, noise, and chord generators) |
| **Post-Processing** | Three.js EffectComposer | Built-in JSM passes | `src/components/PostFX.js` (Toy diorama tilt-shift depth blur, color grade, vignette) |
| **Target Platforms** | Modern Browsers | Chrome, Edge, Firefox, Safari | WebGL 2.0 / Web Audio compliant |
| **Backend / DB** | Firebase / Firestore | `^13.0.0` | `src/net/firebase.js` & `src/net/discoveries.js` |

---

## 2. Current Project Folder & Module Map (as of `v2-base`)

```
game/
├── index.html                     # Application entry HTML & HUD DOM overlays
├── package.json                   # Dependencies (Three.js, Vite, Firebase) & scripts (dev, build, preview, test)
├── README.md                      # Public project documentation & jury guide
├── ARCHITECTURE.md                # [This file] Complete architectural audit & v3 plan
├── tests/
│   └── data-validation.js         # Automated JSON schema and sanity test runner
├── public/
│   ├── tode.svg                   # Browser favicon
│   └── models/
│       ├── tode.glb               # Hero frog 3D model
│       ├── small_house.glb        # Cottage house 3D obstacle model
│       └── enemy.glb              # Legacy course enemy model
└── src/
    ├── main.js                    # Game entry point, master animation loop, event wiring
    ├── constants.js               # Centralized gameplay numbers, colors, recipes (LEGACY_PERKS: false)
    ├── eventBus.js                # Decoupled publish/subscribe event coordinator (V3_EVENTS catalog)
    ├── style.css                  # HUD styles, glassmorphism modals, animations, typography
    ├── core/
    │   ├── Debug.js               # In-game QA harness (`window.__tode`) & performance overlay
    │   ├── Loop.js                # Fixed timestep physics/gameplay accumulator
    │   ├── Quality.js             # Dynamic performance scaler (FPS tracking, High/Medium/Low tiers)
    │   ├── Rng.js                 # Mulberry32 deterministic seeded PRNG
    │   ├── Save.js                # LocalStorage persistent save manager (`tode_save_v2`)
    │   └── StateMachine.js        # Formal FSM (BOOT, TITLE, TUTORIAL, RUN, VICTORY, GAME_OVER)
    ├── data/
    │   ├── codex.json             # 9-entry elemental fusion codex definitions
    │   ├── enemies.json           # Enemy stats, health, speed, and scoring
    │   ├── flavors.json           # Bug flavor definitions (Ember, Frost, Spark, Crumb)
    │   ├── fusions.json           # Dual-element fusion projectile & hazard recipes
    │   ├── perks.json             # Legacy Bug Buffet perk definitions (kept behind flag)
    │   ├── phases.json            # Day/Night lighting and atmosphere configurations
    │   ├── waves.json             # Data-driven waves 1-10 spawn queues and boss parameters
    │   ├── evolution.json         # [v3 Scaffold] Affinity gains and stage thresholds (20, 50, 90)
    │   ├── forms.json             # [v3 Scaffold] 12 evolutionary forms (tints, passives, attachments)
    │   ├── recipes.json           # [v3 Scaffold] 8 secret 3-bug recipes and Feast effects
    │   └── anim/
    │       └── clips.json         # [v3 Scaffold] Animation keyframe tracks and timed event cues
    ├── net/
    │   └── firebase.js            # Firebase app initialization, anonymous auth, Firestore leaderboards
    ├── utils/
    │   └── prng.js                # Seeded PRNG helpers for daily challenge
    └── components/
        ├── Atmosphere.js          # Dynamic day/night sun, fog, ambient lighting transitions
        ├── Audio.js               # Procedural Web Audio API sound & music synthesis
        ├── Bugs.js                # Elemental bugs (Ember, Frost, Spark, Crumb, Golden Dragonfly)
        ├── Camera.js              # Perspective camera, smooth follow, trauma shake, FOV punch
        ├── Enemies.js             # Enemy hierarchy (Gnomes, Beetles, Wasps, Crows, Lawn Mower King)
        ├── FloatingText.js        # 3D-to-screen projected arcade floating damage/score text
        ├── Fusion.js              # Elemental projectile behaviors, ground hazards, AoE
        ├── House.js               # Cottage houses with 2D circular collision footprints
        ├── Map.js                 # Arena ground, anisotropic grass texture, rim stones, sacred pond
        ├── Particles.js           # Pooled particle emitters (sparks, dust, bursts, explosions)
        ├── Perks.js               # Legacy perk manager (retained behind LEGACY_PERKS flag)
        ├── Player.js              # Tode controller, hops, squash/stretch, shockwave, slam
        ├── PostFX.js              # Toy diorama single-pass tilt-shift blur & warm tone grading
        ├── Renderer.js            # Three.js WebGLRenderer, PCFSoftShadowMap, pixel ratio
        ├── Stomach.js             # 2/3 slot stomach, digest countdowns, burp knockback, streaks
        ├── Tadpoles.js            # 5 swimming pond tadpoles with abduction & rescue mechanics
        ├── TutorialTarget.js      # Wave 0 training scarecrow dummy
        └── UI.js                  # HUD updates, codex modal, phase banner, victory modal
```

---

## 3. v3 Architecture: Progression & Animation Overhaul

### 3.1 What v3 Replaces & Adds
1. **Replaces Card Perks with Evolution by Appetite**: The card-pick "Bug Buffet" modal between waves is retired behind `GAME_CONSTANTS.LEGACY_PERKS = false`. Progression now stems directly from **what Tode swallows**.
2. **Evolution by Appetite (12 Forms)**:
   - Three affinity meters: **Ember**, **Frost**, **Spark** (0 to 100).
   - Stages: **Stage 1 at 20**, **Stage 2 at 50**, **Apex at 90**.
   - Dual-element hybrids unlock when two elements hit Stage 2 (`steam`, `plasma`, `aurora`).
   - Every form features a distinct silhouette, skin tint, emissive glow, attachment meshes, and data-driven passive modifiers (`spitTrail`, `snatchStatus`, `burpDamage`, `aura`, etc.).
3. **Secret Recipes & Feasts (8 Dishes)**:
   - Rolling history of last 3 swallowed bugs within a 12-second chaining window.
   - Matching a secret recipe immediately triggers an 18-second **Feast** transformation.
   - Repeating a recipe 3 times in one run unlocks a permanent **Signature Dish** passive.
   - Cryptic "Recipe Whispers" from the Old Toad Sage guide players during intermissions.
4. **Full Animation System & Animation Lab**:
   - Generic animation toolkit: `Tween`, `Easing`, `Spring`, `Timeline`, `ClipPlayer`, and `AnimDirector`.
   - Dedicated debug scene at `?lab=1` allowing instant scrubbing, looping, and 0.25x slow-motion inspection.
   - Living world: Tode eating choreography (snatch rope, gulp throat bulge, spit cheeks), bug panic flutter, enemy spawn/telegraph squashes, and interactive pond ripples.

---

## 4. Module Specifications & File Ownership (Sections 5.1 & 5.2)

To ensure zero-conflict parallel execution across Agents A, B, and C:

```
                           ┌─────────────────────────────────────────┐
                           │          LEAD / SHARED                  │
                           │ src/main.js, constants.js, eventBus.js, │
                           │ core/StateMachine.js, Loop.js, Save.js  │
                           └────────────────────┬────────────────────┘
               ┌────────────────────────────────┼────────────────────────────────┐
               ▼                                ▼                                ▼
   ┌───────────────────────┐        ┌───────────────────────┐        ┌───────────────────────┐
   │        AGENT A        │        │        AGENT B        │        │        AGENT C        │
   │ Gameplay & Simulation │        │ Rendering & Animation │        │ UI, Audio & Backend   │
   ├───────────────────────┤        ├───────────────────────┤        ├───────────────────────┤
   │ • src/data/           │        │ • src/anim/           │        │ • src/ui/             │
   │   - evolution.json    │        │   - Tween.js          │        │   - AffinityBars.js   │
   │   - forms.json        │        │   - Easing.js         │        │   - FormChip.js       │
   │   - recipes.json      │        │   - Spring.js         │        │   - EvolutionBanner.js│
   │ • src/sim/            │        │   - Timeline.js       │        │   - WhisperToast.js   │
   │   - Affinity.js       │        │   - ClipPlayer.js     │        │   - CodexScreen.js    │
   │   - Evolution.js      │        │   - AnimDirector.js   │        │   - Portrait.js       │
   │   - Passives.js       │        │   - TodeAnimator.js   │        │ • src/audio/          │
   │   - Recipes.js        │        │   - EnemyAnimator.js  │        │   - Audio.js (v3 sfx) │
   │   - Feast.js          │        │   - BugAnimator.js    │        │ • src/net/            │
   │ • tests/data-val.js   │        │   - UiTweens.js       │        │   - discoveries.js    │
   │                       │        │   - Lab.js (?lab=1)   │        │                       │
   │                       │        │ • src/data/anim/      │        │                       │
   │                       │        │   - clips.json        │        │                       │
   │                       │        │ • src/render/         │        │                       │
   │                       │        │   - FrogRig.js        │        │                       │
   │                       │        │   - TongueRope.js     │        │                       │
   │                       │        │   - FormVfx.js        │        │                       │
   └───────────────────────┘        └───────────────────────┘        └───────────────────────┘
```

### 4.1 Agent A: Simulation & Data (`src/sim/`, `src/data/`)
- `src/sim/Affinity.js`: Tracks Ember, Frost, Spark meters (0-100), applies gains on bug swallow / fusion spit / kills, tests stage thresholds (20, 50, 90), and emits `affinity:changed` and `evolution:threshold`.
- `src/sim/Evolution.js`: Manages active forms, hybrid resolution (top 2 elements at Stage 2), queues simultaneous threshold triggers, handles the `EVOLUTION_BEAT` overlay state with timeScale easing, and prevents player death during evolution.
- `src/sim/Passives.js`: Generic data-driven registry for all 12 passive types (`spitTrail`, `hopTrail`, `snatchStatus`, `snatchExtraTarget`, `burpDamage`, `aura`, `chainBonus`, `shatterShards`, `slamVariant`, `statusAmp`, `fusionMod`, `orbitingMotes`). Exposes clean hooks for player, tongue, stomach, and fusion systems.
- `src/sim/Recipes.js`: Tracks rolling 3-bug history with a 12-second chain timeout. Matches ordered and unordered sequences. Manages Signature Dishes (3 cooks) and selects one undiscovered recipe whisper per intermission.
- `src/sim/Feast.js`: Timed player status applying buff effects during the 18s Feast duration, ticking countdowns, and cleaning up safely.

### 4.2 Agent B: Technical Animation & Rendering (`src/anim/`, `src/render/`)
- `src/anim/Tween.js` & `Easing.js`: Non-allocating tween manager with dual timeScale modes: `world` (affected by hit-stop/evolution slow-mo) and `real` (unaffected UI/vignette timing).
- `src/anim/Spring.js` & `Timeline.js`: Critically damped springs for squashes, follow camera, and parallel keyframe sequencing.
- `src/anim/ClipPlayer.js`: Reads `src/data/anim/clips.json` to play keyframed tracks and dispatch timed events (`sfx`, `hitstop`, `vfx`, `shake`).
- `src/anim/AnimDirector.js`: Central event bus listener. Maps gameplay events (`bug:snatched`, `spit:fired`, `evolution:started`) to target entity clips. **Gameplay never calls animation directly.**
- `src/anim/Lab.js`: Interactive Animation Lab loaded via `?lab=1`. Inspects any clip with live scrubbing, 0.25x slow-motion, and model visualization.
- `src/render/FrogRig.js`: Anchor point system on Tode's model (`back`, `belly`, `cheeks`, `head`, `legs`, `eyes`, `tongueTip`) applying procedural layer tints, emissive spots, pooled attachment meshes, and idle animations.
- `src/render/TongueRope.js`: Procedural spline rope (10-point Hermite/Catmull-Rom curve) with realistic sag, damped wave wobble, and velocity stretch.
- `src/render/FormVfx.js`: Form-specific VFX (fire trails, icy footprints, spark motes, steam clouds).

### 4.3 Agent C: UI, Audio & Network (`src/ui/`, `src/audio/`, `src/net/`)
- `src/ui/AffinityBars.js`: Three-element glassmorphic progress meters positioned under the stomach HUD with threshold markers and fill sparkles.
- `src/ui/FormChip.js`: Compact badge displaying current form name and icon with pop animation.
- `src/ui/EvolutionBanner.js`: Elastic slide-in banner announcing stage name and passive subtitle during the Evolution Beat.
- `src/ui/WhisperToast.js`: Old Toad Sage toast displaying cryptic rhyming hints with masked ingredient icons during intermissions.
- `src/ui/CodexScreen.js`: Extended codex modal with Forms tab (12 entries) and Recipes tab (8 entries with silhouettes and first-discoverer credit).
- `src/ui/Portrait.js`: End-of-game diorama pedestal scene with rotating evolved Tode, affinity breakdown, recipes cooked, and a "Save portrait" PNG exporter.
- `src/audio/Audio.js`: New procedural synthesizers for gulps (flavor-tuned pitch), tongue whooshes, evolution risers/chimes, feast stingers, and whisper chimes.
- `src/net/discoveries.js`: Firestore transaction claiming first-ever recipe discoveries (`recipes/{recipeId}`) with local offline fallback.

---

## 5. Event Bus Catalog (`src/eventBus.js`)

All inter-system communication is decoupled across `eventBus`:

| Event Key | Payload Arguments | Originating System | Typical Listeners |
| :--- | :--- | :--- | :--- |
| `affinity:changed` | `(element, value, delta)` | `Affinity.js` | `AffinityBars.js`, `Audio.js` |
| `evolution:threshold` | `(element, stage)` | `Affinity.js` | `Evolution.js` |
| `evolution:started` | `(formId, first, compressed)` | `Evolution.js` | `AnimDirector.js`, `Audio.js`, `UI.js` |
| `evolution:applied` | `(formId)` | `Evolution.js` | `FrogRig.js`, `Passives.js` |
| `evolution:ended` | `()` | `Evolution.js` | `UI.js`, `Camera.js` |
| `form:changed` | `(activeForms, hybrid)` | `Evolution.js` | `FormChip.js`, `Portrait.js` |
| `recipe:progress` | `(history)` | `Recipes.js` | `UI.js` (Recipe strip) |
| `recipe:completed` | `(id, firstEver, count)` | `Recipes.js` | `Feast.js`, `UI.js`, `discoveries.js` |
| `recipe:signature` | `(id)` | `Recipes.js` | `Passives.js`, `UI.js` |
| `feast:started` | `(id, duration)` | `Feast.js` | `AnimDirector.js`, `Audio.js`, `UI.js` |
| `feast:tick` | `(id, remaining)` | `Feast.js` | `UI.js` (Feast countdown) |
| `feast:ended` | `(id)` | `Feast.js` | `AnimDirector.js`, `Audio.js` |
| `recipe:whisper` | `(id, hint)` | `Recipes.js` | `WhisperToast.js`, `Audio.js` |
| `codex:unlocked` | `(id, type)` | `Recipes.js` / `Evolution.js` | `CodexScreen.js`, `Save.js` |
| `anim:request` | `(clipId, target, options)` | Gameplay / Events | `AnimDirector.js` |

---

## 6. Safest Insertion Points in Game Loop (`src/main.js`)

1. **Bootstrap Phase**:
   - Instantiate `Affinity`, `Evolution`, `Passives`, `Recipes`, and `Feast` under a unified `src/sim` director.
   - Instantiate `AnimDirector`, `ClipPlayer`, `FrogRig`, and `TongueRope`.
   - Mount UI overlays (`AffinityBars`, `FormChip`, `EvolutionBanner`, `WhisperToast`).
   - If URL contains `?lab=1`, bypass normal game bootstrap and launch `AnimationLab(renderer, scene)`.
2. **Animation Loop (`renderer.setAnimationLoop`)**:
   - Step 1: Update `Tween.update(realDelta, worldDelta)` respecting the global `timeScale`.
   - Step 2: In `sim.step(dt)`:
     - Update `Feast.update(dt)`
     - Update `Recipes.update(dt)` (tick 12s chaining window)
     - Apply active passives via `Passives.update(dt)`
   - Step 3: `FrogRig.update(delta)` & `TongueRope.update(delta)`.
   - Step 4: `PostFX.render(delta)`.

---

## 7. Phased Implementation Gates (v3)

- **V3-P0 (Audit & Prep)**: Scaffolding created, `v2-base` tagged, `LEGACY_PERKS = false` verified.
- **V3-P1 (Core Animation & Rig)**: Animation Lab (`?lab=1`), tween engine, ClipPlayer, FrogRig anchors, and tongue rope.
- **V3-P2 (Juice & Eating Choreography)**: Snatch, gulp throat bulge, spit cheeks, slot pop UI, and sound sync.
- **V3-P3 (Evolution System)**: Affinity meters, Stage 1 & 2 forms, passives, and the Evolution Beat moment.
- **V3-P4 (Secret Recipes & Feasts)**: 3-bug history, 8 recipes, Feasts, Whispers, Codex expansion, and Firebase discoverer.
- **V3-P5 (Full Living World & Apex)**: Apex forms, hybrids, enemy animations, pond ripples, game over portrait export.
- **V3-P6 (QA & Final Polish)**: Acceptance test suite, performance verification, and documentation.

---

*Verified runnable with Vite v7.3.7 & Three.js v0.181.2. Base state tagged `v2-base`.*
