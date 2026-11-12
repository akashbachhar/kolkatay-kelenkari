// All sound is synthesised in the browser (no audio files): city hum, crowd murmur, horns, tram bell, crows, footsteps.
export class Sound {
  constructor() { this.px = 0; this.pz = 0; this.yaw = 0; this.muted = false; this.next = 2; this.crowT = 9; this.last = 0; }
  start() {
    if (this.ctx) { this.ctx.resume?.(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC(); this.out = c.createGain(); this.out.gain.value = .9; this.out.connect(c.destination);
    const mk = (secs, brown) => { const n = c.sampleRate * secs, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); let v = 0; for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; if (brown) { v = (v + .02 * w) / 1.02; d[i] = v * 3.5; } else d[i] = w; } return b; };
    this.brown = mk(4, true); this.white = mk(.5, false);
    const loop = (type, f, q, g) => { const s = c.createBufferSource(); s.buffer = this.brown; s.loop = true; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const gn = c.createGain(); gn.gain.value = g; s.connect(fl); fl.connect(gn); gn.connect(this.out); s.start(); return gn; };
    this.rumble = loop('lowpass', 240, .4, .34); this.murmur = loop('bandpass', 850, .5, .2);
  }
  toggle() { this.muted = !this.muted; if (this.out) this.out.gain.value = this.muted ? 0 : .9; return this.muted; }
  listen(p, yaw) { this.px = p.x; this.pz = p.z; this.yaw = yaw; }
  at(x, z, base, reach = 110) { const dx = x - this.px, dz = z - this.pz, d = Math.hypot(dx, dz); if (d > reach) return null; return [base / (1 + d / 10), Math.max(-1, Math.min(1, (dx * Math.cos(this.yaw) - dz * Math.sin(this.yaw)) / Math.max(d, 4)))]; }
  voice(freqs, t0, dur, vol, pan, type = 'square', cut = 2000, glide = 1) {
    const c = this.ctx, g = c.createGain(), f = c.createBiquadFilter(), t = c.currentTime + t0; f.type = 'lowpass'; f.frequency.value = cut;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012); g.gain.setValueAtTime(vol, t + dur * .8); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    let dst = this.out; if (c.createStereoPanner) { const pn = c.createStereoPanner(); pn.pan.value = pan; pn.connect(this.out); dst = pn; }
    f.connect(g); g.connect(dst);
    for (const hz of freqs) { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(hz, t); if (glide !== 1) o.frequency.exponentialRampToValueAtTime(hz * glide, t + dur); o.connect(f); o.start(t); o.stop(t + dur + .05); }
  }
  horn(x, z, kind = 0, loud = 1) { // 0 taxi "peep-peep", 1 bus, 2 far-off
    if (!this.ctx || this.muted) return; const a = this.at(x, z, .2 * loud); if (!a || this.ctx.currentTime - this.last < .22) return; this.last = this.ctx.currentTime;
    if (kind === 1) this.voice([296, 370], 0, .55, a[0] * .8, a[1], 'sawtooth', 1400);
    else { const k = .94 + Math.random() * .12; this.voice([432 * k, 544 * k], 0, .16, a[0] * .7, a[1], 'square', 2200); this.voice([432 * k, 544 * k], .23, .3, a[0] * .7, a[1], 'square', 2200); }
  }
  bell(x, z) { if (!this.ctx || this.muted) return; const a = this.at(x, z, .16, 70); if (!a) return; for (const t of [0, .28]) this.voice([1660, 2490, 3320], t, .5, a[0] * .5, a[1], 'sine', 6000); }
  ship() { if (!this.ctx || this.muted) return; this.voice([98, 147, 196], 0, 1.6, .1, 0, 'sawtooth', 700); this.voice([98, 147, 196], 1.9, .7, .1, 0, 'sawtooth', 700); }
  temple() { const pan = Math.random() * 1.4 - .7; for (const t of [0, .55, 1.1]) this.voice([523, 1046, 1570, 2093], t, 1.5, .018, pan, 'sine', 5000); }
  ring(x, z) { if (!this.ctx || this.muted) return; const a = this.at(x, z, .1, 40); if (!a) return; for (const t of [0, .13, .26]) this.voice([2100, 3150], t, .12, a[0] * .5, a[1], 'triangle', 7000); }
  engine(on, sp = 0, thr = 0) { // engine note rises with speed and throttle
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime;
    if (!this.eng) { if (!on) return; const o1 = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(); o1.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; g.gain.value = 0; o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.out); o1.start(); o2.start(); this.eng = { o1, o2, f, g }; }
    const e = this.eng, gear = Math.min(3, Math.floor(sp / 6.5)), hz = 44 + (sp - gear * 6.5) * 7 + gear * 9 + thr * 9;
    e.o1.frequency.setTargetAtTime(hz, t, .07); e.o2.frequency.setTargetAtTime(hz / 2, t, .07); e.f.frequency.setTargetAtTime(300 + sp * 40 + thr * 200, t, .1);
    e.g.gain.setTargetAtTime(on ? .03 + Math.min(.045, sp * .002) + thr * .025 : 0, t, .08);
  }
  noise(freq, q, vol, dur) { if (!this.ctx || this.muted) return; const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime; s.buffer = this.white; s.loop = true; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); s.connect(f); f.connect(g); g.connect(this.out); s.start(t); s.stop(t + dur + .05); }
  skid() { this.noise(1700, 3, .07, .55); }
  thud() { if ((this.ctx?.currentTime || 0) - (this.tt || 0) < .4) return; this.tt = this.ctx?.currentTime; this.noise(140, .7, .3, .22); }
  crash(i = .5, metal) { // layered impact: thump, crunch, ringing metal and, for hard hits, glass
    if (!this.ctx || this.muted) return; const t = this.ctx.currentTime; if (t - (this.ct || 0) < .25) return; this.ct = t;
    this.noise(105, .6, .32 * (.4 + i), .32); this.noise(650 + Math.random() * 500, 1.1, .16 * (.4 + i), .2 + i * .22);
    if (metal || i > .45) for (let j = 0; j < 4; j++) this.voice([800 + Math.random() * 2300], j * .03, .25 + Math.random() * .3, .01 + i * .012, Math.random() - .5, 'triangle', 6000, .97);
    if (i > .6) for (let j = 0; j < 8; j++) this.voice([3000 + Math.random() * 4200], .04 + Math.random() * .4, .08, .007, Math.random() * 1.6 - .8, 'sine', 9000);
  }
  clang() { if (!this.ctx || this.muted) return; for (const [f, d] of [[410, .9], [1130, .7], [1870, .5], [2760, .35]]) this.voice([f * (.97 + Math.random() * .06)], 0, d, .03, 0, 'sine', 8000); this.noise(2500, 2, .09, .08); }
  scrape() { const t = this.ctx?.currentTime || 0; if (t - (this.st || 0) < .3) return; this.st = t; this.noise(1300, 1.5, .035, .3); }
  yelp(x, z) { if (!this.ctx || this.muted) return; const a = this.at(x, z, .3, 60); if (!a) return; const f = 380 + Math.random() * 260; this.voice([f, f * 2.02, f * 3.01], 0, .34, a[0] * .22, a[1], 'sawtooth', 1800, .6); this.noise(170, .8, .2, .15); }
  whistle() { if (!this.ctx || this.muted) return; for (const t of [0, .16, .32]) this.voice([2850, 3080], t, .14, .03, 0, 'square', 7000); }
  siren() { if (!this.ctx || this.muted) return; this.sn = !this.sn; this.voice([this.sn ? 660 : 880], 0, .5, .022, 0, 'triangle', 2400); }
  punch(hit) {
    if (!this.ctx || this.muted) return;
    this.noise(700, .9, .07, .16); // the swing
    if (!hit) return;
    this.voice([150], .05, .16, .5, 0, 'sine', 1800, .35); this.voice([95], .05, .2, .35, 0, 'triangle', 900, .5); // thump
    setTimeout(() => { this.noise(2200, .7, .4, .06); this.noise(240, .7, .45, .15); }, 50); // slap and body
  }
  step(fast) {
    if (!this.ctx || this.muted) return; const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime; s.buffer = this.white;
    f.type = 'bandpass'; f.frequency.value = 500 + Math.random() * 300; f.Q.value = .8; g.gain.setValueAtTime(fast ? .1 : .06, t); g.gain.exponentialRampToValueAtTime(.0001, t + .09);
    s.connect(f); f.connect(g); g.connect(this.out); s.start(t, Math.random() * .3, .1);
  }
  crow(pan) { for (let i = 0; i < 2 + (Math.random() * 2 | 0); i++) this.voice([690, 1035, 1380], i * .34, .22, .018, pan, 'sawtooth', 2600, .72); }
  tick(dt, open, temple) { // far-off city: horns somewhere in the distance, crows over the Maidan
    if (!this.ctx || this.muted) return;
    if (temple) { if ((this.bellT = (this.bellT ?? 2) - dt) < 0) { this.bellT = 3 + Math.random() * 6; this.temple(); } }
    else if ((this.next -= dt) < 0) { this.next = 2.5 + Math.random() * 7; const a = Math.random() * 6.28, d = 45 + Math.random() * 50; this.horn(this.px + Math.cos(a) * d, this.pz + Math.sin(a) * d, Math.random() < .25 ? 1 : 0, 1.6); }
    if ((this.crowT -= dt) < 0) { this.crowT = (open ? 6 : 16) + Math.random() * 14; this.crow(Math.random() * 2 - 1); }
    if (this.rumble) this.rumble.gain.value += ((open ? .16 : .34) - this.rumble.gain.value) * Math.min(1, dt); if (this.murmur) this.murmur.gain.value += ((open ? .05 : .2) - this.murmur.gain.value) * Math.min(1, dt);
  }
}
