import * as THREE from 'three';
import { makeFigure, animate, checkTex } from './human.js';
import { resolve, solid } from './collide.js';
import { bankX, BRIDGE as B, SPAWN, X1, Z0, Z1 } from './data.js';

const PI = Math.PI, lerpA = (a, b, t) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t;

export class Player {
  constructor(scene, camera, dom) {
    this.camera = camera; this.pos = new THREE.Vector3(SPAWN[0], 0, SPAWN[1]); this.vel = new THREE.Vector3(); this.vy = 0;
    this.heading = -PI / 2; this.yaw = PI / 2; this.pitch = .16; this.dist = 6.5; this.cd = 6.5; this.keys = {}; this.joy = { x: 0, y: 0 }; this.run = false; this.walk = false; this.speed = 0; this.edge = 0;
    this.zone = null; this.ride = false; this.car = null; // zone: a separate area (Dakshineswar); ride: on the ferry
    this.root = new THREE.Group(); scene.add(this.root);
    // the protagonist: a boy in a white checked shirt and black trousers
    this.rig = makeFigure({ top: '#ffffff', bottom: '#151518', hair: '#120d0a', skin: '#a06d49', shoe: '#1c1410', map: checkTex(), s: .96, hi: true }); this.root.add(this.rig.g); this.stepN = 0;
    addEventListener('keydown', e => { if (e.repeat) return; this.keys[e.code] = true; if (e.code === 'KeyC') this.walk = !this.walk; if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); });
    addEventListener('keyup', e => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; });
    let drag = false;
    dom.addEventListener('mousedown', () => drag = true); addEventListener('mouseup', () => drag = false);
    addEventListener('mousemove', e => { if (document.pointerLockElement === dom || drag) { this.yaw -= e.movementX * .0026; this.pitch = Math.max(-.3, Math.min(1.35, this.pitch + e.movementY * .0022)); } });
    dom.addEventListener('wheel', e => { this.dist = Math.max(2.5, Math.min(22, this.dist * (e.deltaY > 0 ? 1.1 : .9))); e.preventDefault(); }, { passive: false });
  }
  update(dt, traffic, people) {
    const p = this.pos, k = this.keys;
    if (this.ride || this.car) { this.vel.set(0, 0, 0); this.vy = 0; this.edge = 0; if (this.car) p.y = 0; }
    else {
      const jm = Math.hypot(this.joy.x, this.joy.y), f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) - this.joy.y, s = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0) + this.joy.x;
      const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw); let mx = fx * f - fz * s, mz = fz * f + fx * s; const ml = Math.hypot(mx, mz);
      const sprint = k.ShiftLeft || k.ShiftRight || this.run, top = ml > .08 ? (sprint ? 9.5 : this.walk ? 1.9 : 5.2) * (jm > .05 ? Math.max(.36, Math.min(1, jm)) : 1) : 0;
      if (ml > .08) { mx /= ml; mz /= ml; this.heading = lerpA(this.heading, Math.atan2(mx, mz), Math.min(1, dt * 12)); }
      const acc = Math.min(1, dt * (ml > .08 ? 9 : 12)); this.vel.x += (mx * top - this.vel.x) * acc; this.vel.z += (mz * top - this.vel.z) * acc;
      p.x += this.vel.x * dt; p.z += this.vel.z * dt;
      if (k.Space && p.y === 0) this.vy = 6.4;
      p.y += this.vy * dt; this.vy -= 19 * dt; if (p.y <= 0) { p.y = 0; this.vy = 0; }
      resolve(p, .45); traffic.push(p, .45); people?.push(p); resolve(p, .45);
      this.edge = 0;
      if (this.zone) { const Z = this.zone; if (p.x < Z.x0) p.x = Z.x0; if (p.x > Z.x1) { p.x = Z.x1; this.edge = 1; } if (p.z < Z.z0) { p.z = Z.z0; this.edge = 1; } if (p.z > Z.z1) { p.z = Z.z1; this.edge = 1; } }
      else {
        // the Hooghly: only the bridge deck crosses it, and it is closed at the far end
        const bx = bankX(p.z) + 1.2;
        if (p.x < bx) {
          const ax = p.x - B.x, az = p.z - B.z, sn = Math.sin(B.ry), cs = Math.cos(B.ry), a = ax * B.dx + az * B.dz, l = ax * sn + az * cs;
          if (a > -2 && a < B.end + 1 && Math.abs(l) < 12) {
            if (a > B.end) { p.x -= B.dx * (a - B.end); p.z -= B.dz * (a - B.end); this.edge = 1; }
            if (Math.abs(l) > 10.4) { const e = l - Math.sign(l) * 10.4; p.x -= sn * e; p.z -= cs * e; }
          } else p.x = bx;
        }
        if (p.x > X1 - 120) { p.x = X1 - 120; this.edge = 1; } if (p.z < Z0 + 60) { p.z = Z0 + 60; this.edge = 1; } if (p.z > Z1 - 50) { p.z = Z1 - 50; this.edge = 1; }
      }
    }
    this.speed = Math.hypot(this.vel.x, this.vel.z);
    this.root.position.copy(p); this.root.rotation.y = this.heading;
    animate(this.rig, this.speed, dt);
    const st = Math.floor(this.rig.ph / PI); if (st !== this.stepN) { this.stepN = st; if (this.speed > .7 && p.y === 0) this.onStep?.(this.speed > 6); }
    // orbit camera, pulled in when a wall is in the way
    const cp = Math.cos(this.pitch), dx = Math.sin(this.yaw) * cp, dy = Math.sin(this.pitch), dz = Math.cos(this.yaw) * cp, tx = p.x, ty = p.y + 1.6, tz = p.z;
    let d = this.dist;
    for (let t = .5; t <= this.dist; t += .5) if (solid(tx + dx * t, ty + dy * t, tz + dz * t)) { d = Math.max(.7, t - .6); break; }
    this.cd = d < this.cd ? d : this.cd + (d - this.cd) * Math.min(1, dt * 6);
    this.camera.position.set(tx + dx * this.cd, Math.max((this.ride ? p.y : 0) + .35, ty + dy * this.cd), tz + dz * this.cd); this.camera.lookAt(tx, ty, tz);
  }
}
