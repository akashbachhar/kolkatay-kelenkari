import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Kit, M, PI, R } from './kit.js';
import { bankX, RIVER_W, WATER_Y, DAK } from './data.js';
import { GH } from './landmarks.js';
import { bake, look } from './human.js';

// The launch between Babughat and Dakshineswar. Step on to the gangway and it sails by itself.
const line = pts => { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, cum, len: cum.at(-1) }; };
const at = (L, s) => { let i = 0; while (i < L.pts.length - 2 && s > L.cum[i + 1]) i++; const a = L.pts[i], b = L.pts[i + 1], f = Math.min(1, Math.max(0, (s - L.cum[i]) / (L.cum[i + 1] - L.cum[i]))); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, b[0] - a[0], b[1] - a[1]]; };
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

export class Ferry {
  constructor(scene, player, hud, sound) {
    this.pl = player; this.hud = hud; this.snd = sound; this.fade = document.getElementById('fade');
    const g = GH['Babughat'], dock = (x, z, ry, to) => { const cs = Math.cos(ry), sn = Math.sin(ry), W = (lx, lz) => [x + lx * cs + lz * sn, z - lx * sn + lz * cs]; return { x, z, ry, boat: W(0, 27), land: W(0, -5.5), trig: W(0, -1.7), ang: ry + PI, to }; };
    this.docks = { city: dock(g.x, g.z, g.ry, 'দক্ষিণেশ্বর · DAKSHINESWAR'), dak: dock(DAK.bx, DAK.z, -PI / 2, 'বাবুঘাট · BABUGHAT') };
    for (const d of Object.values(this.docks)) { // gangway and jetty sign
      const k = new Kit(), yb = WATER_Y + 1;
      k.add(M.wood, new THREE.BoxGeometry(2.6, .16, 24), 0, yb / 2 - .1, 12.3, 0, Math.atan2(-yb, 23.4));
      for (const s of [-1, 1]) { k.beam(M.steel, [s * 1.3, 1, .6], [s * 1.3, yb + 1, 24], .06); for (let i = 0; i <= 6; i++) { const f = i / 6; k.beam(M.steel, [s * 1.3, yb * f, .6 + 23.4 * f], [s * 1.3, yb * f + 1, .6 + 23.4 * f], .05); } }
      k.box(M.tin, 9, .7, 3, 0, WATER_Y - .2, 23); k.cols(M.steel, 2.2, -2.6, 6.6, -2.6, 2, .1, 3.4, 0);
      k.sign('ফেরি · FERRY\n' + d.to, 5, 1.9, 4.4, 2.6, -2.6, PI, '#12356b', '#fff'); k.sign('গ্যাংওয়েতে উঠুন · Step on to the gangway', 5, .7, 4.4, 1.1, -2.6, PI, '#f2c118', '#141414');
      const grp = k.build(); grp.position.set(d.x, 0, d.z); grp.rotation.y = d.ry; scene.add(grp);
    }
    // the launch (bow towards +x; deck at y = 0)
    const k = new Kit(), hull = (pts, dep) => { const s = new THREE.Shape(); pts.forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])); return new THREE.ExtrudeGeometry(s, { depth: dep, bevelEnabled: false }).rotateX(PI / 2); };
    k.add(M.rosh, hull([[-10.5, -2.6], [6, -2.6], [11.5, 0], [6, 2.6], [-10.5, 2.6]], 1.8)); k.add(M.blue, hull([[-10.6, -2.7], [6.05, -2.7], [11.7, 0], [6.05, 2.7], [-10.6, 2.7]], .4), 0, .12, 0);
    k.box(M.wood, 16.5, .1, 4.8, -2, 0, 0); k.box(M.rosh, 2.6, 2.1, 3, 6, .1, 0); k.box(M.glass, .1, .8, 2.5, 7.32, 1.2, 0); k.box(M.glass, 2, .8, 3.04, 6, 1.2, 0); k.box(M.blue, 3, .12, 3.4, 6, 2.2, 0);
    for (const s of [-1, 1]) { k.cols(M.steel, -9.6, s * 2.3, -2.6, s * 2.3, 5, .06, 2.4, .1); k.box(M.steel, 14.6, .06, .06, -3, 1.05, s * 2.45); k.wins(M.steel, -10.2, s * 2.45, 4.2, s * 2.45, 12, .05, 1, .1, .05);
      k.add(M.orange, new THREE.TorusGeometry(.36, .1, 6, 14), -1, .75, s * 2.5); k.sign('এম. ভি. কেলেঙ্কারি · M.V. KELENKARI', 6.5, .6, -2, -.45, s * 2.62, s > 0 ? 0 : PI, '#f4f1e8', '#12356b'); }
    k.box(M.rosh, 8, .12, 5.4, -6.1, 2.5, 0); k.box(M.blue, 8.1, .2, 5.5, -6.1, 2.3, 0); k.cyl(M.dark, .32, .38, 1.5, -4, 2.6, 0, 10); k.cyl(M.red, .34, .34, .3, -4, 3.6, 0, 10);
    k.cyl(M.steel, .04, .04, 2.2, 10.4, 0, 0, 5); k.box(M.saffron, .9, .2, .03, 9.9, 1.95, 0); k.box(M.white, .9, .2, .03, 9.9, 1.75, 0); k.box(M.green, .9, .2, .03, 9.9, 1.55, 0);
    const pas = []; for (const x of [-9, -7.2, -5.4, -3.6]) { k.box(M.wood, .5, .45, 3.6, x, .1, 0); for (const z of [-1.3, -.4, .5, 1.4]) if (R() < .7) pas.push(bake(look(R, false), 'sit').rotateY(PI / 2).translate(x, .1, z)); }
    for (const [x, z, r] of [[-1.6, 2, 0], [-.6, -2, PI], [-9.8, -1.9, PI]]) pas.push(bake(look(R, true)).rotateY(r).translate(x, .1, z));
    this.boat = k.build(); const pm = new THREE.Mesh(mergeGeometries(pas), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85 })); pm.castShadow = true; this.boat.add(pm); scene.add(this.boat);
    // the course: up mid-river past Howrah Bridge, then (after a cut) the last stretch to the temple ghat
    const mid = z => bankX(z) - RIVER_W / 2, c = this.docks.city, d = this.docks.dak, p1 = [c.boat], p2 = [];
    for (let z = c.z - 90; z > -1570; z -= 70) p1.push([mid(z), z]); for (let z = DAK.z + 560; z > DAK.z + 70; z -= 70) p2.push([mid(z), z]); p2.push(d.boat);
    this.P1 = line(p1); this.P2 = line(p2); this.R1 = line([...p1].reverse()); this.R2 = line([...p2].reverse());
    this.run = null; this.armed = true; this.moor('city');
  }
  moor(w) { const d = this.docks[w]; this.at = w; this.x = d.boat[0]; this.z = d.boat[1]; this.a = d.ang; }
  jump(w) { const d = this.docks[w]; this.moor(w); this.pl.zone = w === 'dak' ? DAK : null; this.pl.pos.set(d.land[0], 0, d.land[1]); this.armed = false; }
  start() {
    const to = this.at === 'city' ? 'dak' : 'city'; this.run = { legs: to === 'dak' ? [this.P1, this.P2] : [this.R2, this.R1], i: 0, s: 0, el: 0, to };
    this.pl.ride = true; this.snd.ship(); this.hud.toast(to === 'dak' ? '<small>FERRY</small>Babughat → Dakshineswar<i>বাবুঘাট → দক্ষিণেশ্বর</i>' : '<small>FERRY</small>Dakshineswar → Babughat<i>দক্ষিণেশ্বর → বাবুঘাট</i>');
  }
  update(dt, t, playing) {
    const pl = this.pl, r = this.run;
    if (r) {
      const L = r.legs[r.i]; r.el += dt; const rem = (r.i ? 0 : r.legs[1].len) + L.len - r.s, v = Math.min(46, 3 + r.el * 7, 4 + rem * .7); r.s += v * dt;
      if (r.i === 0 && L.len - r.s < v) this.fade.classList.add('on');
      if (r.s >= L.len) {
        if (r.i === 0) { r.i = 1; r.s = 0; pl.zone = r.to === 'dak' ? DAK : null; const q = at(r.legs[1], 1); this.a = Math.atan2(-q[3], q[2]); setTimeout(() => this.fade.classList.remove('on'), 400); }
        else { const d = this.docks[r.to]; this.run = null; this.at = r.to; pl.ride = false; pl.pos.set(d.land[0], 0, d.land[1]); pl.vel.set(0, 0, 0); this.armed = false; this.snd.ship(); this.x = d.boat[0]; this.z = d.boat[1]; }
      }
      if (this.run) { const q = at(r.legs[r.i], r.s); this.x = q[0]; this.z = q[1]; this.a += wrap(Math.atan2(-q[3], q[2]) - this.a) * Math.min(1, dt * 1.5); }
    } else if (playing) {
      const d = this.docks[this.at], dist = Math.hypot(pl.pos.x - d.trig[0], pl.pos.z - d.trig[1]);
      if (!this.armed) { if (dist > 9) this.armed = true; } else if (dist < 3.2 && !pl.car) this.start();
    }
    const b = this.boat; b.position.set(this.x, WATER_Y + .9 + Math.sin(t * 1.3) * .05, this.z); b.rotation.set(Math.sin(t * .9) * .012, this.a, 0);
    if (pl.ride) { const c = Math.cos(this.a), s = Math.sin(this.a); pl.pos.set(this.x + 1.6 * c, b.position.y + .1, this.z - 1.6 * s); pl.heading = Math.atan2(c, -s); }
  }
}
