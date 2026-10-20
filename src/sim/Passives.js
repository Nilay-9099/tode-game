// TODE AND THE LAST LILYPAD - Passives System (v3 Spec Section 2.3)
// Generic data-driven handler for all 12 passive types without per-form special cases.

import * as THREE from 'three';
import formsData from '../data/forms.json';
import { eventBus, V3_EVENTS } from '../eventBus.js';

export class PassivesManager {
  constructor(scene, particles) {
    this.scene = scene;
    this.particles = particles;
    this.activeForms = new Set();
    this.passives = []; // Array of active passive objects with .type and params

    // Orbiting Motes State
    this.moteMeshes = [];
    this.moteAngle = 0;

    // Ground Hazards (puddles / hop trails / spit trails)
    this.hazards = [];

    // Aura State
    this.auraTimer = 0;
  }

  clear() {
    this.activeForms.clear();
    this.passives = [];
    this.clearMotes();
    this.clearHazards();
  }

  clearMotes() {
    for (const m of this.moteMeshes) {
      if (this.scene) this.scene.remove(m);
      if (m.geometry) m.geometry.dispose();
      if (m.material) m.material.dispose();
    }
    this.moteMeshes = [];
  }

  clearHazards() {
    for (const h of this.hazards) {
      if (this.scene) this.scene.remove(h.mesh);
      if (h.mesh && h.mesh.geometry) h.mesh.geometry.dispose();
      if (h.mesh && h.mesh.material) h.mesh.material.dispose();
    }
    this.hazards = [];
  }

  setForms(formIds = []) {
    this.clear();
    for (const id of formIds) {
      this.addForm(id);
    }
  }

  addForm(formId) {
    const formDef = formsData[formId];
    if (!formDef || this.activeForms.has(formId)) return;

    this.activeForms.add(formId);
    if (Array.isArray(formDef.passives)) {
      for (const p of formDef.passives) {
        this.passives.push({ ...p, sourceForm: formId });
      }
    }

    this.rebuildMotes();
  }

  removeForm(formId) {
    if (!this.activeForms.has(formId)) return;
    this.activeForms.delete(formId);
    this.passives = this.passives.filter((p) => p.sourceForm !== formId);
    this.rebuildMotes();
  }

  getPassives(type) {
    return this.passives.filter((p) => p.type === type);
  }

  hasPassive(type) {
    return this.passives.some((p) => p.type === type);
  }

  // 1. Snatch Status Hook
  onSnatchHit(enemy) {
    if (!enemy) return;
    const snatchPassives = this.getPassives('snatchStatus');
    for (const p of snatchPassives) {
      if (p.status === 'burn' && enemy.applyBurn) {
        enemy.applyBurn(p.duration || 2.0);
      } else if (p.status === 'slow' && enemy.applySlow) {
        enemy.applySlow(p.duration || 2.0, 0.6);
      }
    }
  }

  // 2. Extra Snatch Target Count Hook
  getExtraSnatchTargets() {
    const list = this.getPassives('snatchExtraTarget');
    let count = 0;
    for (const p of list) {
      count += p.count || 1;
    }
    return count;
  }

  // 3. Burp Damage & Fire Hook
  onBurp(playerPos, radius, enemies, onKill) {
    const burpPassives = this.getPassives('burpDamage');
    if (burpPassives.length === 0 || !enemies) return;

    for (const p of burpPassives) {
      const r = p.radius || radius || 75;
      const dmg = p.damage || 1.5;

      for (const e of enemies) {
        if (!e.group || e.hp <= 0) continue;
        const d = Math.hypot(e.group.position.x - playerPos.x, e.group.position.y - playerPos.y);
        if (d <= r) {
          e.hp -= dmg;
          if (p.status === 'burn' && e.applyBurn) e.applyBurn(2.5);
          if (e.hp <= 0 && onKill) onKill(e, { id: 'burp_boom', damage: dmg });
        }
      }

      if (this.particles) {
        this.particles.emitInferno(playerPos.x, playerPos.y, r);
      }
    }
  }

