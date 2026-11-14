import * as THREE from 'three';
import { resolve, solid } from './collide.js';
import { bankX, BRIDGE as B, X1, Z0, Z1, RACE } from './data.js';
import { POLES } from './world.js';
import { M } from './kit.js';
import { makeFigure, look } from './human.js';
import { ICON } from './touch.js';
import { Score, PTS } from './score.js';

// Take any taxi or bus and drive it. E/F enter or leave, W/S throttle and reverse, A/D steer, Space brake, V view, H horn.
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a)), $ = id => document.getElementById(id), UP = new THREE.Vector3(0, 1, 0), O3 = new THREE.Object3D(), V3 = new THREE.Vector3();
const NAME = { 0: 'Yellow taxi', 1: 'Bus', 4: 'Double-decker bus', 5: 'Motorbike' }, BIG = v => v.k === 1 || v.k === 4;

function confine(p) { // the same limits as on foot: river, bridge deck, city edge; and no cars inside the race course
  let hit = false;
  if (RACE.a) { const ex = (p.x - RACE.x) / RACE.a, ez = (p.z - RACE.z) / RACE.b, r = Math.hypot(ex, ez); if (r < 1 && r > 1e-4) { p.x = RACE.x + ex / r * RACE.a; p.z = RACE.z + ez / r * RACE.b; hit = true; } } const bx = bankX(p.z) + 2;
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

// cockpits for first-person driving, in vehicle space (x forward, z to the driver's right side)
function cockpits(scene) {
  const out = {}, mk = (k, o) => {
    const g = new THREE.Group(), add = (mat, geo, x, y, z) => { const me = new THREE.Mesh(geo, mat); me.position.set(x, y, z); g.add(me); return me; }, box = (mat, w, h, d, x, y, z) => add(mat, new THREE.BoxGeometry(w, h, d), x, y, z);
    box(M.dark, o.dash[3], o.dash[4], o.dash[5], o.dash[0], o.dash[1], o.dash[2]); box(M.seatr, o.dash[3] * .7, .05, o.dash[5], o.dash[0] - o.dash[3] * .15, o.dash[1] + o.dash[4] / 2 + .02, o.dash[2]);
    box(M.cream, o.roof[3], .03, o.roof[5], o.roof[0], o.roof[1], o.roof[2]);
    for (const s of [-1, 1]) box(o.door, o.side[3], o.side[4], .04, o.side[0], o.side[1], s * o.side[2]);
    if (o.hump) box(M.khaki, ...o.hump);
    const gauge = add(new THREE.MeshStandardMaterial({ color: '#f3ecd8', roughness: .5 }), new THREE.CircleGeometry(o.r * .32, 20), o.wheel[0] + .16, o.dash[1] + o.dash[4] / 2 - .04, o.wheel[2]); gauge.rotation.y = -Math.PI / 2;
    const tilt = new THREE.Group(); tilt.position.set(...o.wheel); tilt.rotation.z = -o.tilt; g.add(tilt);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(.03, .04, .6, 8).rotateZ(Math.PI / 2).translate(.3, 0, 0), M.dark); tilt.add(col);
    const spin = new THREE.Group(); tilt.add(spin);
    spin.add(new THREE.Mesh(new THREE.TorusGeometry(o.r, o.r * .1, 8, 32).rotateY(Math.PI / 2), M.dark));
    spin.add(new THREE.Mesh(new THREE.CylinderGeometry(o.r * .22, o.r * .22, .06, 14).rotateZ(Math.PI / 2), M.chrome));
    for (const a of [0, 2.1, 4.2]) { const sp = new THREE.Mesh(new THREE.BoxGeometry(.025, o.r, .03).translate(0, o.r / 2, 0), M.dark); sp.rotation.x = a; spin.add(sp); }
    g.visible = false; scene.add(g); out[k] = { g, spin, eye: o.eye, down: o.down };
  };
  // [x, y, z, w, h, d] boxes; wheel = centre; tilt = how far the wheel leans back towards horizontal
  mk(0, { eye: [-.04, 1.3, .4], down: .14, dash: [.84, .96, 0, .32, .2, 1.52], roof: [-.25, 1.53, 0, 1.9, 0, 1.46], side: [-.2, .82, .79, 2, .44], door: M.seatr, wheel: [.56, 1.06, .4], r: .16, tilt: .45 });
  mk(1, { eye: [3.55, 2.1, .7], down: .2, dash: [4.5, 1.32, 0, .32, .26, 2.3], roof: [3.5, 2.47, 0, 2.6, 0, 2.4], side: [3.5, 1.0, 1.2, 2.6, .86], door: M.sky, hump: [.9, .55, .7, 4.15, .8, -.15], wheel: [4.0, 1.78, .7], r: .27, tilt: 1.05 });
  mk(4, { eye: [3.55, 1.98, .7], down: .18, dash: [4.5, 1.22, 0, .32, .24, 2.3], roof: [3.5, 2.33, 0, 2.6, 0, 2.4], side: [3.5, .92, 1.2, 2.6, .76], door: M.ddred, hump: [.9, .55, .7, 4.15, .78, -.15], wheel: [4.0, 1.66, .7], r: .27, tilt: 1.05 });
  { const g = new THREE.Group(); g.visible = false; scene.add(g); out[5] = { g, spin: new THREE.Group(), eye: [.02, 1.6, 0], down: .22, bike: true }; } // on a motorbike you simply look over the bars
  return out;
}

