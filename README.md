# 🐸 Tode and the Last Lilypad: Flavor Fusion Defense (Roguelite Edition)

> **JetBrains Academy / Coursera Final Project & Custom Extension Submission**  
> **Course:** *Build a Game with an AI Coding Agent*  
> **Engine:** Three.js (`^0.181.2`) • **Bundler:** Vite (`^7.2.4`) • **Audio:** Web Audio API Procedural Synthesis  
> **Asset Policy:** 100% Royalty-Free Procedural 3D Geometry & Web Audio Synthesizers (Zero external 3D models or audio samples).

---

## 🌟 1. Project Overview & Pitch

**Tode and the Last Lilypad** is an isometric 3D action roguelite defense game. You play as **Tode**, an amphibious pond guardian defending 5 vulnerable tadpoles from greedy garden invaders: sneaky **Gnomes**, heavily shielded **Armored Beetles**, erratic dive-bombing **Wasps**, swooping **Crows**, and the climactic 3-phase **Lawn Mower King** boss.

Instead of standard weapons, Tode commands the **Flavor Fusion Engine**:
1. **Snatch** elemental bugs (Ember, Frost, Spark, and Golden Wildcards) hovering above the pond with an elastic tongue.
2. **Digest & Mix** 2 (or 3 with perks) bugs in Tode's stomach to brew alchemical fusions (Thermal Shock, Glacier Freezes, Chain Lightning, Steam Blinds, Plasma Flares, and Superconductors).
3. **Spit** elemental projectiles, **Charge a Ground Shockwave** to flip armored carapaces and shatter frozen foes, or leap into the stratosphere for an explosive **Meteor Slam**!
4. **Draft Roguelite Perks** at the end of each wave via the **Bug Buffet** draft to customize your build.

---

## 🧭 2. Quick Controls Guide

