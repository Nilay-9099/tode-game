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

---

## 📈 Triage Summary

* **Total Bugs Identified / Investigated:** 7
* **P0 Blocker Bugs:** 3 (B-01, B-02, B-03)
* **P1 Experience Bugs:** 0
* **P2 Cosmetic / Warning Bugs:** 4 (B-04, B-05, B-06, B-07)
* **Status:**
  * Fixed: 6
  * Not Reproduced: 1 (B-04)
