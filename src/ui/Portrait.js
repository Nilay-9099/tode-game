// TODE AND THE LAST LILYPAD - Game Over Portrait & Share Modal (v3 Spec Section 7.9)
// Diorama pedestal summary showing evolved form, affinity stats, recipes cooked, and PNG canvas export.

import { eventBus, V3_EVENTS } from '../eventBus.js';
import { UiTweens } from './UiTweens.js';
import formsData from '../data/forms.json';
import recipesData from '../data/recipes.json';

export class PortraitModal {
  constructor(renderer) {
    this.renderer = renderer;
    this.modal = null;
    this.initDOM();
  }

  initDOM() {
    this.modal = document.createElement('div');
    this.modal.id = 'portraitModal';
    this.modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(10, 15, 29, 0.88);
      backdrop-filter: blur(16px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 100000;
      user-select: none;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    const card = document.createElement('div');
    card.id = 'portraitCard';
    card.style.cssText = `
      background: rgba(15, 23, 42, 0.95);
      border: 2px solid #00f5d4;
      border-radius: 24px;
      padding: 24px 32px;
      width: 440px;
      max-width: 90vw;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 245, 212, 0.35);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: #fff;
    `;

    // Header Title
    const header = document.createElement('div');
    header.style.cssText = 'font-size:18px; font-weight:900; letter-spacing:1.5px; color:#00f5d4; text-transform:uppercase;';
    header.textContent = '🐸 TODE RUN PORTRAIT';
    card.appendChild(header);

    // Form Banner Box
    this.formBadge = document.createElement('div');
    this.formBadge.style.cssText = `
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(0, 245, 212, 0.4);
      border-radius: 14px;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      box-sizing: border-box;
      justify-content: center;
    `;
    this.formIcon = document.createElement('span');
    this.formIcon.style.fontSize = '24px';
    this.formIcon.textContent = '🐸';
    this.formBadge.appendChild(this.formIcon);

    this.formTitle = document.createElement('span');
    this.formTitle.style.cssText = 'font-size:16px; font-weight:bold; color:#fff; letter-spacing:0.8px;';
    this.formTitle.textContent = 'Classic Tode';
    this.formBadge.appendChild(this.formTitle);
    card.appendChild(this.formBadge);

    // Affinity Stats Section
    const statsContainer = document.createElement('div');
    statsContainer.style.cssText = 'width:100%; display:flex; flex-direction:column; gap:8px;';
    this.affinityChart = statsContainer;
    card.appendChild(statsContainer);

    // Recipes Cooked Summary
    this.recipesBox = document.createElement('div');
    this.recipesBox.style.cssText = `
      font-size: 11px;
      color: rgba(255, 255, 255, 0.7);
      background: rgba(0, 0, 0, 0.3);
      border-radius: 10px;
      padding: 8px 14px;
      width: 100%;
      box-sizing: border-box;
      text-align: center;
      line-height: 1.5;
    `;
    card.appendChild(this.recipesBox);

    // Action Buttons
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex; gap:12px; width:100%; margin-top:8px;';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '📸 Save Portrait (PNG)';
    saveBtn.style.cssText = `
      flex: 1;
      background: linear-gradient(135deg, #00f5d4, #00b4d8);
      color: #0b132b;
      border: none;
      border-radius: 12px;
      padding: 10px 16px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0, 245, 212, 0.4);
      transition: transform 0.15s;
    `;
    saveBtn.addEventListener('click', () => {
      this.exportPNG();
    });
    btnRow.appendChild(saveBtn);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ Close';
    closeBtn.style.cssText = `
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 10px 18px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
    `;
    closeBtn.addEventListener('click', () => {
      this.hide();
    });
    btnRow.appendChild(closeBtn);

    card.appendChild(btnRow);
    this.modal.appendChild(card);
    document.body.appendChild(this.modal);
  }

  show(affinityValues, activeFormId, recipesCooked = [], score = 0, wave = 1) {
    this.currentScore = score;
    this.currentWave = wave;
    this.affinityEmber = affinityValues?.ember || 0;
    this.affinityFrost = affinityValues?.frost || 0;
    this.affinitySpark = affinityValues?.spark || 0;

    const def = formsData[activeFormId];
    if (def) {
      this.currentFormName = def.name;
      this.formTitle.textContent = def.name;
      const icons = { ember: '🔥', frost: '❄️', spark: '⚡', hybrid: '✨' };
      this.formIcon.textContent = icons[def.element] || '🐸';
      const colors = { ember: '#ff5400', frost: '#00f5d4', spark: '#fee440', hybrid: '#f72585' };
      this.formTitle.style.color = colors[def.element] || '#00f5d4';
      this.formBadge.style.borderColor = colors[def.element] || '#00f5d4';
    } else {
      this.currentFormName = 'Classic Tode';
      this.formTitle.textContent = 'Classic Tode';
      this.formIcon.textContent = '🐸';
      this.formTitle.style.color = '#fff';
      this.formBadge.style.borderColor = 'rgba(255,255,255,0.2)';
    }

    // Render Affinity Meters
    this.affinityChart.innerHTML = '';
    const meters = [
      { name: 'Ember Diet', val: affinityValues.ember || 0, color: '#ff5400', icon: '🔥' },
      { name: 'Frost Diet', val: affinityValues.frost || 0, color: '#00f5d4', icon: '❄️' },
      { name: 'Spark Diet', val: affinityValues.spark || 0, color: '#fee440', icon: '⚡' },
    ];

    meters.forEach((m) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex; flex-direction:column; gap:2px; font-size:11px;';
      row.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-weight:600;">
          <span>${m.icon} ${m.name}</span>
          <span style="color:${m.color}">${Math.round(m.val)}%</span>
        </div>
        <div style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
          <div style="width:${Math.min(100, m.val)}%; height:100%; background:${m.color}; border-radius:3px;"></div>
        </div>
      `;
      this.affinityChart.appendChild(row);
    });

    // Recipes Cooked Summary
    const recipeNames = recipesCooked.map((id) => recipesData[id]?.name || id).join(', ');
    this.recipesBox.innerHTML = `
      <div><strong>Final Score:</strong> ${Math.floor(score)} pts | <strong>Wave:</strong> ${wave}</div>
      <div style="margin-top:4px;"><strong>Secret Feasts Enjoyed:</strong> ${recipeNames || 'None yet! (Experiment with 3-bug diets)'}</div>
    `;

    this.modal.style.display = 'flex';
    UiTweens.pop(document.getElementById('portraitCard'), 0.35);
  }

  hide() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }

  exportPNG() {
    if (!this.renderer || !this.renderer.domElement) return;
    try {
      const srcCanvas = this.renderer.domElement;
      const offscreen = document.createElement('canvas');
      offscreen.width = srcCanvas.width;
      offscreen.height = srcCanvas.height;
      const ctx = offscreen.getContext('2d');

      if (ctx) {
        ctx.drawImage(srcCanvas, 0, 0);

        // Add elegant vignette & lower banner
        const bannerHeight = Math.max(100, Math.floor(offscreen.height * 0.12));
        const gradient = ctx.createLinearGradient(0, offscreen.height - bannerHeight, 0, offscreen.height);
        gradient.addColorStop(0, 'rgba(10, 15, 29, 0)');
        gradient.addColorStop(0.3, 'rgba(10, 15, 29, 0.7)');
        gradient.addColorStop(1, 'rgba(10, 15, 29, 0.95)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, offscreen.height - bannerHeight, offscreen.width, bannerHeight);

        // Form Title
        const titleFontSize = Math.max(20, Math.floor(offscreen.height * 0.032));
        ctx.fillStyle = '#00f5d4';
        ctx.font = `900 ${titleFontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(`🐸 TODE: ${this.currentFormName || 'Classic Tode'}`, 32, offscreen.height - Math.floor(bannerHeight * 0.5));

        // Subtitle stats
        const subFontSize = Math.max(14, Math.floor(offscreen.height * 0.02));
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = `600 ${subFontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(
          `Score: ${Math.floor(this.currentScore || 0)}  |  Wave: ${this.currentWave || 1}  |  🔥 Ember: ${Math.round(this.affinityEmber || 0)}%  ❄️ Frost: ${Math.round(this.affinityFrost || 0)}%  ⚡ Spark: ${Math.round(this.affinitySpark || 0)}%`,
          32,
          offscreen.height - Math.floor(bannerHeight * 0.2)
        );

        const dataUrl = offscreen.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `tode-run-portrait-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log('📸 [Portrait] Canvas exported as PNG successfully with watermark!');
        return;
      }

      const dataUrl = srcCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `tode-run-portrait-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      console.log('📸 [Portrait] Canvas exported as PNG successfully!');
    } catch (err) {
      console.warn('Could not export canvas to PNG:', err);
    }
  }
}
