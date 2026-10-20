// TODE AND THE LAST LILYPAD - Recipes System (v3 Spec Section 3.1, 3.2 & 3.3)
// 3-bug rolling history, 12s chaining timeout, feast triggers, signatures, and whispers.

import { eventBus, V3_EVENTS } from '../eventBus.js';
import recipesData from '../data/recipes.json';
import { saveManager } from '../core/Save.js';

export class RecipeManager {
  constructor(feastManager, passivesManager) {
    this.feast = feastManager;
    this.passives = passivesManager;

    this.history = []; // Array of last swallowed bug flavors e.g. ['ember', 'frost']
    this.lastSwallowTime = 0;
    this.chainTimeoutSeconds = 12.0;

    this.discoveredRecipes = new Set();
    this.cookCounts = {};
    this.signaturesUnlocked = new Set();

    this.loadSavedDiscoveries();
    this.initListeners();
  }

  loadSavedDiscoveries() {
    try {
      const saved = localStorage.getItem('tode_recipes_discovered');
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) {
          arr.forEach((id) => this.discoveredRecipes.add(id));
        }
      }
    } catch (e) {
      // Clean fallback
    }
  }

  saveDiscoveries() {
    try {
      localStorage.setItem('tode_recipes_discovered', JSON.stringify(Array.from(this.discoveredRecipes)));
    } catch (e) {}
  }

  initListeners() {
    eventBus.on('bug:snatched', (bugConfig) => {
      if (bugConfig && bugConfig.id) {
        this.onBugSwallowed(bugConfig.id);
      }
    });
  }

  reset() {
    this.history = [];
    this.lastSwallowTime = 0;
    this.cookCounts = {};
    this.signaturesUnlocked.clear();
    eventBus.emit(V3_EVENTS.RECIPE_PROGRESS, []);
  }

  update(delta) {
    if (this.history.length > 0) {
      this.lastSwallowTime += delta;
      if (this.lastSwallowTime >= this.chainTimeoutSeconds) {
        // 12-second chaining window expired; restart history
        this.history = [];
        this.lastSwallowTime = 0;
        eventBus.emit(V3_EVENTS.RECIPE_PROGRESS, []);
      }
    }
  }

  onBugSwallowed(flavorKey) {
    const flavor = String(flavorKey).toLowerCase();
    this.lastSwallowTime = 0;
    this.history.push(flavor);

    if (this.history.length > 3) {
      this.history.shift();
    }

    eventBus.emit(V3_EVENTS.RECIPE_PROGRESS, [...this.history]);

    if (this.history.length === 3) {
      this.checkRecipes();
    }
  }

  checkRecipes() {
    for (const [rId, rDef] of Object.entries(recipesData)) {
      if (this.matchesRecipe(this.history, rDef.sequence, rDef.ordered)) {
        this.cookRecipe(rId);
        break;
      }
    }
  }

  matchesRecipe(history, sequence, ordered = true) {
    if (history.length !== 3 || sequence.length !== 3) return false;

    if (ordered) {
      return (
        history[0] === sequence[0] &&
        history[1] === sequence[1] &&
        history[2] === sequence[2]
      );
    } else {
      // Unordered match (e.g. Rainbow Tasting Menu)
      const hSorted = [...history].sort();
      const sSorted = [...sequence].sort();
      return hSorted[0] === sSorted[0] && hSorted[1] === sSorted[1] && hSorted[2] === sSorted[2];
    }
  }

  cookRecipe(recipeId) {
    const rDef = recipesData[recipeId];
    if (!rDef) return;

    // Clear history on cook
    this.history = [];
    this.lastSwallowTime = 0;
    eventBus.emit(V3_EVENTS.RECIPE_PROGRESS, []);

    const isFirstEver = !this.discoveredRecipes.has(recipeId);
    if (isFirstEver) {
      this.discoveredRecipes.add(recipeId);
      this.saveDiscoveries();
      eventBus.emit(V3_EVENTS.CODEX_UNLOCKED, recipeId, 'recipe');
    }

    this.cookCounts[recipeId] = (this.cookCounts[recipeId] || 0) + 1;
    const count = this.cookCounts[recipeId];

    // Signature Dish Check (Cooking 3 times in one run grants permanent run passive)
    if (count === 3 && !this.signaturesUnlocked.has(recipeId)) {
      this.signaturesUnlocked.add(recipeId);
      if (rDef.signature && rDef.signature.passive && this.passives) {
        this.passives.passives.push({ ...rDef.signature.passive, sourceRecipe: recipeId });
      }
      eventBus.emit(V3_EVENTS.RECIPE_SIGNATURE, recipeId);
    }

    eventBus.emit(V3_EVENTS.RECIPE_COMPLETED, recipeId, isFirstEver, count);

    // Start Feast
    if (this.feast) {
      this.feast.startFeast(recipeId);
    }
  }

  // Intermission Recipe Whisper Selection
  selectWhisper(waveNumber = 2, seed = 0) {
    const undiscovered = Object.keys(recipesData).filter((id) => !this.discoveredRecipes.has(id));
    const pool = undiscovered.length > 0 ? undiscovered : Object.keys(recipesData);
    if (pool.length === 0) return null;

    // Deterministic selection based on seed and wave number
    const idx = Math.abs((seed + waveNumber * 7) % pool.length);
    const chosenId = pool[idx];
    const rDef = recipesData[chosenId];

    eventBus.emit(V3_EVENTS.RECIPE_WHISPER, chosenId, rDef.whisper);
    return { id: chosenId, whisper: rDef.whisper, sequence: rDef.sequence };
  }
}
