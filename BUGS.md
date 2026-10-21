# 🐛 Tode and the Last Lilypad - Bug Triage & Tracking (BUGS.md)

This document tracks all bugs identified during the QA audit, triage, and playtesting of "Tode and the Last Lilypad".

---

## 📊 Bug Triage Table

| ID | Severity | Description | Exact Steps to Reproduce | Root Cause | Proposed / Applied Fix | Status |
| :---: | :---: | :--- | :--- | :--- | :--- | :---: |
| **B-01** | **P0** | Game fails to start: `ReferenceError: Cannot access 'passivesManager' before initialization` in `src/main.js:95`. | 1. Load `http://localhost:5173/?debug=1`<br>2. Open browser console.<br>3. Observe unhandled ReferenceError; canvas stays uninitialized. | `passivesManager` was referenced at line 95 (`new EvolutionManager(affinityManager, passivesManager)`) but declared via `const` at line 165 (Temporal Dead Zone). | Move `const passivesManager = new PassivesManager(scene, particles);` to line 90 before `evolutionManager` and `recipeManager`, removing duplicate declaration. | **Fixed** |
| **B-02** | **P0** | Missing `V3_EVENTS` import causes `ReferenceError: V3_EVENTS is not defined` in `src/main.js:105`. | 1. Initialize `src/main.js` past line 95.<br>2. Event listener setup executes.<br>3. Observe ReferenceError on `V3_EVENTS.EVOLUTION_STARTED`. | `src/main.js` only imported `{ eventBus }` from `./eventBus.js`, omitting `V3_EVENTS`. | Add `V3_EVENTS` to `import { eventBus, V3_EVENTS } from './eventBus.js'`. | **Fixed** |
| **B-03** | **P0** | Shockwave stomp crashes: `ReferenceError: delta is not defined` in `src/components/Enemies.js:357`. | 1. Load game and start Wave 1 or 2.<br>2. Wait for enemies to spawn.<br>3. Press and release <kbd>Spacebar</kbd> to stomp.<br>4. Observe console exception in `onShockwave`. | Redundant enemy spawn scale pop-in lerp using `delta * 14` was placed in `onShockwave`, but `delta` is not passed to `onShockwave`. | Remove the redundant `spawnScale` block from `onShockwave` (it is already properly updated in `update(delta)`). | **Fixed** |
| **B-04** | **P2** | Suspected pixel figure labelled "NULL" with "∅" symbol at the top-left of the screen. | 1. Load game in fresh window.<br>2. Inspect DOM and 3D scene elements at top-left. | Not reproduced. Top-left HUD contains Hearts, Tadpole Counter, Badges, and `formChipHUD` ("🐸 Classic Tode"). No asset or text contains "NULL" or "∅". | N/A (verified absent; clean DOM structure confirmed). | **Not Reproduced** |
| **B-05** | **P2** | Heavy striping and moiré on ground texture near the horizon due to high-frequency tiling aliasing. | 1. Start game and look towards arena boundary.<br>2. Observe high-contrast striping/moiré along grazing isometric angles. | `createGrassTexture` in `src/components/Map.js` used a high-frequency `repeat.set(14, 14)` with random dots on a 512x512 canvas, producing aliasing at distance. | Reduce repeat tiling to `(8, 8)`, generate smooth low-frequency organic noise, and apply linear mipmap filtering with maximum anisotropy. | **Fixed** |
| **B-06** | **P2** | Three.js console warning: `THREE.Material: 'roughness' is not a property of THREE.MeshLambertMaterial.` | 1. Load game with browser console open.<br>2. Observe warning from `Map.js:63`. | `groundMat` was constructed as `MeshLambertMaterial` with `{ roughness: 0.85 }`, which is not a valid property for Lambert materials. | Remove `{ roughness: 0.85 }` from `MeshLambertMaterial` configuration in `src/components/Map.js`. | **Fixed** |
| **B-07** | **P2** | `QualityManager` false frame drop warning and premature step-down on initial startup. | 1. Open game in browser.<br>2. Observe warning: `[QualityManager] Frame rate dipped... Stepping down quality.` | `windowStart` was initialized at constructor creation before the animation loop started, measuring startup asset load time as low FPS. | Reset `windowStart = performance.now()` upon rendering the first active frame. | **Fixed** |
| **B-08** | **P1** | Frog Hop Disappearing / Scale Oscillation Glitch: When hopping, Tode flickers violently or collapses into an invisible microscopic sliver. | 1. Move Tode with <kbd>W</kbd>, <kbd>A</kbd>, <kbd>S</kbd>, or <kbd>D</kbd>.<br>2. Observe the frog model flickering rapidly and disappearing mid-air. | `Player.js` set `model.scale = 28` and updated it every frame with `(squashX, squashX, squashZ)` around 28, while `AnimDirector.js` triggered `ClipPlayer.js`'s `hop` clip which directly assigned `tode.body.scale.y` and `scale.x` to normalized values (`[1.0, 0.85, 1.18, 1.0]`). The 28 vs 1 scale conflict occurred every frame. | Encapsulated scaled raw GLTF model inside an inner `meshHolder` (scaled by 28) under `model` (base scale 1.0) so `ClipPlayer` animates `model.scale` around 1.0 without clashing with the 28x magnification. Removed legacy conflicting scale overwrite in `Player.js`. | **Fixed** |
| **B-09** | **P1** | Tongue Shoots 180° Backwards (Out of Tode's Rear/Back): Tongue does not emerge from Tode's mouth; it shoots in the exact opposite direction. | 1. Aim cursor or move Tode in any direction.<br>2. Press <kbd>Q</kbd> or Left-Click to shoot tongue.<br>3. Observe tongue extending backwards from Tode's rear while facing away from the target. | In `tode.glb`, the frog face was modeled along local $+Z$. Rotating around $X$ by $+90^\circ$ for Z-up coordinates mapped local $+Z$ to world $-Y$ (South/Down). Meanwhile, all gameplay aiming vectors treat $+Y$ (North/Up) as forward ($0^\circ$). The 3D model was permanently facing 180° opposite to its gameplay forward vector. | In `Player.js`, rotated `gltfScene.rotation.y = Math.PI` to align the 3D frog model's face with world $+Y$ (matching `aimDir`, `getForwardVector()`, and cursor aim). Realigned `bellyGroup`, added `anchorGroup` in `FrogRig.js` tracking player rotation and jump height, and updated `Tongue.js` to originate directly from the mouth (+12 along aim direction at mouth height). | **Fixed** |
| **B-10** | **P1** | Atmosphere / Enemy Visibility Murkiness in Later Waves: In Dusk, Night, and Boss Arena, dense exponential fog and low ambient light combined with vignette and contrast post-processing rendered mobs and the boss nearly impossible to see. | 1. Jump to Wave 4 (Night) or Wave 5/10 (Boss Arena).<br>2. Observe the playfield shrouded in dark, opaque fog soup where crows, beetles, and the mower blend into pitch-black background. | Night had `fogDensity: 0.0012` and Boss Arena had `fogDensity: 0.0014` with very dark ambient lighting (`#0d1b2a` / `#2b0938` at low intensity). PostFX vignette (`0.65`) and contrast (`1.07`) crushed dark tones into black. Dark enemy materials (Crow `0x1d3557`, Beetle `0x212529`) lacked emissive definition. | Reduced fog densities in `constants.js` and `phases.json` (Dusk: 0.0006, Night: 0.0005, Boss: 0.0006), boosted ambient/sun intensities and brightened palette colors. Eased PostFX vignette darkness to 0.35, blur strength to 0.0016, and contrast to 1.03. Added subtle emissive highlights to Crows, Beetles, and Boss Chassis for crisp readability. | **Fixed** |

---

## 📈 Triage Summary

* **Total Bugs Identified / Investigated:** 10
* **P0 Blocker Bugs:** 3 (B-01, B-02, B-03)
* **P1 Experience Bugs:** 3 (B-08, B-09, B-10)
* **P2 Cosmetic / Warning Bugs:** 4 (B-04, B-05, B-06, B-07)
* **Status:**
  * Fixed: 9
  * Not Reproduced: 1 (B-04)
  * Needs Decision: 0
  * Remaining Unfixed: 0

---

## 📜 Commit History
1. `fix(B-01, B-02): resolve TDZ passivesManager reference and missing V3_EVENTS import`
2. `fix(B-03): remove undefined delta reference in EnemyManager onShockwave`
3. `fix(B-05): fix ground texture aliasing near horizon with mipmapping and low-frequency noise`
4. `fix(B-06, B-07): remove invalid roughness property on Lambert material and fix quality manager startup frame drop`
5. `fix(B-08): fix frog jump scale collision between Player controller and ClipPlayer`
6. `fix(B-09): align 3D frog model orientation 180 deg so tongue and face point forward`
7. `fix(B-10): improve visibility in later waves with balanced fog, brighter ambient, and mob emissive accents`
