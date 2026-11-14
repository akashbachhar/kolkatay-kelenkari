// A racehorse with its jockey, built from shaped parts (x forward). Legs are jointed: shoulder/hip and knee/hock, with a gallop cycle.
import * as THREE from 'three';
import { Kit, M, PI } from './kit.js';
import { bake, MAT } from './human.js';

const limb = (a, b, ra, rb, zs = 1, seg = 10) => { // a tapered, rounded segment from a to b in the x-y plane
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
  return new THREE.CylinderGeometry(rb, ra, L, seg).scale(1, 1, zs).rotateZ(Math.atan2(-dx, dy)).translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0);
};
const ball = (r, x, y, z = 0, sx = 1, sy = 1, sz = 1) => new THREE.SphereGeometry(r, 12, 9).scale(sx, sy, sz).translate(x, y, z);

export function makeHorse(coat, silk, no) {
  const k = new Kit(), Dk = M.dark, Y = 1.46;
  // barrel: a lathe along the spine, deeper at the girth, narrowing to the flank
  k.add(coat, new THREE.LatheGeometry([[0, -1.08], [.2, -1.05], [.33, -.86], [.37, -.55], [.4, -.15], [.41, .25], [.37, .55], [.3, .76], [.16, .86], [0, .88]].map(([r, x]) => new THREE.Vector2(r, x)), 14).rotateZ(-PI / 2).scale(1, 1, .76), 0, Y, 0);
  k.add(coat, ball(.4, -.7, Y + .05, 0, 1.05, 1.02, .84)); k.add(coat, ball(.36, .56, Y - .02, 0, .9, 1.08, .8)); // quarters, shoulders
  k.add(coat, limb([.62, Y + .12], [1.26, 2.28], .27, .145, .62)); k.add(coat, ball(.2, .7, Y + .22, 0, 1.2, 1, .7)); // neck, crest
  k.add(coat, limb([1.24, 2.3], [1.72, 1.98], .15, .085, .78)); k.add(coat, ball(.135, 1.33, 2.22, 0, 1.1, 1.15, .82)); k.add(coat, ball(.088, 1.74, 1.965, 0, 1, .95, .9)); // head, cheek, muzzle
  for (const s of [-1, 1]) { k.add(Dk, ball(.026, 1.44, 2.27, s * .1)); k.add(Dk, ball(.016, 1.8, 1.975, s * .045)); k.add(coat, new THREE.ConeGeometry(.045, .17, 6).scale(1, 1, .6), 1.24, 2.43, s * .075, 0, 0, .25); }
  for (let i = 0; i < 9; i++) { const f = i / 8, x = .7 + f * .56, y = Y + .34 + f * .66; k.add(Dk, new THREE.BoxGeometry(.13, .12, .035), x - .04, y + .03, 0, 0, 0, .9); } // mane
  k.add(Dk, new THREE.BoxGeometry(.1, .1, .03), 1.32, 2.38, 0, 0, 0, -.6); // forelock
  // tack: saddle cloth with the number, saddle, girth, bridle and reins
  k.add(M.white, new THREE.BoxGeometry(.52, .04, .7), -.02, Y + .385, 0); k.sign(String(no), .3, .22, -.02, Y + .2, .325, 0, '#f4f1e8', '#141414'); k.sign(String(no), .3, .22, -.02, Y + .2, -.325, PI, '#f4f1e8', '#141414');
  k.add(M.seatr, ball(.2, .02, Y + .43, 0, 1.25, .28, .7)); k.add(Dk, new THREE.TorusGeometry(.4, .018, 5, 18).rotateY(PI / 2).scale(1, 1.02, .77), .16, Y, 0);
  k.beam(Dk, [1.36, 2.28, .12], [1.7, 2.02, .08], .012); k.beam(Dk, [1.36, 2.28, -.12], [1.7, 2.02, -.08], .012); k.beam(Dk, [1.56, 2.14, .1], [1.56, 2.14, -.1], .012);
  for (const s of [-1, 1]) { k.beam(Dk, [1.7, 2.0, s * .08], [.5, Y + .72, s * .1], .01); k.beam(M.steel, [.05, Y + .3, s * .31], [.1, Y - .08, s * .33], .012); }
  const g = k.build();
  // the jockey, crouched over the withers in racing silks and a cap
  const jg = bake({ top: '#' + silk.color.getHexString(), bottom: '#f1efe8', shoe: '#1a1410', full: true, skin: '#9a6846', hair: '#' + silk.color.getHexString(), s: .86 }, 'ride').rotateY(PI / 2).rotateZ(-.38).translate(.2, Y + .08, 0);
  const jk = new THREE.Mesh(jg, MAT); jk.castShadow = true; g.add(jk);
  // legs
  const seg = (geos, hoof) => { const kk = new Kit(); for (const q of geos) kk.add(coat, q); if (hoof) kk.add(Dk, hoof); return kk.build(); };
  const legs = [[.56, .15, 1], [.56, -.15, 1], [-.72, .16, 0], [-.72, -.16, 0]].map(([x, z, front]) => {
    const up = new THREE.Group(), low = new THREE.Group(); up.position.set(x, front ? 1.2 : 1.28, z);
    if (front) { up.add(seg([limb([0, .08], [0, -.52], .115, .062, .8), ball(.07, 0, -.52, 0, 1, 1, .9)])); low.position.set(0, -.52, 0); low.add(seg([limb([0, 0], [0, -.46], .05, .04), ball(.052, 0, -.47)], new THREE.CylinderGeometry(.058, .072, .11, 8).translate(.012, -.56, 0))); }
    else { up.add(seg([limb([0, .12], [-.14, -.5], .17, .075, .72), ball(.072, -.14, -.5, 0, 1, 1, .9)])); low.position.set(-.14, -.5, 0); low.add(seg([limb([0, 0], [.1, -.52], .052, .04), ball(.052, .1, -.53)], new THREE.CylinderGeometry(.058, .072, .11, 8).translate(.112, -.62, 0))); }
    up.add(low); g.add(up); return { up, low, front };
  });
  const tail = new THREE.Group(); tail.position.set(-1.05, Y + .16, 0); { const kk = new Kit(); kk.add(Dk, limb([0, 0], [-.3, -.1], .06, .07, .8)); kk.add(Dk, limb([-.3, -.1], [-.62, -.62], .075, .02, .8)); tail.add(kk.build()); } g.add(tail);
  g.traverse(m => { if (m.isMesh) m.castShadow = true; });
  // gallop: the hind pair drive, then the fore pair reach; knees and hocks fold as each leg swings forward
  const pose = ph => {
    legs.forEach((l, i) => { const p = ph + (l.front ? 0 : 2.5) + (i % 2) * .55, s = Math.sin(p), c = Math.cos(p);
      l.up.rotation.z = l.front ? s * .78 + .05 : s * .62 + .1; l.low.rotation.z = l.front ? -Math.max(0, c) * 1.35 : -Math.max(0, c) * .95 + .12; });
    tail.rotation.z = -.55 + Math.sin(ph) * .12; g.rotation.z = Math.sin(ph + .6) * .035;
  };
  pose(0);
  return { g, pose };
}
