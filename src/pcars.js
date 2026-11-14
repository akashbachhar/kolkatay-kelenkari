// Police cars. With three cases one comes after you, siren going; every case beyond that sends another (up to five).
// They follow the roads to you, cut across your path when close, and once you are stopped or slow beside one its officers
// jump out to make the arrest. When the cases are gone (five minutes, or the puja) they drive back to Lalbazar.
import { graph, BEACON } from './traffic.js';
import { resolve, solid } from './collide.js';
import { COPS } from './data.js';

const wrap = a => Math.atan2(Math.sin(a), Math.cos(a)), FAR = 1e6, MAXC = 5;

export class PoliceCars {
  constructor(traffic, player, police, sound) {
    this.tr = traffic; this.pl = player; this.po = police; this.snd = sound; this.cars = traffic.v.filter(v => v.k === 6); this.spawnT = 0; this.sir = 0; this.t = 0;
    for (const c of this.cars) Object.assign(c, { st: 'off', hide: true, x: FAR, z: FAR, path: null, re: 0, stuck: 0, rev: 0, near: 0, out: null });
    const E = graph(0), N = this.nodes = [...new Set(E.flatMap(e => [e.a, e.b]))]; N.forEach((n, i) => { n.id = i; });
  }
  node(x, z) { let b = null, bd = 1e18; for (const n of this.nodes) { const d = (n.x - x) ** 2 + (n.z - z) ** 2; if (d < bd) { bd = d; b = n; } } return b; }
  route(a, b) { // shortest way along the roads between two junctions
    const N = this.nodes, dist = new Float64Array(N.length).fill(1e18), prev = new Int32Array(N.length).fill(-1), done = new Uint8Array(N.length); dist[a.id] = 0;
    for (;;) { let u = -1, ud = 1e18; for (let i = 0; i < N.length; i++) if (!done[i] && dist[i] < ud) { ud = dist[i]; u = i; } if (u < 0 || u === b.id) break; done[u] = 1;
      for (const e of N[u].out) { const v = e.b.id, nd = ud + e.len; if (nd < dist[v]) { dist[v] = nd; prev[v] = u; } } }
    const out = []; for (let i = b.id; i >= 0; i = prev[i]) out.unshift([N[i].x, N[i].z]); return out;
  }
  plan(c, tx, tz) { const p = this.route(this.node(c.x, c.z), this.node(tx, tz)); if (p.length > 1 && Math.hypot(p[1][0] - c.x, p[1][1] - c.z) < Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]) + 4) p.shift(); p.push([tx, tz]); c.path = p; c.re = 1.6; }
  place(c, far) { // bring a car on at a junction out of sight of the player, already pointing along the way to him
    const p = this.pl.pos, cand = this.nodes.filter(n => { const d = Math.hypot(n.x - p.x, n.z - p.z); return d > (far ? 170 : 120) && d < (far ? 330 : 260) && !this.cars.some(o => o !== c && !o.hide && Math.hypot(o.x - n.x, o.z - n.z) < 30); });
    const n = cand.length ? cand[(Math.random() * cand.length) | 0] : this.node(COPS.hq?.[0] ?? p.x + 200, COPS.hq?.[1] ?? p.z);
    Object.assign(c, { x: n.x, z: n.z, sp: 6, st: 'chase', hide: false, stuck: 0, rev: 0, near: 0, kt: 0, jam: 0, ck: 0, cx: undefined, cz: undefined }); this.plan(c, p.x, p.z);
    const q = c.path[Math.min(1, c.path.length - 1)]; c.a = Math.atan2(-(q[1] - c.z), q[0] - c.x);
  }
  park(c) { this.recall(c); Object.assign(c, { st: 'off', hide: true, x: FAR, z: FAR, sp: 0, path: null }); }
  recall(c) { if (!c.out) return; for (const o of c.out) { const i = this.po.o.indexOf(o); if (i >= 0) this.po.o.splice(i, 1); if (o.rig) { o.rig.g.visible = false; o.rig.g.rotation.x = 0; this.po.pool.push(o.rig); o.rig = null; } } c.out = null; }
  reset() { for (const c of this.cars) this.park(c); BEACON.set(0); }
  // steer and move one car towards (ax, az) at up to vmax
  drive(c, ax, az, vmax, dt) {
    const des = Math.atan2(-(az - c.z), ax - c.x); let da = wrap(des - c.a), v = vmax * (1 - .7 * Math.min(1, Math.abs(da) / 1.1));
    if (c.rev > 0) { c.rev -= dt; v = -6; da = -da; }
    const rate = 2.4 * Math.max(.3, Math.min(1, Math.abs(c.sp) / 5)) * dt; c.a += Math.max(-rate, Math.min(rate, da)) * (c.sp < 0 ? -1 : 1);
    c.sp += Math.max(-22 * dt, Math.min(10 * dt, v - c.sp));
    const fx = Math.cos(c.a), fz = -Math.sin(c.a); c.x += fx * c.sp * dt; c.z += fz * c.sp * dt;
    let px = 0, pz = 0; for (const d of [c.hl * .8, 0, -c.hl * .8]) { const q = { x: c.x + px + fx * d, z: c.z + pz + fz * d }, ox = q.x, oz = q.z; resolve(q, c.hw + .15); px += q.x - ox; pz += q.z - oz; }
    const b = this.tr.bump(c); px += b[0]; pz += b[1]; c.x += px; c.z += pz;
    const pen = Math.hypot(px, pz); if (pen > .02) c.sp *= 1 - Math.min(1, 4 * dt);
    c.roll = Math.max(-.05, Math.min(.05, da * .04)) * Math.min(1, Math.abs(c.sp) / 12);
    // not getting anywhere? back off and try again; if that keeps failing, the caller brings the car in afresh
    if ((c.ck = (c.ck || 0) + dt) > 2) { const moved = Math.hypot(c.x - (c.cx ?? c.x + 9), c.z - (c.cz ?? c.z)); c.ck = 0; c.cx = c.x; c.cz = c.z; if (moved < 3 && vmax > 6) { c.rev = 1.2; c.re = 0; c.jam = (c.jam || 0) + 1; } else c.jam = 0; }
  }
  update(dt, want, away) {
    const pl = this.pl, p = pl.pos, car = pl.car, busted = this.po.busted; this.t += dt; want = away ? 0 : Math.min(MAXC, want);
    const live = this.cars.filter(c => c.st === 'chase');
    if (!busted) {
      if (live.length < want && (this.spawnT -= dt) <= 0) { const c = this.cars.find(q => q.st !== 'chase'); if (c) { this.recall(c); this.place(c, live.length > 0); this.spawnT = 3.5; } }
      if (live.length > want) for (const c of live.slice(want)) { c.st = 'return'; this.recall(c); c.path = null; }
    }
    const pv = car ? Math.abs(car.sp) : pl.speed || 0, pfx = car ? Math.cos(car.a) : Math.sin(pl.heading), pfz = car ? -Math.sin(car.a) : Math.cos(pl.heading);
    let nearest = 1e9, chasing = 0;
    for (const c of this.cars) {
      if (c.st === 'off') continue;
      const d = Math.hypot(p.x - c.x, p.z - c.z);
      if (c.st === 'return') { // home to Lalbazar, lights off; gone once it is there or well out of sight
        const h = COPS.hq || [0, 0]; if (!c.path) this.plan(c, h[0], h[1]);
        while (c.path.length > 1 && Math.hypot(c.path[0][0] - c.x, c.path[0][1] - c.z) < 10) c.path.shift();
        this.drive(c, c.path[0][0], c.path[0][1], 13, dt);
        if (Math.hypot(h[0] - c.x, h[1] - c.z) < 16 || d > 300) this.park(c);
        continue;
      }
      chasing++; nearest = Math.min(nearest, d);
      if (busted) { c.sp *= 1 - Math.min(1, 5 * dt); continue; }
      if (d > 460 || (c.jam >= 3 && d > 90)) { this.recall(c); this.place(c, true); c.jam = 0; continue; } // lost him, or wedged somewhere out of sight: come in again from nearer
      if (c.out) { // parked, officers on foot; if he gets away they pile back in
        c.sp *= 1 - Math.min(1, 6 * dt); c.roll = 0;
        if (d > 55 || (car && pv > 9 && d > 22)) { this.recall(c); c.near = 0; c.re = 0; }
        continue;
      }
      // close and slow: stop and send the officers out
      if (d < 13 && pv < 3.2 && Math.abs(c.sp) < 5) { c.sp *= 1 - Math.min(1, 6 * dt); if ((c.near += dt) > .7) this.deploy(c); continue; } else c.near = Math.max(0, c.near - dt);
      // where to aim: straight at him when there is a clear run, otherwise along the roads
      let clear = d < 55; if (clear) for (let s = 4; s < d - 2; s += 4) if (solid(c.x + (p.x - c.x) * s / d, 1, c.z + (p.z - c.z) * s / d)) { clear = false; break; }
      let ax, az, vmax = 24;
      if (clear) { const lead = car ? Math.min(14, pv * .55) + (d < 30 && pv > 6 ? 5 : 0) : 0; ax = p.x + pfx * lead; az = p.z + pfz * lead; c.path = null; if (!car) vmax = d < 22 ? 9 : 16; else if (d < 9 && pv < 6) vmax = 5; }
      else { if (!c.path || (c.re -= dt) <= 0) this.plan(c, p.x, p.z); while (c.path.length > 1 && Math.hypot(c.path[0][0] - c.x, c.path[0][1] - c.z) < 11) c.path.shift(); [ax, az] = c.path[0]; }
      this.drive(c, ax, az, vmax, dt);
    }
    BEACON.set(chasing && !busted ? (Math.floor(this.t * 5) % 2 ? 1 : 2) : 0);
    if (chasing && !busted && (this.sir -= dt) < 0) { this.sir = .42; this.snd.wail?.(nearest); }
  }
  deploy(c) { // two officers out of the doors, running
    const sx = Math.sin(c.a), sz = Math.cos(c.a); c.out = [];
    for (const s of [1, -1]) { const o = { x: c.x + sx * s * (c.hw + .7), z: c.z + sz * s * (c.hw + .7), ry: 0, rig: this.po.pool.pop() || null, chase: true, back: false, temp: true }; o.hx = o.x; o.hz = o.z; if (o.rig) { o.rig.g.visible = true; o.rig.g.position.set(o.x, 0, o.z); } this.po.o.push(o); c.out.push(o); }
    this.snd.whistle();
  }
}
