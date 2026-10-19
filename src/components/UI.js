// TODE AND THE LAST LILYPAD - UI & Leaderboard Controller
// Connects EventBus events to the DOM HUD, Tutorial, Stomach slots, and Hall of Fame Leaderboard.

import { eventBus } from '../eventBus.js';

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
      }
    });
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
}
