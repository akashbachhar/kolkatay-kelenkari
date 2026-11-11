import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Kit, M, PI, R, rr } from './kit.js';
import { ROADS, TRAM } from './data.js';
import { bake, look } from './human.js';

const route = p => { const cum = [0]; for (let i = 1; i < p.length; i++) cum.push(cum[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); return { p, cum, len: cum.at(-1) }; };
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

// Road graph: vehicles drive from junction to junction and turn onto another road there,
// instead of flipping round at the end of a road.
function graph() {
  const lines = ROADS.filter(r => r.w >= 12).map(r => ({ w: r.w, p: r.p.map(q => [q[0], q[1]]) }));
  for (const a of lines) for (const e of [a.p[0], a.p.at(-1)]) for (const b of lines) { // T-junctions: split the road being joined
    if (a === b) continue;
    for (let i = 0; i < b.p.length - 1; i++) {
      const p = b.p[i], q = b.p[i + 1], dx = q[0] - p[0], dz = q[1] - p[1], L2 = dx * dx + dz * dz, t = ((e[0] - p[0]) * dx + (e[1] - p[1]) * dz) / L2, x = p[0] + dx * t, z = p[1] + dz * t;
      if (t > 0 && t < 1 && Math.hypot(e[0] - x, e[1] - z) < 14 && Math.sqrt(L2) * Math.min(t, 1 - t) > 15) { b.p.splice(i + 1, 0, [x, z]); break; }
    }
  }
  const nodes = [], node = p => { for (const n of nodes) if (Math.hypot(n.x - p[0], n.z - p[1]) < 14.5) return n; const n = { x: p[0], z: p[1], out: [] }; nodes.push(n); return n; };
  for (const l of lines) for (let i = 0; i < l.p.length - 1; i++) {
    const a = node(l.p[i]), b = node(l.p[i + 1]); if (a === b) continue;
    const len = Math.hypot(b.x - a.x, b.z - a.z), tx = (b.x - a.x) / len, tz = (b.z - a.z) / len, e1 = { a, b, len, w: l.w, tx, tz }, e2 = { a: b, b: a, len, w: l.w, tx: -tx, tz: -tz };
    e1.rev = e2; e2.rev = e1; a.out.push(e1); b.out.push(e2);
  }
  return nodes.flatMap(n => n.out);
}

function taxiKit() { // the yellow Ambassador
  const k = new Kit(), sh = (pts) => { const s = new THREE.Shape(); pts.forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])); return s; };
  const body = new THREE.ExtrudeGeometry(sh([[-2.15, .38], [-2.15, .95], [-1.95, 1.06], [-1.3, 1.12], [-.85, 1.58], [.45, 1.58], [.95, 1.12], [1.85, 1.02], [2.15, .86], [2.15, .38]]), { depth: 1.6, bevelEnabled: true, bevelSize: .07, bevelThickness: .07, bevelSegments: 2 });
  k.add(M.yellow, body.translate(0, 0, -.8));
  k.add(M.glass, new THREE.ExtrudeGeometry(sh([[-1.2, 1.14], [-.84, 1.52], [.42, 1.52], [.86, 1.14]]), { depth: 1.77, bevelEnabled: false }).translate(0, 0, -.885));
  k.box(M.glass, 1.5, .34, 1.5, -.2, 1.16, 0); k.box(M.blue, 4.2, .09, 1.77, 0, .74, 0); k.box(M.yellow, .5, .2, .22, 0, 1.6, 0);
  for (const x of [-1.35, 1.35]) for (const z of [-.8, .8]) k.add(M.tyre, new THREE.CylinderGeometry(.34, .34, .24, 14).rotateX(PI / 2), x, .34, z);
  for (const z of [-.58, .58]) { k.box(M.lamp, .06, .16, .3, 2.2, .78, z); k.box(M.red, .06, .14, .22, -2.2, .8, z); }
  k.box(M.steel, .12, .13, 1.74, 2.24, .42, 0); k.box(M.steel, .12, .13, 1.74, -2.24, .42, 0); k.box(M.steel, .05, .3, .9, 2.2, .72, 0);
  return k;
}
function busKit() {
  const k = new Kit(); k.box(M.bus, 9.4, 2.5, 2.5, 0, .5, 0); k.box(M.yellow, 9.44, .45, 2.54, 0, 1.1, 0); k.box(M.glass, 9.0, .85, 2.56, 0, 1.85, 0); k.box(M.glass, .1, 1.1, 2.2, 4.72, 1.6, 0); k.box(M.tin, 9, .2, 2.2, 0, 3, 0);
  for (const x of [-3, 3]) for (const z of [-1.15, 1.15]) k.add(M.tyre, new THREE.CylinderGeometry(.48, .48, .3, 14).rotateX(PI / 2), x, .48, z);
  return k;
}
function tramKit() { // two-car Calcutta tram
  const k = new Kit();
  for (const x of [-4.6, 4.6]) {
    k.box(M.tram, 8.6, 2.5, 2.3, x, .45, 0); k.box(M.blue, 8.64, .95, 2.34, x, .45, 0); k.box(M.glass, 8.0, .8, 2.36, x, 1.8, 0); k.box(M.tin, 8.3, .25, 2, x, 2.95, 0);
    for (const w of [-2.6, 2.6]) for (const z of [-1, 1]) k.add(M.tyre, new THREE.CylinderGeometry(.36, .36, .2, 12).rotateX(PI / 2), x + w, .36, z);
  }
  k.box(M.dark, 1, 1.9, 1.7, 0, .6, 0); for (const s of [-1, 1]) { k.box(M.glass, .1, 1, 1.9, s * 8.92, 1.7, 0); k.box(M.lamp, .08, .25, .4, s * 8.92, 1, 0); }
  k.beam(M.steel, [3.4, 3.2, 0], [5, 5.4, 0], .08); k.beam(M.steel, [5, 5.4, 0], [6.4, 3.2, 0], .08); k.box(M.steel, .1, .06, 1.4, 5, 5.4, 0);
  return k;
}
function rickKit() { // hand-pulled rickshaw
  const k = new Kit();
  for (const z of [-.62, .62]) { k.add(M.tyre, new THREE.TorusGeometry(.62, .04, 5, 18), -.5, .66, z); for (let i = 0; i < 3; i++) k.add(M.wood, new THREE.BoxGeometry(1.2, .03, .03), -.5, .66, z, 0, 0, i * PI / 3); }
  k.box(M.dark, .06, .06, 1.3, -.5, .63, 0); k.box(M.red, .9, .25, 1, -.55, .82, 0); k.box(M.red, .15, .7, 1, -1.02, .95, 0); k.box(M.wood, .8, .06, .9, .2, .58, 0);
  k.box(M.dark, 1, .06, 1.06, -.72, 1.95, 0); k.box(M.dark, .06, .95, 1.06, -1.2, 1.05, 0); for (const z of [-.5, .5]) { k.box(M.dark, .04, 1.1, .04, -.25, .9, z); k.beam(M.wood, [-.2, .78, z], [2.2, 1, z * .84], .05); }
  k.beam(M.wood, [2.2, 1, -.42], [2.2, 1, .42], .045);
  return k;
}

