// TODE AND THE LAST LILYPAD - Event Bus
// Decoupled publish/subscribe bus for cross-system coordination.

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, ...args) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        try {
          callback(...args);
        } catch (err) {
          console.error(`Error in event listener for "${event}":`, err);
        }
      }
    }
  }

  clear() {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();

// v3 Event Catalog (Spec Section 5.3)
export const V3_EVENTS = {
  // Affinity & Evolution
  AFFINITY_CHANGED: 'affinity:changed',       // [element, value, delta]
  EVOLUTION_THRESHOLD: 'evolution:threshold', // [element, stage]
  EVOLUTION_STARTED: 'evolution:started',     // [formId, first, compressed]
  EVOLUTION_APPLIED: 'evolution:applied',     // [formId]
  EVOLUTION_ENDED: 'evolution:ended',         // []
  FORM_CHANGED: 'form:changed',               // [activeForms, hybrid]

  // Recipes & Feasts
  RECIPE_PROGRESS: 'recipe:progress',         // [history]
  RECIPE_COMPLETED: 'recipe:completed',       // [id, firstEver, count]
  RECIPE_SIGNATURE: 'recipe:signature',       // [id]
  FEAST_STARTED: 'feast:started',             // [id, duration]
  FEAST_TICK: 'feast:tick',                   // [id, remaining]
  FEAST_ENDED: 'feast:ended',                 // [id]
  RECIPE_WHISPER: 'recipe:whisper',           // [id, hint]
  CODEX_UNLOCKED: 'codex:unlocked',           // [id, type]

  // Animation Requests
  ANIM_REQUEST: 'anim:request',               // [clipId, target, options]
};

