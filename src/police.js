import { makeFigure, animate } from './human.js';
import { resolve } from './collide.js';
import { SEG } from './world.js';
import { COPS } from './data.js';
import * as THREE from 'three';
import { R, M } from './kit.js';
import { Score, PTS } from './score.js';

// Kolkata Police. Officers stand at posts all over the city. Hit a person or a vehicle in a car where an officer within 50 m
// can see it, or steal a car within 20 m of one, and that is a case. The rules are not shown to the player:
//  1-2 cases: officers nearby chase on foot; get 500 m from where the first case happened and they are dropped.
//  3 cases:   every officer you come near chases you, wherever you go, for 5 minutes.
// An officer who reaches you on foot, or reaches your car while it is slow, arrests you.
const $ = id => document.getElementById(id), SEE = 50, ESCAPE = 500, HOT = 300;
export class Police {
  constructor(scene, player, drive, hud, sound) {
    // the lathi, and a pool of 💥 bursts for the beating after an arrest
    this.stick = new THREE.Mesh(new THREE.CylinderGeometry(.022, .026, 1, 6).translate(0, -1.02, .05), M.wood); this.stick.castShadow = true;
    { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '104px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.fillText('💥', 64, 70);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      this.fx = Array.from({ length: 14 }, () => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false })); sp.renderOrder = 99; sp.visible = false; scene.add(sp); return { sp, t: 0, life: 0, s: 1 }; }); }
    this.pl = player; this.dr = drive; this.hud = hud; this.snd = sound; this.wanted = false; this.busted = false; this.cases = 0; this.origin = [0, 0]; this.hot = 0; this.cool = 0; this.tick = 0; this.sir = 0;
    for (const s of SEG) { // street posts at the kerb
      const L = Math.hypot(s.bx - s.ax, s.bz - s.az), tx = (s.bx - s.ax) / L, tz = (s.bz - s.az) / L;
      for (let d = 25 + R() * 60; d < L - 12; d += 100 + R() * 70) { const sd = R() < .5 ? 1 : -1, o = s.w / 2 + 1.1; COPS.posts.push({ x: s.ax + tx * d + tz * sd * o, z: s.az + tz * d - tx * sd * o, ry: Math.atan2(-tz * sd, tx * sd) }); }
    }
    this.o = COPS.posts.map(p => ({ x: p.x, z: p.z, hx: p.x, hz: p.z, ry: p.ry ?? R() * 6, rig: null, chase: false, back: false }));
    this.pool = []; for (let i = 0; i < 14; i++) { const r = makeFigure({ ...COPS.look, skin: ['#8d5a3b', '#a36f48', '#7a4a2e'][i % 3], s: .98 + (i % 3) * .03 }); r.g.visible = false; scene.add(r.g); this.pool.push(r); }
    $('retry').addEventListener('click', e => { e.stopPropagation(); this.release(); window.kkLock?.(); });
  }
  offence(x, z, what, reach = SEE) { // the player's car hit someone or something, or a car was stolen
    if (this.busted || this.pl.ride || this.cool > 0) return;
    if (!this.o.some(o => Math.hypot(o.x - x, o.z - z) < reach)) return;
    this.cool = 1.5; this.cases++; if (this.cases === 1) this.origin = [x, z];
    Score.add(PTS.case, 'কেস খেলে');
    if (this.cases >= 3 && !this.hot) this.hot = HOT;
    this.wanted = true; this.snd.whistle(); this.stars();
    this.hud.toast(`<small>${['', 'CASE 1', 'CASE 2', 'CASE 3'][Math.min(3, this.cases)]} · পুলিশ দেখে ফেলেছে!</small>${what === 'steal' ? 'Police saw you steal a car' : what === 'officer' ? 'You hit a police officer!' : `Police saw you hit a ${what}`}`);
  }
  stars() { const n = Math.min(3, this.cases); document.querySelectorAll('#wanted i').forEach((e, i) => e.classList.toggle('on', i < n)); }
  clear(msg) { if (msg && this.cases > 0) Score.add(PTS.dropped, 'কেস খারিজ'); this.wanted = false; this.cases = 0; this.hot = 0; this.stars(); for (const o of this.o) if (o.chase) { o.chase = false; o.back = true; } if (msg) this.hud.toast(msg); }
  arrest(o) {
    this.busted = true; this.clear(); if (this.pl.car) this.dr.toggle(true); this.pl.held = true; this.pl.keys = {}; this.pl.vel.set(0, 0, 0); this.snd.whistle();
    document.exitPointerLock?.();
    if (!o?.rig) { let bd = 1e9; for (const q of this.o) if (q.rig && !(q.down > 0)) { const d = Math.hypot(q.x - this.pl.pos.x, q.z - this.pl.pos.z); if (d < bd) { bd = d; o = q; } } }
    if (!o?.rig) { document.exitPointerLock?.(); $('busted').classList.add('on'); return; }
    o.chase = false; o.back = false; o.rig.armL.add(this.stick); this.beat = { o, t: 0, hits: 0 }; // the lathi comes out
  }
  burst(x, y, z, n) { // a few 💥 of different sizes around the point
    for (let i = 0; i < n; i++) { const f = this.fx.find(q => q.t >= q.life) || this.fx[0]; f.t = 0; f.life = .45 + Math.random() * .25; f.s = .35 + Math.random() * (i ? .8 : 1.2); f.sp.position.set(x + (Math.random() - .5) * .9, y + (Math.random() - .3) * .7, z + (Math.random() - .5) * .9); f.sp.visible = true; }
  }
  beating(dt) { // the arresting officer strikes with his lathi; the boy flinches, then falls; then the game-over screen
    const b = this.beat, o = b.o, pl = this.pl, p = pl.pos, g = o.rig.g; b.t += dt;
    const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz) || 1;
    if (d > 1) { o.x += dx / d * Math.min(d - 1, 6 * dt); o.z += dz / d * Math.min(d - 1, 6 * dt); }
    g.position.set(o.x, 0, o.z); g.rotation.y = Math.atan2(dx, dz); pl.heading = Math.atan2(-dx, -dz);
    const HIT = .55, ph = (b.t % HIT) / HIT, n = Math.floor(b.t / HIT);
    if (b.hits < 5) { o.rig.armL.rotation.x = ph < .55 ? -2.9 * (ph / .55) : -2.9 + 2.5 * Math.min(1, (ph - .55) / .15); o.rig.body.rotation.x = ph > .55 ? .25 : 0; }
    if (n > b.hits - 1 && b.t > .3 && b.hits < 5 && ph > .7) {
      b.hits++; this.snd.lathi(); this.snd.yelp(p.x, p.z);
      this.burst(p.x, 1.45 - (b.hits > 3 ? .9 : 0), p.z, 2 + (Math.random() * 3 | 0));
      if (b.hits === 5) b.fall = b.t;
    }
    const r = pl.rig; r.body.rotation.x = b.fall ? 0 : (ph > .7 && ph < .9 ? -.25 : 0);
    if (b.fall) { const k = Math.min(1, (b.t - b.fall) / .4); r.g.rotation.x = -Math.PI / 2 * k; r.g.position.y = .14 * k; o.rig.armL.rotation.x = -.4; o.rig.body.rotation.x = 0; }
    if (b.fall && b.t - b.fall > 1.4 && !b.shown) { b.shown = true; document.exitPointerLock?.(); $('busted').classList.add('on'); }
  }