| Input | Action | In-Depth Mechanics |
| :--- | :--- | :--- |
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or <kbd>Arrow Keys</kbd> | **Hop Movement** | Analog-feel hopping cycle with landing squash & stretch physics |
| <kbd>Mouse Aim</kbd> | **Ground Aiming** | Real-time ground raycast cursor aiming; Tode faces your cursor instantly |
| <kbd>Q</kbd> or <kbd>Left Click</kbd> | **Tongue Snatch** | Extend tongue to capture bugs, snatch weak spots, or swat pests |
| <kbd>R</kbd> or <kbd>Right Click</kbd> | **Spit Fusion Projectile** | Fire current stomach fusion attack towards cursor |
| <kbd>Spacebar</kbd> (Hold & Release) | **Ground Shockwave** | Radial seismic wave: flips Armored Beetles, shatters frozen foes |
| <kbd>E</kbd> (at 100% Meter) | **Ultimate Meteor Slam** | Soar into the air and slam down with camera shake and massive radial AoE |
| <kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd> | **Draft Perk** | Pick perks during the between-wave Bug Buffet glassmorphism modal |
| <kbd>C</kbd> or Codex Button | **Fusion Codex** | Toggle 9-entry interactive modal tracking discovered recipe cards |
| <kbd>~</kbd> or <kbd>\`</kbd> | **Debug Console** | Open debug harness overlay to test any wave, spawn boss, or toggle perks |
| <kbd>📅 Daily</kbd> Header Button | **Daily Challenge Mode** | Toggle deterministic Mulberry32 seeded run for today's global seed |
| <kbd>🔊</kbd> Header Button | **Mute / Unmute** | Toggle procedural Web Audio soundscape |

---

## 🍲 3. The Flavor Fusion Codex

Tode's stomach mixes elements in real time. Combine elements to trigger devastating elemental combos:

| Recipe | Fusion Name | Combat Behavior & Tactical Effect |
| :--- | :--- | :--- |
| **Ember + Ember** | 🔥 **Inferno Puddle** | Creates a lingering molten flame patch that rapidly burns passing enemies. |
| **Frost + Frost** | 🧊 **Glacier Freeze** | Deep freezes enemies solid in blocks of ice. **Spacebar Shockwave** shatters them instantly for double score! |
| **Spark + Spark** | ⚡ **Chain Lightning** | High-voltage electrical arc that branches across multiple nearby garden pests. |
| **Ember + Frost** | 💨 **Steam Blind** | Thick billow of thermal steam that blinds attackers and grounds aerial Wasps and Crows. |
| **Ember + Spark** | 💥 **Plasma Flare** | High-damage piercing thermal orb that incinerates straight lanes of enemies. |
| **Frost + Spark** | 🧲 **Superconductor** | High-intensity electromagnetic pulse causing wide-area cryo-stuns. |
| **Crumb Combinations** | 🥖 **Breadcrumb Decoy** | Drops an irresistible lure that draws Gnomes away from abducted tadpoles. |
| **Golden Dragonfly** | ✨ **Wildcard** | Acts as an automatic duplicate of any accompanying flavor element. |

> **Pond Dip**: Need to dump your stomach? Stand in the center pond water disc to flush your stomach, triggering a refreshing water sparkle and chime!

---

## 🃏 4. "Bug Buffet" Roguelite Perk System

Between waves (starting after Wave 1), Tode chooses from a 3-card draft of game-changing roguelite perks:

* 👝 **Third Stomach Slot**: Expands stomach capacity from 2 to 3 bugs, unlocking 3-element mega-combos!
* 🗣️ **Echo Spit**: Every spit attack fires a secondary duplicate projectile 80ms later at no extra cost.
* 💥 **Burp Boom**: Overfilling Tode's stomach triggers a sonic burp explosion that knocks back and damages nearby foes.
* ⚡ **Sticky Tongue**: Increases tongue reach and speed by +25%.
* 🌊 **Pond Blessing**: Standing in the sacred pond steadily regenerates health and ultimate energy.
* 👑 **Dragonfly Gourmet**: Increases spawn rates of rare Golden Dragonfly wildcards.
* 👢 **Springy Legs**: Boosts hopping movement speed and hop recovery velocity by +20%.
* 🛡️ **Iron Gut**: Reduces incoming enemy damage by 25%.
* ❄️ **Permafrost**: Increases enemy freeze duration from 4s to 7s.
* ⚡ **Overcharge**: Shockwaves discharge secondary crackling lightning rings.
* 💖 **Tadpole Harmony**: Extends the time tadpoles survive when dragged toward the perimeter by thieves.

---

## 👾 5. Complete Bestiary & The Lawn Mower King

| Enemy | Threat | Behavior & Tactics |
| :--- | :---: | :--- |
| **Gnome Raider** | 🟢 Normal | Sprints toward the pond, scoops up a swimming tadpole, and dashes toward the perimeter. Slay them before they escape! |
| **Armored Beetle** | 🟡 Heavy | Frontal carapace provides 100% damage immunity. **Hold Spacebar** to unleash a shockwave that flips it onto its back for 3.5 seconds, exposing its soft underbelly! |
| **Stinger Wasp** | 🟠 Aerial | Weaves along sinusoidal aerial trajectories, hovering before dive-bombing Tode. Vulnerable to Steam clouds and Chain Lightning. |
| **Pond Crow** | 🔴 Fierce | Circles at high altitude casting a growing ground shadow telegraph before swooping down. Can be snatched mid-dive with Tode's tongue! |
| **Lawn Mower King** | 💀 Apex (Wave 10) | **3-Phase Mechanical Boss**:<br>• *Phase 1*: High-speed linear charge attacks with ground telegraph lanes.<br>• *Phase 2*: Spinning blade fury radiating cutting sparks.<br>• *Phase 3*: Desperation summons + rear fuel-can weak spot vulnerable to tongue snatches! |

---

## 🎨 6. Visual Quality & The Toy Diorama Shader

In alignment with the challenge guidelines, visual appeal is balanced with high-performance execution:
- **Toy Diorama Post-Processing Shader (`PostFX.js`)**:
  - **Tilt-Shift Depth Blur**: Simulates macro-lens tilt-shift miniature camera optics, giving the pond a charming toy-like diorama aesthetic.
  - **Warm Color Grading**: Lifted warm shadows and sunny garden highlights that dynamically adapt across morning, noon, dusk, and nighttime wave transitions.
  - **Radial Vignette**: Gentle cinematic framing keeping player attention focused on the center pond.
  - **Adaptive Quality Scaling (`QualityManager.js`)**: Automatically benchmarks frame rates and shifts between `high`, `medium`, and `low` (bypassing post-processing if hardware drops below 50 FPS) to guarantee smooth 60 FPS on all machines.

---

## 🎵 7. 100% Procedural Audio Engine (`Audio.js`)

Zero external sound files (`.mp3` or `.wav`) are loaded. Every sound effect and musical note is procedurally generated using the native browser Web Audio API:
- **Procedural BGM**: Harmonic ambient chords that shift pitch, tempo, and scale according to the time of day (Morning, Noon, Dusk, Night, and Boss Arena).
- **Boss Arena Percussion**: Synthetic kick drum and noise-snare pulse active during the Lawn Mower King showdown.
- **Dynamic SFX**: Pitch-swept square waves for tongue flicks, bandpass noise for water splashes, harmonic chimes for pond dips, low-frequency sine sweeps for shockwaves, and resonance-filtered burps.

---

## 🧪 8. Verification, Testing & Build Instructions

### Installation
```bash
npm install
```

### Run Development Server
```bash
npm run dev
# Opens Vite dev server on http://localhost:5173/
```

### Run Automated Data & Schema Tests
```bash
npm test
# Validates flavors.json, fusions.json, enemies.json, waves.json, perks.json, phases.json, and codex.json
```

### Production Build
```bash
npm run build
# Compiles minified, optimized production bundle in dist/
```

### Preview Production Build
```bash
npm run preview
# Serves the compiled dist/ directory locally
```

---

## 🏛️ 9. Evaluation Jury Guide & Criteria Alignment

| Evaluation Criteria | Implementation Highlights | Verification Method |
| :--- | :--- | :--- |
| **1. Completeness & Runnable Baseline** | Clean Vite build, zero console errors, 60 FPS performance, complete tutorial and wave progression. | Run `npm run build` & `npm test`. Both pass cleanly. |
| **2. Novel Extension Quality** | Multi-gate roguelite expansion gated under `GAME_CONSTANTS.EXTENSION_ENABLED: true`. Includes the Bug Buffet perk draft, 3rd stomach slot, 9-entry Fusion Codex modal, and Daily Challenge seeded PRNG. | Toggle `GAME_CONSTANTS.EXTENSION_ENABLED` in `src/constants.js`. |
| **3. Gameplay & Balance** | 10 handcrafted waves with pacing curve, enemy diversity, tadpole rescue priority, counterplay mechanics (shockwave flipping, weak-spot snatches), and Endless Mode loop (Wave 11+). | Play through waves or jump to any wave using the `<kbd>~</kbd>` debug harness. |
| **4. Creativity & Originality** | The Flavor Fusion crafting loop turns simple eating into an active tactical puzzle, reinforced by procedurally synthesized audio and toy diorama styling. | Combine bugs in Tode's stomach to test all 9 distinct fusion recipes. |
| **5. Technical Execution** | 100% royalty-free procedural Three.js geometry and Web Audio synthesis (zero third-party assets). Clean separation across EventBus, StateMachine, SaveManager, and QualityManager. | Inspect `src/components/Audio.js`, `src/components/PostFX.js`, and `src/core/*`. |

### Debug Harness Quick-Access (`window.__tode`)
Press <kbd>~</kbd> in-game or open the browser developer console:
- `window.__tode.setWave(5)` — Jump directly to Wave 5.
- `window.__tode.setWave(10)` — Jump directly to Wave 10 Boss Lawn Mower King.
- `window.__tode.addPerk('third_stomach')` — Instantly grant the 3rd stomach slot.
- `window.__tode.killAll()` — Clear current active enemies.
- `window.__tode.godMode()` — Toggle invulnerability.

---

*JetBrains Academy / Coursera "Build a Game with an AI Coding Agent" Project.*
