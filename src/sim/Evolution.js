// TODE AND THE LAST LILYPAD - Evolution Manager (v3 Spec Section 2.2, 4 & 5)
// Manages forms, hybrid resolution, Evolution Beat sequencing, queueing, and invulnerability.

import { eventBus, V3_EVENTS } from '../eventBus.js';
import formsData from '../data/forms.json';
import { debugHarness } from '../core/Debug.js';

export class EvolutionManager {
  constructor(affinityManager, passivesManager) {
    this.affinity = affinityManager;
    this.passives = passivesManager;

    this.activeForms = new Set();
    this.activeHybrid = null;
    this.hasEvolvedAny = false;

    this.isEvolving = false;
    this.currentEvolution = null;
    this.queue = [];

    this.initListeners();
  }

  initListeners() {
    eventBus.on(V3_EVENTS.EVOLUTION_THRESHOLD, (element, stage) => {
      this.handleThreshold(element, stage);
    });
  }

  reset() {
    this.activeForms.clear();
    this.activeHybrid = null;
    this.hasEvolvedAny = false;
    this.isEvolving = false;
    this.currentEvolution = null;
    this.queue = [];
  }

  handleThreshold(element, stage) {
    const el = String(element).toLowerCase();
    const formId = `${el}_${stage}`;

    // Check if a hybrid should take priority
    const hybridId = this.checkHybrid();
    const targetFormId = hybridId && !this.activeHybrid ? hybridId : formId;

    this.queueEvolution(targetFormId, stage === 3);
  }

  checkHybrid() {
    const values = this.affinity ? this.affinity.getValues() : { ember: 0, frost: 0, spark: 0 };
    const e = values.ember || 0;
    const f = values.frost || 0;
    const s = values.spark || 0;

    const atStage2 = [];
    if (e >= 50) atStage2.push({ el: 'ember', val: e });
    if (f >= 50) atStage2.push({ el: 'frost', val: f });
    if (s >= 50) atStage2.push({ el: 'spark', val: s });

    if (atStage2.length >= 2) {
      // Sort by affinity descending
      atStage2.sort((a, b) => b.val - a.val);
      const top1 = atStage2[0].el;
      const top2 = atStage2[1].el;

      if ((top1 === 'ember' && top2 === 'frost') || (top1 === 'frost' && top2 === 'ember')) {
        return 'steam';
      }
      if ((top1 === 'ember' && top2 === 'spark') || (top1 === 'spark' && top2 === 'ember')) {
        return 'plasma';
      }
      if ((top1 === 'frost' && top2 === 'spark') || (top1 === 'spark' && top2 === 'frost')) {
        return 'aurora';
      }
    }
    return null;
  }

  queueEvolution(formId, isStage3 = false) {
    if (!formsData[formId]) return;
    this.queue.push({ formId, isStage3 });

    if (!this.isEvolving) {
      this.processQueue();
    }
  }

  processQueue() {
    if (this.queue.length === 0) {
      this.isEvolving = false;
      this.currentEvolution = null;
      return;
    }

    const next = this.queue.shift();
    this.startEvolutionBeat(next.formId, next.isStage3);
  }

  startEvolutionBeat(formId, isStage3) {
    this.isEvolving = true;
    const isFirst = !this.hasEvolvedAny;
    const isCompressed = !isFirst && !isStage3;
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = prefersReducedMotion ? 0.6 : (isCompressed ? 1.8 : 2.6);

    this.currentEvolution = {
      formId,
      duration,
      elapsed: 0,
      applied: false,
      isFirst,
      isCompressed,
      prefersReducedMotion,
    };

    // 1. Slow down world simulation (mild if reduced motion)
    if (debugHarness) {
      debugHarness.timeScale = prefersReducedMotion ? 0.8 : 0.15;
    }

    // 2. Emit evolution started event
    eventBus.emit(V3_EVENTS.EVOLUTION_STARTED, formId, isFirst, isCompressed);
  }

  update(delta, player) {
    if (!this.isEvolving || !this.currentEvolution) return;

    // Use unscaled real-time delta for the evolution beat
    const dt = delta;
    this.currentEvolution.elapsed += dt;
    const { elapsed, duration, formId, applied } = this.currentEvolution;

    // Keep player strictly invulnerable during evolution so they cannot die
    if (player) {
      player.invulnerableTimer = 1.0;
    }

    // Form Swap at peak of the flash (~45% into the moment)
    if (!applied && elapsed >= duration * 0.45) {
      this.currentEvolution.applied = true;
      this.applyForm(formId);
      eventBus.emit(V3_EVENTS.EVOLUTION_APPLIED, formId);
    }

    // Completion
    if (elapsed >= duration) {
      this.finishEvolutionBeat();
    }
  }

  applyForm(formId) {
    this.hasEvolvedAny = true;
    const def = formsData[formId];
    if (!def) return;

    if (def.element === 'hybrid') {
      this.activeHybrid = formId;
    } else {
      this.activeForms.add(formId);
    }

    if (this.passives) {
      this.passives.addForm(formId);
    }

    eventBus.emit(V3_EVENTS.FORM_CHANGED, Array.from(this.activeForms), this.activeHybrid);
  }

  finishEvolutionBeat() {
    // Restore world simulation time scale
    if (debugHarness) {
      debugHarness.timeScale = 1.0;
    }

    eventBus.emit(V3_EVENTS.EVOLUTION_ENDED);

    // Short gap before processing next queued evolution if multiple thresholds crossed
    setTimeout(() => {
      this.processQueue();
    }, 200);
  }
}
