import * as THREE from 'three';
import { Kit, M, PI, R, rr, pick } from './kit.js';
import { ll, ROADS, DAK, RIVER_W, COPS, BUS_ROUTES, PARKED } from './data.js';
import { addBox } from './collide.js';

// Second batch of places: Park Street, the markets, metro entrances, College Street, gully cricket, Dakshineswar.
export function buildMore({ site, stall, portico, ringTrees, fence, LM, anims }) {
  const frame = (name, d) => {
    const p = ROADS.find(r => r.n === name), q = p.p; let acc = 0;
    for (let i = 0; i < q.length - 1; i++) {
      const L = Math.hypot(q[i + 1][0] - q[i][0], q[i + 1][1] - q[i][1]);
      if (d <= acc + L || i === q.length - 2) { const tx = (q[i + 1][0] - q[i][0]) / L, tz = (q[i + 1][1] - q[i][1]) / L, f = d - acc; return { x: q[i][0] + tx * f, z: q[i][1] + tz * f, ry: Math.atan2(-tz, tx), hw: p.w / 2 }; }
      acc += L;
    }
  };
  // a site whose local +x runs along the road; local z is across it
  const onRoad = (n, bn, road, d, r, fn) => { const f = frame(road, d); site(n, bn, [f.x, f.z], f.ry, r, (k, c) => fn(k, c, f.hw)); };

  // a street-front building. face = +1: the front looks towards local +z, -1: towards -z
  const shop = (k, c, cx, cz, face, o) => {
    const { name, w = 18, d = 13, fl = 2, wall = M.cream, bg = '#f4f1e8', fg = '#141414', awn = M.red, sub, tables = 0, blade = true, ppl = 1, lm, goods } = o;
    const H = 5.8 + fl * 3.2, fz = cz + face * d / 2, ry = face > 0 ? 0 : PI, F = v => fz + face * v;
    k.box(wall, w, H, d, cx, 0, cz); k.box(M.white, w + .6, .5, d + .6, cx, H, cz); k.box(M.white, w + .3, .3, d + .3, cx, 5.6, cz);
    k.box(M.glass, w - 2, 3, .3, cx, .4, F(.05)); k.box(M.stone, w - 1.4, .4, .5, cx, 0, F(.1)); k.box(M.wood, 1.9, 2.8, .2, cx, .1, F(.2)); k.box(M.gold, .07, .8, .08, cx + .65, 1.1, F(.33));
    k.box(awn, w - .6, .14, 2.2, cx, 3.5, F(1.1)); k.box(awn, w - .6, .45, .08, cx, 3.12, F(2.2));
    k.sign(sub ? name + '\n' + sub : name, Math.min(w - 1.2, 14), sub ? 1.85 : 1.45, cx, sub ? 4.72 : 4.6, F(.22), ry, bg, fg);
    for (let i = 0; i < fl; i++) { const y = 6.5 + i * 3.2; k.wins(M.glass, cx - w / 2 + .8, F(.05), cx + w / 2 - .8, F(.05), Math.max(2, Math.round(w / 3.6)), 1.5, 2.1, y); k.box(M.white, w + .1, .18, .45, cx, y - .25, fz); }
    if (blade) { const bx = cx - w / 2 + .5; k.box(M.dark, .1, .1, 3.9, bx, 8.3, F(2)); k.sign(name, 3.4, .9, bx + .05, 7.7, F(2.1), PI / 2, bg, fg); k.sign(name, 3.4, .9, bx - .05, 7.7, F(2.1), -PI / 2, bg, fg); }
    for (let i = 0; i < tables; i++) {
      const tx = cx - w / 2 + 2.6 + i * 3.6, tz = F(3.4);
      k.cyl(M.white, .5, .5, .06, tx, .74, tz, 12); k.cyl(M.steel, .05, .05, .74, tx, 0, tz, 6); k.cyl(M.steel, .03, .03, 2.3, tx, 0, tz, 5); k.cone(pick([M.red, M.green, M.white]), 1.3, .4, tx, 2.3, tz, 10);
      for (const s of [-1, 1]) { k.box(M.wood, .45, .45, .45, tx + s * .85, 0, tz); c.person(tx + s * .85, tz, -s * PI / 2, false, 'sit'); }
      c.circ(tx, tz, .6, 1);
    }
    for (let i = 0; i < ppl; i++) c.person(cx + rr(-w / 2 + 2, w / 2 - 2), F(rr(.9, 1.7)), ry + rr(-.6, .6), R() < .45);
    if (goods) for (let i = 0; i < 2; i++) { const gx = cx - w / 4 + i * w / 2; k.box(M.wood, 2.2, .8, .8, gx, 0, F(.75)); for (let j = 0; j < 5; j++) k.box(pick([M.dark, M.steel, M.blue, M.white, M.red]), .3 + R() * .1, .15 + R() * .4, .5, gx - .8 + j * .4, .8, F(.75)); }
    if (lm) { const p = c.W(cx, F(3)); LM.push({ n: lm[0], bn: lm[1], x: p[0], z: p[1], r: lm[2] || 16 }); }
    c.box(cx, cz, w, d);
  };
  const row = (k, c, hw, x0, side, list) => {
    let x = x0;
    for (const o of list) { if (o.gapTo) { x = Math.max(x, o.gapTo); continue; } const w = o.w || 18, d = o.d || 13; shop(k, c, x + w / 2, side * (hw + 4.5 + (o.sb || 0) + d / 2), -side, o); x += w + .6; }
    c.clear(x - x0 + 6, 24, (x + x0) / 2, side * (hw + 14)); return x;
  };

  // ───────── Park Street: restaurants, bars and the bookshop
  onRoad(null, null, 'Park Street', 0, 0, (k, c, hw) => {
    row(k, c, hw, 50, 1, [
      { name: 'OXFORD BOOKSTORE', sub: 'Books · Cha Bar · since 1919', w: 22, bg: '#1d3b2a', fg: '#f3e9c8', awn: M.green, lm: ['Oxford Bookstore', 'অক্সফোর্ড বুকস্টোর'] },
      { name: 'FLURYS', sub: 'Tearoom · Confectionery · 1927', w: 18, sb: 4.5, tables: 3, bg: '#f3d9e0', fg: '#7a1f4a', awn: M.pink, wall: M.white, lm: ['Flurys', 'ফ্লুরিজ'] },
      { name: 'PETER CAT', sub: 'Chelo Kebab · Restaurant & Bar', w: 18, bg: '#141414', fg: '#f2c118', awn: M.dark, lm: ['Peter Cat', 'পিটার ক্যাট'] },
      { name: 'KFC', w: 15, fl: 1, bg: '#f4f1e8', fg: '#7a1f1a', awn: M.white },
      { name: 'TRINCAS', sub: 'Restaurant & Bar · Live Music', w: 18, bg: '#27408f', fg: '#fff', awn: M.blue },
      { name: 'OLYPUB', sub: 'Bar · Steak', w: 13, bg: '#5a2a1a', fg: '#f1e2b0', awn: M.wood, wall: M.redOx },
      { name: 'BAR-B-Q', sub: 'Chinese · Indian · Bar', w: 18, bg: '#b3261e', fg: '#fff', awn: M.red },
      { name: 'KWALITY', sub: 'Restaurant · since 1952', w: 15, bg: '#0f3d2e', fg: '#f1e2b0', awn: M.green },
      { name: 'THE PARK', sub: 'Hotel · Someplace Else Pub', w: 30, d: 16, fl: 6, wall: M.white, bg: '#141414', fg: '#fff', awn: M.dark, ppl: 3 },
    ]);
    row(k, c, hw, 50, -1, [
      { name: "McDonald's", w: 17, fl: 1, bg: '#f4f1e8', fg: '#1d3b2a', awn: M.white },
      { name: 'MOCAMBO', sub: 'Restaurant & Bar · since 1956', w: 20, bg: '#7a1f1a', fg: '#f6e7c0', awn: M.red, ppl: 3, lm: ['Mocambo', 'মোক্যাম্বো'] },
      { name: 'MOULIN ROUGE', sub: 'Restaurant · Bar', w: 16, bg: '#b3261e', fg: '#fff', awn: M.red, wall: M.white },
      { name: 'SILVER GRILL', sub: 'Bar & Restaurant', w: 15, bg: '#3a3a3a', fg: '#e8e8e8', awn: M.dark },
      { name: 'MUSIC WORLD', w: 14, fl: 1, bg: '#f2c118', fg: '#141414', awn: M.yellow },
      { name: 'MAGNOLIA', sub: 'Ice Cream · Restaurant', w: 13, bg: '#f4f1e8', fg: '#27408f', awn: M.blue },
      { gapTo: 186 },
      { name: 'MARCO POLO', sub: 'Multi-cuisine · Bar', w: 18, bg: '#12356b', fg: '#fff', awn: M.blue },
      { name: 'QUEENS MANSION', sub: 'Shops · Offices · Apartments', w: 34, d: 16, fl: 4, wall: M.redOx, bg: '#f1ecdc', fg: '#3a2a1a', awn: M.green, ppl: 3 },
    ]);
  });

  // ───────── Lindsay Street, facing New Market
  onRoad(null, null, 'Lindsay Street', 0, 0, (k, c, hw) => {
    row(k, c, hw, 22, 1, [
      { name: 'SREE LEATHERS', sub: 'Shoes · Bags · Leather Goods', w: 24, fl: 3, bg: '#7a1f1a', fg: '#f6e7c0', awn: M.red, ppl: 4, lm: ['Sree Leathers', 'শ্রীলেদার্স'] },
      { name: 'WOW! MOMO', sub: 'Steamed · Fried · Pan-fried', w: 12, fl: 1, bg: '#f2c118', fg: '#141414', awn: M.yellow, ppl: 3, lm: ['Wow! Momo', 'ওয়াও! মোমো'] },
      { name: 'HOTEL LINDSAY', sub: 'Rooms · Rooftop Restaurant', w: 26, d: 16, fl: 8, wall: M.white, bg: '#12356b', fg: '#fff', awn: M.blue, ppl: 3, lm: ['Hotel Lindsay', 'হোটেল লিন্ডসে', 20] },
      { name: 'GLOBE', sub: 'Cinema', w: 24, fl: 3, wall: M.cream, bg: '#141414', fg: '#f2c118', awn: M.dark },
      { name: 'CITY MART', sub: 'Garments · Sarees', w: 20, bg: '#d8568a', fg: '#fff', awn: M.pink },
    ]);
  });

  // ───────── Chandni Chowk electronics market
  onRoad('Chandni Chowk Electronics Market', 'চাঁদনি চক ইলেকট্রনিক্স বাজার', 'Chittaranjan Avenue', 150, 50, (k, c, hw) => {
    const names = ['RADIO HOUSE', 'চাঁদনি ইলেকট্রনিক্স', 'MOBILE · REPAIR', 'LED · CCTV · CABLE', 'COMPUTER WORLD', 'SOUND & LIGHT', 'টিভি · ফ্রিজ · এসি', 'SPARE PARTS'], bg = ['#12356b', '#b3261e', '#f2c118', '#1d6b46', '#141414', '#5a2d82', '#d9541e', '#f4f1e8'];
    row(k, c, hw, -42, 1, names.map((name, i) => ({ name, w: 10, d: 10, fl: 2, blade: false, goods: true, bg: bg[i], fg: i === 2 || i === 7 ? '#141414' : '#fff', awn: pick([M.blue, M.tin, M.red, M.green]), wall: pick([M.cream, M.white, M.sand]), ppl: 2 })));
    for (const x of [-43.5, 43]) k.cyl(M.steel, .2, .25, 7, x, 0, hw + 4, 8); k.box(M.steel, 87, .3, .3, 0, 7, hw + 4);
    k.sign('CHANDNI CHOWK · চাঁদনি চক · ELECTRONICS MARKET', 30, 1.7, 0, 7.6, hw + 3.8, PI, '#12356b', '#fff');
  });

  // ───────── Metro stations (North-South line). The gates are shut for now.
  const metro = (n, bn, road, d, side) => onRoad(n + ' Metro', bn + ' মেট্রো', road, d, 24, (k, c, hw) => {
    const z0 = side * (hw + 4.7), f = -side, zc = z0 + side * 4.5, ry = f > 0 ? 0 : PI, F = v => z0 + f * v;
    for (const s of [-1, 1]) k.box(M.conc, .5, 3.4, 9, s * 3.6, 0, zc);
    k.box(M.conc, 7.7, 3.4, .5, 0, 0, z0 + side * 9); k.box(M.conc, 8.8, .5, 10.4, 0, 3.4, zc); k.box(M.blue, 8.9, .8, .2, 0, 3.3, F(.72)); k.box(M.dark, 6.7, 3.3, .2, 0, 0, z0 + side * 1.6);
    for (let i = 0; i < 4; i++) k.box(M.stone, 6.7, .25, .5, 0, .75 - i * .25, z0 + side * (.3 + i * .35));
    for (const y of [.15, 3.15]) k.box(M.steel, 6.7, .1, .1, 0, y, z0); k.wins(M.steel, -3.3, z0, 3.3, z0, 20, .06, 3, .15, .06);
    for (let i = 0; i < 10; i++) { const x = -3.3 + i * .66; k.beam(M.steel, [x, .2, z0], [x + .66, 3.1, z0], .04); k.beam(M.steel, [x + .66, .2, z0], [x, 3.1, z0], .04); }
    k.sign('মেট্রো রেলওয়ে · METRO RAILWAY\n' + bn + ' · ' + n.toUpperCase(), 8.4, 1.9, 0, 4.9, F(.6), ry, '#12356b', '#fff');
    k.sign('গেট বন্ধ · GATE CLOSED', 2.8, .7, 0, 1.9, F(.12), ry, '#f2c118', '#141414');
    c.box(0, zc, 7.7, 9.5, 5); c.clear(11, 13, 0, zc);
  });
  metro('Sobhabazar', 'শোভাবাজার', 'Chittaranjan Avenue', 1420, 1);
  metro('Girish Park', 'গিরিশ পার্ক', 'Chittaranjan Avenue', 1195, -1);
  metro('M.G. Road', 'মহাত্মা গান্ধী রোড', 'Chittaranjan Avenue', 945, 1);
  metro('Central', 'সেন্ট্রাল', 'Chittaranjan Avenue', 520, -1);
  metro('Chandni Chowk', 'চাঁদনি চক', 'Chittaranjan Avenue', 236, -1);
  metro('Esplanade', 'এসপ্ল্যানেড', 'Chowringhee Road', 46, 1);
  metro('Park Street', 'পার্ক স্ট্রিট', 'Chowringhee Road', 470, 1);

  // ───────── College Street: Boi Para, the long line of book stalls
  site(null, null, [0, 0], 0, 0, (k, c) => {
    const a = ll(22.57, 88.3626), b = ll(22.5783, 88.3641), L = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L, ry = Math.atan2(-tz, tx);
    const names = ['বইঘর', 'দাশগুপ্ত', 'OLD BOOKS', 'পাঠ্যপুস্তক', 'চক্রবর্তী চ্যাটার্জি', 'NOTES · GUIDES', 'সাহিত্য', 'RARE BOOKS', 'দে বুক স্টল', 'MEDICAL BOOKS'], bg = ['#1f4e8c', '#b3261e', '#f2c118', '#1d6b46', '#5a2d82', '#f4f1e8'];
    let n = 0;
    for (let d = L * .08; d < L * .97; d += 5.5) for (const s of [-1, 1]) {
      if ((s > 0 ? [333, 257, 172] : [313]).some(g => Math.abs(d - g) < 7) || R() < .06) continue;
      const P = (o, l = 0) => [a[0] + tx * (d + l) + tz * s * o, a[1] + tz * (d + l) - tx * s * o], fr = Math.atan2(-tz * s, tx * s), [rx, rz] = P(11.25), [cx, cz] = P(10.25);
      k.box(M.books, 5, 2.4, .45, rx, 0, rz, ry); k.box(M.wood, 5, .85, 1, cx, 0, cz, ry);
      for (let i = 0; i < 9; i++) { const q = P(10.25, -2.1 + i * .52); k.box(pick([M.red, M.cream, M.blue, M.white, M.sand, M.yellow, M.green]), .44, .12 + R() * .5, .8, q[0], .85, q[1], ry); }
      const aw = P(10.4); k.box(pick([M.blue, M.tin, M.yellow, M.green, M.red, M.tin]), 5.3, .1, 2.4, aw[0], 2.55, aw[1], ry);
      if (n++ % 3 === 0) { const i = n % bg.length, q = P(11); k.sign(names[n % names.length], 3.6, .7, q[0], 2.95, q[1], fr, bg[i], i === 2 || i === 5 ? '#141414' : '#fff'); }
      if (n % 2) { const q = P(10.3, 2.85); c.person(q[0], q[1], fr, false, 'sit'); }
      if (n % 4 === 1) { const q = P(8.9, rr(-1.5, 1.5)); c.person(q[0], q[1], fr + PI, R() < .5); }
      addBox(...P(10.7), 5, 1.6, ry, 2.7);
    }
  });

  // ───────── Presidency University (the old Presidency College)
  site('Presidency University', 'প্রেসিডেন্সি', ll(22.5766, 88.3625), PI / 2, 45, (k, c) => {
    c.clear(84, 60, 0, 12); const W = M.cream;
    k.box(M.grass, 78, .1, 24, 0, 0, 19); k.box(M.gravel, 7, .14, 24, 0, 0, 19);
    k.box(W, 72, 13, 16, 0, 0, -4); k.box(M.white, 73, .9, 17, 0, 13, -4); k.box(M.white, 72.4, .5, 4, 0, 6.5, 5.6);
    for (const s of [-1, 1]) { // two-storey colonnaded verandahs
      k.cols(M.white, s * 11, 7.2, s * 35, 7.2, 9, .42, 5.6, .9); k.cols(M.white, s * 11, 7.2, s * 35, 7.2, 9, .38, 5.4, 7); k.box(W, 25, .9, 4, s * 23, 0, 5.6); k.box(M.white, 25.4, .7, 4.4, s * 23, 12.4, 5.6);
      k.wins(M.green, s * 11, 4.05, s * 35, 4.05, 8, 1.5, 3.2, 1.4); k.wins(M.green, s * 11, 4.05, s * 35, 4.05, 8, 1.5, 3.2, 7.6); k.wins(M.green, s * 36.05, -10, s * 36.05, 2, 4, 1.5, 3, 7.6);
    }
    k.box(W, 20, 15, 6, 0, 0, 5); portico(k, M.white, 0, 8, 18, 6, 11.4, 2, 5); k.gable(M.white, 21, 4.2, 6, 0, 15.2, 10.6); k.clock(2.3, 0, 16.8, 13.65);
    for (let i = 0; i < 5; i++) k.box(M.stone, 12, 2 - i * .4, 1, 0, 0, 14.6 + i);
    k.sign('PRESIDENCY UNIVERSITY · Estd. 1817', 13, 1.2, 0, 14.3, 13.4, 0, '#f1ecdc', '#3a2a1a');
    fence(k, c, -39, 31, -5.2, 31); fence(k, c, 5.2, 31, 39, 31);
    for (const s of [-1, 1]) { k.box(W, 1.7, 5.6, 1.7, s * 4.4, 0, 31); c.box(s * 4.4, 31, 1.7, 1.7, 7); k.box(M.iron, .1, 3.2, 3.6, s * 3.6, .2, 29); }
    k.box(W, 11, 1.1, 1.3, 0, 5.6, 31); k.sign('প্রেসিডেন্সি বিশ্ববিদ্যালয়\nPRESIDENCY UNIVERSITY', 9, 1.9, 0, 7.75, 31, 0, '#7a1f1a', '#f6e7c0'); k.sign('PRESIDENCY UNIVERSITY', 9, 1.2, 0, 7.4, 30.9, PI, '#7a1f1a', '#f6e7c0');
    for (const s of [-1, 1]) { c.tree(s * 22, 22, 1); c.tree(s * 33, 14, .9); }
    c.roam(26, 16, -19, 20, 3); c.roam(26, 16, 19, 20, 3); for (let i = 0; i < 6; i++) c.person(pick([-1, 1]) * rr(6, 30), rr(13, 27), rr(0, 6), R() < .45);
    c.box(0, -4, 72, 16); c.box(0, 6, 72, 4); c.box(0, 12, 20, 9);
  });

  // ───────── St. Paul's Cathedral: Indo-Gothic, with the Canterbury-style central tower
  site("St. Paul's Cathedral", 'সেন্ট পলস ক্যাথিড্রাল', ll(22.5443, 88.346), -PI / 2, 60, (k, c) => {
    c.clear(72, 100, 0, 4); k.box(M.grass, 66, .1, 96, 0, 0, 4); k.box(M.gravel, 7, .14, 16, 0, 0, 44);
    const W = M.white, G = M.glass;
    k.box(W, 17, 15, 58, 0, 0, -2); k.prism(M.roof, 58, 12, 0, 15, -2, false); k.box(W, 17.6, .5, 58.4, 0, 14.6, -2);
    for (const s of [-1, 1]) {
      k.gwins(G, s * 8.55, -28, s * 8.55, 24, 8, 2.3, 8.4, 3.2); k.wins(W, s * 8.75, -31, s * 8.75, 27, 34, .9, .9, 15, .5);
      for (let i = 0; i < 9; i++) { const z = -28 + i * 6.5; k.box(W, 1.4, 13, 1.7, s * 9.3, 0, z); k.box(W, 1, 3.4, 1, s * 9.3, 13, z); k.pyr(W, 1.3, 2.4, s * 9.3, 16.4, z); }
      // transept
      k.gwins(G, s * 22.05, -8.3, s * 22.05, -3.7, 1, 3.6, 9, 2.4); k.gable(W, 12, 4.2, 1, s * 21.6, 13, -6, PI / 2); k.cyl(W, .9, .9, 17, s * 22, 0, -12, 8); k.cyl(W, .9, .9, 17, s * 22, 0, 0, 8); k.cone(W, 1, 3.6, s * 22, 17, -12, 8); k.cone(W, 1, 3.6, s * 22, 17, 0, 8);
    }
    k.box(W, 44, 13, 12, 0, 0, -6); k.prism(M.roof, 44, 8.5, 0, 13, -6);
    // central tower
    k.box(W, 12, 46, 12, 0, 0, -6); k.box(W, 12.8, .6, 12.8, 0, 29.6, -6); k.box(W, 12.8, .7, 12.8, 0, 45.6, -6);
    for (const s of [-1, 1]) { k.gwins(M.dark, -3.6, -6 + s * 6.05, 3.6, -6 + s * 6.05, 2, 2.2, 11, 32.6); k.gwins(M.dark, s * 6.05, -9.6, s * 6.05, -2.4, 2, 2.2, 11, 32.6); k.gwins(G, -3.6, -6 + s * 6.05, 3.6, -6 + s * 6.05, 2, 1.6, 5, 22.5); k.gwins(G, s * 6.05, -9.6, s * 6.05, -2.4, 2, 1.6, 5, 22.5);
      k.wins(W, -5, -6 + s * 6.2, 5, -6 + s * 6.2, 6, .9, 1.1, 46.3, .5); k.wins(W, s * 6.2, -11, s * 6.2, -1, 6, .9, 1.1, 46.3, .5); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { k.cyl(W, 1.25, 1.25, 49, sx * 6, 0, -6 + sz * 6, 8); k.cyl(W, 1.5, 1.5, .5, sx * 6, 49, -6 + sz * 6, 8); k.cone(W, 1.25, 7.5, sx * 6, 49.5, -6 + sz * 6, 8); }
    // west front and porch
    k.box(W, 20, 20, 4, 0, 0, 28); k.gable(W, 20, 6.5, 4, 0, 20, 28); k.gwins(G, -.1, 30.05, .1, 30.05, 1, 6.6, 12.5, 6, .4); for (const x of [-1.1, 1.1]) k.box(W, .25, 9.5, .5, x, 6, 30.2); k.box(W, 6.6, .25, .5, 0, 11, 30.2);
    k.box(W, .4, 3, .4, 0, 26.5, 28); k.box(W, 1.6, .4, .4, 0, 28.2, 28);
    for (const s of [-1, 1]) { k.cyl(W, 1.5, 1.5, 24, s * 10, 0, 29.5, 8); k.cone(W, 1.6, 6.5, s * 10, 24, 29.5, 8); k.gwins(M.dark, s * 9.05, 31.6, s * 9.05, 36.6, 1, 3.6, 6.2, 0, .4); }
    k.box(W, 18, 7.6, 8, 0, 0, 34); k.gwins(M.dark, -7.5, 38.05, 7.5, 38.05, 3, 3.6, 6.2, 0, .4); k.wins(W, -8.6, 37.8, 8.6, 37.8, 9, 1, 1, 7.6, .5);
    k.cyl(W, 8.5, 8.5, 14, 0, 0, -31, 8); k.cone(M.roof, 8.9, 5, 0, 14, -31, 8);
    k.cols(M.steel, -12.6, 47, -5.4, 47, 2, .1, 3, 0); k.sign("ST. PAUL'S CATHEDRAL · 1847\nসেন্ট পলস ক্যাথিড্রাল", 8, 1.8, -9, 2.3, 47, 0, '#1d3b2a', '#f3e9c8');
    c.box(0, -2, 19.5, 60); c.box(0, -6, 45, 13); c.box(0, 34, 18, 8); c.circ(0, -31, 8.6);
    ringTrees(c, 60, 92, 13); c.roam(44, 8, 0, 44, 4); for (let i = 0; i < 5; i++) c.person(rr(-18, 18), rr(40, 48), rr(0, 6), R() < .5);
  });

  // ───────── Birla Planetarium: the white dome modelled on the Sanchi stupa
  site('Birla Planetarium', 'বিড়লা তারামণ্ডল', ll(22.5457, 88.3465), PI / 2, 55, (k, c) => {
    c.clear(62, 66, 0, 2); k.box(M.grass, 58, .1, 62, 0, 0, 2); k.box(M.gravel, 8, .14, 14, 0, 0, 25);
    const W = M.white;
    k.cyl(M.stone, 18.4, 18.8, .9, 0, 0, 0, 40); k.cyl(W, 15, 15, 6.6, 0, .9, 0, 40);
    for (let i = 0; i < 24; i++) { const a = i * PI / 12 + PI / 24; k.cyl(W, .45, .52, 6.2, Math.sin(a) * 16.4, .9, Math.cos(a) * 16.4, 8); k.box(M.glass, 1.7, 3.6, .3, Math.sin(a + PI / 24) * 15.05, 2.3, Math.cos(a + PI / 24) * 15.05, a + PI / 24); }
    k.cyl(W, 17.8, 17.8, .9, 0, 7.1, 0, 40); k.add(W, new THREE.TorusGeometry(17.2, .13, 6, 48).rotateX(PI / 2), 0, 9.1, 0); k.add(W, new THREE.TorusGeometry(17.2, .1, 6, 48).rotateX(PI / 2), 0, 8.55, 0);
    for (let i = 0; i < 40; i++) { const a = i * PI / 20; k.box(W, .3, 1.3, .3, Math.sin(a) * 17.2, 8, Math.cos(a) * 17.2, a); }
    k.cyl(W, 13.4, 13.8, 2.4, 0, 8, 0, 40); k.dome(W, 13.2, 0, 10.4, 0, 1, 36);
    k.box(W, 3.6, 1.5, 3.6, 0, 23.2, 0); k.box(W, 4.3, .3, 4.3, 0, 24.7, 0); k.cyl(M.gold, .13, .13, 4, 0, 25, 0, 6); for (const [r, y] of [[1.6, 26.2], [1.15, 27.2], [.7, 28.1]]) k.cyl(M.gold, r, r, .14, 0, y, 0, 16);
    portico(k, W, 0, 14.6, 11, 4, 5.9, .9, 6); k.box(M.dark, 5, 4.2, .3, 0, .9, 15.2); k.gable(W, 12.5, 2.4, 6.6, 0, 7.8, 17.8);
    for (const s of [-1, 1]) { k.box(W, 1.1, 6.8, 1.1, s * 4.3, 0, 31); c.box(s * 4.3, 31, 1.1, 1.1, 7); k.box(M.stone, 21, .9, .6, s * 16, 0, 31); k.box(W, 21, .14, .2, s * 16, 1.5, 31); k.wins(W, s * 6, 31, s * 26, 31, 14, .22, .9, .9, .22); c.box(s * 16, 31, 21, .6, 2); }
    for (const [y, w] of [[4.5, 11.4], [5.6, 12.2], [6.7, 13]]) k.box(W, w, .5, .8, 0, y, 31);
    k.sign('M. P. BIRLA PLANETARIUM\nবিড়লা তারামণ্ডল', 11, 2.2, 14.5, 3, 31.4, 0, '#18305e', '#fff');
    c.circ(0, 0, 18.6); c.box(0, 18, 13, 8);
    for (let i = 0; i < 12; i++) { const a = i * PI / 6 + .3; if (Math.cos(a) < .8) c.tree(Math.sin(a) * 25, Math.cos(a) * 25, .9); }
    c.roam(40, 6, 0, 27, 4);
  });

  // ───────── North Kolkata gully cricket, in a blind lane off Bidhan Sarani
  onRoad('Gully Cricket', 'গলি ক্রিকেট', 'Bidhan Sarani', 330, 46, (k, c, hw) => {
    c.clear(44, 76, 0, -46); k.box(M.asph, 7, .1, 62, 0, 0, -41);
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
      const hz = -(21.5 + i * 19.6), hx = sx * 8.2, fl = 2 + (R() < .5 ? 1 : 0), H = fl * 3.6 + .8, mat = pick([M.redOx, M.cream, M.sand, M.white, M.redOx]), fx = sx * 3.68;
      k.box(mat, 9, H, 19, hx, 0, hz); k.box(M.white, 9.5, .4, 19.4, hx, H, hz); k.box(M.white, .5, .9, 19.4, sx * 3.9, H, hz);
      k.wins(M.wood, fx, hz - 8, fx, hz - 2, 1, 1.5, 2.7, .5, .2); k.wins(M.green, fx, hz - 1, fx, hz + 8, 3, 1.2, 1.8, 1.4, .2);
      for (let f = 1; f < fl; f++) { k.wins(M.green, fx, hz - 8.5, fx, hz + 8.5, 5, 1.3, 2.2, f * 3.6 + .9, .2); k.box(M.white, 1.2, .2, 9, sx * 3.1, f * 3.6 + .5, hz); k.box(M.iron, .06, .06, 9, sx * 2.55, f * 3.6 + 1.6, hz); k.wins(M.iron, sx * 2.55, hz - 4.5, sx * 2.55, hz + 4.5, 16, .05, 1, f * 3.6 + .6, .05); }
      k.box(M.redOx, 1.1, .5, 9, sx * 3.05, 0, hz + 3.6); // the rowak, for adda
      for (let j = 0; j < 2; j++) if (R() < .7) c.person(sx * 3.05, hz + rr(0, 7), -sx * PI / 2, false, 'sit');
      c.box(hx, hz, 9, 19);
    }
    k.box(M.cream, 26, 8.4, 8, 0, 0, -75); k.box(M.white, 26.5, .4, 8.4, 0, 8.4, -75); k.wins(M.green, -9, -70.95, 9, -70.95, 5, 1.3, 2.2, 4.6, .2); k.box(M.wood, 1.6, 2.7, .2, -6, 0, -70.95); c.box(0, -75, 26, 8);
    k.beam(M.dark, [-3.6, 6.4, -30], [3.6, 6.1, -30], .04); for (let i = 0; i < 5; i++) k.box(pick([M.red, M.white, M.blue, M.yellow, M.pink]), .9, 1.1, .04, -2.6 + i * 1.3, 5.1, -30);
    for (const x of [-.14, 0, .14]) k.box(M.wood, .04, .62, .04, x, .1, -53.3); // stumps
    const kid = (x, z, r, pose) => c.person(x, z, r, false, pose, { s: .7 + R() * .08, top: pick(['#f2c118', '#b3261e', '#27408f', '#e8e2d4', '#1d6b46', '#e8862a']), bottom: pick(['#283044', '#3d3a33', '#5a5148']), hair: '#17110d' });
    kid(0, -52.2, 0, 'bat'); k.add(M.thatch, new THREE.BoxGeometry(.11, .72, .05), .02, .42, -51.75, 0, .5); kid(0, -33, PI, 'bowl'); kid(.2, -55.2, 0);
    kid(2.5, -43, -1.8); kid(-2.6, -38, 1.9); kid(2.4, -26, 2.9); kid(-2.3, -19, 2.6); kid(-2.5, -58, .6);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), M.lime); k.extras.push(ball); let bx = 1, bz = -20, n = -1;
    const L = (a, b, f) => a + (b - a) * f;
    anims.push(t => {
      const u = t % 3.4, i = Math.floor(t / 3.4); if (i !== n) { n = i; bx = Math.random() * 5 - 2.5; bz = -15 - Math.random() * 11; }
      if (u < .6) ball.position.set(.25, 1.3, -33.4);
      else if (u < 1) { const f = (u - .6) / .4; ball.position.set(L(.25, 0, f), L(1.5, .2, f * f), L(-33.4, -47, f)); }
      else if (u < 1.25) { const f = (u - 1) / .25; ball.position.set(0, L(.2, .6, f), L(-47, -51.5, f)); }
      else if (u < 2.3) { const f = (u - 1.25) / 1.05; ball.position.set(L(0, bx, f), .6 + Math.sin(f * PI) * 3 - .45 * f, L(-51.5, bz, f)); }
      else ball.position.set(bx, .2, bz);
    });
  });

  // ───────── Dakshineswar Kali Temple (by ferry from Babughat)
  site('Dakshineswar Kali Temple', 'দক্ষিণেশ্বর কালী মন্দির', [DAK.bx, DAK.z], -PI / 2, 150, (k, c) => {
    // local frame: +z is the river (west), -z is inland, +x is south
    const C = M.cream, Rd = M.redOx, W = M.white;
    c.clear(236, 262, 0, -100); k.box(M.flag, 184, .12, 152, 0, 0, -80);
    const ratna = (x, y, z, r) => { // one of the nine spires
      k.cyl(C, r, r * 1.04, r * 1.7, x, y, z, 16);
      for (let i = 0; i < 4; i++) { const a = i * PI / 2; k.box(M.dark, r * .7, r * 1.1, .16, x + Math.sin(a) * r * .97, y + r * .3, z + Math.cos(a) * r * .97, a); }
      k.cyl(Rd, r * 1.28, r * 1.28, .22, x, y + r * 1.7, z, 16); k.dome(W, r * 1.08, x, y + r * 1.7 + .22, z, 1.45, 14);
      k.cyl(Rd, r * .3, r * .46, r * .28, x, y + r * 3.2, z, 8); k.dome(M.gold, r * .26, x, y + r * 3.45, z, 1.5, 8); k.cone(M.gold, r * .07, r * .9, x, y + r * 3.75, z, 6);
    };
    const shiv = (x, z) => { // aat-chala Shiva temple
      k.box(M.stone, 7.6, 1.1, 7.6, x, 0, z); k.box(W, 5.4, 4.6, 5.4, x, 1.1, z); k.box(Rd, 5.6, .3, 5.6, x, 1.1, z); k.wins(M.dark, x - .8, z - 2.72, x + .8, z - 2.72, 1, 1.5, 3.1, 1.3, .2);
      k.chala(Rd, 7.4, 1.9, x, 5.6, z, .9); k.chala(W, 7, 1.9, x, 5.72, z, .9); k.box(W, 2.9, 1.6, 2.9, x, 6.5, z); k.chala(Rd, 4.4, 1.7, x, 8, z, .6); k.chala(W, 4, 1.7, x, 8.1, z, .6);
      k.cyl(M.gold, .1, .16, 1, x, 9.7, z, 6); k.dome(M.gold, .28, x, 9.75, z, 1.3, 8); k.box(M.stone, 2.6, .55, 1.3, x, 0, z - 4.4); c.box(x, z, 7.6, 7.6, 10);
    };
    // bathing ghat and the chandni (the pillared river pavilion)
    for (let i = 0; i < 14; i++) k.box(M.stone, 46, .6, 1.5, 0, -.45 * (i + 1) - .2, .6 + i * 1.4);
    for (const s of [-1, 1]) { k.box(C, 3, 3.2, 3, s * 24.5, 0, -1.8); k.chala(Rd, 3.9, 1, s * 24.5, 3.2, -1.8, .4); c.box(s * 24.5, -1.8, 3, 3, 5); }
    for (const z of [-6, -20]) { k.cols(C, -9, z, 9, z, 4, .5, 6, 0); for (let i = 0; i < 4; i++) c.circ(-9 + i * 6, z, .6, 7); }
    k.box(C, 21, .9, 17, 0, 6, -13); k.box(Rd, 21.6, .3, 17.6, 0, 6.9, -13); k.chala(Rd, 22.6, 1.7, 0, 7.15, -13, .9, 18.6); k.chala(C, 22, 1.7, 0, 7.25, -13, .9, 18);
    k.sign('দক্ষিণেশ্বর কালী মন্দির\nDAKSHINESWAR KALI TEMPLE · 1855', 13, 2.2, 0, 8.5, -3.6, 0, '#7a1f1a', '#f6e7c0'); k.sign('গঙ্গা ঘাট · ফেরি · FERRY TO BABUGHAT', 11, 1.1, 0, 5.3, -21.6, PI, '#12356b', '#fff');
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) shiv(s * (17.6 + i * 11.2), -13);
    // the Navaratna temple of Bhavatarini Kali, facing south
    { const x = -12, z = -80;
      k.box(M.stone, 31, .9, 31, x, 0, z); k.box(C, 27, 2.6, 27, x, .9, z); k.box(Rd, 27.4, .35, 27.4, x, 3.4, z); k.box(Rd, 27.4, .35, 27.4, x, .9, z);
      for (let i = 0; i < 6; i++) k.box(M.stone, 1, 3.4 - i * .57, 10, x + 14 + i, 0, z);
      k.box(C, 15, 8, 15, x, 3.75, z); k.box(Rd, 15.3, .4, 15.3, x, 3.75, z); k.box(Rd, 15.3, .35, 15.3, x, 10.7, z);
      for (const s of [-1, 1]) { k.wins(M.dark, x + s * 7.52, z - 6, x + s * 7.52, z + 6, 3, 2.3, 5.2, 4.3, .2); k.wins(M.dark, x - 6, z + s * 7.52, x + 6, z + s * 7.52, 3, 2.3, 5.2, 4.3, .2); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(C, 1.3, 8, 1.3, x + sx * 7.2, 3.75, z + sz * 7.2);
      k.chala(Rd, 19.2, 1.8, x, 11.55, z, 1.1); k.chala(C, 18.5, 1.8, x, 11.7, z, 1.1);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) ratna(x + sx * 6.4, 11.75, z + sz * 6.4, 1.65);
      k.box(C, 9.6, 6.6, 9.6, x, 11.8, z); k.box(Rd, 9.9, .3, 9.9, x, 17.7, z);
      for (const s of [-1, 1]) { k.wins(M.dark, x + s * 4.82, z - 3.6, x + s * 4.82, z + 3.6, 3, 1.4, 3.6, 13.3, .2); k.wins(M.dark, x - 3.6, z + s * 4.82, x + 3.6, z + s * 4.82, 3, 1.4, 3.6, 13.3, .2); }
      k.chala(Rd, 12.5, 1.3, x, 18.28, z, .8); k.chala(C, 12, 1.3, x, 18.4, z, .8);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) ratna(x + sx * 3.9, 18.6, z + sz * 3.9, 1.3);
      ratna(x, 19.3, z, 2.7); c.box(x, z, 27, 27); c.box(x + 16.5, z, 6, 10); }
    // Natmandir, the open hall in front of the goddess
    k.box(M.stone, 24, .8, 18, 30, 0, -80); for (const dz of [-7.5, -2.5, 2.5, 7.5]) k.cols(C, 20, -80 + dz, 40, -80 + dz, 6, .5, 6.4, .8);
    k.box(C, 24.6, 1, 18.6, 30, 7.2, -80); k.box(Rd, 25, .3, 19, 30, 8.2, -80); c.box(30, -80, 24, 18, 9);
    // Radha-Krishna temple
    k.box(M.stone, 17, 1.6, 13, -52, 0, -80); k.box(C, 11, 6.2, 9, -54, 1.6, -80); k.cols(C, -46, -85, -46, -75, 5, .4, 5.6, 1.6); k.box(C, 16, .8, 12.4, -52, 7.6, -80); k.box(Rd, 16.4, .3, 12.8, -52, 8.4, -80);
    k.wins(M.dark, -48.45, -83, -48.45, -77, 3, 1.3, 3.4, 2, .2); k.chala(C, 9, 1.3, -54, 8.7, -80, .6, 7); k.cyl(M.gold, .1, .16, .9, -54, 10, -80, 6); for (let i = 0; i < 3; i++) k.box(M.stone, 1, 1.6 - i * .5, 6, -43 + i, 0, -80); c.box(-52, -80, 17, 13, 9);
    // nahabat music towers
    for (const s of [-1, 1]) { const x = s * 80, z = -32; k.box(C, 6.5, 9, 6.5, x, 0, z); k.box(Rd, 6.8, .3, 6.8, x, 4.4, z); k.wins(M.dark, x - 2, z - 3.27, x + 2, z - 3.27, 2, 1.2, 2.6, 5.2, .2); k.wins(M.dark, x - s * 3.27, z - 2, x - s * 3.27, z + 2, 2, 1.2, 2.6, 5.2, .2); k.chala(Rd, 8.5, 1.4, x, 8.95, z, .7); k.chala(C, 8, 1.4, x, 9.05, z, .7); k.dome(W, 1.4, x, 10.2, z, 1.3, 10); c.box(x, z, 6.5, 6.5, 10); }
    // the ranges of rooms round the courtyard, and the lion gate on the east
    for (const s of [-1, 1]) {
      k.box(C, 6, 6.2, 132, s * 89, 0, -88); k.box(Rd, 6.3, .35, 132.3, s * 89, 6.2, -88); k.wins(M.dark, s * 85.95, -150, s * 85.95, -26, 22, 2.6, 4.2, .3, .2); c.box(s * 89, -88, 6, 132, 7);
      k.box(C, 78, 6.2, 6, s * 50, 0, -154); k.box(Rd, 78.3, .35, 6.3, s * 50, 6.2, -154); k.wins(M.dark, s * 14, -150.95, s * 86, -150.95, 12, 2.6, 4.2, .3, .2); c.box(s * 50, -154, 78, 6, 7);
      k.box(C, 3, 9.4, 6.6, s * 9.5, 0, -154); c.box(s * 9.5, -154, 3, 6.6, 10);
    }
    k.box(C, 22, 2.2, 6.6, 0, 9.4, -154); k.chala(Rd, 23.6, 1.5, 0, 11.6, -154, .8, 8.2); k.chala(C, 23, 1.5, 0, 11.7, -154, .8, 7.6);
    k.sign('দক্ষিণেশ্বর কালী মন্দির · DAKSHINESWAR KALI TEMPLE', 15, 1.5, 0, 10.5, -157.35, PI, '#7a1f1a', '#f6e7c0'); k.sign('জয় মা ভবতারিণী', 9, 1.4, 0, 10.5, -150.65, 0, '#7a1f1a', '#f6e7c0');
    k.sign("শ্রীরামকৃষ্ণের ঘর\nSri Ramakrishna's Room", 6.5, 1.6, -85.9, 5, -30, PI / 2, '#f1ecdc', '#7a1f1a');
    // pilgrims
    c.roam(136, 28, 0, -41, 9); c.roam(150, 38, 0, -126, 9); c.roam(70, 14, 0, -177, 5);
    for (let i = 0; i < 9; i++) c.person(10 + (i % 2) * .8, -72.5 + i * 1.3, PI, i % 3 !== 1, 'stand', i % 3 ? { top: '#efe9dc', border: '#b3261e' } : undefined);
    for (let i = 0; i < 26; i++) c.person(rr(-78, 78), pick([rr(-56, -26), rr(-146, -100)]), rr(0, 6), R() < .55);
    for (let x = -42; x <= 42; x += 8.4) if (Math.abs(x) > 12) { stall(k, c, x, -161.5, PI, pick(['fruit', 'fruit', 'tea'])); stall(k, c, x + 3, -193, 0, pick(['fruit', 'phuchka', 'tea', 'cloth'])); }
    for (let i = 0; i < 14; i++) c.person(rr(-44, 44), rr(-188, -166), rr(0, 6), R() < .5);
    // Panchavati and the belts of trees
    for (let i = 0; i < 44; i++) { c.tree(rr(-114, -97), rr(-204, -5), rr(1, 1.5)); c.tree(rr(97, 114), rr(-204, -5), rr(1, 1.5)); }
    for (let i = 0; i < 30; i++) { const x = rr(-95, 95); if (Math.abs(x) > 14) c.tree(x, rr(-224, -206), rr(1, 1.4)); }
    for (let i = 0; i < 24; i++) c.tree(pick([-1, 1]) * rr(120, 214), rr(-13, -3), rr(.9, 1.3));
    for (const [x, z] of [[-70, -112], [70, -112], [-66, -50], [66, -52], [0, -122]]) c.tree(x, z, 1.4);
  });
  // across the river: Belur Math, and the Bally bridge upstream
  site(null, null, [DAK.bx - RIVER_W - 44, DAK.z + 140], PI / 2, 0, (k, c) => {
    const S = M.cream; c.clear(100, 60, 0, 0);
    k.box(S, 64, 9, 22, 0, 0, 0); k.box(M.white, 65, .6, 23, 0, 9, 0); k.box(S, 16, 17, 7, 0, 0, 12); k.wins(M.dark, -.1, 15.55, .1, 15.55, 1, 5, 9, 1, .3);
    k.cyl(S, 7, 7.4, 6, 0, 9, -2, 20); k.dome(S, 7, 0, 15, -2, 1.15, 20); k.cone(M.gold, .3, 3, 0, 23, -2);
    for (const s of [-1, 1]) { k.cyl(S, 2.4, 2.5, 3, s * 5, 17, 12, 10); k.dome(S, 2.5, s * 5, 20, 12, 1.2, 10); k.cyl(S, 3, 3.2, 4, s * 26, 9, 0, 12); k.dome(S, 3.1, s * 26, 13, 0, 1.15, 12); k.wins(M.dark, s * 10, 11.05, s * 30, 11.05, 6, 1.6, 4.4, 1.6); }
    k.cyl(S, 1.8, 1.9, 2.6, 0, 17, 12, 10); k.dome(S, 1.9, 0, 19.6, 12, 1.3, 10);
    for (let i = 0; i < 10; i++) k.box(M.stone, 40, .6, 1.4, 0, -.5 * (i + 1), 30 + i * 1.3);
    for (let i = 0; i < 60; i++) c.tree(rr(-460, 380), rr(4, 30), rr(1, 1.5));
  });
  site(null, null, [DAK.bx + 70, DAK.z - 335], PI, 0, (k, c) => {
    c.clear(90, 24, 30, 0); const St = M.steel, n = 7, sp = 348 / n;
    k.box(M.asph, 360, .8, 11, 174, 3.4, 0);
    for (let j = 0; j <= n; j++) k.box(M.stone, 5, 13, 14, j * sp, -9.6, 0);
    for (let j = 0; j < n; j++) for (const z of [-5.5, 5.5]) for (let i = 0; i < 6; i++) {
      const a0 = j * sp + i * sp / 6, a1 = a0 + sp / 6, h0 = 4.2 + 8 * Math.sin(i / 6 * PI), h1 = 4.2 + 8 * Math.sin((i + 1) / 6 * PI);
      k.beam(St, [a0, h0, z], [a1, h1, z], .7); if (i) k.beam(St, [a0, 4.2, z], [a0, h0, z], .35); k.beam(St, i % 2 ? [a0, h0, z] : [a0, 4.2, z], i % 2 ? [a1, 4.2, z] : [a1, h1, z], .28);
    }
  });

  // ───────── The 42, the tower on Chowringhee
  onRoad('The 42', 'দ্য ফর্টি-টু', 'Chowringhee Road', 900, 50, (k, c, hw) => {
    const zc = -(hw + 6 + 16), T = M.tower, W = M.white; c.clear(54, 44, 0, zc);
    k.box(M.conc, 44, 11, 30, 0, 0, zc); k.box(W, 44.8, .6, 30.8, 0, 11, zc); for (const y of [.8, 6]) k.wins(M.glass, -21, zc + 15.05, 21, zc + 15.05, 9, 3.6, 3.8, y);
    k.box(M.dark, 7, 4.4, .4, 0, 0, zc + 15.1); k.box(W, 12, .4, 5, 0, 4.8, zc + 17); k.cols(M.steel, -5, zc + 19, 5, zc + 19, 2, .15, 4.8, 0);
    k.box(T, 24, 216, 22, 0, 11.6, zc); for (const s of [-1, 1]) { k.box(W, 2.4, 222, 8, s * 12.8, 11.6, zc); k.box(W, 24, 216, .5, 0, 11.6, zc + s * 11.2).box(T, 21, 216, .7, 0, 11.6, zc + s * 11.2); }
    for (let y = 47.6; y < 220; y += 36) k.box(W, 25.4, .8, 23.4, 0, y, zc);
    k.box(W, 25.6, 2.4, 23.6, 0, 227.6, zc); k.box(W, 12, 7, 10, 0, 230, zc); k.cyl(M.steel, .15, .3, 20, 0, 237, zc, 6); k.box(M.lamp, .5, .5, .5, 0, 257, zc);
    k.sign('THE 42', 9, 2, 0, 12.6, zc + 15.5, 0, '#141414', '#e8e8e8'); k.sign('42 · CHOWRINGHEE', 5, .8, 0, 5.4, zc + 19.6, 0, '#e8e8e8', '#141414');
    c.box(0, zc, 44, 30, 260);
  });

  // ───────── South Park Street Cemetery (1767)
  onRoad('South Park Street Cemetery', 'সাউথ পার্ক স্ট্রিট সেমেট্রি', 'Park Street', 640, 64, (k, c, hw) => {
    const z0 = hw + 5.5, D = 82, zc = z0 + D / 2, Wd = 112, S = M.moss;
    const wall = (x1, za, x2, zb) => { const L = Math.hypot(x2 - x1, zb - za), a = Math.atan2(-(zb - za), x2 - x1), mx = (x1 + x2) / 2, mz = (za + zb) / 2; k.box(M.brickD, L, 3.4, .8, mx, 0, mz, a); k.box(S, L + .2, .3, 1.1, mx, 3.4, mz, a); c.box(mx, mz, L, .8, 4, a); };
    c.clear(Wd + 8, D + 8, 0, zc); k.box(M.grass, Wd, .1, D, 0, 0, zc); k.box(M.gravel, 4.5, .14, D - 2, 0, 0, zc); k.box(M.gravel, Wd - 4, .14, 3.5, 0, 0, zc);
    wall(-Wd / 2, z0, -5.8, z0); wall(5.8, z0, Wd / 2, z0); wall(-Wd / 2, z0 + D, Wd / 2, z0 + D); wall(-Wd / 2, z0, -Wd / 2, z0 + D); wall(Wd / 2, z0, Wd / 2, z0 + D);
    for (const s of [-1, 1]) { k.box(M.cream, 3, 7, 3.4, s * 4.4, 0, z0); c.box(s * 4.4, z0, 3, 3.4, 8); k.box(M.iron, .12, 3.6, 2.7, s * 2.8, .1, z0 + 1.6); }
    k.box(M.cream, 12, 1.5, 3.6, 0, 7, z0); k.gable(M.cream, 12.8, 2.6, 3.8, 0, 8.5, z0);
    k.sign('SOUTH PARK STREET CEMETERY\nসাউথ পার্ক স্ট্রিট সেমেট্রি · 1767', 10.5, 1.4, 0, 7.75, z0 - 1.85, PI, '#e6d6ad', '#3a2a1a');
    const tomb = (x, z) => {
      const t = R() * 6 | 0, m = R() < .65 ? S : M.stone, s = rr(.8, 1.3);
      if (t === 0) { k.box(m, 2.4 * s, 1.2 * s, 2.4 * s, x, 0, z); k.add(m, new THREE.CylinderGeometry(.25 * s, .85 * s, 6.5 * s, 4).rotateY(PI / 4), x, 4.45 * s, z); c.box(x, z, 2.4 * s, 2.4 * s, 8); } // obelisk
      else if (t === 1) { k.box(m, 3.4 * s, .8, 3.4 * s, x, 0, z); k.pyr(m, 3.2 * s, 4.2 * s, x, .8, z); c.box(x, z, 3.4 * s, 3.4 * s, 5); } // pyramid
      else if (t === 2) { k.cyl(m, 2 * s, 2.1 * s, .7, x, 0, z, 12); for (let i = 0; i < 6; i++) k.cyl(m, .18 * s, .2 * s, 2.8 * s, x + Math.cos(i * PI / 3) * 1.6 * s, .7, z + Math.sin(i * PI / 3) * 1.6 * s, 6); k.cyl(m, 2 * s, 2 * s, .4, x, .7 + 2.8 * s, z, 12); k.dome(m, 1.8 * s, x, 1.1 + 2.8 * s, z, .9, 12); k.cyl(m, .4 * s, .55 * s, s, x, .7, z, 8); c.circ(x, z, 2.1 * s, 6); } // domed cupola
      else if (t === 3) { k.box(m, 1.5, .5, 2.9, x, 0, z); k.box(m, 1.2, .9, 2.5, x, .5, z); k.box(m, 1.5, .2, 2.9, x, 1.4, z); c.box(x, z, 1.5, 2.9, 2); } // chest tomb
      else if (t === 4) { k.box(m, 1.6, 1.4, 1.6, x, 0, z); k.cyl(m, .3, .34, 3 * s, x, 1.4, z, 8); k.dome(m, .45, x, 1.4 + 3 * s, z, 1.3, 8); c.box(x, z, 1.6, 1.6, 5); } // column and urn
      else { k.box(m, 3 * s, 3.2 * s, 3 * s, x, 0, z); k.pyr(m, 3.4 * s, 1.7 * s, x, 3.2 * s, z); k.box(M.dark, 1 * s, 2 * s, .2, x, 0, z - 1.5 * s); c.box(x, z, 3 * s, 3 * s, 6); } // mausoleum
    };
    for (let x = -50; x <= 50; x += 6.2) for (let z = z0 + 5; z < z0 + D - 3; z += 6.4) { if (Math.abs(x) < 4.6 || Math.abs(z - zc) < 3.8 || R() < .16) continue; tomb(x + rr(-.7, .7), z + rr(-.7, .7)); }
    for (let i = 0; i < 26; i++) c.tree(pick([-1, 1]) * rr(4, 52), z0 + rr(3, D - 3), rr(1, 1.5));
    c.roam(Wd - 12, 2.4, 0, zc, 3); c.roam(3, D - 10, 0, zc, 3);
  });

  // ───────── Race Course: the track, the stand, horses racing and the betting ring
  site('Race Course', 'রেস কোর্স', ll(22.545, 88.3368), 0, 125, (k, c) => {
    c.clear(266, 136, 30, 0);
    k.add(M.track, new THREE.RingGeometry(.87, 1, 72).rotateX(-PI / 2).scale(90, 1, 56), 0, .12, 0);
    for (const s of [.86, 1.01]) k.add(M.white, new THREE.TorusGeometry(1, .004, 4, 72).rotateX(PI / 2).scale(90 * s, 70, 56 * s), 0, 1, 0);
    k.cyl(M.white, .1, .1, 5, 92.6, 0, 0, 6); k.add(M.red, new THREE.CylinderGeometry(.6, .6, .08, 14).rotateX(PI / 2), 92.6, 4.6, 0);
    for (let i = 0; i < 6; i++) k.box(M.conc, 2.2, 1 + i * 1.2, 76, 98 + i * 2.2, 0, 0);
    k.box(M.white, 2.4, 13, 78, 112.4, 0, 0); k.box(M.tin, 19, .4, 80, 104.4, 13, 0); k.box(M.white, .5, 1.7, 80, 95.2, 12.1, 0); k.cols(M.steel, 96, -38, 96, 38, 9, .18, 13, 0);
    k.sign('ROYAL CALCUTTA TURF CLUB · রয়্যাল ক্যালকাটা টার্ফ ক্লাব', 36, 1.4, 94.9, 12.95, 0, -PI / 2, '#1d3b2a', '#f3e9c8');
    for (let i = 0; i < 6; i++) for (let j = 0; j < 12; j++) if (R() < .8) c.person(98 + i * 2.2, -35 + j * 6.3 + rr(-2, 2), -PI / 2 + rr(-.3, .3), R() < .35, 'stand', undefined, 1 + i * 1.2);
    c.box(104.6, 0, 18, 78, 14);
    // the betting ring behind the stand
    k.box(M.gravel, 36, .12, 84, 132, 0, 0);
    const NAMES = ['KOLKATA KING', 'HOWRAH EXPRESS', 'MISHTI DOI', 'TIGER OF BENGAL', 'MONSOON MAGIC', "DADA'S PRIDE", 'ROSOGOLLA', 'MAIDAN STAR'], odds = () => pick(['2/1', '5/2', '7/2', '4/1', '6/1', '9/2', '10/1', '12/1']);
    for (let i = 0; i < 6; i++) {
      const z = -30 + i * 12; k.box(M.wood, 2.2, .5, 2.4, 120, 0, z); k.cyl(M.steel, .04, .04, 3.1, 119.2, .5, z, 5); k.cone(pick([M.red, M.blue, M.yellow, M.green]), 1.9, .5, 119.2, 3.5, z, 10);
      k.sign(`BOOKMAKER ${i + 1} · বুকি\n${NAMES[i]}  ${odds()}\n${NAMES[(i + 3) % 8]}  ${odds()}\n${NAMES[(i + 5) % 8]}  ${odds()}`, 2.8, 2, 120.4, 2.4, z - 2.7, PI / 2, '#141414', '#f2c118'); k.cols(M.steel, 120.35, z - 4, 120.35, z - 1.4, 2, .05, 3.4, 0);
      c.person(120.3, z, PI / 2, false, 'stand', { top: '#f4f4f0', bottom: '#2b2b30' }, .5); c.box(120, z, 2.2, 2.4, 4);
      for (let j = 0; j < 4; j++) c.person(rr(122.6, 126), z + rr(-2.6, 2.6), -PI / 2 + rr(-.5, .5), R() < .2);
    }
    k.box(M.cream, 7, 6.4, 46, 147, 0, 0); k.box(M.white, 7.6, .5, 46.6, 147, 6.4, 0); k.wins(M.dark, 143.45, -20, 143.45, 20, 10, 2.4, 1.3, 1.3, .2); k.box(M.tin, 3, .15, 46, 142.2, 3.3, 0);
    k.sign('TOTE · টোট · WIN · PLACE · QUINELLA · TANALA', 30, 1.4, 143.42, 4.7, 0, -PI / 2, '#b3261e', '#fff'); c.box(147, 0, 7, 46);
    for (let i = 0; i < 10; i++) for (let j = 0; j < 2; j++) if (R() < .75) c.person(142.2 - j * 1, -18 + i * 4, PI / 2, R() < .2);
    c.roam(12, 72, 133, 0, 8);
    // eight runners
    const HC = [M.wood, M.dark, M.thatch, M.clay, M.wood, M.stone, M.dark, M.clay], SILK = [M.red, M.yellow, M.blue, M.green, M.pink, M.orange, M.white, M.lime], legG = new THREE.BoxGeometry(.11, 1.2, .11).translate(0, -.6, 0);
    const hs = HC.map((Bd, i) => {
      const h = new Kit(), Sk = SILK[i];
      h.add(Bd, new THREE.SphereGeometry(1, 10, 8).scale(.82, .36, .3), 0, 1.5, 0); h.beam(Bd, [.6, 1.6, 0], [1.05, 2.15, 0], .26); h.add(Bd, new THREE.BoxGeometry(.5, .2, .18), 1.27, 2.2, 0, 0, 0, -.5); h.beam(M.dark, [-.78, 1.6, 0], [-1.2, 1.15, 0], .08);
      h.add(Sk, new THREE.BoxGeometry(.5, .3, .28), .12, 1.98, 0, 0, 0, .35); h.add(M.skin, new THREE.SphereGeometry(.11, 8, 6), .42, 2.22, 0); h.dome(Sk, .12, .42, 2.24, 0, 1, 8); h.add(M.white, new THREE.BoxGeometry(.16, .4, .46), 0, 1.72, 0);
      const g = h.build(), legs = [[.55, .13], [.55, -.13], [-.55, .13], [-.55, -.13]].map(([x, z]) => { const m = new THREE.Mesh(legG, Bd); m.position.set(x, 1.3, z); m.castShadow = true; g.add(m); return m; });
      k.extras.push(g); return { g, legs, th: i * .03, lane: (i % 4) * 1.5 - 2.2, v: 15 + (i * 37 % 10) * .22, ph: i * 1.7 };
    });
    let last = 0;
    anims.push(t => {
      const dt = Math.min(.1, t - last); last = t;
      for (const h of hs) {
        const a = 84.2 + h.lane, b = 52.4 + h.lane; h.th += (h.v + Math.sin(t * .3 + h.ph) * 1.6) * dt / Math.hypot(a * Math.sin(h.th), b * Math.cos(h.th));
        const tx = -a * Math.sin(h.th), tz = b * Math.cos(h.th), ph = t * 11 + h.ph; h.g.position.set(a * Math.cos(h.th), Math.abs(Math.sin(ph)) * .12, b * Math.sin(h.th)); h.g.rotation.y = Math.atan2(-tz, tx);
        h.legs[0].rotation.z = Math.sin(ph) * .9; h.legs[1].rotation.z = Math.sin(ph + .5) * .9; h.legs[2].rotation.z = Math.sin(ph + 2.6) * .9; h.legs[3].rotation.z = Math.sin(ph + 3.1) * .9;
      }
    });
  });

  // ───────── Kolkata Police: Lalbazar headquarters and the thanas
  const cz2 = (r, w) => new THREE.CylinderGeometry(r, r, w, 12).rotateX(PI / 2);
  const pcar = (k, c, x, z, r, van) => { // parked police jeep or van; nose along local +x turned by r
    const cs = Math.cos(r), sn = Math.sin(r), at = (lx, lz) => [x + lx * cs + lz * sn, z - lx * sn + lz * cs], bx = (m, w, h, d, lx, y, lz) => { const p = at(lx, lz); k.box(m, w, h, d, p[0], y, p[1], r); };
    const L = van ? 5.6 : 3.9, H = van ? 2.5 : 1.75, body = van ? M.blue : M.rosh;
    bx(body, L, .75, 1.8, 0, .4, 0); bx(body, L * (van ? .96 : .62), H - 1.15, 1.74, van ? 0 : -.5, 1.15, 0); bx(M.glass, L * (van ? .5 : .6), .5, 1.78, van ? 1.2 : -.5, 1.2, 0); bx(M.glass, .06, .5, 1.5, van ? L / 2 - .08 : .74, 1.2, 0);
    bx(van ? M.white : M.blue, L + .02, .16, 1.83, 0, .72, 0); bx(M.red, .3, .14, .5, van ? 1.8 : -.4, H, -.3); bx(M.blue, .3, .14, .5, van ? 1.8 : -.4, H, .3); bx(M.dark, .14, .2, 1.84, L / 2, .4, 0);
    for (const lx of [-L / 2 + .8, L / 2 - .8]) for (const lz of [-.82, .82]) { const p = at(lx, lz); k.add(M.tyre, cz2(.4, .26), p[0], .4, p[1], r); }
    for (const s of [-1, 1]) { const p = at(van ? -.9 : .9, s * .925); k.sign('POLICE · পুলিশ', van ? 2.6 : 1.5, .34, p[0], van ? 1.5 : .98, p[1], r + (s > 0 ? 0 : PI), van ? '#27408f' : '#f4f1e8', van ? '#ffffff' : '#27408f'); }
    c.box(x, z, L, 1.8, H, r);
  };
  const bike = (k, c, x, z) => { k.add(M.tyre, cz2(.32, .1), x, .32, z - .7).add(M.tyre, cz2(.32, .1), x, .32, z + .7); k.box(M.rosh, .3, .4, 1.1, x, .5, z); k.box(M.dark, .34, .12, .6, x, .9, z - .2); k.box(M.chrome, .6, .04, .04, x, 1.1, z + .5); k.box(M.blue, .06, .3, .3, x, .95, z + .62); c.box(x, z, .5, 1.9, 1.2); };
  const cop = (c, lx, lz, r = 0) => c.person(lx, lz, r, false, 'stand', { ...COPS.look, skin: pick(['#8d5a3b', '#a36f48', '#7a4a2e']) });
  const post = (c, lx, lz) => { const p = c.W(lx, lz); COPS.posts.push({ x: p[0], z: p[1] }); };

  onRoad('Lalbazar Police Headquarters', 'লালবাজার · কলকাতা পুলিশ সদর দপ্তর', 'B.B. Ganguly Street, Bowbazar', 86, 62, (k, c, hw) => {
    const z0 = -(hw + 5), zb = z0 - 42, Rb = M.brick, W = M.white; c.clear(110, 70, 0, z0 - 30);
    k.box(M.conc, 102, .1, 31, 0, 0, z0 - 15.5);
    k.box(Rb, 98, 15, 22, 0, 0, zb); k.box(W, 99, .8, 23, 0, 15, zb); for (const y of [5.2, 10.2]) k.box(W, 98.4, .4, 22.4, 0, y, zb);
    for (const y of [1.2, 6.2, 11.2]) for (const s of [-1, 1]) k.wins(M.green, s * 14, zb + 11.05, s * 47, zb + 11.05, 9, 1.6, 3.2, y);
    for (const s of [-1, 1]) { k.box(Rb, 9, 19, 24, s * 45, 0, zb); k.box(W, 9.6, .7, 24.6, s * 45, 19, zb); k.pyr(M.roofR, 10, 4, s * 45, 19.7, zb); }
    k.box(Rb, 24, 20, 6, 0, 0, zb + 12); portico(k, W, 0, zb + 15, 20, 6, 12, 1.4, 4); k.gable(W, 25, 4, 6, 0, 20, zb + 12); k.clock(2.6, 0, 21.6, zb + 15.05);
    k.sign('KOLKATA POLICE HEADQUARTERS · LALBAZAR\nকলকাতা পুলিশ সদর দপ্তর · লালবাজার', 19, 2.2, 0, 16.2, zb + 20.3, 0, '#12356b', '#fff');
    k.cyl(M.steel, .12, .16, 17, 16, 0, z0 - 8, 8); k.box(M.saffron, 3.6, .8, .08, 17.9, 16, z0 - 8); k.box(M.white, 3.6, .8, .08, 17.9, 15.2, z0 - 8); k.box(M.green, 3.6, .8, .08, 17.9, 14.4, z0 - 8);
    fence(k, c, -51, z0, -6.5, z0); fence(k, c, 6.5, z0, 51, z0); fence(k, c, -51, z0, -51, z0 - 31); fence(k, c, 51, z0, 51, z0 - 31);
    for (const s of [-1, 1]) { k.box(W, 2, 5, 2, s * 5.6, 0, z0); c.box(s * 5.6, z0, 2, 2, 6); k.box(M.blue, 1.6, 2.6, 1.6, s * 8.6, 0, z0 + 2.2); k.pyr(M.red, 2, .8, s * 8.6, 2.6, z0 + 2.2); } // gate posts and sentry boxes
    k.box(W, 14, 1, 1, 0, 5, z0); k.sign('কলকাতা পুলিশ · KOLKATA POLICE', 11, 1.3, 0, 6.7, z0 + .1, 0, '#b3261e', '#fff'); k.sign('LALBAZAR', 6, .9, 0, 5.5, z0 + .56, 0, '#12356b', '#fff');
    for (let i = 0; i < 6; i++) pcar(k, c, -46 + i * 5.2, z0 - 22, PI / 2, false); for (let i = 0; i < 4; i++) pcar(k, c, 22 + i * 6.6, z0 - 21, PI / 2, true);
    for (let i = 0; i < 7; i++) bike(k, c, -45 + i * 2.2, z0 - 5); pcar(k, c, 30, z0 - 5.5, 0, false); pcar(k, c, 38, z0 - 5.5, 0, false);
    for (let i = 0; i < 9; i++) cop(c, -12 + i * 3, z0 - 25.5, 0); for (let i = 0; i < 14; i++) cop(c, rr(-44, 44), z0 - rr(9, 17), rr(0, 6));
    c.roam(84, 9, 0, z0 - 12, 9, COPS.look);
    for (const [x, z] of [[-4, z0 + 2.6], [4, z0 + 2.6], [-9, z0 + 4], [9, z0 + 4], [-30, z0 + 3], [30, z0 + 3]]) post(c, x, z);
    COPS.hq = c.W(0, z0 + 6.5);
    c.box(0, zb, 98, 24); c.box(0, zb + 14, 24, 8);
  });
  const thana = (name, bn, road, d, side) => onRoad(name + ' Police Station', bn + ' থানা', road, d, 28, (k, c, hw) => {
    const zc = side * (hw + 4.5 + 6.5), zf = side * (hw + 2.6); c.clear(36, 24, 3, zc);
    shop(k, c, 0, zc, -side, { name: name.toUpperCase() + ' POLICE STATION', sub: bn + ' থানা · কলকাতা পুলিশ', w: 18, d: 13, fl: 2, wall: M.brick, bg: '#12356b', fg: '#fff', awn: M.blue, blade: false, ppl: 0 });
    pcar(k, c, 13.5, zc + side * 1, 0, false); pcar(k, c, 13.5, zc - side * 3.4, 0, false); k.box(M.blue, 1.4, 2.5, 1.4, -8, 0, side * (hw + 3.4)); k.pyr(M.red, 1.8, .7, -8, 2.5, side * (hw + 3.4));
    cop(c, 3.5, zf + side * .8, side > 0 ? PI : 0); cop(c, 5, zf + side * 1.1, side > 0 ? PI : 0); post(c, -3, zf); post(c, 2, zf); post(c, -6.5, zf - side * .8);
  });
  thana('Burrabazar', 'বড়বাজার', 'Mahatma Gandhi Road', 210, 1); thana('Bowbazar', 'বউবাজার', 'B.B. Ganguly Street, Bowbazar', 405, 1); thana('Park Street', 'পার্ক স্ট্রিট', 'Park Street', 292, -1);
  thana('New Market', 'নিউ মার্কেট', 'Free School Street', 255, 1); thana('Jorasanko', 'জোড়াসাঁকো', 'Chittaranjan Avenue', 1050, 1); thana('Taltala', 'তালতলা', 'S.N. Banerjee Road', 430, 1);
  thana('Hare Street', 'হেয়ার স্ট্রিট', 'Council House Street', 150, -1); thana('Amherst Street', 'আমহার্স্ট স্ট্রিট', 'Mahatma Gandhi Road', 780, -1);

  // ───────── Dharmatala (Esplanade) bus terminus and taxi stand, on Chowringhee right beside the Esplanade metro.
  // Site-local x runs east towards Chowringhee, z south. The apron is paved and joins the road at two gates.
  site('Dharmatala Bus Stand', 'ধর্মতলা বাস স্ট্যান্ড', [6, 65], 0, 40, (k, c) => {
    const IX = -8; // the island's centre line
    c.clear(48, 74, -3, 0); k.box(M.apron, 36, .1, 70, -4, 0, 0);
    k.box(M.apron, 5, .1, 72, 14.05, 0, 0, -.0614); // pave up to the pavement, which runs at a slight angle with Chowringhee
    for (const [z, x1] of [[-29, 22.6], [29, 19]]) { const w = x1 - 13; k.box(M.apron, w, .1, 9, 13 + w / 2, 0, z); k.box(M.paint, w, .02, .15, 13 + w / 2, .1, z); } // gates to Chowringhee
    for (let z = -26; z <= 26; z += 6) k.box(M.paint, .15, .02, 2.6, 9, .1, z); // the drive-through lane
    // island, canopy, benches, booths
    k.box(M.conc, 4, .3, 40, IX, 0, 0); k.box(M.tin, 10.4, .2, 42, IX, 3.6, 0); k.box(M.steel, 10.6, .3, .2, IX, 3.4, -21); k.box(M.steel, 10.6, .3, .2, IX, 3.4, 21);
    for (let i = 0; i < 9; i++) for (const s of [-1, 1]) { const z = -20 + i * 5; k.cyl(M.steel, .08, .08, 3.3, IX + s * 1.7, .3, z, 6); c.circ(IX + s * 1.7, z, .2, 4); }
    for (let i = 0; i < 7; i++) k.box(M.wood, .5, .45, 3.4, IX, .3, -15 + i * 5);
    for (const z of [-23.5, 23.5]) { k.box(M.cream, 4, 3, 3, IX, 0, z); k.box(M.dark, .1, 1, 2.2, IX + 2.01, 1.3, z); c.box(IX, z, 4, 3, 4); }
    k.sign('অনুসন্ধান · ENQUIRY', 3.6, .6, IX + 2.06, 3.3, -23.5, PI / 2, '#b3261e', '#fff'); k.sign('টিকিট · TICKETS', 3.6, .6, IX + 2.06, 3.3, 23.5, PI / 2, '#b3261e', '#fff');
    const all = BUS_ROUTES.map(r => r[0]).join(' · ');
    for (const s of [-1, 1]) { k.sign(all, 18, .7, IX + s * 1.9, 2.75, 0, s * PI / 2, '#efc12e', '#1d3b6b'); k.sign('ধর্মতলা বাস স্ট্যান্ড · ESPLANADE BUS TERMINUS', 14, 1, IX + s * 5.25, 3.25, 0, s * PI / 2, '#12356b', '#fff'); }
    // sixteen buses in bays, noses to the island; D28B in the first bay
    for (let i = 0; i < 16; i++) {
      const s = i < 8 ? 1 : -1, z = -16.1 + (i % 8) * 4.6, x = IX + s * 7.3, p = c.W(x, z), r = BUS_ROUTES[i % BUS_ROUTES.length][0];
      PARKED.push({ k: 1, x: p[0], z: p[1], a: s > 0 ? PI : 0, route: r });
      k.box(M.paint, 9.6, .02, .12, x, .1, z - 2.3); k.sign(r, 1.6, .5, IX + s * 3, 3.05, z, s * PI / 2, '#1c1c1c', '#ff6a3c');
    }
    // passengers, hawkers, police, lights, the gate signs
    for (let i = 0; i < 18; i++) c.person(IX + rr(-1.5, 1.5), rr(-19, 19), rr(0, 6), R() < .4, 'stand', undefined, .3);
    for (let i = 0; i < 6; i++) c.person(IX + pick([-.35, .35]), -15 + i * 5 + rr(-1, 1), pick([PI / 2, -PI / 2]), R() < .5, 'sit', undefined, .3);
    c.roam(3, 36, IX, 0, 5);
    for (let i = 0; i < 4; i++) stall(k, c, -18 + i * 6, 32.5, PI, pick(['tea', 'fruit', 'phuchka', 'tea']));
    for (const [x, z] of [[-21, -26], [-21, 26], [11, -20], [11, 20]]) { k.cyl(M.steel, .14, .2, 9, x, 0, z, 8); k.box(M.lamp, 1.2, .3, .6, x, 9, z); c.circ(x, z, .25, 9); }
    for (const z of [-29, 29]) { for (const dz of [-4.8, 4.8]) { k.cyl(M.steel, .14, .16, 5.6, 21, 0, z + dz, 8); c.circ(21, z + dz, .22, 6); } k.box(M.steel, .2, .2, 9.8, 21, 5.5, z);
      k.sign(z < 0 ? 'ধর্মতলা বাস স্ট্যান্ড · ENTRY' : 'ধর্মতলা বাস স্ট্যান্ড · EXIT', 8, 1.2, 21.12, 4.7, z, PI / 2, '#12356b', '#fff'); }
    post(c, 14, -24); post(c, 14, 24); post(c, IX + 2.6, -21);
  });

  // ───────── Dharmatala taxi stand: a rank of yellow Ambassadors along the terminus's north edge
  site('Dharmatala Taxi Stand', 'ধর্মতলা ট্যাক্সি স্ট্যান্ড', [-4, 36], 0, 20, (k, c) => {
    for (let i = 0; i <= 8; i++) k.box(M.paint, .1, .02, 5.2, -11.2 + i * 2.8, .1, 0);
    for (let i = 0; i < 8; i++) { const p = c.W(-9.8 + i * 2.8, 0); PARKED.push({ k: 0, x: p[0], z: p[1], a: PI / 2 }); }
    k.cyl(M.steel, .06, .06, 3.4, -13.4, 0, -2.6, 6); c.circ(-13.4, -2.6, .15, 4);
    for (const r of [0, PI]) k.sign('TAXI STAND · ট্যাক্সি স্ট্যান্ড\nমিটারে চলুন · NO REFUSAL', 3.6, 1.2, -13.4, 2.8, -2.6 + (r ? -.03 : .03), r, '#f2c118', '#141414');
    const drv = { top: '#b9a77a', bottom: '#3d3a33', full: true };
    c.person(-12, 1.6, -2.6, false, 'stand', drv); c.person(-11.2, 2.5, -.4, false, 'stand', drv); c.person(13.2, -1, -PI / 2, false, 'sit', drv, .1); c.person(12.3, 1.2, 2.2, false, 'stand', drv);
  });
}
