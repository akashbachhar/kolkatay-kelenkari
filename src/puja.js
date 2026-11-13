import * as THREE from 'three';
import { Kit, M, PI } from './kit.js';
import { DAK } from './data.js';
import { animate } from './human.js';

// Puja at Dakshineswar. A glowing yellow mark stands at the foot of the Bhavatarini temple steps.
// Step on it and the temple opens: the boy walks in to Ma Kali, stands with folded hands, rings the bell,
// and walks back out by himself. Then the temple is closed until you have wandered off and come back.
const $ = id => document.getElementById(id), SX = DAK.bx + 2600, SZ = DAK.z; // the sanctum is built far out of sight
const L = (a, b, f) => a + (b - a) * Math.max(0, Math.min(1, f));

export class Puja {
  constructor(scene, player, sound, camera) {
    Object.assign(this, { pl: player, snd: sound, cam: camera, t: -1, closed: false, mk: [DAK.bx + 80, DAK.z + 12], fired: new Set() });
    // the mark: a ring, a soft disc and a column of light
    const g = new THREE.Group(), basic = o => new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false, ...o });
    g.add(new THREE.Mesh(new THREE.TorusGeometry(1.3, .08, 8, 48).rotateX(PI / 2).translate(0, .1, 0), basic({ color: '#ffd23c' })));
    g.add(new THREE.Mesh(new THREE.CircleGeometry(1.25, 48).rotateX(-PI / 2).translate(0, .08, 0), basic({ color: '#ffcc33', opacity: .3 })));
    const c = document.createElement('canvas'); c.width = 4; c.height = 128; const cg = c.getContext('2d'), gr = cg.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, 'rgba(255,210,60,0)'); gr.addColorStop(1, 'rgba(255,210,60,.75)'); cg.fillStyle = gr; cg.fillRect(0, 0, 4, 128);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    this.col = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 7, 40, 1, true).translate(0, 3.5, 0), basic({ map: tx, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    g.add(this.col); g.position.set(this.mk[0], 0, this.mk[1]); scene.add(g); this.marker = g;
    this.room(scene);
  }
  room(scene) {
    const k = new Kit(), kali = new THREE.MeshStandardMaterial({ color: '#141a2c', roughness: .3, metalness: .3 }), sph = r => new THREE.SphereGeometry(r, 10, 8);
    // the sanctum: marble floor, cream walls, a silver-framed doorway to the light outside
    k.box(M.marble, 12, .2, 16, 0, -.2, 0); k.box(M.cream, 12, 6.2, .3, 0, 0, -8); for (const s of [-1, 1]) k.box(M.cream, .3, 6.2, 16, s * 6, 0, 0);
    k.box(M.cream, 4.5, 6.2, .3, -3.75, 0, 8); k.box(M.cream, 4.5, 6.2, .3, 3.75, 0, 8); k.box(M.cream, 3, 2.8, .3, 0, 3.4, 8); k.box(M.redOx, 12, .3, 16, 0, 6.2, 0); k.beam(M.steel, [.38, 3.65, -2.55], [.38, 6.2, -2.55], .03);
    k.box(M.chrome, 3.4, .25, .45, 0, 3.4, 7.95); for (const s of [-1, 1]) k.box(M.chrome, .25, 3.4, .45, s * 1.6, 0, 7.95);
    for (const s of [-1, 1]) k.box(M.red, .1, 1.2, 15.6, s * 5.83, 3.6, 0); k.box(M.red, 2.2, .02, 9, 0, 0, 2.4);
    // ── the altar, after the Bhavatarini idol as dressed at Dakshineswar
    const alt = new THREE.Group(); alt.position.set(SX, 0, SZ); scene.add(alt);
    const T = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
    const plane = (t, w, h, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: .04, toneMapped: false, side: THREE.DoubleSide })); m.position.set(x, y, z); alt.add(m); return m; };
    const circ = (g, x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
    const almond = (g, x, y, rx, ry) => { g.beginPath(); g.moveTo(x - rx, y); g.quadraticCurveTo(x, y - ry * 2, x + rx, y); g.quadraticCurveTo(x, y + ry * 2, x - rx, y); g.closePath(); };
    const rosette = (g, x, y, r, petal = '#f4f4f8', mid = '#e8873a') => { for (let i = 0; i < 8; i++) { const a = i * PI / 4; circ(g, x + Math.cos(a) * r * .55, y + Math.sin(a) * r * .55, r * .38, petal); } circ(g, x, y, r * .32, mid); };
    // the silver-lace arch on maroon, framing her
    plane(T(512, 512, (g, w, h) => {
      g.beginPath(); g.moveTo(10, h); g.lineTo(10, 252); g.arc(256, 252, 246, PI, 0); g.lineTo(502, h); g.closePath(); g.clip();
      g.fillStyle = '#5e1c17'; g.fillRect(0, 0, w, h);
      for (let i = 0; i <= 96; i++) { const a = PI + i * PI / 96; g.strokeStyle = 'rgba(236,236,242,.95)'; g.lineWidth = 3; g.beginPath(); g.moveTo(256 + Math.cos(a) * 214, 252 + Math.sin(a) * 214); g.lineTo(256 + Math.cos(a) * 246, 252 + Math.sin(a) * 246); g.stroke(); }
      for (const [r, n, z] of [[204, 60, 9], [176, 50, 11], [146, 40, 10], [116, 30, 9]]) for (let i = 0; i <= n; i++) { const a = PI + i * PI / n; rosette(g, 256 + Math.cos(a) * r, 252 + Math.sin(a) * r, z, '#f2f2f6', i % 2 ? '#c9302a' : '#f2f2f6'); }
      for (const y of [300, 360, 420, 480]) for (const x of [36, 476]) rosette(g, x, y, 16);
      g.fillStyle = '#d9b13a'; g.beginPath(); g.arc(150, 200, 34, .9, 5.4); g.arc(162, 196, 28, 5.2, 1.1, true); g.fill(); // the crescent moon
    }), 7.2, 7.2, 0, 2.8, -7.75);
    // her blue Banarasi saree with white flowers, spread wide like wings
    plane(T(512, 384, (g, w, h) => {
      const shape = () => { g.beginPath(); g.moveTo(206, 0); g.lineTo(306, 0); g.bezierCurveTo(430, 4, 506, 52, 508, 150); g.lineTo(504, 384); g.lineTo(8, 384); g.lineTo(4, 150); g.bezierCurveTo(6, 52, 82, 4, 206, 0); g.closePath(); };
      g.save(); shape(); g.clip(); g.fillStyle = '#2c3fb2'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 15; i++) { const x = 16 + i * 34, gr = g.createLinearGradient(x - 18, 0, x + 18, 0); gr.addColorStop(0, 'rgba(10,10,60,.4)'); gr.addColorStop(.55, 'rgba(255,255,255,.1)'); gr.addColorStop(1, 'rgba(10,10,60,.4)'); g.fillStyle = gr; g.beginPath(); g.moveTo(256 + (x - 256) * .35, 0); g.lineTo(x - 18, h); g.lineTo(x + 18, h); g.closePath(); g.fill(); }
      for (let r = 0; r < 9; r++) for (let c = 0; c < 13; c++) { const x = 22 + c * 39 + (r % 2) * 19, y = 26 + r * 42; rosette(g, x, y, 13, '#f6f6fa', ['#e8873a', '#d6337a', '#3aa060'][(r + c) % 3]); circ(g, x + 19, y + 21, 2.6, '#f6f6fa'); }
      g.restore(); g.save(); shape(); g.lineWidth = 22; g.strokeStyle = '#f0f0f4'; g.stroke(); g.lineWidth = 8; g.setLineDash([6, 8]); g.strokeStyle = '#2c3fb2'; g.stroke(); g.restore();
    }), 3.4, 1.7, 0, 3.32, -6.5);
    // long black hair behind the shoulders
    plane(T(128, 160, (g) => { g.fillStyle = '#0a0a0c'; g.beginPath(); g.moveTo(40, 0); g.lineTo(88, 0); g.bezierCurveTo(128, 30, 124, 120, 112, 160); g.lineTo(16, 160); g.bezierCurveTo(4, 120, 0, 30, 40, 0); g.fill(); }), 1.75, 2.2, 0, 3.75, -6.42);
    // the body under the jewellery: gold necklaces, pearls, the heart pendant, and the mundamala
    plane(T(256, 320, (g, w, h) => {
      g.fillStyle = '#121216'; g.beginPath(); g.moveTo(44, 0); g.lineTo(212, 0); g.lineTo(196, 300); g.quadraticCurveTo(128, 330, 60, 300); g.closePath(); g.fill();
      for (let i = 0; i < 7; i++) { const wd = 92 - i * 9, dp = 70 + i * 26; g.strokeStyle = i % 2 ? '#f3f0e6' : '#e2b23a'; g.lineWidth = i % 2 ? 5 : 11; if (i % 2) g.setLineDash([4, 5]); else g.setLineDash([]);
        g.beginPath(); g.moveTo(128 - wd, 12); g.quadraticCurveTo(128, 12 + dp * 2, 128 + wd, 12); g.stroke(); if (!(i % 2)) { g.strokeStyle = 'rgba(255,245,190,.7)'; g.lineWidth = 3; g.stroke(); } }
      g.setLineDash([]); g.fillStyle = '#e2b23a'; g.beginPath(); g.moveTo(128, 236); g.bezierCurveTo(98, 206, 104, 180, 128, 196); g.bezierCurveTo(152, 180, 158, 206, 128, 236); g.fill(); circ(g, 128, 208, 6, '#c9302a');
      for (let i = 0; i <= 20; i++) { const u = i / 10 - 1, x = 128 + u * 118, y = 18 + (1 - u * u) * 280; g.fillStyle = i % 2 ? '#3f9a46' : '#e8b63a'; g.beginPath(); g.ellipse(x, y, i % 2 ? 7 : 13, i % 2 ? 11 : 15, 0, 0, 7); g.fill(); if (!(i % 2)) { circ(g, x - 4, y - 2, 1.8, '#5a3a10'); circ(g, x + 4, y - 2, 1.8, '#5a3a10'); } }
    }), 1.3, 1.3, 0, 3.4, -6.3);
    // her face: black, large red-rimmed eyes, the third eye, red brows, a gold nose ring, the red tongue
    plane(T(256, 320, (g) => {
      g.fillStyle = '#0a0a0c'; g.beginPath(); g.ellipse(128, 122, 120, 122, 0, 0, 7); g.fill();
      g.fillStyle = '#18181c'; g.beginPath(); g.ellipse(128, 140, 90, 104, 0, 0, 7); g.fill();
      g.strokeStyle = '#d0231f'; g.lineWidth = 8; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(128 + s * 40, 120, 32, 15, 0, PI * 1.12, PI * 1.88); g.stroke(); }
      for (const s of [-1, 1]) { const x = 128 + s * 40, y = 142; g.fillStyle = '#d0231f'; almond(g, x, y, 35, 21); g.fill(); g.fillStyle = '#fbf6ef'; almond(g, x, y, 28, 15); g.fill(); circ(g, x - s * 3, y, 10, '#0b0b0b'); circ(g, x - s * 6, y - 4, 3, '#fff'); }
      g.save(); g.translate(128, 86); g.rotate(PI / 2); g.fillStyle = '#d0231f'; almond(g, 0, 0, 22, 12); g.fill(); g.fillStyle = '#fbf6ef'; almond(g, 0, 0, 16, 8); g.fill(); circ(g, 0, 0, 5, '#0b0b0b'); g.restore();
      circ(g, 128, 62, 7, '#d0231f'); g.strokeStyle = '#e2b23a'; g.lineWidth = 4; g.beginPath(); g.arc(150, 190, 11, 0, 7); g.stroke(); circ(g, 150, 201, 3, '#c9302a');
      g.fillStyle = '#c4201c'; g.beginPath(); g.moveTo(104, 202); g.quadraticCurveTo(128, 194, 152, 202); g.quadraticCurveTo(128, 212, 104, 202); g.fill();
      g.fillStyle = '#e3342c'; g.beginPath(); g.moveTo(110, 206); g.quadraticCurveTo(128, 200, 146, 206); g.lineTo(144, 276); g.quadraticCurveTo(128, 304, 112, 276); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,190,180,.35)'; g.fillRect(124, 214, 6, 60);
      for (const s of [-1, 1]) { g.strokeStyle = '#e2b23a'; g.lineWidth = 6; g.beginPath(); g.arc(128 + s * 98, 168, 16, 0, 7); g.stroke(); circ(g, 128 + s * 98, 168, 6, '#c9302a'); }
    }), 1.0, 1.25, 0, 4.25, -6.18);
    // the tall gold crown (mukut) with red and green stones and rows of pearls
    plane(T(256, 300, (g, w, h) => {
      const sh = (k) => { g.beginPath(); g.moveTo(128 - 104 * k, 270); g.bezierCurveTo(128 - 110 * k, 160, 128 - 40 * k, 60 + (1 - k) * 90, 128, 8 + (1 - k) * 120); g.bezierCurveTo(128 + 40 * k, 60 + (1 - k) * 90, 128 + 110 * k, 160, 128 + 104 * k, 270); g.closePath(); };
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f6d466'); gr.addColorStop(1, '#c9921f'); g.fillStyle = gr; sh(1); g.fill();
      g.strokeStyle = '#f3f0e6'; g.lineWidth = 4; g.setLineDash([3, 5]); sh(.86); g.stroke(); sh(.62); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#b33a2a'; sh(.42); g.fill(); g.strokeStyle = '#f6d466'; g.lineWidth = 5; sh(.42); g.stroke();
      for (const [x, y, r, c] of [[128, 200, 14, '#c9302a'], [128, 150, 9, '#2f8f4a'], [128, 112, 7, '#c9302a'], [88, 220, 8, '#2f8f4a'], [168, 220, 8, '#2f8f4a'], [70, 180, 6, '#c9302a'], [186, 180, 6, '#c9302a']]) { circ(g, x, y, r + 3, '#f6d466'); circ(g, x, y, r, c); }
      g.fillStyle = '#d9a52e'; g.fillRect(14, 262, 228, 36); for (let x = 26; x < 240; x += 24) { circ(g, x, 280, 7, x % 48 ? '#c9302a' : '#2f8f4a'); }
      g.fillStyle = '#f3f0e6'; for (let x = 18; x < 240; x += 9) circ(g, x, 296, 3, '#f3f0e6');
    }), 1.1, 1.22, 0, 5.36, -6.17);
    // four red hands with gold armlets and bangles; upper left raised with a gold khadga, upper right in blessing
    const red = new THREE.MeshStandardMaterial({ color: '#c8281f', emissive: '#4a0a07', roughness: .5 });
    const arm = (sx, ex, ey, raised) => {
      k.beam(red, [sx * .52, 3.95, -6.24], [sx * .8, 3.55, -6.12], .21); k.beam(red, [sx * .8, 3.55, -6.12], [ex, ey, -6.02], .18);
      k.cyl(M.gold, .14, .14, .16, sx * .66, 3.75, -6.17, 10); k.cyl(M.gold, .12, .12, .2, ex - (ex - sx * .8) * .25, ey - (ey - 3.55) * .25, -6.04, 10);
      k.add(red, new THREE.SphereGeometry(.16, 10, 8).scale(1, 1.25, .55), ex, ey + (raised ? .13 : -.08), -6.0);
    };
    arm(-1, -1.25, 4.55, true); arm(-1, -1.15, 3.2, false); arm(1, 1.25, 4.55, true); arm(1, 1.15, 3.2, false);
    plane(T(96, 256, (g) => { g.fillStyle = '#e8b63a'; g.beginPath(); g.moveTo(40, 196); g.bezierCurveTo(20, 120, 30, 50, 70, 6); g.bezierCurveTo(78, 60, 70, 130, 58, 196); g.closePath(); g.fill(); g.fillStyle = '#c9302a'; g.fillRect(36, 196, 26, 14); g.fillStyle = '#e8b63a'; g.fillRect(42, 210, 14, 44); }), .5, 1.3, -1.32, 5.25, -5.98);
    // silver pillars, a silver trishul, red and white tassels across the top
    for (const s of [-1, 1]) { k.box(M.chrome, .5, .3, .5, s * 2.45, 1.5, -6.6); k.cyl(M.chrome, .13, .15, 3.8, s * 2.45, 1.8, -6.6, 12); k.box(M.chrome, .5, .24, .5, s * 2.45, 5.6, -6.6); for (const y of [2.4, 3.4, 4.4, 5.2]) k.cyl(M.chrome, .17, .17, .08, s * 2.45, y, -6.6, 12); }
    for (let i = 0; i < 30; i++) k.add(i % 2 ? M.white : M.red, new THREE.ConeGeometry(.09, .34, 6).rotateX(PI), -2.9 + i * .2, 5.88, -7.3);
    k.box(M.gold, 6.2, .1, .08, 0, 6.0, -7.3);
    // the altar, dressed in yellow, with Shiva lying beneath her feet
    const cloth = new THREE.MeshStandardMaterial({ map: T(256, 64, (g, w, h) => { g.fillStyle = '#f0c63a'; g.fillRect(0, 0, w, h); for (let x = 8; x < w; x += 20) { g.fillStyle = ['#c9302a', '#2f8f4a', '#e8873a'][(x / 20 | 0) % 3]; g.beginPath(); g.ellipse(x, 34, 5, 11, .3, 0, 7); g.fill(); } }), roughness: .8, emissive: '#3a2a08' });
    k.box(cloth, 5.4, 1.5, 3, 0, 0, -6.3);
    const ash = new THREE.MeshStandardMaterial({ color: '#eef0f2', roughness: .6, emissive: '#2a2c30' }), dark = new THREE.MeshStandardMaterial({ color: '#16161b', roughness: .35, metalness: .2, emissive: '#060608' });
    // Shiva, white with ash, lying on his back with his head towards the doorway
    k.add(ash, new THREE.CapsuleGeometry(.3, 1.9, 4, 12).rotateX(PI / 2), 0, 1.82, -6.25);
    for (const s of [-1, 1]) k.add(ash, new THREE.CapsuleGeometry(.09, .95, 4, 8).rotateX(PI / 2), s * .38, 1.78, -5.75); // arms by his sides
    k.add(M.orange, new THREE.CylinderGeometry(.315, .315, .5, 14).rotateX(PI / 2), 0, 1.82, -6.9);
    for (const z of [-7.05, -6.9, -6.75]) k.add(M.dark, new THREE.TorusGeometry(.315, .02, 4, 14), 0, 1.82, z);
    k.add(ash, new THREE.SphereGeometry(.27, 14, 12), 0, 1.86, -4.82); k.add(M.dark, new THREE.SphereGeometry(.24, 12, 8, 0, PI * 2, 0, PI / 2).rotateX(PI / 2), 0, 1.88, -4.72); // matted hair towards us
    k.add(M.dark, new THREE.SphereGeometry(.13, 10, 8), 0, 1.95, -4.5); k.add(M.gold, new THREE.TorusGeometry(.13, .025, 5, 14), 0, 1.98, -4.5); // the jata bun with a gold band
    k.add(new THREE.MeshStandardMaterial({ color: '#2f7a46', roughness: .5 }), new THREE.TorusGeometry(.2, .035, 6, 16).rotateX(PI / 2), 0, 1.82, -5.1); // the serpent at his neck
    for (let i = 0; i < 12; i++) k.add(i % 2 ? M.dark : M.clay, new THREE.SphereGeometry(.032, 6, 4), Math.cos(i / 11 * PI) * .17, 2.08, -5.3 - Math.sin(i / 11 * PI) * .12); // rudraksha
    // his face, looking up, forehead towards us: closed eyes, the third eye, three lines of ash
    { const t = T(128, 128, (g) => { g.fillStyle = '#eef0f2'; g.beginPath(); g.ellipse(64, 64, 52, 60, 0, 0, 7); g.fill();
        g.strokeStyle = '#2a2a2e'; g.lineWidth = 4; for (const s of [-1, 1]) { g.beginPath(); g.arc(64 + s * 20, 58, 11, .3, PI - .3); g.stroke(); }
        g.strokeStyle = '#b3261e'; g.lineWidth = 3; for (const y of [82, 90, 98]) { g.beginPath(); g.moveTo(36, y); g.lineTo(92, y); g.stroke(); }
        g.fillStyle = '#b3261e'; g.beginPath(); g.ellipse(64, 74, 4, 9, 0, 0, 7); g.fill(); g.strokeStyle = '#b3261e'; g.lineWidth = 3; g.beginPath(); g.arc(64, 30, 8, .2, PI - .2); g.stroke(); });
      const f = plane(t, .4, .4, 0, 2.1, -4.86); f.rotation.x = -PI / 2; f.rotation.z = PI; }
    // her legs coming down from under the saree, the right foot on his chest, the left on his body
    for (const [x, z, y0] of [[-.15, -5.55, 2.13], [.16, -5.95, 2.13]]) {
      k.beam(dark, [x * .9, 2.55, -6.3], [x, y0 + .08, z - .08], .16);
      k.add(dark, new THREE.BoxGeometry(.13, .07, .3), x, y0 + .03, z); k.add(M.red, new THREE.BoxGeometry(.135, .02, .31), x, y0, z); // alta on the soles
      k.add(M.chrome, new THREE.TorusGeometry(.085, .022, 5, 12).rotateX(PI / 2), x, y0 + .14, z - .1); // silver anklets
      k.add(M.red, new THREE.SphereGeometry(.07, 8, 6).scale(1.2, .5, 1.2), x + .02, y0 + .08, z + .05); k.add(M.yellow, new THREE.SphereGeometry(.02, 6, 4), x + .02, y0 + .12, z + .05); // a hibiscus on each foot
    }
    // the arati plate, a conch, incense, and hibiscus at her feet
    for (const s of [-1, 1]) { k.cyl(M.gold, .26, .22, .04, s * 1.35, 1.5, -5.1, 18); for (let i = 0; i < 5; i++) { const a = i * 1.26; k.cyl(M.clay, .05, .04, .05, s * 1.35 + Math.cos(a) * .15, 1.54, -5.1 + Math.sin(a) * .15, 8); } }
    k.add(M.white, new THREE.ConeGeometry(.08, .3, 8).rotateZ(PI / 2), 1.9, 1.58, -5.3); k.cyl(M.dark, .008, .008, .5, -1.9, 1.5, -5.3, 4); k.cyl(M.dark, .008, .008, .5, -1.84, 1.5, -5.32, 4);
    for (let i = 0; i < 14; i++) { const a = i / 13 * PI; k.add(M.red, new THREE.SphereGeometry(.07, 8, 6).scale(1.2, .5, 1.2), Math.cos(a) * .75, 1.53, -4.5 - Math.sin(a) * .25); }
    for (let i = 0; i < 22; i++) { const x = -2.4 + (i % 11) * .48; if (Math.abs(x) > .7) k.add([M.red, M.orange, M.yellow, M.pink][i % 4], new THREE.SphereGeometry(.09, 8, 6), x, 1.56, -5.6 + (i > 10 ? -.3 : 0)); }
    for (const s of [-1, 1]) { k.cyl(M.gold, .05, .09, 1.1, s * 2.6, 0, -4.6, 8); k.cyl(M.gold, .2, .12, .12, s * 2.6, 1.1, -4.6, 12); }
    k.box(M.gold, 6, .07, .07, 0, 1, -3.45); for (let x = -3; x <= 3; x += 1.5) k.cyl(M.gold, .04, .04, 1, x, 0, -3.45, 6);
    const room = k.build(); room.position.set(SX, 0, SZ); scene.add(room);
    // lamp flames, the doorway's daylight, and the bell (it swings from a pivot at the ceiling)
    const fl = new THREE.MeshBasicMaterial({ color: '#ffb33a', toneMapped: false });
    this.flames = [-1, 1].map(s => { const f = new THREE.Mesh(new THREE.ConeGeometry(.07, .28, 8).translate(0, .14, 0), fl); f.position.set(SX + s * 2.6, 1.24, SZ - 4.6); scene.add(f); return f; });
    const door = new THREE.Mesh(new THREE.PlaneGeometry(3, 3.4), new THREE.MeshBasicMaterial({ color: '#fff1d6', toneMapped: false })); door.position.set(SX, 1.7, SZ + 8.3); door.rotation.y = PI; scene.add(door);
    const bk = new Kit(); bk.beam(M.steel, [0, 0, 0], [0, -.25, 0], .03);
    bk.add(M.gold, new THREE.LatheGeometry([[0, 0], [.1, 0], [.14, -.05], [.16, -.24], [.23, -.42], [.26, -.46]].map(([x, y]) => new THREE.Vector2(x, y)), 18).translate(0, -.25, 0));
    bk.add(M.gold, sph(.05), 0, -.66, 0); bk.cyl(M.red, .015, .015, .9, 0, -1.55, 0, 5);
    this.bell = bk.build(); this.bell.position.set(SX + .38, 3.65, SZ - 2.55); scene.add(this.bell);
  }
  start() {
    const pl = this.pl; this.t = 0; this.fired.clear(); pl.held = true; pl.keys = {}; pl.vel.set(0, 0, 0);
    $('fade').classList.add('on'); document.body.classList.add('cine');
  }
  once(key, T, at, fn) { if (T >= at && !this.fired.has(key)) { this.fired.add(key); fn(); } }
  update(dt, time) {
    const pl = this.pl, [mx, mz] = this.mk;
    this.marker.visible = !this.closed && this.t < 0; if (this.marker.visible) { const s = 1 + .06 * Math.sin(time * 3); this.marker.scale.set(s, 1, s); this.col.material.opacity = .75 + .25 * Math.sin(time * 2.2); }
    for (const [i, f] of this.flames.entries()) f.scale.set(1, 1 + .18 * Math.sin(time * 23 + i * 2) + .08 * Math.sin(time * 37), 1);
    if (this.t < 0) {
      const d = Math.hypot(pl.pos.x - mx, pl.pos.z - mz);
      if (this.closed) { if (d > 60) this.closed = false; } // open again once you have wandered off
      else if (d < 1.3 && pl.zone && !pl.car && !pl.ride && !pl.held && pl.pos.y === 0) this.start();
      return;
    }
    const T = (this.t += dt), r = pl.rig, p = pl.pos;
    this.once('in', T, .8, () => p.set(SX, 0, SZ + 6.5)); this.once('lit', T, 1.0, () => $('fade').classList.remove('on'));
    // where the boy is and what he is doing
    let sp = 0, x = 0, z = -2.4, hd = PI;
    if (T < 5) { z = L(6.5, -2.4, (T - 1) / 4); sp = T > 1 ? 2.2 : 0; }
    else if (T > 12.4 && T < 13) hd = L(PI, 2 * PI, (T - 12.4) / .6);
    else if (T >= 13) { hd = 0; z = L(-2.4, 6.8, (T - 13) / 3); sp = 3; }
    if (T >= .8) { p.set(SX + x, 0, SZ + z); pl.heading = hd; pl.root.position.copy(p); pl.root.rotation.y = hd; }
    animate(r, sp, dt);
    const fold = T >= 5 && T < 9.6, ring = T >= 9.6 && T < 12.4;
    if (fold) { const k = Math.min(1, (T - 5) * 2.5); r.armL.rotation.set(-.78 * k, 0, .66 * k); r.armR.rotation.set(-.78 * k, 0, -.66 * k); r.body.rotation.x = T > 6 && T < 8.6 ? .22 * Math.sin(Math.min(1, (T - 6) / .6) * PI / 2) : 0; } // folded hands, a bow
    else if (ring) { r.armL.rotation.set(-2.85 * Math.min(1, (T - 9.6) * 3), 0, .15); r.armR.rotation.set(0, 0, .07); r.body.rotation.x = 0; } // the right hand up to the bell rope
    else if (T >= 12.4) { r.armL.rotation.z = -.07; r.armR.rotation.z = .07; }
    // sounds: the conch, temple bells, three rings of the big bell
    this.once('conch', T, 5.4, () => this.snd.shankha()); this.once('bells', T, 7, () => this.snd.temple());
    for (const at of [10.1, 10.9, 11.7]) this.once('b' + at, T, at, () => { this.snd.bigBell(); this.bt = at; });
    const bt = this.bt ?? -9; this.bell.rotation.z = T >= bt ? .4 * Math.sin((T - bt) * 9) * Math.exp(-(T - bt) * 1.4) : 0;
    // the camera: following him in, beside him at the altar, low on the bell, then watching him walk out into the light
    const c = this.cam, at = (cx, cy, cz, lx, ly, lz) => { c.position.set(SX + cx, cy, SZ + cz); c.lookAt(SX + lx, ly, SZ + lz); };
    if (T < 5) at(0, 2.6, 7.4, 0, 2.2, -5); else if (T < 9.6) at(-1.3, 2.9, .3, .1, 3.25, -6.3); else if (T < 12.4) at(-1.7, 1.45, -.2, .35, 2.7, -2.6); else at(0, 2.3, -3.7, 0, 1.6, 7);
    // out again: the temple closes behind him
    this.once('dark', T, 15.3, () => $('fade').classList.add('on'));
    if (T >= 16.1) {
      p.set(mx, 0, mz + 3.5); pl.heading = 0; pl.yaw = 0; pl.pitch = .18; r.armL.rotation.set(0, 0, -.07); r.armR.rotation.set(0, 0, .07); r.body.rotation.x = 0;
      this.t = -1; this.closed = true; pl.held = false; this.bt = null; document.body.classList.remove('cine'); setTimeout(() => $('fade').classList.remove('on'), 300);
    }
  }
}
