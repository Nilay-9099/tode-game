// TODE AND THE LAST LILYPAD - Master Constants & Configuration
// All tunable numbers, colors, and recipes are centralized here.

export const GAME_CONSTANTS = {
  // Course Extension Flag (Spec Section 0.2: Additive only, can toggle extension)
  EXTENSION_ENABLED: true,

  // Arena Dimensions
  ARENA_SIZE: 760,
  ARENA_HALF: 380,
  POND_CENTER: { x: -200, y: 200 },
  POND_RADIUS: 55,

  // Player Stats
  PLAYER_SCALE: 28, // Scaled up ~1.5x - 1.6x from original 18-20 for heroic presence
  BASE_MOVE_SPEED: 3.8,
  JUMP_HEIGHT: 18,
  JUMP_DISTANCE: 40,
  MAX_HEARTS: 3,
  SHOCKWAVE_COOLDOWN: 1.2, // Fast 1.2s charge (reduced from 3.5s)
  SHOCKWAVE_RADIUS: 110,   // Expanded stomp radius
  SHOCKWAVE_DAMAGE: 2.5,   // Heavy 2.5 damage (squashes Gnomes in 1 hit!)
  SLAM_MAX_ENERGY: 100,
  SLAM_RADIUS: 175,

  // Tongue & Snatch
  SNATCH_RANGE: 190,
  SNATCH_COOLDOWN: 0.6,
  SNATCH_PULL_SPEED: 18.0,

  // Stomach & Fusion
  STOMACH_SLOTS: 2,
  DIGEST_TIME: 12.0, // seconds before swallowed bug is digested
  BURP_KNOCKBACK_RADIUS: 65,
  BURP_KNOCKBACK_FORCE: 80,

  // Spit
  SPIT_COOLDOWN: 0.45,
  SPIT_SPEED: 480, // units/sec
  SPIT_PLAIN_DAMAGE: 1,

  // Tadpole Defense
  INITIAL_TADPOLES: 5,
  TADPOLE_SWIM_RADIUS: 38,

  // Scoring
  SCORE_PER_KILL: 10,
  SCORE_FROZEN_SHATTER_MULT: 2.0,
  SCORE_TADPOLE_SAVED: 75,
  SCORE_WAVE_CLEAR: 100,
  STREAK_MULTIPLIERS: [1.0, 1.5, 2.0, 3.0],

  // Camera
  CAMERA_FOV: 32,
  CAMERA_OFFSET: { x: 230, y: -230, z: 220 },
  CAMERA_LERP_SPEED: 4.5,
  CAMERA_SLAM_FOV_KICK: 39,

  // Juice & Game Feel
  TRAUMA_DECAY: 2.2, // Screen shake trauma decay rate
  HIT_STOP_DURATION_MS: 75,
};

// Flavor Bug Types
export const FLAVOR_BUGS = {
  EMBER: {
    id: 'ember',
    name: 'Ember Fly',
    element: 'fire',
    colorHex: 0xff5400,
    colorCss: '#ff5400',
    glowColor: 0xff3700,
    icon: '🔥',
    score: 15,
  },
  FROST: {
    id: 'frost',
    name: 'Frost Beetle',
    element: 'ice',
    colorHex: 0x00f5d4,
    colorCss: '#00f5d4',
    glowColor: 0x00b4d8,
    icon: '❄️',
    score: 15,
  },
  SPARK: {
    id: 'spark',
    name: 'Spark Bug',
    element: 'electric',
    colorHex: 0xfee440,
    colorCss: '#fee440',
    glowColor: 0xffb703,
    icon: '⚡',
    score: 15,
  },
  CRUMB: {
    id: 'crumb',
    name: 'Garden Crumb',
    element: 'plain',
    colorHex: 0xffffff,
    colorCss: '#ffffff',
    glowColor: 0xcccccc,
    icon: '✨',
    score: 5,
  },
};

// Fusion Recipes (Order in stomach does not matter)
export const FUSION_RECIPES = {
  'fire+fire': {
    id: 'inferno',
    name: 'Inferno',
    icon: '🌋',
    colorHex: 0xff3b00,
    colorCss: '#ff3b00',
    description: 'Explosive fireball, leaves burning ground for 4s that incinerates foes',
    damage: 3.5,
    aoeRadius: 40,
    duration: 4.0, // burning puddle duration
  },
  'ice+ice': {
    id: 'glacier',
    name: 'Glacier',
    icon: '🧊',
    colorHex: 0x00f5d4,
    colorCss: '#00f5d4',
    description: 'Freezes foes for 2.5s. Shatter them with Shockwave for 2x Score!',
    damage: 2.0,
    freezeDuration: 2.5,
  },
  'electric+electric': {
    id: 'chain_lightning',
    name: 'Chain Lightning',
    icon: '⚡',
    colorHex: 0xffe600,
    colorCss: '#ffe600',
    description: 'Electrocutes target and arcs violently to up to 3 nearby invaders',
    damage: 2.5,
    chainCount: 3,
    chainRadius: 100,
  },
  'fire+ice': {
    id: 'steam_burst',
    name: 'Steam Burst',
    icon: '💨',
    colorHex: 0xc8b6ff,
    colorCss: '#c8b6ff',
    description: 'Expands a scalding steam cloud that blinds foes for 3.5s so they wander in panic',
    damage: 1.5,
    cloudRadius: 75,
    blindDuration: 3.5,
  },
  'electric+fire': {
    id: 'plasma_orb',
    name: 'Plasma Orb',
    icon: '🔮',
    colorHex: 0xff006e,
    colorCss: '#ff006e',
    description: 'Dense piercing plasma sphere drilling straight through rows of enemies',
    damage: 4.5,
    pierce: true,
    speed: 320,
  },
  'electric+ice': {
    id: 'shatter_shot',
    name: 'Shatter Shot',
    icon: '💠',
    colorHex: 0x70d6ff,
    colorCss: '#70d6ff',
    description: 'Spits a shotgun burst of 5 razor-sharp frost shards in a forward cone',
    damage: 1.5, // per shard
    shardCount: 5,
    spreadAngle: 0.55,
  },
  // Single element weak versions
  'fire': {
    id: 'fire_spit',
    name: 'Ember Spit',
    icon: '🔥',
    colorHex: 0xff6b35,
    colorCss: '#ff6b35',
    description: 'Single fiery spit with mild burn',
    damage: 1.5,
  },
  'ice': {
    id: 'ice_spit',
    name: 'Frost Spit',
    icon: '❄️',
    colorHex: 0x48cae4,
    colorCss: '#48cae4',
    description: 'Single frosty spit that slows target',
    damage: 1.2,
    slowDuration: 1.5,
  },
  'electric': {
    id: 'electric_spit',
    name: 'Spark Spit',
    icon: '⚡',
    colorHex: 0xffd166,
    colorCss: '#ffd166',
    description: 'Single electric jolt',
    damage: 1.5,
  },
  'empty': {
    id: 'plain_spit',
    name: 'Mud Spit',
    icon: '💧',
    colorHex: 0xa8dadc,
    colorCss: '#a8dadc',
    description: 'Basic frog spit',
    damage: 0.8,
  },
};

