// TODE AND THE LAST LILYPAD - Tween Engine (v3 Spec Section 6.2)
// High-performance tween manager supporting world/real time modes, chaining, and pooling.

import { Easing } from './Easing.js';

class Tween {
  constructor() {
    this.reset();
  }

  reset() {
    this.target = null;
    this.props = null;
    this.startValues = {};
    this.endValues = {};
    this.duration = 0;
    this.elapsed = 0;
    this.delay = 0;
    this.delayElapsed = 0;
    this.ease = Easing.easeOutQuad;
    this.timeMode = 'world'; // 'world' or 'real'
    this.onUpdate = null;
    this.onComplete = null;
    this.isComplete = false;
    this.isCancelled = false;
    this.next = null; // Chained tween
  }

  init(target, props, duration, options = {}) {
    this.target = target;
    this.props = props;
    this.duration = Math.max(0.0001, duration);
    this.elapsed = 0;
    this.delay = options.delay || 0;
    this.delayElapsed = 0;
    this.ease = Easing.get(options.ease);
    this.timeMode = options.timeMode || 'world';
    this.onUpdate = options.onUpdate || null;
    this.onComplete = options.onComplete || null;
    this.isComplete = false;
    this.isCancelled = false;
    this.next = null;

    // Capture initial values
    for (const key of Object.keys(props)) {
      this.startValues[key] = target[key] !== undefined ? target[key] : 0;
      this.endValues[key] = props[key];
    }
    return this;
  }

  chain(nextTween) {
    this.next = nextTween;
    return nextTween;
  }

  cancel() {
    this.isCancelled = true;
    this.isComplete = true;
  }

  update(delta) {
    if (this.isCancelled || this.isComplete) return true;

    if (this.delayElapsed < this.delay) {
      this.delayElapsed += delta;
      return false;
    }

    this.elapsed += delta;
    const progress = Math.min(1, this.elapsed / this.duration);
    const eased = this.ease(progress);

    for (const key of Object.keys(this.endValues)) {
      const start = this.startValues[key];
      const end = this.endValues[key];
      this.target[key] = start + (end - start) * eased;
    }

    if (this.onUpdate) {
      this.onUpdate(this.target, progress, eased);
    }

    if (progress >= 1) {
      this.isComplete = true;
      if (this.onComplete) {
        this.onComplete(this.target);
      }
      return true;
    }
    return false;
  }
}

export class TweenManager {
  constructor() {
    this.activeTweens = [];
    this.pool = [];
  }

  to(target, props, duration, options = {}) {
    if (!target) return null;
    let tween = this.pool.pop() || new Tween();
    tween.init(target, props, duration, options);
    this.activeTweens.push(tween);
    return tween;
  }

  killTweensOf(target) {
    for (let i = 0; i < this.activeTweens.length; i++) {
      const tw = this.activeTweens[i];
      if (tw.target === target) {
        tw.cancel();
      }
    }
  }

  update(worldDelta, realDelta) {
    for (let i = this.activeTweens.length - 1; i >= 0; i--) {
      const tw = this.activeTweens[i];
      const dt = tw.timeMode === 'real' ? realDelta : worldDelta;
      const done = tw.update(dt);

      if (done) {
        this.activeTweens.splice(i, 1);
        if (tw.next && !tw.isCancelled) {
          this.activeTweens.push(tw.next);
        }
        tw.reset();
        if (this.pool.length < 100) {
          this.pool.push(tw);
        }
      }
    }
  }

  clear() {
    for (const tw of this.activeTweens) {
      tw.cancel();
    }
    this.activeTweens = [];
  }
}

export const tweenManager = new TweenManager();
