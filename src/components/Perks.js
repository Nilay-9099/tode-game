// TODE AND THE LAST LILYPAD - Roguelite Perk Engine ("Bug Buffet")
// Manages perk pool, draft generation, and modifier application.

import { eventBus } from '../eventBus.js';
import { sounds } from './Audio.js';
import { rng } from '../core/Rng.js';
import perksData from '../data/perks.json';

export class PerkManager {
  constructor() {
    this.allPerks = perksData;
    this.activePerks = new Map(); // id -> perk definition
    this.modifiers = {
      maxSlots: 2,
      snatchRangeMult: 1.0,
      digestTimeBonus: 0.0,
      multiSnatchLimit: 1,
      echoSpit: false,
      echoDamageMult: 0.6,
      tadpoleRegenInterval: 0,
      ultGainMult: 1.0,
      whiffForgiveness: 0,
      goldenBugChanceMult: 1.0,
      maxHpBonus: 0,
      burpDamage: 0.0,
    };
  }

  reset() {
    this.activePerks.clear();
    this.modifiers = {
      maxSlots: 2,
      snatchRangeMult: 1.0,
      digestTimeBonus: 0.0,
      multiSnatchLimit: 1,
      echoSpit: false,
      echoDamageMult: 0.6,
      tadpoleRegenInterval: 0,
      ultGainMult: 1.0,
      whiffForgiveness: 0,
      goldenBugChanceMult: 1.0,
      maxHpBonus: 0,
      burpDamage: 0.0,
    };
  }

  // Generates 3 distinct perk offers for the draft
  getDraftOffers(count = 3) {
    const keys = Object.keys(this.allPerks);
    // Filter out perks that shouldn't be duplicated (like third_stomach or echo_spit if already owned)
    const available = keys.filter((k) => {
      if (k === 'third_stomach' && this.hasPerk('third_stomach')) return false;
      if (k === 'echo_spit' && this.hasPerk('echo_spit')) return false;
      return true;
    });

    // Shuffle using seeded or unseeded RNG
    const shuffled = [...available].sort(() => rng.random() - 0.5);
    const selectedKeys = shuffled.slice(0, count);

    const offers = selectedKeys.map((k) => this.allPerks[k]);
    eventBus.emit('perk:offered', offers.map((p) => p.id));
    return offers;
  }

  applyPerk(perkId, player, stomach, tongue, tadpoles, ui) {
    const perk = this.allPerks[perkId];
    if (!perk) return false;

    this.activePerks.set(perkId, perk);

    // Apply specific modifiers
    const mods = perk.modifiers || {};
    if (mods.maxSlots && stomach) {
      this.modifiers.maxSlots = mods.maxSlots;
      stomach.maxSlots = mods.maxSlots;
    }
    if (mods.snatchRangeMult && tongue) {
      this.modifiers.snatchRangeMult *= mods.snatchRangeMult;
      tongue.range = tongue.baseRange * this.modifiers.snatchRangeMult;
    }
    if (mods.digestTimeBonus && stomach) {
      this.modifiers.digestTimeBonus += mods.digestTimeBonus;
    }
    if (mods.multiSnatchLimit && tongue) {
      this.modifiers.multiSnatchLimit = mods.multiSnatchLimit;
      tongue.maxSnatchCount = mods.multiSnatchLimit;
    }
    if (mods.echoSpit) {
      this.modifiers.echoSpit = true;
      this.modifiers.echoDamageMult = mods.echoDamageMult || 0.6;
    }
    if (mods.tadpoleRegenInterval) {
      this.modifiers.tadpoleRegenInterval = mods.tadpoleRegenInterval;
    }
    if (mods.ultGainMult) {
      this.modifiers.ultGainMult *= mods.ultGainMult;
    }
    if (mods.whiffForgiveness) {
      this.modifiers.whiffForgiveness += mods.whiffForgiveness;
    }
    if (mods.goldenBugChanceMult) {
      this.modifiers.goldenBugChanceMult *= mods.goldenBugChanceMult;
    }
    if (mods.maxHpBonus && player) {
      this.modifiers.maxHpBonus += mods.maxHpBonus;
      player.maxHp += mods.maxHpBonus;
      player.hp = player.maxHp;
      if (ui) ui.updateHearts(player.hp);
    }
    if (mods.burpDamage) {
      this.modifiers.burpDamage += mods.burpDamage;
    }

    sounds.playPerkPick();
    eventBus.emit('perk:picked', perk);
    return true;
  }

  hasPerk(perkId) {
    return this.activePerks.has(perkId);
  }

  getActiveList() {
    return Array.from(this.activePerks.values());
  }
}

export const perkManager = new PerkManager();
