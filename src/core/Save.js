// TODE AND THE LAST LILYPAD - Versioned Storage Manager (Spec Section 4.11)
// Safe localStorage wrapper with fail-soft memory fallback if storage is blocked.

const STORAGE_KEY = 'tode_save_v2';

const DEFAULT_SAVE = {
  version: 2,
  highScore: 0,
  longestStreak: 0,
  tutorialSeen: false,
  discoveredCodex: ['plain_spit'],
  unlockedBadges: [],
  tadpolesSavedTotal: 0,
  settings: {
    masterVolume: 0.8,
    sfxVolume: 0.8,
    bgmVolume: 0.5,
    screenShake: true,
    reducedMotion: false,
    quality: 'auto', // 'auto', 'high', 'low'
  },
};

export class SaveManager {
  constructor() {
    this.memoryCache = { ...DEFAULT_SAVE };
    this.isStorageAvailable = this.checkStorage();
    this.load();
  }

  checkStorage() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      console.warn('[SaveManager] localStorage unavailable; falling back to in-memory state.');
      return false;
    }
  }

  load() {
    if (!this.isStorageAvailable) return this.memoryCache;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.memoryCache = {
          ...DEFAULT_SAVE,
          ...parsed,
          settings: { ...DEFAULT_SAVE.settings, ...(parsed.settings || {}) },
        };
      }
    } catch (err) {
      console.warn('[SaveManager] Failed to read save from localStorage:', err);
    }
    return this.memoryCache;
  }

  save() {
    if (!this.isStorageAvailable) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memoryCache));
    } catch (err) {
      console.warn('[SaveManager] Failed to write save to localStorage:', err);
    }
  }

  get(key, fallback = null) {
    return this.memoryCache[key] !== undefined ? this.memoryCache[key] : fallback;
  }

  set(key, value) {
    this.memoryCache[key] = value;
    this.save();
  }

  updateSetting(settingKey, value) {
    this.memoryCache.settings[settingKey] = value;
    this.save();
  }

  discoverFusion(codexId) {
    if (!this.memoryCache.discoveredCodex.includes(codexId)) {
      this.memoryCache.discoveredCodex.push(codexId);
      this.save();
      return true;
    }
    return false;
  }

  unlockBadge(badgeId) {
    if (!this.memoryCache.unlockedBadges.includes(badgeId)) {
      this.memoryCache.unlockedBadges.push(badgeId);
      this.save();
      return true;
    }
    return false;
  }
}

export const saveManager = new SaveManager();
