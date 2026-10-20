# 🐸 Tode and the Last Lilypad: Flavor Fusion Defense (v3 Evolution & Animation Overhaul)

> **JetBrains Academy / Coursera Final Project & Custom Extension Submission**  
> **Course:** *Build a Game with an AI Coding Agent*  
> **Engine:** Three.js (`^0.181.2`) • **Bundler:** Vite (`^7.2.4`) • **Audio:** Web Audio API Procedural Synthesis  
> **Asset Policy:** 100% Royalty-Free Procedural 3D Geometry & Web Audio Synthesizers (Zero external 3D models or audio samples).

---

## 🌟 1. Project Overview & Pitch

**Tode and the Last Lilypad** is an isometric 3D action roguelite defense game. You play as **Tode**, an amphibious pond guardian defending 5 vulnerable tadpoles from greedy garden invaders: sneaky **Gnomes**, heavily shielded **Armored Beetles**, erratic dive-bombing **Wasps**, swooping **Crows**, and the climactic 3-phase **Lawn Mower King** boss.

### 🧬 What's New in v3: Evolution by Appetite & The Animation Overhaul
In v3, progression replaces the v2 card-pick perk draft with **Diet-Driven Biological Evolution**:
1. **You Are What You Eat:** Tode's body, skin tint, procedural visual attachments, and combat passives transform dynamically based on his elemental diet (Ember 🔥, Frost ❄️, Spark ⚡).
2. **12 Evolved Forms & Hybrids:** 9 elemental stage forms (Stage 1, Stage 2, Apex) and 3 hybrid apex forms (**Steam Toad**, **Plasma Toad**, and **Aurora Toad**).
3. **The Evolution Beat:** A cinematic transformation moment slowing down world time, playing procedural riser synthesizers, and granting complete invulnerability.
4. **Secret Recipes & 18s Feasts:** 8 hidden 3-bug eating sequences trigger temporary high-octane Feast transformations, accompanied by cryptic rhyming hints from the Old Toad Sage and global first-discoverer credit on Firebase Firestore.
5. **Procedural Spline Tongue & Animation Engine:** 10-point physics spline tongue with wave wobble and sag (`TongueRope.js`), anchor rig (`FrogRig.js`), 11 core animation clips (`clips.json`), and an interactive **Animation Lab** (`?lab=1`).
6. **End-of-Game Run Portrait:** Interactive run pedestal summary with one-click high-resolution PNG export (`PortraitModal`).

---

## 🧭 2. Quick Controls Guide

