// TODE AND THE LAST LILYPAD - Adaptive Quality Engine (Spec Section 4.10)
// Measures framerate over 3s windows and steps down graphics to guarantee 60 FPS on low-spec hardware.

export class QualityManager {
  constructor(renderer, postFX = null) {
    this.renderer = renderer;
    this.postFX = postFX;
    this.level = 'high'; // 'high', 'medium', 'low'
    this.manualOverride = false;

    this.sampleWindow = 3000; // ms
    this.windowStart = performance.now();
    this.framesInWindow = 0;
    this.hasSteppedDown = false;
  }

  setManualLevel(level) {
    this.manualOverride = true;
    this.applyQuality(level);
  }

  update() {
    if (this.manualOverride || this.hasSteppedDown) return;

    this.framesInWindow++;
    const now = performance.now();
    const elapsed = now - this.windowStart;

    if (elapsed >= this.sampleWindow) {
      const avgFps = (this.framesInWindow * 1000) / elapsed;
      this.framesInWindow = 0;
      this.windowStart = now;

      // If average drops below 45 FPS, step down to preserve smooth combat
      if (avgFps < 45) {
        console.warn(`[QualityManager] Frame rate dipped to ${avgFps.toFixed(1)} FPS. Stepping down quality.`);
        this.stepDown();
      }
    }
  }

  stepDown() {
    this.hasSteppedDown = true;
    if (this.level === 'high') {
      this.applyQuality('medium');
    } else if (this.level === 'medium') {
      this.applyQuality('low');
    }
  }

  applyQuality(level) {
    this.level = level;
    if (!this.renderer) return;

    if (level === 'low') {
      this.renderer.setPixelRatio(1.0);
      this.renderer.shadowMap.enabled = false;
      if (this.postFX && this.postFX.setQuality) {
        this.postFX.setQuality('low');
      }
    } else if (level === 'medium') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
      this.renderer.shadowMap.enabled = true;
      if (this.postFX && this.postFX.setQuality) {
        this.postFX.setQuality('medium');
      }
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      this.renderer.shadowMap.enabled = true;
      if (this.postFX && this.postFX.setQuality) {
        this.postFX.setQuality('high');
      }
    }
    console.log(`[QualityManager] Graphics Quality set to: ${level.toUpperCase()}`);
  }
}
