import { makeFigure, animate } from './human.js';
import { resolve } from './collide.js';
import { SEG } from './world.js';
import { COPS } from './data.js';
import { R } from './kit.js';

// Kolkata Police. Officers stand at posts all over the city. Hit a person or a vehicle with a car where an officer
// within 50 m can see it and you are wanted: officers chase on foot and arrest you. Get 500 m clear and the case is dropped.
const $ = id => document.getElementById(id), SEE = 50, ESCAPE = 500;
export class Police {
  constructor(scene, player, drive, hud, sound) {
    this.pl = player; this.dr = drive; this.hud = hud; this.snd = sound; this.wanted = false; this.busted = false; this.cases = 0; this.seen = [0, 0]; this.tick = 0; this.sir = 0;
    for (const s of SEG) { // street posts at the kerb
      const L = Math.hypot(s.bx - s.ax, s.bz - s.az), tx = (s.bx - s.ax) / L, tz = (s.bz - s.az) / L;
      for (let d = 25 + R() * 60; d < L - 12; d += 100 + R() * 70) { const sd = R() < .5 ? 1 : -1, o = s.w / 2 + 1.1; COPS.posts.push({ x: s.ax + tx * d + tz * sd * o, z: s.az + tz * d - tx * sd * o, ry: Math.atan2(-tz * sd, tx * sd) }); }
    }
    this.o = COPS.posts.map(p => ({ x: p.x, z: p.z, hx: p.x, hz: p.z, ry: p.ry ?? R() * 6, rig: null, chase: false, back: false }));
    this.pool = []; for (let i = 0; i < 14; i++) { const r = makeFigure({ ...COPS.look, skin: ['#8d5a3b', '#a36f48', '#7a4a2e'][i % 3], s: .98 + (i % 3) * .03 }); r.g.visible = false; scene.add(r.g); this.pool.push(r); }
    $('retry').addEventListener('click', () => this.release());
  }
  offence(x, z, what) { // called when the player's car hits someone or something
    if (this.busted || this.pl.ride) return;
    if (!this.o.some(o => Math.hypot(o.x - x, o.z - z) < SEE)) return;
    this.cases++; this.seen = [x, z];
    if (!this.wanted) { this.wanted = true; this.snd.whistle(); this.hud.toast(`<small>WANTED · পুলিশ দেখে ফেলেছে!</small>Police saw you hit a ${what}<i>Get 500 m away to drop the case — or be arrested</i>`); }
  }
  clear(msg) { this.wanted = false; this.cases = 0; $('wanted').textContent = ''; for (const o of this.o) if (o.chase) { o.chase = false; o.back = true; } if (msg) this.hud.toast(msg); }
  arrest() {
    this.busted = true; this.clear(); if (this.pl.car) this.dr.toggle(true); this.pl.held = true; this.pl.keys = {}; this.pl.vel.set(0, 0, 0); this.snd.whistle();
    document.exitPointerLock?.(); $('busted').classList.add('on');
  }
  release() { // start again outside Lalbazar
    const h = COPS.hq || [this.pl.pos.x, this.pl.pos.z]; this.busted = false; this.pl.held = false; this.pl.pos.set(h[0], 0, h[1]); $('busted').classList.remove('on');
    for (const o of this.o) { o.back = false; o.x = o.hx; o.z = o.hz; }
  }
  update(dt) {
    const pl = this.pl, p = pl.pos, car = pl.car;
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
      if (this.wanted && !o.chase && d < 60 && !pl.ride) { o.chase = true; o.back = false; }
      if (o.chase) {
        if (d > 140 || pl.ride) { o.chase = false; o.back = true; }
        else {
          const sp = 8.3; o.x += dx / d * sp * dt; o.z += dz / d * sp * dt; resolve(o, .4); g.rotation.y = Math.atan2(dx, dz); animate(o.rig, sp, dt);
          if (d < SEE) this.seen = [p.x, p.z];
          if (car) { const c = Math.cos(car.a), s = Math.sin(car.a), lx = -dx * c + dz * s, lz = -dx * s - dz * c; if (Math.abs(car.sp) < 6 && Math.abs(lx) < car.hl + 1 && Math.abs(lz) < car.hw + 1) this.arrest(); }
          else if (d < 1.3) this.arrest();
        }
      } else if (o.back) {
        const bx = o.hx - o.x, bz = o.hz - o.z, bd = Math.hypot(bx, bz); if (bd < .5) o.back = false; else { o.x += bx / bd * 2.2 * dt; o.z += bz / bd * 2.2 * dt; g.rotation.y = Math.atan2(bx, bz); animate(o.rig, 2.2, dt); }
      } else { g.rotation.y = d < 22 ? Math.atan2(dx, dz) : o.ry; animate(o.rig, 0, dt); } // on duty: they watch you go by
      g.position.set(o.x, 0, o.z);
    }
    if (this.wanted) {
      const esc = Math.hypot(p.x - this.seen[0], p.z - this.seen[1]);
      if (pl.ride || esc > ESCAPE) this.clear('<small>CASE DROPPED · মামলা খারিজ</small>You lost the police');
      else { $('wanted').textContent = `★ WANTED · ${this.cases} case${this.cases > 1 ? 's' : ''} · ${Math.round(esc)} m / ${ESCAPE} m`; if ((this.sir -= dt) < 0) { this.sir = .5; this.snd.siren(); } }
    }
  }
}