| Input | Action | In-Depth Mechanics |
| :--- | :--- | :--- |
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or <kbd>Arrow Keys</kbd> | **Hop Movement** | Analog-feel hopping cycle with landing squash & stretch physics |
| <kbd>Shift</kbd> + <kbd>WASD</kbd> | **Turn in Place** | Pivot facing direction without hopping |
| <kbd>Mouse Aim</kbd> | **Ground Aiming** | Real-time ground raycast cursor aiming; Tode faces your cursor instantly |
| <kbd>Q</kbd> or <kbd>Left Click</kbd> | **Tongue Snatch** | Extend procedural physics tongue spline to capture bugs, snatch weak spots, or swat pests |
| <kbd>R</kbd> or <kbd>Right Click</kbd> | **Spit Fusion Projectile** | Fire current stomach fusion attack towards cursor |
| <kbd>Spacebar</kbd> (Hold & Release) | **Ground Shockwave** | Radial seismic wave: flips Armored Beetles, shatters frozen foes |
| <kbd>E</kbd> (at 100% Meter) | **Ultimate Meteor Slam** | Soar into the air and slam down with camera shake and massive radial AoE |
| <kbd>C</kbd> or Codex Button | **Encyclopedia Codex** | Toggle 3-tab interactive modal: Fusions, Evolved Forms, and Secret Recipes |
| <kbd>~</kbd> or <kbd>\`</kbd> | **Debug Console** | Open debug harness overlay to test any wave, spawn boss, or toggle forms |
| <kbd>📅 Daily</kbd> Header Button | **Daily Challenge Mode** | Toggle deterministic Mulberry32 seeded run for today's global seed |
| <kbd>🔊</kbd> Header Button | **Mute / Unmute** | Toggle procedural Web Audio soundscape |

---

## 🧬 3. Evolution by Appetite (v3 System)

### 3.1 Diet Affinities & Thresholds
Eating bugs builds affinity points toward three elemental flavors:
* 🔥 **Ember** (+3 per swallow): Aggressive burn auras, magma freckles, and trailing fire patches.
* ❄️ **Frost** (+3 per swallow): Cryo-armor, icicle crowns, and shattering freeze shards.
* ⚡ **Spark** (+3 per swallow): High-voltage antennae, shock motes, and chain-arc discharges.
* ✨ **Golden Wildcard** (+2 to all three): Multi-affinity balance.

**Thresholds:**
* **Stage 1 (20 pts):** Subtle skin shift and initial procedural attachment (freckles, rime, spark antennae).
* **Stage 2 (50 pts):** Distinct body geometry, horns/crest, and active combat passive.
* **Apex (90 pts):** Full elemental mastery, prominent visual crowns, and game-altering abilities.

### 3.2 Dual-Element Hybrid Forms
When two elemental meters both reach **Stage 2 (50 pts)**, Tode undergoes dual fusion into an Apex Hybrid:
* 💨 **Steam Toad** (Ember 50 + Frost 50): Thermal steam aura that continuously blinds and sears nearby pests.
* 💥 **Plasma Toad** (Ember 50 + Spark 50): Twin high-voltage orbiting plasma motes incinerating invaders.
* 🌌 **Aurora Toad** (Frost 50 + Spark 50): Prismatic crystal shards that chain-arc electricity upon enemy shatter.

---

## 🍲 4. Secret Recipes & 18-Second Feasts

Eating bugs within a **12-second chaining window** checks against 8 ancient culinary sequences:

| Recipe Name | Required Diet | Feast Effect (18s Duration) |
| :--- | :--- | :--- |
| 🔥 **Bonfire Feast** | Ember + Ember + Ember | Giant flame tongue, fiery hop trails, and continuous burn aura. |
| ❄️ **Coldsnap Chill** | Frost + Frost + Frost | Deep freeze aura, double ice projectile firing, and frost shield. |
| ⚡ **Thunder Banquet** | Spark + Spark + Spark | Rapid chain-lightning discharge on every hop. |
| ♨️ **Sauna Simmer** | Ember + Frost + Ember | Massive steam cloud that blinds and slows all approaching enemies. |
| 🍧 **Slush Surprise** | Frost + Spark + Frost | Cryo-electric nova detonating across the entire garden pond. |
| 🎆 **Garden Fireworks** | Spark + Ember + Spark | Multi-directional piercing spark rockets. |
| 🌈 **Rainbow Tasting Menu** | Ember + Frost + Spark (Any Order) | Tri-elemental vortex, +30% movement speed, and triple score multiplier. |
| 👑 **Royal Banquet** | Golden + Golden + Any | Golden invulnerability and instant max-charge ultimate slams. |

* **Signature Dishes:** Cook any recipe 3 times across your career to permanently unlock its passive buff!
* **Sage Whispers:** Old Toad Sage offers cryptic rhyming hints between waves (filtered to exclude recipes you've already found).
* **First Discoverer Credit:** Claims first-ever discovery to Firebase Firestore (`recipes/{recipeId}`) with graceful offline fallback.

---

## 🛠️ 5. Animation Lab & Showcase URL Parameters

* **`?lab=1` (Animation Lab):** Opens the interactive standalone animation sandbox. Inspect all 11 procedural clips (`idle_breathe`, `hop`, `snatch_hit`, `snatch_miss`, `gulp_throat`, `spit_recoil`, `shockwave_stomp`, `meteor_slam`, `hurt_recoil`, `burp_puff`, `death_flop`), scrub playback speed, test loop toggles, and view bone anchors.
* **`?showcase=1` (Jury Showcase Preset):** Immediately starts at Wave 4 with Ember 55 / Frost 30 affinity, active discoveries ready in Codex, and nearby bug spawns for instant evaluation within 30 seconds.

---

## 📸 6. Game Over Run Portrait Exporter

When a run concludes, the **Run Portrait Modal** automatically summarizes your achievement:
* **Active Evolved Form** with elemental badge and styling.
* **Affinity Meters Breakdown** (Ember %, Frost %, Spark %).
* **Secret Recipes Cooked** and final score/wave statistics.
* **📸 Save Portrait (PNG):** Composes and downloads a high-resolution canvas snapshot complete with watermark banner and run stats.

---

## 👾 7. Bestiary & Invader Tactics

| Enemy | Threat | Behavior & Tactics |
| :--- | :---: | :--- |
| **Gnome Raider** | 🟢 Normal | Sprints toward the pond, scoops up a swimming tadpole, and dashes toward the perimeter. Slay them before they escape! |
| **Armored Beetle** | 🟡 Heavy | Frontal carapace provides 100% damage immunity. **Hold Spacebar** to unleash a shockwave that flips it onto its back for 3.5 seconds, exposing its soft underbelly! |
| **Stinger Wasp** | 🟠 Aerial | Weaves along sinusoidal aerial trajectories, hovering before dive-bombing Tode. Vulnerable to Steam clouds and Chain Lightning. |
| **Pond Crow** | 🔴 Fierce | Circles at high altitude casting a growing ground shadow telegraph before swooping down. Can be snatched mid-dive with Tode's tongue! |
| **Lawn Mower King** | 💀 Apex (Wave 10) | **3-Phase Mechanical Boss**:<br>• *Phase 1*: High-speed linear charge attacks with ground telegraph lanes.<br>• *Phase 2*: Spinning blade fury radiating cutting sparks.<br>• *Phase 3*: Desperation summons + rear fuel-can weak spot vulnerable to tongue snatches! |

---

## 🎵 8. Procedural Audio Engine (`Audio.js`)

Zero external audio files (`.mp3` or `.wav`) are loaded. Every sound effect is procedurally generated using the native browser Web Audio API:
* **Flavor-Pitched Gulps:** Throat swallow tones shift pitch dynamically based on element (Ember low/warm, Frost crisp/bright, Spark rapid/chirpy).
* **Snatch Dynamics:** Distinct audible feedback between satisfying tongue hits and deflating tongue miss flops.
* **Evolution Synthesizers:** Exponential frequency riser for evolution anticipation and resonant cymbal-style flash on form unlock.
* **Feast Stingers:** Multi-oscillator fanfares and Old Toad Sage wind chime whispers.
* **Procedural BGM:** Time-of-day responsive harmonic chords (Morning, Noon, Dusk, Night, and Boss Arena).

---

## 🧪 9. Automated Testing & Build Instructions

### Installation
```bash
npm install
```

### Run Development Server
```bash
npm run dev
# Opens Vite dev server on http://localhost:5173/
```

### Run Automated Acceptance Suite (23 Criteria)
```bash
npm test
# Validates all Data JSON schemas and executes the 23-criteria v3 acceptance suite
```

### Direct Acceptance Runner
```bash
npm run test:acceptance
```

### Production Build
```bash
npm run build
# Compiles minified, code-split production bundle in dist/
```

### Preview Production Build
```bash
npm run preview
# Serves the compiled dist/ directory locally
```

---

## 🏛️ 10. Evaluation Jury Guide & Criteria Alignment

| Evaluation Criteria | Implementation Highlights | Verification Method |
| :--- | :--- | :--- |
| **1. Completeness & Baseline** | Clean Vite build, zero console errors, 60 FPS performance, complete wave progression, boss fight, and victory loop. | Run `npm run build` & `npm test`. Both pass cleanly. |
| **2. Diet-Driven Evolution** | Replaced card-pick draft with appetite-driven growth. 12 distinct forms with data-driven passives, visual attachments, and cinematic Evolution Beat. | Play normally or test forms via `window.__tode.evolve('ember', 2)`. |
| **3. Secret Recipes & Feasts** | 8 secret sequences, 12s chaining window, 18s Feasts, Old Toad Sage whispers, and Firebase first-discoverer credit. | Test via `window.__tode.cook('bonfire')` or `window.__tode.whisper()`. |
| **4. Animation Quality** | Custom 10-point spline physics tongue (`TongueRope.js`), anchor rig (`FrogRig.js`), 11 core animation clips, and Animation Lab. | Visit `http://localhost:5173/?lab=1` to inspect all clips. |
| **5. Technical Execution** | 100% procedural Three.js geometry and Web Audio synthesis (zero external models/audio). Clean separation across EventBus, StateMachine, SaveManager, and QualityManager. | Inspect `src/components/Audio.js`, `src/render/FrogRig.js`, and `src/anim/*`. |

### Debug Console Helpers (`window.__tode`)
Open browser console or press <kbd>~</kbd>:
- `window.__tode.showcase()` — Activate Showcase Mode (Wave 4, Ember 55, Frost 30).
- `window.__tode.setAffinity(element, value)` — Set Ember, Frost, or Spark affinity (0-100).
- `window.__tode.evolve(element, stage)` — Immediately trigger evolution beat for stage 1, 2, or 3.
- `window.__tode.showForm(formId)` — Instant visual attachment preview (e.g. `'steam'`, `'plasma'`, `'ember_3'`).
- `window.__tode.cook(recipeId)` — Instantly trigger an 18-second Feast.
- `window.__tode.whisper()` — Trigger an Old Toad Sage hint.
- `window.__tode.playClip(clipId)` — Play any animation clip (`'gulp_throat'`, `'death_flop'`, etc.).

---

*JetBrains Academy / Coursera "Build a Game with an AI Coding Agent" Project.*