  // 4. Hop Trail Hook (Frost slow puddles, static zap)
  onHopLanded(pos, enemies, onKill) {
    const hopPassives = this.getPassives('hopTrail');
    for (const p of hopPassives) {
      if (p.status === 'slow') {
        this.spawnHazard(pos.x, pos.y, 35, p.duration || 2.0, 0x00f5d4, 'slow', p.slowFactor || 0.8);
      } else if (p.status === 'burning_ground') {
        this.spawnHazard(pos.x, pos.y, 45, p.duration || 3.0, 0xff5400, 'burn', p.damage || 1.0);
      } else if (p.status === 'zap') {
        // Instant static discharge
        const r = p.zapRadius || 45;
        if (enemies) {
          for (const e of enemies) {
            if (!e.group || e.hp <= 0) continue;
            const d = Math.hypot(e.group.position.x - pos.x, e.group.position.y - pos.y);
            if (d <= r) {
              e.hp -= p.damage || 0.5;
              if (this.particles) this.particles.emitSparkBurst(e.group.position.x, e.group.position.y, 8);
              if (e.hp <= 0 && onKill) onKill(e, { id: 'static_zap', damage: p.damage });
            }
          }
        }
      }
    }
  }

  // 5. Spit Trail Hook (Embers left behind spit)
  onSpitFired(projectile) {
    const spitPassives = this.getPassives('spitTrail');
    if (spitPassives.length === 0 || !projectile) return;
    projectile.hasSpitTrail = true;
    projectile.spitTrailConfig = spitPassives[0];
  }

  // 6. Chain Lightning Bonus Jumps Hook
  getExtraChainJumps() {
    let extra = 0;
    for (const p of this.getPassives('chainBonus')) {
      extra += p.extraJumps || 1;
    }
    return extra;
  }

  // 7. Status Damage Amplifier (e.g. +20% to frozen foes)
  getStatusDamageMultiplier(enemy) {
    let mult = 1.0;
    const amps = this.getPassives('statusAmp');
    for (const p of amps) {
      if (p.targetStatus === 'frozen' && enemy.isFrozen) {
        mult *= p.damageMultiplier || 1.2;
      }
    }
    return mult;
  }

