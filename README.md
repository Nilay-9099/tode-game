# 🐸 Tode and the Last Lilypad: Flavor Fusion Defense

> **Course Final Project & Custom Extension Submission**  
> *Built with Three.js, Vite, and Procedural Web Audio API — 100% Zero Copyrighted External Assets.*

---

## 🌟 1. Project Overview & Pitch

**Tode and the Last Lilypad** is a 3D isometric action-defense arcade game. You play as **Tode**, a valiant pond guardian defending five vulnerable tadpoles against waves of greedy garden pests: sneaky Gnomes, armored Rhinoceros Beetles, dive-bombing Wasps, scavenging Crows, and the mechanical terror — the **Wave 5 Boss Lawn Mower**.

Instead of standard projectile weapons, Tode wields the **Flavor Fusion Engine**:
1. **Snatch** ambient elemental bugs hovering over the pond with your elastic tongue.
2. **Digest & Mix** combinations of two bugs in your stomach to forge powerful alchemical fusions (Thermal Shock, Glacier Blast, Superconductive Arc, or Breadcrumb Decoys).
3. **Spit** devastating elemental bursts, or unleash a **Spacebar Ground Shockwave** and **E-Key Super Frog Slam** to crush invaders and rescue abducted tadpoles before they escape past the garden perimeter!

---

## 🎮 2. Quick Controls

| Control | Action | Details |
| :--- | :--- | :--- |
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or <kbd>Arrow Keys</kbd> | **Hop Movement** | Analog-style 8-directional hop with landing squash & stretch |
| <kbd>Mouse Aim</kbd> | **Aim Direction** | Raycasted ground targeting directly to your cursor |
| <kbd>Q</kbd> or <kbd>Left Click</kbd> | **Tongue Snatch** | Extend tongue to capture bugs or swat pests |
| <kbd>R</kbd> or <kbd>Right Click</kbd> | **Spit Fusion Attack** | Expel combined stomach flavors as an elemental projectile |
| <kbd>Spacebar</kbd> (Hold & Release) | **Ground Shockwave** | Radial seismic ring; flips armored beetles and shatters frozen foes |
| <kbd>E</kbd> (When meter is 100%) | **Ultimate Super Slam** | Tode leaps high into the air and crashes down for massive AoE damage |
| <kbd>📅 Daily</kbd> Header Button | **Daily Challenge Mode** | Toggle deterministic Mulberry32 seeded run for today's global challenge |
| <kbd>🔊</kbd> Header Button | **Mute / Unmute** | Toggle Web Audio procedural soundscape |

---

## 🧪 3. The Flavor Fusion Cookbook

Tode's stomach holds **two bug slots**. When two bugs are swallowed, their elemental essence crystallizes into a specialized attack:

```
                  ┌───────────────┐
                  │  EMBER (Fire) │
                  └───────┬───────┘
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
   + FROST (Ice)               + SPARK (Lightning)
   ═════════════               ═══════════════════
   🌋 THERMAL SHOCK             ⚡ PLASMA FLARE
   High AoE burn explosion      Chain lightning arc
             ▲                         ▲
             │                         │
   + FROST (Ice)               + SPARK (Lightning)
   ═════════════               ═══════════════════
   🧊 GLACIER SHATTER           ⚡ SUPERCONDUCTOR
   Freezes enemies solid;       High-voltage stun field
   Shockwave instantly          striking multiple foes
   shatters them!
             │                         │
             └────────────┬────────────┘
                          │
                  ┌───────┴───────┐
                  │  CRUMB (Decoy)│
                  └───────────────┘
                          │
                          ▼
                  🥖 BREADCRUMB DECOY
                  Distracts gnomes away from tadpoles!
```

### 🏆 Flavor Streak Multipliers
Eating matching or complementary bugs without burping builds a **Flavor Streak**:
- **Streak x2**: `1.5×` Score Multiplier
- **Streak x3+**: `2.0×` - `3.0×` Score Multiplier

---

## 👾 4. Bestiary & Combat Strategy

| Enemy | Threat Level | Behaviors & Mechanics | Tactical Counter |
| :--- | :---: | :--- | :--- |
| **Gnome Raider** | 🟢 Normal | Sprints toward the pond to abduct a tadpole and drag it off-screen. | Rapid tongue snatch or basic Ember fireballs. |
| **Armored Beetle** | 🟡 Heavy | Impenetrable frontal carapace; ignores frontal basic attacks. | **Charge Spacebar** to flip it upside down onto its back, then strike its soft underbelly! |
| **Stinger Wasp** | 🟠 Agile | Fast aerial diagonal dive-bomber with erratic flight paths. | Target with Spark/Plasma chain attacks or snipe mid-dive with Frost. |
| **Pond Crow** | 🔴 Fierce | Circling aerial predator with high health and rapid swoops. | Cryo-Stun / Glacier to bring it down, followed by ground shockwave. |
| **Boss Lawn Mower** | 💀 Apex | **Wave 5 Boss**: 80 HP, dual spinning rotary blades, screen-shaking charge attacks, and summon horns. | Dodge charges, freeze tracks with Frost/Glacier, and detonate with Ultimate Frog Slam! |

