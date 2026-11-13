import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Seeded random: the city is identical every time it loads (a fixed map).
let seed = 20261111;
export const R = () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
export const rr = (a, b) => a + R() * (b - a);
export const pick = a => a[(R() * a.length) | 0];
export const PI = Math.PI;
export const FONT = '"Baloo Da 2","Noto Sans Bengali","Nirmala UI","Vrinda",sans-serif';

export function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
export function tex(c, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function speckle(g, w, h, base, n, a, blot = 40) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < blot; i++) { g.fillStyle = `rgba(${R() < .5 ? '0,0,0' : '255,255,255'},${R() * a * .5})`; g.beginPath(); g.arc(R() * w, R() * h, 10 + R() * w * .16, 0, 7); g.fill(); }
  for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${R() < .5 ? '0,0,0' : '255,255,255'},${R() * a})`; const s = 1 + R() * 3; g.fillRect(R() * w, R() * h, s, s); }
}

function facade(i) {
  const [c, g] = canvas(512, 512), wall = ['#d6b46c', '#c79183', '#c4c2b6', '#93a4ad', '#b5c4a0', '#dbd5c5'][i];
  speckle(g, 512, 512, wall, 5000, .1);
  for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) {
    const x = q * 128, y = r * 128;
    g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(x, y + 112, 128, 5); g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x, y + 117, 128, 4);
    if (i < 2 || i > 3) { // old Kolkata house: louvred shutters, iron balconies
      g.fillStyle = '#ebe4d0'; g.fillRect(x + 38, y + 16, 52, 86);
      if (R() < .25) { g.fillStyle = '#14181a'; g.fillRect(x + 42, y + 20, 44, 78); }
      else {
        g.fillStyle = pick(['#3d6a4c', '#4c5b3a', '#6a4a32', '#2f5a5a', '#3d6a4c']); g.fillRect(x + 42, y + 20, 44, 78);
        g.fillStyle = 'rgba(0,0,0,.32)'; for (let k = 0; k < 19; k++) g.fillRect(x + 42, y + 22 + k * 4, 44, 1.5); g.fillRect(x + 63, y + 20, 2, 78);
      }
      if (R() < .45) { g.fillStyle = 'rgba(25,25,25,.9)'; g.fillRect(x + 22, y + 82, 84, 2); g.fillRect(x + 22, y + 106, 84, 4); for (let k = 0; k < 11; k++) g.fillRect(x + 22 + k * 8.2, y + 82, 1.5, 24); }
    } else if (i === 2) { // mid-century office block
      g.fillStyle = '#2c3f4e'; g.fillRect(x + 8, y + 26, 112, 60); g.fillStyle = wall; g.fillRect(x + 62, y + 26, 4, 60);
      g.fillStyle = 'rgba(255,255,255,.13)'; g.fillRect(x + 8, y + 26, 112, 14);
      if (R() < .3) { g.fillStyle = '#d8d8d2'; g.fillRect(x + 72, y + 90, 26, 14); g.fillStyle = '#777'; g.fillRect(x + 76, y + 94, 18, 6); }
    } else { // glass tower
      const gr = g.createLinearGradient(0, y, 0, y + 112); gr.addColorStop(0, '#6a93ad'); gr.addColorStop(1, '#2d4a60');
      g.fillStyle = gr; g.fillRect(x, y, 128, 112); g.fillStyle = 'rgba(225,232,236,.85)'; g.fillRect(x, y, 3, 128); g.fillRect(x + 64, y, 2, 112);
    }
    if (R() < .5) { g.fillStyle = 'rgba(40,30,20,.13)'; g.fillRect(x + R() * 110, y, 6 + R() * 12, 128); }
  }
  return tex(c);
}

const SHOPS = ['মিষ্টান্ন ভাণ্ডার', 'চা', 'বইঘর', 'দাস ফার্মেসি', 'কেবিন', 'স্টুডিও', 'বস্ত্রালয়', 'জুয়েলার্স', 'ভাতের হোটেল', 'টেলার্স', 'স্টোর্স', 'রোল সেন্টার', 'ঘড়ি ঘর', 'মা তারা', 'TEA STALL', 'SWEETS', 'BOOKS', 'MEDICAL', 'ROLLS', 'CABIN', 'STORES', 'TAILORS', 'MOBILE', 'XEROX'];
function shops() {
  const [c, g] = canvas(2048, 256);
  for (let i = 0; i < 8; i++) {
    const x = i * 256;
    g.fillStyle = pick(['#24211f', '#2d2a2c', '#1f262b']); g.fillRect(x, 0, 256, 256);
    if (R() < .35) { g.fillStyle = pick(['#8d9499', '#6f7d86', '#9c8f7a']); g.fillRect(x + 14, 64, 228, 192); g.fillStyle = 'rgba(0,0,0,.3)'; for (let k = 0; k < 24; k++) g.fillRect(x + 14, 66 + k * 8, 228, 2); }
    else {
      for (let k = 0; k < 16; k++) { g.fillStyle = `hsl(${R() * 360},55%,${35 + R() * 30}%)`; g.fillRect(x + 20 + R() * 196, 84 + R() * 100, 14 + R() * 26, 14 + R() * 30); }
      g.fillStyle = '#5a4030'; g.fillRect(x + 14, 204, 228, 52); g.fillStyle = 'rgba(255,220,150,.10)'; g.fillRect(x + 14, 64, 228, 140);
    }
    g.fillStyle = '#b9b09c'; g.fillRect(x, 0, 14, 256); g.fillRect(x + 242, 0, 14, 256);
    const bg = pick(['#b3261e', '#1f4e8c', '#f2c118', '#1d6b46', '#f4f1e8', '#5a2d82', '#d9541e']);
    g.fillStyle = bg; g.fillRect(x + 6, 4, 244, 58);
    g.fillStyle = (bg === '#f2c118' || bg === '#f4f1e8') ? '#161616' : '#fff'; g.font = `700 36px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(pick(SHOPS), x + 128, 35, 228);
    if (R() < .4) { for (let k = 0; k < 12; k++) { g.fillStyle = k % 2 ? '#e8e2d4' : pick(['#b3261e', '#1f4e8c', '#1d6b46']); g.fillRect(x + 8 + k * 20, 62, 20, 20); } }
  }
  return tex(c);
}
function road() {
  const [c, g] = canvas(512, 512); speckle(g, 512, 512, '#3b3b3d', 26000, .14, 50);
  g.fillStyle = 'rgba(235,235,225,.75)'; g.fillRect(251, 0, 10, 240);
  g.fillStyle = 'rgba(230,210,120,.5)'; g.fillRect(16, 0, 5, 512); g.fillRect(491, 0, 5, 512);
  return tex(c);
}
function plain(base, n, a, s = 256) { const [c, g] = canvas(s, s); speckle(g, s, s, base, n, a); return tex(c); }
function waterBump() {
  const [c, g] = canvas(256, 256); g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) { const v = R() < .5 ? 255 : 0; g.fillStyle = `rgba(${v},${v},${v},.10)`; g.beginPath(); const x = R() * 256, y = R() * 256; g.ellipse(x, y, 4 + R() * 16, 1.5 + R() * 4, 0, 0, 7); g.fill(); }
  const t = tex(c, 60, 60); t.colorSpace = THREE.NoColorSpace; return t;
}

