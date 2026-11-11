import { ROADS, BANK, RIVER_W, MAIDAN, AREAS, X0, X1, Z0, Z1, BRIDGE as B, DAK } from './data.js';
import { LM } from './landmarks.js';
import { nearestRoad } from './world.js';

const K = .8, $ = id => document.getElementById(id); let OX = X0, OZ = Z0;
const mx = x => (x - OX) * K, mz = z => (z - OZ) * K;

export class Hud {
  constructor() {
    this.mini = $('mini').getContext('2d'); this.big = $('big'); this.n = 0; this.open = false; this.dak = false;
    try { this.found = new Set(JSON.parse(localStorage.getItem('kk_found') || '[]')); } catch { this.found = new Set(); }
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w * K; c.height = h * K; const g = c.getContext('2d'); g.fillStyle = '#e4dccb'; g.fillRect(0, 0, c.width, c.height); g.lineJoin = g.lineCap = 'round'; return [c, g]; };
    { const [c, g] = mk(X1 - X0, Z1 - Z0), path = (pts, close) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(mx(p[0]), mz(p[1])) : g.moveTo(mx(p[0]), mz(p[1]))); if (close) g.closePath(); };
      path([...BANK, ...BANK.map(p => [p[0] - RIVER_W, p[1]]).reverse()], true); g.fillStyle = '#8fb6c9'; g.fill();
      path(MAIDAN, true); g.fillStyle = '#b4cf95'; g.fill();
      for (const [col, ex] of [['#b3aa97', 3], ['#fffdf6', 0]]) for (const r of ROADS) { path(r.p); g.strokeStyle = col; g.lineWidth = r.w * K * .8 + ex; g.stroke(); }
      g.strokeStyle = '#7d858c'; g.lineWidth = 9; g.beginPath(); g.moveTo(mx(B.x), mz(B.z)); g.lineTo(mx(B.x + B.dx * 340), mz(B.z + B.dz * 340)); g.stroke();
      g.fillStyle = '#5d7f93'; g.font = 'italic 600 30px Georgia,serif'; g.save(); g.translate(mx(-930), mz(330)); g.rotate(-1.05); g.fillText('H o o g h l y', 0, 0); g.restore(); this.city = c; }
    { OX = DAK.bx - 430; OZ = DAK.z - 330; const [c, g] = mk(720, 660), rc = (x, z, w, h, col) => { g.fillStyle = col; g.fillRect(mx(x), mz(z), w * K, h * K); };
      rc(DAK.bx - RIVER_W, DAK.z - 330, RIVER_W, 660, '#8fb6c9'); rc(DAK.bx + 2, DAK.z - 116, 204, 232, '#b4cf95'); rc(DAK.bx + 4, DAK.z - 92, 153, 184, '#f4eedf');
      for (const [lx, lz, w, d] of [[-12, -80, 27, 27], [30, -80, 24, 18], [-52, -80, 17, 13], [0, -13, 21, 17], [-89, -88, 6, 132], [89, -88, 6, 132], [-50, -154, 78, 6], [50, -154, 78, 6]]) rc(DAK.bx - lz - d / 2, DAK.z + lx - w / 2, d, w, '#c9a98a');
      for (const s of [-1, 1]) for (let i = 0; i < 6; i++) rc(DAK.bx + 9.5, DAK.z + s * (17.6 + i * 11.2) - 3.5, 7, 7, '#c9a98a');
      g.strokeStyle = '#7d858c'; g.lineWidth = 8; g.beginPath(); g.moveTo(mx(DAK.bx + 70), mz(DAK.z - 335)); g.lineTo(mx(DAK.bx - 280), mz(DAK.z - 335)); g.stroke();
      g.fillStyle = '#5d7f93'; g.font = 'italic 600 26px Georgia,serif'; g.save(); g.translate(mx(DAK.bx - 90), mz(DAK.z + 120)); g.rotate(-Math.PI / 2); g.fillText('H o o g h l y', 0, 0); g.restore(); this.dakMap = c; }
    this.setZone(false); this.count();
  }
  setZone(d) { this.dak = d; this.base = d ? this.dakMap : this.city; OX = d ? DAK.bx - 430 : X0; OZ = d ? DAK.z - 330 : Z0; }
  count() { $('count').textContent = `${[...this.found].filter(n => LM.some(l => l.n === n)).length} / ${LM.length} places found`; }
  toggleMap() { this.open = !this.open; this.big.style.display = this.open ? 'block' : 'none'; this.n = 0; }
  update(pl) {
    const p = pl.pos, n = this.n++;
    if (!!pl.zone !== this.dak) this.setZone(!!pl.zone);
    if (n % 12 === 0) {
      const r = nearestRoad(p.x, p.z); let a = AREAS[0], bd = 1e9;
      for (const e of AREAS) { const d = (e.p[0] - p.x) ** 2 + (e.p[1] - p.z) ** 2; if (d < bd) { bd = d; a = e; } }
      $('road').textContent = pl.ride ? 'On the Hooghly' : r.d < 12 ? r.s.n : ''; $('area').textContent = a.n;
      if (!pl.ride) for (const l of LM) if (!this.found.has(l.n) && Math.hypot(l.x - p.x, l.z - p.z) < l.r) {
        this.found.add(l.n); try { localStorage.setItem('kk_found', JSON.stringify([...this.found])); } catch { }
        this.toast(`<small>PLACE FOUND</small>${l.n}<i>${l.bn}</i>`); this.count();
      }
      if (pl.edge) this.toast(pl.zone ? '<small>DAKSHINESWAR</small>Take the ferry back from the ghat' : '<small>CITY LIMIT</small>More of Kolkata is coming soon', 1);
    }
    if (n % 2 === 0) {
      const g = this.mini, Z = 1.05 / K;
      g.save(); g.clearRect(0, 0, 200, 200); g.beginPath(); g.arc(100, 100, 97, 0, 7); g.clip(); g.fillStyle = pl.ride ? '#8fb6c9' : '#e4dccb'; g.fillRect(0, 0, 200, 200);
      g.translate(100, 100); g.rotate(pl.yaw); g.scale(Z, Z); g.translate(-mx(p.x), -mz(p.z)); g.drawImage(this.base, 0, 0);
      for (const l of LM) { g.beginPath(); g.arc(mx(l.x), mz(l.z), 4.5, 0, 7); g.fillStyle = this.found.has(l.n) ? '#d99a1c' : '#8a8478'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#fff'; g.stroke(); }
      g.translate(mx(p.x), mz(p.z)); g.rotate(Math.PI - pl.heading); g.beginPath(); g.moveTo(0, -9); g.lineTo(6, 7); g.lineTo(0, 3.5); g.lineTo(-6, 7); g.closePath(); g.fillStyle = '#c0261c'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = '#fff'; g.stroke();
      g.restore();
      g.fillStyle = '#1b1b1b'; g.beginPath(); g.arc(100 + 86 * Math.sin(pl.yaw), 100 - 86 * Math.cos(pl.yaw), 9, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '700 11px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', 100 + 86 * Math.sin(pl.yaw), 100.5 - 86 * Math.cos(pl.yaw));
    }
    if (this.open && n % 20 === 0) {
      const c = this.big, s = Math.min(innerHeight * .9 / this.base.height, innerWidth * .9 / this.base.width), g = c.getContext('2d');
      c.width = this.base.width * s; c.height = this.base.height * s; g.drawImage(this.base, 0, 0, c.width, c.height);
      g.font = '600 11px system-ui'; g.textAlign = 'center';
      for (const l of LM) { const f = this.found.has(l.n), x = mx(l.x) * s, y = mz(l.z) * s; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fillStyle = f ? '#d99a1c' : '#8a8478'; g.fill(); g.fillStyle = '#222'; g.fillText(f ? l.n : '?', x, y - 7); }
      g.beginPath(); g.arc(mx(p.x) * s, mz(p.z) * s, 6, 0, 7); g.fillStyle = '#c0261c'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#fff'; g.stroke();
    }
  }
  toast(html, quiet) {
    const t = $('toast'); if (quiet && t.classList.contains('on')) return;
    t.innerHTML = html; t.classList.add('on'); clearTimeout(this.tt); this.tt = setTimeout(() => t.classList.remove('on'), 3800);
  }
}
