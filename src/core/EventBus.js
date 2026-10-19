// TODE AND THE LAST LILYPAD - Core Event Bus (Spec Section 4.5)
// Decoupled publish/subscribe bus with typed payloads and error containment.

export class EventBus {
  constructor() {
    this.listeners = new Map();
    this.history = []; // Debug event log (last 50 events)
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

  emit(event, payload) {
    if (window.__tode_debug_events) {
      this.history.push({ event, payload, time: performance.now() });
      if (this.history.length > 50) this.history.shift();
    }

    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        try {
          callback(payload);
        } catch (err) {
          console.error(`[EventBus] Error in listener for "${event}":`, err);
        }
      }
    }
  }

  clear() {
    this.listeners.clear();
    this.history = [];
  }
}

export const eventBus = new EventBus();
