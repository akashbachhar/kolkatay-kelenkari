import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Kit, M, PI, R, rr } from './kit.js';
import { ROADS, TRAM } from './data.js';
import { bake, look } from './human.js';

const route = p => { const cum = [0]; for (let i = 1; i < p.length; i++) cum.push(cum[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); return { p, cum, len: cum.at(-1) }; };
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a)), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
const cz = (r, w, s = 14) => new THREE.CylinderGeometry(r, r, w, s).rotateX(PI / 2), cx = (r, w, s = 14) => new THREE.CylinderGeometry(r, r, w, s).rotateZ(PI / 2);

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

// head and shoulders of someone sitting inside a vehicle, facing +x
const tint = (g, c) => { const n = g.attributes.position.count, a = new Float32Array(n * 3), k = new THREE.Color(c); for (let i = 0; i < n; i++) k.toArray(a, i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
function bust(o, x, y, z) {
  const L = [tint(new THREE.BoxGeometry(.24, .5, .42).translate(0, .25, 0), o.top), tint(new THREE.SphereGeometry(.105, 7, 5).translate(.01, .62, 0), o.skin), tint(new THREE.SphereGeometry(.114, 7, 4, 0, PI * 2, 0, 1.75).rotateZ(.35).translate(-.005, .635, 0), o.hair)];
  if (o.woman) L.push(tint(new THREE.SphereGeometry(.06, 5, 4).translate(-.13, .6, 0), o.hair));
  return mergeGeometries(L).translate(x, y, z);
}
const BOY = { top: '#f6f6f3', skin: '#a06d49', hair: '#120d0a' }, DRV = () => ({ ...look(R, false), top: '#b9a77a' });
const crowd = (xs, zs, y, p = .8) => { const L = []; for (const x of xs) for (const z of zs) if (R() < p) L.push(bust(look(R), x + rr(-.1, .1), y, z)); return L; };

function taxiKit() { // Hindustan Ambassador, the Kolkata yellow cab
  const k = new Kit(), Y = M.yellow, CH = M.chrome, sp = (a, b, c) => new THREE.SphereGeometry(1, 14, 10).scale(a, b, c);
  k.loft(Y, [[-2.2, .5, .52, .84], [-2.1, .7, .4, .97], [-1.75, .8, .32, 1.04], [-1, .85, .29, 1.05], [.7, .85, .29, 1.04], [1.3, .83, .3, 1], [1.85, .78, .34, .95], [2.08, .68, .42, .88], [2.17, .5, .5, .8]], 4, 24);
  k.add(Y, sp(.78, .12, .52), 1.4, .96, 0); // bonnet crown
  for (const s of [-1, 1]) {
    k.add(Y, sp(.6, .2, .2), 1.62, .84, s * .67); k.add(Y, sp(.6, .19, .17), -1.55, .8, s * .71); // wings
    k.add(CH, cx(.155, .1), 2.16, .84, s * .64); k.add(M.lamp, new THREE.SphereGeometry(.125, 10, 6).scale(.5, 1, 1), 2.21, .84, s * .64);
    k.box(M.orange, .05, .07, .12, 2.2, .6, s * .66); k.box(M.red, .06, .24, .1, -2.14, .62, s * .6);
    k.box(M.blue, 3, .07, .03, -.15, .72, s * .838); k.box(CH, .13, .03, .03, .38, .9, s * .84); k.box(CH, .13, .03, .03, -.62, .9, s * .84);
    for (const x of [-1.34, 1.34]) { k.add(M.tyre, cz(.35, .22), x, .35, s * .75); k.add(CH, cz(.17, .24), x, .35, s * .75); }
    k.beam(Y, [1.02, 1, s * .71], [.74, 1.5, s * .7], .075); k.beam(Y, [-.12, 1, s * .77], [-.12, 1.53, s * .745], .08); k.beam(Y, [-1.43, 1.02, s * .66], [-1.1, 1.5, s * .69], .085);
    k.sign('NO REFUSAL', .9, .15, .3, .88, s * .845, s > 0 ? 0 : PI, '#f2c118', '#27408f'); k.sign('TAXI', .32, .11, .1, 1.665, s * .08, s > 0 ? 0 : PI, '#f2c118', '#141414');
  }
  k.box(M.dark, .05, .24, .86, 2.17, .5, 0); for (let i = 0; i < 4; i++) k.box(CH, .06, .025, .9, 2.18, .52 + i * .06, 0); k.box(CH, .06, .3, .05, 2.19, .47, 0);
  k.box(CH, .13, .11, 1.72, 2.24, .36, 0); k.box(CH, .13, .11, 1.72, -2.25, .38, 0); for (const z of [-.45, .45]) { k.box(CH, .08, .22, .07, 2.3, .32, z); k.box(CH, .08, .22, .07, -2.31, .34, z); }
  k.loft(M.cglass, [[-1.5, .6, .8, 1.08], [-1.12, .715, .8, 1.5], [-.6, .74, .8, 1.57], [.3, .74, .8, 1.57], [.72, .715, .8, 1.5], [1.1, .64, .8, 1.06]], 4, 20);
  k.loft(Y, [[-1.22, .6, 1.42, 1.5], [-1.06, .715, 1.45, 1.56], [-.6, .755, 1.5, 1.6], [.3, .755, 1.5, 1.6], [.68, .72, 1.45, 1.56], [.82, .6, 1.42, 1.5]], 3, 20);
  k.box(M.dark, 2.35, .03, 1.42, -.2, 1.035, 0); k.box(M.seatr, .12, .34, 1.34, -.08, 1.03, 0); k.box(M.seatr, .14, .36, 1.34, -1.02, 1.03, 0); k.box(M.dark, .22, .1, 1.3, .86, 1.03, 0);
  k.box(Y, .34, .13, .15, .1, 1.6, 0); k.sign('WB 04 F 1947', .5, .13, 2.315, .415, 0, PI / 2, '#f4f1e8', '#141414'); k.sign('WB 04 F 1947', .5, .13, -2.325, .435, 0, -PI / 2, '#f4f1e8', '#141414');
  return k;
}
const wheels = (k, xs, z, r) => { for (const x of xs) for (const s of [-1, 1]) { k.add(M.tyre, cz(r, .3), x, r, s * z); k.add(M.chrome, cz(r * .45, .32), x, r, s * z); } };
function busKit() { // Kolkata route bus: sky-blue Tata body, yellow waist band, open barred windows, three-pane windscreen
  const k = new Kit(), B = M.sky, Y = M.ybus, S = M.chrome, band = (mat, y0, y1, n = 8) => k.loft(mat, [[-4.72, 1.16, y0 + .04, y1 - .02], [-4.58, 1.26, y0, y1], [4.6, 1.26, y0, y1], [4.72, 1.2, y0 + .03, y1 - .02]], n, 16);
  band(B, .5, 1.02); band(Y, 1.0, 1.43); band(B, 2.38, 2.6);
  k.loft(B, [[-4.78, 1.05, 2.45, 2.86], [-4.6, 1.28, 2.5, 3.0], [4.45, 1.28, 2.5, 3.0], [4.78, 1.16, 2.45, 2.88]], 2.4, 20); // rounded tin roof
  for (let x = -4.2; x <= 4.2; x += .7) k.box(B, .05, .04, 2.6, x, 2.98, 0, 0);
  // side windows: no glass, blue pillars, a silver sill, a frame and two guard bars
  for (const s of [-1, 1]) {
    for (let x = -4.55; x <= 2.75; x += .73) k.box(B, .13, .96, .07, x, 1.43, s * 1.23);
    k.box(S, 7.4, .06, .09, -.9, 1.43, s * 1.25); k.box(S, 7.4, .05, .08, -.9, 2.36, s * 1.25); k.box(S, 7.4, .035, .05, -.9, 1.72, s * 1.27); k.box(S, 7.4, .035, .05, -.9, 1.92, s * 1.27);
    if (s < 0) k.box(B, .9, .96, .07, 4.27, 1.43, s * 1.23); // left cab panel by the door; the driver's side stays an open window
    k.box(M.dark, .06, .22, .06, 4.4, 1.7, s * 1.3); // mirror arm
  }
  k.wins(M.cglass, 3.0, 1.231, 4.5, 1.231, 1, 1.2, .82, 1.5, .03); // driver's side window (right)
  k.box(M.dark, .95, 1.88, .05, 3.2, .52, -1.265); k.box(S, .06, 1.9, .07, 2.72, .5, -1.27); k.box(S, .06, 1.9, .07, 3.68, .5, -1.27); // the open front door (left, kerb side)
  for (let i = 0; i < 3; i++) k.box(M.stone, .9, .06, .5, 3.2, .5 - i * .17, -1.15 - i * .12);
  // front: three-pane windscreen in silver frames, yellow panel with a grille, blue lower front, round lamps, bumper, route board
  k.box(M.cglass, .04, .9, 2.3, 4.74, 1.47, 0); for (const z of [-1.15, -.38, .38, 1.15]) k.box(S, .07, .94, .06, 4.76, 1.45, z); k.box(S, .08, .08, 2.42, 4.76, 2.35, 0); k.box(S, .1, .1, 2.48, 4.77, 1.4, 0);
  k.box(M.dark, .04, .26, .62, 4.745, 1.07, 0); k.sign('TATA', .3, .07, 4.77, 1.33, 0, PI / 2, '#efc12e', '#141414'); for (const z of [-.92, .92]) k.box(M.dark, .04, .3, .3, 4.745, 1.05, z);
  k.box(M.dark, .04, .32, .62, 4.745, .62, 0); for (let i = 0; i < 5; i++) k.box(S, .045, .02, .62, 4.75, .65 + i * .07, 0);
  for (const s of [-1, 1]) { k.add(S, new THREE.CylinderGeometry(.17, .17, .06, 14).rotateZ(PI / 2), 4.74, .82, s * .82); k.add(M.lamp, new THREE.SphereGeometry(.14, 10, 6).scale(.35, 1, 1), 4.77, .82, s * .82); k.box(M.orange, .05, .08, .18, 4.75, 1.24, s * .7); k.box(M.red, .05, .2, .3, -4.72, .9, s * .9); }
  k.box(S, .14, .16, 2.5, 4.8, .42, 0); k.sign('WBS 2513', .42, .2, 4.88, .42, .7, PI / 2, '#f2c118', '#141414');
  k.box(M.dark, .06, .3, 1.15, 4.76, 2.5, 0); k.sign('34A · ধর্মতলা', 1.05, .24, 4.8, 2.65, 0, PI / 2, '#1c1c1c', '#ff5a3c');
  for (const s of [-1, 1]) k.sign('ধর্মতলা · হাওড়া · শ্যামবাজার', 3.4, .3, -1.6, 1.21, s * 1.272, s > 0 ? 0 : PI, '#efc12e', '#1d3b6b');
  wheels(k, [-2.9, 3.15], 1.1, .55);
  return k;
}
function ddKit() { // the red Calcutta double-decker
  const k = new Kit(), Rd = M.ddred, band = (y0, y1, n, mat) => k.loft(mat, [[-4.72, 1.12, y0 + .06, y1 - .04], [-4.5, 1.25, y0, y1], [4.5, 1.25, y0, y1], [4.72, 1.12, y0 + .06, y1 - .04]], n, 16);
  band(.5, 1.62, 7, Rd); k.loft(M.cglass, [[-4.6, 1.2, 1.3, 2.45], [4.64, 1.2, 1.3, 2.45]], 9, 16);
  band(2.3, 2.95, 7, Rd); k.box(M.cream, 9.3, .14, 2.53, 0, 2.36, 0); k.box(M.cream, 9.3, .1, 2.53, 0, 1.2, 0);
  k.loft(M.cglass, [[-4.62, 1.2, 2.7, 3.85], [4.66, 1.2, 2.7, 3.85]], 9, 16); band(3.74, 4.12, 5, M.tin);
  for (let x = -4.6; x <= 4.61; x += 1.15) for (const s of [-1, 1]) { k.box(Rd, .12, .7, .07, x, 1.62, s * 1.215); k.box(Rd, .12, .82, .07, x, 2.94, s * 1.215); }
  k.box(M.dark, 9, .03, 2.36, 0, 1.63, 0); k.box(M.dark, 9, .03, 2.36, 0, 2.96, 0); wheels(k, [-2.9, 3.1], 1.1, .52);
  k.box(M.dark, .06, .62, 1, 4.73, .62, 0); for (let i = 0; i < 5; i++) k.box(M.chrome, .07, .03, 1.04, 4.74, .68 + i * .11, 0); k.box(M.chrome, .12, .14, 2.4, 4.76, .42, 0);
  for (const s of [-1, 1]) { k.add(M.lamp, new THREE.SphereGeometry(.15, 10, 6).scale(.5, 1, 1), 4.73, .95, s * .88); k.box(M.red, .05, .22, .3, -4.72, .95, s * .9); k.sign('কলিকাতা রাষ্ট্রীয় পরিবহন · C.S.T.C.', 5.6, .36, 0, 2.66, s * 1.262, s > 0 ? 0 : PI, '#c4261c', '#f6e7c0'); }
  k.sign('2B · ESPLANADE', 1.8, .34, 4.75, 2.64, 0, PI / 2, '#141414', '#f2c118'); k.box(M.dark, 1.1, 1.95, .04, -3.9, .5, -1.25);
  return k;
}
function tramKit() { // two-car Calcutta tram
  const k = new Kit();
  for (const x of [-4.6, 4.6]) {
    k.box(M.tram, 8.6, 2.5, 2.3, x, .45, 0); k.box(M.blue, 8.64, .95, 2.34, x, .45, 0); k.box(M.glass, 8.0, .8, 2.36, x, 1.8, 0); k.box(M.tin, 8.3, .25, 2, x, 2.95, 0);
    for (const w of [-2.6, 2.6]) for (const z of [-1, 1]) k.add(M.tyre, cz(.36, .2, 12), x + w, .36, z);
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
    const PM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85 });
    const mk = (kit, n, hl, hw, fn, occ = {}) => {
      const im = (g, m) => { const i = new THREE.InstancedMesh(g, m, n); i.castShadow = !m.transparent; i.frustumCulled = false; scene.add(i); return i; };
      const set = { ims: kit.build().children.map(m => { m.updateMatrix(); return im(m.geometry.clone().applyMatrix4(m.matrix), m.material); }) };
      for (const key of ['drv', 'pas', 'boy']) if (occ[key]) set[key] = im(occ[key], PM); if (occ.fixed) set.ims.push(im(occ.fixed, PM)); if (occ.frames) set.fr = occ.frames.map(g => im(g, PM));
      for (let i = 0; i < n; i++) this.v.push({ set, idx: i, hl, hw, a: 0, sp: 0, x: 0, z: 0, nop: i % 3 === 0, ...fn(i) });
    };
    const car = (k, lo, hi) => () => { const e = pe(); return { k, e, s: R() * e.len, vmax: rr(lo, hi) }; }, rows = [-3.7, -2.5, -1.3, -.1, 1.1, 2.3];
    mk(taxiKit(), 46, 2.3, .95, car(0, 8.5, 11.5), { drv: bust(DRV(), .2, .78, .4), boy: bust(BOY, .2, .78, .4), pas: bust(look(R), -.72, .76, -.32) });
    mk(busKit(), 9, 4.8, 1.35, car(1, 7, 9), { drv: bust(DRV(), 3.95, 1.4, .7), boy: bust(BOY, 3.95, 1.4, .7), pas: mergeGeometries(crowd(rows.slice(0, 5), [-.8, .8], 1.45)) });
    mk(ddKit(), 5, 4.8, 1.35, car(4, 6, 7.5), { drv: bust(DRV(), 3.95, 1.33, .7), boy: bust(BOY, 3.95, 1.33, .7), pas: mergeGeometries([...crowd(rows.slice(0, 5), [-.8, .8], 1.33), ...crowd([...rows, 3.5], [-.8, .8], 2.66, .7)]) });
    // the puller walks: a cycle of baked strides, one shown at a time
    const po = { ...look(R, false), top: '#d9d2c0', bottom: '#6a5a48', full: false, s: .95 }, rider = bake({ ...look(R, false), s: .95 }, 'sit').rotateY(PI / 2).translate(-.55, .6, 0);
    const frames = Array.from({ length: 8 }, (_, i) => bake(po, 'pull', i / 8 * PI * 2).rotateY(PI / 2).translate(1.75, 0, 0));
    mk(rickKit(), 14, 2.2, .55, car(3, 2.1, 2.9), { fixed: rider, frames });
    mk(tramKit(), 4, 9, 1.25, i => ({ k: 2, r: tr, i: 0, s: tr.len * (.1 + i * .22), dir: i % 2 ? 1 : -1, side: i % 2 ? 1 : -1, vmax: 6.5 }));
    this.m = new THREE.Object3D(); this.m.rotation.order = 'YXZ'; this.update(0, { x: 1e6, z: 1e6 });
  }
  put(v) {
    const m = this.m, s = v.set; m.position.set(v.x, 0, v.z); m.rotation.set(v.roll || 0, v.a, 0); m.updateMatrix();
    for (const im of s.ims) im.setMatrixAt(v.idx, m.matrix);
    if (s.drv) s.drv.setMatrixAt(v.idx, v.own ? ZERO : m.matrix); if (s.boy) s.boy.setMatrixAt(v.idx, v.me ? m.matrix : ZERO);
    if (s.fr) { const f = Math.floor(((v.ph || 0) / (PI * 2)) * s.fr.length) % s.fr.length; s.fr.forEach((im, i) => im.setMatrixAt(v.idx, i === f ? m.matrix : ZERO)); }
    if (s.pas) s.pas.setMatrixAt(v.idx, v.k === 0 && (v.own || v.nop) ? ZERO : m.matrix);
  }
  update(dt, p, snd) {
    const V = this.v;
    for (const v of V) {
      if (v.own) { this.put(v); continue; } // taken by the player: driven or parked
      // what is ahead?
      const fd = v.k === 2 ? v.dir : 1, fx = Math.cos(v.a) * fd, fz = -Math.sin(v.a) * fd, px = p.x - v.x, pz = p.z - v.z, fw = px * fx + pz * fz;
      const man = fw > 0 && fw < v.hl + 7 && Math.abs(px * fz - pz * fx) < v.hw + 1.1; let jam = false;
      if (!man && !(v.ghost > 0)) for (const o of V) {
        if (o === v) continue; const dx = o.x - v.x, dz = o.z - v.z; if (dx * dx + dz * dz > 500) continue;
        const f = dx * fx + dz * fz; if (f > 0 && f < v.hl + o.hl + 3.2 && Math.abs(dx * fz - dz * fx) < v.hw + o.hw + .25 && (o.k === 2 || Math.cos(o.a - v.a) > -.3)) { jam = true; break; }
      }
      if (v.ghost > 0) v.ghost -= dt; if (jam) { if ((v.jam = (v.jam || 0) + dt) > 5) { v.ghost = 2.5; v.jam = 0; } } else v.jam = 0;
      const stop = man || jam || v.hold > 0; if (v.hold > 0) v.hold -= dt;
      if (snd && dt) { // honk at the player in the way or after a knock; otherwise the odd impatient horn, Kolkata style
        v.hk = (v.hk || 0) - dt;
        if (v.k === 2) { if (v.hk < 0 && px * px + pz * pz < 2500) { snd.bell(v.x, v.z); v.hk = 5 + Math.random() * 6; } }
        else if (v.k === 3) { if (v.hk < 0 && (man || Math.random() < dt * .05)) { snd.ring(v.x, v.z); v.hk = 3 + Math.random() * 5; } }
        else if (v.hk < 0 && (man || v.honk || Math.random() < dt * .03)) { snd.horn(v.x, v.z, v.k ? 1 : 0, man || v.honk ? 1.5 : 1); v.hk = man ? 2.2 : v.honk ? 1.2 : 6 + Math.random() * 10; v.honk = 0; }
      }
      v.sp += ((stop ? 0 : v.vmax) - v.sp) * Math.min(1, dt * (stop ? 6 : 1.2));
      if (v.k === 3) v.ph = ((v.ph || 0) + v.sp * dt * 4.3) % (PI * 2);
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
      if (v.kt > 0) { // shunted by the player's car: slides and spins, then drives back into its lane
        v.kt -= dt; v.x += v.kx * dt; v.z += v.kz * dt; v.a += v.ks * dt; const d = 1 - Math.min(1, 3 * dt); v.kx *= d; v.kz *= d; v.ks *= d;
      } else {
        const ox = v.x, oz = v.z, kk = Math.min(1, dt * 3); v.x += (tx - ox) * kk; v.z += (tz - oz) * kk; // eased, so corners and U-turns are driven, not jumped
        if (ta === null && Math.hypot(v.x - ox, v.z - oz) > .004) ta = Math.atan2(-(v.z - oz), v.x - ox);
        if (ta !== null) v.a += wrap(ta - v.a) * Math.min(1, dt * 5);
      }
      this.put(v);
    }
    for (const s of new Set(V.map(v => v.set))) for (const im of [...s.ims, ...(s.fr || []), s.drv, s.pas, s.boy]) if (im) im.instanceMatrix.needsUpdate = true;
  }
  // keep the player (on foot) out of vehicles
  push(p, rad, skip) {
    for (const v of this.v) {
      if (v === skip) continue;
      const dx = p.x - v.x, dz = p.z - v.z; if (dx * dx + dz * dz > 144) continue;
      const c = Math.cos(v.a), s = Math.sin(v.a); let lx = dx * c - dz * s, lz = dx * s + dz * c;
      const ex = v.hl + rad - Math.abs(lx), ez = v.hw + rad - Math.abs(lz);
      if (ex > 0 && ez > 0) { if (ex < ez) lx = Math.sign(lx || 1) * (v.hl + rad); else lz = Math.sign(lz || 1) * (v.hw + rad); p.x = v.x + lx * c + lz * s; p.z = v.z - lx * s + lz * c; }
    }
  }
  // the player's car c against every other vehicle: returns how far c is pushed out, and shunts what it hits
  bump(c) {
    let px = 0, pz = 0; const fx = Math.cos(c.a), fz = -Math.sin(c.a), rad = c.hw + .1;
    for (const o of this.v) {
      if (o === c) continue; const ddx = c.x - o.x, ddz = c.z - o.z; if (ddx * ddx + ddz * ddz > 300) continue;
      const co = Math.cos(o.a), so = Math.sin(o.a);
      for (const d of [c.hl * .8, 0, -c.hl * .8]) {
        const qx = c.x + px + fx * d - o.x, qz = c.z + pz + fz * d - o.z, lx = qx * co - qz * so, lz = qx * so + qz * co, ex = o.hl + rad - Math.abs(lx), ez = o.hw + rad - Math.abs(lz);
        if (ex <= 0 || ez <= 0) continue;
        const nx = ex < ez ? Math.sign(lx || 1) : 0, nz = ex < ez ? 0 : Math.sign(lz || 1), pen = Math.min(ex, ez), wx = nx * co + nz * so, wz = -nx * so + nz * co;
        px += wx * pen; pz += wz * pen;
        if (!o.own && o.k !== 2 && Math.abs(c.sp) > 2.5 && !(o.kt > 0)) { const m = o.k === 3 ? 1 : o.k === 0 ? .6 : .3, s = Math.abs(c.sp); o.kt = 1.2; o.kx = -wx * s * m; o.kz = -wz * s * m; o.ks = (Math.random() - .5) * s * .3 * m; o.hold = 3.5; o.sp = 0; o.honk = 1; o.hk = .3 + Math.random() * .5; }
      }
    }
    return [px, pz];
  }
}
