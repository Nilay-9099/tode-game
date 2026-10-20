// TODE AND THE LAST LILYPAD - Old Toad Sage Whisper Toast (v3 Spec Section 3.3 & 7.8)
// Displays cryptic rhyming recipe clues with masked ingredient icons during wave intermissions.

import { eventBus, V3_EVENTS } from '../eventBus.js';
import { UiTweens } from './UiTweens.js';
import recipesData from '../data/recipes.json';

export class WhisperToast {
  constructor() {
    this.toast = null;
    this.iconsContainer = null;
    this.rhymeEl = null;
    this.timeout = null;

    this.initDOM();
    this.initListeners();
  }

  initDOM() {
    this.toast = document.createElement('div');
    this.toast.id = 'whisperToast';
    this.toast.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(14px);
      border: 1px solid rgba(254, 228, 64, 0.4);
      border-radius: 16px;
      padding: 12px 18px;
      display: none;
      flex-direction: column;
      gap: 6px;
      z-index: 2000;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 16px rgba(254, 228, 64, 0.2);
      max-width: 320px;
      user-select: none;
      pointer-events: none;
    `;

    const header = document.createElement('div');
    header.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:8px;';
    header.innerHTML = `
      <span style="font-size:11px; font-weight:bold; color:#fee440; letter-spacing:0.8px;">📜 SAGE'S WHISPER</span>
      <span style="font-size:16px;">🧙‍♂️</span>
    `;
    this.toast.appendChild(header);

    this.iconsContainer = document.createElement('div');
    this.iconsContainer.style.cssText = 'display:flex; gap:8px; margin:4px 0;';
    this.toast.appendChild(this.iconsContainer);

    this.rhymeEl = document.createElement('div');
    this.rhymeEl.style.cssText = 'font-size:11px; font-style:italic; color:rgba(255,255,255,0.85); line-height:1.4;';
    this.toast.appendChild(this.rhymeEl);

    document.body.appendChild(this.toast);
  }

  initListeners() {
    eventBus.on(V3_EVENTS.RECIPE_WHISPER, (recipeId, hintText) => {
      this.show(recipeId, hintText);
    });
  }

  show(recipeId, hintText) {
    const rDef = recipesData[recipeId];
    if (!rDef) return;

    clearTimeout(this.timeout);
    this.iconsContainer.innerHTML = '';

    const iconMap = {
      ember: '🔥',
      frost: '❄️',
      spark: '⚡',
      golden: '✨',
    };

    // Show masked recipe icons: e.g. [first] [?] [third]
    const seq = rDef.sequence || ['ember', 'frost', 'spark'];
    seq.forEach((el, idx) => {
      const badge = document.createElement('div');
      badge.style.cssText = `
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 14px;
      `;
      // Mask the middle ingredient as a teaser
      if (idx === 1) {
        badge.textContent = '❓';
        badge.style.borderColor = '#fee440';
      } else {
        badge.textContent = iconMap[el] || '❓';
      }
      this.iconsContainer.appendChild(badge);
    });

    this.rhymeEl.textContent = `"${hintText || rDef.whisper}"`;

    this.toast.style.display = 'flex';
    UiTweens.slideIn(this.toast, -20, 0.3);

    this.timeout = setTimeout(() => {
      this.hide();
    }, 5500);
  }

  hide() {
    if (this.toast) {
      this.toast.style.display = 'none';
    }
  }
}
