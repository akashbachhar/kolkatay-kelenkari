import { makeFigure, animate } from './human.js';
import { resolve } from './collide.js';
import { SEG } from './world.js';
import { COPS } from './data.js';
import { R } from './kit.js';

// Kolkata Police. Officers stand at posts all over the city. Hit a person or a vehicle in a car where an officer within 50 m
// can see it, or steal a car within 20 m of one, and that is a case. The rules are not shown to the player:
//  1-2 cases: officers nearby chase on foot; get 500 m from where the first case happened and they are dropped.
//  3 cases:   every officer you come near chases you, wherever you go, for 5 minutes.
// An officer who reaches you on foot, or reaches your car while it is slow, arrests you.
const $ = id => document.getElementById(id), SEE = 50, ESCAPE = 500, HOT = 300;
export class Police {
  constructor(scene, player, drive, hud, sound) {
    this.pl = player; this.dr = drive; this.hud = hud; this.snd = sound; this.wanted = false; this.busted = false; this.cases = 0; this.origin = [0, 0]; this.hot = 0; this.cool = 0; this.tick = 0; this.sir = 0;
    for (const s of SEG) { // street posts at the kerb
      const L = Math.hypot(s.bx - s.ax, s.bz - s.az), tx = (s.bx - s.ax) / L, tz = (s.bz - s.az) / L;
      for (let d = 25 + R() * 60; d < L - 12; d += 100 + R() * 70) { const sd = R() < .5 ? 1 : -1, o = s.w / 2 + 1.1; COPS.posts.push({ x: s.ax + tx * d + tz * sd * o, z: s.az + tz * d - tx * sd * o, ry: Math.atan2(-tz * sd, tx * sd) }); }
    }
    this.o = COPS.posts.map(p => ({ x: p.x, z: p.z, hx: p.x, hz: p.z, ry: p.ry ?? R() * 6, rig: null, chase: false, back: false }));
    this.pool = []; for (let i = 0; i < 14; i++) { const r = makeFigure({ ...COPS.look, skin: ['#8d5a3b', '#a36f48', '#7a4a2e'][i % 3], s: .98 + (i % 3) * .03 }); r.g.visible = false; scene.add(r.g); this.pool.push(r); }
    $('retry').addEventListener('click', () => this.release());
  }
  offence(x, z, what, reach = SEE) { // the player's car hit someone or something, or a car was stolen
    if (this.busted || this.pl.ride || this.cool > 0) return;
    if (!this.o.some(o => Math.hypot(o.x - x, o.z - z) < reach)) return;
    this.cool = 1.5; this.cases++; if (this.cases === 1) this.origin = [x, z];
    if (this.cases >= 3 && !this.hot) this.hot = HOT;
    this.wanted = true; this.snd.whistle(); this.stars();
    this.hud.toast(`<small>${['', 'CASE 1', 'CASE 2', 'CASE 3'][Math.min(3, this.cases)]} · পুলিশ দেখে ফেলেছে!</small>${what === 'steal' ? 'Police saw you steal a car' : `Police saw you hit a ${what}`}`);
  }
  stars() { const n = Math.min(3, this.cases); document.querySelectorAll('#wanted i').forEach((e, i) => e.classList.toggle('on', i < n)); }
  clear(msg) { this.wanted = false; this.cases = 0; this.hot = 0; this.stars(); for (const o of this.o) if (o.chase) { o.chase = false; o.back = true; } if (msg) this.hud.toast(msg); }
  arrest() {
    this.busted = true; this.clear(); if (this.pl.car) this.dr.toggle(true); this.pl.held = true; this.pl.keys = {}; this.pl.vel.set(0, 0, 0); this.snd.whistle();
    document.exitPointerLock?.(); $('busted').classList.add('on');
  }
  release() { // start again outside Lalbazar
    const h = COPS.hq || [this.pl.pos.x, this.pl.pos.z]; this.busted = false; this.pl.held = false; this.pl.pos.set(h[0], 0, h[1]); $('busted').classList.remove('on');
    for (const o of this.o) { o.back = false; o.x = o.hx; o.z = o.hz; }
  }
  update(dt) {
    const pl = this.pl, p = pl.pos, car = pl.car; if (this.cool > 0) this.cool -= dt;
    if ((this.tick -= dt) < 0) { // hand the few animated figures to the officers nearest the player
      this.tick = .4;
      for (const o of this.o) {
        const d = Math.hypot(o.x - p.x, o.z - p.z);
        if (o.rig && d > 175 && !o.chase) { o.rig.g.visible = false; this.pool.push(o.rig); o.rig = null; o.back = false; o.x = o.hx; o.z = o.hz; }
        else if (!o.rig && d < 150 && this.pool.length) { o.rig = this.pool.pop(); o.rig.g.visible = true; }
      }
    }
    for (const o of this.o) {
      if (!o.rig) continue; const g = o.rig.g, dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz) || 1;
      if (this.wanted && !o.chase && (this.hot || d < 60) && !pl.ride) { o.chase = true; o.back = false; }
      if (o.chase) {
        if ((!this.hot && d > 140) || pl.ride) { o.chase = false; o.back = true; }
        else {
          const sp = 8.3; o.x += dx / d * sp * dt; o.z += dz / d * sp * dt; resolve(o, .4); g.rotation.y = Math.atan2(dx, dz); animate(o.rig, sp, dt);
          if (car) { const c = Math.cos(car.a), s = Math.sin(car.a), lx = -dx * c + dz * s, lz = -dx * s - dz * c; if (Math.abs(car.sp) < 6 && Math.abs(lx) < car.hl + 1 && Math.abs(lz) < car.hw + 1) this.arrest(); }
          else if (d < 1.3) this.arrest();
        }
      } else if (o.back) {
        const bx = o.hx - o.x, bz = o.hz - o.z, bd = Math.hypot(bx, bz); if (bd < .5) o.back = false; else { o.x += bx / bd * 2.2 * dt; o.z += bz / bd * 2.2 * dt; g.rotation.y = Math.atan2(bx, bz); animate(o.rig, 2.2, dt); }
      } else { g.rotation.y = d < 22 ? Math.atan2(dx, dz) : o.ry; animate(o.rig, 0, dt); } // on duty: they watch you go by
      g.position.set(o.x, 0, o.z);
    }
    if (this.wanted) {
      if (pl.ride) this.clear('<small>ফেরি · FERRY</small>The police lost you');
      else if (this.hot) { if ((this.hot -= dt) <= 0) this.clear('<small>মামলা খারিজ</small>The police gave up'); }
      else if (Math.hypot(p.x - this.origin[0], p.z - this.origin[1]) > ESCAPE) this.clear('<small>মামলা খারিজ</small>The police lost you');
      if (this.wanted && (this.sir -= dt) < 0) { this.sir = .5; this.snd.siren(); }
    }
  }
}
