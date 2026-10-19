import * as THREE from 'three';

export class FloatingTextManager {
  constructor(camera) {
    this.camera = camera;
    this.container = document.createElement('div');
    this.container.id = 'floatingTextContainer';
    this.container.style.position = 'fixed';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '999';
    this.container.style.overflow = 'hidden';
    document.body.appendChild(this.container);

    this.items = []; // { el, worldPos, life, maxLife, vy }
    this.tempVec = new THREE.Vector3();
  }

  spawn(text, worldX, worldY, worldZ = 8, type = 'score') {
    const el = document.createElement('div');
    el.className = `floating-text floating-${type}`;
    el.textContent = text;
    el.style.position = 'absolute';
    el.style.transform = 'translate(-50%, -50%) scale(0.6)';
    el.style.opacity = '1';
    el.style.fontWeight = '900';
    el.style.fontSize = type === 'special' ? '18px' : '15px';
    el.style.letterSpacing = '0.5px';
    el.style.textShadow = '0 2px 8px rgba(0,0,0,0.85), 0 0 10px rgba(0,0,0,0.5)';
    el.style.whiteSpace = 'nowrap';
    el.style.transition = 'transform 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

    // Color by type
    if (type === 'saved') {
      el.style.color = '#52b788';
      el.style.textShadow = '0 0 12px rgba(82, 183, 136, 0.8), 0 2px 4px #000';
    } else if (type === 'shatter') {
      el.style.color = '#70d6ff';
      el.style.textShadow = '0 0 12px rgba(112, 214, 255, 0.8), 0 2px 4px #000';
    } else if (type === 'fire') {
      el.style.color = '#ff5400';
      el.style.textShadow = '0 0 12px rgba(255, 84, 0, 0.8), 0 2px 4px #000';
    } else if (type === 'special') {
      el.style.color = '#fee440';
      el.style.textShadow = '0 0 16px rgba(254, 228, 64, 0.9), 0 2px 4px #000';
    } else {
      el.style.color = '#ffffff';
    }

    this.container.appendChild(el);

    this.items.push({
      el,
      worldPos: new THREE.Vector3(worldX, worldY, worldZ),
      life: 0.85,
      maxLife: 0.85,
      offsetY: 0,
    });

    requestAnimationFrame(() => {
      el.style.transform = 'translate(-50%, -50%) scale(1.15)';
    });
  }

  update(delta) {
    if (this.items.length === 0) return;

    const widthHalf = window.innerWidth / 2;
    const heightHalf = window.innerHeight / 2;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.life -= delta;

      if (item.life <= 0) {
        if (item.el.parentNode) {
          item.el.parentNode.removeChild(item.el);
        }
        this.items.splice(i, 1);
        continue;
      }

      // Rise smoothly
      item.offsetY += delta * 45;

      this.tempVec.copy(item.worldPos);
      this.tempVec.project(this.camera);

      // Check if behind camera
      if (this.tempVec.z > 1) {
        item.el.style.display = 'none';
        continue;
      } else {
        item.el.style.display = 'block';
      }

      const screenX = this.tempVec.x * widthHalf + widthHalf;
      const screenY = -(this.tempVec.y * heightHalf) + heightHalf - item.offsetY;

      const progress = item.life / item.maxLife;
      const opacity = Math.min(1, progress * 1.8);
      const scale = progress < 0.2 ? progress / 0.2 : 1.0;

      item.el.style.left = `${screenX}px`;
      item.el.style.top = `${screenY}px`;
      item.el.style.opacity = opacity.toFixed(2);
      item.el.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(2)})`;
    }
  }

  clear() {
    for (const item of this.items) {
      if (item.el.parentNode) {
        item.el.parentNode.removeChild(item.el);
      }
    }
    this.items = [];
  }
}
