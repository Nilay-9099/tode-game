// TODE AND THE LAST LILYPAD - Feast System (v3 Spec Section 3.1 & 3.2)
// Timed buff status on Tode executing active secret recipe feast effects.

import { eventBus, V3_EVENTS } from '../eventBus.js';
import recipesData from '../data/recipes.json';

export class FeastManager {
  constructor(scene, particles) {
    this.scene = scene;
    this.particles = particles;
    this.activeFeast = null;
    this.autoLightningTimer = 0;
  }

  isFeastActive() {
    return this.activeFeast !== null;
  }

  getActiveFeastId() {
    return this.activeFeast ? this.activeFeast.id : null;
  }

  startFeast(recipeId, player, passivesManager, tadpoleManager) {
    const rDef = recipesData[recipeId];
    if (!rDef || !rDef.feast) return;

    // End previous feast cleanly if one was active
    if (this.activeFeast) {
      this.endFeast();
    }

    const duration = rDef.feast.duration || 18.0;
    this.activeFeast = {
      id: recipeId,
      def: rDef,
      duration,
      remaining: duration,
      effects: rDef.feast.effects || [],
    };
    this.autoLightningTimer = 0;

    // Immediate instant effects (e.g. Golden Banquet restore)
    for (const eff of this.activeFeast.effects) {
      if (eff.type === 'restoreHeart' && player) {
        player.hp = Math.min(player.maxHp || 3, player.hp + (eff.count || 1));
      } else if (eff.type === 'restoreTadpole' && tadpoleManager) {
        tadpoleManager.restoreOneLostTadpole();
      } else if (eff.type === 'invulnerability' && player) {
        player.invulnerableTimer = eff.duration || 8;
      }
    }

    eventBus.emit(V3_EVENTS.FEAST_STARTED, recipeId, duration);
  }

  update(delta, player, enemies, passivesManager, onKill) {
    if (!this.activeFeast) return;

    this.activeFeast.remaining -= delta;
    eventBus.emit(V3_EVENTS.FEAST_TICK, this.activeFeast.id, Math.max(0, this.activeFeast.remaining));

    // Handle ongoing effects
    for (const eff of this.activeFeast.effects) {
      if (eff.type === 'globalEnemySlow' && enemies) {
        for (const e of enemies) {
          if (e.applySlow) e.applySlow(0.2, eff.factor || 0.6);
        }
      } else if (eff.type === 'autoLightning' && enemies && enemies.length > 0) {
        this.autoLightningTimer += delta;
        const interval = eff.interval || 1.2;
        if (this.autoLightningTimer >= interval) {
          this.autoLightningTimer = 0;
          this.strikeNearestEnemy(player, enemies, eff.damage || 2.5, eff.range || 220, onKill);
        }
      }
    }

    if (this.activeFeast.remaining <= 0) {
      this.endFeast();
    }
  }

  strikeNearestEnemy(player, enemies, damage, maxRange, onKill) {
    if (!player || !player.group) return;
    const pPos = player.group.position;
    let closest = null;
    let closestDist = maxRange;

    for (const e of enemies) {
      if (!e.group || e.hp <= 0) continue;
      const d = Math.hypot(e.group.position.x - pPos.x, e.group.position.y - pPos.y);
      if (d < closestDist) {
        closestDist = d;
        closest = e;
      }
    }

    if (closest) {
      closest.hp -= damage;
      if (this.particles) {
        this.particles.emitSparkBurst(closest.group.position.x, closest.group.position.y, 14);
      }
      if (closest.hp <= 0 && onKill) {
        onKill(closest, { id: 'thunder_meal_strike', damage });
      }
    }
  }

  endFeast() {
    if (!this.activeFeast) return;
    const id = this.activeFeast.id;
    this.activeFeast = null;
    this.autoLightningTimer = 0;
    eventBus.emit(V3_EVENTS.FEAST_ENDED, id);
  }

  reset() {
    this.activeFeast = null;
    this.autoLightningTimer = 0;
  }
}