export class Drive {
  constructor(player, traffic, sound, hud, camera, people) {
    this.cock = cockpits(player.root.parent);
    this.pl = player; this.tr = traffic; this.snd = sound; this.hud = hud; this.cam = camera; this.pp = people; this.v = null; this.near = null; this.fp = false; this.st = 0; this.look = 0; this.n = 0; this.playing = false; this.shake = 0;
    // the drivers who get turned out of their cabs
    this.dr = []; this.di = 0; for (let i = 0; i < 4; i++) { const r = makeFigure({ ...look(Math.random, false), top: '#b9a77a', bottom: '#3d3a33', full: true }); r.g.visible = false; player.root.parent.add(r.g); this.dr.push(r); }
    addEventListener('keydown', e => { if (e.repeat || !this.playing) return; if (e.code === 'KeyE' || e.code === 'KeyF') this.toggle(); if (e.code === 'KeyV') this.view(); if (e.code === 'KeyH' && this.v) this.snd.horn(this.v.x, this.v.z, BIG(this.v) ? 1 : 0, 1.6); });
    const btn = (id, fn) => $(id)?.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
    btn('bCar', () => this.toggle()); btn('bView', () => this.view());
  }
  view() { if (this.v) { this.fp = !this.fp; this.cam.near = this.fp ? .05 : .3; this.cam.updateProjectionMatrix(); if (!this.fp) for (const c of Object.values(this.cock)) c.g.visible = false; this.hud.toast(this.fp ? '<small>VIEW</small>First person' : '<small>VIEW</small>Third person'); } }
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
        const r = this.dr[this.di++ % this.dr.length], off = v.hw + 1.1, fo = BIG(v) ? 3.6 : .3; r.g.visible = true; r.g.position.set(v.x + rx * off + fx * fo, 0, v.z + rz * off + fz * fo); r.t = 0; r.car = v; this.snd.yelp(v.x, v.z); this.police?.offence(v.x, v.z, 'steal', 20);
      } else if (v.park && !v.taken) this.police?.offence(v.x, v.z, 'steal', 20);
      if (had || (v.park && !v.taken)) v.k === 0 ? Score.add(PTS.taxi, 'ট্যাক্সি চুরি') : v.k === 5 ? Score.add(PTS.taxi, 'বাইক চুরি') : Score.add(PTS.bus, 'বাস চুরি');
      v.taken = true;
      this.v = v; v.own = true; v.me = true; v.sp = Math.max(-2, Math.min(3, v.sp)); v.kt = 0; pl.car = v; pl.root.visible = false; this.d0 = pl.dist; pl.dist = Math.max(pl.dist, BIG(v) ? 15 : v.k === 5 ? 6.5 : 8.5); pl.pitch = Math.max(pl.pitch, v.k === 4 ? .3 : .2); this.st = 0; pl.lookT = 0; pl.yaw = this.behind = Math.atan2(-Math.cos(v.a), Math.sin(v.a));
      document.body.classList.add('driving'); if ($('bJump')) $('bJump').innerHTML = ICON.brake;
      this.hud.toast(`<small>DRIVING · ${NAME[v.k].toUpperCase()}</small>${had ? 'এই! আমার গাড়ি!' : NAME[v.k]}${document.body.classList.contains('touch') ? '' : '<i>E exit · V view · Space brake · H horn</i>'}`);
    } else {
      const v = this.v; if (!force && Math.abs(v.sp) > 3) { this.hud.toast('<small>TOO FAST</small>Brake first, then get out', 1); return; }
      const fx = Math.cos(v.a), fz = -Math.sin(v.a); let ex = null;
      for (const s of [1, -1]) { const x = v.x - fz * s * (v.hw + .9), z = v.z + fx * s * (v.hw + .9); if (!solid(x, 1, z)) { ex = [x, z]; break; } }
      if (!ex) ex = [v.x - fx * (v.hl + .9), v.z - fz * (v.hl + .9)];
      v.sp = 0; v.me = false; v.roll = 0; this.v = null; for (const c of Object.values(this.cock)) c.g.visible = false; this.cam.near = .3; this.cam.updateProjectionMatrix(); pl.car = null; pl.pos.set(ex[0], 0, ex[1]); pl.vel.set(0, 0, 0); pl.root.visible = true; pl.dist = this.d0; pl.heading = Math.atan2(fx, fz); this.fp = false;
      document.body.classList.remove('driving'); if ($('bJump')) $('bJump').innerHTML = ICON.jump; this.snd.engine(false); $('speed').textContent = '';
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
    const k = pl.keys, thr = Math.max(-1, Math.min(1, (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) - pl.joy.y)), sr = Math.max(-1, Math.min(1, (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0) + pl.joy.x)), brake = !!k.Space, max = v.k === 4 ? 13 : v.k === 5 ? 28 : v.k ? 15 : 25;
    if (brake) { if (Math.abs(v.sp) > 9 && !this.sk) { this.sk = 1; this.snd.skid(); } v.sp -= Math.sign(v.sp) * Math.min(Math.abs(v.sp), 28 * dt); }
    else if (thr > .05) v.sp += (v.sp < 0 ? 24 : 9 * (1 - v.sp / max)) * thr * dt;
    else if (thr < -.05) v.sp += (v.sp > 0 ? 24 : 6 * (1 + v.sp / 7)) * thr * dt;
    if (!brake || Math.abs(v.sp) < 2) this.sk = 0;
    v.sp -= v.sp * (Math.abs(thr) > .05 ? .12 : .5) * dt; if (Math.abs(thr) < .05 && Math.abs(v.sp) < .25) v.sp = 0;
    this.st += (sr - this.st) * Math.min(1, dt * 7);
    v.a -= this.st * (v.k === 5 ? 2.2 : v.k ? 1.1 : 1.9) / (1 + Math.abs(v.sp) * .055) * Math.max(-1, Math.min(1, v.sp / 4)) * dt;
    v.roll = this.st * Math.min(1, Math.abs(v.sp) / 14) * (v.k === 5 ? -.42 : v.k ? .035 : .06); // a bike leans into the turn
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
      if (back > .35) { if (imp > 3) { if (veh && !(this.hitT > performance.now())) { this.hitT = performance.now() + 900; Score.add(PTS.car, 'গাড়িতে ধাক্কা'); } this.snd.crash(Math.min(1, imp / 16), veh); this.shake = Math.min(.6, imp * .035); } v.sp = imp > 3 ? -sp0 * .18 : sp0 * .4; }
      else { v.sp *= 1 - Math.min(1, 2.5 * dt); if (Math.abs(sp0) > 5) this.snd.scrape(); }
    }
    // --- lamp posts: knocked flat at speed, solid otherwise
    const ca = Math.cos(v.a), sa = Math.sin(v.a), L = POLES.list;
    for (let i = 0; i < L.length; i++) {
      const p = L[i]; if (p.down) continue; const dx = p.x - v.x, dz = p.z - v.z; if (dx * dx + dz * dz > 40) continue;
      if (Math.abs(dx * ca - dz * sa) > v.hl + .15 || Math.abs(dx * sa + dz * ca) > v.hw + .15) continue;
      if (Math.abs(v.sp) > 4) { p.down = true; Score.add(PTS.pole, 'পোল ফেলা'); O3.position.set(p.x, .12, p.z); O3.quaternion.setFromUnitVectors(UP, V3.set(fx * dir + (Math.random() - .5) * .5, .06, fz * dir + (Math.random() - .5) * .5).normalize()); O3.updateMatrix(); POLES.im.setMatrixAt(i, O3.matrix); POLES.im.instanceMatrix.needsUpdate = true; if (POLES.head) { POLES.head.setMatrixAt(i, O3.matrix.clone().scale(V3.set(0, 0, 0))); POLES.head.instanceMatrix.needsUpdate = true; POLES.glow.setMatrixAt(i, O3.matrix.clone().scale(V3.set(0, 0, 0))); POLES.glow.instanceMatrix.needsUpdate = true; } this.snd.clang(); this.snd.crash(.4, true); this.shake = .3; v.sp *= .7; }
      else { v.x -= fx * dir * .12; v.z -= fz * dir * .12; v.sp = 0; }
    }
    // --- people
    if (this.police?.carHit(v)) { v.sp *= .93; this.shake = Math.max(this.shake, .15); }
    { const n = this.pp.carHit(v, this.snd); if (n) Score.add(PTS.person * n, 'পাবলিক ক্যালানো'); if (n) { this.police?.offence(v.x, v.z, 'person'); v.sp *= .93; this.shake = Math.max(this.shake, .15); } }
    pl.pos.set(v.x, 0, v.z); pl.heading = Math.atan2(fx, fz);
    // the chase camera swings round behind the car unless you are looking about
    { const behind = Math.atan2(-fx, -fz); let off = wrap(pl.yaw - (this.behind ?? behind)); if ((pl.lookT = (pl.lookT || 0) - dt) <= 0) off *= Math.exp(-dt * 4); pl.yaw = behind + off; this.behind = behind; } // turns with the car; only a look-around offset eases back
    this.snd.engine(true, Math.abs(v.sp), Math.abs(thr));
    if (this.n++ % 6 === 0) $('speed').textContent = Math.round(Math.abs(v.sp) * 3.2) + ' km/h' + (v.sp < -.3 ? ' · R' : '');
  }
  camera() {
    const v = this.v, c = this.cam; if (!v) return;
    v.me = !this.fp || v.k === 5; // the boy's own head would block the view (on a bike he stays: you look over his shoulders)
    for (const [k, ck] of Object.entries(this.cock)) ck.g.visible = this.fp && +k === v.k;
    if (this.fp) { // first person from the driver's seat (right-hand drive), wheel turning with the steering
      const pl = this.pl, ck = this.cock[v.k], ca = Math.cos(v.a), sa = Math.sin(v.a), [ex, ey, ez] = ck.eye;
      ck.g.position.set(v.x, 0, v.z); ck.g.rotation.set(v.roll || 0, v.a, 0, 'YXZ'); ck.spin.rotation.x = this.st * 2.4;
      c.position.set(v.x + ex * ca + ez * sa, ey, v.z - ex * sa + ez * ca); const pt = pl.pitch - .2 + ck.down, cp = Math.cos(pt);
      c.lookAt(c.position.x - Math.sin(pl.yaw) * cp * 10, ey - Math.sin(pt) * 10, c.position.z - Math.cos(pl.yaw) * cp * 10);
    }
    if (this.shake > .01) { c.position.x += (Math.random() - .5) * this.shake; c.position.y += (Math.random() - .5) * this.shake * .6; c.position.z += (Math.random() - .5) * this.shake; this.shake *= .86; }
  }
}