---

## 🚀 5. Custom Extension Features (`EXTENSION_ENABLED`)

Per the course challenge guidelines, all novel extensions are togglable via a single master constant in [`src/constants.js`](file:///C:/Users/nilay/WebstormProjects/Build%20a%20Game%20with%20an%20AI%20Coding%20Agent/game/src/constants.js):
```javascript
export const GAME_CONSTANTS = {
  EXTENSION_ENABLED: true, // Set false to restore vanilla base game instantly
  ...
};
```

Our custom extension introduces four major enhancements:

### 1. 🎯 Dynamic 3D Floating Arcade Combat Text (`FloatingText.js`)
- Screen-projected DOM floating markers (`+15`, `+30 SHATTER!`, `+CRUSH!`, `+75 SAVED!`, `✨ FUSION!`).
- Utilizes `THREE.Vector3.project(camera)` to pinpoint exact world coordinates on top of moving enemies without generating expensive WebGL textures or degrading canvas performance.

### 2. 📅 Mulberry32 Seeded Daily Challenge Mode (`prng.js`)
- Clicking the **📅 Daily** button in the top navigation calculates a 32-bit integer seed from the current calendar date (`YYYY-MM-DD`).
- Drives deterministic bug spawning sequences and enemy wave arrivals via a custom Mulberry32 PRNG, allowing players worldwide to compete under identical conditions.

### 3. 🏆 Wave 5 Boss Defeat Celebration & Infinite Master Waves
- Defeating the mechanical Boss Lawn Mower triggers a custom radiant gold celebration banner (`🏆 VICTORY! POND DEFENDED!`), particle fireworks, and victory fanfare.
- Automatically transitions into high-intensity infinite survival waves with escalating speed and density.

### 4. 🦘 Zero-Input Mouse Aiming & Crisp Frog Controls
- Dual-control scheme: Keyboard hops (<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>) with instantaneous mouse-raycast aiming. Tode faces wherever your cursor points, delivering pinpoint accuracy for tongue catches and spit shots.

---

## ⚙️ 6. Technical Architecture & Engineering Innovations

- **100% Zero Copyrighted External Assets**:
  - **No 3D Models (.gltf/.obj)**: All models (Tode, gnomes with pointy hats and cotton beards, armored beetles, wasps with translucent wings, thatched roof cottages, water lily pads) are procedurally constructed using Three.js primitive hierarchies.
  - **No Audio Files (.mp3/.wav)**: Sound effects and ambient chords are 100% procedurally synthesized in real-time via the Web Audio API (`AudioContext`, `OscillatorNode`, `BiquadFilterNode`, and white noise buffers).
  - **No Image Textures (.png/.jpg)**: Water ripples, ground stones, and grass tufts are generated dynamically via HTML5 Canvas 2D procedural textures.
- **Strict 60 FPS Performance & Memory Management**:
  - Geometry and material caching across all bugs, enemies, and particles to prevent WebGL shader recompilation hitching.
  - Object pooling for particles, projectiles, and tongue segments.
  - Clamped delta timing (`Math.min(delta, 0.1)`) preventing spiral-of-death collision tunneling during browser tab switches.
- **Trauma-Based Camera Shake**:
  - Implements non-linear decay camera trauma (`trauma^2`) for punchy, visceral feedback during explosions, burps, and boss charges without causing disorientation.

---

## 🛠️ 7. Installation & Local Development

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev

# 3. Open browser at:
# http://localhost:5173/ (or the port Vite outputs)

# 4. Production Build
npm run build
```

---

## 📋 8. Course Challenge Rubric Alignment

| Rubric Criterion | Implementation & Demonstration |
| :--- | :--- |
| **Completeness & Runnable** | Built with Vite + Three.js. Zero console errors, clean builds (`npm run build`), stable 60 FPS rendering. |
| **Course Extension Quality** | Seeded daily challenge (Mulberry32 PRNG), floating screen-projected arcade combat popups, victory sequence banner, and instant fallback toggle (`EXTENSION_ENABLED`). |
| **Creativity & Originality** | The "Flavor Fusion" mechanic turns pest defense into an active elemental crafting game, supported by procedural Web Audio synthesis and stylized procedural 3D aesthetics. |
| **Gameplay & Balance** | Wave progression from safe tutorial (Wave 0) up through Morning, Noon, Dusk, Night, and Boss Arena (Wave 5), with distinct enemy behaviors, tadpole abduction mechanics, and multiple attack types. |
| **Technical Execution** | Zero external audio or mesh dependencies, procedural canvas textures, raycasted mouse aiming, and trauma-based screen shake. |

---

*Created for the JetBrains Academy / Coursera "Build a Game with an AI Coding Agent" Project.*
