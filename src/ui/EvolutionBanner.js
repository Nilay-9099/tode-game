// TODE AND THE LAST LILYPAD - Evolution Banner HUD (v3 Spec Section 7.3 & 7.8)
// Cinematic slide-in announcement modal showing stage name, passive subtitle, and elemental styling.

import { eventBus, V3_EVENTS } from '../eventBus.js';
import formsData from '../data/forms.json';
import { UiTweens } from './UiTweens.js';

export class EvolutionBanner {
  constructor() {
    this.banner = null;
    this.titleEl = null;
    this.subEl = null;
    this.timeout = null;

    this.initDOM();
    this.initListeners();
  }

  initDOM() {
    this.banner = document.createElement('div');
    this.banner.id = 'evolutionBanner';
    this.banner.style.cssText = `
      position: fixed;
      top: 15%;
      left: 50%;
      transform: translate(-50%, -40px) scale(0.9);
      background: rgba(15, 23, 42, 0.94);
      backdrop-filter: blur(16px);
      border: 2px solid #00f5d4;
      border-radius: 20px;
      padding: 16px 36px;
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      z-index: 10000;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6), 0 0 24px rgba(0, 245, 212, 0.4);
      pointer-events: none;
      user-select: none;
      text-align: center;
    `;

    this.titleEl = document.createElement('div');
    this.titleEl.style.cssText = `
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 2px;
      color: #00f5d4;
      text-transform: uppercase;
      text-shadow: 0 0 12px rgba(0, 245, 212, 0.6);
    `;
    this.banner.appendChild(this.titleEl);

    this.subEl = document.createElement('div');
    this.subEl.style.cssText = `
      font-size: 13px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.85);
      letter-spacing: 0.5px;
    `;
    this.banner.appendChild(this.subEl);

    document.body.appendChild(this.banner);
  }

  initListeners() {
    eventBus.on(V3_EVENTS.EVOLUTION_APPLIED, (formId) => {
      this.show(formId);
    });
  }

  show(formId) {
    const def = formsData[formId];
    if (!def || !def.banner) return;

    clearTimeout(this.timeout);
    this.titleEl.textContent = def.banner.title || def.name;
    this.subEl.textContent = def.banner.subtitle || '';

    // Style by element
    const colors = {
      ember: '#ff5400',
      frost: '#00f5d4',
      spark: '#fee440',
      hybrid: '#f72585',
    };
    const accent = colors[def.element] || '#00f5d4';
    this.banner.style.borderColor = accent;
    this.titleEl.style.color = accent;
    this.titleEl.style.textShadow = `0 0 14px ${accent}`;
    this.banner.style.boxShadow = `0 16px 48px rgba(0,0,0,0.6), 0 0 24px ${accent}66`;

    this.banner.style.display = 'flex';
    UiTweens.slideIn(this.banner, -40, 0.35);

    this.timeout = setTimeout(() => {
      this.hide();
    }, 2400);
  }

  hide() {
    if (this.banner) {
      this.banner.style.display = 'none';
    }
  }
}
