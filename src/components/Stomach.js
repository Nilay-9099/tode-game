// TODE AND THE LAST LILYPAD - Stomach & Digestion System
// 2-slot stomach with digest countdowns, overeating burp, pond reset, and belly tinting.

import { GAME_CONSTANTS, FUSION_RECIPES } from '../constants.js';
import { eventBus } from '../eventBus.js';
import { sounds } from './Audio.js';
import { perkManager } from './Perks.js';

export class StomachSystem {
  constructor() {
    this.slots = []; // Array of { bug, timer, maxTimer, element, colorHex, colorCss }
    this.maxSlots = GAME_CONSTANTS.STOMACH_SLOTS;
    this.knownFusions = new Set();
    this.lastSpitRecipe = null;
    this.flavorStreak = 0;
    this.longestStreak = 0;
    this.streakHistory = [];
  }

  addBug(bug) {
    sounds.playGulp();
    let burpTriggered = false;

    if (this.slots.length >= this.maxSlots) {
      // Overeating: expel oldest bug as a harmless burp knockback
      const expelled = this.slots.shift();
      burpTriggered = true;
      sounds.playBurp();
      eventBus.emit('stomach:burp', expelled);
    }

    const digestTime = GAME_CONSTANTS.DIGEST_TIME + (perkManager?.modifiers?.digestTimeBonus || 0);
    const slotData = {
      bug,
      element: bug.element,
      colorHex: bug.colorHex,
      colorCss: bug.colorCss,
      timer: digestTime,
      maxTimer: digestTime,
    };
    this.slots.push(slotData);

    const fusion = this.getCurrentFusion();
    if (this.slots.length >= 2 && fusion && fusion.id !== 'plain_spit') {
      sounds.playFusionDing();
      const isNew = !this.knownFusions.has(fusion.id);
      if (isNew) {
        this.knownFusions.add(fusion.id);
      }
      eventBus.emit('fusion:created', fusion, isNew);
    }

    eventBus.emit('stomach:changed', this.getSnapshot());
    return { burpTriggered, fusion };
  }

  getCurrentFusion() {
    if (this.slots.length === 0) {
      return FUSION_RECIPES['empty'];
    }
    if (this.slots.length === 1) {
      const el = this.slots[0].element;
      return FUSION_RECIPES[el] || FUSION_RECIPES['empty'];
    }

    // Mix 2 newest flavors
    const sA = this.slots[this.slots.length - 2];
    const sB = this.slots[this.slots.length - 1];
    let elA = sA.element;
    let elB = sB.element;
    if (elA === 'wildcard') elA = elB === 'wildcard' ? 'fire' : elB;
    if (elB === 'wildcard') elB = elA === 'wildcard' ? 'fire' : elA;

    const els = [elA, elB].sort();
    const key = `${els[0]}+${els[1]}`;
    return FUSION_RECIPES[key] || FUSION_RECIPES['empty'];
  }

  consume() {
    const fusion = this.getCurrentFusion();

    // Flavor Streak calculation: using 3 distinct fusions in a row grants score multipliers
    if (fusion && fusion.id !== 'plain_spit' && this.slots.length === 2) {
      if (!this.streakHistory.includes(fusion.id)) {
        this.streakHistory.push(fusion.id);
        this.flavorStreak++;
        if (this.flavorStreak > this.longestStreak) {
          this.longestStreak = this.flavorStreak;
        }
      } else {
        this.streakHistory = [fusion.id];
        this.flavorStreak = 1;
      }
    } else {
      this.flavorStreak = 0;
      this.streakHistory = [];
    }

    this.slots = [];
    eventBus.emit('stomach:changed', this.getSnapshot());
    return fusion;
  }

  resetStreak() {
    this.flavorStreak = 0;
    this.streakHistory = [];
  }

  clearPondDip() {
    if (this.slots.length > 0) {
      this.slots = [];
      sounds.playWaveClear();
      eventBus.emit('stomach:changed', this.getSnapshot());
      return true;
    }
    return false;
  }

  update(delta) {
    let changed = false;
    for (let i = this.slots.length - 1; i >= 0; i--) {
      this.slots[i].timer -= delta;
      if (this.slots[i].timer <= 0) {
        this.slots.splice(i, 1);
        changed = true;
      }
    }

    if (changed) {
      eventBus.emit('stomach:changed', this.getSnapshot());
    }
  }

  getSnapshot() {
    return {
      slots: this.slots.map((s) => ({
        element: s.element,
        colorHex: s.colorHex,
        colorCss: s.colorCss,
        pct: Math.max(0, s.timer / s.maxTimer),
        seconds: Math.ceil(s.timer),
      })),
      fusion: this.getCurrentFusion(),
      flavorStreak: this.flavorStreak,
      maxSlots: this.maxSlots,
      streakMultiplier:
        GAME_CONSTANTS.STREAK_MULTIPLIERS[
          Math.min(this.flavorStreak, GAME_CONSTANTS.STREAK_MULTIPLIERS.length - 1)
        ],
    };
  }

  getBellyColors() {
    const c1 = this.slots[0] ? this.slots[0].colorHex : 0x00f5d4;
    const c2 = this.slots[1] ? this.slots[1].colorHex : (this.slots[0] ? this.slots[0].colorHex : 0x00f5d4);
    const hasItems = this.slots.length > 0;
    return { c1, c2, hasItems };
  }
}
