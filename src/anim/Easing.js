// TODE AND THE LAST LILYPAD - Easing Functions (v3 Spec Section 6.1 & 6.2)
// Non-linear easing curves for juiced game feel without garbage collection allocations.

export const Easing = {
  linear: (t) => t,

  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  easeInBack: (t, s = 1.70158) => t * t * ((s + 1) * t - s),
  easeOutBack: (t, s = 1.70158) => --t * t * ((s + 1) * t + s) + 1,
  easeInOutBack: (t, s = 1.70158) => {
    const k = s * 1.525;
    return (t *= 2) < 1
      ? 0.5 * (t * t * ((k + 1) * t - k))
      : 0.5 * ((t -= 2) * t * ((k + 1) * t + k) + 2);
  },

  easeOutElastic: (t) => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    return Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1;
  },

  easeInExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  easeOutExpo: (t) => (t === 1 ? 1 : -Math.pow(2, -10 * t) + 1),

  get: (name) => {
    if (typeof name === 'function') return name;
    return Easing[name] || Easing.easeOutQuad;
  },
};