// Enemy Types Configuration
export const ENEMY_CONFIGS = {
  GNOME: {
    id: 'gnome',
    name: 'Gnome Raider',
    hp: 2,
    speed: 46,
    scale: 14,
    colorHex: 0x2a9d8f,
    score: 15,
    telegraphColor: 0x2a9d8f,
    targetPond: true, // Seeks pond to steal tadpole
  },
  ARMORED_BEETLE: {
    id: 'beetle',
    name: 'Armored Beetle',
    hp: 3,
    speed: 38,
    scale: 16,
    colorHex: 0x6c757d,
    score: 30,
    armored: true, // Immune until flipped by Shockwave
    flipDuration: 3.5,
  },
  WASP: {
    id: 'wasp',
    name: 'Dusk Wasp',
    hp: 1,
    speed: 82,
    scale: 11,
    colorHex: 0xf72585,
    score: 25,
    flying: true,
  },
  CROW: {
    id: 'crow',
    name: 'Night Crow',
    hp: 2,
    speed: 95,
    scale: 15,
    colorHex: 0x1d3557,
    score: 35,
    diveBomber: true,
    shadowTelegraphTime: 1.4,
  },
  BOSS_MOWER: {
    id: 'boss_mower',
    name: 'Lawn Mower King',
    hp: 28,
    speed: 55,
    chargeSpeed: 140,
    scale: 32,
    colorHex: 0xd90429,
    score: 300,
    phases: 3,
  },
};

// Time of Day Phases
export const DAY_PHASES = {
  MORNING: {
    id: 'morning',
    name: '☀️ Morning Pond',
    banner: 'Wave 1: Sunny Morning - Gnome Raiders approaching!',
    skyColor: 0xbfe3ff,
    ambientColor: 0xffffff,
    ambientIntensity: 1.35,
    sunColor: 0xfffaf0,
    sunIntensity: 1.5,
    fogDensity: 0.0007,
    bugWeights: { ember: 0.55, frost: 0.25, spark: 0.2 },
  },
  NOON: {
    id: 'noon',
    name: '🌞 High Noon',
    banner: 'Wave 2: High Noon - Armored Beetles rolling in!',
    skyColor: 0x90e0ef,
    ambientColor: 0xffffff,
    ambientIntensity: 1.5,
    sunColor: 0xffeb3b,
    sunIntensity: 1.8,
    fogDensity: 0.0006,
    bugWeights: { ember: 0.25, frost: 0.55, spark: 0.2 },
  },
  DUSK: {
    id: 'dusk',
    name: '🌇 Golden Dusk',
    banner: 'Wave 3: Golden Dusk - Wasps swarming the garden!',
    skyColor: 0xf77f00,
    ambientColor: 0xffaa00,
    ambientIntensity: 1.1,
    sunColor: 0xd62828,
    sunIntensity: 1.6,
    fogDensity: 0.001,
    bugWeights: { ember: 0.2, frost: 0.2, spark: 0.6 },
  },
  NIGHT: {
    id: 'night',
    name: '🌙 Midnight Garden',
    banner: 'Wave 4: Midnight - Night Crows dive-bombing!',
    skyColor: 0x03045e,
    ambientColor: 0x14213d,
    ambientIntensity: 0.75,
    sunColor: 0x00f5d4,
    sunIntensity: 1.1,
    fogDensity: 0.0012,
    bugWeights: { ember: 0.33, frost: 0.33, spark: 0.34 },
  },
  BOSS_ARENA: {
    id: 'boss_arena',
    name: '⚠️ BOSS: Lawn Mower King!',
    banner: 'Wave 5: BOSS - Defeat the Lawn Mower King!',
    skyColor: 0x370617,
    ambientColor: 0x6a040f,
    ambientIntensity: 1.0,
    sunColor: 0xd90429,
    sunIntensity: 2.0,
    fogDensity: 0.0014,
    bugWeights: { ember: 0.35, frost: 0.35, spark: 0.3 },
  },
};
