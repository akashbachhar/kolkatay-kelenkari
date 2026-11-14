// Points and discovered places. They last for one visit: a reload starts again from zero.
const KEY = 'kk-save-v1', $ = id => document.getElementById(id);
const BN = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
export const PTS = { cop: 100, person: 10, car: 50, pole: 30, case: 200, dropped: 300, busted: 500, taxi: 20, bus: 30, place: 300, puja: 1000 };
export const Score = {
  pts: 0, found: new Set(), BN,
  load() { try { localStorage.removeItem(KEY); } catch (e) { } this.show(); }, // every visit starts from zero: nothing is kept between reloads
  save() { },
  show() { const e = $('points'); if (e) e.firstElementChild.textContent = BN(this.pts); },
  add(n, why) { // the counter jumps and a small line under it says what the points were for
    this.pts = Math.max(0, this.pts + n); this.show(); this.save();
    const e = $('points'), w = $('ptsWhy'); if (!e) return;
    e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump');
    w.textContent = `${n < 0 ? '−' : '+'}${BN(Math.abs(n))} ${why}`; w.style.color = n < 0 ? '#ff8a7a' : ''; w.classList.add('on'); clearTimeout(this.tt); this.tt = setTimeout(() => w.classList.remove('on'), 2600);
  },
  find(l) { if (this.found.has(l.n)) return false; this.found.add(l.n); this.add(PTS.place, 'নতুন জায়গা · ' + (l.bn || l.n)); return true; },
};
