import * as THREE from 'three';
import { Kit, M, PI, R, rr, pick } from './kit.js';
import { ll, bankX, BRIDGE as B, ROADS, RIVER_W, WATER_Y } from './data.js';
import { addBox, addCirc } from './collide.js';
import { buildMore } from './landmarks2.js';

export const LM = [];      // discoverable places {n, bn, x, z, r}
export const clears = [];  // keep-out rectangles for filler buildings
export const trees = [];   // [x, z, scale]
export const roams = [], GH = {}, anims = []; // wander areas, ghat frames, per-frame animations
export const folk = [];    // standing people: {x, z, ry, woman, pose, o}

const V2 = (a) => a.map(p => new THREE.Vector2(p[0], p[1]));

export function buildLandmarks(scene) {
  function site(n, bn, pos, ry, r, fn) {
    const [x, z] = pos, k = new Kit(), cs = Math.cos(ry), sn = Math.sin(ry);
    const W = (lx, lz) => [x + lx * cs + lz * sn, z - lx * sn + lz * cs];
    const c = {
      W,
      roam: (w, d, ox = 0, oz = 0, n = 6, o) => { const p = W(ox, oz); roams.push({ x: p[0], z: p[1], hw: w / 2, hd: d / 2, c: cs, s: sn, n, o }); },
      box: (lx, lz, w, d, h = 60, r2 = 0) => { const p = W(lx, lz); addBox(p[0], p[1], w, d, ry + r2, h); },
      circ: (lx, lz, rad, h = 60) => { const p = W(lx, lz); addCirc(p[0], p[1], rad, h); },
      clear: (w, d, ox = 0, oz = 0) => { const p = W(ox, oz); clears.push({ x: p[0], z: p[1], hw: w / 2, hd: d / 2, c: cs, s: sn }); },
      tree: (lx, lz, s = 1) => trees.push([...W(lx, lz), s]),
      person: (lx, lz, r2 = 0, woman, pose, o, y = 0) => { const p = W(lx, lz); folk.push({ x: p[0], z: p[1], y, ry: ry + r2, woman, pose, o }); },
    };
    fn(k, c);
    const g = k.build(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
    if (n) LM.push({ n, bn, x, z, r });
  }
  // classical portico projecting from a facade at (x, z) towards +z
  const portico = (k, mat, x, z, w, n, h, y0, dep = 5) => {
    k.box(mat, w + 2, y0, dep + 2, x, 0, z + dep / 2);
    k.cols(mat, x - w / 2 + 1, z + dep, x + w / 2 - 1, z + dep, n, Math.max(.45, h / 15), h, y0);
    k.box(mat, w + 1, h * .16, dep + 1.5, x, y0 + h, z + dep / 2); k.box(mat, w * .8, h * .13, dep, x, y0 + h * 1.16, z + dep / 2);
  };
  // a hawker's stall: table, umbrella, goods and the hawker behind it. Faces local +z when r = 0.
  const UM = () => pick([M.red, M.blue, M.yellow, M.green, M.orange, M.pink, M.white]);
  const stall = (k, c, x, z, r = 0, kind = pick(['fruit', 'cloth', 'phuchka', 'tea', 'bag', 'fruit', 'cloth'])) => {
    const cs = Math.cos(r), sn = Math.sin(r), at = (lx, lz) => [x + lx * cs + lz * sn, z - lx * sn + lz * cs];
    k.box(M.wood, 2.4, .85, 1.1, x, 0, z, r); k.cyl(M.steel, .035, .035, 2.7, ...at(-1, -.7).flatMap((v, i) => i ? [0, v] : [v]), 5); k.cone(UM(), 1.9, .55, at(-1, -.7)[0], 2.5, at(-1, -.7)[1], 10);
    if (kind === 'fruit') for (let i = 0; i < 12; i++) { const p = at(-.95 + (i % 6) * .38, -.25 + (i / 6 | 0) * .45); k.dome(pick([M.orange, M.yellow, M.lime, M.red, M.orange]), .2, p[0], .85, p[1], .8, 8); }
    else if (kind === 'cloth' || kind === 'bag') { const a = at(-1.2, -.55), b = at(1.2, -.55); k.beam(M.steel, [a[0], 2.1, a[1]], [b[0], 2.1, b[1]], .05); k.cyl(M.steel, .03, .03, 2.1, b[0], 0, b[1], 5);
      for (let i = 0; i < 6; i++) { const p = at(-1 + i * .4, -.55); kind === 'bag' ? k.box(pick([M.wood, M.dark, M.red, M.blue]), .3, .4, .14, p[0], 1.6, p[1], r) : k.box(pick([M.red, M.yellow, M.blue, M.pink, M.green, M.white, M.orange]), .34, 1, .05, p[0], 1.05, p[1], r); }
      for (let i = 0; i < 4; i++) { const p = at(-.8 + i * .55, .05); k.box(pick([M.pink, M.blue, M.yellow, M.white, M.lime]), .45, .12 + R() * .15, .7, p[0], .85, p[1], r); } }
    else if (kind === 'phuchka') { const p = at(0, 0); k.cyl(M.thatch, .55, .4, .5, p[0], .85, p[1], 12); k.dome(M.cream, .5, p[0], 1.3, p[1], .55, 10); const q = at(.85, .1); k.cyl(M.steel, .2, .17, .3, q[0], .85, q[1], 10); k.box(M.red, 2.2, .5, .05, at(0, .56)[0], .25, at(0, .56)[1], r); }
    else { const p = at(-.5, 0); k.cyl(M.steel, .22, .26, .34, p[0], .85, p[1], 10); k.cone(M.steel, .16, .2, p[0], 1.19, p[1], 8); for (let i = 0; i < 7; i++) { const q = at(.1 + (i % 4) * .22, -.15 + (i / 4 | 0) * .25); k.cyl(M.clay, .07, .05, .1, q[0], .85, q[1], 7); } const j = at(.95, -.2); k.cyl(M.glass, .13, .13, .32, j[0], .85, j[1], 8); }
    c.box(x, z, 2.4, 1.1, 2.6, r); c.person(...at(.2, -1), r);
  };
  const fence = (k, c, x1, z1, x2, z2, h = 2.7) => { // masonry plinth, iron railings, pillars
    const L = Math.hypot(x2 - x1, z2 - z1), a = Math.atan2(-(z2 - z1), x2 - x1), mx = (x1 + x2) / 2, mz = (z1 + z2) / 2, n = Math.max(1, Math.round(L / 9));
    k.box(M.stone, L, .8, .7, mx, 0, mz, a); k.box(M.iron, L, .1, .1, mx, h - .3, mz, a); k.box(M.iron, L, .08, .08, mx, 1.1, mz, a);
    k.wins(M.iron, x1, z1, x2, z2, Math.round(L / .6), .07, h - .8, .8, .07);
    for (let i = 0; i <= n; i++) { const px = x1 + (x2 - x1) * i / n, pz = z1 + (z2 - z1) * i / n; k.box(M.white, 1, h + .2, 1, px, 0, pz, a); k.pyr(M.white, 1.25, .6, px, h + .2, pz); }
    c.box(mx, mz, L, .8, h, a);
  };
  const ringTrees = (c, w, d, step = 14, s = 1) => {
    for (let x = -w / 2; x <= w / 2; x += step) if (Math.abs(x) > 13) { c.tree(x, -d / 2, s); c.tree(x, d / 2, s); }
    for (let z = -d / 2 + step; z < d / 2; z += step) { c.tree(-w / 2, z, s); c.tree(w / 2, z, s); }
  };

  // ───────── Victoria Memorial (faces north to the Maidan)
  site('Victoria Memorial', 'ভিক্টোরিয়া মেমোরিয়াল', ll(22.5448, 88.3426), PI, 125, (k, c) => {
    c.clear(232, 252, 0, 10);
    k.box(M.grass, 216, .1, 236, 0, 0, 10); k.box(M.gravel, 12, .14, 236, 0, 0, 10); k.box(M.gravel, 216, .14, 9, 0, 0, 50); k.box(M.gravel, 122, .13, 92, 0, 0, 0);
    for (const s of [-1, 1]) { k.box(M.stone, 60, .25, 64, s * 70, 0, 92); k.box(M.pond, 56, .3, 60, s * 70, 0, 92); c.box(s * 70, 92, 58, 62, 1); }
    const W = M.marble;
    k.box(W, 98, 2, 68, 0, 0, 0); k.box(W, 30, 1, 10, 0, 0, 37);
    k.box(W, 86, 15, 56, 0, 2, 0); k.box(W, 88, 1.2, 58, 0, 17, 0); k.box(W, 36, 10, 36, 0, 17, 0); k.box(W, 38, 1, 38, 0, 27, 0);
    k.cyl(W, 13.5, 14, 9, 0, 28, 0, 28);
    for (let i = 0; i < 16; i++) { const a = i * PI / 8; k.cyl(W, .55, .6, 8, Math.cos(a) * 14.8, 28, Math.sin(a) * 14.8, 8); }
    k.cyl(W, 15.6, 15.6, .9, 0, 36, 0, 28); k.dome(W, 13.5, 0, 36.9, 0, 1.12, 32);
    k.cyl(W, 2.2, 2.7, 4, 0, 51.6, 0); k.dome(W, 2.3, 0, 55.6, 0, 1.1); k.cyl(M.bronze, .25, .9, 3.2, 0, 58, 0); k.dome(M.bronze, .7, 0, 61, 0, 1.4, 8);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * 38, z = sz * 23;
      k.box(W, 13, 24, 13, x, 2, z); k.box(W, 14.2, 1, 14.2, x, 26, z); k.cyl(W, 4.6, 4.8, 3.4, x, 27, z, 8); k.dome(W, 4.6, x, 30.4, z, 1.2, 16); k.cone(W, .35, 2.6, x, 35.8, z);
      k.cyl(W, 2, 2.1, 3, sx * 15, 28, sz * 15, 8); k.dome(W, 2.2, sx * 15, 31, sz * 15, 1.15, 10);
      k.wins(M.glass, x - 4.5, z + sz * 6.55, x + 4.5, z + sz * 6.55, 3, 1.5, 6, 8); k.wins(M.glass, x + sx * 6.55, z - 4.5, x + sx * 6.55, z + 4.5, 3, 1.5, 6, 8);
    }
    for (const s of [-1, 1]) {
      if (s > 0) { k.box(W, 30, 19, 8, 0, 2, 31); k.box(W, 32, 1.2, 9.4, 0, 21, 31); k.box(W, 24, 2.4, 7, 0, 22.2, 31); k.wins(M.dark, -4, 35.05, 4, 35.05, 1, 7.8, 15.4, 2.2, .4); k.cols(W, -13, 35.7, -8, 35.7, 2, .9, 17, 2); k.cols(W, 8, 35.7, 13, 35.7, 2, .9, 17, 2); for (const q of [-11.5, 11.5]) { k.cyl(W, 2, 2.1, 2.6, q, 22.2, 31, 8); k.dome(W, 2.2, q, 24.8, 31, 1.2, 10); } } else { k.cols(W, -13, -34, 13, -34, 8, .87, 13, 2); k.box(W, 29, 2.1, 7.5, 0, 15, -31); k.box(W, 30, 2, 8, 0, 0, -31); }
      k.cols(W, s * 30.5, 29.5, s * 17, 29.5, 6, .7, 11, 2); k.box(W, 16, 1.6, 4, s * 23.7, 13, 29.5);
      k.cols(W, s * 30.5, -29.5, s * 17, -29.5, 6, .7, 11, 2); k.box(W, 16, 1.6, 4, s * 23.7, 13, -29.5);
      k.wins(M.glass, s * 43.05, -15, s * 43.05, 15, 7, 1.8, 6, 6); k.wins(M.glass, s * 30, s * 28.05, s * 17, s * 28.05, 4, 1.6, 5, 5);
    }
    k.box(W, 7, 5, 7, 0, 0, 66); k.cyl(M.bronze, 1.2, 2, 3.6, 0, 5, 66); k.dome(M.bronze, 1, 0, 8.6, 66, 1.3, 10);
    fence(k, c, -108, -108, -108, 128); fence(k, c, 108, -108, 108, 128); // the compound: railings all round, gates north and south
    for (const z of [128, -108]) for (const s of [-1, 1]) {
      fence(k, c, s * 10.5, z, s * 108, z); k.box(W, 2.8, 6.4, 2.8, s * 8.8, 0, z); k.box(W, 3.4, .5, 3.4, s * 8.8, 6.4, z); k.dome(W, 1.6, s * 8.8, 6.9, z); c.box(s * 8.8, z, 2.8, 2.8, 8);
      k.box(M.iron, .12, 3.6, 6, s * 7.3, .2, z + (z > 0 ? -3.2 : 3.2)); k.box(W, 1.8, 1.8, 3.2, s * 12.6, 0, z + (z > 0 ? 3 : -3)); k.dome(M.bronze, .8, s * 12.6, 1.8, z + (z > 0 ? 3 : -3), 1.2, 8);
    }
    k.box(M.cream, 4.4, 3.2, 3, -17, 0, 121); k.box(M.dark, 3, 1.2, .2, -17, 1.2, 119.45); k.sign('TICKETS · টিকিট', 4, .8, -17, 3.7, 119.4, PI, '#1d3b2a', '#f3e9c8'); c.box(-17, 121, 4.4, 3, 4);
    c.roam(24, 74, -19, 87, 6); c.roam(24, 74, 19, 87, 6); c.roam(196, 10, 0, 50, 7);
    for (let i = 0; i < 16; i++) c.person(pick([-1, 1]) * rr(8, 34), rr(44, 122), rr(0, 6), R() < .5);
    k.sign('VICTORIA MEMORIAL HALL\nভিক্টোরিয়া মেমোরিয়াল', 14, 3, -46, 4.6, 128.6, 0, '#1d3b2a', '#f3e9c8');
    c.box(0, 0, 98, 70); c.box(0, 66, 7, 7, 8);
    ringTrees(c, 200, 222, 16, 1.1); for (const s of [-1, 1]) for (let z = -90; z < 40; z += 22) c.tree(s * rr(60, 95), z + 10, 1.2);
    for (const [x, kd] of [[-26, 'phuchka'], [-20, 'tea'], [20, 'phuchka'], [26, 'fruit'], [32, 'phuchka']]) stall(k, c, x, 134, 0, kd);
    c.person(-21, 136.6, PI, true); c.person(24, 136.4, PI); c.person(19, 136.8, PI, true); c.person(-27, 136.5, PI);
  });

  // ───────── Indian Museum (Chowringhee)
  site('Indian Museum', 'ভারতীয় জাদুঘর', ll(22.5579, 88.3518), -PI / 2, 70, (k, c) => {
    c.clear(100, 60, 0, 2); const W = M.white;
    k.box(W, 92, 16, 10, 0, 0, 17); k.box(W, 92, 16, 10, 0, 0, -17); for (const s of [-1, 1]) k.box(W, 10, 16, 24, s * 41, 0, 0);
    k.box(W, 93, 1.2, 45, 0, 16, 0); k.box(M.grass, 72, .2, 24, 0, 0, 0);
    k.box(W, 28, 20, 5, 0, 0, 23); portico(k, W, 0, 25.5, 24, 6, 12.5, 1.8, 5);
    for (const s of [-1, 1]) {
      k.box(W, 31, 1.2, 4, s * 30, 0, 24); k.cols(W, s * 15.5, 25, s * 44.5, 25, 9, .55, 6, 1.2); k.box(W, 31, .9, 4, s * 30, 7.2, 24);
      k.cols(W, s * 15.5, 25, s * 44.5, 25, 9, .5, 6, 8.1); k.box(W, 31, 1, 4.4, s * 30, 14.1, 24);
      k.wins(M.glass, s * 15, 22.05, s * 45, 22.05, 8, 1.7, 4, 2.2); k.wins(M.glass, s * 15, 22.05, s * 45, 22.05, 8, 1.7, 4, 9);
      k.wins(M.glass, s * 46.05, -20, s * 46.05, 20, 9, 1.7, 4, 2.2); k.wins(M.glass, s * 46.05, -20, s * 46.05, 20, 9, 1.7, 4, 9);
    }
    k.sign('INDIAN MUSEUM · ভারতীয় জাদুঘর\nEstd. 1814', 16, 2.6, 0, 16.3, 31.4, 0, '#f1ecdc', '#3a2a1a');
    c.box(0, 1, 92, 50);
  });

  // ───────── Grand Hotel
  site('Grand Hotel', 'গ্র্যান্ড হোটেল', ll(22.5617, 88.3515), -PI / 2, 60, (k, c) => {
    c.clear(102, 50, 0, 3); const W = M.white;
    k.box(W, 96, 17, 34, 0, 0, 0); k.box(W, 98, 1, 36, 0, 17, 0); k.box(W, 60, 3.5, 20, 0, 18, -4); k.box(W, 22, 21.5, 2.5, 0, 0, 17.5);
    k.box(W, 96, .7, 6, 0, 5.2, 20); k.cols(W, -47, 22.4, 47, 22.4, 26, .32, 5.2, 0); k.wins(M.dark, -46, 17.05, 46, 17.05, 22, 3.2, 3.6, .3);
    for (const y of [7.4, 10.8, 14]) { k.wins(M.glass, -46, 17.05, -12, 17.05, 11, 1.5, 2.3, y); k.wins(M.glass, 12, 17.05, 46, 17.05, 11, 1.5, 2.3, y); k.wins(M.glass, -9, 18.8, 9, 18.8, 5, 1.6, 2.3, y); }
    k.box(W, 96.5, .4, 1.2, 0, 6.8, 17.6); k.box(W, 96.5, .4, 1.2, 0, 13.6, 17.6);
    k.sign('GRAND HOTEL', 15, 2.2, 0, 19.2, 18.9, 0, '#f4f1e8', '#7a1f1a'); k.sign('গ্র্যান্ড হোটেল · The Grand Arcade', 14, 1.1, 0, 4.4, 23.1, 0, '#0f3d2e', '#f1e2b0');
    c.box(0, 0, 96, 34); for (let i = 0; i < 26; i += 5) c.circ(-47 + i * 94 / 25, 22.4, .4, 6);
    for (let x = -42; x <= 42; x += 12) stall(k, c, x + 3, 26.5, PI); for (let i = 0; i < 8; i++) c.person(rr(-44, 44), rr(19, 21.5), rr(0, 6), R() < .4);
  });

  // ───────── New Market (S.S. Hogg Market)
  site('New Market', 'নিউ মার্কেট', ll(22.5611, 88.3534), 0, 60, (k, c) => {
    c.clear(74, 62, 0, 6); const Bk = M.brick;
    k.box(Bk, 64, 10, 36, 0, 0, 0); k.prism(M.roofR, 64, 20, 0, 10, 0); k.box(M.cream, 64.6, .8, 36.6, 0, 6.6, 0); k.box(M.cream, 64.6, .6, 36.6, 0, 9.7, 0);
    for (const x of [-22, 0]) { k.box(Bk, 12, 15, 3, x, 0, 18.5); k.prism(M.roofR, 3.4, 8.5, x, 15, 18.5, false); k.box(M.dark, 5, 7, .4, x, 0, 20.1); k.box(M.cream, 2.4, 2.4, .3, x, 10.5, 20.1); }
    k.wins(M.dark, -32, 18.05, 14, 18.05, 11, 2.6, 4.6, .4); k.wins(M.cream, -32, 18.1, 14, 18.1, 11, 1.4, 1.6, 7.2);
    k.box(Bk, 7.5, 27, 7.5, 24, 0, 19); k.box(M.cream, 8.3, .8, 8.3, 24, 18, 19); k.box(M.cream, 8.3, .8, 8.3, 24, 27, 19); k.pyr(M.roofR, 8.6, 8, 24, 27.8, 19);
    k.clock(4.2, 24, 22.6, 22.8, 0); k.clock(4.2, 27.8, 22.6, 19, PI / 2); k.clock(4.2, 20.2, 22.6, 19, -PI / 2);
    for (let x = -30; x <= 16; x += 5.6) stall(k, c, x, 25.5, 0); for (let x = -34; x <= 34; x += 6.2) if (Math.abs(x) > 4) stall(k, c, x, 36.5, PI);
    for (let i = 0; i < 14; i++) c.person(rr(-32, 30), rr(28, 34), rr(0, 6), R() < .55);
    k.sign('S. S. HOGG MARKET\nনিউ মার্কেট · 1874', 12, 2.4, -11, 6, 20.3, 0, '#f1ecdc', '#7a1f1a');
    c.box(0, 0, 64, 39); c.box(24, 19, 7.5, 7.5);
  });

  // ───────── Shaheed Minar
  site('Shaheed Minar', 'শহীদ মিনার', ll(22.5627, 88.3494), 0, 45, (k, c) => {
    const W = M.white; k.cyl(M.stone, 10, 10.5, .8, 0, 0, 0, 20); k.cyl(W, 6, 7, 5, 0, .8, 0, 16); k.cyl(W, 2.7, 3.7, 26, 0, 5.8, 0, 16);
    k.cyl(W, 4.6, 3.2, 1.2, 0, 31, 0, 16); k.cyl(W, 4.6, 4.6, .9, 0, 32.2, 0, 16); k.cyl(W, 2.3, 2.5, 7, 0, 33, 0, 16);
    k.cyl(W, 3.7, 2.6, 1, 0, 39.4, 0, 16); k.cyl(W, 3.7, 3.7, .8, 0, 40.4, 0, 16); k.cyl(W, 2, 2.1, 4.4, 0, 41.2, 0, 12); k.dome(W, 2.3, 0, 45.6, 0, 1.25, 14); k.cone(M.gold, .3, 2.2, 0, 48.4, 0);
    c.circ(0, 0, 7.3); c.clear(24, 24);
  });

  // ───────── Eden Gardens
  site('Eden Gardens', 'ইডেন গার্ডেন্স', ll(22.5642, 88.3431), 0, 85, (k, c) => {
    c.clear(140, 140);
    k.add(M.seat, new THREE.LatheGeometry(V2([[38, 0], [38, 1.6], [56, 17], [58, 17], [58, 0]]), 56));
    k.add(M.tinD, new THREE.LatheGeometry(V2([[45, 24], [60, 21.4], [60, 21], [45, 23.4]]), 56));
    k.cyl(M.grass, 38, 38, .12, 0, 0, 0, 48); k.box(M.cream, 3, .16, 20, 0, 0, 0);
    for (let i = 0; i < 28; i++) { const a = i * PI / 14; k.cyl(M.conc, .5, .5, 21.4, Math.cos(a) * 58.6, 0, Math.sin(a) * 58.6, 6); }
    for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4, x = Math.cos(a) * 66, z = Math.sin(a) * 66; k.cyl(M.steel, .5, .8, 42, x, 0, z, 8); k.box(M.steel, 7, 5, 1, x, 40, z, -a + PI / 2); k.box(M.lamp, 6.4, 4.4, .3, x - Math.cos(a) * .6, 40.3, z - Math.sin(a) * .6, -a + PI / 2); }
    k.sign('EDEN GARDENS · ইডেন গার্ডেন্স', 26, 3, 0, 12, 59.4, 0, '#12356b', '#fff'); k.sign('CRICKET ASSOCIATION OF BENGAL', 22, 2.2, 59.4, 12, 0, PI / 2, '#12356b', '#fff');
    c.circ(0, 0, 59); for (let i = 0; i < 20; i++) { const a = i * PI / 10 + .15; c.tree(Math.cos(a) * 76, Math.sin(a) * 76, 1.1); }
  });

  // ───────── Raj Bhavan
  site('Raj Bhavan', 'রাজভবন', ll(22.568, 88.3478), PI, 75, (k, c) => {
    c.clear(124, 112); k.box(M.grass, 118, .1, 106, 0, 0, 0); k.box(M.gravel, 10, .14, 40, 0, 0, 34);
    const W = M.cream;
    k.box(W, 36, 14, 24, 0, 0, 0); k.box(W, 37, 1, 25, 0, 14, 0); k.cyl(W, 6.4, 6.8, 3, 0, 15, 0, 20); k.dome(M.tin, 6.4, 0, 18, 0, .85, 20); k.cone(M.steel, .2, 3, 0, 23.4, 0);
    portico(k, W, 0, 12, 22, 6, 10, 3.4, 6); k.box(W, 18, 1.7, 9, 0, 0, 23); k.box(W, 14, .9, 5, 0, 0, 29);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      k.box(W, 15, 11, 15, sx * 34, 0, sz * 19); k.box(W, 16, .8, 16, sx * 34, 11, sz * 19); k.box(W, 20, 8, 5.5, sx * 20, 0, sz * 11, -sx * sz * .55);
      k.wins(M.glass, sx * 41.55, sz * 19 - 6, sx * 41.55, sz * 19 + 6, 4, 1.5, 3, 1.6); k.wins(M.glass, sx * 41.55, sz * 19 - 6, sx * 41.55, sz * 19 + 6, 4, 1.5, 3, 6.4);
    }
    for (const s of [-1, 1]) { k.box(M.stone, 1, 1.6, 106, s * 59, 0, 0); k.box(M.stone, 118, 1.6, 1, 0, 0, s * 53); k.box(W, 3, 6, 3, s * 7, 0, 53.5); k.dome(W, 1.8, s * 7, 6, 53.5); }
    k.sign('RAJ BHAVAN · রাজভবন', 9, 1.6, 0, 3.4, 54.2, 0, '#1d3b2a', '#f3e9c8');
    c.box(0, 0, 119, 107, 3); ringTrees(c, 104, 92, 13, 1.1);
  });

  // ───────── B.B.D. Bagh: Writers' Building, Lal Dighi, G.P.O.
  site("Writers' Building", 'মহাকরণ', ll(22.5744, 88.3497), 0, 70, (k, c) => {
    c.clear(124, 40, 0, 3); const Bk = M.brick, W = M.white;
    k.box(Bk, 116, 15, 22, 0, 0, 0); k.box(W, 117, 1, 23, 0, 15, 0); k.box(W, 116.6, .6, 22.6, 0, 7.6, 0);
    k.box(Bk, 26, 19, 6, 0, 0, 12); portico(k, W, 0, 15, 22, 6, 12, 1.5, 3); k.cyl(W, .6, 1, 3.4, 0, 20.5, 16.5); k.dome(W, .7, 0, 23.9, 16.5);
    for (const s of [-1, 1]) {
      k.box(Bk, 15, 17, 5, s * 50, 0, 12); portico(k, W, s * 50, 14.5, 12, 4, 11, 1.5, 2.5);
      k.cols(W, s * 14.5, 11.6, s * 41.5, 11.6, 10, .4, 6.2, 8.2); k.box(W, 28, .5, 1.6, s * 28, 8, 11.6);
      k.wins(M.glass, s * 14, 11.05, s * 42, 11.05, 9, 1.6, 3.8, 2.4); k.wins(M.glass, s * 14, 11.05, s * 42, 11.05, 9, 1.6, 3.6, 9.6);
      for (let i = 0; i < 4; i++) { k.cyl(W, .4, .6, 2.4, s * (12 + i * 11), 16, 10.5); k.dome(W, .5, s * (12 + i * 11), 18.4, 10.5); }
    }
    k.sign("WRITERS' BUILDINGS · মহাকরণ", 14, 1.6, 0, 15.6, 18.6, 0, '#f1ecdc', '#7a1f1a');
    c.box(0, 2, 116, 26); c.box(0, 15, 24, 8);
  });
  site('Lal Dighi', 'লালদীঘি', ll(22.5724, 88.3496), 0, 45, (k, c) => {
    c.clear(66, 66); k.box(M.stone, 60, .35, 60, 0, 0, 0); k.box(M.pond, 54, .4, 54, 0, 0, 0);
    for (const s of [-1, 1]) { k.box(M.steel, 60, .1, .1, 0, 1.1, s * 30); k.box(M.steel, .1, .1, 60, s * 30, 1.1, 0); }
    c.box(0, 0, 60, 60, 1.5);
  });
  site('General Post Office', 'জি.পি.ও.', ll(22.5723, 88.3471), PI / 2, 55, (k, c) => {
    c.clear(60, 64, 0, 6); const W = M.white;
    k.box(W, 52, 14, 34, 0, 0, -2); k.box(W, 53, 1, 35, 0, 14, -2);
    k.cyl(W, 12.5, 13, 1.5, 0, 0, 15, 28); k.cyl(W, 10.5, 10.5, 15, 0, 1.5, 15, 28);
    for (let i = 0; i <= 12; i++) { const a = -PI * .05 + i * PI * 1.1 / 12; k.cyl(W, .7, .8, 11.5, Math.cos(a) * 11.9, 1.5, 15 + Math.sin(a) * 11.9, 10); }
    k.cyl(W, 13, 13, 1.6, 0, 13, 15, 28); k.cyl(W, 9.6, 10, 5, 0, 16.5, 15, 28); k.dome(W, 9.6, 0, 21.5, 15, 1.1, 28); k.cyl(W, 1.3, 1.6, 2.4, 0, 31.9, 15); k.dome(W, 1.3, 0, 34.3, 15, 1.2, 8);
    for (const s of [-1, 1]) { k.cols(W, s * 14, 16, s * 25, 16, 5, .7, 11, 1.5); k.box(W, 13.5, 1.5, 3, s * 19.5, 0, 16); k.box(W, 13.5, 1.6, 3, s * 19.5, 12.5, 16); k.wins(M.glass, s * 26.05, -16, s * 26.05, 12, 7, 1.6, 4, 2); k.wins(M.glass, s * 26.05, -16, s * 26.05, 12, 7, 1.6, 4, 8); }
    k.sign('GENERAL POST OFFICE · কলকাতা জি.পি.ও.', 13, 1.5, 0, 9, 27.8, 0, '#b3261e', '#fff');
    c.box(0, -2, 52, 34); c.circ(0, 15, 13.2);
  });

  // ───────── Calcutta High Court
  site('Calcutta High Court', 'কলকাতা হাইকোর্ট', ll(22.5683, 88.3432), 0, 60, (k, c) => {
    c.clear(86, 46, 0, 3); const Bk = M.brickD, W = M.cream;
    k.box(Bk, 74, 13, 24, 0, 0, 0); k.prism(M.roof, 74, 15, 0, 13, 0); k.box(W, 74.5, .7, 24.5, 0, 6.2, 0); k.box(W, 74.5, .7, 24.5, 0, 12.6, 0);
    k.box(Bk, 11, 38, 11, 0, 0, 9); k.box(W, 12, .9, 12, 0, 24, 9); k.box(W, 12, .9, 12, 0, 38, 9); k.pyr(M.roof, 12, 12, 0, 38.9, 9);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { k.box(Bk, 1.6, 5, 1.6, sx * 5, 39, 9 + sz * 5); k.pyr(M.roof, 1.8, 3.4, sx * 5, 44, 9 + sz * 5); k.box(Bk, 6, 19, 6, sx * 36, 0, sz * 11); k.pyr(M.roof, 6.6, 7, sx * 36, 19, sz * 11); }
    for (const s of [-1, 1]) { k.wins(M.dark, s * 6.5, 12.05, s * 32.5, 12.05, 8, 2.2, 5, .5); k.wins(M.glass, s * 6.5, 12.05, s * 32.5, 12.05, 8, 1.8, 4, 7.6); }
    k.wins(M.glass, -1.2, 14.55, 1.2, 14.55, 1, 3, 9, 12); k.sign('HIGH COURT · CALCUTTA\nকলকাতা হাইকোর্ট', 11, 2.2, 0, 7.5, 14.7, 0, '#f1ecdc', '#3a2a1a');
    c.box(0, 0, 78, 28); c.box(0, 9, 11, 11);
  });

  // ───────── College Street: Coffee House, Presidency, University, Medical College, College Square
  site('Indian Coffee House', 'ইন্ডিয়ান কফি হাউস', ll(22.5762, 88.3645), -PI / 2, 40, (k, c) => {
    c.clear(36, 30); const W = M.cream, Z = 12; // Albert Hall: three weathered storeys, bookshops below, the coffee house up the stairs
    k.box(W, 30, 14.6, 24, 0, 0, 0); k.box(M.white, 31, .6, 25, 0, 14.6, 0); k.box(W, 30, 1.2, .6, 0, 15.2, Z - .3); k.box(W, 10, 2.4, .7, 0, 15.2, Z - .3); k.box(M.white, 11, .4, 1, 0, 17.6, Z - .3);
    k.sign('ALBERT HALL · 1876', 8, 1.1, 0, 16.5, Z + .1, 0, '#e6d6ad', '#5a2a1a');
    const names = ['বইঘর', 'পুস্তক বিপণি', 'BOOK STALL', 'দে বুক স্টোর', 'পাঠ্যপুস্তক', 'OLD & RARE BOOKS'], bg = ['#1f4e8c', '#b3261e', '#f2c118', '#1d6b46', '#5a2d82', '#f4f1e8'];
    for (let i = 0; i < 6; i++) { // six bookshops flanking the stair door
      const x = (i < 3 ? -12.6 + i * 4.2 : 4.2 + (i - 3) * 4.2);
      k.box(M.dark, 3.7, 3, .3, x, .15, Z); k.sign(names[i], 3.8, .85, x, 3.75, Z + .22, 0, bg[i], i === 2 || i === 5 ? '#141414' : '#fff'); k.box(M.wood, 3.4, .8, 1, x, 0, Z + 1.1);
      for (let j = 0; j < 9; j++) k.box(pick([M.red, M.cream, M.blue, M.white, M.sand, M.yellow, M.green]), .34, .25 + R() * .5, .8, x - 1.4 + j * .35, .8, Z + 1.1);
      if (i % 2) c.person(x + .4, Z + .35, 0, false, 'sit');
    }
    k.box(M.dark, 3.2, 3.9, .4, 0, 0, Z); k.box(M.stone, 3.6, .25, 1.2, 0, 0, Z + .6); k.box(M.stone, 3.6, .5, .6, 0, 0, Z + .3);
    k.sign('INDIAN COFFEE HOUSE\nইন্ডিয়ান কফি হাউস · इंडियन कॉफी हाउस', 10, 1.9, 0, 5.75, Z + 1.95, 0, '#f6f2e6', '#b3261e');
    for (const y of [4.8, 9.6]) { // iron-railed balconies and tall shuttered windows
      k.box(M.white, 30.6, .3, 1.9, 0, y - .3, Z + .9); k.box(M.dark, 30.4, .07, .07, 0, y + 1, Z + 1.8); k.box(M.dark, 30.4, .05, .05, 0, y + .5, Z + 1.8); k.wins(M.dark, -15.2, Z + 1.8, 15.2, Z + 1.8, 60, .05, 1, y, .05);
      k.wins(M.dark, -13.5, Z + .05, 13.5, Z + .05, 9, 1.5, 3.3, y); k.wins(M.green, -14.55, Z + .12, 12.45, Z + .12, 9, .72, 2.5, y, .1); k.wins(M.green, -12.45, Z + .12, 14.55, Z + .12, 9, .72, 2.5, y, .1);
      for (const s of [-1, 1]) { k.wins(M.dark, s * 15.05, -10, s * 15.05, 10, 6, 1.4, 3, y); k.wins(M.green, s * 15.1, -11, s * 15.1, 9, 6, .7, 2.4, y, .1); }
    }
    for (let i = 0; i <= 9; i++) k.box(M.white, .4, 9.8, .22, -13.5 + i * 3, 4.6, Z + .05);
    k.box(M.white, 30.4, .45, .5, 0, 4.1, Z + .1); k.box(M.white, 30.4, .45, .5, 0, 9, Z + .1); k.box(M.white, 30.6, .5, .6, 0, 13.9, Z + .1);
    c.person(-1.2, Z + 2.6, PI); c.person(1.4, Z + 3, 2.6, true); c.person(6, Z + 2.8, PI); c.person(-8, Z + 2.9, PI, true);
    c.box(0, .9, 30, 26.4);
  });
  const college = (n, bn, lat, lon, w, txt, cn, mat) => site(n, bn, ll(lat, lon), PI / 2, 45, (k, c) => {
    c.clear(w + 8, 52, 0, 10);
    k.box(mat, w, 13, 20, 0, 0, 0); k.box(M.white, w + 1, 1, 21, 0, 13, 0); k.box(M.grass, w, .1, 16, 0, 0, 24); k.box(M.gravel, 6, .14, 16, 0, 0, 24);
    k.box(mat, w * .36, 16.5, 4, 0, 0, 11); portico(k, M.white, 0, 13, w * .34, cn, 12, 1.6, 4);
    for (const s of [-1, 1]) { k.wins(M.glass, s * w * .2, 10.05, s * w * .49, 10.05, 5, 1.6, 3.6, 2); k.wins(M.glass, s * w * .2, 10.05, s * w * .49, 10.05, 5, 1.6, 3.6, 8); c.tree(s * w * .38, 26, .9); }
    k.sign(txt, Math.min(16, w * .3), 1.8, 0, 14.2, 17.3, 0, '#f1ecdc', '#3a2a1a');
    k.box(M.stone, w, 1.2, .6, 0, 0, 32); c.box(0, 0, w, 22); c.box(0, 15, w * .36, 6);
  });
  college('University of Calcutta', 'কলকাতা বিশ্ববিদ্যালয়', 22.5751, 88.3622, 52, 'UNIVERSITY OF CALCUTTA\nকলকাতা বিশ্ববিদ্যালয়', 8, M.white);
  college('Medical College', 'মেডিক্যাল কলেজ', 22.5734, 88.3618, 62, 'MEDICAL COLLEGE, KOLKATA\nমেডিক্যাল কলেজ', 6, M.white);
  site('College Square', 'কলেজ স্কোয়ার', ll(22.5746, 88.365), 0, 45, (k, c) => {
    c.clear(54, 78); k.box(M.stone, 48, .35, 72, 0, 0, 0); k.box(M.pond, 40, .4, 62, 0, 0, 0);
    for (const s of [-1, 1]) { k.box(M.steel, 40, .1, .1, 0, 1, s * 31); k.box(M.steel, .1, .1, 62, s * 20, 1, 0); }
    c.box(0, 0, 41, 63, 1.5); ringTrees(c, 54, 78, 13, .9);
  });

  // ───────── Sealdah Station
  site('Sealdah Station', 'শিয়ালদহ স্টেশন', ll(22.5678, 88.3714), -PI / 2, 95, (k, c) => {
    c.clear(150, 215, 0, -72); const W = M.cream;
    k.box(W, 130, 12, 26, 0, 0, 0); k.box(M.white, 131, 1, 27, 0, 12, 0); k.box(W, 44, 17, 28, 0, 0, 0); k.box(M.white, 45, 1, 29, 0, 17, 0);
    k.box(M.white, 64, .8, 11, 0, 6, 19); k.cols(M.white, -30, 23.5, 30, 23.5, 9, .45, 6, 0); k.wins(M.dark, -20, 14.05, 20, 14.05, 6, 4.4, 4.6, .3);
    for (const s of [-1, 1]) { k.wins(M.glass, s * 24, 13.05, s * 64, 13.05, 12, 1.8, 3, 1.8); k.wins(M.glass, s * 24, 13.05, s * 64, 13.05, 12, 1.8, 3, 7.4); }
    k.wins(M.glass, -20, 14.05, 20, 14.05, 9, 2.4, 4.4, 8); k.sign('SEALDAH · শিয়ালদহ · सियालदह', 30, 3.4, 0, 13.4, 14.3, 0, '#f2c118', '#141414');
    k.add(M.white, new THREE.CylinderGeometry(1.6, 1.6, .3, 20).rotateX(PI / 2), 0, 19.4, 14.2); k.box(M.conc, 150, .3, 178, 0, 0, -102);
    const cols = [[M.green, M.yellow], [M.blue, M.cream], [M.red, M.cream], [M.green, M.yellow], [M.blue, M.cream]];
    for (let i = 0; i < 5; i++) {
      const x = -56 + i * 28;
      k.box(M.tin, 24, .5, 160, x, 8, -96); k.prism(M.tin, 160, 5, x, 8.4, -96, false); k.cols(M.steel, x - 9, -22, x - 9, -170, 12, .22, 8, 0); k.cols(M.steel, x + 9, -22, x + 9, -170, 12, .22, 8, 0);
      k.box(M.stone, 9, 1.1, 160, x, .3, -96); k.box(M.dark, 5, .2, 164, x + 9.5, .3, -98);
      for (const s of [-.75, .75]) k.box(M.steel, .14, .2, 164, x + 9.5 + s, .5, -98);
      const [a, b] = cols[i], n = 4 + (i % 3);
      for (let j = 0; j < n; j++) { const z = -34 - j * 22.4; k.box(a, 3.1, 3.4, 21.6, x + 9.5, .9, z); k.box(b, 3.16, .8, 21.64, x + 9.5, 1.4, z); k.box(M.glass, 3.2, 1, 19, x + 9.5, 2.5, z); k.box(M.tin, 2.8, .3, 21.4, x + 9.5, 4.3, z); }
    }
    c.box(0, 0, 130, 28); c.box(0, -102, 150, 178);
    for (const x of [-58, -50, -42, 42, 50, 58]) stall(k, c, x, 30, 0, pick(['tea', 'fruit', 'bag'])); for (let i = 0; i < 16; i++) c.person(rr(-40, 40), rr(26, 40), rr(0, 6), R() < .4);
  });

  // ───────── North Kolkata: Nakhoda Masjid, Marble Palace, Jorasanko
  site('Nakhoda Masjid', 'নাখোদা মসজিদ', ll(22.5772, 88.3561), -PI / 2, 45, (k, c) => {
    c.clear(40, 42); const S = M.sand;
    k.box(S, 30, 14, 30, 0, 0, 0); k.box(M.cream, 30.6, .7, 30.6, 0, 14, 0); k.box(S, 13, 21, 4, 0, 0, 15.5); k.box(M.dark, 6, 12, .5, 0, 0, 17.3); k.box(M.cream, 8, .6, .5, 0, 13, 17.4);
    k.cyl(M.cream, 7.4, 7.4, 2.6, 0, 14, -2, 20); k.dome(M.domeG, 7.2, 0, 16.6, -2, 1.25, 22); k.cone(M.gold, .3, 3, 0, 25.6, -2);
    for (const s of [-1, 1]) {
      k.cyl(S, 1.5, 2, 40, s * 13.5, 0, 15, 10); k.cyl(M.cream, 2.6, 1.7, 1, s * 13.5, 28, 15, 10); k.cyl(M.cream, 2.4, 1.6, 1, s * 13.5, 37, 15, 10); k.dome(M.domeG, 1.9, s * 13.5, 40, 15, 1.4, 10); k.cone(M.gold, .2, 2, s * 13.5, 42.6, 15);
      for (const z of [-13.5, 0, 13.5]) { k.cyl(S, .8, .9, 19, s * 15, 0, z, 8); k.dome(M.domeG, 1, s * 15, 19, z, 1.4, 8); }
      k.wins(M.dark, s * 5.5, 15.05, s * 14, 15.05, 2, 2.4, 6, 1); k.wins(M.dark, s * 15.05, -12, s * 15.05, 12, 5, 2.4, 6, 1); k.dome(M.domeG, 2.6, s * 9, 14.6, 8, 1.2, 12);
    }
    k.sign('নাখোদা মসজিদ · NAKHODA MASJID', 10, 1.2, 0, 14.6, 17.6, 0, '#0f3d2e', '#f1e2b0'); c.box(0, 1, 32, 33);
  });
  site('Marble Palace', 'মার্বেল প্যালেস', ll(22.5823, 88.36), 0, 50, (k, c) => {
    c.clear(74, 68, 0, 10); const W = M.marble;
    k.box(M.grass, 68, .1, 62, 0, 0, 10); k.box(M.gravel, 6, .14, 30, 0, 0, 26);
    k.box(W, 44, 12, 22, 0, 0, -8); k.box(W, 45, 1, 23, 0, 12, -8); portico(k, W, 0, 3, 34, 10, 10.5, 1.2, 5);
    for (const s of [-1, 1]) { k.wins(M.green, s * 6, 3.05, s * 21, 3.05, 4, 1.7, 3.4, 2); k.wins(M.green, s * 6, 3.05, s * 21, 3.05, 4, 1.7, 3.2, 7.6); k.wins(M.green, s * 22.05, -17, s * 22.05, 1, 5, 1.7, 3.4, 2); }
    k.cyl(W, 5, 5.2, .7, 0, 0, 24, 20); k.cyl(M.pond, 4.4, 4.4, .8, 0, 0, 24, 20); k.cyl(W, .5, .8, 2.6, 0, 0, 24); k.dome(W, .9, 0, 2.6, 24);
    for (const [x, z] of [[-16, 16], [16, 16], [-16, 32], [16, 32]]) { k.box(W, 1.4, 1.6, 1.4, x, 0, z); k.cyl(W, .3, .5, 1.8, x, 1.6, z); k.dome(W, .4, x, 3.4, z); c.circ(x, z, 1, 4); }
    for (const s of [-1, 1]) { k.box(M.stone, 1, 1.4, 62, s * 34, 0, 10); c.box(s * 34, 10, 1, 62, 2); k.box(M.stone, 28, 1.4, 1, s * 20, 0, 41); c.box(s * 20, 41, 28, 1, 2); c.tree(s * 27, 6); c.tree(s * 27, 34); }
    k.sign('MARBLE PALACE · মার্বেল প্যালেস', 9, 1.3, -12, 2, 41.6, 0, '#1d3b2a', '#f3e9c8'); c.box(0, -6, 46, 27); c.circ(0, 24, 5.3, 2);
  });
  site('Jorasanko Thakurbari', 'জোড়াসাঁকো ঠাকুরবাড়ি', ll(22.5851, 88.3597), 0, 45, (k, c) => {
    c.clear(62, 52, 0, 2); const X = M.redOx;
    k.box(X, 52, 11, 14, 0, 0, -12); for (const s of [-1, 1]) { k.box(X, 13, 11, 26, s * 19.5, 0, 8); k.wins(M.green, s * 14, 21.05, s * 25, 21.05, 3, 1.8, 3, 2); k.wins(M.green, s * 14, 21.05, s * 25, 21.05, 3, 1.8, 3, 7); k.cols(M.white, s * 12.6, -4, s * 12.6, 20, 7, .3, 5, 0); k.cols(M.white, s * 12.6, -4, s * 12.6, 20, 7, .3, 4.6, 5.6); k.box(M.white, 1.2, .5, 26, s * 12.6, 5.2, 8); }
    k.box(M.white, 53, .8, 15, 0, 11, -12); k.cols(M.white, -12, -4.4, 12, -4.4, 8, .3, 5, 0); k.cols(M.white, -12, -4.4, 12, -4.4, 8, .3, 4.6, 5.6); k.box(M.white, 26, .5, 1.2, 0, 5.2, -4.4);
    k.wins(M.green, -11, -4.95, 11, -4.95, 6, 1.8, 3, 1.4); k.wins(M.green, -11, -4.95, 11, -4.95, 6, 1.8, 3, 6.8);
    k.box(M.grass, 24, .1, 22, 0, 0, 8); k.box(M.white, 1.6, 2, 1.6, 0, 0, 10); k.dome(M.bronze, .7, 0, 2.6, 10, 1.4, 10); k.cyl(M.bronze, .7, .8, .6, 0, 2, 10);
    k.sign('জোড়াসাঁকো ঠাকুরবাড়ি\nRabindra Bharati Museum', 10, 2, 0, 11.9, -4.8, 0, '#7a1f1a', '#f1e2b0');
    c.box(0, -12, 52, 14); for (const s of [-1, 1]) c.box(s * 19.5, 8, 13, 26); c.circ(0, 10, 1.2, 4);
  });

  // ───────── Mishti shop on Lenin Sarani
  site('Rosogolla Shop', 'রসগোল্লার দোকান', ll(22.5652, 88.354), 0, 32, (k, c) => {
    c.clear(22, 20, 0, 2); const W = M.cream;
    k.box(W, 16, 7.6, 10, 0, 0, -1); k.box(M.white, 16.6, .5, 10.6, 0, 7.6, -1); k.box(M.dark, 14.4, 3.3, .3, 0, 0, 4); k.box(M.white, .5, 3.4, .5, 0, 0, 4.1);
    k.sign('রসগোল্লা ভাণ্ডার\nROSOGOLLA · SANDESH · MISHTI DOI', 15, 2.1, 0, 4.45, 4.2, 0, '#b3261e', '#fff6d8'); k.wins(M.green, -6.5, 4.05, 6.5, 4.05, 4, 1.3, 1, 6.2, .1);
    k.box(M.red, 15.6, .12, 2.6, 0, 3.35, 5.2); for (let i = -7; i <= 7; i += 2) k.box(M.white, .9, .13, 2.62, i, 3.35, 5.2);
    k.box(M.white, 13.4, 1, 1.3, 0, 0, 5.7); k.box(M.steel, 13.4, .05, 1.34, 0, 1.55, 5.7); for (const x of [-6.65, 0, 6.65]) k.box(M.steel, .06, .55, 1.3, x, 1, 5.7);
    for (let t = 0; t < 6; t++) { const x = -5.5 + t * 2.2; k.box(M.steel, 1.8, .05, 1, x, 1, 5.7);
      for (let i = 0; i < 15; i++) { const px = x - .64 + (i % 5) * .32, pz = 5.4 + (i / 5 | 0) * .3; t % 3 === 1 ? k.box(M.cream, .22, .12, .2, px, 1.05, pz) : t % 3 === 2 ? k.add(M.orange, new THREE.SphereGeometry(.11, 8, 6), px, 1.16, pz) : k.add(M.rosh, new THREE.SphereGeometry(.13, 10, 8), px, 1.18, pz); } }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { k.add(M.clay, new THREE.SphereGeometry(.42, 10, 8).scale(1, .82, 1), s * (7.4 - (i === 2 ? .45 : i * .9)), i === 2 ? 1.02 : .36, 6.9); }
    c.person(-3, 4.7, 0, false, 'stand', { top: '#f4f4f0', bottom: '#e8e4da' }); c.person(3.4, 4.7, 0, false, 'stand', { top: '#f4f4f0' });
    c.person(-2, 7.6, PI, true); c.person(.6, 7.5, PI); c.person(4, 7.8, 2.8, true); c.person(-5.5, 7.5, 3.4);
    c.box(0, -1, 16, 10); c.box(0, 5.7, 13.4, 1.3, 1.6);
  });

  // ───────── Maidan: Fort William, Race Course, Prinsep Ghat, Tipu Sultan Mosque
  site('Fort William', 'ফোর্ট উইলিয়াম', ll(22.5552, 88.3388), 0, 135, (k, c) => {
    c.clear(236, 236);
    for (let i = 0; i < 8; i++) { const a = i * PI / 4, x = Math.cos(a) * 100, z = Math.sin(a) * 100, r2 = Math.atan2(-Math.cos(a), -Math.sin(a)); k.box(M.rampart, 85, 5, 6, x, 0, z, r2); k.box(M.stone, 85, 1, 2, x, 5, z, r2); c.box(x, z, 85, 6, 8, r2); k.cyl(M.rampart, 6, 7, 6.5, Math.cos(a + PI / 8) * 108, 0, Math.sin(a + PI / 8) * 108, 8); c.circ(Math.cos(a + PI / 8) * 108, Math.sin(a + PI / 8) * 108, 7, 8); }
    k.box(M.cream, 5, 9, 14, 101, 0, 0); k.box(M.dark, .6, 5.5, 7, 103.4, 0, 0); k.sign('FORT WILLIAM · ফোর্ট উইলিয়াম\nEASTERN COMMAND — NO ENTRY', 11, 2.2, 104, 7.4, 0, PI / 2, '#1f3d24', '#f3e9c8');
    for (let i = 0; i < 6; i++) { const a = i * PI / 3 + .4, x = Math.cos(a) * 52, z = Math.sin(a) * 52; k.box(M.cream, 36, 8, 11, x, 0, z, -a + PI / 2); k.add(M.roofR, new THREE.BoxGeometry(36, 7, 7), x, 8, z, -a + PI / 2, PI / 4); }
    k.cyl(M.steel, .16, .22, 32, 0, 0, 0, 8); k.box(M.saffron, 6, 1.3, .1, 3.1, 30.6, 0); k.box(M.white, 6, 1.3, .1, 3.1, 29.3, 0); k.box(M.green, 6, 1.3, .1, 3.1, 28, 0);
    for (let i = 0; i < 26; i++) { const a = R() * 7, d = rr(14, 88); c.tree(Math.cos(a) * d, Math.sin(a) * d, 1.1); }
  });
  site('Prinsep Ghat', 'প্রিন্সেপ ঘাট', ll(22.5563, 88.3314), PI / 2, 55, (k, c) => {
    c.clear(54, 50); const W = M.white;
    k.box(M.grass, 50, .1, 46, 0, 0, 0); k.box(M.gravel, 34, .14, 20, 0, 0, 0); k.box(W, 31, 1.2, 15, 0, 0, 0);
    for (const s of [-1, 1]) { k.cols(W, -13.5, s * 5.6, 13.5, s * 5.6, 8, .75, 9, 1.2); k.cols(W, s * 13.5, -2, s * 13.5, 2, 2, .75, 9, 1.2); }
    k.box(W, 31, 2.4, 15, 0, 10.2, 0); k.box(W, 32, .6, 16, 0, 12.6, 0); k.box(W, 22, 1.6, 12, 0, 13.2, 0);
    k.sign('PRINSEP GHAT · প্রিন্সেপ ঘাট', 9, 1.2, 0, 11.4, 7.6, 0, '#f1ecdc', '#3a2a1a');
    for (const s of [-1, 1]) { for (let i = 0; i < 8; i++) c.circ(-13.5 + i * 27 / 7, s * 5.6, .8, 10); c.tree(s * 21, -18); c.tree(s * 21, 18); }
  });
  site('Tipu Sultan Mosque', 'টিপু সুলতান মসজিদ', ll(22.5639, 88.3518), -PI / 2, 35, (k, c) => {
    c.clear(30, 28); const W = M.white;
    k.box(W, 24, 8, 18, 0, 0, 0); k.box(M.domeG, 24.6, .6, 18.6, 0, 8, 0); k.wins(M.dark, -10.5, 9.05, 10.5, 9.05, 5, 2.6, 5, .6); k.wins(M.domeG, -10.5, 9.1, 10.5, 9.1, 5, 3.2, .5, 5.8);
    for (let i = 0; i < 5; i++) for (const z of [-4.5, 4.5]) k.dome(M.domeG, 2, -9 + i * 4.5, 8.6, z, 1.15, 10);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { k.cyl(W, .9, 1, 15, sx * 12, 0, sz * 9, 8); k.cyl(M.domeG, 1.4, .9, .6, sx * 12, 11, sz * 9, 8); k.dome(M.domeG, 1.1, sx * 12, 15, sz * 9, 1.5, 8); }
    k.sign('টিপু সুলতান মসজিদ', 7, 1, 0, 9.3, 9.4, 0, '#0f3d2e', '#f1e2b0'); c.box(0, 0, 25, 19);
  });
  LM.push({ n: 'Maidan', bn: 'ময়দান', x: ll(22.556, 88.3468)[0], z: ll(22.556, 88.3468)[1], r: 90 });

  // ───────── Park Street gateway
  { const a = ll(22.5545, 88.3508), b = ll(22.551, 88.3575), L = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L;
    site('Park Street', 'পার্ক স্ট্রিট', [a[0] + tx * 34, a[1] + tz * 34], Math.atan2(-tx, -tz), 60, (k, c) => {
      for (const s of [-1, 1]) { k.cyl(M.steel, .25, .3, 8, s * 10.5, 0, 0, 8); c.circ(s * 10.5, 0, .4, 8); }
      k.box(M.steel, 21.5, .3, .3, 0, 7.9, 0); k.sign('PARK STREET · পার্ক স্ট্রিট', 16, 1.8, 0, 6.8, .2, 0, '#12356b', '#fff'); k.sign('PARK STREET · পার্ক স্ট্রিট', 16, 1.8, 0, 6.8, -.2, PI, '#12356b', '#fff');
    }); }

  // ───────── Howrah Bridge (Rabindra Setu) — walkable, dead end at the Howrah side
  site('Howrah Bridge', 'হাওড়া ব্রিজ', [B.x, B.z], B.ry, 130, (k, c) => {
    const St = M.steel, h = a => a <= 45 ? 12 + 48 * Math.pow(a / 45, 1.3) : a >= 250 ? 12 + 48 * Math.pow((295 - a) / 45, 1.3) : 26 + 34 * Math.pow(Math.abs((a - 147.5) / 102.5), 1.7);
    const nodes = [0, 11.25, 22.5, 33.75]; for (let i = 0; i <= 20; i++) nodes.push(45 + 10.25 * i); nodes.push(261.25, 272.5, 283.75, 295);
    for (let i = 0; i < nodes.length; i++) {
      const a0 = nodes[i], h0 = h(a0);
      k.beam(St, [a0, 8, -7.5], [a0, 8, 7.5], .6); k.beam(St, [a0, h0, -7.5], [a0, h0, 7.5], .6);
      if (i % 2 === 0 && i < nodes.length - 1) k.beam(St, [a0, h0, -7.5], [nodes[i + 1], h(nodes[i + 1]), 7.5], .35);
      for (const z of [-7.5, 7.5]) {
        k.beam(St, [a0, 8, z], [a0, h0, z], .7); k.beam(St, [a0, .2, z], [a0, 8, z], .28);
        if (i === nodes.length - 1) continue;
        const a1 = nodes[i + 1], h1 = h(a1), up = (a0 < 45 || (a0 >= 147.5 && a0 < 250));
        k.beam(St, [a0, h0, z], [a1, h1, z], 1.3); k.beam(St, [a0, 8, z], [a1, 8, z], 1);
        k.beam(St, up ? [a0, 8, z] : [a0, h0, z], up ? [a1, h1, z] : [a1, 8, z], .6);
      }
    }
    for (const a of [45, 250]) {
      for (const z of [-7.5, 7.5]) { k.box(St, 2.8, 62, 2.8, a, 0, z); c.box(a, z, 3, 3, 62); }
      k.box(St, 3, 3.4, 17.8, a, 58.6, 0); k.box(St, 2.2, 2, 17.8, a, 44, 0); k.beam(St, [a, 46, -7.5], [a, 58.6, 7.5], .6); k.beam(St, [a, 46, 7.5], [a, 58.6, -7.5], .6);
      k.beam(St, [a, 9, -7.5], [a, 16, 0], .7); k.beam(St, [a, 9, 7.5], [a, 16, 0], .7); k.box(M.stone, 12, 9, 28, a, -9, 0);
    }
    k.box(M.asph, 345, 1, 15.4, 167.5, -.96, 0);
    for (const s of [-1, 1]) { k.box(M.conc, 345, 1.2, 3.6, 167.5, -.9, s * 9.5); k.box(St, 345, .12, .12, 167.5, 1.35, s * 11.2); k.box(St, 345, .1, .1, 167.5, .85, s * 11.2); for (let a = -4; a < 340; a += 5.2) k.box(St, .12, 1.1, .12, a, .3, s * 11.2); }
    for (let a = 4; a < 338; a += 12) k.box(M.white, 4, .03, .25, a, .05, 0);
    k.box(M.yellow, .7, 1.3, 22, B.end + 2, .2, 0); for (let i = -4; i <= 4; i++) k.box(M.dark, .74, 1.34, 1.1, B.end + 2, .2, i * 2.4);
    k.sign('হাওড়া — রাস্তা বন্ধ\nHOWRAH SIDE · COMING SOON', 12, 3, B.end + 1.5, 3.4, 0, -PI / 2, '#f2c118', '#141414');
    k.sign('RABINDRA SETU · হাওড়া ব্রিজ · 1943', 12, 1.6, -1.6, 10.4, 0, -PI / 2, '#f1ecdc', '#3a2a1a');
    c.clear(70, 44, 20, 0);
  });
  // Howrah Station across the river (scenery)
  site(null, null, [B.x + B.dx * 395 - .22 * 115, B.z + B.dz * 395 + .975 * 115], PI / 2, 0, (k) => {
    const Bk = M.brick; k.box(Bk, 150, 15, 30, 0, 0, 0); k.prism(M.roofR, 150, 16, 0, 15, 0); k.box(M.cream, 150.6, .8, 30.6, 0, 7.4, 0);
    for (let i = 0; i < 6; i++) { const x = -70 + i * 28; k.box(Bk, 9, 27, 9, x, 0, 13); k.box(M.cream, 9.8, .8, 9.8, x, 20, 13); k.pyr(M.roofR, 10, 8, x, 27, 13); }
    k.wins(M.dark, -60, 15.05, 60, 15.05, 20, 2.6, 5, .5); k.wins(M.cream, -60, 15.05, 60, 15.05, 20, 1.6, 3, 9.4);
    k.sign('HOWRAH · হাওড়া', 26, 3.4, 0, 17, 18.6, 0, '#f2c118', '#141414');
    clears.push({ x: B.x + B.dx * 395 - .22 * 115, z: B.z + B.dz * 395 + .975 * 115, hw: 50, hd: 90, c: 1, s: 0 });
  });

  // ───────── Ghats on the Hooghly
  const ghat = (n, bn, lat, flowers) => {
    const z = ll(lat, 0)[1], x = bankX(z), tx = bankX(z + 20) - bankX(z - 20), L = Math.hypot(tx, 40), nx = -40 / L, nz = tx / L;
    if (n) GH[n] = { x, z, ry: Math.atan2(nx, nz) };
    site(n, bn, [x, z], Math.atan2(nx, nz), 50, (k, c) => {
      c.clear(56, 34, 0, -12); k.box(M.stone, 40, .3, 16, 0, 0, -8);
      for (let i = 0; i < 14; i++) k.box(M.stone, 36, .6, 1.5, 0, -.45 * (i + 1) - .2, .6 + i * 1.4);
      for (const s of [-1, 1]) { k.box(M.cream, 3, 3.4, 3, s * 19, 0, -1.6); k.dome(M.cream, 1.8, s * 19, 3.4, -1.6); c.box(s * 19, -1.6, 3, 3, 6); }
      if (n) k.sign(`${n.toUpperCase()}\n${bn}`, 9, 2, 0, 3.6, -15.8, PI, '#12356b', '#fff'), k.cols(M.steel, -4.3, -15.8, 4.3, -15.8, 2, .12, 4.6, 0);
      if (flowers) for (let i = 0; i < 9; i++) { const fx = -17 + i * 4.2; k.box(M.wood, 3, .7, 2, fx, .3, -9); k.dome(pick([M.saffron, M.yellow, M.saffron, M.red]), 1.1, fx - .5, 1, -9, .6, 8); k.dome(pick([M.yellow, M.saffron]), .9, fx + .8, 1, -8.7, .6, 8); k.box(pick([M.blue, M.tin, M.green]), 3.6, .1, 2.8, fx, 2.6, -9); c.box(fx, -9, 3, 2, 3); }
      for (let i = 0; i < 4; i++) boat(k, pick([-1, 1]) * rr(24, 36), rr(24, 50), rr(0, 3));
    });
  };
  const boat = (k, x, z, ry) => {
    k.add(M.wood, new THREE.SphereGeometry(1, 12, 8).scale(5, .8, 1.2), x, WATER_Y + .05, z, ry);
    k.add(M.thatch, new THREE.CylinderGeometry(.85, .85, 3.2, 10).rotateZ(PI / 2), x, WATER_Y + .5, z, ry);
  };
  ghat('Mullick Ghat Flower Market', 'মল্লিক ঘাট ফুলবাজার', 22.5829, true);
  ghat('Millennium Park', 'মিলেনিয়াম পার্ক', 22.5745);
  ghat('Babughat', 'বাবুঘাট', 22.5676);
  ghat(null, null, 22.5551);
  site(null, null, [0, 0], 0, 0, (k) => { for (let i = 0; i < 22; i++) { const z = rr(-1250, 1150); boat(k, bankX(z) - (R() < .5 ? rr(22, 68) : rr(140, 186)), z, rr(0, 3)); } });
  buildMore({ site, stall, portico, ringTrees, fence, boat, LM, anims, clears });
}
