import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Procedural people: the protagonist, pedestrians, hawkers. Figures face +z.
const PI = Math.PI;
export const MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85 }), cloths = new Map();
let LOW = false;
const cyl = (rt, rb, h, s = 10) => new THREE.CylinderGeometry(rt, rb, h, LOW ? Math.min(s, 7) : s), sph = (r, w = 12, h = 9) => new THREE.SphereGeometry(r, LOW ? Math.min(w, 8) : w, LOW ? Math.min(h, 6) : h), box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
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

const lathe = (pts, seg, zs = 1) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), LOW ? Math.min(seg, 8) : seg).scale(1, 1, zs);
const cap = (r, len, s = 10) => new THREE.CapsuleGeometry(r, len, LOW ? 2 : 4, LOW ? Math.min(s, 6) : s); // a rounded limb, centred, along y
const shade = (c, k) => '#' + new THREE.Color(c).multiplyScalar(k).getHexString();

// A person, built to human proportions (about 1.72 m at s = 1): shaped torso, rounded limbs with elbows and knees, a face, hair, hands, shoes.
export function makeFigure(o = {}) {
  const { skin = '#9a6846', hair = '#17110d', top = '#e9e4d8', bottom = '#26262b', shoe = '#2a1d14', woman = false, border = '#d4af37', blouse = '#7a1f2a', full = false, map = null, s = 1 } = o;
  LOW = !o.hi; // the protagonist gets the finest mesh
  const g = new THREE.Group(), body = new THREE.Group(); body.position.y = .9; g.add(body); g.scale.setScalar(s);
  const part = (list, parent, x = 0, y = 0, z = 0) => {
    const grp = new THREE.Group(); grp.position.set(x, y, z); parent.add(grp);
    const cl = map ? list.filter(e => e.cloth) : [], rest = map ? list.filter(e => !e.cloth) : list;
    const put = (l, m) => { if (!l.length) return; const me = new THREE.Mesh(mergeGeometries(l), m); me.castShadow = true; grp.add(me); };
    put(rest, MAT);
    if (cl.length) { if (!cloths.has(map)) cloths.set(map, new THREE.MeshStandardMaterial({ map, vertexColors: true, roughness: .8 })); put(cl, cloths.get(map)); }
    return grp;
  };
  const lip = shade(skin, .72), dk = '#0c0806', wh = '#f2efe8';
  // head: skull, jaw, nose, ears, eyes with whites, brows, mouth, hair
  const head = [P(cyl(.047, .052, .11, 10), skin, 0, .575, -.004), P(sph(.104, 16, 12).scale(.96, 1.16, 1.06), skin, 0, .722, 0), P(sph(.08, 12, 8).scale(.98, .9, .98), skin, 0, .664, .022),
    P(sph(.017, 8, 6).scale(.95, 1.5, 1.25), skin, 0, .703, .108), P(sph(.013, 6, 5), dk, -.039, .737, .1), P(sph(.013, 6, 5), dk, .039, .737, .1),
    P(box(.046, .008, .012), lip, 0, .664, .099),
    P(new THREE.SphereGeometry(.112, LOW ? 8 : 16, LOW ? 5 : 9, 0, PI * 2, 0, 1.75).scale(1, 1.12, 1.1), hair, 0, .74, -.014, -.3),
    ...(LOW ? [] : [P(sph(.019, 8, 6), wh, -.039, .737, .09), P(sph(.019, 8, 6), wh, .039, .737, .09), P(box(.04, .008, .012), hair, -.04, .763, .098, 0, .1), P(box(.04, .008, .012), hair, .04, .763, .098, 0, -.1),
      P(sph(.024, 8, 6).scale(.45, 1, .75), skin, -.101, .722, .002), P(sph(.024, 8, 6).scale(.45, 1, .75), skin, .101, .722, .002)]),
    ...(o.mous || (!woman && !o.hi && skin.charCodeAt(2) % 3 === 0) ? [P(box(.05, .012, .012), hair, 0, .682, .104)] : []),
    ...(o.cap ? [P(cyl(.118, .122, .07, 12), o.cap, 0, .83, -.005), P(box(.17, .016, .1), '#111111', 0, .8, .12), P(cyl(.118, .118, .02, 12), '#b3261e', 0, .79, -.005)] : [])];
  let sh = .215, armTop = top;
  if (woman) { // saree: blouse, bare midriff, pleated skirt with a border, the pallu over the left shoulder and down the back
    sh = .185; armTop = blouse;
    part([...head, P(sph(.062, 8, 6), hair, 0, .7, -.125), P(sph(.1, 10, 6).scale(1, 1.3, .5), hair, 0, .66, -.06), P(sph(.009, 5, 4), '#b3261e', 0, .765, .104),
      P(lathe([[.118, .2], [.14, .3], [.158, .42], [.15, .5], [.07, .545]], 14, .68), blouse), P(lathe([[.128, .02], [.12, .12], [.118, .2]], 12, .68), skin),
      P(lathe([[.3, -.87], [.305, -.84], [.27, -.6], [.215, -.3], [.165, -.05], [.14, .04]], 16, .8), top), P(lathe([[.303, -.875], [.309, -.8]], 16, .8), border),
      ...[-.1, -.05, 0, .05, .1].map(x => P(box(.012, .78, .012), shade(top, .8), x, -.45, .2 + Math.abs(x) * -.25)),
      P(box(.13, .62, .03), top, .0, .3, .1, 0, .5), P(box(.012, .62, .032), border, -.062, .3, .1, 0, .5), P(box(.2, .82, .028), top, -.1, .1, -.125), P(box(.2, .05, .03), border, -.1, -.3, -.125)], body);
  } else {
    part([...head,
      C(P(lathe([[.172, -.06], [.168, .06], [.156, .16], [.175, .32], [.19, .43], [.165, .5], [.075, .545]], 16, .64), top)), // shirt: hem, waist, chest, shoulders
      C(P(sph(.06, 10, 6).scale(1.1, .75, 1), top, -.172, .462, 0)), C(P(sph(.06, 10, 6).scale(1.1, .75, 1), top, .172, .462, 0)),
      P(cyl(.062, .068, .035, 10), shade(top, .93), 0, .55, .004), P(box(.022, .5, .012), shade(top, .9), 0, .25, .116), // collar, placket
      ...(LOW ? [] : [0, 1, 2, 3].map(i => P(sph(.008, 5, 4), '#d8d4c8', 0, .1 + i * .11, .124)).concat([P(box(.07, .075, .008), shade(top, .92), .085, .35, .112)])),
      P(lathe([[.05, -.2], [.162, -.17], [.168, -.02], [.16, .0]], 12, .64), bottom),
      ...(o.cap ? [P(cyl(.18, .18, .045, 14).scale(1, 1, .66), '#141414', 0, .02, 0), P(box(.045, .04, .012), '#c9a23a', 0, .02, .121)] : [])], body);
  }
  const arm = sx => { // upper arm from the shoulder; the forearm hangs from the elbow
    const slv = woman ? .13 : full ? .28 : .15;
    const up = part([C(P(cap(.05, slv, 10), armTop, 0, -slv / 2 - .01, 0)), ...(slv < .27 ? [P(cap(.042, .27 - slv, 10), skin, 0, -slv - (.27 - slv) / 2, 0)] : []), ...(slv < .27 && !woman ? [C(P(cyl(.056, .056, .012, 10), shade(armTop, .9), 0, -slv - .02, 0))] : [])], body, sx * sh, .485, 0);
    const fore = part([(full ? C : (e => e))(P(cap(.037, .21, 10), full ? armTop : skin, 0, -.125, 0)), ...(full ? [C(P(cyl(.043, .043, .03, 10), shade(armTop, .9), 0, -.245, 0))] : []),
      ...(woman ? [P(cyl(.044, .044, .012, 10), '#d4af37', 0, -.22, 0), P(cyl(.044, .044, .012, 10), '#b3261e', 0, -.2, 0)] : []),
      P(sph(.04, 8, 6).scale(.62, 1.25, 1), skin, 0, -.3, 0), P(sph(.016, 6, 5).scale(1, 1.6, 1), skin, 0, -.29, .04)], up, 0, -.29, 0);
    fore.rotation.x = -.16; return [up, fore];
  };
  const [armL, foreL] = arm(-1), [armR, foreR] = arm(1); armL.rotation.z = -.07; armR.rotation.z = .07;
  const foot = () => [P(sph(.05, 8, 6).scale(.95, .62, 1.9), shoe, 0, -.435, .06), P(box(.09, .022, .245), shade(shoe, .6), 0, -.468, .05)];
  let legL, legR, shinL, shinR;
  if (woman) { const ft = () => [P(sph(.045, 8, 6).scale(.9, .55, 1.9), skin, 0, .0, .06), P(box(.085, .014, .23), shoe, 0, -.024, .05)]; legL = part(ft(), g, -.08, .03, .04); legR = part(ft(), g, .08, .03, .04); }
  else {
    const leg = sx => { const t = part([P(cyl(.084, .064, .46, 10), bottom, 0, -.23, 0), P(sph(.085, 10, 6), bottom, 0, -.02, 0), P(sph(.063, 8, 6), bottom, 0, -.45, 0)], g, sx * .088, .9, 0),
      k = part([P(cyl(.062, .05, .41, 10), bottom, 0, -.205, 0), P(cyl(.053, .053, .02, 10), shade(bottom, .85), 0, -.41, 0), ...foot()], t, 0, -.45, 0); return [t, k]; };
    [legL, shinL] = leg(-1); [legR, shinR] = leg(1);
  }
  return { g, body, armL, armR, foreL, foreR, legL, legR, shinL, shinR, saree: woman, ph: Math.random() * 6 };
}

