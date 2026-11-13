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
    k.box(M.marble, 12, .2, 16, 0, -.2, 0); k.box(M.cream, 12, 5.2, .3, 0, 0, -8); for (const s of [-1, 1]) k.box(M.cream, .3, 5.2, 16, s * 6, 0, 0);
    k.box(M.cream, 4.5, 5.2, .3, -3.75, 0, 8); k.box(M.cream, 4.5, 5.2, .3, 3.75, 0, 8); k.box(M.cream, 3, 1.8, .3, 0, 3.4, 8); k.box(M.redOx, 12, .3, 16, 0, 5.2, 0);
    k.box(M.chrome, 3.4, .25, .45, 0, 3.4, 7.95); for (const s of [-1, 1]) k.box(M.chrome, .25, 3.4, .45, s * 1.6, 0, 7.95);
    for (const s of [-1, 1]) k.box(M.red, .1, 1.2, 15.6, s * 5.83, 3.6, 0); k.box(M.red, 2.2, .02, 9, 0, 0, 2.4);
    // the altar: red cloth with a gold border, a silver arch, the silver throne and lotus
    k.box(M.red, 5.6, 4.6, .1, 0, .3, -7.8); k.box(M.gold, 5.9, .15, .12, 0, 4.85, -7.75); for (const s of [-1, 1]) k.box(M.gold, .15, 4.6, .12, s * 2.88, .3, -7.75);
    k.add(M.chrome, new THREE.TorusGeometry(2.3, .13, 8, 32, PI), 0, 2.6, -7.55);
    k.box(M.stone, 5, 1, 3, 0, 0, -6.3); k.box(M.chrome, 3.6, .5, 2.2, 0, 1, -6.3); k.cyl(M.chrome, 1.4, 1.6, .3, 0, 1.5, -6.3, 20);
    // Shiva, lying on the throne
    k.add(M.white, new THREE.CapsuleGeometry(.27, 1.8, 4, 10).rotateZ(PI / 2), 0, 2.02, -6.1); k.add(M.white, sph(.26), -1.28, 2.06, -6.1); k.cyl(M.gold, .2, .24, .18, -1.28, 2.25, -6.1, 10);
    // Ma Kali, standing on Shiva: dark, four-armed, three-eyed, tongue out, a garland of red flowers, a sword raised
    for (const x of [-.22, .22]) k.cyl(kali, .13, .15, 1.05, x, 2.2, -6.2, 10);
    k.cone(M.red, .75, 1.05, 0, 2.6, -6.2, 18); k.cyl(M.gold, .43, .43, .1, 0, 3.42, -6.2, 18);
    k.cyl(kali, .36, .43, 1.0, 0, 3.45, -6.2, 16); k.add(kali, sph(.43).scale(1, 1.1, .95), 0, 4.85, -6.2);
    k.box(M.dark, 1.5, 2.6, .25, 0, 2.7, -6.62); k.cyl(M.gold, .36, .45, .42, 0, 5.15, -6.2, 14); k.cone(M.gold, .33, .62, 0, 5.57, -6.2, 14);
    for (const [x, y] of [[-.16, 4.93], [.16, 4.93], [0, 5.12]]) { k.add(M.white, sph(.075), x, y, -5.83); k.add(M.red, sph(.035), x, y, -5.77); }
    k.box(M.red, .16, .34, .06, 0, 4.42, -5.84);
    for (let i = 0; i <= 16; i++) { const u = i / 8 - 1; k.add(i % 3 ? M.red : M.orange, sph(.085), u * .48, 4.42 - (1 - u * u) * .75, -5.82 + (1 - u * u) * .05); }
    const arm = (a, b, w) => { k.beam(kali, a, b, w); k.add(kali, sph(w * .9), ...b); };
    arm([-.42, 4.25, -6.2], [-.98, 4.95, -5.95], .14); arm([-.42, 4.12, -6.2], [-.92, 3.45, -5.85], .14); arm([.42, 4.25, -6.2], [.98, 4.85, -5.95], .14); arm([.42, 4.12, -6.2], [.92, 3.45, -5.85], .14);
    k.beam(M.steel, [.98, 4.85, -5.95], [1.2, 6.2, -6.05], .07); k.box(M.gold, .3, .08, .1, .98, 4.86, -5.95);
    for (let i = 0; i < 26; i++) k.add([M.red, M.orange, M.yellow, M.red][i % 4], sph(.12), -1.4 + (i % 13) * .23, 1.62 + (i > 12 ? .08 : 0), -5.05 + (i > 12 ? -.2 : 0));
    for (const [zz, top, sag] of [[-7.35, 5.0, 1.0], [-7.15, 4.7, .8]]) for (let i = 0; i <= 26; i++) { const u = i / 13 - 1; k.add(i % 2 ? M.orange : M.yellow, sph(.09), u * 2.7, top - (1 - u * u) * sag, zz); } // marigold strings framing the arch behind her
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
    if (T < 5) at(0, 2.6, 7.4, 0, 2.2, -5); else if (T < 9.6) at(2.6, 1.9, -.3, -.2, 2.3, -4.6); else if (T < 12.4) at(-1.7, 1.45, -.2, .35, 2.7, -2.6); else at(0, 2.3, -3.7, 0, 1.6, 7);
    // out again: the temple closes behind him
    this.once('dark', T, 15.3, () => $('fade').classList.add('on'));
    if (T >= 16.1) {
      p.set(mx, 0, mz + 3.5); pl.heading = 0; pl.yaw = 0; pl.pitch = .18; r.armL.rotation.set(0, 0, -.07); r.armR.rotation.set(0, 0, .07); r.body.rotation.x = 0;
      this.t = -1; this.closed = true; pl.held = false; this.bt = null; document.body.classList.remove('cine'); setTimeout(() => $('fade').classList.remove('on'), 300);
    }
  }
}
