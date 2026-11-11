// 2D collision: oriented boxes + circles in a spatial hash. The city is flat.
const CS = 40, cells = new Map(), EMPTY = [];
const key = (cx, cz) => cx * 8192 + cz;
function ins(o, x, z, rad) {
  for (let cx = Math.floor((x - rad) / CS); cx <= Math.floor((x + rad) / CS); cx++)
    for (let cz = Math.floor((z - rad) / CS); cz <= Math.floor((z + rad) / CS); cz++) {
      const k = key(cx, cz); let a = cells.get(k); if (!a) cells.set(k, a = []); a.push(o);
    }
}
export function addBox(x, z, w, d, ry = 0, h = 60) {
  ins({ x, z, hw: w / 2, hd: d / 2, c: Math.cos(ry), s: Math.sin(ry), h }, x, z, Math.hypot(w, d) / 2 + 1.5);
}
export function addCirc(x, z, r, h = 60) { ins({ x, z, r, h }, x, z, r + 1.5); }
export const near = (x, z) => cells.get(key(Math.floor(x / CS), Math.floor(z / CS))) || EMPTY;

// push point p {x,z} out of every collider (rad = body radius)
export function resolve(p, rad) {
  for (const o of near(p.x, p.z)) {
    const dx = p.x - o.x, dz = p.z - o.z;
    if (o.r !== undefined) {
      const d = Math.hypot(dx, dz), m = o.r + rad;
      if (d < m && d > 1e-4) { p.x = o.x + dx / d * m; p.z = o.z + dz / d * m; }
      continue;
    }
    let lx = dx * o.c - dz * o.s, lz = dx * o.s + dz * o.c;
    const px = o.hw + rad - Math.abs(lx), pz = o.hd + rad - Math.abs(lz);
    if (px > 0 && pz > 0) {
      if (px < pz) lx = Math.sign(lx || 1) * (o.hw + rad); else lz = Math.sign(lz || 1) * (o.hd + rad);
      p.x = o.x + lx * o.c + lz * o.s; p.z = o.z - lx * o.s + lz * o.c;
    }
  }
}
// is a point inside something solid? (used to keep the camera out of walls)
export function solid(x, y, z) {
  for (const o of near(x, z)) {
    if (y > o.h) continue;
    const dx = x - o.x, dz = z - o.z;
    if (o.r !== undefined) { if (dx * dx + dz * dz < o.r * o.r) return true; continue; }
    if (Math.abs(dx * o.c - dz * o.s) < o.hw + .3 && Math.abs(dx * o.s + dz * o.c) < o.hd + .3) return true;
  }
  return false;
}
