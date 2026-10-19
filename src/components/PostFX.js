// TODE AND THE LAST LILYPAD - Toy Diorama Post-Processing Engine
// Implements miniature tilt-shift lens blur, warm grade, vignette, and adaptive quality scaling.

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

export const ToyDioramaShader = {
  name: 'ToyDioramaShader',
  uniforms: {
    tDiffuse: { value: null },
    focusY: { value: 0.48 },
    focusBand: { value: 0.22 },
    blurStrength: { value: 0.0028 },
    vignetteDarkness: { value: 0.65 },
    warmGrade: { value: 0.055 },
    saturation: { value: 1.14 },
    contrast: { value: 1.07 },
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float focusY;
    uniform float focusBand;
    uniform float blurStrength;
    uniform float vignetteDarkness;
    uniform float warmGrade;
    uniform float saturation;
    uniform float contrast;
    uniform vec2 resolution;
    varying vec2 vUv;

    void main() {
      // 1. Tilt-Shift Gradient Blur (Simulates Macro Lens Shallow Depth-of-Field)
      float distFromFocus = abs(vUv.y - focusY);
      float blurFactor = smoothstep(focusBand * 0.5, focusBand * 1.6, distFromFocus);
      float blurOffset = blurStrength * blurFactor;

      vec4 col = texture2D(tDiffuse, vUv) * 0.227;
      col += texture2D(tDiffuse, vUv + vec2(0.0, blurOffset * 1.25)) * 0.194;
      col += texture2D(tDiffuse, vUv - vec2(0.0, blurOffset * 1.25)) * 0.194;
      col += texture2D(tDiffuse, vUv + vec2(blurOffset * 0.85, 0.0)) * 0.121;
      col += texture2D(tDiffuse, vUv - vec2(blurOffset * 0.85, 0.0)) * 0.121;
      col += texture2D(tDiffuse, vUv + vec2(blurOffset * 0.85, blurOffset * 0.85)) * 0.071;
      col += texture2D(tDiffuse, vUv - vec2(blurOffset * 0.85, blurOffset * 0.85)) * 0.071;

      // 2. Warm Color Grade (Golden garden ambient warmth)
      col.r += warmGrade * (0.85 + col.r * 0.4);
      col.g += warmGrade * 0.45;
      col.b -= warmGrade * 0.35;

      // 3. Contrast & Saturation Enhancement (Miniature Toy Diorama Look)
      col.rgb = (col.rgb - 0.5) * contrast + 0.5;

      float gray = dot(col.rgb, vec3(0.299, 0.587, 0.114));
      col.rgb = mix(vec3(gray), col.rgb, saturation);

      // 4. Soft Radial Vignette
      vec2 uvNorm = (vUv - vec2(0.5)) * 1.35;
      float vig = clamp(1.0 - dot(uvNorm, uvNorm) * vignetteDarkness * 0.55, 0.0, 1.0);
      col.rgb *= vig;

      gl_FragColor = vec4(clamp(col.rgb, 0.0, 1.0), col.a);
    }
  `,
};

export class PostFX {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.enabled = true;
    this.quality = 'high';

    this.composer = new EffectComposer(renderer);
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    this.dioramaPass = new ShaderPass(ToyDioramaShader);
    this.composer.addPass(this.dioramaPass);

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  handleResize() {
    if (this.composer) {
      this.composer.setSize(window.innerWidth, window.innerHeight);
    }
    if (this.dioramaPass && this.dioramaPass.uniforms.resolution) {
      this.dioramaPass.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
    }
  }

  setQuality(level) {
    this.quality = level;
    if (level === 'low') {
      this.enabled = false;
    } else if (level === 'medium') {
      this.enabled = true;
      if (this.dioramaPass) {
        this.dioramaPass.uniforms.blurStrength.value = 0.0016;
        this.dioramaPass.uniforms.vignetteDarkness.value = 0.45;
      }
    } else {
      this.enabled = true;
      if (this.dioramaPass) {
        this.dioramaPass.uniforms.blurStrength.value = 0.0028;
        this.dioramaPass.uniforms.vignetteDarkness.value = 0.65;
      }
    }
  }

  render(delta) {
    if (this.enabled) {
      this.composer.render(delta);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose() {
    window.removeEventListener('resize', this.handleResize);
    if (this.composer) {
      this.composer.reset();
    }
  }
}
