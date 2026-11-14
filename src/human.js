import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Procedural people: the protagonist, pedestrians, hawkers. Figures face +z.
const PI = Math.PI, MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85 }), cloths = new Map();
let LOW = false;
const cyl = (rt, rb, h, s = 10) => new THREE.CylinderGeometry(rt, rb, h, LOW ? Math.min(s, 5) : s), sph = (r, w = 12, h = 9) => new THREE.SphereGeometry(r, LOW ? Math.min(w, 6) : w, LOW ? Math.min(h, 4) : h), box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const P = (g, c, x = 0, y = 0, z = 0, rx = 0, rz = 0) => {
  if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz); g.translate(x, y, z); if (g.index) g = g.toNonIndexed();
  const n = g.attributes.position.count, a = new Float32Array(n * 3), k = new THREE.Color(c);
  for (let i = 0; i < n; i++) { a[i * 3] = k.r; a[i * 3 + 1] = k.g; a[i * 3 + 2] = k.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
};
const C = g => { g.cloth = true; return g; };

export function checkTex() { // white shirt with fine blue checks
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(50,80,150,.5)'; g.fillRect(i * 16 + 6, 0, 3, 64); g.fillRect(0, i * 16 + 6, 64, 3); g.fillStyle = 'rgba(30,40,90,.35)'; g.fillRect(i * 16 + 13, 0, 1, 64); g.fillRect(0, i * 16 + 13, 64, 1); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12, 7); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export function makeFigure(o = {}) {
  const { skin = '#9a6846', hair = '#17110d', top = '#e9e4d8', bottom = '#26262b', shoe = '#2a1d14', woman = false, border = '#d4af37', blouse = '#7a1f2a', full = false, map = null, s = 1 } = o;
  LOW = !o.hi; // only the protagonist gets the detailed mesh
  const g = new THREE.Group(), body = new THREE.Group(); body.position.y = .9; g.add(body); g.scale.setScalar(s);
  const part = (list, parent, x = 0, y = 0, z = 0) => {
    const grp = new THREE.Group(); grp.position.set(x, y, z); parent.add(grp);
    const cl = map ? list.filter(e => e.cloth) : [], rest = map ? list.filter(e => !e.cloth) : list;
    const put = (l, m) => { if (!l.length) return; const me = new THREE.Mesh(mergeGeometries(l), m); me.castShadow = true; grp.add(me); };
    put(rest, MAT);
    if (cl.length) { if (!cloths.has(map)) cloths.set(map, new THREE.MeshStandardMaterial({ map, vertexColors: true, roughness: .8 })); put(cl, cloths.get(map)); }
    return grp;
  };
  const head = [P(cyl(.05, .055, .1, 8), skin, 0, .57, 0), P(sph(.112, 14, 12).scale(1, 1.14, 1.04), skin, 0, .715, 0),
    P(new THREE.SphereGeometry(.12, LOW ? 7 : 14, LOW ? 4 : 8, 0, PI * 2, 0, 1.8).scale(1, 1.1, 1.06), hair, 0, .735, -.012, -.32),
    ...(LOW ? [] : [P(sph(.013, 6, 5), '#0c0806', -.04, .73, .108), P(sph(.013, 6, 5), '#0c0806', .04, .73, .108)]),
    ...(o.cap ? [P(cyl(.122, .126, .07, 10), o.cap, 0, .825, -.005), P(box(.17, .016, .1), '#111111', 0, .795, .125), P(cyl(.17, .168, .05, 10).scale(1, 1, .64), '#111111', 0, 0, 0)] : [])];
  let sh = .235;
  if (woman) {
    sh = .2;
    part([...head, P(sph(.065, 8, 6), hair, 0, .7, -.135), P(cyl(.16, .135, .34, 12).scale(1, 1, .66), blouse, 0, .33, 0), P(sph(.17, 12, 6).scale(1, .33, .66), blouse, 0, .5, 0),
      P(cyl(.135, .15, .14, 12).scale(1, 1, .66), skin, 0, .1, 0), P(box(.15, .6, .035), top, 0, .3, .1, 0, .45), P(box(.2, .8, .03), top, -.09, .12, -.125),
      P(cyl(.165, .31, .94, 14).scale(1, 1, .82), top, 0, -.43, 0), P(cyl(.313, .317, .09, 14).scale(1, 1, .82), border, 0, -.855, 0)], body);
  } else {
    part([...head, C(P(cyl(.185, .165, .5, 12).scale(1, 1, .62), top, 0, .26, 0)), C(P(sph(.2, 12, 6).scale(1, .33, .62), top, 0, .5, 0)), P(cyl(.166, .16, .16, 12).scale(1, 1, .62), bottom, 0, -.04, 0)], body);
  }
  const arm = sx => part([C(P(cyl(.056, .05, woman ? .14 : .26, 8), woman ? blouse : top, 0, woman ? -.07 : -.13, 0)), ...(woman ? [P(cyl(.046, .043, .14, 8), skin, 0, -.2, 0)] : []),
    (full ? C : (e => e))(P(cyl(.043, .037, .28, 8), full ? top : skin, 0, -.4, .025, -.18)), P(sph(.045, 8, 6), skin, 0, -.56, .05)], body, sx * sh, .49, 0);
  const armL = arm(-1), armR = arm(1); armL.rotation.z = -.07; armR.rotation.z = .07;
  let legL, legR, shinL, shinR;
  if (woman) { legL = part([P(box(.08, .06, .2), shoe)], g, -.08, .03, .04); legR = part([P(box(.08, .06, .2), shoe)], g, .08, .03, .04); }
  else {
    const leg = sx => { const t = part([P(cyl(.086, .068, .46, 8), bottom, 0, -.23, 0)], g, sx * .09, .9, 0), k = part([P(cyl(.064, .05, .42, 8), bottom, 0, -.21, 0), P(box(.095, .07, .25), shoe, 0, -.445, .045)], t, 0, -.45, 0); return [t, k]; };
    [legL, shinL] = leg(-1); [legR, shinR] = leg(1);
  }
  return { g, body, armL, armR, legL, legR, shinL, shinR, saree: woman, ph: Math.random() * 6 };
}

