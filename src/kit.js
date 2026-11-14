import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Seeded random: the city is identical every time it loads (a fixed map).
let seed = 20261111;
export const R = () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
export const rr = (a, b) => a + R() * (b - a);
export const pick = a => a[(R() * a.length) | 0];
export const PI = Math.PI;
export const FONT = '"Baloo Da 2","Noto Sans Bengali","Nirmala UI","Vrinda",sans-serif';

export function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
export function tex(c, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function speckle(g, w, h, base, n, a, blot = 40) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < blot; i++) { g.fillStyle = `rgba(${R() < .5 ? '0,0,0' : '255,255,255'},${R() * a * .5})`; g.beginPath(); g.arc(R() * w, R() * h, 10 + R() * w * .16, 0, 7); g.fill(); }
  for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${R() < .5 ? '0,0,0' : '255,255,255'},${R() * a})`; const s = 1 + R() * 3; g.fillRect(R() * w, R() * h, s, s); }
}

// a normal map from a grey height canvas (wraps at the edges)
export function nrmMap(hc, str = 2, rx = 1, ry = 1) {
  const w = hc.width, h = hc.height, src = hc.getContext('2d').getImageData(0, 0, w, h).data, [c, g] = canvas(w, h), out = g.createImageData(w, h), d = out.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, l = src[(y * w + (x + w - 1) % w) * 4], r = src[(y * w + (x + 1) % w) * 4], u = src[(((y + h - 1) % h) * w + x) * 4], dn = src[(((y + 1) % h) * w + x) * 4];
    const nx = (l - r) / 255 * str, ny = (dn - u) / 255 * str, il = 1 / Math.hypot(nx, ny, 1);
    d[i] = (nx * il * .5 + .5) * 255; d[i + 1] = (ny * il * .5 + .5) * 255; d[i + 2] = (il * .5 + .5) * 255; d[i + 3] = 255;
  }
  g.putImageData(out, 0, 0); const t = tex(c, rx, ry); t.colorSpace = THREE.NoColorSpace; return t;
}
const data = (c, rx = 1, ry = 1) => { const t = tex(c, rx, ry); t.colorSpace = THREE.NoColorSpace; return t; };
// four canvases drawn together: colour, height, roughness(G)/metalness(B), emissive
function layers(S, sc = 1) {
  const L = [canvas(S, S), canvas(S, S), canvas(S, S), canvas(S, S)], [g, h, o, e] = L.map(q => q[1]);
  h.fillStyle = '#808080'; h.fillRect(0, 0, S, S); o.fillStyle = 'rgb(255,232,0)'; o.fillRect(0, 0, S, S); e.fillStyle = '#000'; e.fillRect(0, 0, S, S);
  const gy = v => `rgb(${v},${v},${v})`;
  // rect in all layers: col (colour), ht 0-255, ro roughness 0-1, me metalness 0-1, em emissive colour
  const rect = (x, y, w, d, col, ht, ro, me = 0, em) => { if (col) { g.fillStyle = col; g.fillRect(x * sc, y * sc, w * sc, d * sc); } if (ht != null) { h.fillStyle = gy(ht); h.fillRect(x * sc, y * sc, w * sc, d * sc); }
    if (ro != null) { o.fillStyle = `rgb(255,${ro * 255 | 0},${me * 255 | 0})`; o.fillRect(x * sc, y * sc, w * sc, d * sc); } if (em) { e.fillStyle = em; e.fillRect(x * sc, y * sc, w * sc, d * sc); } };
  return { c: L.map(q => q[0]), g, h, o, e, rect };
}
function facade(i) {
  const sc = LITE ? 1 : 2, S = 512 * sc, L = layers(S, sc), { g, h, rect } = L, wall = ['#d6b46c', '#c79183', '#c4c2b6', '#93a4ad', '#b5c4a0', '#dbd5c5'][i];
  speckle(g, S, S, wall, LITE ? 5000 : 16000, .1, 70);
  for (let k = 0; k < (LITE ? 2500 : 9000); k++) { const v = 128 + (R() - .5) * 34 | 0; h.fillStyle = `rgb(${v},${v},${v})`; h.fillRect(R() * S, R() * S, 2 + R() * 3, 2 + R() * 3); } // plaster grain
  const WARM = ['rgba(255,206,140,.95)', 'rgba(255,226,170,.9)', 'rgba(255,190,120,.85)', 'rgba(210,228,255,.8)'];
  for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) {
    const x = q * 128, y = r * 128;
    rect(x, y + 110, 128, 3, 'rgba(255,255,255,.24)', 205); rect(x, y + 113, 128, 6, null, 215); rect(x, y + 119, 128, 3, 'rgba(0,0,0,.3)', 150); // string course between the floors
    if (i < 2 || i > 3) { // old Kolkata house: louvred shutters, iron balconies
      rect(x + 36, y + 13, 56, 4, '#f1ead6', 200); rect(x + 38, y + 16, 52, 86, '#ebe4d0', 168); rect(x + 35, y + 101, 58, 4, '#e2dac4', 215); // head, frame, sill
      if (R() < .28) { const lit = R() < .5; rect(x + 42, y + 20, 44, 78, lit ? '#3a2c1c' : '#14181a', 50, .12, .55, lit ? pick(WARM) : null); rect(x + 63, y + 20, 2, 78, '#d8d0bb', 150, .8); rect(x + 42, y + 56, 44, 2, '#d8d0bb', 150, .8);
        if (lit) { g.fillStyle = 'rgba(255,200,120,.35)'; g.fillRect((x + 42) * sc, (y + 20) * sc, 44 * sc, 78 * sc); } }
      else {
        rect(x + 42, y + 20, 44, 78, pick(['#3d6a4c', '#4c5b3a', '#6a4a32', '#2f5a5a', '#3d6a4c']), 118, .7);
        for (let k = 0; k < 19; k++) { rect(x + 42, y + 22 + k * 4, 44, 1.5, 'rgba(0,0,0,.34)', 84); rect(x + 42, y + 23.5 + k * 4, 44, 1, 'rgba(255,255,255,.07)', 140); } rect(x + 63, y + 20, 2, 78, 'rgba(0,0,0,.4)', 70);
      }
      if (R() < .45) { rect(x + 20, y + 104, 88, 6, 'rgba(60,56,50,.95)', 255, .8); rect(x + 22, y + 80, 84, 2.5, 'rgba(22,22,22,.95)', 245, .5, .6); for (let k = 0; k < 15; k++) rect(x + 22 + k * 5.9, y + 82, 1.4, 22, 'rgba(22,22,22,.92)', 235, .5, .6);
        g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect((x + 20) * sc, (y + 110) * sc, 88 * sc, 5 * sc); }
      if (R() < .22) { rect(x + 4, y + 30, 1.6, 82, 'rgba(60,60,60,.8)', 190, .5, .5); } // a down-pipe
    } else if (i === 2) { // mid-century office block
      rect(x + 5, y + 23, 118, 66, '#b9b7ab', 150); rect(x + 8, y + 26, 112, 60, '#22323f', 62, .1, .65);
      for (const hx of [8, 66]) if (R() < .3) { rect(x + hx, y + 26, 54, 60, null, null, null, 0, pick(WARM)); g.fillStyle = 'rgba(255,225,170,.4)'; g.fillRect((x + hx) * sc, (y + 26) * sc, 54 * sc, 60 * sc); }
      rect(x + 62, y + 26, 4, 60, wall, 150, .85); rect(x + 8, y + 54, 112, 2, '#9aa3a8', 140, .5, .4); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect((x + 8) * sc, (y + 26) * sc, 112 * sc, 12 * sc);
      if (R() < .3) { rect(x + 72, y + 90, 26, 15, '#d8d8d2', 250, .6, .2); rect(x + 76, y + 94, 18, 7, '#6d6d6d', 205, .6, .3); }
    } else { // glass tower
      const gr = g.createLinearGradient(0, y * sc, 0, (y + 112) * sc); gr.addColorStop(0, '#6a93ad'); gr.addColorStop(1, '#2d4a60'); rect(x, y, 128, 110, null, 92, .06, .85); g.fillStyle = gr; g.fillRect(x * sc, y * sc, 128 * sc, 110 * sc);
      for (const hx of [0, 64]) if (R() < .2) rect(x + hx, y + 4, 64, 104, 'rgba(255,230,180,.22)', null, null, 0, 'rgba(255,224,170,.55)');
      rect(x, y, 3, 128, 'rgba(225,232,236,.9)', 175, .35, .7); rect(x + 64, y, 2, 110, 'rgba(225,232,236,.9)', 165, .35, .7);
    }
    if (R() < .5) { g.fillStyle = 'rgba(40,30,20,.13)'; g.fillRect((x + R() * 110) * sc, y * sc, (6 + R() * 12) * sc, 128 * sc); } // rain streaks
    if (R() < .3) { const gx = (x + R() * 100) * sc, gr = g.createLinearGradient(0, (y + 119) * sc, 0, (y + 128 + 60) * sc); gr.addColorStop(0, 'rgba(30,40,25,.28)'); gr.addColorStop(1, 'rgba(30,40,25,0)'); g.fillStyle = gr; g.fillRect(gx, (y + 119) * sc, (20 + R() * 40) * sc, 70 * sc); } // damp under the ledge
  }
  return { map: tex(L.c[0]), normalMap: nrmMap(L.c[1], 3.2), orm: data(L.c[2]), emissiveMap: tex(L.c[3]) };
}

const SHOPS = ['মিষ্টান্ন ভাণ্ডার', 'চা', 'বইঘর', 'দাস ফার্মেসি', 'কেবিন', 'স্টুডিও', 'বস্ত্রালয়', 'জুয়েলার্স', 'ভাতের হোটেল', 'টেলার্স', 'স্টোর্স', 'রোল সেন্টার', 'ঘড়ি ঘর', 'মা তারা', 'TEA STALL', 'SWEETS', 'BOOKS', 'MEDICAL', 'ROLLS', 'CABIN', 'STORES', 'TAILORS', 'MOBILE', 'XEROX'];
function shops() {
  const [c, g] = canvas(2048, 256), open = [];
  for (let i = 0; i < 8; i++) {
    const x = i * 256;
    g.fillStyle = pick(['#24211f', '#2d2a2c', '#1f262b']); g.fillRect(x, 0, 256, 256);
    const shut = R() < .35;
    if (shut) { g.fillStyle = pick(['#8d9499', '#6f7d86', '#9c8f7a']); g.fillRect(x + 14, 64, 228, 192); g.fillStyle = 'rgba(0,0,0,.3)'; for (let k = 0; k < 24; k++) g.fillRect(x + 14, 66 + k * 8, 228, 2); }
    else {
      for (let k = 0; k < 16; k++) { g.fillStyle = `hsl(${R() * 360},55%,${35 + R() * 30}%)`; g.fillRect(x + 20 + R() * 196, 84 + R() * 100, 14 + R() * 26, 14 + R() * 30); }
      g.fillStyle = '#5a4030'; g.fillRect(x + 14, 204, 228, 52); g.fillStyle = 'rgba(255,220,150,.10)'; g.fillRect(x + 14, 64, 228, 140);
    }
    g.fillStyle = '#b9b09c'; g.fillRect(x, 0, 14, 256); g.fillRect(x + 242, 0, 14, 256);
    const bg = pick(['#b3261e', '#1f4e8c', '#f2c118', '#1d6b46', '#f4f1e8', '#5a2d82', '#d9541e']);
    g.fillStyle = bg; g.fillRect(x + 6, 4, 244, 58);
    g.fillStyle = (bg === '#f2c118' || bg === '#f4f1e8') ? '#161616' : '#fff'; g.font = `700 36px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(pick(SHOPS), x + 128, 35, 228);
    if (R() < .4) { for (let k = 0; k < 12; k++) { g.fillStyle = k % 2 ? '#e8e2d4' : pick(['#b3261e', '#1f4e8c', '#1d6b46']); g.fillRect(x + 8 + k * 20, 62, 20, 20); } }
    open.push(!shut);
  }
  const [ec, eg] = canvas(2048, 256); eg.fillStyle = '#000'; eg.fillRect(0, 0, 2048, 256); // what glows at dusk: the open shop fronts, and (faintly) every signboard
  open.forEach((on, i) => { const x = i * 256; eg.globalAlpha = .3; eg.drawImage(c, x + 6, 4, 244, 58, x + 6, 4, 244, 58); if (on) { eg.globalAlpha = .75; eg.drawImage(c, x + 14, 84, 228, 120, x + 14, 84, 228, 120); eg.globalAlpha = .35; eg.fillStyle = '#ffd596'; eg.fillRect(x + 14, 64, 228, 140); } });
  return { map: tex(c), emissiveMap: tex(ec) };
}
function road() { // worn asphalt: tar patches, cracks, polished wheel tracks; one tile is the road's width by 12 m
  const S = 1024, [c, g] = canvas(S, S), [hc, h] = canvas(S, S), [oc, o] = canvas(S, S); speckle(g, S, S, '#3a3a3c', 60000, .16, 90);
  h.fillStyle = '#808080'; h.fillRect(0, 0, S, S); for (let k = 0; k < 70000; k++) { const v = 128 + (R() - .5) * 90 | 0; h.fillStyle = `rgb(${v},${v},${v})`; h.fillRect(R() * S, R() * S, 1 + R() * 2, 1 + R() * 2); }
  o.fillStyle = 'rgb(255,232,0)'; o.fillRect(0, 0, S, S);
  for (const lx of [.2, .38, .62, .8]) { const gr = g.createLinearGradient((lx - .06) * S, 0, (lx + .06) * S, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.05)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect((lx - .06) * S, 0, .12 * S, S);
    const og = o.createLinearGradient((lx - .06) * S, 0, (lx + .06) * S, 0); og.addColorStop(0, 'rgba(255,170,0,0)'); og.addColorStop(.5, 'rgba(255,170,0,.8)'); og.addColorStop(1, 'rgba(255,170,0,0)'); o.fillStyle = og; o.fillRect((lx - .06) * S, 0, .12 * S, S); } // wheel tracks, a little polished
  for (let k = 0; k < 4; k++) { const x = R() * S * .8 + S * .05, y = R() * S * .8, w = 50 + R() * 110, d = 40 + R() * 100, dk = R() < .6; g.fillStyle = dk ? 'rgba(18,18,20,.26)' : 'rgba(120,118,112,.12)'; g.fillRect(x, y, w, d); h.fillStyle = dk ? 'rgba(160,160,160,.55)' : 'rgba(100,100,100,.5)'; h.fillRect(x, y, w, d); o.fillStyle = dk ? 'rgba(255,190,0,.7)' : 'rgba(255,245,0,.6)'; o.fillRect(x, y, w, d); } // patches
  for (let k = 0; k < 16; k++) { let x = R() * S, y = R() * S; g.beginPath(); h.beginPath(); g.moveTo(x, y); h.moveTo(x, y); for (let j = 0; j < 9; j++) { x += rr(-34, 34); y += rr(8, 46); g.lineTo(x, y); h.lineTo(x, y); } g.strokeStyle = 'rgba(10,10,10,.6)'; g.lineWidth = 1 + R() * 1.6; g.stroke(); h.strokeStyle = 'rgba(20,20,20,.9)'; h.lineWidth = 2.5; h.stroke(); } // cracks
  for (let k = 0; k < 10; k++) { g.fillStyle = `rgba(8,8,10,${.1 + R() * .16})`; g.beginPath(); g.ellipse(S * (.25 + R() * .5), R() * S, 14 + R() * 40, 10 + R() * 26, R() * 3, 0, 7); g.fill(); } // oil
  g.fillStyle = 'rgba(232,232,222,.8)'; g.fillRect(S / 2 - 9, 0, 18, S * .47); g.fillStyle = 'rgba(228,206,110,.6)'; g.fillRect(30, 0, 9, S); g.fillRect(S - 39, 0, 9, S);
  h.fillStyle = 'rgba(175,175,175,.9)'; h.fillRect(S / 2 - 9, 0, 18, S * .47); h.fillRect(30, 0, 9, S); h.fillRect(S - 39, 0, 9, S);
  for (let k = 0; k < 900; k++) { g.fillStyle = 'rgba(58,58,60,.7)'; g.fillRect(S / 2 - 9 + R() * 18, R() * S * .47, 2 + R() * 3, 2 + R() * 4); } // worn paint
  return { map: tex(c), normalMap: nrmMap(hc, 1.6), orm: data(oc) };
}
function paving() { // footpath: square concrete pavers, a few cracked or stained, kerb stones along both edges
  const S = 512, N = 8, t = S / N, [c, g] = canvas(S, S), [hc, h] = canvas(S, S); g.fillStyle = '#8e8a80'; g.fillRect(0, 0, S, S); h.fillStyle = '#404040'; h.fillRect(0, 0, S, S);
  for (let r = 0; r < N; r++) for (let q = 0; q < N; q++) { const v = 150 + R() * 34 | 0, x = q * t + (r % 2 ? t / 2 : 0); for (const xx of [x, x - S]) { g.fillStyle = `rgb(${v + 12},${v + 9},${v})`; g.fillRect(xx + 1.5, r * t + 1.5, t - 3, t - 3); h.fillStyle = `rgb(${150 + R() * 30 | 0},0,0)`; h.fillStyle = '#a8a8a8'; h.fillRect(xx + 2.5, r * t + 2.5, t - 5, t - 5); } }
  for (let k = 0; k < 9000; k++) { g.fillStyle = `rgba(${R() < .5 ? '0,0,0' : '255,255,255'},${R() * .1})`; g.fillRect(R() * S, R() * S, 2, 2); const v = R() < .5 ? 0 : 255; h.fillStyle = `rgba(${v},${v},${v},.08)`; h.fillRect(R() * S, R() * S, 2, 2); }
  for (let k = 0; k < 12; k++) { g.fillStyle = `rgba(40,34,26,${.06 + R() * .1})`; g.beginPath(); g.ellipse(R() * S, R() * S, 20 + R() * 60, 12 + R() * 40, R() * 3, 0, 7); g.fill(); }
  for (let k = 0; k < 5; k++) { let x = R() * S, y = R() * S; g.beginPath(); h.beginPath(); g.moveTo(x, y); h.moveTo(x, y); for (let j = 0; j < 5; j++) { x += rr(-20, 20); y += rr(-20, 20); g.lineTo(x, y); h.lineTo(x, y); } g.strokeStyle = 'rgba(30,30,30,.5)'; g.stroke(); h.strokeStyle = '#202020'; h.lineWidth = 2; h.stroke(); }
  return { map: tex(c), normalMap: nrmMap(hc, 2.4) };
}
function grainN(S, n, amp, str) { const [hc, h] = canvas(S, S); h.fillStyle = '#808080'; h.fillRect(0, 0, S, S); for (let k = 0; k < n; k++) { const v = 128 + (R() - .5) * amp | 0; h.fillStyle = `rgb(${v},${v},${v})`; const q = 1 + R() * 4; h.fillRect(R() * S, R() * S, q, q); } return nrmMap(hc, str); }
function plain(base, n, a, s = 256) { const [c, g] = canvas(s, s); speckle(g, s, s, base, n, a); return tex(c); }
function waterBump() {
  const [c, g] = canvas(256, 256); g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) { const v = R() < .5 ? 255 : 0; g.fillStyle = `rgba(${v},${v},${v},.10)`; g.beginPath(); const x = R() * 256, y = R() * 256; g.ellipse(x, y, 4 + R() * 16, 1.5 + R() * 4, 0, 0, 7); g.fill(); }
  const t = tex(c, 60, 60); t.colorSpace = THREE.NoColorSpace; return t;
}

