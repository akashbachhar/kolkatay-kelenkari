// The soundtrack, synthesised from scratch in a background thread (no audio files).
// Three seamless loops: 'explore' (evening Kolkata: tanpura, bansuri, sitar, soft tabla),
// 'chase' (police on your tail: dhak and dhol, a hard bass ostinato, a fast sitar riff),
// 'temple' (Dakshineswar: harmonium, aarti bells, kansar and conch).
// Everything is written into the loop modulo its length, so tails wrap round and the loop has no seam.

let SR = 24000, rnd = 1;
const R = () => { rnd = (rnd * 16807) % 2147483647; return rnd / 2147483647; }; // seeded: the same music every visit
const TAU = Math.PI * 2;
const SA = 146.83; // Sa = D
const SW = { S: 1, r: 16 / 15, R: 9 / 8, g: 6 / 5, G: 5 / 4, M: 4 / 3, m: 45 / 32, P: 3 / 2, d: 8 / 5, D: 5 / 3, n: 16 / 9, N: 15 / 8 };
const hz = (s, o = 0) => SA * SW[s] * 2 ** o;

class Track {
  constructor(secs) { this.N = Math.round(secs * SR); this.L = new Float32Array(this.N); this.R = new Float32Array(this.N); }
  add(sig, t, gain = 1, pan = 0) { // constant-power pan, wrapping round the loop
    const a = Math.cos((pan + 1) * Math.PI / 4) * gain, b = Math.sin((pan + 1) * Math.PI / 4) * gain, N = this.N;
    let i = ((Math.round(t * SR) % N) + N) % N;
    for (let k = 0; k < sig.length; k++) { this.L[i] += sig[k] * a; this.R[i] += sig[k] * b; if (++i === N) i = 0; }
  }
}
const env = (n, att, rel) => { const e = new Float32Array(n), A = att * SR, Rl = rel * SR; for (let i = 0; i < n; i++) e[i] = Math.min(1, i / A, (n - i) / Rl); return e; };

