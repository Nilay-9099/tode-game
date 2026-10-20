// TODE AND THE LAST LILYPAD - Affinity Bars HUD (v3 Spec Section 7.8)
// Glassmorphic Ember, Frost, and Spark progress meters with threshold ticks and fill flashes.

import { eventBus, V3_EVENTS } from '../eventBus.js';
import { UiTweens } from './UiTweens.js';

export class AffinityBars {
  constructor() {
    this.container = null;
    this.bars = {
      ember: { fill: null, valText: null, value: 0 },
      frost: { fill: null, valText: null, value: 0 },
      spark: { fill: null, valText: null, value: 0 },
    };

    this.initDOM();
    this.initListeners();
  }

  initDOM() {
    this.container = document.createElement('div');
    this.container.id = 'affinityBarsHUD';
    this.container.style.cssText = `
      position: fixed;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 16px;
      background: rgba(15, 23, 42, 0.78);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      padding: 8px 16px;
      z-index: 1000;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      user-select: none;
      pointer-events: none;
    `;

    const elements = [
      { id: 'ember', name: 'Ember', icon: '🔥', color: '#ff5400', glow: '#ff3700' },
      { id: 'frost', name: 'Frost', icon: '❄️', color: '#00f5d4', glow: '#00b4d8' },
      { id: 'spark', name: 'Spark', icon: '⚡', color: '#fee440', glow: '#ffb703' },
    ];

    elements.forEach((el) => {
      const col = document.createElement('div');
      col.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:4px; width:72px;';

      const label = document.createElement('div');
      label.style.cssText = 'font-size:10px; font-weight:bold; color:rgba(255,255,255,0.7); display:flex; align-items:center; gap:3px;';
      label.innerHTML = `${el.icon} <span style="color:${el.color}">${el.name}</span>`;
      col.appendChild(label);

      // Bar Track
      const track = document.createElement('div');
      track.style.cssText = `
        width: 100%;
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
        position: relative;
      `;

      // Threshold tick marks (20%, 50%, 90%)
      [20, 50, 90].forEach((pct) => {
        const tick = document.createElement('div');
        tick.style.cssText = `
          position: absolute;
          left: ${pct}%;
          top: 0;
          bottom: 0;
          width: 1px;
          background: rgba(255, 255, 255, 0.35);
          z-index: 2;
        `;
        track.appendChild(tick);
      });

      // Bar Fill
      const fill = document.createElement('div');
      fill.style.cssText = `
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg, ${el.color}, ${el.glow});
        border-radius: 4px;
        transition: width 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 0 8px ${el.glow};
      `;
      track.appendChild(fill);
      col.appendChild(track);

      // Value text
      const valText = document.createElement('div');
      valText.style.cssText = 'font-size:9px; color:rgba(255,255,255,0.5); font-family:monospace;';
      valText.textContent = '0%';
      col.appendChild(valText);

      this.bars[el.id] = { fill, valText, value: 0 };
      this.container.appendChild(col);
    });

    document.body.appendChild(this.container);
  }

  initListeners() {
    eventBus.on(V3_EVENTS.AFFINITY_CHANGED, (element, value, delta) => {
      this.updateBar(element, value);
    });

    eventBus.on(V3_EVENTS.EVOLUTION_THRESHOLD, (element, stage) => {
      this.flashBar(element);
    });
  }

  updateBar(element, value) {
    const bar = this.bars[element];
    if (!bar) return;

    bar.value = Math.min(100, Math.max(0, value));
    if (bar.fill) {
      bar.fill.style.width = `${bar.value}%`;
    }
    if (bar.valText) {
      bar.valText.textContent = `${Math.round(bar.value)}%`;
    }
  }

  flashBar(element) {
    const bar = this.bars[element];
    if (!bar || !bar.fill) return;
    UiTweens.bounce(bar.fill.parentElement, 0.3);
  }

  reset() {
    for (const key of Object.keys(this.bars)) {
      this.updateBar(key, 0);
    }
  }
}
