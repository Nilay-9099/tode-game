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
