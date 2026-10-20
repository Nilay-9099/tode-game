// TODE AND THE LAST LILYPAD - Form Chip HUD (v3 Spec Section 7.8)
// Compact HUD chip displaying current form name and icon with elastic pop animation.

import { eventBus, V3_EVENTS } from '../eventBus.js';
import { UiTweens } from './UiTweens.js';
import formsData from '../data/forms.json';

export class FormChip {
  constructor() {
    this.element = null;
    this.nameText = null;
    this.iconText = null;
    this.currentFormId = null;

    this.initDOM();
    this.initListeners();
  }

  initDOM() {
    this.element = document.createElement('div');
    this.element.id = 'formChipHUD';
    this.element.style.cssText = `
      position: fixed;
      top: 60px;
      left: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(0, 245, 212, 0.35);
      border-radius: 20px;
      padding: 5px 12px;
      z-index: 1000;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      user-select: none;
      pointer-events: none;
      transition: border-color 0.3s;
    `;

    this.iconText = document.createElement('span');
    this.iconText.style.cssText = 'font-size: 14px;';
    this.iconText.textContent = '🐸';
    this.element.appendChild(this.iconText);

    this.nameText = document.createElement('span');
    this.nameText.style.cssText = 'font-size: 11px; font-weight: bold; color: #00f5d4; letter-spacing: 0.5px;';
    this.nameText.textContent = 'Classic Tode';
    this.element.appendChild(this.nameText);

    document.body.appendChild(this.element);
  }

  initListeners() {
    eventBus.on(V3_EVENTS.EVOLUTION_APPLIED, (formId) => {
      this.setForm(formId);
    });

    eventBus.on(V3_EVENTS.FORM_CHANGED, (activeForms, hybrid) => {
      const activeId = hybrid || (activeForms && activeForms.length > 0 ? activeForms[activeForms.length - 1] : null);
      if (activeId) {
        this.setForm(activeId);
      }
    });
  }

  setForm(formId) {
    const def = formsData[formId];
    if (!def) return;

    this.currentFormId = formId;
    const icons = {
      ember: '🔥',
      frost: '❄️',
      spark: '⚡',
      hybrid: '✨',
    };

    const icon = icons[def.element] || '🐸';
    this.iconText.textContent = icon;
    this.nameText.textContent = def.name;

    // Pop animation
    UiTweens.bounce(this.element, 0.28);
  }

  reset() {
    this.currentFormId = null;
    this.iconText.textContent = '🐸';
    this.nameText.textContent = 'Classic Tode';
  }
}
