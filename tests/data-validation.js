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

  if (errors === 0) {
    console.log('✅ All Data JSON files PASSED validation successfully!');
    process.exit(0);
  } else {
    console.error(`❌ Data validation failed with ${errors} errors.`);
    process.exit(1);
  }
}

validate();
