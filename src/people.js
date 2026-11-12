import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeFigure, animate, bake, look } from './human.js';
import { R } from './kit.js';
import { SEG } from './world.js';

const PI = Math.PI;
export class People {
  constructor(scene, folk, roams = [], count = 48, lite = false) {
    // hawkers, shopkeepers, customers, spectators: all baked into a single mesh
    const m4 = new THREE.Matrix4(), list = folk.map(f => bake({ ...look(R, f.woman ?? (R() < .35)), ...f.o }, f.pose).applyMatrix4(m4.makeRotationY(f.ry).setPosition(f.x, f.y || 0, f.z)));
    if (list.length) { const me = new THREE.Mesh(mergeGeometries(list), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85 })); me.castShadow = true; scene.add(me); }
    const rig = ov => { const o = ov ? { ...look(Math.random, false), ...ov } : look(), r = makeFigure(o); r.g.visible = false; scene.add(r.g); return [r, o]; };
    this.w = []; // pavement walkers
    for (let i = 0; i < count; i++) { const [r, o] = rig(); this.w.push({ rig: r, seg: null, sp: o.woman ? .95 + Math.random() * .35 : 1.1 + Math.random() * .6, x: 0, z: 0 }); }
    this.r = []; // visitors wandering in gardens and courtyards
    for (const zn of roams) for (let i = 0; i < (lite ? Math.ceil(zn.n * .6) : zn.n); i++) { const [r, o] = rig(zn.o), q = this.spot(zn); this.r.push({ rig: r, zn, x: q[0], z: q[1], t: this.spot(zn), wait: Math.random() * 4, sp: o.woman ? .8 + Math.random() * .3 : .9 + Math.random() * .5 }); }
    this.first = true;
  }
  spot(zn) { const lx = (Math.random() * 2 - 1) * zn.hw, lz = (Math.random() * 2 - 1) * zn.hd; return [zn.x + lx * zn.c + lz * zn.s, zn.z - lx * zn.s + lz * zn.c]; }
  place(w, p, fresh) {
    for (let t = 0; t < 10; t++) {
      const s = SEG[(Math.random() * SEG.length) | 0], f = Math.random(), x = s.ax + (s.bx - s.ax) * f, z = s.az + (s.bz - s.az) * f, d = Math.hypot(x - p.x, z - p.z);
      if (d > 125 || d < (fresh ? 12 : 55)) continue;
      const len = Math.hypot(s.bx - s.ax, s.bz - s.az);
      Object.assign(w, { seg: s, len, s: f * len, dir: Math.random() < .5 ? 1 : -1, side: Math.random() < .5 ? 1 : -1, tx: (s.bx - s.ax) / len, tz: (s.bz - s.az) / len, off: s.w / 2 + 1.5 + Math.random() * 1.4 });
      w.rig.g.visible = true; return;
    }
    w.seg = null; w.rig.g.visible = false;
  }
  fall(o, dt) { // knocked over by a car: flung, lies a while, then gets up
    o.down -= dt; o.x += o.fx * dt; o.z += o.fz * dt; const d = 1 - Math.min(1, 3.5 * dt); o.fx *= d; o.fz *= d;
    const k = o.down <= 0 ? 0 : o.down < 1.2 ? o.down / 1.2 : Math.min(1, (7 - o.down) * 5), g = o.rig.g; g.position.set(o.x, .14 * k, o.z); g.rotation.x = -PI / 2 * k;
  }
  update(dt, p) {
    for (const w of this.w) {
      const far = Math.hypot(w.x - p.x, w.z - p.z);
      if (w.down > 0) { this.fall(w, dt); if (w.down <= 0) w.dazed = true; continue; }
      if (w.dazed) { animate(w.rig, 0, dt); if (far > 60) { w.dazed = false; this.place(w, p, false); } continue; }
      if (!w.seg || far > 135) { this.place(w, p, !w.seg && this.first || far > 320); if (!w.seg) continue; }
      const bx = p.x - w.x, bz = p.z - w.z, bd = Math.hypot(bx, bz), block = bd < 1.3 && (bx * w.tx + bz * w.tz) * w.dir > 0;
      if (block) { w.wait = (w.wait || 0) + dt; if (w.wait > 2.5) { w.dir *= -1; w.wait = 0; } animate(w.rig, 0, dt); w.rig.g.rotation.y = Math.atan2(w.tx * w.dir, w.tz * w.dir); continue; } // wait, then turn back
      w.wait = 0; w.s += w.dir * w.sp * dt; if (w.s > w.len - 1) w.dir = -1; else if (w.s < 1) w.dir = 1;
      w.x = w.seg.ax + w.tx * w.s + w.tz * w.side * w.off; w.z = w.seg.az + w.tz * w.s - w.tx * w.side * w.off;
      const g = w.rig.g; g.position.set(w.x, 0, w.z); g.rotation.y = Math.atan2(w.tx * w.dir, w.tz * w.dir); animate(w.rig, w.sp, dt);
    }
    for (const r of this.r) {
      const g = r.rig.g, on = Math.hypot(r.zn.x - p.x, r.zn.z - p.z) < 230; g.visible = on; if (!on) continue;
      if (r.down > 0) { this.fall(r, dt); continue; }
      if (r.wait > 0) { r.wait -= dt; animate(r.rig, 0, dt); }
      else { const dx = r.t[0] - r.x, dz = r.t[1] - r.z, d = Math.hypot(dx, dz), qx = p.x - r.x, qz = p.z - r.z; if (Math.hypot(qx, qz) < 1.3 && qx * dx + qz * dz > 0) { r.wait = .8; r.t = this.spot(r.zn); } else if (d < .4) { r.wait = 1 + Math.random() * 6; r.t = this.spot(r.zn); } else { r.x += dx / d * r.sp * dt; r.z += dz / d * r.sp * dt; g.rotation.y = Math.atan2(dx, dz); animate(r.rig, r.sp, dt); } }
      g.position.set(r.x, 0, r.z);
    }
    this.first = false;
  }
  push(p) {
    const R = .8, f = (x, z) => { const dx = p.x - x, dz = p.z - z, d = Math.hypot(dx, dz); if (d < R && d > 1e-3) { p.x = x + dx / d * R; p.z = z + dz / d * R; } };
    for (const w of this.w) if (w.seg && !(w.down > 0)) f(w.x, w.z); for (const r of this.r) if (r.rig.g.visible && !(r.down > 0)) f(r.x, r.z);
  }
  hitAt(x, z, fx, fz, snd) { // the nearest person within reach of a punch falls over
    let best = null, bd = .95;
    for (const o of [...this.w.filter(w => w.seg), ...this.r.filter(r => r.rig.g.visible)]) { if (o.down > 0) continue; const d = Math.hypot(o.x - x, o.z - z); if (d < bd) { bd = d; best = o; } }
    if (best) { best.down = 7; best.dazed = false; best.fx = fx * 2.2; best.fz = fz * 2.2; snd.yelp(best.x, best.z); }
    return best;
  }
  carHit(v, snd) { // a moving car knocks down anyone it touches
    const sp = v.sp; if (Math.abs(sp) < 1.5) return 0;
    const c = Math.cos(v.a), s = Math.sin(v.a); let n = 0;
    const test = (o, vis) => {
      if (!vis || o.down > 0) return; const dx = o.x - v.x, dz = o.z - v.z; if (dx * dx + dz * dz > 80) return;
      const lx = dx * c - dz * s, lz = dx * s + dz * c; if (Math.abs(lx) > v.hl + .3 || Math.abs(lz) > v.hw + .3) return;
      const side = Math.sign(lz || 1) * 3; o.down = 7; o.dazed = false; o.fx = c * sp * .7 + s * side; o.fz = -s * sp * .7 + c * side; n++; snd.yelp(o.x, o.z);
    };
    for (const w of this.w) test(w, !!w.seg); for (const r of this.r) test(r, r.rig.g.visible);
    return n;
  }
}
