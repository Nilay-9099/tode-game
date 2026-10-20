// TODE AND THE LAST LILYPAD - UI & Leaderboard Controller
// Connects EventBus events to the DOM HUD, Tutorial, Stomach slots, and Hall of Fame Leaderboard.

import { eventBus } from '../eventBus.js';
import codexData from '../data/codex.json';
import formsData from '../data/forms.json';
import recipesData from '../data/recipes.json';
import { saveManager } from '../core/Save.js';

export class UIManager {
  constructor() {
    // DOM Elements
    this.heartElements = document.querySelectorAll('.heart');
    this.scoreEl = document.querySelector('.score');
    this.highScoreEl = document.getElementById('highScoreVal');
    this.cooldownBadge = document.getElementById('cooldownBadge');
    this.ultBadge = document.getElementById('ultBadge');
    this.ultFill = document.getElementById('ultFill');
    this.ultText = document.getElementById('ultText');
    this.waveBadge = document.getElementById('waveBadge');
    this.atmosphereTag = document.getElementById('atmosphereTag');

    // Tadpoles
    this.tadpoleIcons = [
      document.getElementById('tadpole0'),
      document.getElementById('tadpole1'),
      document.getElementById('tadpole2'),
      document.getElementById('tadpole3'),
      document.getElementById('tadpole4'),
    ];

    // Stomach HUD
    this.stomachSlot0 = document.getElementById('stomachSlot0');
    this.stomachSlot1 = document.getElementById('stomachSlot1');
    this.slotIcon0 = document.getElementById('slotIcon0');
    this.slotIcon1 = document.getElementById('slotIcon1');
    this.slotSec0 = document.getElementById('slotSec0');
    this.slotSec1 = document.getElementById('slotSec1');
    this.ringProgress0 = document.getElementById('ringProgress0');
    this.ringProgress1 = document.getElementById('ringProgress1');
    this.spitName = document.getElementById('spitName');
    this.streakBadge = document.getElementById('streakBadge');

    // Stomach Slot 2 (Third Stomach)
    this.stomachSlot2 = document.getElementById('stomachSlot2');
    this.slotIcon2 = document.getElementById('slotIcon2');
    this.slotSec2 = document.getElementById('slotSec2');
    this.ringProgress2 = document.getElementById('ringProgress2');

    // Perk Draft Modal
    this.perkDraftModal = document.getElementById('perkDraftModal');
    this.perkCardsContainer = document.getElementById('perkCardsContainer');
    this.onPerkSelectedCallback = null;
    this.perkKeyHandler = null;

    // Phase Banner
    this.phaseBanner = document.getElementById('phaseBanner');
    this.bannerTitle = document.getElementById('bannerTitle');
    this.bannerDesc = document.getElementById('bannerDesc');
    this.bannerTimeout = null;

    // Tutorial Prompt
    this.tutorialPrompt = document.getElementById('tutorialPrompt');
    this.tutStep1 = document.getElementById('tutStep1');
    this.tutStep2 = document.getElementById('tutStep2');
    this.tutStep3 = document.getElementById('tutStep3');

    // Discovery Toast
    this.discoveryToast = document.getElementById('discoveryToast');
    this.toastTimeout = null;

    // Controls Hint
    this.controlsHint = document.getElementById('controlsHint');
    this.controlsHidden = false;

    // Boss Bar
    this.bossBarContainer = document.getElementById('bossBarContainer');
    this.bossBarFill = document.getElementById('bossBarFill');

    // Game Over
    this.gameOverModal = document.getElementById('gameOverModal');
    this.gameOverReason = document.getElementById('gameOverReason');
    this.finalScoreVal = document.getElementById('finalScoreVal');
    this.modalHighScoreVal = document.getElementById('modalHighScoreVal');
    this.finalWaveVal = document.getElementById('finalWaveVal');
    this.finalTadpolesVal = document.getElementById('finalTadpolesVal');
    this.finalStreakVal = document.getElementById('finalStreakVal');
    this.leaderboardList = document.getElementById('leaderboardList');

    // Codex Modal Elements
    this.codexBtn = document.getElementById('codexBtn');
    this.codexModal = document.getElementById('codexModal');
    this.codexGrid = document.getElementById('codexGrid');
    this.codexCount = document.getElementById('codexCount');
    this.codexCloseBtn = document.getElementById('codexCloseBtn');
    this.isCodexOpen = false;

    // Victory Modal Elements
    this.victoryModal = document.getElementById('victoryModal');
    this.victoryScoreVal = document.getElementById('victoryScoreVal');
    this.victoryTadpolesVal = document.getElementById('victoryTadpolesVal');
    this.victoryStreakVal = document.getElementById('victoryStreakVal');
    this.endlessBtn = document.getElementById('endlessBtn');
    this.victoryRestartBtn = document.getElementById('victoryRestartBtn');

    this.lastScore = -1;
    this.lastUlt = -1;

    this.setupEventListeners();
    this.setupControlsHintTimer();
  }

