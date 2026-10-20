// TODE AND THE LAST LILYPAD - Tongue Rope Spline System (v3 Spec Section 7.2)
// CatmullRom spline with 10 simulated physics nodes: sag, damped wave wobble, and stretch thinning.

import * as THREE from 'three';

export class TongueRope {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.numPoints = 10;
    this.curvePoints = [];
    for (let i = 0; i < this.numPoints; i++) {
      this.curvePoints.push(new THREE.Vector3());
    }

    this.baseRadius = options.baseRadius || 2.4;
    this.colorHex = options.colorHex || 0xff3b30;

    // Tube mesh for the tongue body
    this.material = new THREE.MeshStandardMaterial({
      color: this.colorHex,
      roughness: 0.3,
      metalness: 0.1,
    });

    this.curve = new THREE.CatmullRomCurve3(this.curvePoints);
    this.geometry = new THREE.TubeGeometry(this.curve, 18, this.baseRadius, 8, false);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.visible = false;
    this.mesh.castShadow = true;
    this.scene.add(this.mesh);

    // Glowing tongue tip sphere
    this.tipGeometry = new THREE.SphereGeometry(this.baseRadius * 1.6, 12, 12);
    this.tipMaterial = new THREE.MeshStandardMaterial({
      color: 0xff1e00,
      emissive: 0xff3300,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });
    this.tipMesh = new THREE.Mesh(this.tipGeometry, this.tipMaterial);
    this.tipMesh.visible = false;
    this.scene.add(this.tipMesh);

    // Simulation parameters
    this.wobblePhase = 0;
    this.sagAmount = 6.0;
    this.wobbleAmp = 3.5;
  }

  setFlavorLook(flavor) {
    if (!flavor) {
      this.material.color.setHex(0xff3b30);
      this.tipMaterial.emissive.setHex(0xff3300);
      return;
    }
    const color = flavor.colorHex || 0xff3b30;
    const glow = flavor.glowColor || 0xff3300;
    this.material.color.setHex(color);
    this.tipMaterial.color.setHex(color);
    this.tipMaterial.emissive.setHex(glow);
  }

  updateRope(startPos, endPos, progress = 0.5, delta = 0.016) {
    if (!startPos || !endPos) {
      this.mesh.visible = false;
      this.tipMesh.visible = false;
      return;
    }

    this.mesh.visible = true;
    this.tipMesh.visible = true;
    this.wobblePhase += delta * 24;

    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    const dz = endPos.z - startPos.z;
    const totalDist = Math.hypot(dx, dy, dz);

    // Stretch thinning: tongue becomes thinner as it reaches maximum extension
    const stretchRadius = Math.max(0.8, this.baseRadius * (1.0 - progress * 0.45));

    // Perpendicular vector for wave wobble
    const perpX = -dy / (totalDist || 1);
    const perpY = dx / (totalDist || 1);

    for (let i = 0; i < this.numPoints; i++) {
      const t = i / (this.numPoints - 1);
      const arc = Math.sin(t * Math.PI); // 0 at ends, 1 at center

      // Damped harmonic wave
      const wave = Math.sin(this.wobblePhase - t * 4.0) * this.wobbleAmp * arc * (1.0 - progress * 0.5);
      const sag = -this.sagAmount * arc * (1.0 - progress * 0.7);

      this.curvePoints[i].set(
        startPos.x + dx * t + perpX * wave,
        startPos.y + dy * t + perpY * wave,
        startPos.z + dz * t + sag
      );
    }

    this.curve = new THREE.CatmullRomCurve3(this.curvePoints);
    this.geometry.dispose();
    this.geometry = new THREE.TubeGeometry(this.curve, 18, stretchRadius, 8, false);
    this.mesh.geometry = this.geometry;

    // Position glowing tip at endpoint
    this.tipMesh.position.copy(endPos);
    const tipScale = 1.0 + Math.sin(this.wobblePhase * 0.5) * 0.1;
    this.tipMesh.scale.set(tipScale, tipScale, tipScale);
  }

  hide() {
    this.mesh.visible = false;
    this.tipMesh.visible = false;
  }

  destroy() {
    this.scene.remove(this.mesh);
    this.scene.remove(this.tipMesh);
    this.geometry.dispose();
    this.material.dispose();
    this.tipGeometry.dispose();
    this.tipMaterial.dispose();
  }
}
