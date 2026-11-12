// Touch controls for phones and tablets: floating joystick (left), drag to look (right), buttons.
export function initTouch(player, dom, act) {
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
      player.yaw -= (e.clientX - lx) * .0055; player.pitch = Math.max(-.3, Math.min(1.35, player.pitch + (e.clientY - ly) * .0045)); lx = e.clientX; ly = e.clientY;
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
  btn('bMap', () => act.map()); btn('bSnd', b => b.classList.toggle('off', act.sound()));
  for (const n of ['gesturestart', 'contextmenu']) addEventListener(n, e => e.preventDefault());
}
