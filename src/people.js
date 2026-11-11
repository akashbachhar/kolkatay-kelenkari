import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeFigure, animate, bake, look } from './human.js';
import { R } from './kit.js';
import { SEG } from './world.js';

export class People {
  constructor(scene, folk, roams = [], count = 48, lite = false) {
    // hawkers, shopkeepers, customers: all baked into a single mesh
    const m4 = new THREE.Matrix4(), list = folk.map(f => bake({ ...look(R, f.woman ?? (R() < .35)), ...f.o }, f.pose).applyMatrix4(m4.makeRotationY(f.ry).setPosition(f.x, 0, f.z)));
    if (list.length) { const me = new THREE.Mesh(mergeGeometries(list), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85 })); me.castShadow = true; scene.add(me); }
    const rig = () => { const o = look(), r = makeFigure(o); r.g.visible = false; scene.add(r.g); return [r, o]; };
    this.w = []; // pavement walkers
    for (let i = 0; i < count; i++) { const [r, o] = rig(); this.w.push({ rig: r, seg: null, sp: o.woman ? .95 + Math.random() * .35 : 1.1 + Math.random() * .6, x: 0, z: 0 }); }
    this.r = []; // visitors wandering in gardens and courtyards
    for (const zn of roams) for (let i = 0; i < (lite ? Math.ceil(zn.n * .6) : zn.n); i++) { const [r, o] = rig(), q = this.spot(zn); this.r.push({ rig: r, zn, x: q[0], z: q[1], t: this.spot(zn), wait: Math.random() * 4, sp: o.woman ? .8 + Math.random() * .3 : .9 + Math.random() * .5 }); }
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
  update(dt, p) {
    for (const w of this.w) {
      const far = Math.hypot(w.x - p.x, w.z - p.z); if (!w.seg || far > 135) { this.place(w, p, !w.seg && this.first || far > 320); if (!w.seg) continue; }
      w.s += w.dir * w.sp * dt; if (w.s > w.len - 1) w.dir = -1; else if (w.s < 1) w.dir = 1;
      w.x = w.seg.ax + w.tx * w.s + w.tz * w.side * w.off; w.z = w.seg.az + w.tz * w.s - w.tx * w.side * w.off;
      const g = w.rig.g; g.position.set(w.x, 0, w.z); g.rotation.y = Math.atan2(w.tx * w.dir, w.tz * w.dir); animate(w.rig, w.sp, dt);
    }
    for (const r of this.r) {
      const g = r.rig.g, on = Math.hypot(r.zn.x - p.x, r.zn.z - p.z) < 230; g.visible = on; if (!on) continue;
      if (r.wait > 0) { r.wait -= dt; animate(r.rig, 0, dt); }
      else { const dx = r.t[0] - r.x, dz = r.t[1] - r.z, d = Math.hypot(dx, dz); if (d < .4) { r.wait = 1 + Math.random() * 6; r.t = this.spot(r.zn); } else { r.x += dx / d * r.sp * dt; r.z += dz / d * r.sp * dt; g.rotation.y = Math.atan2(dx, dz); animate(r.rig, r.sp, dt); } }
      g.position.set(r.x, 0, r.z);
    }
    this.first = false;
  }
  push(p) {
    const f = (x, z) => { const dx = p.x - x, dz = p.z - z, d = Math.hypot(dx, dz); if (d < .75 && d > 1e-3) { p.x = x + dx / d * .75; p.z = z + dz / d * .75; } };
    for (const w of this.w) if (w.seg) f(w.x, w.z); for (const r of this.r) if (r.rig.g.visible) f(r.x, r.z);
  }
}