// ── instruments
function pluck(f, dur, bright = .5, decay = .997) { // Karplus-Strong string
  const n = Math.round(dur * SR), p = Math.max(2, Math.round(SR / f)), o = new Float32Array(n);
  for (let i = 0; i < Math.min(p, n); i++) o[i] = R() * 2 - 1;
  for (let i = p; i < n; i++) o[i] = decay * (bright * o[i - p] + (1 - bright) * o[i - p - 1 >= 0 ? i - p - 1 : i - p]);
  for (let i = 0; i < Math.min(40, n); i++) o[i] *= i / 40;
  return o;
}
function sitar(f, dur) { // a bright pluck with the jawari buzz
  const s = pluck(f, dur, .55, .9988); for (let i = 0; i < s.length; i++) { const x = s[i]; s[i] = (x + Math.tanh(x * 3.2) * .4) * Math.exp(-i / SR * 1.1); } return s;
}
function tanpura(f, dur) { const s = pluck(f, dur, .32, .99935); for (let i = 0; i < s.length; i++) s[i] = s[i] + Math.tanh(s[i] * 2.2) * .25; return s; }
function bansuri(notes, beat) { // one breath per phrase: notes glide into each other, vibrato grows on held notes, a little air in the tone
  const tot = notes.reduce((a, q) => a + q[2], 0) * beat, n = Math.round(tot * SR), o = new Float32Array(n); let ph = 0, t = 0, ni = 0, ns = 0, f0 = (q => hz(q[0], q[1]))(notes.find(q => q[0] !== '-')), lp = 0;
  for (let i = 0; i < n; i++) {
    const tt = i / SR; while (ni < notes.length - 1 && tt >= ns + notes[ni][2] * beat) { ns += notes[ni][2] * beat; ni++; }
    const q = notes[ni], tgt = q[0] === '-' ? f0 : hz(q[0], q[1]), into = tt - ns; f0 += (tgt - f0) * Math.min(1, 28 / SR);
    const vib = 1 + Math.sin(TAU * 5.2 * tt) * .006 * Math.min(1, Math.max(0, into - .25) * 2);
    ph += TAU * f0 * vib / SR; const tone = Math.sin(ph) + .18 * Math.sin(2 * ph) + .05 * Math.sin(3 * ph);
    const w = R() * 2 - 1; lp += (w - lp) * .25; const breath = lp * .09;
    let a = Math.min(1, tt / .09, (tot - tt) / .25); if (q[0] === '-') a *= Math.max(0, 1 - into / .08); else if (into < .05 && ni > 0 && notes[ni - 1][0] === q[0]) a *= .4 + into / .05 * .6; // re-tongue a repeated note
    o[i] = (tone * .8 + breath) * a * (.85 + .15 * Math.sin(TAU * .4 * tt));
  }
  return o;
}
function tablaDha(gain = 1) { // bayan (bass drum, pitch bend) and dayan ring together
  const n = Math.round(.55 * SR), o = new Float32Array(n); let ph = 0, ph2 = 0;
  for (let i = 0; i < n; i++) { const t = i / SR, f = 72 + 70 * Math.exp(-t * 9); ph += TAU * f / SR; ph2 += TAU * 588 / SR; o[i] = (Math.sin(ph) * Math.exp(-t * 5) * .9 + (Math.sin(ph2) + .3 * Math.sin(ph2 * 2.04)) * Math.exp(-t * 14) * .35 + (R() * 2 - 1) * Math.exp(-t * 120) * .3) * gain; }
  return o;
}
function tablaNa(f = 588, gain = 1, d = 16) { const n = Math.round(.3 * SR), o = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / SR; o[i] = ((Math.sin(TAU * f * t) + .35 * Math.sin(TAU * f * 2.03 * t) + .15 * Math.sin(TAU * f * 3.01 * t)) * Math.exp(-t * d) + (R() * 2 - 1) * Math.exp(-t * 160) * .5) * gain; } return o; }
function tablaGe(gain = 1) { const n = Math.round(.4 * SR), o = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR, f = 85 + 45 * Math.exp(-t * 14); ph += TAU * f / SR; o[i] = Math.sin(ph) * Math.exp(-t * 8) * gain; } return o; }
function shaker(len = .07, gain = 1) { const n = Math.round(len * SR), o = new Float32Array(n); let a = 0; for (let i = 0; i < n; i++) { const w = R() * 2 - 1; o[i] = (w - a) * Math.exp(-i / SR * 55) * gain; a = w; } return o; }
function dhak(gain = 1) { // the big Durga Puja drum: a deep thump with a skin slap
  const n = Math.round(.42 * SR), o = new Float32Array(n); let ph = 0, lp = 0;
  for (let i = 0; i < n; i++) { const t = i / SR, f = 58 + 60 * Math.exp(-t * 22); ph += TAU * f / SR; const w = R() * 2 - 1; lp += (w - lp) * .3; o[i] = (Math.sin(ph) * Math.exp(-t * 7) + lp * Math.exp(-t * 40) * .9) * gain; }
  return o;
}
function stick(gain = 1) { const n = Math.round(.09 * SR), o = new Float32Array(n); let a = 0; for (let i = 0; i < n; i++) { const t = i / SR, w = R() * 2 - 1; o[i] = ((w - a) * .7 + Math.sin(TAU * 1250 * t) * .5) * Math.exp(-t * 70) * gain; a = w; } return o; }
function kansar(gain = 1, dec = 9) { // small bell-metal cymbal
  const n = Math.round(1.1 * SR), o = new Float32Array(n), F = [1720, 2633, 3410, 4870, 5550];
  for (let i = 0; i < n; i++) { const t = i / SR; let s = 0; for (let j = 0; j < F.length; j++) s += Math.sin(TAU * F[j] * t + j) / (j + 1.5); o[i] = (s * .6 + (R() * 2 - 1) * .4 * Math.exp(-t * 30)) * Math.exp(-t * dec) * gain; }
  return o;
}
function ghanta(f = 1180, gain = 1, len = 1.6) { const n = Math.round(len * SR), o = new Float32Array(n), P = [[1, 1, 2.2], [2.76, .45, 3.4], [5.4, .22, 5], [8.93, .1, 7]]; for (let i = 0; i < n; i++) { const t = i / SR; let s = 0; for (const [m, a, d] of P) s += Math.sin(TAU * f * m * t) * a * Math.exp(-t * d); o[i] = s * gain * Math.min(1, i / 30); } return o; }
function bass(f, dur, gain = 1, grit = 0) { const n = Math.round(dur * SR), o = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR; ph += TAU * f / SR; const s = Math.sin(ph) + .3 * Math.sin(2 * ph) + grit * Math.tanh(Math.sin(ph) * 4) * .5; o[i] = s * Math.min(1, t / .006) * Math.exp(-t * (1.6 / dur)) * Math.min(1, (dur - t) / .03) * gain; } return o; }
function reed(fs, dur, gain = 1, cut = 1400, swell = 0) { // harmonium: detuned pulse reeds through a soft filter
  const n = Math.round(dur * SR), o = new Float32Array(n), ph = fs.map(() => R()); let lp = 0, lp2 = 0; const k = 1 - Math.exp(-TAU * cut / SR);
  for (let i = 0; i < n; i++) { const t = i / SR; let s = 0; fs.forEach((f, j) => { ph[j] = (ph[j] + f * (1 + (j % 2 ? .0025 : -.0025)) / SR) % 1; s += (ph[j] < .4 ? 1 : -1) * .5 + (ph[j] * 2 - 1) * .5; }); lp += (s - lp) * k; lp2 += (lp - lp2) * k;
    o[i] = lp2 / fs.length * Math.min(1, t / .25, (dur - t) / .4) * (1 + swell * Math.sin(TAU * t / dur * 2)) * gain; }
  return o;
}
function conch(dur = 2.6, gain = 1) { const n = Math.round(dur * SR), o = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR, f = 311 * (1 + .03 * Math.min(1, t / 1.2)) * (1 + .004 * Math.sin(TAU * 4.5 * t)); ph += TAU * f / SR; o[i] = (Math.sin(ph) + .55 * Math.sin(2 * ph) + .3 * Math.sin(3 * ph) + .12 * Math.sin(4 * ph)) * Math.min(1, t / .3, (dur - t) / .5) * gain; } return o; }

