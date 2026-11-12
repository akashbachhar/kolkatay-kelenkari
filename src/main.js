import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { initMats } from './kit.js';
import { buildWorld } from './world.js';
import { Traffic } from './traffic.js';
import { Player } from './player.js';
import { Hud } from './hud.js';
import { People } from './people.js';
import { Sound } from './audio.js';
import { initTouch } from './touch.js';
import { folk, roams, anims } from './landmarks.js';
import { Ferry } from './ferry.js';
import { Drive } from './drive.js';
import { Police } from './police.js';
import { nearestRoad } from './world.js';

const $ = id => document.getElementById(id), Q = new URLSearchParams(location.search);
// phones and tablets: touch controls, lighter rendering
const TOUCH = matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 0 && Math.min(innerWidth, innerHeight) < 900);
const renderer = new THREE.WebGLRenderer({ antialias: !TOUCH, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, TOUCH ? 1.25 : 1.5)); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .5;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .3, 12000);

async function start() {
  try { await Promise.race([Promise.all([document.fonts.load('700 36px "Baloo Da 2"', 'কলকাতা'), document.fonts.load('700 36px "Baloo Da 2"', 'Kolkata')]), new Promise(r => setTimeout(r, 2500))]); } catch { }
  await new Promise(r => setTimeout(r, 30));
  initMats();
  // late-afternoon sun over the Hooghly, hazy Kolkata sky
  const sunDir = new THREE.Vector3(-.62, .5, .42).normalize();
  const mkSky = () => { const s = new Sky(); s.scale.setScalar(10000); const u = s.material.uniforms; u.turbidity.value = 9; u.rayleigh.value = 1.5; u.mieCoefficient.value = .012; u.mieDirectionalG.value = .85; u.sunPosition.value.copy(sunDir); return s; };
  scene.add(mkSky());
  const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene(); es.add(mkSky());
  scene.environment = pm.fromScene(es, 0, .1, 20000).texture; scene.environmentIntensity = .55;
  scene.fog = new THREE.FogExp2(0xc6cacb, .00095);
  scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x8d7c62, .75));
  const sun = new THREE.DirectionalLight(0xffe3bd, 2.9); sun.castShadow = true; sun.shadow.mapSize.set(TOUCH ? 1024 : 2048, TOUCH ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 1, far: 900 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .4;
  scene.add(sun, sun.target);

  const world = buildWorld(scene), traffic = new Traffic(scene), player = new Player(scene, camera, renderer.domElement), hud = new Hud(), people = new People(scene, folk, roams, TOUCH ? 26 : 48, TOUCH), sound = new Sound();
  player.onStep = fast => sound.step(fast);
  const ferry = new Ferry(scene, player, hud, sound); if (Q.get('zone') === 'dak') ferry.jump('dak');
  for (const k of ['x', 'z']) if (Q.has(k)) player.pos[k] = +Q.get(k);
  for (const k of ['yaw', 'pitch', 'dist', 'heading']) if (Q.has(k)) player[k] = +Q.get(k);
  const drive = new Drive(player, traffic, sound, hud, camera, people);
  const police = new Police(scene, player, drive, hud, sound); drive.police = police;
  window.kk = { drive, police, player, scene, camera, renderer, hud, sound, people, traffic, ferry };

  let playing = false; const dom = renderer.domElement, ov = $('overlay');
  const lock = () => { if (!TOUCH) dom.requestPointerLock?.()?.catch?.(() => { }); };
  const go = () => { playing = true; sound.start(); ov.classList.add('hide'); $('hud').classList.add('on'); lock(); };
  if (TOUCH) initTouch(player, dom, { map: () => hud.toggleMap(), sound: () => sound.toggle() });
  $('load').style.display = 'none'; $('play').style.display = 'inline-block';
  $('play').onclick = go; dom.addEventListener('click', () => { if (playing && document.pointerLockElement !== dom) lock(); });
  document.addEventListener('pointerlockchange', () => { if (playing && !TOUCH && document.pointerLockElement !== dom) $('paused').classList.add('on'); else $('paused').classList.remove('on'); });
  addEventListener('keydown', e => { if (e.code === 'KeyM' && playing) hud.toggleMap(); if (e.code === 'KeyN' && playing) hud.toast(sound.toggle() ? '<small>SOUND</small>Off' : '<small>SOUND</small>On'); if (e.code === 'Enter' && !playing) go(); });
  const fit = () => { camera.aspect = innerWidth / innerHeight; camera.fov = innerWidth < innerHeight ? 72 : 58; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); };
  addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 250)); fit();
  if (Q.has('auto')) go();

  const clock = new THREE.Clock(); let t = 0, open = false, oc = 0;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(.05, clock.getDelta()); t += dt;
    sound.listen(player.pos, player.yaw); traffic.update(dt, player.pos, playing ? sound : null); people.update(dt, player.pos);
    if (playing && (oc -= dt) < 0) { oc = 1; open = !!player.zone || player.ride || nearestRoad(player.pos.x, player.pos.z).d > 45; }
    if (playing) sound.tick(dt, open, !!player.zone && !player.ride);
    ferry.update(dt, t, playing); for (const f of anims) f(t);
    drive.playing = playing; drive.update(dt); if (playing) police.update(dt);
    if (playing) { player.update(dt, traffic, people); drive.camera(); } else { player.yaw += dt * .05; player.update(0, traffic); }
    sun.position.copy(player.pos).addScaledVector(sunDir, 420); sun.target.position.copy(player.pos);
    world.update(t); if (playing) hud.update(player);
    renderer.render(scene, camera);
  });
}
start().catch(e => { console.error(e); $('load').textContent = 'Could not start: ' + e.message; });
