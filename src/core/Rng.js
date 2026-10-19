// TODE AND THE LAST LILYPAD - Seeded Mulberry32 RNG (Spec Section 4.1)

export function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStringToInt(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash;
}

export function getTodaySeedString() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export class RngManager {
  constructor(initialSeed = null) {
    this.seedStr = initialSeed || getTodaySeedString();
    this.seedInt = hashStringToInt(this.seedStr);
    this.generator = mulberry32(this.seedInt);
    this.isSeededMode = false;
  }

  setSeed(seedStr) {
    this.seedStr = seedStr;
    this.seedInt = typeof seedStr === 'number' ? seedStr : hashStringToInt(seedStr);
    this.generator = mulberry32(this.seedInt);
    this.isSeededMode = true;
  }

  resetDaily() {
    this.setSeed(getTodaySeedString());
  }

  disableSeededMode() {
    this.isSeededMode = false;
  }

  // Returns float in [0, 1)
  random() {
    return this.isSeededMode ? this.generator() : Math.random();
  }

  // Float in [min, max)
  range(min, max) {
    return min + this.random() * (max - min);
  }

  // Int in [min, max]
  rangeInt(min, max) {
    return Math.floor(min + this.random() * (max - min + 1));
  }

  // Choice from array
  choice(array) {
    if (!array || array.length === 0) return null;
    return array[Math.floor(this.random() * array.length)];
  }
}

export const rng = new RngManager();
