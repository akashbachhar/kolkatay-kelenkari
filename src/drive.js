import * as THREE from 'three';
import { resolve, solid } from './collide.js';
import { bankX, BRIDGE as B, X1, Z0, Z1 } from './data.js';
import { POLES } from './world.js';
import { makeFigure, look } from './human.js';

// Take any taxi or bus and drive it. E/F enter or leave, W/S throttle and reverse, A/D steer, Space brake, V view, H horn.
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a)), $ = id => document.getElementById(id), UP = new THREE.Vector3(0, 1, 0), O3 = new THREE.Object3D(), V3 = new THREE.Vector3();
const NAME = { 0: 'Yellow taxi', 1: 'Bus', 4: 'Double-decker bus' };

function confine(p) { // the same limits as on foot: river, bridge deck, city edge
  let hit = false; const bx = bankX(p.z) + 2;
  if (p.x < bx) {
    const ax = p.x - B.x, az = p.z - B.z, sn = Math.sin(B.ry), cs = Math.cos(B.ry), a = ax * B.dx + az * B.dz, l = ax * sn + az * cs;
    if (a > -4 && a < B.end + 1 && Math.abs(l) < 9) {
      if (a > B.end - 3) { p.x -= B.dx * (a - B.end + 3); p.z -= B.dz * (a - B.end + 3); hit = true; }
      if (Math.abs(l) > 6.4) { const e = l - Math.sign(l) * 6.4; p.x -= sn * e; p.z -= cs * e; hit = true; }
    } else { p.x = bx; hit = true; }
  }
  if (p.x > X1 - 120) { p.x = X1 - 120; hit = true; } if (p.z < Z0 + 60) { p.z = Z0 + 60; hit = true; } if (p.z > Z1 - 50) { p.z = Z1 - 50; hit = true; }
  return hit;
}

