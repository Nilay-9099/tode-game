// TODE AND THE LAST LILYPAD - Recipe Strip HUD (v3 Spec Section 7.4 & 7.8)
// Displays rolling 3-bug digestion history with subtle glow when close to a recipe.

import { eventBus, V3_EVENTS } from '../eventBus.js';
import recipesData from '../data/recipes.json';
import { UiTweens } from './UiTweens.js';

export class RecipeStrip {
  constructor() {
    this.container = null;
    this.slots = [];
    this.initDOM();
    this.initListeners();
  }

  initDOM() {
    this.container = document.createElement('div');
    this.container.id = 'recipeStripHUD';
    this.container.style.cssText = `
      position: fixed;
      top: 62px;
      right: 18px;
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 4px 10px;
      z-index: 1000;
      user-select: none;
      pointer-events: none;
      transition: border-color 0.3s, box-shadow 0.3s;
    `;

    const label = document.createElement('span');
    label.style.cssText = 'font-size: 10px; font-weight: bold; color: rgba(255,255,255,0.6); margin-right: 2px;';
    label.textContent = 'RECIPE:';
    this.container.appendChild(label);

    for (let i = 0; i < 3; i++) {
      const slot = document.createElement('div');
      slot.style.cssText = `
        width: 22px;
        height: 22px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: rgba(255,255,255,0.3);
      `;
      slot.textContent = '·';
      this.slots.push(slot);
      this.container.appendChild(slot);
    }

    document.body.appendChild(this.container);
  }

  initListeners() {
    eventBus.on(V3_EVENTS.RECIPE_PROGRESS, (history) => {
      this.updateHistory(history || []);
    });
  }

  updateHistory(history) {
    const iconMap = {
      ember: '🔥',
      frost: '❄️',
      spark: '⚡',
      golden: '✨',
      plain: '🥖',
    };

    for (let i = 0; i < 3; i++) {
      const slot = this.slots[i];
      if (i < history.length) {
        const el = history[i];
        slot.textContent = iconMap[el] || '🐛';
        slot.style.borderColor = el === 'ember' ? '#ff5400' : el === 'frost' ? '#00f5d4' : el === 'spark' ? '#fee440' : '#ffd700';
        UiTweens.bounce(slot, 0.2);
      } else {
        slot.textContent = '·';
        slot.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      }
    }

    // Glow if 2 bugs match the prefix of a recipe
    const matchesTwo = this.matchesRecipePrefix(history);
    if (matchesTwo) {
      this.container.style.borderColor = '#00f5d4';
      this.container.style.boxShadow = '0 0 16px rgba(0, 245, 212, 0.4)';
    } else {
      this.container.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      this.container.style.boxShadow = 'none';
    }
  }

  matchesRecipePrefix(history) {
    if (history.length !== 2) return false;
    for (const r of Object.values(recipesData)) {
      if (r.ordered && r.sequence[0] === history[0] && r.sequence[1] === history[1]) {
        return true;
      }
    }
    return false;
  }

  reset() {
    this.updateHistory([]);
  }
}
