import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { M, T, R, rr, pick, PI } from './kit.js';
import { BANK, RIVER_W, WATER_Y, bankX, ROADS, MAIDAN, TRAM, X0, X1, Z0, Z1, LAT0, LON0, DAK } from './data.js';
import { addBox, addCirc } from './collide.js';
import { buildLandmarks, clears, trees } from './landmarks.js';

export const POLES = { list: [], im: null }; // lamp posts, which a car can knock down
export const SEG = [];
for (const r of ROADS) for (let i = 0; i < r.p.length - 1; i++) {
  const a = r.p[i], b = r.p[i + 1];
  SEG.push({ ax: a[0], az: a[1], bx: b[0], bz: b[1], w: r.w, n: r.n, ang: Math.atan2(-(b[1] - a[1]), b[0] - a[0]) });
}
export function nearestRoad(x, z) {
  let d = 1e9, s = null, qx = 0, qz = 0;
  for (const g of SEG) {
    const dx = g.bx - g.ax, dz = g.bz - g.az, t = Math.max(0, Math.min(1, ((x - g.ax) * dx + (z - g.az) * dz) / (dx * dx + dz * dz)));
    const px = g.ax + dx * t, pz = g.az + dz * t, e = Math.hypot(x - px, z - pz) - g.w / 2;
    if (e < d) { d = e; s = g; qx = px; qz = pz; }
  }
  return { d, s, qx, qz };
}
export function inPoly(P, x, z) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; }
  return c;
}
const inClear = (x, z, m) => clears.some(c => { const dx = x - c.x, dz = z - c.z; return Math.abs(dx * c.c - dz * c.s) < c.hw + m && Math.abs(dx * c.s + dz * c.c) < c.hd + m; });

const geo = (o) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(o.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(o.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(o.u, 2)); if (o.c) g.setAttribute('color', new THREE.Float32BufferAttribute(o.c, 3)); if (o.i) g.setIndex(o.i); return g; };
const decal = (mat, order) => { const m = mat.clone(); m.depthWrite = false; m.polygonOffset = true; m.polygonOffsetFactor = -4; m.polygonOffsetUnits = -4; m.userData.order = order; return m; };

