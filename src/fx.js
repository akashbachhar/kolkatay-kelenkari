// The picture pipeline: ambient occlusion, bloom, a film-like grade, anti-aliasing. Three quality tiers, switchable while playing.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';

const Grade = { // gentle contrast and saturation, warm highlights, cool shadows, a vignette, a breath of grain
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, amount: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time, amount; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb; float l = dot(col, vec3(.2126, .7152, .0722));
      col = mix(vec3(l), col, 1.0 + .14 * amount);                       // saturation
      col = mix(col, col * col * (3.0 - 2.0 * clamp(col, 0.0, 1.0)), .0); // (kept linear: contrast is done by the tone curve)
      col *= mix(vec3(.96, .99, 1.05), vec3(1.05, 1.0, .94), smoothstep(.05, .9, l)); // split tone
      vec2 q = vUv - .5; col *= 1.0 - amount * .42 * smoothstep(.25, .95, dot(q, q) * 2.2); // vignette
      col += (hash(vUv * 913.0 + time) - .5) * .012 * amount * l;
      gl_FragColor = vec4(max(col, 0.0), c.a); }`,
};

export function makeFx(renderer, scene, camera, sun) {
  const fx = { tier: -1, composer: null, bloom: null, grade: null, names: ['Low', 'Medium', 'High'] };
  const size = new THREE.Vector2();
  fx.set = tier => {
    fx.tier = tier; fx.composer?.dispose(); fx.composer = null;
    renderer.setPixelRatio(Math.min(devicePixelRatio, [1.25, 1.5, 2][tier], fx.maxPR || 9)); renderer.setSize(innerWidth, innerHeight);
    const sm = [1024, 2048, 4096][tier]; if (sun.shadow.mapSize.x !== sm) { sun.shadow.mapSize.set(sm, sm); sun.shadow.map?.dispose(); sun.shadow.map = null; }
    const half = [150, 130, 110][tier]; Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half }); sun.shadow.camera.updateProjectionMatrix();
    if (!tier) return;
    renderer.getDrawingBufferSize(size);
    const hdr = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float'); // without it, fall back to the plain picture rather than a black one
    if (!hdr) { fx.tier = 0; return; }
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: tier === 1 ? 4 : 0 });
    const c = fx.composer = new EffectComposer(renderer, rt); c.addPass(new RenderPass(scene, camera));
    if (tier === 2) { const ao = new GTAOPass(scene, camera, size.x, size.y); ao.updateGtaoMaterial({ radius: .7, distanceExponent: 1.2, thickness: 1.2, scale: 1.25, samples: 12, distanceFallOff: 1, screenSpaceRadius: false }); ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 }); ao.blendIntensity = .9; c.addPass(ao);
      const r0 = ao.render.bind(ao); ao.render = (...a) => { // sky, cloud, glows and sprites are not surfaces: keep them out of the occlusion pass
        if (fx.nc !== scene.children.length) { fx.nc = scene.children.length; fx.skip = []; scene.traverse(o => { if (o.userData.noAO || o.isSprite || o.isSky || (o.material && o.material.blending === THREE.AdditiveBlending)) fx.skip.push(o); }); }
        const vis = fx.skip.map(o => o.visible); for (const o of fx.skip) o.visible = false; r0(...a); fx.skip.forEach((o, i) => { o.visible = vis[i]; }); }; }
    fx.bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), tier === 2 ? .4 : .34, .65, 2.0); c.addPass(fx.bloom);
    fx.grade = new ShaderPass(Grade); c.addPass(fx.grade); c.addPass(new OutputPass());
    if (tier === 2) c.addPass(new SMAAPass(size.x, size.y));
  };
  fx.size = () => { renderer.setSize(innerWidth, innerHeight); if (fx.composer) { fx.composer.setPixelRatio(renderer.getPixelRatio()); fx.composer.setSize(innerWidth, innerHeight); } };
  fx.render = t => { if (fx.composer) { try { fx.grade.uniforms.time.value = t % 10; fx.composer.render(); return; } catch (e) { console.error(e); fx.set(0); } } renderer.render(scene, camera); };
  return fx;
}