  setupEventListeners() {
    // 1. Stomach changes
    eventBus.on('stomach:changed', (snapshot) => {
      this.updateStomachHUD(snapshot);
    });

    // 2. Fusion Discovery Toast
    eventBus.on('fusion:created', (fusion, isNew) => {
      if (isNew) {
        this.showDiscoveryToast(`✨ New Fusion Discovered: ${fusion.name}!`);
        this.renderCodex();
      }
    });

    // 3. Phase change banner
    eventBus.on('phase:changed', (phaseKey, config) => {
      this.showPhaseBanner(config.name, config.banner);
      if (this.atmosphereTag) {
        this.atmosphereTag.textContent = config.name;
      }
    });

    // 4. Keyboard toggle 'H' for controls hint
    window.addEventListener('keydown', (e) => {
      if (e.key === 'h' || e.key === 'H') {
        this.controlsHidden = !this.controlsHidden;
        if (this.controlsHint) {
          this.controlsHint.classList.toggle('hidden', this.controlsHidden);
        }
      } else if (e.key === 'c' || e.key === 'C') {
        if (!this.perkDraftModal || this.perkDraftModal.style.display !== 'flex') {
          this.toggleCodex();
        }
      } else if (e.key === 'Escape') {
        if (this.isCodexOpen) {
          this.closeCodex();
        }
      }
    });

    // 5. Codex HUD and Close buttons
    if (this.codexBtn) {
      this.codexBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleCodex();
      });
    }

    if (this.codexCloseBtn) {
      this.codexCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeCodex();
      });
    }
  }

  setupControlsHintTimer() {
    // Auto fade controls card after 10 seconds
    setTimeout(() => {
      if (!this.controlsHidden && this.controlsHint) {
        this.controlsHidden = true;
        this.controlsHint.classList.add('hidden');
      }
    }, 10000);
  }

  updateHearts(hp) {
    this.heartElements.forEach((el, index) => {
      if (index < hp) {
        el.classList.remove('lost');
      } else {
        el.classList.add('lost');
      }
    });
  }

  updateTadpoles(tadpoleManager) {
    if (!tadpoleManager) return;
    if (!this.lastTadpoleStates) this.lastTadpoleStates = ['', '', '', '', ''];
    tadpoleManager.tadpoles.forEach((t, i) => {
      const el = this.tadpoleIcons[i];
      if (!el) return;

      if (this.lastTadpoleStates[i] !== t.state) {
        this.lastTadpoleStates[i] = t.state;
        el.className = `tadpole-icon ${t.state === 'lost' ? 'lost' : t.state === 'stolen' ? 'stolen' : 'active'}`;
      }
    });
  }

  updateScore(score, highScore) {
    const rounded = Math.floor(score);
    if (rounded !== this.lastScore) {
      this.lastScore = rounded;
      if (this.scoreEl) this.scoreEl.textContent = `Score: ${rounded}`;
      if (this.highScoreEl) this.highScoreEl.textContent = highScore.toString();
    }
  }

  updateUlt(energy) {
    const pct = Math.min(100, Math.floor(energy));
    if (pct !== this.lastUlt) {
      this.lastUlt = pct;
      if (this.ultFill) this.ultFill.style.width = `${pct}%`;
      if (this.ultText) {
        if (pct >= 100) {
          this.ultText.textContent = 'E: METEOR SLAM (READY!)';
          this.ultBadge.classList.add('ready');
        } else {
          this.ultText.textContent = `E: SLAM (${pct}%)`;
          this.ultBadge.classList.remove('ready');
        }
      }
    }
  }

  updateCooldown(timer) {
    if (!this.cooldownBadge) return;
    if (timer > 0) {
      const text = `RECHARGING (${timer.toFixed(1)}s)`;
      if (this.cooldownBadge.textContent !== text) {
        this.cooldownBadge.textContent = text;
      }
      if (!this.cooldownBadge.classList.contains('cooling')) {
        this.cooldownBadge.classList.add('cooling');
      }
    } else {
      if (this.cooldownBadge.textContent !== 'SPACE: READY') {
        this.cooldownBadge.textContent = 'SPACE: READY';
      }
      if (this.cooldownBadge.classList.contains('cooling')) {
        this.cooldownBadge.classList.remove('cooling');
      }
    }
  }

  updateStomachHUD(snapshot) {
    const slot0 = snapshot.slots[0];
    const slot1 = snapshot.slots[1];

    // Slot 0
    if (slot0) {
      this.stomachSlot0.classList.add('filled');
      this.slotIcon0.textContent = slot0.element === 'fire' ? '🔥' : slot0.element === 'ice' ? '❄️' : '⚡';
      this.slotSec0.textContent = `${slot0.seconds}s`;
      this.ringProgress0.style.strokeDashoffset = (138 * (1 - slot0.pct)).toString();
      this.ringProgress0.style.stroke = slot0.colorCss;
    } else {
      this.stomachSlot0.classList.remove('filled');
      this.slotIcon0.textContent = '🦗';
      this.ringProgress0.style.strokeDashoffset = '138';
    }

    // Slot 1
    if (slot1) {
      this.stomachSlot1.classList.add('filled');
      this.slotIcon1.textContent = slot1.element === 'fire' ? '🔥' : slot1.element === 'ice' ? '❄️' : '⚡';
      this.slotSec1.textContent = `${slot1.seconds}s`;
      this.ringProgress1.style.strokeDashoffset = (138 * (1 - slot1.pct)).toString();
      this.ringProgress1.style.stroke = slot1.colorCss;
    } else {
      this.stomachSlot1.classList.remove('filled');
      this.slotIcon1.textContent = '🦗';
      this.ringProgress1.style.strokeDashoffset = '138';
      this.slotSec1.textContent = '';
    }

    // Slot 2 (Third Stomach)
    const slot2 = snapshot.slots[2];
    if (this.stomachSlot2) {
      if (snapshot.maxSlots >= 3) {
        this.stomachSlot2.style.display = 'flex';
        if (slot2) {
          this.stomachSlot2.classList.add('filled');
          this.slotIcon2.textContent = slot2.element === 'fire' ? '🔥' : slot2.element === 'ice' ? '❄️' : '⚡';
          this.slotSec2.textContent = `${slot2.seconds}s`;
          this.ringProgress2.style.strokeDashoffset = (138 * (1 - slot2.pct)).toString();
          this.ringProgress2.style.stroke = slot2.colorCss;
        } else {
          this.stomachSlot2.classList.remove('filled');
          this.slotIcon2.textContent = '🦗';
          this.ringProgress2.style.strokeDashoffset = '138';
          this.slotSec2.textContent = '';
        }
      } else {
        this.stomachSlot2.style.display = 'none';
      }
    }

    // Current Spit Name & Color
    const fusion = snapshot.fusion;
    if (this.spitName && fusion) {
      this.spitName.textContent = fusion.name;
      this.spitName.style.color = fusion.colorCss;
    }

    // Flavor Streak Badge
    if (this.streakBadge) {
      if (snapshot.flavorStreak >= 2) {
        this.streakBadge.textContent = `${snapshot.streakMultiplier}x STREAK`;
        this.streakBadge.classList.add('active');
      } else {
        this.streakBadge.classList.remove('active');
      }
    }
  }

  showPhaseBanner(title, desc) {
    if (!this.phaseBanner) return;
    this.bannerTitle.textContent = title;
    this.bannerDesc.textContent = desc;

    this.phaseBanner.classList.add('visible');
    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      this.phaseBanner.classList.remove('visible', 'victory');
    }, 2800);
  }

  showVictoryBanner(title, desc) {
    if (!this.phaseBanner) return;
    this.bannerTitle.textContent = title;
    this.bannerDesc.textContent = desc;

    this.phaseBanner.classList.add('visible', 'victory');
    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      this.phaseBanner.classList.remove('visible', 'victory');
    }, 4500);
  }

  showDiscoveryToast(text) {
    if (!this.discoveryToast) return;
    this.discoveryToast.textContent = text;
    this.discoveryToast.classList.add('visible');

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.discoveryToast.classList.remove('visible');
    }, 3000);
  }

  updateTutorial(step) {
    if (!this.tutorialPrompt) return;
    if (step === 0) {
      this.tutorialPrompt.style.display = 'none';
      return;
    }
    this.tutorialPrompt.style.display = 'block';
    this.tutStep1.classList.toggle('active', step === 1);
    this.tutStep2.classList.toggle('active', step === 2);
    this.tutStep3.classList.toggle('active', step === 3);
  }

  showGameOver(score, highScore, wave, tadpolesSaved, longestStreak, reason = '') {
    if (this.gameOverModal) {
      this.gameOverModal.style.display = 'flex';
      if (this.gameOverReason) {
        this.gameOverReason.textContent =
          reason === 'all_tadpoles_lost'
            ? '💔 All 5 tadpoles were kidnapped by garden invaders!'
            : '💀 Tode lost all hearts in battle!';
      }
      if (this.finalScoreVal) this.finalScoreVal.textContent = Math.floor(score).toString();
      if (this.modalHighScoreVal) this.modalHighScoreVal.textContent = highScore.toString();
      if (this.finalWaveVal) this.finalWaveVal.textContent = wave.toString();
      if (this.finalTadpolesVal) this.finalTadpolesVal.textContent = `${tadpolesSaved}/5`;
      if (this.finalStreakVal) this.finalStreakVal.textContent = `${longestStreak}x`;

      this.saveAndRenderLeaderboard(score, wave, longestStreak);
    }
  }

  hideGameOver() {
    if (this.gameOverModal) {
      this.gameOverModal.style.display = 'none';
    }
  }

  saveAndRenderLeaderboard(score, wave, streak) {
    const key = 'tode_leaderboard';
    let board = [];
    try {
      board = JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      board = [];
    }

    if (score > 0) {
      board.push({
        score: Math.floor(score),
        wave,
        streak,
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      });
      board.sort((a, b) => b.score - a.score);
      board = board.slice(0, 10);
      localStorage.setItem(key, JSON.stringify(board));
    }

    if (this.leaderboardList) {
      this.leaderboardList.innerHTML = '';
      if (board.length === 0) {
        this.leaderboardList.innerHTML = '<div style="color:rgba(255,255,255,0.4);font-size:11px;text-align:center;">No high scores yet!</div>';
        return;
      }
      board.forEach((entry, idx) => {
        const row = document.createElement('div');
        row.className = 'leaderboard-row';
        row.innerHTML = `<span>#${idx + 1} Wave ${entry.wave} (${entry.date})</span><strong>${entry.score} pts</strong>`;
        this.leaderboardList.appendChild(row);
      });
    }
  }

  showPerkDraft(offers, onSelect) {
    if (!this.perkDraftModal || !this.perkCardsContainer) return;
    this.onPerkSelectedCallback = onSelect;
    this.perkCardsContainer.innerHTML = '';

    offers.forEach((perk, index) => {
      const card = document.createElement('div');
      card.className = `perk-card rarity-${perk.rarity || 'common'}`;
      card.innerHTML = `
        <span class="perk-key-badge">${index + 1}</span>
        <div class="perk-card-icon">${perk.icon || '✨'}</div>
        <div class="perk-card-name">${perk.name}</div>
        <div class="perk-card-desc">${perk.description}</div>
        <div class="perk-card-btn">Select [${index + 1}]</div>
      `;
      card.addEventListener('click', () => {
        this.hidePerkDraft();
        if (this.onPerkSelectedCallback) this.onPerkSelectedCallback(perk);
      });
      this.perkCardsContainer.appendChild(card);
    });

    if (this.perkKeyHandler) {
      window.removeEventListener('keydown', this.perkKeyHandler);
    }
    this.perkKeyHandler = (e) => {
      let chosenIndex = -1;
      if (e.key === '1') chosenIndex = 0;
      else if (e.key === '2') chosenIndex = 1;
      else if (e.key === '3') chosenIndex = 2;

      if (chosenIndex >= 0 && chosenIndex < offers.length) {
        window.removeEventListener('keydown', this.perkKeyHandler);
        this.perkKeyHandler = null;
        this.hidePerkDraft();
        if (this.onPerkSelectedCallback) this.onPerkSelectedCallback(offers[chosenIndex]);
      }
    };
    window.addEventListener('keydown', this.perkKeyHandler);

    this.perkDraftModal.style.display = 'flex';
  }

  hidePerkDraft() {
    if (this.perkDraftModal) {
      this.perkDraftModal.style.display = 'none';
    }
    if (this.perkKeyHandler) {
      window.removeEventListener('keydown', this.perkKeyHandler);
      this.perkKeyHandler = null;
    }
  }

  // ==========================================================================
  // FUSION CODEX (Spec Section 3.8 & Codex.json)
  // ==========================================================================

  renderCodex() {
    if (!this.codexGrid) return;
    if (!this.codexActiveTab) this.codexActiveTab = 'fusions';

    // Ensure Tab Header Bar exists
    let tabBar = document.getElementById('codexTabBar');
    if (!tabBar && this.codexModal) {
      tabBar = document.createElement('div');
      tabBar.id = 'codexTabBar';
      tabBar.style.cssText = 'display:flex; justify-content:center; gap:12px; margin-bottom:16px;';
      const modalContent = this.codexGrid.parentElement;
      if (modalContent) {
        modalContent.insertBefore(tabBar, this.codexGrid);
      }
    }

    if (tabBar) {
      tabBar.innerHTML = `
        <button id="tabFusions" style="background:${this.codexActiveTab === 'fusions' ? '#00f5d4' : 'rgba(255,255,255,0.1)'}; color:${this.codexActiveTab === 'fusions' ? '#000' : '#fff'}; border:none; border-radius:8px; padding:6px 14px; font-weight:bold; cursor:pointer;">🍲 Fusions (9)</button>
        <button id="tabForms" style="background:${this.codexActiveTab === 'forms' ? '#00f5d4' : 'rgba(255,255,255,0.1)'}; color:${this.codexActiveTab === 'forms' ? '#000' : '#fff'}; border:none; border-radius:8px; padding:6px 14px; font-weight:bold; cursor:pointer;">🐸 Forms (12)</button>
        <button id="tabRecipes" style="background:${this.codexActiveTab === 'recipes' ? '#00f5d4' : 'rgba(255,255,255,0.1)'}; color:${this.codexActiveTab === 'recipes' ? '#000' : '#fff'}; border:none; border-radius:8px; padding:6px 14px; font-weight:bold; cursor:pointer;">📜 Secret Recipes (8)</button>
      `;

      tabBar.querySelector('#tabFusions').addEventListener('click', () => {
        this.codexActiveTab = 'fusions';
        this.renderCodex();
      });
      tabBar.querySelector('#tabForms').addEventListener('click', () => {
        this.codexActiveTab = 'forms';
        this.renderCodex();
      });
      tabBar.querySelector('#tabRecipes').addEventListener('click', () => {
        this.codexActiveTab = 'recipes';
        this.renderCodex();
      });
    }

    this.codexGrid.innerHTML = '';

    if (this.codexActiveTab === 'fusions') {
      const discovered = saveManager.get('discoveredCodex', []);
      const entries = codexData.entries || [];
      if (this.codexCount) {
        this.codexCount.textContent = discovered.length.toString();
      }

      entries.forEach((entry) => {
        const isUnlocked = discovered.includes(entry.id);
        const card = document.createElement('div');
        card.className = `codex-card ${isUnlocked ? 'unlocked' : 'locked'}`;
        if (isUnlocked && entry.color) {
          card.style.borderColor = entry.color;
        }

        if (isUnlocked) {
          const recipeText = entry.recipe.join(' + ');
          card.innerHTML = `
            <div class="codex-card-top">
              <div class="codex-card-icon" style="border: 1.5px solid ${entry.color || '#fff'}">${entry.icon}</div>
              <div class="codex-card-info">
                <div class="codex-card-cat">${entry.category}</div>
                <div class="codex-card-name" style="color:${entry.color || '#fff'}">${entry.name}</div>
              </div>
            </div>
            <div><span class="codex-recipe-badge">Recipe: ${recipeText}</span></div>
            <div class="codex-card-desc">${entry.hint}</div>
            <div class="codex-card-hint">“${entry.lore}”</div>
          `;
        } else {
          card.innerHTML = `
            <div class="codex-card-top">
              <div class="codex-card-icon">🔒</div>
              <div class="codex-card-info">
                <div class="codex-card-cat">${entry.category}</div>
                <div class="codex-card-name">???</div>
              </div>
            </div>
            <div><span class="codex-recipe-badge">Recipe: Unknown</span></div>
            <div class="codex-card-hint">💡 Hint: ${entry.hint}</div>
          `;
        }
        this.codexGrid.appendChild(card);
      });
    } else if (this.codexActiveTab === 'forms') {
      Object.values(formsData).forEach((form) => {
        const card = document.createElement('div');
        card.className = 'codex-card unlocked';
        const colors = { ember: '#ff5400', frost: '#00f5d4', spark: '#fee440', hybrid: '#f72585' };
        const accent = colors[form.element] || '#00f5d4';
        card.style.borderColor = accent;

        const reqText = Object.entries(form.requires).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(' & ');
        card.innerHTML = `
          <div class="codex-card-top">
            <div class="codex-card-icon" style="border: 1.5px solid ${accent}">${form.element === 'ember' ? '🔥' : form.element === 'frost' ? '❄️' : form.element === 'spark' ? '⚡' : '✨'}</div>
            <div class="codex-card-info">
              <div class="codex-card-cat">Stage ${form.stage || 1} ${form.element.toUpperCase()}</div>
              <div class="codex-card-name" style="color:${accent}">${form.name}</div>
            </div>
          </div>
          <div><span class="codex-recipe-badge" style="border-color:${accent}">Requires: ${reqText}</span></div>
          <div class="codex-card-desc">${form.banner?.subtitle || ''}</div>
        `;
        this.codexGrid.appendChild(card);
      });
    } else if (this.codexActiveTab === 'recipes') {
      let savedRecipes = [];
      try {
        savedRecipes = JSON.parse(localStorage.getItem('tode_recipes_discovered') || '[]');
      } catch (e) {}

      Object.values(recipesData).forEach((r) => {
        const isUnlocked = savedRecipes.includes(r.id);
        const card = document.createElement('div');
        card.className = `codex-card ${isUnlocked ? 'unlocked' : 'locked'}`;
        const accent = '#ffd166';
        if (isUnlocked) card.style.borderColor = accent;

        if (isUnlocked) {
          const seqText = r.sequence.map((s) => s.toUpperCase()).join(' + ');
          card.innerHTML = `
            <div class="codex-card-top">
              <div class="codex-card-icon" style="border: 1.5px solid ${accent}">🍲</div>
              <div class="codex-card-info">
                <div class="codex-card-cat">Secret Feast (18s)</div>
                <div class="codex-card-name" style="color:${accent}">${r.name}</div>
              </div>
            </div>
            <div><span class="codex-recipe-badge" style="border-color:${accent}">Sequence: ${seqText}</span></div>
            <div class="codex-card-hint">“${r.whisper}”</div>
          `;
        } else {
          card.innerHTML = `
            <div class="codex-card-top">
              <div class="codex-card-icon">🔒</div>
              <div class="codex-card-info">
                <div class="codex-card-cat">Secret Recipe</div>
                <div class="codex-card-name">???</div>
              </div>
            </div>
            <div><span class="codex-recipe-badge">Sequence: [ ? ] [ ? ] [ ? ]</span></div>
            <div class="codex-card-hint">🧙‍♂️ Whisper: “${r.whisper}”</div>
          `;
        }
        this.codexGrid.appendChild(card);
      });
    }
  }

  openCodex() {
    this.renderCodex();
    if (this.codexModal) {
      this.codexModal.style.display = 'flex';
      this.isCodexOpen = true;
    }
  }

  closeCodex() {
    if (this.codexModal) {
      this.codexModal.style.display = 'none';
      this.isCodexOpen = false;
    }
  }

  toggleCodex() {
    if (this.isCodexOpen) {
      this.closeCodex();
    } else {
      this.openCodex();
    }
  }

  // ==========================================================================
  // WAVE 10 VICTORY SCREEN ("Pond Saved")
  // ==========================================================================

  showWave10Victory(score, tadpolesCount, streak, onEndless, onRestart) {
    if (!this.victoryModal) return;
    if (this.victoryScoreVal) this.victoryScoreVal.textContent = Math.floor(score).toString();
    if (this.victoryTadpolesVal) this.victoryTadpolesVal.textContent = `${tadpolesCount} / 5`;
    if (this.victoryStreakVal) this.victoryStreakVal.textContent = streak.toString();

    if (this.endlessBtn) {
      this.endlessBtn.onclick = () => {
        this.hideWave10Victory();
        if (onEndless) onEndless();
      };
    }
    if (this.victoryRestartBtn) {
      this.victoryRestartBtn.onclick = () => {
        this.hideWave10Victory();
        if (onRestart) onRestart();
      };
    }

    this.victoryModal.style.display = 'flex';
  }

  hideWave10Victory() {
    if (this.victoryModal) {
      this.victoryModal.style.display = 'none';
    }
  }
}