export class Traffic {
  constructor(scene) {
    this.v = [];
    const E = graph(), tot = E.reduce((s, e) => s + e.len, 0), pe = () => { let t = R() * tot; for (const e of E) if ((t -= e.len) < 0) return e; return E[0]; }, tr = route(TRAM);
    const mk = (kit, n, hl, hw, fn, extra) => {
      const im = (g, m) => { const i = new THREE.InstancedMesh(g, m, n); i.castShadow = true; i.frustumCulled = false; scene.add(i); return i; };
      const set = { ims: kit.build().children.map(m => im(m.geometry, m.material)) }; if (extra) set.ims.push(im(extra, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85 })));
      for (let i = 0; i < n; i++) this.v.push({ set, idx: i, hl, hw, a: 0, sp: 0, x: 0, z: 0, ...fn(i) });
    };
    const car = (k, lo, hi) => () => { const e = pe(); return { k, e, s: R() * e.len, vmax: rr(lo, hi) }; };
    mk(taxiKit(), 46, 2.3, .95, car(0, 8.5, 11.5)); mk(busKit(), 10, 4.8, 1.35, car(1, 7, 9));
    const puller = bake({ ...look(R, false), top: '#d9d2c0', bottom: '#6a5a48', full: false, s: .95 }, 'pull').rotateY(PI / 2).translate(1.75, 0, 0), rider = bake({ ...look(R, false), s: .95 }, 'sit').rotateY(PI / 2).translate(-.55, .6, 0);
    mk(rickKit(), 14, 2.2, .55, car(3, 2.1, 2.9), mergeGeometries([puller, rider]));
    mk(tramKit(), 4, 9, 1.25, i => ({ k: 2, r: tr, i: 0, s: tr.len * (.1 + i * .22), dir: i % 2 ? 1 : -1, side: i % 2 ? 1 : -1, vmax: 6.5 }));
    this.m = new THREE.Object3D(); this.update(0, { x: 1e6, z: 1e6 });
  }
  update(dt, p, snd) {
    const V = this.v;
    for (const v of V) {
      if (v.own) { this.m.position.set(v.x, 0, v.z); this.m.rotation.y = v.a; this.m.updateMatrix(); for (const im of v.set.ims) im.setMatrixAt(v.idx, this.m.matrix); continue; } // taken by the player: driven or parked
      // what is ahead?
      const fd = v.k === 2 ? v.dir : 1, fx = Math.cos(v.a) * fd, fz = -Math.sin(v.a) * fd, px = p.x - v.x, pz = p.z - v.z, fw = px * fx + pz * fz;
      const man = fw > 0 && fw < v.hl + 7 && Math.abs(px * fz - pz * fx) < v.hw + 1.1; let jam = false;
      if (!man && !(v.ghost > 0)) for (const o of V) {
        if (o === v) continue; const dx = o.x - v.x, dz = o.z - v.z; if (dx * dx + dz * dz > 500) continue;
        const f = dx * fx + dz * fz; if (f > 0 && f < v.hl + o.hl + 3.2 && Math.abs(dx * fz - dz * fx) < v.hw + o.hw + .25 && (o.k === 2 || Math.cos(o.a - v.a) > -.3)) { jam = true; break; }
      }
      if (v.ghost > 0) v.ghost -= dt; if (jam) { if ((v.jam = (v.jam || 0) + dt) > 5) { v.ghost = 2.5; v.jam = 0; } } else v.jam = 0;
      const stop = man || jam || v.hold > 0; if (v.hold > 0) v.hold -= dt;
      if (snd && dt) { // honk at the player in the way; otherwise the odd impatient horn, Kolkata style
        v.hk = (v.hk || 0) - dt;
        if (v.k === 2) { if (v.hk < 0 && px * px + pz * pz < 2500) { snd.bell(v.x, v.z); v.hk = 5 + Math.random() * 6; } }
        else if (v.k === 3) { if (v.hk < 0 && (man || Math.random() < dt * .05)) { snd.ring(v.x, v.z); v.hk = 3 + Math.random() * 5; } }
        else if (v.hk < 0 && (man || Math.random() < dt * .03)) { snd.horn(v.x, v.z, v.k, man ? 1.5 : 1); v.hk = man ? 2.2 : 6 + Math.random() * 10; }
      }
      v.sp += ((stop ? 0 : v.vmax) - v.sp) * Math.min(1, dt * (stop ? 6 : 1.2));
      let tx, tz, ta = null;
      if (v.k === 2) { // trams shuttle along the line and wait at each terminus
        const r = v.r; v.s += v.dir * v.sp * dt;
        if (v.s > r.len) { v.s = r.len; v.dir = -1; v.hold = 6; v.sp = 0; } else if (v.s < 0) { v.s = 0; v.dir = 1; v.hold = 6; v.sp = 0; }
        let i = v.i; while (i < r.cum.length - 2 && v.s > r.cum[i + 1]) i++; while (i > 0 && v.s < r.cum[i]) i--; v.i = i;
        const a = r.p[i], b = r.p[i + 1], sl = r.cum[i + 1] - r.cum[i], f = (v.s - r.cum[i]) / sl, ux = (b[0] - a[0]) / sl, uz = (b[1] - a[1]) / sl;
        tx = a[0] + (b[0] - a[0]) * f + uz * 3.5 * v.side; tz = a[1] + (b[1] - a[1]) * f - ux * 3.5 * v.side; ta = Math.atan2(-uz, ux);
      } else {
        v.s += v.sp * dt;
        while (v.s > v.e.len) { v.s -= v.e.len; const o = v.e.b.out.filter(q => q !== v.e.rev); v.e = o.length ? o[(Math.random() * o.length) | 0] : v.e.rev; }
        const e = v.e, off = v.k === 3 ? e.w / 2 - 1.5 : e.w / 4;
        tx = e.a.x + e.tx * v.s + e.tz * off; tz = e.a.z + e.tz * v.s - e.tx * off;
        if (!v.live) ta = Math.atan2(-e.tz, e.tx);
      }
      if (!v.live) { v.live = 1; v.x = tx; v.z = tz; v.a = ta; }
      const ox = v.x, oz = v.z, kk = Math.min(1, dt * 3); v.x += (tx - ox) * kk; v.z += (tz - oz) * kk; // eased, so corners and U-turns are driven, not jumped
      if (ta === null && Math.hypot(v.x - ox, v.z - oz) > .004) ta = Math.atan2(-(v.z - oz), v.x - ox);
      if (ta !== null) v.a += wrap(ta - v.a) * Math.min(1, dt * 5);
      this.m.position.set(v.x, 0, v.z); this.m.rotation.y = v.a; this.m.updateMatrix();
      for (const im of v.set.ims) im.setMatrixAt(v.idx, this.m.matrix);
    }
    for (const s of new Set(V.map(v => v.set))) for (const im of s.ims) im.instanceMatrix.needsUpdate = true;
  }
  // keep the player out of vehicles
  push(p, rad, skip) {
    for (const v of this.v) {
      if (v === skip) continue;
      const dx = p.x - v.x, dz = p.z - v.z; if (dx * dx + dz * dz > 144) continue;
      const c = Math.cos(v.a), s = Math.sin(v.a); let lx = dx * c - dz * s, lz = dx * s + dz * c;
      const ex = v.hl + rad - Math.abs(lx), ez = v.hw + rad - Math.abs(lz);
      if (ex > 0 && ez > 0) { if (ex < ez) lx = Math.sign(lx || 1) * (v.hl + rad); else lz = Math.sign(lz || 1) * (v.hw + rad); p.x = v.x + lx * c + lz * s; p.z = v.z - lx * s + lz * c; }
    }
  }
}
