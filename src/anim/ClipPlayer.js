// TODE AND THE LAST LILYPAD - ClipPlayer (v3 Spec Section 6.2 & 6.3)
// Plays data-driven clips from clips.json across target entities with timed event dispatching.

import { Easing } from './Easing.js';
import { eventBus } from '../eventBus.js';

export class ClipPlayer {
  constructor(clipsData = {}) {
    this.clips = clipsData;
    this.activeClips = [];
  }

  setClips(data) {
    this.clips = data;
  }

  play(clipId, entityContext = {}, options = {}) {
    const clipDef = this.clips[clipId];
    if (!clipDef) {
      console.warn(`[ClipPlayer] Clip not found: "${clipId}"`);
      return null;
    }

    const instance = {
      id: clipId,
      def: clipDef,
      context: entityContext,
      elapsed: 0,
      duration: clipDef.duration || 0.5,
      speed: options.speed !== undefined ? options.speed : 1.0,
      loop: options.loop || false,
      onComplete: options.onComplete || null,
      eventsFired: new Set(),
      isCancelled: false,
    };

    this.activeClips.push(instance);
    return instance;
  }

  stop(instance) {
    if (instance) {
      instance.isCancelled = true;
    }
  }

  stopAll() {
    for (const inst of this.activeClips) {
      inst.isCancelled = true;
    }
    this.activeClips = [];
  }

  resolveTarget(path, context) {
    const parts = path.split('.');
    let cur = context;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur || cur[parts[i]] === undefined) return null;
      cur = cur[parts[i]];
    }
    return { obj: cur, prop: parts[parts.length - 1] };
  }

  evaluateTrack(track, t) {
    const keys = track.keys;
    if (!keys || keys.length === 0) return 0;
    if (t <= keys[0][0]) return keys[0][1];
    if (t >= keys[keys.length - 1][0]) return keys[keys.length - 1][1];

    for (let i = 0; i < keys.length - 1; i++) {
      const k0 = keys[i];
      const k1 = keys[i + 1];
      if (t >= k0[0] && t <= k1[0]) {
        const segDuration = k1[0] - k0[0];
        const segT = segDuration > 0 ? (t - k0[0]) / segDuration : 1;
        const easeFunc = k1[2] ? Easing.get(k1[2]) : Easing.easeOutQuad;
        const eased = easeFunc(segT);
        return k0[1] + (k1[1] - k0[1]) * eased;
      }
    }
    return keys[keys.length - 1][1];
  }

  update(delta) {
    for (let idx = this.activeClips.length - 1; idx >= 0; idx--) {
      const clip = this.activeClips[idx];
      if (clip.isCancelled) {
        this.activeClips.splice(idx, 1);
        continue;
      }

      clip.elapsed += delta * clip.speed;
      const t = clip.elapsed;

      // 1. Evaluate property tracks
      if (clip.def.tracks) {
        for (const track of clip.def.tracks) {
          const res = this.resolveTarget(track.target, clip.context);
          if (res && res.obj) {
            const val = this.evaluateTrack(track, t);
            res.obj[res.prop] = val;
          }
        }
      }

      // 2. Dispatch timed events
      if (clip.def.events) {
        for (let i = 0; i < clip.def.events.length; i++) {
          const ev = clip.def.events[i];
          if (!clip.eventsFired.has(i) && t >= ev.t) {
            clip.eventsFired.add(i);
            eventBus.emit(`clip:${ev.emit}`, ev);
          }
        }
      }

      // 3. Completion check
      if (clip.elapsed >= clip.duration) {
        if (clip.loop) {
          clip.elapsed = 0;
          clip.eventsFired.clear();
        } else {
          this.activeClips.splice(idx, 1);
          if (clip.onComplete) clip.onComplete();
        }
      }
    }
  }
}