export function animate(r, speed, dt) {
  const run = Math.min(1, Math.max(0, (speed - 2.2) / 6)), on = Math.min(1, speed);
  r.ph += dt * speed * (4.4 - 1.9 * run);
  const s = Math.sin(r.ph), c = Math.cos(r.ph);
  if (r.saree) { r.legL.position.z = .04 + s * .13 * on; r.legR.position.z = .04 - s * .13 * on; r.armL.rotation.x = s * .25 * on; r.armR.rotation.x = -s * .25 * on; r.body.rotation.z = s * .025 * on; return; }
  const A = (.42 + .5 * run) * on, K = (.75 + .75 * run) * on, Cc = (.32 + .8 * run) * on;
  r.legL.rotation.x = -s * A; r.legR.rotation.x = s * A; r.shinL.rotation.x = Math.max(0, c) * K + .04; r.shinR.rotation.x = Math.max(0, -c) * K + .04;
  r.armL.rotation.x = s * Cc - run * .2; r.armR.rotation.x = -s * Cc - run * .2;
  if (r.foreL) { r.foreL.rotation.x = -.16 - on * (.12 + 1.1 * run) - Math.max(0, s) * (.2 + .3 * run) * on; r.foreR.rotation.x = -.16 - on * (.12 + 1.1 * run) - Math.max(0, -s) * (.2 + .3 * run) * on; } // elbows: a little give when walking, pumping when running
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
