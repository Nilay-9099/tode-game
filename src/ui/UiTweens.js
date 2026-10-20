// TODE AND THE LAST LILYPAD - UI Tweening Helpers (v3 Spec Section 6.2 & 7.8)
// Real-time UI animations for elastic pops, slides, bounces, and numeric count-ups.

import { tweenManager } from '../anim/Tween.js';

export const UiTweens = {
  /**
   * Elastic scale pop on a DOM element (0 -> 1.15 -> 1.0)
   */
  pop: (element, duration = 0.28, options = {}) => {
    if (!element) return null;
    element.style.transform = 'scale(0.2)';
    element.style.opacity = '0';

    const state = { scale: 0.2, opacity: 0 };
    return tweenManager.to(state, { scale: 1.0, opacity: 1.0 }, duration, {
      ease: 'easeOutBack',
      timeMode: 'real',
      delay: options.delay || 0,
      onUpdate: () => {
        element.style.transform = `scale(${state.scale.toFixed(3)})`;
        element.style.opacity = state.opacity.toFixed(3);
      },
      onComplete: () => {
        element.style.transform = '';
        element.style.opacity = '';
        if (options.onComplete) options.onComplete();
      },
    });
  },

  /**
   * Subtle bounce pulse (1.0 -> 1.25 -> 1.0)
   */
  bounce: (element, duration = 0.24) => {
    if (!element) return null;
    const state = { scale: 1.0 };
    const tw1 = tweenManager.to(state, { scale: 1.25 }, duration * 0.45, {
      ease: 'easeOutQuad',
      timeMode: 'real',
      onUpdate: () => {
        element.style.transform = `scale(${state.scale.toFixed(3)})`;
      },
    });

    const tw2 = tweenManager.to(state, { scale: 1.0 }, duration * 0.55, {
      ease: 'easeOutBack',
      timeMode: 'real',
      onUpdate: () => {
        element.style.transform = `scale(${state.scale.toFixed(3)})`;
      },
      onComplete: () => {
        element.style.transform = '';
      },
    });

    if (tw1) tw1.chain(tw2);
    return tw1;
  },

  /**
   * Slide in element from an offset direction
   */
  slideIn: (element, fromY = -30, duration = 0.35, options = {}) => {
    if (!element) return null;
    element.style.transform = `translateY(${fromY}px)`;
    element.style.opacity = '0';

    const state = { y: fromY, opacity: 0 };
    return tweenManager.to(state, { y: 0, opacity: 1.0 }, duration, {
      ease: 'easeOutBack',
      timeMode: 'real',
      delay: options.delay || 0,
      onUpdate: () => {
        element.style.transform = `translateY(${state.y.toFixed(1)}px)`;
        element.style.opacity = state.opacity.toFixed(3);
      },
      onComplete: () => {
        element.style.transform = '';
        element.style.opacity = '';
        if (options.onComplete) options.onComplete();
      },
    });
  },

  /**
   * Numeric count-up display
   */
  countUp: (element, start, end, duration = 0.45, prefix = '', suffix = '') => {
    if (!element) return null;
    const state = { val: start };
    return tweenManager.to(state, { val: end }, duration, {
      ease: 'easeOutQuad',
      timeMode: 'real',
      onUpdate: () => {
        element.textContent = `${prefix}${Math.round(state.val)}${suffix}`;
      },
      onComplete: () => {
        element.textContent = `${prefix}${Math.round(end)}${suffix}`;
      },
    });
  },
};