function flat(pts, tile, y = 0) {
  const tri = THREE.ShapeUtils.triangulateShape(pts.map(p => new THREE.Vector2(p[0], p[1])), []), o = { p: [], n: [], u: [], i: [] };
  for (const p of pts) { o.p.push(p[0], y, p[1]); o.n.push(0, 1, 0); o.u.push(p[0] / tile, p[1] / tile); }
  for (const [a, b, c] of tri) { const A = pts[a], B = pts[b], C = pts[c]; ((B[1] - A[1]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[1] - A[1]) > 0) ? o.i.push(a, b, c) : o.i.push(a, c, b); }
  return geo(o);
}
// left/right offset points of a polyline (mitred)
function sides(pts, half, shift = 0) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], p = pts[i];
    let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz); tx /= l; tz /= l;
    let k = 1;
    if (i > 0 && i < pts.length - 1) { let sx = p[0] - a[0], sz = p[1] - a[1]; const sl = Math.hypot(sx, sz); k = 1 / Math.max(.6, (sx * tx + sz * tz) / sl); }
    const nx = tz * k, nz = -tx * k; // left of travel
    out.push([p[0] + nx * (shift + half), p[1] + nz * (shift + half), p[0] + nx * (shift - half), p[1] + nz * (shift - half)]);
  }
  return out;
}
function ribbon(pts, w, y, vs = 12, shift = 0) {
  const sd = sides(pts, w / 2, shift), o = { p: [], n: [], u: [], i: [] }; let len = 0;
  sd.forEach((s, i) => {
    if (i) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    o.p.push(s[0], y, s[1], s[2], y, s[3]); o.n.push(0, 1, 0, 0, 1, 0); o.u.push(0, len / vs, 1, len / vs);
    if (i) { const a = 2 * i - 2; o.i.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  });
  return geo(o);
}

export function buildWorld(scene) {
  const add = (g, mat, shadow = false) => { const me = new THREE.Mesh(g, mat); me.receiveShadow = true; me.castShadow = shadow; me.renderOrder = mat.userData.order || 0; scene.add(me); return me; };
  const ground = new THREE.MeshStandardMaterial({ map: T.ground, roughness: .95 });
  const NB = [[DAK.bx, -3750], [DAK.bx, BANK[0][1] - 84], ...BANK], WB = NB.map(([x, z]) => [x - RIVER_W, z]); // the river runs on north to Dakshineswar
  add(flat([...NB, [X1 + 300, BANK.at(-1)[1]], [X1 + 300, -3750]], 30), ground);
  add(flat([...WB, [X0 - 300, WB.at(-1)[1]], [X0 - 300, -3750]], 30), ground);
  const water = add(new THREE.PlaneGeometry(1700, 5800).rotateX(-PI / 2).translate(-620, WATER_Y, -900), M.water); M.water.bumpMap.repeat.set(68, 100);
  for (const line of [NB, WB]) { // embankment walls
    const o = { p: [], n: [], u: [], i: [] };
    line.forEach((p, i) => { o.p.push(p[0], .02, p[1], p[0], WATER_Y - .6, p[1]); o.n.push(1, 0, 0, 1, 0, 0); o.u.push(i * 20, 0, i * 20, 1); if (i) { const a = 2 * i - 2; o.i.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
    const mt = new THREE.MeshStandardMaterial({ color: '#7d776c', roughness: .95, side: THREE.DoubleSide }); add(geo(o), mt);
  }
  const grassD = decal(new THREE.MeshStandardMaterial({ map: T.grass, roughness: .95 }), 2);
  add(flat(MAIDAN, 22, .02), grassD);

  buildLandmarks(scene);

  // roads
  const pave = decal(new THREE.MeshStandardMaterial({ map: T.pave, roughness: .9 }), 5), roadM = new THREE.MeshStandardMaterial({ map: T.road, roughness: .88 });
  T.pave.repeat.set(3, 1);
  ROADS.forEach((r, i) => { add(ribbon(r.p, r.w + 7, .02), pave); add(ribbon(r.p, r.w, .02), decal(roadM, 10 + i)); });
  const rail = decal(new THREE.MeshStandardMaterial({ color: '#77797c', metalness: .7, roughness: .4 }), 60);
  for (const side of [1, -1]) for (const g of [-.72, .72]) add(ribbon(TRAM, .16, .02, 12, side * 3.5 + g), rail);

  // ── filler city: houses, offices, shops
  const A = () => ({ p: [], n: [], u: [], c: [] }), FB = [A(), A(), A(), A(), A(), A()], SH = A(), RF = A(), tanks = [];
  const quad = (o, a, b, y0, y1, u0, u1, v0, v1, col) => {
    const ex = b[0] - a[0], ez = b[1] - a[1], l = Math.hypot(ex, ez), nx = -ez / l, nz = ex / l;
    o.p.push(a[0], y0, a[1], b[0], y0, b[1], b[0], y1, b[1], a[0], y0, a[1], b[0], y1, b[1], a[0], y1, a[1]);
    o.u.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1);
    for (let i = 0; i < 6; i++) { o.n.push(nx, 0, nz); o.c.push(col[0], col[1], col[2]); }
  };
  const fill = (x0, x1, z0, z1, far) => { for (let gx = x0 + 16; gx < x1 - 10; gx += 27) for (let gz = z0 + 16; gz < z1 - 10; gz += 27) {
    let x = gx + rr(-5, 5), z = gz + rr(-5, 5);
    const w = rr(15, 24), d = rr(13, 22), nr = nearestRoad(x, z);
    let rot = 0;
    if (nr.d < d / 2 + 34) { // line the street: front 4.5 from the kerb
      const cx = nr.qx - x, cz = nr.qz - z, cl = Math.hypot(cx, cz) || 1, sh = nr.d - (d / 2 + 4.5);
      x += cx / cl * sh; z += cz / cl * sh; rot = nr.s.ang;
      if (nearestRoad(x, z).d < d / 2 + 3.5) continue;
    }
    const be = bankX(z), west = x < be;
    if (x < be + 30 && x > be - RIVER_W - 18) continue;
    if (!west && inPoly(MAIDAN, x, z)) continue;
    if (inClear(x, z, 13)) continue;
    const lat = LAT0 - z / 49770, lon = LON0 + x / 46260, old = far || west || lon > 88.3605 || (lat > 22.5745 && lon > 88.352) || lat > 22.583;
    let f = old ? 2 + (R() * 4 | 0) : 3 + (R() * 6 | 0), st = old ? pick([0, 1, 4, 5, 0, 1]) : pick([2, 2, 5, 0, 1, 4, 3]);
    if (!old && R() < .07) { f = 12 + (R() * 12 | 0); st = pick([3, 3, 2]); } else if (st === 3) f += 3;
    const h = f * 3.3, cs = Math.cos(rot), sn = Math.sin(rot);
    const C = [[-w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2], [w / 2, -d / 2]].map(([lx, lz]) => [x + lx * cs + lz * sn, z - lx * sn + lz * cs]);
    const t = rr(.7, 1.04), col = [t * rr(.95, 1.04), t, t * rr(.92, 1.02)];
    for (let i = 0; i < 4; i++) {
      const a = C[i], b = C[(i + 1) % 4], bays = Math.max(1, Math.round((i % 2 ? w : d) / 3.2)), u0 = (R() * 4 | 0) / 4, s0 = (R() * 8 | 0) / 8;
      quad(FB[st], a, b, 3.3, h, u0, u0 + bays / 4, 0, (f - 1) / 4, col); quad(SH, a, b, 0, 3.3, s0, s0 + bays / 8, 0, 1, [1, 1, 1]);
    }
    const rc = [.42 * t, .41 * t, .4 * t];
    for (const i of [0, 1, 2, 0, 2, 3]) { RF.p.push(C[i][0], h, C[i][1]); RF.n.push(0, 1, 0); RF.u.push(0, 0); RF.c.push(...rc); }
    if (!west) { addBox(x, z, w, d, rot, h); if (R() < .6) tanks.push([x + rr(-3, 3), h, z + rr(-3, 3)]); }
  } };
  fill(X0, X1, Z0, Z1); fill(DAK.bx - RIVER_W - 330, DAK.bx + 520, DAK.z - 430, DAK.z + 430, true);
  FB.forEach((o, i) => add(geo(o), new THREE.MeshStandardMaterial({ map: T.fac[i], vertexColors: true, roughness: i === 3 ? .35 : .9, metalness: i === 3 ? .3 : 0 }), true));
  add(geo(SH), new THREE.MeshStandardMaterial({ map: T.shops, roughness: .85 }), true);
  add(geo(RF), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 }), true);
  const dm = new THREE.Object3D(), inst = (g, mat, list, fn, shadow = true) => { const im = new THREE.InstancedMesh(g, mat, list.length); list.forEach((e, i) => { fn(e, i, im); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix); }); im.castShadow = shadow; im.receiveShadow = true; im.frustumCulled = false; scene.add(im); return im; };
  inst(new THREE.CylinderGeometry(.9, .9, 1.7, 6).translate(0, .85, 0), M.dark, tanks, e => { dm.position.set(e[0], e[1], e[2]); dm.rotation.set(0, 0, 0); dm.scale.setScalar(1); }, false);

  // ── trees: Maidan, avenues, gardens
  const mb = MAIDAN.reduce((b, p) => [Math.min(b[0], p[0]), Math.max(b[1], p[0]), Math.min(b[2], p[1]), Math.max(b[3], p[1])], [1e9, -1e9, 1e9, -1e9]);
  for (let i = 0; i < 900; i++) { const x = rr(mb[0], mb[1]), z = rr(mb[2], mb[3]); if (inPoly(MAIDAN, x, z) && nearestRoad(x, z).d > 4 && !inClear(x, z, 3)) trees.push([x, z, rr(.9, 1.5)]); }
  const lamps = [];
  for (const r of ROADS) for (let i = 0; i < r.p.length - 1; i++) {
    const a = r.p[i], b = r.p[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L;
    for (let s = 10, j = 0; s < L - 6; s += 19, j++) for (const sd of [-1, 1]) {
      const lampHere = (j % 2 === 0) && sd === (j % 4 ? 1 : -1), o = r.w / 2 + (lampHere ? 1.3 : 2.4), x = a[0] + tx * s + tz * sd * o, z = a[1] + tz * s - tx * sd * o;
      if (nearestRoad(x, z).d < 1 || x < bankX(z) + 3) continue;
      if (lampHere) lamps.push([x, z, Math.atan2(-tx * sd, -tz * sd)]);
      else if (r.w >= 14 && R() < .5 && !inClear(x, z, 0)) trees.push([x, z, rr(.7, 1)]);
    }
  }
  const leaf = ['#3f6b2e', '#4a7a35', '#2f5a2a', '#5a8438', '#3b6a3a', '#6b8f3a', '#44702f'].map(c => new THREE.Color(c)), flame = new THREE.Color('#c8452a');
  const ico = new THREE.IcosahedronGeometry(1, 1); ico.deleteAttribute('normal'); ico.deleteAttribute('uv');
  const can = mergeVertices(ico), cp = can.attributes.position;
  for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i), k = 1 + .2 * Math.sin(x * 5.1) * Math.sin(y * 4.3 + 1) * Math.sin(z * 6.7 + 2) + .08 * Math.sin(x * 11 + y * 9); cp.setXYZ(i, x * k, y * k, z * k); }
  can.computeVertexNormals();
  inst(new THREE.CylinderGeometry(.2, .36, 5, 6).translate(0, 2.5, 0), M.wood, trees, e => { dm.position.set(e[0], 0, e[1]); dm.rotation.set(0, R() * 6, 0); dm.scale.set(e[2], e[2], e[2]); addCirc(e[0], e[1], .4 * e[2], 5); });
  const blobs = []; for (const e of trees) { blobs.push([e[0], 5.6 * e[2], e[1], e[2] * 3.6, 0]); blobs.push([e[0] + rr(-1.6, 1.6) * e[2], 4.6 * e[2], e[1] + rr(-1.6, 1.6) * e[2], e[2] * 2.6, 1]); }
  let tc = leaf[0];
  inst(can, new THREE.MeshStandardMaterial({ roughness: .9 }), blobs, (e, i, im) => { dm.position.set(e[0], e[1], e[2]); dm.rotation.set(0, R() * 6, 0); dm.scale.set(e[3], e[3] * .78, e[3]); if (!e[4]) tc = R() < .06 ? flame : pick(leaf); im.setColorAt(i, tc); });
  const lg = mergeGeometries([new THREE.CylinderGeometry(.09, .13, 7.5, 6).translate(0, 3.75, 0), new THREE.BoxGeometry(2.2, .12, .12).translate(1, 7.4, 0), new THREE.BoxGeometry(.9, .16, .36).translate(2.1, 7.3, 0)]);
  POLES.list = lamps.map(l => ({ x: l[0], z: l[1], down: false }));
  POLES.im = inst(lg, M.tin, lamps, e => { dm.position.set(e[0], 0, e[1]); dm.rotation.set(0, e[2], 0); dm.scale.setScalar(1); }, false);

  const wb = M.water.bumpMap;
  return { update(t) { wb.offset.set(t * .004, t * .011); }, water };
}