export function animate(r, speed, dt) {
  const run = Math.min(1, Math.max(0, (speed - 2.2) / 6)), on = Math.min(1, speed);
  r.ph += dt * speed * (4.4 - 1.9 * run);
  const s = Math.sin(r.ph), c = Math.cos(r.ph);
  if (r.saree) { r.legL.position.z = .04 + s * .13 * on; r.legR.position.z = .04 - s * .13 * on; r.armL.rotation.x = s * .25 * on; r.armR.rotation.x = -s * .25 * on; r.body.rotation.z = s * .025 * on; return; }
  const A = (.42 + .5 * run) * on, K = (.75 + .75 * run) * on, Cc = (.32 + .8 * run) * on;
  r.legL.rotation.x = -s * A; r.legR.rotation.x = s * A; r.shinL.rotation.x = Math.max(0, c) * K + .04; r.shinR.rotation.x = Math.max(0, -c) * K + .04;
  r.armL.rotation.x = s * Cc - run * .2; r.armR.rotation.x = -s * Cc - run * .2;
  r.body.rotation.x = .03 + run * .16; r.body.position.y = .9 + Math.abs(c) * .03 * on * (1 + run) - run * .03;
}

// one merged geometry of a standing or sitting person (for hawkers and shop customers)
export function bake(o, pose, ph = 0) {
  const r = makeFigure(o);
  r.armL.rotation.x = -.45; r.armR.rotation.x = -.3;
  if (pose === 'tea' || pose === 'teasit') { // a clay cup of cha raised in the right hand
    r.armL.rotation.x = -2.2; r.armL.rotation.z = .45; r.body.rotation.x = -.04;
    const cup = new THREE.Mesh(P(cyl(.042, .03, .08, 8), '#a8623c', 0, -.6, .07), MAT); r.armL.add(cup);
    if (pose === 'teasit' && !r.saree) { r.legL.rotation.x = r.legR.rotation.x = -1.45; r.shinL.rotation.x = r.shinR.rotation.x = 1.4; r.g.position.y = -.42; }
  }
  if (!r.saree) {
    if (pose === 'pull') { r.ph = ph; animate(r, 2.6, 0); r.armL.rotation.x = r.armR.rotation.x = .12; r.body.rotation.x = .2; }
    if (pose === 'bat') { r.armL.rotation.x = r.armR.rotation.x = -.75; r.armL.rotation.z = .3; r.armR.rotation.z = -.3; r.body.rotation.x = .25; r.legL.rotation.x = -.2; r.legR.rotation.x = .2; }
    if (pose === 'bowl') { r.armR.rotation.x = -2.9; r.armL.rotation.x = -.9; r.legL.rotation.x = -.6; r.legR.rotation.x = .5; r.shinR.rotation.x = .7; r.body.rotation.x = .15; }
  }
  if (pose === 'ride') { r.legL.rotation.x = r.legR.rotation.x = -1.2; r.shinL.rotation.x = r.shinR.rotation.x = 1.35; r.armL.rotation.x = r.armR.rotation.x = -1.2; r.armL.rotation.z = -.12; r.armR.rotation.z = .12; r.body.rotation.x = .16; r.g.position.y = -.3; } // astride a motorbike, hands on the bars
  if (pose === 'sit' && !r.saree) { r.legL.rotation.x = r.legR.rotation.x = -1.45; r.shinL.rotation.x = r.shinR.rotation.x = 1.4; r.g.position.y = -.42; }
  r.g.updateMatrixWorld(true); const list = [];
  r.g.traverse(m => { if (m.isMesh) { const g = m.geometry.clone(); g.applyMatrix4(m.matrixWorld); list.push(g); } });
  return mergeGeometries(list);
}

const SK = ['#8d5a3b', '#a36f48', '#7a4a2e', '#b98358', '#6e4329', '#9a6846'], SHIRT = ['#e9e4d8', '#b9c7d6', '#b8432e', '#3f6e8c', '#d6b24a', '#5d7a4a', '#f0f0f0', '#7b4b8a', '#c9c2b0', '#2f4a6b'],
  PANT = ['#2b2b30', '#3d3a33', '#283044', '#5a5148', '#e8e4da', '#4a3b2c'], SAREE = [['#c0392b', '#d4af37'], ['#e0a526', '#8e2f2f'], ['#1f7a5c', '#d4af37'], ['#8e2f6b', '#e6c35a'], ['#2a4d9b', '#d9d9d9'], ['#efe9dc', '#b3261e'], ['#efe9dc', '#b3261e'], ['#d35400', '#3a5a2a'], ['#3b8a8a', '#e6c35a']];
export function look(rnd = Math.random, woman = rnd() < .42) {
  const p = a => a[(rnd() * a.length) | 0], skin = p(SK), hair = rnd() < .15 ? '#8a8580' : '#17110d';
  if (woman) { const [top, border] = p(SAREE); return { woman: true, skin, hair, top, border, blouse: p(['#7a1f2a', '#1f3d5a', '#2a2a2a', '#b3261e', '#3a5a2a']), s: .9 + rnd() * .07 }; }
  return { skin, hair, top: p(SHIRT), bottom: p(PANT), full: rnd() < .35, s: .94 + rnd() * .1 };
}
