import { resolve, solid } from './collide.js';
import { bankX, BRIDGE as B, X1, Z0, Z1 } from './data.js';

// Take any taxi or bus and drive it. E/F enter or leave, W/S throttle and reverse, A/D steer, Space brake, V view, H horn.
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a)), $ = id => document.getElementById(id);

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
  constructor(player, traffic, sound, hud, camera) {
    this.pl = player; this.tr = traffic; this.snd = sound; this.hud = hud; this.cam = camera; this.v = null; this.near = null; this.fp = false; this.st = 0; this.look = 0; this.n = 0; this.playing = false;
    addEventListener('keydown', e => { if (e.repeat || !this.playing) return; if (e.code === 'KeyE' || e.code === 'KeyF') this.toggle(); if (e.code === 'KeyV') this.view(); if (e.code === 'KeyH' && this.v) this.snd.horn(this.v.x, this.v.z, this.v.k, 1.6); });
    addEventListener('mousemove', () => { this.look = 1.6; }); addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') this.look = 1.2; });
    const btn = (id, fn) => $(id)?.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
    btn('bCar', () => this.toggle()); btn('bView', () => this.view());
  }
  view() { if (this.v) { this.fp = !this.fp; this.hud.toast(this.fp ? '<small>VIEW</small>First person' : '<small>VIEW</small>Third person'); } }
  find() { // nearest taxi or bus within reach
    const p = this.pl.pos; let best = null, bd = 2.4;
    for (const v of this.tr.v) {
      if (v.k > 1) continue; const dx = p.x - v.x, dz = p.z - v.z; if (dx * dx + dz * dz > 100) continue;
      const c = Math.cos(v.a), s = Math.sin(v.a), lx = dx * c - dz * s, lz = dx * s + dz * c, d = Math.hypot(Math.max(0, Math.abs(lx) - v.hl), Math.max(0, Math.abs(lz) - v.hw));
      if (d < bd) { bd = d; best = v; }
    }
    return best;
  }
  toggle() {
    const pl = this.pl; if (pl.ride) return;
    if (!this.v) {
      const v = this.find(); if (!v) return;
      this.v = v; v.own = true; pl.car = v; pl.root.visible = false; this.d0 = pl.dist; pl.dist = Math.max(pl.dist, v.k ? 14 : 8.5); pl.pitch = Math.max(pl.pitch, .2); this.look = 0; this.st = 0;
      document.body.classList.add('driving'); if ($('bJump')) $('bJump').textContent = 'BRAKE'; this.hud.toast(v.k ? '<small>DRIVING</small>Bus<i>E exit · V view · Space brake · H horn</i>' : '<small>DRIVING</small>Yellow taxi<i>E exit · V view · Space brake · H horn</i>');
    } else {
      const v = this.v; if (Math.abs(v.sp) > 3) { this.hud.toast('<small>TOO FAST</small>Brake first, then get out', 1); return; }
      const fx = Math.cos(v.a), fz = -Math.sin(v.a); let ex = null;
      for (const s of [1, -1]) { const x = v.x - fz * s * (v.hw + .9), z = v.z + fx * s * (v.hw + .9); if (!solid(x, 1, z)) { ex = [x, z]; break; } }
      if (!ex) ex = [v.x - fx * (v.hl + .9), v.z - fz * (v.hl + .9)];
      v.sp = 0; this.v = null; pl.car = null; pl.pos.set(ex[0], 0, ex[1]); pl.vel.set(0, 0, 0); pl.root.visible = true; pl.dist = this.d0; pl.heading = Math.atan2(fx, fz); this.fp = false;
      document.body.classList.remove('driving'); if ($('bJump')) $('bJump').textContent = 'JUMP'; this.snd.engine(false); $('speed').textContent = '';
    }
  }
  update(dt) {
    const pl = this.pl, v = this.v;
    if (!v) { if (this.n++ % 8 === 0) { const nr = this.playing && !pl.ride ? this.find() : null; if (nr !== this.near) { this.near = nr; document.body.classList.toggle('nearcar', !!nr); $('hint').textContent = nr ? (nr.k ? 'E — drive the bus' : 'E — drive the taxi') : ''; } } return; }
    if (this.near) { this.near = null; document.body.classList.remove('nearcar'); $('hint').textContent = ''; }
    const k = pl.keys, thr = Math.max(-1, Math.min(1, (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) - pl.joy.y)), sr = Math.max(-1, Math.min(1, (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0) + pl.joy.x)), brake = !!k.Space, max = v.k ? 15 : 25;
    if (brake) { if (Math.abs(v.sp) > 9 && !this.sk) { this.sk = 1; this.snd.skid(); } v.sp -= Math.sign(v.sp) * Math.min(Math.abs(v.sp), 28 * dt); }
    else if (thr > .05) v.sp += (v.sp < 0 ? 24 : 9 * (1 - v.sp / max)) * thr * dt;
    else if (thr < -.05) v.sp += (v.sp > 0 ? 24 : 6 * (1 + v.sp / 7)) * thr * dt;
    if (!brake || Math.abs(v.sp) < 2) this.sk = 0;
    v.sp -= v.sp * (Math.abs(thr) > .05 ? .12 : .5) * dt; if (Math.abs(thr) < .05 && Math.abs(v.sp) < .25) v.sp = 0;
    this.st += (sr - this.st) * Math.min(1, dt * 7);
    v.a -= this.st * (v.k ? 1.1 : 1.9) / (1 + Math.abs(v.sp) * .055) * Math.max(-1, Math.min(1, v.sp / 4)) * dt;
    const fx = Math.cos(v.a), fz = -Math.sin(v.a); v.x += fx * v.sp * dt; v.z += fz * v.sp * dt;
    let hit = 0;
    for (const d of [v.hl * .8, 0, -v.hl * .8]) { // probe points along the body against buildings, trees and other vehicles
      const q = { x: v.x + fx * d, z: v.z + fz * d }, ox = q.x, oz = q.z; resolve(q, v.hw + .15); this.tr.push(q, v.hw + .15, v);
      const dx = q.x - ox, dz = q.z - oz; if (dx || dz) { v.x += dx; v.z += dz; hit = Math.max(hit, Math.hypot(dx, dz)); }
    }
    const c = { x: v.x, z: v.z }; if (confine(c)) { v.x = c.x; v.z = c.z; hit = Math.max(hit, .1); }
    if (hit > .01) { if (Math.abs(v.sp) > 6) this.snd.thud(); v.sp *= hit > .08 ? .25 : .8; }
    pl.pos.set(v.x, 0, v.z); pl.heading = Math.atan2(fx, fz);
    // the chase camera swings round behind the car unless you are looking about
    if ((this.look -= dt) < 0) pl.yaw += wrap(Math.atan2(-fx, -fz) - pl.yaw) * Math.min(1, dt * (1 + Math.min(3, Math.abs(v.sp) * .3))) * (Math.abs(v.sp) > .5 || this.fp ? 1 : 0);
    this.snd.engine(true, Math.abs(v.sp), Math.abs(thr));
    if (this.n++ % 6 === 0) $('speed').textContent = Math.round(Math.abs(v.sp) * 3.2) + ' km/h' + (v.sp < -.3 ? ' · R' : '');
  }
  camera() { // first person: from the bonnet, looking where the mouse or thumb points
    const v = this.v; if (!v || !this.fp) return;
    const pl = this.pl, fx = Math.cos(v.a), fz = -Math.sin(v.a), o = v.k ? 5 : 1.08, h = v.k ? 2.2 : 1.46, c = this.cam;
    c.position.set(v.x + fx * o, h, v.z + fz * o); const cp = Math.cos(pl.pitch - .2);
    c.lookAt(c.position.x - Math.sin(pl.yaw) * cp * 10, h - Math.sin(pl.pitch - .2) * 10, c.position.z - Math.cos(pl.yaw) * cp * 10);
  }
}
