// Touch controls for phones and tablets: floating joystick (left), drag to look (right), buttons.
// line icons for the phone buttons (drawn in currentColor)
const sv = d => `<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
export const ICON = {
  run: sv('<circle cx="14" cy="4.5" r="2" fill="currentColor"/><path d="M8 21l3-6 3 3v4M7.5 11l3.5-3.5 3 2 2.5 2.5h3M11 7.5l-1.5 6"/>'),
  hit: sv('<path d="M7 11V8.5a1.5 1.5 0 013 0V11m0-2.5v-1a1.5 1.5 0 013 0V11m0-2a1.5 1.5 0 013 0v2m0-.5a1.5 1.5 0 013 0V14a6 6 0 01-6 6h-1a6 6 0 01-5.5-3.6L5 13.5a1.6 1.6 0 012.6-1.8L7 11z"/>'),
  car: sv('<path d="M5 16V12l2-5h10l2 5v4M3 16h18M5 12h14"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>'),
  view: sv('<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  jump: sv('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  brake: sv('<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12h7"/>'),
  map: sv('<path d="M9 4L3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4zM9 4v13.5M15 6.5V20"/>'),
  sound: sv('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11"/>'),
  mute: sv('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
};
export function initTouch(player, dom, act) {
  for (const [id, k] of [['bRun', 'run'], ['bHit', 'hit'], ['bCar', 'car'], ['bView', 'view'], ['bJump', 'jump'], ['bMap', 'map'], ['bSnd', 'sound']]) { const b = document.getElementById(id); if (b) { b.innerHTML = ICON[k]; b.setAttribute('aria-label', k); } }
  const $ = id => document.getElementById(id), base = $('joy'), knob = $('knob'), RAD = 56;
  document.body.classList.add('touch');
  let jid = null, jx = 0, jy = 0, lid = null, lx = 0, ly = 0;
  const setKnob = (x, y) => { knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`; };
  dom.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    if (jid === null && e.clientX < innerWidth * .45 && e.clientY > innerHeight * .28) { jid = e.pointerId; jx = e.clientX; jy = e.clientY; base.style.left = jx + 'px'; base.style.top = jy + 'px'; base.style.bottom = 'auto'; base.classList.add('on'); }
    else if (lid === null) { lid = e.pointerId; lx = e.clientX; ly = e.clientY; }
    e.preventDefault();
  });
  addEventListener('pointermove', e => {
    if (e.pointerId === jid) {
      let dx = e.clientX - jx, dy = e.clientY - jy; const d = Math.hypot(dx, dy); if (d > RAD) { dx *= RAD / d; dy *= RAD / d; }
      setKnob(dx, dy); player.joy.x = dx / RAD; player.joy.y = dy / RAD;
    } else if (e.pointerId === lid) {
      player.lookT = 1.2; player.yaw -= (e.clientX - lx) * .0055; player.pitch = Math.max(-.3, Math.min(1.35, player.pitch + (e.clientY - ly) * .0045)); lx = e.clientX; ly = e.clientY;
    }
  }, { passive: true });
  const end = e => {
    if (e.pointerId === jid) { jid = null; player.joy.x = player.joy.y = 0; setKnob(0, 0); base.classList.remove('on'); base.style.left = base.style.top = base.style.bottom = ''; }
    if (e.pointerId === lid) lid = null;
  };
  addEventListener('pointerup', end); addEventListener('pointercancel', end);
  const btn = (id, down, up) => { const b = $(id); b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); down(b); }); if (up) for (const n of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(n, () => up(b)); };
  btn('bJump', () => { player.keys.Space = true; }, () => { player.keys.Space = false; });
  btn('bHit', () => player.hit());
  btn('bRun', b => { player.run = !player.run; b.classList.toggle('act', player.run); });
  btn('bMap', () => act.map()); btn('bSnd', b => { const off = act.sound(); b.classList.toggle('off', off); b.innerHTML = off ? ICON.mute : ICON.sound; });
  for (const n of ['gesturestart', 'contextmenu']) addEventListener(n, e => e.preventDefault());
}