export class Drive {
  constructor(player, traffic, sound, hud, camera, people) {
    this.pl = player; this.tr = traffic; this.snd = sound; this.hud = hud; this.cam = camera; this.pp = people; this.v = null; this.near = null; this.fp = false; this.st = 0; this.look = 0; this.n = 0; this.playing = false; this.shake = 0;
    // the drivers who get turned out of their cabs
    this.dr = []; this.di = 0; for (let i = 0; i < 4; i++) { const r = makeFigure({ ...look(Math.random, false), top: '#b9a77a', bottom: '#3d3a33', full: true }); r.g.visible = false; player.root.parent.add(r.g); this.dr.push(r); }
    addEventListener('keydown', e => { if (e.repeat || !this.playing) return; if (e.code === 'KeyE' || e.code === 'KeyF') this.toggle(); if (e.code === 'KeyV') this.view(); if (e.code === 'KeyH' && this.v) this.snd.horn(this.v.x, this.v.z, this.v.k ? 1 : 0, 1.6); });
    addEventListener('mousemove', () => { this.look = 1.6; }); addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') this.look = 1.2; });
    const btn = (id, fn) => $(id)?.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
    btn('bCar', () => this.toggle()); btn('bView', () => this.view());
  }
  view() { if (this.v) { this.fp = !this.fp; this.hud.toast(this.fp ? '<small>VIEW</small>First person' : '<small>VIEW</small>Third person'); } }
  find() { // nearest taxi or bus within reach
    const p = this.pl.pos; let best = null, bd = 2.4;
    for (const v of this.tr.v) {
      if (v.k === 2 || v.k === 3) continue; const dx = p.x - v.x, dz = p.z - v.z; if (dx * dx + dz * dz > 100) continue;
      const c = Math.cos(v.a), s = Math.sin(v.a), lx = dx * c - dz * s, lz = dx * s + dz * c, d = Math.hypot(Math.max(0, Math.abs(lx) - v.hl), Math.max(0, Math.abs(lz) - v.hw));
      if (d < bd) { bd = d; best = v; }
    }
    return best;
  }
  toggle(force) {
    const pl = this.pl; if (pl.ride || pl.held || (force && !this.v)) return;
    if (!this.v) {
      const v = this.find(); if (!v) return;
      const fx = Math.cos(v.a), fz = -Math.sin(v.a), rx = Math.sin(v.a), rz = Math.cos(v.a), had = !v.own;
      if (had) { // the driver is turned out and stands by his door, shaking his fist
        const r = this.dr[this.di++ % this.dr.length], off = v.hw + 1.1, fo = v.k ? 3.6 : .3; r.g.visible = true; r.g.position.set(v.x + rx * off + fx * fo, 0, v.z + rz * off + fz * fo); r.t = 0; r.car = v; this.snd.yelp(v.x, v.z); this.police?.offence(v.x, v.z, 'steal', 20);
      }
      this.v = v; v.own = true; v.me = true; v.sp = Math.max(-2, Math.min(3, v.sp)); v.kt = 0; pl.car = v; pl.root.visible = false; this.d0 = pl.dist; pl.dist = Math.max(pl.dist, v.k ? 15 : 8.5); pl.pitch = Math.max(pl.pitch, v.k === 4 ? .3 : .2); this.look = 0; this.st = 0;
      document.body.classList.add('driving'); if ($('bJump')) $('bJump').textContent = 'BRAKE';
      this.hud.toast(`<small>DRIVING · ${NAME[v.k].toUpperCase()}</small>${had ? 'এই! আমার গাড়ি!' : NAME[v.k]}<i>E exit · V view · Space brake · H horn</i>`);
    } else {
      const v = this.v; if (!force && Math.abs(v.sp) > 3) { this.hud.toast('<small>TOO FAST</small>Brake first, then get out', 1); return; }
      const fx = Math.cos(v.a), fz = -Math.sin(v.a); let ex = null;
      for (const s of [1, -1]) { const x = v.x - fz * s * (v.hw + .9), z = v.z + fx * s * (v.hw + .9); if (!solid(x, 1, z)) { ex = [x, z]; break; } }
      if (!ex) ex = [v.x - fx * (v.hl + .9), v.z - fz * (v.hl + .9)];
      v.sp = 0; v.me = false; v.roll = 0; this.v = null; pl.car = null; pl.pos.set(ex[0], 0, ex[1]); pl.vel.set(0, 0, 0); pl.root.visible = true; pl.dist = this.d0; pl.heading = Math.atan2(fx, fz); this.fp = false;
      document.body.classList.remove('driving'); if ($('bJump')) $('bJump').textContent = 'JUMP'; this.snd.engine(false); $('speed').textContent = '';
    }
  }
  update(dt) {
    const pl = this.pl, v = this.v;
    for (const r of this.dr) if (r.g.visible) { // turned-out drivers: angry at first, then resigned
      r.t += dt; const mad = r.t < 7 ? 1 : 0, c = this.v || r.car; r.g.rotation.y = Math.atan2(c.x - r.g.position.x, c.z - r.g.position.z);
      r.armR.rotation.x = mad * (-2.5 + Math.sin(r.t * 11) * .35); r.armL.rotation.x = mad * (-.9 + Math.sin(r.t * 7) * .2);
    }
    if (!v) { if (this.n++ % 8 === 0) { const nr = this.playing && !pl.ride ? this.find() : null; if (nr !== this.near) { this.near = nr; document.body.classList.toggle('nearcar', !!nr); $('hint').textContent = nr ? `E — drive the ${NAME[nr.k].toLowerCase()}` : ''; } } return; }
    if (this.near) { this.near = null; document.body.classList.remove('nearcar'); $('hint').textContent = ''; }
    const k = pl.keys, thr = Math.max(-1, Math.min(1, (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) - pl.joy.y)), sr = Math.max(-1, Math.min(1, (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0) + pl.joy.x)), brake = !!k.Space, max = v.k === 4 ? 13 : v.k ? 15 : 25;
    if (brake) { if (Math.abs(v.sp) > 9 && !this.sk) { this.sk = 1; this.snd.skid(); } v.sp -= Math.sign(v.sp) * Math.min(Math.abs(v.sp), 28 * dt); }
    else if (thr > .05) v.sp += (v.sp < 0 ? 24 : 9 * (1 - v.sp / max)) * thr * dt;
    else if (thr < -.05) v.sp += (v.sp > 0 ? 24 : 6 * (1 + v.sp / 7)) * thr * dt;
    if (!brake || Math.abs(v.sp) < 2) this.sk = 0;
    v.sp -= v.sp * (Math.abs(thr) > .05 ? .12 : .5) * dt; if (Math.abs(thr) < .05 && Math.abs(v.sp) < .25) v.sp = 0;
    this.st += (sr - this.st) * Math.min(1, dt * 7);
    v.a -= this.st * (v.k ? 1.1 : 1.9) / (1 + Math.abs(v.sp) * .055) * Math.max(-1, Math.min(1, v.sp / 4)) * dt;
    v.roll = this.st * Math.min(1, Math.abs(v.sp) / 14) * (v.k ? .035 : .06);
    const fx = Math.cos(v.a), fz = -Math.sin(v.a), sp0 = v.sp, dir = Math.sign(sp0) || 1; v.x += fx * v.sp * dt; v.z += fz * v.sp * dt;
    // --- collisions: walls and trees, other vehicles, the river and city edge
    let px = 0, pz = 0;
    for (const d of [v.hl * .8, 0, -v.hl * .8]) { const q = { x: v.x + px + fx * d, z: v.z + pz + fz * d }, ox = q.x, oz = q.z; resolve(q, v.hw + .15); px += q.x - ox; pz += q.z - oz; }
    const b = this.tr.bump(v), veh = !!(b[0] || b[1]); px += b[0]; pz += b[1];
    const c = { x: v.x + px, z: v.z + pz }; if (confine(c)) { px = c.x - v.x; pz = c.z - v.z; }
    v.x += px; v.z += pz; const pen = Math.hypot(px, pz);
    if (pen > 1e-3) {
      const back = -(px * fx + pz * fz) * dir / pen, imp = Math.abs(sp0) * Math.max(0, back); // back = 1 for a head-on hit
      if (veh && Math.abs(sp0) > 2.5) this.police?.offence(v.x, v.z, 'vehicle');
      if (back > .35) { if (imp > 3) { this.snd.crash(Math.min(1, imp / 16), veh); this.shake = Math.min(.6, imp * .035); } v.sp = imp > 3 ? -sp0 * .18 : sp0 * .4; }
      else { v.sp *= 1 - Math.min(1, 2.5 * dt); if (Math.abs(sp0) > 5) this.snd.scrape(); }
    }
    // --- lamp posts: knocked flat at speed, solid otherwise
    const ca = Math.cos(v.a), sa = Math.sin(v.a), L = POLES.list;
    for (let i = 0; i < L.length; i++) {
      const p = L[i]; if (p.down) continue; const dx = p.x - v.x, dz = p.z - v.z; if (dx * dx + dz * dz > 40) continue;
      if (Math.abs(dx * ca - dz * sa) > v.hl + .15 || Math.abs(dx * sa + dz * ca) > v.hw + .15) continue;
      if (Math.abs(v.sp) > 4) { p.down = true; O3.position.set(p.x, .12, p.z); O3.quaternion.setFromUnitVectors(UP, V3.set(fx * dir + (Math.random() - .5) * .5, .06, fz * dir + (Math.random() - .5) * .5).normalize()); O3.updateMatrix(); POLES.im.setMatrixAt(i, O3.matrix); POLES.im.instanceMatrix.needsUpdate = true; this.snd.clang(); this.snd.crash(.4, true); this.shake = .3; v.sp *= .7; }
      else { v.x -= fx * dir * .12; v.z -= fz * dir * .12; v.sp = 0; }
    }
    // --- people
    if (this.pp.carHit(v, this.snd)) { this.police?.offence(v.x, v.z, 'person'); v.sp *= .93; this.shake = Math.max(this.shake, .15); }
    pl.pos.set(v.x, 0, v.z); pl.heading = Math.atan2(fx, fz);
    // the chase camera swings round behind the car unless you are looking about
    if ((this.look -= dt) < 0) pl.yaw += wrap(Math.atan2(-fx, -fz) - pl.yaw) * Math.min(1, dt * (1 + Math.min(3, Math.abs(v.sp) * .3))) * (Math.abs(v.sp) > .5 || this.fp ? 1 : 0);
    this.snd.engine(true, Math.abs(v.sp), Math.abs(thr));
    if (this.n++ % 6 === 0) $('speed').textContent = Math.round(Math.abs(v.sp) * 3.2) + ' km/h' + (v.sp < -.3 ? ' · R' : '');
  }
  camera() {
    const v = this.v, c = this.cam; if (!v) return;
    if (this.fp) { // first person: from the driver's seat, looking where the mouse or thumb points
      const pl = this.pl, fx = Math.cos(v.a), fz = -Math.sin(v.a), o = v.k ? 5 : 1.08, h = v.k ? 2.2 : 1.46;
      c.position.set(v.x + fx * o, h, v.z + fz * o); const cp = Math.cos(pl.pitch - .2);
      c.lookAt(c.position.x - Math.sin(pl.yaw) * cp * 10, h - Math.sin(pl.pitch - .2) * 10, c.position.z - Math.cos(pl.yaw) * cp * 10);
    }
    if (this.shake > .01) { c.position.x += (Math.random() - .5) * this.shake; c.position.y += (Math.random() - .5) * this.shake * .6; c.position.z += (Math.random() - .5) * this.shake; this.shake *= .86; }
  }
}