// a small room: four combs and two allpasses, run over the loop twice so the tail wraps into the start
function reverb(tr, wet, size = 1) {
  const N = tr.N, out = [new Float32Array(N), new Float32Array(N)];
  [tr.L, tr.R].forEach((x, ch) => {
    const C = [1116, 1188, 1277, 1356].map(d => Math.round(d * size * SR / 44100) + ch * 23), A = [556, 341].map(d => Math.round(d * SR / 44100));
    const cb = C.map(d => new Float32Array(d)), ci = C.map(() => 0), cl = C.map(() => 0), ab = A.map(d => new Float32Array(d)), ai = A.map(() => 0);
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < N; i++) {
      let s = 0; for (let j = 0; j < 4; j++) { const y = cb[j][ci[j]]; cl[j] = y * .78 + cl[j] * .22; cb[j][ci[j]] = x[i] * .015 + cl[j] * .8; ci[j] = (ci[j] + 1) % C[j]; s += y; }
      for (let j = 0; j < 2; j++) { const b = ab[j][ai[j]], y = -s + b; ab[j][ai[j]] = s + b * .5; ai[j] = (ai[j] + 1) % A[j]; s = y; }
      if (pass) out[ch][i] = x[i] + s * wet;
    }
  });
  tr.L = out[0]; tr.R = out[1];
}
function finish(tr, rms = .14) { // level every loop to the same loudness, then soft-limit
  let e = 0; for (let i = 0; i < tr.N; i++) e += tr.L[i] ** 2 + tr.R[i] ** 2; const g = rms / Math.sqrt(e / (2 * tr.N) || 1);
  for (const c of [tr.L, tr.R]) for (let i = 0; i < tr.N; i++) c[i] = Math.tanh(c[i] * g * 1.3) / 1.3;
  return tr;
}

