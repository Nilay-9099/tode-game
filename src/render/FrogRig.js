// TODE AND THE LAST LILYPAD - Frog Rig & Form Visual Layers (v3 Spec Section 2.4 & 7.3)
// Manages anchors, skin tints, emissive spots, and procedural 3D attachments for all 12 forms.

import * as THREE from 'three';
import formsData from '../data/forms.json';
import { eventBus, V3_EVENTS } from '../eventBus.js';

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
    this.attachments = [];
    this.activeFormIds = new Set();
    this.activeHybridId = null;

    // Auto-listen to form changes
    eventBus.on(V3_EVENTS.FORM_CHANGED, (forms, hybrid) => {
      this.applyForms(forms, hybrid);
    });
  }

  getAnchor(name) {
    return this.anchors[name] || this.root;
  }

  getAnimTargets() {
    return this.targets;
  }

  clearAttachments() {
    for (const att of this.attachments) {
      if (att.parent) att.parent.remove(att);
      if (att.geometry) att.geometry.dispose();
      if (att.material) att.material.dispose();
    }
    this.attachments = [];
  }

  applyForms(formIds = [], hybridId = null) {
    this.clearAttachments();
    this.activeFormIds = new Set(formIds);
    this.activeHybridId = hybridId;

    // If hybrid is active, it takes priority and displays its unique look
    const formsToRender = hybridId ? [hybridId] : formIds;

    for (const formKey of formsToRender) {
      const def = formsData[formKey];
      if (!def || !def.visual) continue;

      // 1. Emissive Spots on Anchors
      if (def.visual.emissive) {
        for (const em of def.visual.emissive) {
          const anchor = this.getAnchor(em.anchor);
          const spotGeo = new THREE.SphereGeometry(1.8, 8, 8);
          const spotMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(em.color),
          });
          const spotMesh = new THREE.Mesh(spotGeo, spotMat);
          anchor.add(spotMesh);
          this.attachments.push(spotMesh);
        }
      }

      // 2. Procedural Attachment Meshes
      if (def.visual.attachments) {
        for (const attName of def.visual.attachments) {
          this.createAttachmentMesh(attName, def);
        }
      }
    }
  }

  createAttachmentMesh(name, formDef) {
    let mesh = null;
    let anchor = this.anchors.back;

    switch (name) {
      case 'cinderFreckles': {
        anchor = this.anchors.back;
        const geo = new THREE.DodecahedronGeometry(1.2);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff5400 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, 0);
        break;
      }
      case 'flameCrest': {
        anchor = this.anchors.head;
        const geo = new THREE.ConeGeometry(2.5, 7, 5);
        geo.rotateX(-Math.PI / 6);
        const mat = new THREE.MeshStandardMaterial({
          color: 0xff5400,
          emissive: 0xff3700,
          emissiveIntensity: 0.9,
          roughness: 0.2,
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, -2, 4);
        break;
      }
      case 'bellyVents': {
        anchor = this.anchors.belly;
        const geo = new THREE.CylinderGeometry(1.5, 1.5, 1, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff6a1a });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 2, 0);
        break;
      }
      case 'lavaCrust': {
        anchor = this.anchors.back;
        const geo = new THREE.BoxGeometry(10, 8, 2);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x1f1f1f,
          emissive: 0xd90429,
          emissiveIntensity: 0.8,
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 0, 2);
        break;
      }
      case 'frostPatches':
      case 'backCrystals': {
        anchor = this.anchors.back;
        const geo = new THREE.OctahedronGeometry(2.2);
        const mat = new THREE.MeshStandardMaterial({
          color: 0xa2d2ff,
          emissive: 0x00f5d4,
          emissiveIntensity: 0.6,
          roughness: 0.1,
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 0, 2);
        break;
      }
      case 'iceCrestSpikes': {
        anchor = this.anchors.head;
        const geo = new THREE.ConeGeometry(2, 8, 4);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x00b4d8,
          emissive: 0x90e0ef,
          emissiveIntensity: 0.8,
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, -1, 5);
        break;
      }
      case 'glacierPlates': {
        anchor = this.anchors.back;
        const geo = new THREE.DodecahedronGeometry(5);
        const mat = new THREE.MeshStandardMaterial({
          color: 0xe0fbfc,
          emissive: 0x00b4d8,
          emissiveIntensity: 0.7,
          roughness: 0.1,
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 0, 3);
        break;
      }
      case 'staticStripes':
      case 'crackleSpines': {
        anchor = this.anchors.back;
        const geo = new THREE.BoxGeometry(2, 12, 1.5);
        const mat = new THREE.MeshBasicMaterial({ color: 0xfee440 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 0, 1);
        break;
      }
      case 'wireAntennae':
      case 'thunderCrown': {
        anchor = this.anchors.head;
        const geo = new THREE.TorusGeometry(3.5, 0.6, 8, 16);
        geo.rotateX(Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 0, 6);
        break;
      }
      case 'steamValves': {
        anchor = this.anchors.belly;
        const geo = new THREE.CylinderGeometry(1.8, 1.8, 2, 8);
        const mat = new THREE.MeshStandardMaterial({ color: 0x94d2bd, emissive: 0xe0fbfc });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 3, 0);
        break;
      }
      case 'plasmaWings': {
        anchor = this.anchors.back;
        const geo = new THREE.ConeGeometry(3, 14, 4);
        geo.rotateZ(Math.PI / 4);
        const mat = new THREE.MeshBasicMaterial({ color: 0xf72585 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(-4, 0, 4);
        break;
      }
      case 'auroraRibbons': {
        anchor = this.anchors.back;
        const geo = new THREE.TorusGeometry(6, 0.8, 6, 24);
        geo.rotateY(Math.PI / 4);
        const mat = new THREE.MeshBasicMaterial({ color: 0x48cae4 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 0, 4);
        break;
      }
      default:
        break;
    }

    if (mesh && anchor) {
      anchor.add(mesh);
      this.attachments.push(mesh);
    }
  }

  update(delta) {
    // Subtle rotation or breathing on attachments
    const t = performance.now() * 0.003;
    for (const att of this.attachments) {
      if (att.geometry && att.geometry.type === 'TorusGeometry') {
        att.rotation.z += delta * 2;
      }
    }
  }
}
