// TODE AND THE LAST LILYPAD - Data Validation Script (Spec Section 4.6)
// Validates all data JSON files to prevent runtime game-breaking null pointers or invalid ranges.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../src/data');

function validate() {
  console.log('🔍 Validating Tode Data JSON files at:', dataDir);
  let errors = 0;

  // 1. Validate flavors.json
  const flavors = JSON.parse(fs.readFileSync(path.join(dataDir, 'flavors.json'), 'utf8'));
  const requiredFlavors = ['ember', 'frost', 'spark'];
  for (const rf of requiredFlavors) {
    if (!flavors[rf]) {
      console.error(`❌ flavors.json missing required flavor: "${rf}"`);
      errors++;
    } else {
      if (typeof flavors[rf].score !== 'number' || flavors[rf].score <= 0) {
        console.error(`❌ flavor "${rf}" has invalid score: ${flavors[rf].score}`);
        errors++;
      }
    }
  }

  // 2. Validate fusions.json
  const fusions = JSON.parse(fs.readFileSync(path.join(dataDir, 'fusions.json'), 'utf8'));
  const requiredPairs = [
    'ember+ember',
    'frost+frost',
    'spark+spark',
    'ember+frost',
    'ember+spark',
    'frost+spark',
    'empty'
  ];
  for (const pair of requiredPairs) {
    if (!fusions[pair]) {
      console.error(`❌ fusions.json missing key pair: "${pair}"`);
      errors++;
    } else {
      const f = fusions[pair];
      if (!f.projectile || typeof f.projectile.speed !== 'number' || f.projectile.speed < 100) {
        console.error(`❌ fusion "${pair}" has invalid projectile speed`);
        errors++;
      }
    }
  }

  // 3. Validate enemies.json
  const enemies = JSON.parse(fs.readFileSync(path.join(dataDir, 'enemies.json'), 'utf8'));
  const requiredEnemies = ['gnome', 'armored_beetle', 'wasp', 'crow', 'boss_mower'];
  for (const re of requiredEnemies) {
    if (!enemies[re]) {
      console.error(`❌ enemies.json missing required enemy: "${re}"`);
      errors++;
    } else {
      if (typeof enemies[re].maxHp !== 'number' || enemies[re].maxHp <= 0) {
        console.error(`❌ enemy "${re}" has invalid maxHp`);
        errors++;
      }
    }
  }

  // 4. Validate waves.json
  const wavesData = JSON.parse(fs.readFileSync(path.join(dataDir, 'waves.json'), 'utf8'));
  if (!Array.isArray(wavesData.waves) || wavesData.waves.length < 10) {
    console.error('❌ waves.json must contain at least 10 wave definitions');
    errors++;
  } else {
    for (const w of wavesData.waves) {
      if (typeof w.wave !== 'number' || !w.phase) {
        console.error(`❌ wave entry missing number or phase: ${JSON.stringify(w)}`);
        errors++;
      }
    }
  }

  // 5. Validate perks.json
  const perks = JSON.parse(fs.readFileSync(path.join(dataDir, 'perks.json'), 'utf8'));
  const perkKeys = Object.keys(perks);
  if (perkKeys.length < 11) {
    console.warn(`⚠️ Expected 11 perks, found ${perkKeys.length}`);
  }

  // 6. Validate codex.json
  const codex = JSON.parse(fs.readFileSync(path.join(dataDir, 'codex.json'), 'utf8'));
  if (!Array.isArray(codex.entries) || codex.entries.length < 9) {
    console.error(`❌ codex.json must contain at least 9 entries (found ${codex.entries?.length})`);
    errors++;
  }

  // 7. Validate evolution.json (v3 Spec Section 2.1)
  const evolution = JSON.parse(fs.readFileSync(path.join(dataDir, 'evolution.json'), 'utf8'));
  if (!evolution.thresholds || typeof evolution.thresholds.stage1 !== 'number') {
    console.error('❌ evolution.json missing thresholds object');
    errors++;
  } else {
    const { stage1, stage2, apex } = evolution.thresholds;
    if (!(stage1 < stage2 && stage2 < apex)) {
      console.error(`❌ evolution.json thresholds must be strictly ascending: ${stage1} < ${stage2} < ${apex}`);
      errors++;
    }
  }

  // 8. Validate forms.json (v3 Spec Section 2.2 & 2.3)
  const forms = JSON.parse(fs.readFileSync(path.join(dataDir, 'forms.json'), 'utf8'));
  const validPassiveTypes = new Set([
    'spitTrail', 'hopTrail', 'snatchStatus', 'snatchExtraTarget',
    'burpDamage', 'aura', 'chainBonus', 'shatterShards',
    'slamVariant', 'statusAmp', 'fusionMod', 'orbitingMotes'
  ]);
  const formKeys = Object.keys(forms);
  if (formKeys.length < 12) {
    console.error(`❌ forms.json expected 12 forms, found ${formKeys.length}`);
    errors++;
  }
  for (const [key, form] of Object.entries(forms)) {
    if (form.id !== key) {
      console.error(`❌ form key mismatch: "${key}" vs id "${form.id}"`);
      errors++;
    }
    if (!form.requires || typeof form.requires !== 'object') {
      console.error(`❌ form "${key}" missing valid requires object`);
      errors++;
    }
    if (!Array.isArray(form.passives)) {
      console.error(`❌ form "${key}" missing passives array`);
      errors++;
    } else {
      for (const p of form.passives) {
        if (!validPassiveTypes.has(p.type)) {
          console.error(`❌ form "${key}" has unknown passive type "${p.type}"`);
          errors++;
        }
      }
    }
  }

  // 9. Validate recipes.json (v3 Spec Section 3.2)
  const recipes = JSON.parse(fs.readFileSync(path.join(dataDir, 'recipes.json'), 'utf8'));
  const recipeKeys = Object.keys(recipes);
  if (recipeKeys.length < 8) {
    console.error(`❌ recipes.json expected 8 recipes, found ${recipeKeys.length}`);
    errors++;
  }
  for (const [rKey, r] of Object.entries(recipes)) {
    if (r.id !== rKey) {
      console.error(`❌ recipe key mismatch: "${rKey}" vs id "${r.id}"`);
      errors++;
    }
    if (!Array.isArray(r.sequence) || r.sequence.length !== 3) {
      console.error(`❌ recipe "${rKey}" must have sequence of exactly 3 elements`);
      errors++;
    }
    if (!r.feast || typeof r.feast.duration !== 'number') {
      console.error(`❌ recipe "${rKey}" missing feast duration`);
      errors++;
    }
    if (!r.whisper || typeof r.whisper !== 'string') {
      console.error(`❌ recipe "${rKey}" missing whisper hint string`);
      errors++;
    }
  }

  if (errors === 0) {
    console.log('✅ All Data JSON files PASSED validation successfully!');
    process.exit(0);
  } else {
    console.error(`❌ Data validation failed with ${errors} errors.`);
    process.exit(1);
  }
}

validate();
