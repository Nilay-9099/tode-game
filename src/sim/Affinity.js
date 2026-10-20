// TODE AND THE LAST LILYPAD - Affinity System (v3 Spec Section 2.1)
// Tracks elemental diets (Ember, Frost, Spark) and triggers evolution thresholds.

import { eventBus, V3_EVENTS } from '../eventBus.js';
import evolutionConfig from '../data/evolution.json';

export class AffinityManager {
  constructor() {
    this.thresholds = evolutionConfig.thresholds || { stage1: 20, stage2: 50, apex: 90 };
    this.gains = evolutionConfig.gains || {
      swallowBug: 3,
      swallowGolden: 2,
      spitFusion: 1,
      killFusion: 1,
      killSlam: 1,
    };

    this.values = {
      ember: 0,
      frost: 0,
      spark: 0,
    };

    // Track reached stages per element to avoid duplicate threshold events
    this.stagesReached = {
      ember: 0,
      frost: 0,
      spark: 0,
    };

    // Auto-listen to gameplay events
    eventBus.on('bug:snatched', (cfg) => {
      if (cfg && cfg.id) this.onBugSwallowed(cfg.id);
    });
    eventBus.on('spit:fired', (fusion) => {
      if (fusion && fusion.elements) this.onFusionSpit(fusion.elements);
    });
    eventBus.on('enemy:killed', (enemy, attackDetails) => {
      if (attackDetails && attackDetails.elements) {
        this.onFusionKill(attackDetails.elements);
      }
      if (attackDetails && attackDetails.id === 'slam') {
        this.onSlamKill(attackDetails.element || 'ember');
      }
    });
  }

  reset() {
    this.values.ember = 0;
    this.values.frost = 0;
    this.values.spark = 0;
    this.stagesReached.ember = 0;
    this.stagesReached.frost = 0;
    this.stagesReached.spark = 0;

    eventBus.emit(V3_EVENTS.AFFINITY_CHANGED, 'ember', 0, 0);
    eventBus.emit(V3_EVENTS.AFFINITY_CHANGED, 'frost', 0, 0);
    eventBus.emit(V3_EVENTS.AFFINITY_CHANGED, 'spark', 0, 0);
  }

  getValues() {
    return { ...this.values };
  }

  getStage(element) {
    const el = String(element).toLowerCase();
    const val = this.values[el] || 0;
    if (val >= this.thresholds.apex) return 3;
    if (val >= this.thresholds.stage2) return 2;
    if (val >= this.thresholds.stage1) return 1;
    return 0;
  }

  addAffinity(element, delta) {
    const el = String(element).toLowerCase();
    if (this.values[el] === undefined || delta === 0) return;

    const oldVal = this.values[el];
    const newVal = Math.min(100, Math.max(0, oldVal + delta));
    this.values[el] = newVal;

    const actualDelta = newVal - oldVal;
    if (actualDelta !== 0) {
      eventBus.emit(V3_EVENTS.AFFINITY_CHANGED, el, newVal, actualDelta);
      this.checkThresholds(el, oldVal, newVal);
    }
  }

  setAffinity(element, value) {
    const el = String(element).toLowerCase();
    if (this.values[el] === undefined) return;
    const oldVal = this.values[el];
    const target = Math.min(100, Math.max(0, value));
    this.values[el] = target;
    const delta = target - oldVal;

    eventBus.emit(V3_EVENTS.AFFINITY_CHANGED, el, target, delta);
    this.checkThresholds(el, oldVal, target);
  }

  checkThresholds(element, oldVal, newVal) {
    const reached = this.stagesReached[element];

    if (reached < 1 && newVal >= this.thresholds.stage1) {
      this.stagesReached[element] = 1;
      eventBus.emit(V3_EVENTS.EVOLUTION_THRESHOLD, element, 1);
    }
    if (this.stagesReached[element] < 2 && newVal >= this.thresholds.stage2) {
      this.stagesReached[element] = 2;
      eventBus.emit(V3_EVENTS.EVOLUTION_THRESHOLD, element, 2);
    }
    if (this.stagesReached[element] < 3 && newVal >= this.thresholds.apex) {
      this.stagesReached[element] = 3;
      eventBus.emit(V3_EVENTS.EVOLUTION_THRESHOLD, element, 3);
    }
  }

  onBugSwallowed(flavorKey) {
    const key = String(flavorKey || '').toLowerCase();
    if (key === 'golden') {
      this.addAffinity('ember', this.gains.swallowGolden);
      this.addAffinity('frost', this.gains.swallowGolden);
      this.addAffinity('spark', this.gains.swallowGolden);
    } else if (this.values[key] !== undefined) {
      this.addAffinity(key, this.gains.swallowBug);
    }
  }

  onFusionSpit(elements = []) {
    for (const el of elements) {
      const key = String(el).toLowerCase();
      if (this.values[key] !== undefined) {
        this.addAffinity(key, this.gains.spitFusion);
      }
    }
  }

  onFusionKill(elements = []) {
    for (const el of elements) {
      const key = String(el).toLowerCase();
      if (this.values[key] !== undefined) {
        this.addAffinity(key, this.gains.killFusion);
      }
    }
  }

  onSlamKill(element = 'ember') {
    const key = String(element).toLowerCase();
    if (this.values[key] !== undefined) {
      this.addAffinity(key, this.gains.killSlam);
    }
  }
}

export const affinityManager = new AffinityManager();
