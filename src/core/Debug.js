// TODE AND THE LAST LILYPAD - Debug Tools & QA Harness (Spec Section 4.12)
// Exposed on window.__tode when ?debug=1 or during local development.

export class DebugHarness {
  constructor() {
    this.params = new URLSearchParams(window.location.search);
    this.isEnabled = this.params.get('debug') === '1' || window.location.hostname === 'localhost';
    this.godMode = false;
    this.timeScale = 1.0;
    this.overlay = null;

    if (this.isEnabled) {
      this.initOverlay();
      this.initWindowBindings();
      console.log('🛠️ Tode Debug Harness active! Type "__tode" in console for commands.');
    }
  }

  initOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'todeDebugOverlay';
    this.overlay.style.cssText = `
      position: fixed;
      bottom: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.85);
      color: #00f5d4;
      font-family: monospace;
      font-size: 11px;
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid rgba(0, 245, 212, 0.3);
      z-index: 99999;
      pointer-events: none;
      line-height: 1.4;
    `;
    this.overlay.innerHTML = 'FPS: -- | Ent: -- | Scale: 1.0x';
    document.body.appendChild(this.overlay);

    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 60;
  }

  updateMetrics(entityCount = 0) {
    if (!this.overlay) return;
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastTime >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;
      this.overlay.innerHTML = `FPS: ${this.fps} | Ent: ${entityCount} | Scale: ${this.timeScale.toFixed(1)}x${this.godMode ? ' | [GOD]' : ''}`;
    }
  }

  initWindowBindings() {
    window.__tode = {
      help: () => {
        console.table({
          '__tode.setWave(n)': 'Jumps directly to wave number n (e.g. 5 for boss)',
          '__tode.giveBug(type)': 'Adds "ember", "frost", "spark", or "golden" to stomach',
          '__tode.spawn(type, count)': 'Spawns enemies near player ("gnome", "beetle", "wasp", "crow", "boss")',
          '__tode.setPhase(name)': 'Sets atmosphere ("MORNING", "NOON", "DUSK", "NIGHT", "BOSS_ARENA")',
          '__tode.god(bool)': 'Toggles invulnerability on/off',
          '__tode.timeScale(x)': 'Sets simulation time scale (0.1 for slow-mo, 2.0 for fast)',
          '__tode.slowmo(x)': 'Shortcut for timeScale(x)',
          '__tode.setAffinity(el, v)': 'Sets elemental affinity ("ember", "frost", "spark") to value v (0-100)',
          '__tode.evolve(el, stage)': 'Triggers evolution threshold for element (stage 1, 2, or 3)',
          '__tode.showForm(id)': 'Manually preview a form visual',
          '__tode.cook(recipeId)': 'Immediately triggers secret recipe feast',
          '__tode.history()': 'Returns current 3-bug swallowing history',
          '__tode.whisper()': 'Displays an Old Toad Sage recipe whisper',
          '__tode.playClip(id)': 'Plays animation clip on target entity',
          '__tode.winNow()': 'Triggers victory screen immediately',
          '__tode.loseNow()': 'Triggers game over screen immediately',
          '__tode.saveState()': 'Prints current save data'
        });
      },
      setWave: (n) => console.warn('Wired in main.js'),
      giveBug: (type) => console.warn('Wired in main.js'),
      spawn: (type, count) => console.warn('Wired in main.js'),
      setPhase: (name) => console.warn('Wired in main.js'),
      god: (bool) => {
        this.godMode = bool !== undefined ? bool : !this.godMode;
        console.log(`🛡️ God Mode: ${this.godMode ? 'ENABLED' : 'DISABLED'}`);
      },
      timeScale: (scale) => {
        this.timeScale = Math.max(0, Number(scale) || 1.0);
        console.log(`⏱️ Time Scale: ${this.timeScale}x`);
      },
      slowmo: (scale = 0.25) => {
        this.timeScale = Math.max(0, Number(scale) || 0.25);
        console.log(`⏱️ Slow-Mo Time Scale: ${this.timeScale}x`);
      },
      setAffinity: (el, v) => console.warn('Wired in main.js'),
      evolve: (el, stage) => console.warn('Wired in main.js'),
      showForm: (id) => console.warn('Wired in main.js'),
      cook: (recipeId) => console.warn('Wired in main.js'),
      showcase: () => console.warn('Wired in main.js'),
      history: () => [],
      whisper: () => console.warn('Wired in main.js'),
      playClip: (id) => console.warn('Wired in main.js'),
      winNow: () => console.warn('Wired in main.js'),
      loseNow: () => console.warn('Wired in main.js'),
    };
  }
}

export const debugHarness = new DebugHarness();