// surface textures for the landmarks (applied in object space, so no UV stretching)
function brickTex() {
  const [c, g] = canvas(256, 256); g.fillStyle = '#b3aa9f'; g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 16; r++) for (let q = -1; q < 8; q++) { const v = 205 + R() * 50 | 0; g.fillStyle = `rgb(${v},${v - R() * 14 | 0},${v - R() * 20 | 0})`; g.fillRect(q * 32 + (r % 2) * 16 + 1, r * 16 + 1, 30, 14); }
  for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(30,20,15,${.05 + R() * .08})`; g.fillRect(R() * 256, 0, 8 + R() * 30, 256); }
  return tex(c);
}
function plasterTex(joints) {
  const [c, g] = canvas(512, 512); speckle(g, 512, 512, '#ffffff', 9000, .07, 50);
  if (joints) { g.strokeStyle = 'rgba(70,65,60,.22)'; g.lineWidth = 1.5; for (let r = 0; r < 8; r++) { g.beginPath(); g.moveTo(0, r * 64); g.lineTo(512, r * 64); g.stroke(); for (let q = 0; q < 4; q++) { g.beginPath(); g.moveTo(q * 128 + (r % 2) * 64, r * 64); g.lineTo(q * 128 + (r % 2) * 64, r * 64 + 64); g.stroke(); } }
    for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(110,115,125,${.05 + R() * .08})`; g.lineWidth = 1 + R() * 2; g.beginPath(); const x = R() * 512, y = R() * 512; g.moveTo(x, y); g.bezierCurveTo(x + rr(-90, 90), y + rr(-60, 60), x + rr(-120, 120), y + rr(-90, 90), x + rr(-160, 160), y + rr(-120, 120)); g.stroke(); } }
  for (let i = 0; i < (joints ? 10 : 34); i++) { const x = R() * 512, w = 5 + R() * 26, y = R() * 300, gr = g.createLinearGradient(0, y, 0, y + 150 + R() * 200); gr.addColorStop(0, `rgba(55,45,30,${.05 + R() * .09})`); gr.addColorStop(1, 'rgba(55,45,30,0)'); g.fillStyle = gr; g.fillRect(x, y, w, 400); }
  if (!joints) for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(70,80,60,${.04 + R() * .06})`; g.beginPath(); g.ellipse(R() * 512, R() * 512, 30 + R() * 70, 16 + R() * 40, R() * 3, 0, 7); g.fill(); }
  return tex(c);
}
function booksTex() {
  const [c, g] = canvas(256, 256); g.fillStyle = '#3a2a1c'; g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 4; r++) { let x = 2; while (x < 250) { const w = 5 + R() * 9, h = 44 + R() * 14; g.fillStyle = `hsl(${R() * 360},${30 + R() * 45}%,${28 + R() * 42}%)`; g.fillRect(x, r * 64 + 60 - h, w, h); if (R() < .4) { g.fillStyle = 'rgba(255,240,200,.6)'; g.fillRect(x + 1, r * 64 + 66 - h, w - 2, 3); } x += w + 1; } g.fillStyle = '#6a4c36'; g.fillRect(0, r * 64 + 60, 256, 4); }
  return tex(c);
}
function curtainTex() { // glass curtain wall: one tile is one floor by two bays
  const [c, g] = canvas(256, 256), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#eef6fa'); gr.addColorStop(1, '#a9c3d2'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2; i++) if (R() < .5) { g.fillStyle = 'rgba(255,240,200,.25)'; g.fillRect(i * 128, 0, 128, 200); }
  g.fillStyle = 'rgba(50,70,85,.6)'; g.fillRect(0, 204, 256, 52); g.fillStyle = 'rgba(245,248,250,.95)'; g.fillRect(0, 0, 5, 256); g.fillRect(126, 0, 4, 256); g.fillRect(0, 250, 256, 6);
  return tex(c);
}
// Painted sign board
export function signMesh(text, w, h, bg = '#f4f1e8', fg = '#141414') {
  const H = 160, W = Math.min(2048, Math.round(H * w / h)), [c, g] = canvas(W, H);
  g.fillStyle = bg; g.fillRect(0, 0, W, H); g.strokeStyle = fg; g.lineWidth = 5; g.strokeRect(6, 6, W - 12, H - 12);
  const lines = text.split('\n'); let fs = (H * .62) / lines.length;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fg;
  for (; fs > 10; fs -= 3) { g.font = `700 ${fs}px ${FONT}`; if (lines.every(l => g.measureText(l).width < W * .9)) break; }
  lines.forEach((l, i) => g.fillText(l, W / 2, H * (i + .5) / lines.length + 3));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: .7 }));
}

const m = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .85, ...o });
const tri = (color, map, sc, o = {}) => { // texture projected from the model's own x/y/z
  const mt = m(color, { map, ...o });
  mt.onBeforeCompile = s => {
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvOP = position; vON = normal;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON;')
      .replace('#include <map_fragment>', `vec3 an = abs(vON); vec2 tuv = an.y > .6 ? vOP.xz : (an.x > an.z ? vOP.zy : vOP.xy); diffuseColor *= texture2D(map, tuv * ${sc.toFixed(4)});`);
  };
  mt.customProgramCacheKey = () => 'tri' + sc; return mt;
};
export const M = {}, T = {};
export function initMats() {
  Object.assign(M, {
    marble: m('#f1eee6', { roughness: .5 }), white: m('#ece8de'), cream: m('#e2d2aa'), brick: m('#9c3f30'), brickD: m('#7d3026'), redOx: m('#8f3a2b'),
    sand: m('#b5563c'), steel: m('#aab1b6', { metalness: .65, roughness: .45 }), glass: m('#1c2831', { roughness: .15, metalness: .3 }), dark: m('#19191b'),
    roof: m('#5b5651'), roofR: m('#8a4a3a'), green: m('#2f6249'), domeG: m('#4b8a6c', { roughness: .5 }), bronze: m('#4a3b28', { metalness: .6, roughness: .5 }),
    gold: m('#c9a23a', { metalness: .8, roughness: .35 }), gravel: m('#c2ad88'), wood: m('#6b4a2e'), thatch: m('#a48d5a'), yellow: m('#f2c118', { roughness: .45 }),
    blue: m('#27408f', { roughness: .5 }), tin: m('#8c9296', { metalness: .4, roughness: .6 }), conc: m('#a9a59c'), stone: m('#8f897e'), tyre: m('#141414'),
    red: m('#b3261e'), track: m('#8a6f52'), rampart: m('#6f7a4e'), seat: m('#3f6f9e', { side: THREE.DoubleSide }), tram: m('#f1efe6', { roughness: .5 }),
    bus: m('#2f63b5', { roughness: .5 }), sky: m('#78acd8', { roughness: .55 }), ybus: m('#efc12e', { roughness: .5 }), khaki: m('#7a6f58'), chrome: m('#dadcde', { metalness: .92, roughness: .22 }), cglass: m('#b8d0da', { transparent: true, opacity: .3, roughness: .05, metalness: .3, depthWrite: false }), seatr: m('#5a2a22'), ddred: m('#c4261c', { roughness: .38 }), skin: m('#9a6846'), rosh: m('#faf6ea', { roughness: .4 }), clay: m('#a8623c'), orange: m('#e8862a'), pink: m('#d8568a'), lime: m('#8ab83a'), saffron: m('#f08c28'), asph: m('#38383a'), tinD: m('#8c9296', { metalness: .4, roughness: .6, side: THREE.DoubleSide }), lamp: m('#fff3c4', { emissive: '#ffe9a0', emissiveIntensity: .6 }),
  });
  const bt = brickTex(), pt = plasterTex(false), mbl = plasterTex(true);
  Object.assign(M, { brick: tri('#a8473a', bt, .3), brickD: tri('#8a372c', bt, .3), redOx: tri('#9a4032', pt, .09), sand: tri('#b85a40', bt, .16),
    flag: tri('#d6ccb6', mbl, .2), white: tri('#efebe1', pt, .07), cream: tri('#e6d6ad', pt, .07), marble: tri('#f4f1ea', mbl, .12, { roughness: .45 }), stone: tri('#9a948a', mbl, .2) });
  M.books = m('#ffffff', { map: booksTex() }); M.iron = m('#1c1e20', { metalness: .5, roughness: .6 });
  M.moss = tri('#8d917a', pt, .09); M.tower = tri('#9dbfd3', curtainTex(), 1 / 3.6, { roughness: .12, metalness: .6 });
  const flat = (c, o) => { const mt = m(c, { polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }); mt.userData.order = o; return mt; };
  M.apron = flat('#3b3b3d', 40); M.clayT = flat('#b8693d', 40); M.clayT.side = THREE.DoubleSide; M.lineT = flat('#ece8de', 41); M.lineT.side = THREE.DoubleSide; M.paint = flat('#ece8de', 41);
  T.fac = [0, 1, 2, 3, 4, 5].map(facade); T.shops = shops(); T.road = road();
  T.grass = plain('#5f7b3c', 9000, .12, 512); T.ground = plain('#8f877a', 7000, .1, 512); T.pave = plain('#aaa69c', 4000, .1);
  M.grass = m('#ffffff', { map: T.grass.clone() }); M.grass.map.repeat.set(6, 6);
  M.water = m('#56706a', { roughness: .08, metalness: .45, bumpMap: waterBump(), bumpScale: 4 });
  M.pond = m('#4c5f52', { roughness: .1, metalness: .3 });
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), UP = new THREE.Vector3(0, 1, 0);
// Kit: build a model from primitives, merged into one mesh per material.
export class Kit {
  constructor() { this.parts = new Map(); this.extras = []; }
  add(mat, geo, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) {
    geo.applyMatrix4(_m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _s));
    const g = geo.index ? geo.toNonIndexed() : geo;
    for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal' && n !== 'uv') g.deleteAttribute(n);
    if (!this.parts.has(mat)) this.parts.set(mat, []);
    this.parts.get(mat).push(g); return this;
  }
  box(mat, w, h, d, x, y, z, ry = 0) { return this.add(mat, new THREE.BoxGeometry(w, h, d), x, y + h / 2, z, ry); }
  cyl(mat, rt, rb, h, x, y, z, seg = 14) { return this.add(mat, new THREE.CylinderGeometry(rt, rb, h, seg), x, y + h / 2, z); }
  dome(mat, r, x, y, z, sy = 1, seg = 18) { const g = new THREE.SphereGeometry(r, seg, Math.max(6, seg >> 1), 0, PI * 2, 0, PI / 2); g.scale(1, sy, 1); return this.add(mat, g, x, y, z); }
  cone(mat, r, h, x, y, z, seg = 12, ry = 0) { return this.add(mat, new THREE.ConeGeometry(r, h, seg), x, y + h / 2, z, ry); }
  pyr(mat, s, h, x, y, z) { return this.cone(mat, s * .7072, h, x, y, z, 4, PI / 4); }
  // pitched roof: a square bar turned 45 degrees, lower half hidden in the building
  prism(mat, len, s, x, y, z, alongX = true) { return alongX ? this.add(mat, new THREE.BoxGeometry(len, s, s), x, y, z, 0, PI / 4) : this.add(mat, new THREE.BoxGeometry(s, s, len), x, y, z, 0, 0, PI / 4); }
  cols(mat, x1, z1, x2, z2, n, r, h, y) {
    for (let i = 0; i < n; i++) { const t = n > 1 ? i / (n - 1) : .5, x = x1 + (x2 - x1) * t, z = z1 + (z2 - z1) * t; this.cyl(mat, r * .85, r, h, x, y, z, 10); this.box(mat, r * 2.6, r * .7, r * 2.6, x, y + h - r * .7, z); }
    return this;
  }
  wins(mat, x1, z1, x2, z2, n, w, h, y, t = .3) {
    const a = Math.atan2(-(z2 - z1), x2 - x1);
    const arch = h / w >= 1.9 && t >= .2; // tall openings get a round head
    for (let i = 0; i < n; i++) {
      const f = (i + .5) / n, x = x1 + (x2 - x1) * f, z = z1 + (z2 - z1) * f;
      if (arch) { this.box(mat, w, h - w / 2, t, x, y, z, a); this.add(mat, new THREE.CylinderGeometry(w / 2, w / 2, t, 14).rotateX(PI / 2), x, y + h - w / 2, z, a); }
      else this.box(mat, w, h, t, x, y, z, a);
    }
    return this;
  }
  beam(mat, a, b, t) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), g = new THREE.BoxGeometry(t, A.distanceTo(B), t);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, B.clone().sub(A).normalize()));
    const c = A.add(B).multiplyScalar(.5); return this.add(mat, g, c.x, c.y, c.z);
  }
  sign(text, w, h, x, y, z, ry = 0, bg, fg) { const s = signMesh(text, w, h, bg, fg); s.position.set(x, y, z); s.rotation.y = ry; this.extras.push(s); return this; }
  chala(mat, s, h, x, y, z, drop = .8, sz = s) { // Bengal curved roof: hipped, eaves drooping to the corners
    const g = new THREE.PlaneGeometry(2, 2, 10, 10).rotateX(-PI / 2), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const u = p.getX(i), v = p.getZ(i), mm = Math.max(Math.abs(u), Math.abs(v)), n = Math.min(Math.abs(u), Math.abs(v)); p.setXYZ(i, u * s / 2, h * (1 - mm) - drop * n * n * mm, v * sz / 2); }
    g.computeVertexNormals(); const f = g.clone(), ix = f.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i]; ix[i] = ix[i + 1]; ix[i + 1] = t; } f.computeVertexNormals();
    this.add(mat, f, x, y, z); return this.add(mat, g, x, y, z);
  }
  gwins(mat, x1, z1, x2, z2, n, w, h, y, t = .3) { // pointed (Gothic) openings
    const a = Math.atan2(-(z2 - z1), x2 - x1), sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h - w); sh.quadraticCurveTo(w / 2, h - w * .35, 0, h); sh.quadraticCurveTo(-w / 2, h - w * .35, -w / 2, h - w);
    for (let i = 0; i < n; i++) { const f = (i + .5) / n; this.add(mat, new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 5 }).translate(0, 0, -t / 2), x1 + (x2 - x1) * f, y, z1 + (z2 - z1) * f, a); }
    return this;
  }
  gable(mat, w, h, d, x, y, z, ry = 0) { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); return this.add(mat, new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }).translate(0, 0, -d / 2), x, y, z, ry); }
  loft(mat, secs, n = 3.2, K = 20) { // smooth body through rounded cross-sections [x, half-width, y0, y1]
    const pos = [], idx = [], e = 2 / n, S = secs.length;
    for (const [x, w, y0, y1] of secs) for (let i = 0; i < K; i++) { const t = i / K * PI * 2, c = Math.cos(t), s = Math.sin(t); pos.push(x, (y0 + y1) / 2 + Math.sign(s) * Math.abs(s) ** e * (y1 - y0) / 2, Math.sign(c) * Math.abs(c) ** e * w); }
    for (let j = 0; j < S - 1; j++) for (let i = 0; i < K; i++) { const a = j * K + i, b = j * K + (i + 1) % K; idx.push(a, a + K, b, b, a + K, b + K); }
    const c0 = pos.length / 3; pos.push(secs[0][0], (secs[0][2] + secs[0][3]) / 2, 0, secs[S - 1][0], (secs[S - 1][2] + secs[S - 1][3]) / 2, 0);
    for (let i = 0; i < K; i++) idx.push(c0, i, (i + 1) % K, c0 + 1, (S - 1) * K + (i + 1) % K, (S - 1) * K + i);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2));
    return this.add(mat, g);
  }
  clock(d, x, y, z, ry = 0) {
    const [c, g] = canvas(128, 128); g.fillStyle = '#f3ecd8'; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill(); g.strokeStyle = '#2a2018'; g.lineWidth = 6; g.stroke();
    for (let i = 0; i < 12; i++) { const a = i * PI / 6; g.lineWidth = i % 3 ? 2 : 5; g.beginPath(); g.moveTo(64 + Math.sin(a) * 46, 64 - Math.cos(a) * 46); g.lineTo(64 + Math.sin(a) * 55, 64 - Math.cos(a) * 55); g.stroke(); }
    g.lineCap = 'round'; g.lineWidth = 6; g.beginPath(); g.moveTo(64, 64); g.lineTo(40, 44); g.stroke(); g.lineWidth = 4; g.beginPath(); g.moveTo(64, 64); g.lineTo(98, 40); g.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const me = new THREE.Mesh(new THREE.CircleGeometry(d / 2, 24), new THREE.MeshStandardMaterial({ map: t, roughness: .6 })); me.position.set(x, y, z); me.rotation.y = ry; this.extras.push(me); return this;
  }
  build(shadow = true) {
    const g = new THREE.Group();
    for (const [mat, list] of this.parts) { const me = new THREE.Mesh(mergeGeometries(list), mat); me.castShadow = shadow && !mat.userData.order; me.receiveShadow = true; me.renderOrder = mat.userData.order || 0; g.add(me); }
    for (const e of this.extras) g.add(e);
    return g;
  }
}
