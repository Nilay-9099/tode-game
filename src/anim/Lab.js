// TODE AND THE LAST LILYPAD - Animation Lab (?lab=1) (v3 Spec Section 6.4)
// Isolated inspection and scrubbing stage for Tode, enemies, bugs, and clips.

import * as THREE from 'three';
import { ClipPlayer } from './ClipPlayer.js';
import { FrogRig } from '../render/FrogRig.js';
import { TongueRope } from '../render/TongueRope.js';
import { createPlayer } from '../components/Player.js';
import { ENEMY_CONFIGS, FLAVOR_BUGS } from '../constants.js';
import clipsData from '../data/anim/clips.json';

export class AnimationLab {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a2130);

    // Camera
    this.camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 10, 1000);
    this.camera.position.set(0, -140, 90);
    this.camera.lookAt(0, 0, 15);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.8);
    dir.position.set(-60, -90, 150);
    dir.castShadow = true;
    this.scene.add(dir);

    // Pedestal floor
    const pedGeo = new THREE.CylinderGeometry(55, 60, 6, 32);
    const pedMat = new THREE.MeshStandardMaterial({ color: 0x223046, roughness: 0.4 });
    const pedestal = new THREE.Mesh(pedGeo, pedMat);
    pedestal.rotation.x = Math.PI / 2;
    pedestal.position.z = -3;
    this.scene.add(pedestal);

    // Clip Player
    this.clipPlayer = new ClipPlayer(clipsData);
    this.currentClipId = 'idle_breathe';
    this.activeInstance = null;
    this.speed = 1.0;
    this.isPaused = false;
    this.isLooping = true;

    // Entities
    this.tode = null;
    this.rig = null;
    this.tongueRope = null;
    this.clock = new THREE.Clock();

    this.initEntities().then(() => {
      this.initUI();
      this.playClip(this.currentClipId);
      this.startLoop();
    });
  }

  async initEntities() {
    // 1. Tode Frog
    this.tode = await createPlayer();
    this.tode.group.position.set(0, 0, 0);
    this.scene.add(this.tode.group);

    this.rig = new FrogRig(this.tode.group, this.tode.mesh);
    this.tongueRope = new TongueRope(this.scene);

    // 2. Sample Bug hovering nearby
    const bugGeo = new THREE.SphereGeometry(3.5, 12, 12);
    const bugMat = new THREE.MeshStandardMaterial({
      color: FLAVOR_BUGS.EMBER.colorHex,
      emissive: FLAVOR_BUGS.EMBER.glowColor,
      emissiveIntensity: 0.8,
    });
    this.bugMesh = new THREE.Mesh(bugGeo, bugMat);
    this.bugMesh.position.set(28, 28, 16);
    this.scene.add(this.bugMesh);
  }

  initUI() {
    const bar = document.createElement('div');
    bar.id = 'animLabControlBar';
    bar.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(0, 245, 212, 0.4);
      border-radius: 16px;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      z-index: 100000;
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;

    // Title Badge
    const title = document.createElement('div');
    title.innerHTML = '<span style="color:#00f5d4; font-weight:bold;">🔬 ANIMATION LAB</span>';
    bar.appendChild(title);

    // Clip Selector Dropdown
    const select = document.createElement('select');
    select.style.cssText = 'background:#1e293b; color:#fff; border:1px solid #334155; border-radius:8px; padding:6px 10px; cursor:pointer;';
    for (const key of Object.keys(clipsData)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = key;
      select.appendChild(opt);
    }
    select.value = this.currentClipId;
    select.addEventListener('change', (e) => {
      this.playClip(e.target.value);
    });
    this.clipSelect = select;
    bar.appendChild(select);

    // Play / Pause Button
    const playBtn = document.createElement('button');
    playBtn.textContent = '⏸ Pause';
    playBtn.style.cssText = 'background:#3b82f6; color:#fff; border:none; border-radius:8px; padding:6px 12px; cursor:pointer; font-weight:bold;';
    playBtn.addEventListener('click', () => {
      this.isPaused = !this.isPaused;
      playBtn.textContent = this.isPaused ? '▶ Play' : '⏸ Pause';
    });
    bar.appendChild(playBtn);

    // Speed Selector (1.0x, 0.5x, 0.25x)
    const speedContainer = document.createElement('div');
    speedContainer.style.display = 'flex';
    speedContainer.style.gap = '6px';
    [1.0, 0.5, 0.25].forEach((spd) => {
      const btn = document.createElement('button');
      btn.textContent = `${spd}x`;
      btn.style.cssText = `background:${spd === 1.0 ? '#00f5d4' : '#334155'}; color:${spd === 1.0 ? '#000' : '#fff'}; border:none; border-radius:6px; padding:4px 8px; cursor:pointer; font-weight:bold; font-size:12px;`;
      btn.addEventListener('click', () => {
        this.speed = spd;
        Array.from(speedContainer.children).forEach((b) => {
          b.style.background = '#334155';
          b.style.color = '#fff';
        });
        btn.style.background = '#00f5d4';
        btn.style.color = '#000';
        if (this.activeInstance) this.activeInstance.speed = spd;
      });
      speedContainer.appendChild(btn);
    });
    bar.appendChild(speedContainer);

    // Scrubber Range Slider
    const scrubber = document.createElement('input');
    scrubber.type = 'range';
    scrubber.min = '0';
    scrubber.max = '100';
    scrubber.value = '0';
    scrubber.style.cssText = 'width: 140px; cursor: pointer; accent-color: #00f5d4;';
    scrubber.addEventListener('input', (e) => {
      if (this.activeInstance) {
        const pct = parseFloat(e.target.value) / 100;
        this.activeInstance.elapsed = pct * this.activeInstance.duration;
      }
    });
    this.scrubber = scrubber;
    bar.appendChild(scrubber);

    // Exit Button
    const exitBtn = document.createElement('button');
    exitBtn.textContent = '❌ Exit Lab';
    exitBtn.style.cssText = 'background:#ef4444; color:#fff; border:none; border-radius:8px; padding:6px 12px; cursor:pointer; font-size:12px;';
    exitBtn.addEventListener('click', () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('lab');
      window.location.href = url.toString();
    });
    bar.appendChild(exitBtn);

    document.body.appendChild(bar);
  }

  playClip(clipId) {
    this.currentClipId = clipId;
    this.clipPlayer.stopAll();

    const targets = this.rig ? this.rig.getAnimTargets() : {};
    this.activeInstance = this.clipPlayer.play(clipId, {
      tode: targets,
      tongue: { extend: 0 },
    }, {
      speed: this.speed,
      loop: this.isLooping,
    });
  }

  startLoop() {
    this.renderer.setAnimationLoop(() => {
      const delta = this.clock.getDelta();

      if (!this.isPaused && this.activeInstance) {
        this.clipPlayer.update(delta);
        if (this.scrubber && this.activeInstance.duration > 0) {
          const pct = (this.activeInstance.elapsed / this.activeInstance.duration) * 100;
          this.scrubber.value = pct.toFixed(1);
        }
      }

      // Rotate camera subtly
      const t = performance.now() * 0.0004;
      this.camera.position.x = Math.sin(t) * 110;
      this.camera.position.y = -Math.cos(t) * 110;
      this.camera.lookAt(0, 0, 15);

      this.renderer.render(this.scene, this.camera);
    });
  }
}
