// TODE AND THE LAST LILYPAD - Animation Timeline (v3 Spec Section 6.2)
// Coordinates parallel tracks, sequenced keyframe cues, and timed callbacks.

export class Timeline {
  constructor(options = {}) {
    this.duration = options.duration || 0;
    this.elapsed = 0;
    this.isPlaying = false;
    this.isLooping = options.loop || false;
    this.timeScale = options.timeScale || 1.0;
    this.cues = [];
    this.onComplete = options.onComplete || null;
  }

  addCue(time, callback) {
    this.cues.push({ time, callback, triggered: false });
    this.cues.sort((a, b) => a.time - b.time);
    if (time > this.duration) {
      this.duration = time;
    }
    return this;
  }

  play() {
    this.isPlaying = true;
  }

  pause() {
    this.isPlaying = false;
  }

  seek(time) {
    this.elapsed = Math.max(0, Math.min(this.duration, time));
    for (const cue of this.cues) {
      cue.triggered = cue.time <= this.elapsed;
    }
  }

  restart() {
    this.seek(0);
    for (const cue of this.cues) cue.triggered = false;
    this.play();
  }

  update(delta) {
    if (!this.isPlaying) return;

    const dt = delta * this.timeScale;
    const prevTime = this.elapsed;
    this.elapsed += dt;

    for (const cue of this.cues) {
      if (!cue.triggered && cue.time >= prevTime && cue.time <= this.elapsed) {
        cue.triggered = true;
        cue.callback();
      }
    }

    if (this.elapsed >= this.duration) {
      if (this.isLooping) {
        this.restart();
      } else {
        this.isPlaying = false;
        if (this.onComplete) this.onComplete();
      }
    }
  }
}
