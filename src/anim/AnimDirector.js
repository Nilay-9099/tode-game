// TODE AND THE LAST LILYPAD - Animation Director (v3 Spec Section 6.2)
// Subscribes to EventBus and orchestrates clips and procedural tweens on active entities.

import { eventBus, V3_EVENTS } from '../eventBus.js';
import { ClipPlayer } from './ClipPlayer.js';
import clipsData from '../data/anim/clips.json';

export class AnimDirector {
  constructor(sounds, gameCamera, particles) {
    this.sounds = sounds;
    this.gameCamera = gameCamera;
    this.particles = particles;
    this.clipPlayer = new ClipPlayer(clipsData);

    this.targets = {
      tode: null,
      tongue: null,
    };

    this.initSubscriptions();
  }

  setTargets(targets) {
    this.targets = { ...this.targets, ...targets };
  }

  initSubscriptions() {
    // 1. Hop Animation
    eventBus.on('player:hop', (direction) => {
      if (this.targets.tode) {
        this.clipPlayer.play('hop', { tode: this.targets.tode });
      }
    });

    // 2. Snatch Hit / Miss
    eventBus.on('tongue:hit', (bugConfig) => {
      if (this.targets.tode) {
        this.clipPlayer.play('snatch_success', {
          tode: this.targets.tode,
          tongue: this.targets.tongue,
        });
      }
    });

    eventBus.on('tongue:miss', () => {
      if (this.targets.tode) {
        this.clipPlayer.play('snatch_miss', {
          tode: this.targets.tode,
          tongue: this.targets.tongue,
        });
      }
    });

    // 3. Gulp Throat Bulge
    eventBus.on('bug:snatched', (bugConfig) => {
      if (this.targets.tode) {
        this.clipPlayer.play('gulp_throat', { tode: this.targets.tode });
      }
    });

    // 4. Spit Recoil
    eventBus.on('spit:fired', (fusion) => {
      if (this.targets.tode) {
        this.clipPlayer.play('spit_recoil', { tode: this.targets.tode });
      }
    });

    // 5. Shockwave Stomp
    eventBus.on('shockwave:fired', () => {
      if (this.targets.tode) {
        this.clipPlayer.play('shockwave_stomp', { tode: this.targets.tode });
      }
    });

    // 6. Meteor Slam
    eventBus.on('slam:fired', () => {
      if (this.targets.tode) {
        this.clipPlayer.play('meteor_slam', { tode: this.targets.tode });
      }
    });

    // 7. Hurt Recoil
    eventBus.on('player:damaged', () => {
      if (this.targets.tode) {
        this.clipPlayer.play('hurt_recoil', { tode: this.targets.tode });
      }
    });

    // 8. Burp Puff
    eventBus.on('stomach:burp', () => {
      if (this.targets.tode) {
        this.clipPlayer.play('burp_puff', { tode: this.targets.tode });
      }
    });

    // 9. Death Flop
    eventBus.on('game:over', () => {
      if (this.targets.tode) {
        this.clipPlayer.play('death_flop', { tode: this.targets.tode });
      }
    });

    // 10. Generic Clip Request
    eventBus.on(V3_EVENTS.ANIM_REQUEST, (clipId, targetOverride, options) => {
      const ctx = targetOverride || this.targets;
      this.clipPlayer.play(clipId, ctx, options);
    });

    // 6. Handle clip events (sfx, hitstop, shake, vfx)
    eventBus.on('clip:sfx', (ev) => {
      if (!this.sounds) return;
      if (ev.id === 'jump' && this.sounds.playJump) this.sounds.playJump();
      else if (ev.id === 'gulp' && this.sounds.playGulp) this.sounds.playGulp();
      else if (ev.id === 'spit' && this.sounds.playSpit) this.sounds.playSpit();
      else if (ev.id === 'snatchWhoosh' && this.sounds.playTongueShoot) this.sounds.playTongueShoot();
    });

    eventBus.on('clip:shake', (ev) => {
      if (this.gameCamera && ev.trauma) {
        this.gameCamera.addTrauma(ev.trauma);
      }
    });

    eventBus.on('clip:hitstop', (ev) => {
      // Hitstop handled via global timeScale easing
    });
  }

  update(delta) {
    this.clipPlayer.update(delta);
  }
}