  knock(o, fx, fz) { Score.add(PTS.cop, 'পুলিশ ক্যালানো'); o.down = 6; o.fx = fx; o.fz = fz; this.snd.yelp(o.x, o.z); this.offence(o.x, o.z, 'officer'); }
  hitAt(x, z, fx, fz) { let best = null, bd = .95; for (const o of this.o) { if (!o.rig || o.down > 0) continue; const d = Math.hypot(o.x - x, o.z - z); if (d < bd) { bd = d; best = o; } } if (best) this.knock(best, fx * 2.2, fz * 2.2); return best; }
  carHit(v) { // a moving car knocks down any officer it touches
    const sp = v.sp; if (Math.abs(sp) < 1.5) return 0; const c = Math.cos(v.a), s = Math.sin(v.a); let n = 0;
    for (const o of this.o) {
      if (!o.rig || o.down > 0) continue; const dx = o.x - v.x, dz = o.z - v.z; if (dx * dx + dz * dz > 80) continue;
      const lx = dx * c - dz * s, lz = dx * s + dz * c; if (Math.abs(lx) > v.hl + .3 || Math.abs(lz) > v.hw + .3) continue;
      const side = Math.sign(lz || 1) * 3; this.knock(o, c * sp * .7 + s * side, -s * sp * .7 + c * side); n++;
    }
    return n;
  }
  push(p) { for (const o of this.o) { if (!o.rig || o.down > 0) continue; const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz); if (d < .8 && d > 1e-3) { p.x = o.x + dx / d * .8; p.z = o.z + dz / d * .8; } } }
  release() { // start again outside Lalbazar
    if (this.beat) { const r = this.pl.rig; r.g.rotation.x = 0; r.g.position.y = 0; this.beat.o.rig?.armL.remove(this.stick); if (this.beat.o.rig) this.beat.o.rig.body.rotation.x = 0; this.beat = null; }
    const h = COPS.hq || [this.pl.pos.x, this.pl.pos.z]; this.busted = false; this.pl.held = false; this.pl.pos.set(h[0], 0, h[1]); $('busted').classList.remove('on');
    for (const o of this.o) { o.back = false; o.x = o.hx; o.z = o.hz; }
  }
  update(dt) {
    for (const f of this.fx) if (f.sp.visible) { f.t += dt; const k = f.t / f.life; if (k >= 1) f.sp.visible = false; else { f.sp.scale.setScalar(f.s * (.45 + .75 * Math.min(1, k * 3))); f.sp.material.opacity = 1 - k * k; } }
    if (this.beat) { this.beating(dt); return; }
    const pl = this.pl, p = pl.pos, car = pl.car; if (this.cool > 0) this.cool -= dt;
    if ((this.tick -= dt) < 0) { // hand the few animated figures to the officers nearest the player
      this.tick = .4;
      for (const o of this.o) {
        const d = Math.hypot(o.x - p.x, o.z - p.z);
        if (o.rig && d > 175 && !o.chase) { o.down = 0; o.rig.g.rotation.x = 0; o.rig.g.visible = false; this.pool.push(o.rig); o.rig = null; o.back = false; o.x = o.hx; o.z = o.hz; }
        else if (!o.rig && d < 150 && this.pool.length) { o.rig = this.pool.pop(); o.rig.g.visible = true; }
      }
    }
    for (const o of this.o) {
      if (!o.rig) continue; const g = o.rig.g, dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz) || 1;
      if (o.down > 0) { // knocked over: flung, lies a while, then gets up and comes after you
        o.down -= dt; o.x += o.fx * dt; o.z += o.fz * dt; const q = 1 - Math.min(1, 3.5 * dt); o.fx *= q; o.fz *= q;
        const k = o.down <= 0 ? 0 : o.down < 1.2 ? o.down / 1.2 : Math.min(1, (6 - o.down) * 5); g.rotation.x = -Math.PI / 2 * k; g.position.set(o.x, .14 * k, o.z);
        if (o.down <= 0) { g.rotation.x = 0; if (!o.chase) o.back = true; } continue;
      }
      if (this.wanted && !o.chase && (this.hot || d < 60) && !pl.ride) { o.chase = true; o.back = false; }
      if (o.chase) {
        if ((!this.hot && d > 140) || pl.ride) { o.chase = false; o.back = true; }
        else {
          const sp = 8.3; o.x += dx / d * sp * dt; o.z += dz / d * sp * dt; resolve(o, .4); g.rotation.y = Math.atan2(dx, dz); animate(o.rig, sp, dt);
          if (car) { const c = Math.cos(car.a), s = Math.sin(car.a), lx = -dx * c + dz * s, lz = -dx * s - dz * c; if (Math.abs(car.sp) < 6 && Math.abs(lx) < car.hl + 1 && Math.abs(lz) < car.hw + 1) this.arrest(o); }
          else if (d < 1.3) this.arrest(o);
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
