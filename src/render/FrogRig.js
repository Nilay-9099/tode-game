// TODE AND THE LAST LILYPAD - Frog Rig & Anchor System (v3 Spec Section 2.4 & 6.2)
// Exposes named anchors and animatable rig targets on Tode's hierarchy.

import * as THREE from 'three';

export class FrogRig {
  constructor(playerGroup, todeMesh) {
    this.root = playerGroup;
    this.mesh = todeMesh;

    // Anchor points (Object3D dummies attached at spatial offsets)
    this.anchors = {
      back: new THREE.Object3D(),
      belly: new THREE.Object3D(),
      cheeks: new THREE.Object3D(),
      head: new THREE.Object3D(),
      legs: new THREE.Object3D(),
      eyes: new THREE.Object3D(),
      tongueTip: new THREE.Object3D(),
      throat: new THREE.Object3D(),
    };

    // Position spatial anchors relative to Tode's origin
    this.anchors.back.position.set(0, -4, 18);
    this.anchors.belly.position.set(0, 4, 10);
    this.anchors.cheeks.position.set(0, 8, 14);
    this.anchors.head.position.set(0, 2, 20);
    this.anchors.legs.position.set(0, -6, 2);
    this.anchors.eyes.position.set(0, 8, 22);
    this.anchors.throat.position.set(0, 6, 12);
    this.anchors.tongueTip.position.set(0, 14, 13);

    for (const [name, anchor] of Object.entries(this.anchors)) {
      anchor.name = `anchor_${name}`;
      this.root.add(anchor);
    }

    // Animatable sub-targets for ClipPlayer and procedural tweens
    this.targets = {
      body: this.mesh || this.root,
      belly: this.anchors.belly,
      cheeks: this.anchors.cheeks,
      throat: this.anchors.throat,
      eyes: this.anchors.eyes,
      head: this.anchors.head,
      legs: this.anchors.legs,
      tongueTip: this.anchors.tongueTip,
    };

    // Active layer attachments and emitters
    this.attachments = new Map();
    this.activeFormIds = new Set();
  }

  getAnchor(name) {
    return this.anchors[name] || this.root;
  }

  getAnimTargets() {
    return this.targets;
  }

  update(delta) {
    // Subtle idle animation on anchors if attachments exist
    for (const [id, att] of this.attachments) {
      if (att && att.update) att.update(delta);
    }
  }
}