// ── 'explore': Raag Khamaj at 92 bpm, 16 bars
function explore() {
  const bpm = 92, B = 60 / bpm, T = new Track(64 * B);
  for (let bar = 0; bar < 16; bar++) { const t0 = bar * 4 * B; [['P', -1], ['S', 0], ['S', 0], ['S', -1]].forEach(([s, o], j) => T.add(tanpura(hz(s, o), 3.4), t0 + j * B, .2, -.35 + j * .22)); }
  // keherwa on tabla, eight strokes to the bar: dha ge na ti | na ka dhi na — light, with a fill every fourth bar
  const K = [['dha', 1], ['ge', .55], ['na', .7], ['ti', .45], ['na', .7], ['ka', .4], ['dhi', .85], ['na', .65]];
  for (let bar = 0; bar < 16; bar++) for (let s = 0; s < 8; s++) {
    const t = (bar * 8 + s) * B / 2, [w, v] = K[s], sw = s % 2 ? B * .04 : 0; // a slight swing
    if (w === 'dha' || w === 'dhi') T.add(tablaDha(v), t + sw, .34, .15); else if (w === 'ge') T.add(tablaGe(v), t + sw, .34, .1); else if (w === 'na') T.add(tablaNa(588, v), t + sw, .2, .3); else T.add(tablaNa(1900, v * .7, 40), t + sw, .14, .4);
    if (bar % 4 === 3 && s >= 4) T.add(tablaNa(1350, .5, 30), t + B / 4, .13, .45);
  }
  // bass on the bar's root
  const roots = ['S', 'P', 'M', 'S', 'P', 'P', 'M', 'S', 'S', 'P', 'M', 'P', 'M', 'M', 'P', 'S'];
  roots.forEach((s, bar) => { const f = hz(s, -1) / (SW[s] > 1.4 ? 2 : 1); T.add(bass(f, B * 2.2, .55), bar * 4 * B, .5, -.05); T.add(bass(f, B * .9, .35), (bar * 4 + 2.5) * B, .5, -.05); });
  // melody: bansuri asks, sitar answers
  const p1 = [['G', 0, 1], ['M', 0, 1], ['P', 0, 2], ['D', 0, 1], ['n', 0, 1], ['D', 0, 1], ['P', 0, 1], ['M', 0, 1.5], ['G', 0, .5], ['M', 0, 1], ['G', 0, 1], ['R', 0, 1], ['S', 0, 2.5], ['-', 0, .5]];
  const p3 = [['S', 1, 2], ['n', 0, 1], ['D', 0, 1], ['P', 0, 1], ['D', 0, 1], ['M', 0, 2], ['G', 0, 1], ['M', 0, 1], ['P', 0, 1], ['D', 0, 1], ['n', 0, 1], ['D', 0, 1], ['P', 0, 1.5], ['-', 0, .5]];
  T.add(bansuri(p1, B), 0, .36, -.15); T.add(bansuri(p3, B), 32 * B, .34, -.15);
  const sitarLine = (notes, t0, g) => { let t = t0; for (const [s, o, d] of notes) { if (s !== '-') T.add(sitar(hz(s, o), Math.min(2.6, d * B * 2.4)), t, g, .25); t += d * B; } };
  sitarLine([['P', 0, .5], ['D', 0, .5], ['N', 0, .5], ['S', 1, 1.5], ['R', 1, 1], ['S', 1, .5], ['n', 0, .5], ['D', 0, 1], ['P', 0, 2], ['G', 0, .5], ['M', 0, .5], ['P', 0, 1], ['D', 0, .5], ['P', 0, .5], ['M', 0, 1], ['G', 0, 2], ['-', 0, 2]], 16 * B, .42);
  sitarLine([['M', 0, 1], ['G', 0, 1], ['R', 0, 1], ['G', 0, 1], ['M', 0, 2], ['P', 0, 1], ['D', 0, 1], ['n', 0, 1], ['D', 0, 1], ['P', 0, 1], ['M', 0, 1], ['G', 0, 1], ['R', 0, 1], ['S', 0, 2]], 48 * B, .4);
  T.add(bansuri([['-', 0, .5], ['M', 0, 1.5], ['G', 0, 2], ['M', 0, 2], ['P', 0, 2], ['n', 0, 2], ['D', 0, 1], ['P', 0, 1], ['G', 0, 1], ['R', 0, 1], ['S', 0, 1.5], ['-', 0, .5]], B), 48 * B, .18, -.3); // a quiet second voice under the sitar
  reverb(T, .55, 1.1); return finish(T, .13);
}

