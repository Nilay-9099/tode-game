// TODE AND THE LAST LILYPAD - Spring Physics (v3 Spec Section 6.2)
// Critically damped scalar and vector springs for organic squash, overshoot, and follow-through.

export class ScalarSpring {
  constructor(initial = 0, stiffness = 180, damping = 18) {
    this.value = initial;
    this.target = initial;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
  }

  set(val) {
    this.value = val;
    this.target = val;
    this.velocity = 0;
  }

  setTarget(target) {
    this.target = target;
  }

  update(delta) {
    const dt = Math.min(delta, 0.05);
    const force = -this.stiffness * (this.value - this.target);
    const dampingForce = -this.damping * this.velocity;
    const accel = force + dampingForce;

    this.velocity += accel * dt;
    this.value += this.velocity * dt;
    return this.value;
  }
}

export class VectorSpring {
  constructor(x = 0, y = 0, z = 0, stiffness = 180, damping = 18) {
    this.x = new ScalarSpring(x, stiffness, damping);
    this.y = new ScalarSpring(y, stiffness, damping);
    this.z = new ScalarSpring(z, stiffness, damping);
  }

  set(x, y, z) {
    this.x.set(x);
    this.y.set(y);
    this.z.set(z);
  }

  setTarget(x, y, z) {
    this.x.setTarget(x);
    this.y.setTarget(y);
    this.z.setTarget(z);
  }

  update(delta) {
    return {
      x: this.x.update(delta),
      y: this.y.update(delta),
      z: this.z.update(delta),
    };
  }
}