  // 8. Shatter Shards Hook (Glacier Toad / Aurora Toad)
  onShatter(enemyPos, enemies, onKill) {
    const shatterPassives = this.getPassives('shatterShards');
    for (const p of shatterPassives) {
      const count = p.count || 5;
      const dmg = p.damage || 1.5;
      const chainArc = p.chainArc || false;

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const vx = Math.cos(angle) * 260;
        const vy = Math.sin(angle) * 260;
        this.spawnShard(enemyPos.x, enemyPos.y, vx, vy, dmg, chainArc, enemies, onKill);
      }
    }
  }

  spawnShard(x, y, vx, vy, dmg, chainArc, enemies, onKill) {
    const geo = new THREE.ConeGeometry(2, 6, 4);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: chainArc ? 0x90e0ef : 0x00f5d4 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, 6);
    if (this.scene) this.scene.add(mesh);

    const shard = {
      mesh,
      vx,
      vy,
      life: 0.45,
      dmg,
      chainArc,
      enemies,
      onKill,
    };
    this.hazards.push({ type: 'shard', ...shard });
  }

  // Hazard Spawning
  spawnHazard(x, y, radius, duration, colorHex, effectType, effectVal) {
    const geo = new THREE.CircleGeometry(radius, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, 0.15);
    if (this.scene) this.scene.add(mesh);

    this.hazards.push({
      type: 'puddle',
      mesh,
      radius,
      duration,
      elapsed: 0,
      effectType,
      effectVal,
      x,
      y,
    });
  }

  // Orbiting Motes Builder
  rebuildMotes() {
    this.clearMotes();
    const motePassives = this.getPassives('orbitingMotes');
    if (motePassives.length === 0 || !this.scene) return;

    for (const p of motePassives) {
      const count = p.count || 2;
      const color = p.sourceForm.includes('plasma') ? 0xf72585 : 0x00f0ff;
      for (let i = 0; i < count; i++) {
        const geo = new THREE.SphereGeometry(3.5, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color });
        const mesh = new THREE.Mesh(geo, mat);
        this.scene.add(mesh);
        this.moteMeshes.push({ mesh, radius: p.orbitRadius || 55, damage: p.damage || 1.0, index: i, total: count });
      }
    }
  }

  update(delta, player, enemies, onKill) {
    if (!player || !player.group) return;
    const pPos = player.group.position;

    // 1. Update Orbiting Motes
    if (this.moteMeshes.length > 0) {
      this.moteAngle += delta * 3.5;
      for (const m of this.moteMeshes) {
        const ang = this.moteAngle + (m.index / m.total) * Math.PI * 2;
        m.mesh.position.set(
          pPos.x + Math.cos(ang) * m.radius,
          pPos.y + Math.sin(ang) * m.radius,
          10
        );

        // Mote collision with enemies
        if (enemies) {
          for (const e of enemies) {
            if (!e.group || e.hp <= 0) continue;
            const d = Math.hypot(e.group.position.x - m.mesh.position.x, e.group.position.y - m.mesh.position.y);
            if (d < 22) {
              e.hp -= m.damage * delta * 4;
              if (this.particles) this.particles.emitSparkBurst(m.mesh.position.x, m.mesh.position.y, 3);
              if (e.hp <= 0 && onKill) onKill(e, { id: 'mote_zap', damage: m.damage });
            }
          }
        }
      }
    }

    // 2. Update Aura (Steam Toad)
    const auraPassives = this.getPassives('aura');
    if (auraPassives.length > 0 && enemies) {
      for (const a of auraPassives) {
        const r = a.radius || 100;
        for (const e of enemies) {
          if (!e.group || e.hp <= 0) continue;
          const d = Math.hypot(e.group.position.x - pPos.x, e.group.position.y - pPos.y);
          if (d <= r) {
            if (a.status === 'blind' && e.applyBlind) e.applyBlind(0.5);
            if (a.dps) {
              e.hp -= a.dps * delta;
              if (e.hp <= 0 && onKill) onKill(e, { id: 'aura_burn', damage: a.dps });
            }
          }
        }
      }
    }

    // 3. Update Hazards & Shards
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];

      if (h.type === 'shard') {
        h.mesh.position.x += h.vx * delta;
        h.mesh.position.y += h.vy * delta;
        h.life -= delta;

        // Check enemy hit
        if (h.enemies) {
          for (const e of h.enemies) {
            if (!e.group || e.hp <= 0) continue;
            const d = Math.hypot(e.group.position.x - h.mesh.position.x, e.group.position.y - h.mesh.position.y);
            if (d < 20) {
              e.hp -= h.dmg;
              if (h.chainArc && this.particles) {
                this.particles.emitSparkBurst(e.group.position.x, e.group.position.y, 6);
              }
              if (e.hp <= 0 && h.onKill) h.onKill(e, { id: 'shatter_shard', damage: h.dmg });
              h.life = 0;
              break;
            }
          }
        }

        if (h.life <= 0) {
          if (this.scene) this.scene.remove(h.mesh);
          h.mesh.geometry.dispose();
          h.mesh.material.dispose();
          this.hazards.splice(i, 1);
        }
      } else if (h.type === 'puddle') {
        h.elapsed += delta;
        h.mesh.material.opacity = Math.max(0, 0.45 * (1 - h.elapsed / h.duration));

        // Puddle effect on enemies
        if (enemies) {
          for (const e of enemies) {
            if (!e.group || e.hp <= 0) continue;
            const d = Math.hypot(e.group.position.x - h.x, e.group.position.y - h.y);
            if (d <= h.radius) {
              if (h.effectType === 'slow' && e.applySlow) {
                e.applySlow(0.3, h.effectVal || 0.8);
              } else if (h.effectType === 'burn' && e.applyBurn) {
                e.applyBurn(0.5);
              }
            }
          }
        }

        if (h.elapsed >= h.duration) {
          if (this.scene) this.scene.remove(h.mesh);
          h.mesh.geometry.dispose();
          h.mesh.material.dispose();
          this.hazards.splice(i, 1);
        }
      }
    }
  }
}