// ── 'chase': Bhairavi at 140 bpm, 16 bars — dhak, dhol, a driving bass and a fast sitar riff
function chase() {
  const bpm = 140, B = 60 / bpm, S16 = B / 4, T = new Track(64 * B);
  const LOW = [0, 3, 6, 8, 11, 14], DH = [0, 7, 8, 10];
  for (let bar = 0; bar < 16; bar++) for (let s = 0; s < 16; s++) {
    const t = (bar * 16 + s) * S16;
    if (LOW.includes(s)) T.add(dhak(s === 0 ? 1 : .8), t, .55, -.15);
    if (DH.includes(s)) T.add(tablaDha(.9), t, .3, .1);
    T.add(stick(s % 4 === 0 ? 1 : s % 2 ? .45 : .7), t, .22, .35);
    if (s === 4 || s === 12) T.add(kansar(.8, 14), t, .12, -.4);
    T.add(shaker(.05, s % 2 ? .7 : 1), t + S16 * .02, .1, .5);
    if (bar % 4 === 3 && s >= 12) T.add(dhak(.7), t + S16 / 2, .4, -.1); // a roll into every fourth bar
  }
  const ost = ['S', 'S', 'g', 'S', 'M', 'S', 'g', 'r'];
  for (let bar = 0; bar < 16; bar++) { const up = bar >= 8 && bar < 12 ? SW.M : 1; ost.forEach((s, j) => T.add(bass(hz(s, -2) * up, B * .48, .9, .6), (bar * 8 + j) * B / 2, .5, 0)); }
  // tension drone: S and P on reeds, its filter breathing once per loop so there is no seam
  { const dur = T.N / SR; const d = reed([hz('S', -1), hz('P', -1), hz('S', 0)], dur + .5, .5, 900, 0); for (let i = 0; i < d.length; i++) d[i] *= .7 + .3 * Math.sin(TAU * i / T.N - 1.5); T.add(d, 0, .35, 0); }
  const riff = [['S', 1], ['S', 1], ['n', 0], ['d', 0], ['P', 0], ['P', 0], ['M', 0], ['g', 0], ['r', 0], ['r', 0], ['S', 0], ['r', 0], ['g', 0], ['M', 0], ['g', 0], ['r', 0]];
  for (let bar = 4; bar < 16; bar++) { const oct = bar >= 12 ? 1 : 0; riff.forEach(([s, o], j) => { if (bar % 2 && j > 11) return; T.add(sitar(hz(s, o + oct), .5), (bar * 16 + j) * S16, bar >= 12 ? .26 : .32, .3); }); }
  for (let bar = 0; bar < 4; bar++) T.add(sitar(hz('S', 1), 1.8), bar * 4 * B, .4, .3);
  reverb(T, .3, .8); return finish(T, .16);
}

// ── 'temple': aarti at Dakshineswar, 66 bpm, 8 bars
function temple() {
  const bpm = 66, B = 60 / bpm, T = new Track(32 * B), dur = T.N / SR;
  T.add(reed([hz('S', -1), hz('P', -1), hz('S', 0)], dur + 1, .6, 1300, .25), 0, .5, 0);
  T.add(conch(3, .6), .2, .35, -.1);
  const mel = [['S', 1], ['R', 1], ['G', 2], ['M', 1], ['G', 1], ['R', 2], ['S', 2], ['G', 1], ['M', 1], ['P', 3], ['M', 1], ['G', 1], ['R', 1], ['S', 4], ['-', 4]];
  { let t = 4 * B; for (const [s, d] of mel) { if (s !== '-') T.add(reed([hz(s, 0), hz(s, 1)], d * B + .3, .5, 1900, .1), t, .5, .2); t += d * B; } }
  for (let b = 0; b < 32; b++) { const t = b * B; T.add(kansar(.7, 7), t, .14, -.3); if (b % 2 === 0) T.add(tablaGe(.9), t, .25, .1); if (b % 4 === 2) T.add(tablaNa(440, .6, 10), t, .15, .15); }
  for (let i = 0; i < 32 * 6; i++) T.add(ghanta(1180 + R() * 30, .25 + R() * .35, .9), i * B / 6 + R() * .03, .1, .45); // the aarti handbell, rung all through
  for (const b of [0, 16]) T.add(ghanta(620, 1, 3.2), b * B, .22, -.25); // the big temple bell
  reverb(T, .75, 1.3); return finish(T, .12);
}

self.onmessage = e => {
  SR = e.data.sr; rnd = 7;
  const loops = { explore: explore(), chase: chase(), temple: temple() }, out = {}, tx = [];
  for (const [k, tr] of Object.entries(loops)) { if (e.data.stereo) { out[k] = [tr.L, tr.R]; tx.push(tr.L.buffer, tr.R.buffer); } else { const m = new Float32Array(tr.N); for (let i = 0; i < tr.N; i++) m[i] = (tr.L[i] + tr.R[i]) * .5; out[k] = [m]; tx.push(m.buffer); } }
  self.postMessage({ sr: SR, loops: out }, tx);
};