// surface textures for the landmarks (applied in object space, so no UV stretching)
function brickTex() {
  const [c, g] = canvas(256, 256); g.fillStyle = '#b3aa9f'; g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 16; r++) for (let q = -1; q < 8; q++) { const v = 205 + R() * 50 | 0; g.fillStyle = `rgb(${v},${v - R() * 14 | 0},${v - R() * 20 | 0})`; g.fillRect(q * 32 + (r % 2) * 16 + 1, r * 16 + 1, 30, 14); }
  for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(30,20,15,${.05 + R() * .08})`; g.fillRect(R() * 256, 0, 8 + R() * 30, 256); }
  return tex(c);
}
function plasterTex(joints) {
  const [c, g] = canvas(512, 512); speckle(g, 512, 512, '#ffffff', 9000, .07, 50);
  if (joints) { g.strokeStyle = 'rgba(70,65,60,.22)'; g.lineWidth = 1.5; for (let r = 0; r < 8; r++) { g.beginPath(); g.moveTo(0, r * 64); g.lineTo(512, r * 64); g.stroke(); for (let q = 0; q < 4; q++) { g.beginPath(); g.moveTo(q * 128 + (r % 2) * 64, r * 64); g.lineTo(q * 128 + (r % 2) * 64, r * 64 + 64); g.stroke(); } }
    for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(110,115,125,${.05 + R() * .08})`; g.lineWidth = 1 + R() * 2; g.beginPath(); const x = R() * 512, y = R() * 512; g.moveTo(x, y); g.bezierCurveTo(x + rr(-90, 90), y + rr(-60, 60), x + rr(-120, 120), y + rr(-90, 90), x + rr(-160, 160), y + rr(-120, 120)); g.stroke(); } }
  for (let i = 0; i < (joints ? 10 : 34); i++) { const x = R() * 512, w = 5 + R() * 26, y = R() * 300, gr = g.createLinearGradient(0, y, 0, y + 150 + R() * 200); gr.addColorStop(0, `rgba(55,45,30,${.05 + R() * .09})`); gr.addColorStop(1, 'rgba(55,45,30,0)'); g.fillStyle = gr; g.fillRect(x, y, w, 400); }
  if (!joints) for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(70,80,60,${.04 + R() * .06})`; g.beginPath(); g.ellipse(R() * 512, R() * 512, 30 + R() * 70, 16 + R() * 40, R() * 3, 0, 7); g.fill(); }
  return tex(c);
}
function booksTex() {
  const [c, g] = canvas(256, 256); g.fillStyle = '#3a2a1c'; g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 4; r++) { let x = 2; while (x < 250) { const w = 5 + R() * 9, h = 44 + R() * 14; g.fillStyle = `hsl(${R() * 360},${30 + R() * 45}%,${28 + R() * 42}%)`; g.fillRect(x, r * 64 + 60 - h, w, h); if (R() < .4) { g.fillStyle = 'rgba(255,240,200,.6)'; g.fillRect(x + 1, r * 64 + 66 - h, w - 2, 3); } x += w + 1; } g.fillStyle = '#6a4c36'; g.fillRect(0, r * 64 + 60, 256, 4); }
  return tex(c);
}
function curtainTex() { // glass curtain wall: one tile is one floor by two bays
  const [c, g] = canvas(256, 256), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#eef6fa'); gr.addColorStop(1, '#a9c3d2'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2; i++) if (R() < .5) { g.fillStyle = 'rgba(255,240,200,.25)'; g.fillRect(i * 128, 0, 128, 200); }
  g.fillStyle = 'rgba(50,70,85,.6)'; g.fillRect(0, 204, 256, 52); g.fillStyle = 'rgba(245,248,250,.95)'; g.fillRect(0, 0, 5, 256); g.fillRect(126, 0, 4, 256); g.fillRect(0, 250, 256, 6);
  return tex(c);
}
// Painted sign board
export function signMesh(text, w, h, bg = '#f4f1e8', fg = '#141414') {
  const H = 160, W = Math.min(2048, Math.round(H * w / h)), [c, g] = canvas(W, H);
  g.fillStyle = bg; g.fillRect(0, 0, W, H); g.strokeStyle = fg; g.lineWidth = 5; g.strokeRect(6, 6, W - 12, H - 12);
  const lines = text.split('\n'); let fs = (H * .62) / lines.length;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fg;
  for (; fs > 10; fs -= 3) { g.font = `700 ${fs}px ${FONT}`; if (lines.every(l => g.measureText(l).width < W * .9)) break; }
  lines.forEach((l, i) => g.fillText(l, W / 2, H * (i + .5) / lines.length + 3));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: .7 }));
}

const m = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .85, ...o });
const paint = (color, clear = .8) => new THREE.MeshPhysicalMaterial({ color, roughness: .42, metalness: .1, clearcoat: clear, clearcoatRoughness: .18 }); // coach paint under lacquer
const tri = (color, map, sc, o = {}) => { // texture projected from the model's own x/y/z
  const mt = m(color, { map, ...o });
  mt.onBeforeCompile = s => {
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvOP = position; vON = normal;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON;')
      .replace('#include <map_fragment>', `vec3 an = abs(vON); vec2 tuv = an.y > .6 ? vOP.xz : (an.x > an.z ? vOP.zy : vOP.xy); diffuseColor *= texture2D(map, tuv * ${sc.toFixed(4)});`);
  };
  mt.customProgramCacheKey = () => 'tri' + sc; return mt;
};
export const M = {}, T = {};
let LITE = false; // phones and tablets: half-size building textures, to spare their memory
export function initMats(lite = false) {
  LITE = lite;
  Object.assign(M, {
    marble: m('#f1eee6', { roughness: .5 }), white: m('#ece8de'), cream: m('#e2d2aa'), brick: m('#9c3f30'), brickD: m('#7d3026'), redOx: m('#8f3a2b'),
    sand: m('#b5563c'), steel: m('#aab1b6', { metalness: .65, roughness: .45 }), glass: m('#1a252d', { roughness: .06, metalness: .75 }), dark: m('#19191b'),
    roof: m('#5b5651'), roofR: m('#8a4a3a'), green: m('#2f6249'), domeG: m('#4b8a6c', { roughness: .5 }), bronze: m('#4a3b28', { metalness: .6, roughness: .5 }),
    gold: m('#c9a23a', { metalness: .8, roughness: .35 }), gravel: m('#c2ad88'), wood: m('#6b4a2e'), thatch: m('#a48d5a'), yellow: paint('#f2c118'),
    blue: m('#27408f', { roughness: .5 }), tin: m('#8c9296', { metalness: .4, roughness: .6 }), conc: m('#a9a59c'), stone: m('#8f897e'), tyre: m('#141414'),
    red: m('#b3261e'), track: m('#8a6f52'), rampart: m('#6f7a4e'), seat: m('#3f6f9e', { side: THREE.DoubleSide }), tram: paint('#f1efe6', .3),
    bus: paint('#2f63b5'), sky: paint('#78acd8', .45), ybus: paint('#efc12e'), khaki: m('#7a6f58'), chrome: m('#e6e8ea', { metalness: 1, roughness: .12 }), cglass: m('#b8d0da', { transparent: true, opacity: .3, roughness: .05, metalness: .3, depthWrite: false }), seatr: m('#5a2a22'), ddred: paint('#c4261c'), skin: m('#9a6846'), rosh: m('#faf6ea', { roughness: .4 }), clay: m('#a8623c'), orange: m('#e8862a'), pink: m('#d8568a'), lime: m('#8ab83a'), saffron: m('#f08c28'), asph: m('#38383a'), tinD: m('#8c9296', { metalness: .4, roughness: .6, side: THREE.DoubleSide }), lamp: m('#fff3c4', { emissive: '#ffdf9a', emissiveIntensity: 3.2 }),
  });
  const bt = brickTex(), pt = plasterTex(false), mbl = plasterTex(true);
  Object.assign(M, { brick: tri('#a8473a', bt, .3), brickD: tri('#8a372c', bt, .3), redOx: tri('#9a4032', pt, .09), sand: tri('#b85a40', bt, .16),
    flag: tri('#d6ccb6', mbl, .2), white: tri('#efebe1', pt, .07), cream: tri('#e6d6ad', pt, .07), marble: tri('#f4f1ea', mbl, .12, { roughness: .45 }), stone: tri('#9a948a', mbl, .2) });
  M.books = m('#ffffff', { map: booksTex() }); M.iron = m('#1c1e20', { metalness: .5, roughness: .6 });
  M.moss = tri('#8d917a', pt, .09); M.tower = tri('#9dbfd3', curtainTex(), 1 / 3.6, { roughness: .12, metalness: .6 });
  const flat = (c, o) => { const mt = m(c, { polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }); mt.userData.order = o; return mt; };
  M.apron = flat('#3b3b3d', 40); M.clayT = flat('#b8693d', 40); M.clayT.side = THREE.DoubleSide; M.lineT = flat('#ece8de', 41); M.lineT.side = THREE.DoubleSide; M.paint = flat('#ece8de', 41);
  T.fac = [0, 1, 2, 3, 4, 5].map(facade); T.shops = shops(); T.road = road(); T.paving = paving(); T.grainN = grainN(256, 14000, 110, 1.4);
  T.grass = plain('#5f7b3c', 9000, .12, 512); T.ground = plain('#8f877a', 7000, .1, 512); T.pave = plain('#aaa69c', 4000, .1);
  M.grass = m('#ffffff', { map: T.grass.clone() }); M.grass.map.repeat.set(6, 6);
  M.water = m('#56706a', { roughness: .08, metalness: .45, bumpMap: waterBump(), bumpScale: 4 });
  M.pond = m('#4c5f52', { roughness: .1, metalness: .3 });
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), UP = new THREE.Vector3(0, 1, 0);
// Kit: build a model from primitives, merged into one mesh per material.
export class Kit {
  constructor() { this.parts = new Map(); this.extras = []; }
  add(mat, geo, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) {
    geo.applyMatrix4(_m.compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _s));
    const g = geo.index ? geo.toNonIndexed() : geo;
    for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal' && n !== 'uv') g.deleteAttribute(n);
    if (!this.parts.has(mat)) this.parts.set(mat, []);
    this.parts.get(mat).push(g); return this;
  }
  box(mat, w, h, d, x, y, z, ry = 0) { return this.add(mat, new THREE.BoxGeometry(w, h, d), x, y + h / 2, z, ry); }
  cyl(mat, rt, rb, h, x, y, z, seg = 14) { return this.add(mat, new THREE.CylinderGeometry(rt, rb, h, seg), x, y + h / 2, z); }
  dome(mat, r, x, y, z, sy = 1, seg = 18) { const g = new THREE.SphereGeometry(r, seg, Math.max(6, seg >> 1), 0, PI * 2, 0, PI / 2); g.scale(1, sy, 1); return this.add(mat, g, x, y, z); }
  cone(mat, r, h, x, y, z, seg = 12, ry = 0) { return this.add(mat, new THREE.ConeGeometry(r, h, seg), x, y + h / 2, z, ry); }
  pyr(mat, s, h, x, y, z) { return this.cone(mat, s * .7072, h, x, y, z, 4, PI / 4); }
  // pitched roof: a square bar turned 45 degrees, lower half hidden in the building
  prism(mat, len, s, x, y, z, alongX = true) { return alongX ? this.add(mat, new THREE.BoxGeometry(len, s, s), x, y, z, 0, PI / 4) : this.add(mat, new THREE.BoxGeometry(s, s, len), x, y, z, 0, 0, PI / 4); }
  cols(mat, x1, z1, x2, z2, n, r, h, y) {
    for (let i = 0; i < n; i++) { const t = n > 1 ? i / (n - 1) : .5, x = x1 + (x2 - x1) * t, z = z1 + (z2 - z1) * t; this.cyl(mat, r * .85, r, h, x, y, z, 10); this.box(mat, r * 2.6, r * .7, r * 2.6, x, y + h - r * .7, z); }
    return this;
  }
  wins(mat, x1, z1, x2, z2, n, w, h, y, t = .3) {
    const a = Math.atan2(-(z2 - z1), x2 - x1);
    const arch = h / w >= 1.9 && t >= .2; // tall openings get a round head
    for (let i = 0; i < n; i++) {
      const f = (i + .5) / n, x = x1 + (x2 - x1) * f, z = z1 + (z2 - z1) * f;
      if (arch) { this.box(mat, w, h - w / 2, t, x, y, z, a); this.add(mat, new THREE.CylinderGeometry(w / 2, w / 2, t, 14).rotateX(PI / 2), x, y + h - w / 2, z, a); }
      else this.box(mat, w, h, t, x, y, z, a);
    }
    return this;
  }
  beam(mat, a, b, t) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), g = new THREE.BoxGeometry(t, A.distanceTo(B), t);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, B.clone().sub(A).normalize()));
    const c = A.add(B).multiplyScalar(.5); return this.add(mat, g, c.x, c.y, c.z);
  }
  sign(text, w, h, x, y, z, ry = 0, bg, fg) { const s = signMesh(text, w, h, bg, fg); s.position.set(x, y, z); s.rotation.y = ry; this.extras.push(s); return this; }
  chala(mat, s, h, x, y, z, drop = .8, sz = s) { // Bengal curved roof: hipped, eaves drooping to the corners
    const g = new THREE.PlaneGeometry(2, 2, 10, 10).rotateX(-PI / 2), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const u = p.getX(i), v = p.getZ(i), mm = Math.max(Math.abs(u), Math.abs(v)), n = Math.min(Math.abs(u), Math.abs(v)); p.setXYZ(i, u * s / 2, h * (1 - mm) - drop * n * n * mm, v * sz / 2); }
    g.computeVertexNormals(); const f = g.clone(), ix = f.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i]; ix[i] = ix[i + 1]; ix[i + 1] = t; } f.computeVertexNormals();
    this.add(mat, f, x, y, z); return this.add(mat, g, x, y, z);
  }
  gwins(mat, x1, z1, x2, z2, n, w, h, y, t = .3) { // pointed (Gothic) openings
    const a = Math.atan2(-(z2 - z1), x2 - x1), sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h - w); sh.quadraticCurveTo(w / 2, h - w * .35, 0, h); sh.quadraticCurveTo(-w / 2, h - w * .35, -w / 2, h - w);
    for (let i = 0; i < n; i++) { const f = (i + .5) / n; this.add(mat, new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false, curveSegments: 5 }).translate(0, 0, -t / 2), x1 + (x2 - x1) * f, y, z1 + (z2 - z1) * f, a); }
    return this;
  }
  gable(mat, w, h, d, x, y, z, ry = 0) { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); return this.add(mat, new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }).translate(0, 0, -d / 2), x, y, z, ry); }
  loft(mat, secs, n = 3.2, K = 20) { // smooth body through rounded cross-sections [x, half-width, y0, y1]
    const pos = [], idx = [], e = 2 / n, S = secs.length;
    for (const [x, w, y0, y1] of secs) for (let i = 0; i < K; i++) { const t = i / K * PI * 2, c = Math.cos(t), s = Math.sin(t); pos.push(x, (y0 + y1) / 2 + Math.sign(s) * Math.abs(s) ** e * (y1 - y0) / 2, Math.sign(c) * Math.abs(c) ** e * w); }
    for (let j = 0; j < S - 1; j++) for (let i = 0; i < K; i++) { const a = j * K + i, b = j * K + (i + 1) % K; idx.push(a, a + K, b, b, a + K, b + K); }
    const c0 = pos.length / 3; pos.push(secs[0][0], (secs[0][2] + secs[0][3]) / 2, 0, secs[S - 1][0], (secs[S - 1][2] + secs[S - 1][3]) / 2, 0);
    for (let i = 0; i < K; i++) idx.push(c0, i, (i + 1) % K, c0 + 1, (S - 1) * K + (i + 1) % K, (S - 1) * K + i);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2));
    return this.add(mat, g);
  }
  clock(d, x, y, z, ry = 0) {
    const [c, g] = canvas(128, 128); g.fillStyle = '#f3ecd8'; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill(); g.strokeStyle = '#2a2018'; g.lineWidth = 6; g.stroke();
    for (let i = 0; i < 12; i++) { const a = i * PI / 6; g.lineWidth = i % 3 ? 2 : 5; g.beginPath(); g.moveTo(64 + Math.sin(a) * 46, 64 - Math.cos(a) * 46); g.lineTo(64 + Math.sin(a) * 55, 64 - Math.cos(a) * 55); g.stroke(); }
    g.lineCap = 'round'; g.lineWidth = 6; g.beginPath(); g.moveTo(64, 64); g.lineTo(40, 44); g.stroke(); g.lineWidth = 4; g.beginPath(); g.moveTo(64, 64); g.lineTo(98, 40); g.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const me = new THREE.Mesh(new THREE.CircleGeometry(d / 2, 24), new THREE.MeshStandardMaterial({ map: t, roughness: .6 })); me.position.set(x, y, z); me.rotation.y = ry; this.extras.push(me); return this;
  }
  build(shadow = true) {
    const g = new THREE.Group();
    for (const [mat, list] of this.parts) { const me = new THREE.Mesh(mergeGeometries(list), mat); me.castShadow = shadow && !mat.userData.order; me.receiveShadow = true; me.renderOrder = mat.userData.order || 0; g.add(me); }
    for (const e of this.extras) g.add(e);
    return g;
  }
}
