/* 知の宇宙（D-037）：単元を星として 3D に描く。中心は数える・観察する単元、外ほど最前線、方角は分野。
   位置は tools/space.py が地図のデータから決める。ここは描くことと触ることだけを受け持ち、
   何を光らせるか（前提の鎖、目標、組み合わせ）は app.js が決めて渡す。 */
import * as THREE from './vendor/three.module.min.js';

// 星の状態（D-048）：0 まだ、1 次にできる（息をする）、2 途中（やった日の割合だけ輪が伸び、先が光る）、
// 3 済（輪が閉じ、外に腕だめしの解けた割合だけ金の弧）、4 腕だめしまで（金の星になり、光の筋がゆっくり回る）。
// 輪と光の筋を描く星は、絵を大きく取り（k 倍）、星そのものの光の大きさは変えない
const STAR_VS = `
attribute float size; attribute vec3 color; attribute float phase; attribute float state; attribute float alpha; attribute float prog;
uniform float time; uniform float scale; uniform vec2 fog;
varying vec3 vColor; varying float vAlpha; varying float vState; varying float vProg; varying float vK; varying float vSpin; varying float vT;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float fogk = 1.0 - 0.75 * smoothstep(fog.x, fog.y, -mv.z);
  float tw = 0.82 + 0.18 * sin(time * 1.3 + phase * 6.2832);
  float pulse = (state > 0.5 && state < 1.5) ? 1.0 + 0.45 * sin(time * 3.2 + phase * 6.2832) : 1.0;
  float k = state > 3.5 ? 3.4 : state > 1.5 ? 2.0 : 1.0;
  // 進んだ星ほど大きく、遠くからでも見える大きさを下限にする（腕だめしまでの金の光は遠目でも分かるように）
  float boost = state > 3.5 ? 1.7 : state > 2.5 ? 1.3 : state > 1.5 ? 1.15 : 1.0;
  float lo = state > 3.5 ? 22.0 : state > 2.5 ? 9.0 : state > 1.5 ? 7.0 : 1.5;
  gl_PointSize = clamp(size * scale * tw * pulse * k * boost / -mv.z, lo, 90.0 * k);
  gl_Position = projectionMatrix * mv;
  vColor = color; vAlpha = alpha * fogk; vState = state; vProg = prog; vK = k;
  vSpin = time * 0.22 + phase * 6.2832; vT = time + phase * 6.2832;
}`;
const STAR_FS = `
varying vec3 vColor; varying float vAlpha; varying float vState; varying float vProg; varying float vK; varying float vSpin; varying float vT;
void main() {
  vec2 q = gl_PointCoord - 0.5;
  if (length(q) > 0.5) discard;
  vec2 c = q * vK; float d = length(c);
  float glow = exp(-d * d * 16.0);
  float core = smoothstep(0.16, 0.0, d);
  float white = vState > 2.5 ? 1.0 : 0.5;
  vec3 col = vColor * glow * 1.15 + vec3(1.0) * core * white;
  float a = glow * 0.85 + core * 0.9;
  float ang = fract(atan(c.x, -c.y) / 6.2832 + 1.0);
  vec3 gold = vec3(1.0, 0.78, 0.36);
  if (vState > 1.5 && vState < 2.5) {
    float band = smoothstep(0.045, 0.0, abs(d - 0.7));
    float on = step(ang, vProg);
    float head = exp(-pow((ang - vProg) * 18.0, 2.0)) * band;
    float br = 0.85 + 0.15 * sin(vT * 2.4);
    col += vColor * band * (0.18 + 1.2 * on * br) + vec3(1.0) * head * 0.9;
    a += band * (0.12 + 0.8 * on) + head * 0.6;
  } else if (vState > 2.5 && vState < 3.5) {
    float band = smoothstep(0.04, 0.0, abs(d - 0.7));
    col += mix(vColor, vec3(1.0), 0.35) * band; a += band * 0.75;
    float band2 = smoothstep(0.035, 0.0, abs(d - 0.86));
    float on2 = step(ang, vProg) * step(0.001, vProg);
    col += gold * band2 * on2 * 1.3; a += band2 * on2 * 0.8;
  } else if (vState > 3.5) {
    float cs = cos(vSpin), sn = sin(vSpin);
    vec2 r = vec2(cs * c.x - sn * c.y, sn * c.x + cs * c.y);
    float sp = exp(-abs(r.x) * 30.0) * exp(-abs(r.y) * 2.2) + exp(-abs(r.y) * 30.0) * exp(-abs(r.x) * 2.2);
    vec2 r2 = vec2(0.7071 * (r.x - r.y), 0.7071 * (r.x + r.y));
    sp += 0.4 * (exp(-abs(r2.x) * 42.0) * exp(-abs(r2.y) * 4.5) + exp(-abs(r2.y) * 42.0) * exp(-abs(r2.x) * 4.5));
    float halo = exp(-d * d * 3.0) * (0.28 + 0.08 * sin(vT * 1.7));
    float band = smoothstep(0.04, 0.0, abs(d - 0.7));
    col = mix(vColor, gold, 0.65) * glow * 1.25 + vec3(1.0) * core + gold * (sp * 1.15 + halo + band * 0.9);
    a = glow * 0.9 + core + sp + halo + band * 0.7;
  }
  gl_FragColor = vec4(col, min(a, 1.8) * vAlpha);
}`;
// 線：頂点ごとの色と濃さ。flow > 0 なら、前提から先へ光が流れる（along は線の始まり 0、終わり 1）
const LINE_VS = `
attribute vec3 color; attribute float alpha; attribute float along;
uniform vec2 fog;
varying vec3 vColor; varying float vAlpha; varying float vAlong;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vColor = color; vAlpha = alpha * (1.0 - 0.8 * smoothstep(fog.x, fog.y, -mv.z)); vAlong = along;
  gl_Position = projectionMatrix * mv;
}`;
const LINE_FS = `
uniform float time; uniform float flow; uniform float opacity;
varying vec3 vColor; varying float vAlpha; varying float vAlong;
void main() {
  float pulse = flow > 0.0 ? 0.35 + 1.4 * pow(fract(vAlong - time * 0.45), 6.0) : 1.0;
  gl_FragColor = vec4(vColor * pulse, vAlpha * opacity);
}`;

// 光の粒：道に沿って並べ、前提から先へ明るさの波が流れる
const BEAD_VS = `
attribute vec3 color; attribute float along; attribute float alpha;
uniform float time; uniform float scale;
varying vec3 vColor; varying float vB;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float b = pow(fract(along - time * 0.45), 5.0);
  vB = (0.15 + 1.2 * b) * alpha; vColor = color;
  gl_PointSize = clamp((90.0 + 260.0 * b) * scale / -mv.z, 1.0, 24.0);
  gl_Position = projectionMatrix * mv;
}`;
const BEAD_FS = `
varying vec3 vColor; varying float vB;
void main() {
  float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
  float g = exp(-d * d * 22.0);
  gl_FragColor = vec4(mix(vColor, vec3(1.0), 0.35 * g) * g, g * vB);
}`;
// 選んだ星の輪：ゆっくり脈打つ
const RING_VS = `
attribute vec3 color; uniform float time; uniform float scale; varying vec3 vColor;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0); vColor = color;
  gl_PointSize = clamp((1300.0 + 180.0 * sin(time * 2.4)) * scale / -mv.z, 14.0, 140.0);
  gl_Position = projectionMatrix * mv;
}`;
const RING_FS = `
varying vec3 vColor;
void main() {
  float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
  float ring = smoothstep(0.08, 0.0, abs(d - 0.38)) + 0.25 * smoothstep(0.5, 0.0, d) * smoothstep(0.0, 0.3, d);
  gl_FragColor = vec4(mix(vColor, vec3(1.0), 0.5) * ring, ring * 0.9);
}`;

function lineMaterial(opacity, flow) {
  return new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, flow: { value: flow ? 1 : 0 }, opacity: { value: opacity }, fog: { value: new THREE.Vector2(60, 200) } },
    vertexShader: LINE_VS, fragmentShader: LINE_FS,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

// 2 点を、中心から外へふくらむ曲線でつなぐ（星の多い中心を横切らないように）
function curve(a, b, bulge) {
  const mid = a.clone().add(b).multiplyScalar(.5);
  const out = mid.length() < 1e-3 ? new THREE.Vector3(0, 1, 0) : mid.clone().normalize();
  const ctrl = mid.add(out.multiplyScalar(a.distanceTo(b) * bulge));
  return new THREE.QuadraticBezierCurve3(a, ctrl, b);
}

export function mount(api) {
  const units = api.units, N = units.length, index = new Map(units.map((u, i) => [u.id, i]));
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const canvas = renderer.domElement;
  canvas.className = 'cosmos-canvas';
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, .1, 2000);
  // 星の色は関係から見つけた分野（D-124）。分野がまだない単元は流れの色
  const color = u => new THREE.Color(u.f && api.fieldColor ? api.fieldColor(u.f) : api.laneColor(u.lane));

  // ---- 遠くの星くず（背景） ----
  {
    const g = new THREE.BufferGeometry(), n = 1400, p = new Float32Array(n * 3);
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, r = 260 + rnd() * 340, q = Math.sqrt(1 - u * u);
      p.set([r * q * Math.cos(th), r * u, r * q * Math.sin(th)], i * 3);
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9fb4ff, size: 1.2, sizeAttenuation: false, transparent: true, opacity: .55, depthWrite: false })));
  }
  // 深さの軌道の輪は、中心からの距離が前提の深さだったとき（D-037）の目印なので、関係から見た配置（D-124）では描かない

  // ---- 星（単元） ----
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N),
    phase = new Float32Array(N), state = new Float32Array(N), alpha = new Float32Array(N), prog = new Float32Array(N);
  const P = units.map(u => new THREE.Vector3(...u.p));
  units.forEach((u, i) => {
    pos.set(u.p, i * 3);
    const c = color(u); col.set([c.r, c.g, c.b], i * 3);
    size[i] = 330 + 110 * (u.level || 3) + (api.bridges.has(u.id) ? 320 : 0);
    phase[i] = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    alpha[i] = 1;
  });
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  sg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  sg.setAttribute('size', new THREE.BufferAttribute(size, 1));
  sg.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
  sg.setAttribute('state', new THREE.BufferAttribute(state, 1));
  sg.setAttribute('prog', new THREE.BufferAttribute(prog, 1));
  sg.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
  const starMat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, scale: { value: 1 }, fog: { value: new THREE.Vector2(60, 200) } }, vertexShader: STAR_VS, fragmentShader: STAR_FS,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const stars = new THREE.Points(sg, starMat);
  scene.add(stars);

  // ---- 前提の糸（すべて） ----
  const pairs = [];
  units.forEach((u, i) => u.needs.forEach(n => index.has(n) && pairs.push([index.get(n), i])));
  const eg = new THREE.BufferGeometry();
  const ep = new Float32Array(pairs.length * 6), ec = new Float32Array(pairs.length * 6), ea = new Float32Array(pairs.length * 2), el = new Float32Array(pairs.length * 2);
  pairs.forEach(([a, b], k) => {
    ep.set(units[a].p, k * 6); ep.set(units[b].p, k * 6 + 3);
    ec.set(col.subarray(a * 3, a * 3 + 3), k * 6); ec.set(col.subarray(b * 3, b * 3 + 3), k * 6 + 3);
    el[k * 2 + 1] = 1;
  });
  eg.setAttribute('position', new THREE.BufferAttribute(ep, 3));
  eg.setAttribute('color', new THREE.BufferAttribute(ec, 3));
  eg.setAttribute('alpha', new THREE.BufferAttribute(ea, 1));
  eg.setAttribute('along', new THREE.BufferAttribute(el, 1));
  const threadMat = lineMaterial(1, false);
  scene.add(new THREE.LineSegments(eg, threadMat));

  // ---- 光らせる層（前提の鎖、組み合わせの弧） ----
  const glowMat = lineMaterial(1, true);
  const glow = new THREE.LineSegments(new THREE.BufferGeometry(), glowMat);
  scene.add(glow);
  const beadMat = new THREE.ShaderMaterial({ uniforms: { time: { value: 0 }, scale: { value: 1 } }, vertexShader: BEAD_VS, fragmentShader: BEAD_FS,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const beads = new THREE.Points(new THREE.BufferGeometry(), beadMat);
  scene.add(beads);
  const ringMat = new THREE.ShaderMaterial({ uniforms: { time: { value: 0 }, scale: { value: 1 } }, vertexShader: RING_VS, fragmentShader: RING_FS,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const rings = new THREE.Points(new THREE.BufferGeometry(), ringMat);
  scene.add(rings);
  function setRings(ids) {
    const ps = [], cs = [];
    ids.forEach(id => { const i = index.get(id); if (i === undefined) return; ps.push(...units[i].p); cs.push(col[i * 3], col[i * 3 + 1], col[i * 3 + 2]); });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(ps, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3));
    rings.geometry.dispose(); rings.geometry = g;
  }
  function setGlow(segs) {
    // segs: [{a: Vector3, b: Vector3, c: Color, w: 濃さ, bulge, off: 光の出発のずれ}]
    const pts = [], cs = [], as = [], ls = [], bp = [], bc = [], ba = [], bl = [];
    segs.forEach(s => {
      const cv = curve(s.a, s.b, s.bulge ?? .12), n = s.n || 14, q = cv.getPoints(n);
      for (let i = 0; i < n; i++) {
        pts.push(q[i].x, q[i].y, q[i].z, q[i + 1].x, q[i + 1].y, q[i + 1].z);
        cs.push(s.c.r, s.c.g, s.c.b, s.c.r, s.c.g, s.c.b);
        as.push(s.w, s.w);
        ls.push((s.off || 0) + i / n, (s.off || 0) + (i + 1) / n);
      }
      // 粒は長さに合わせて数を変える（短い糸は 4 粒、長い弧は 40 粒まで）
      const m = Math.max(4, Math.min(40, Math.round(s.a.distanceTo(s.b) * 1.6)));
      cv.getSpacedPoints(m).forEach((v, i) => { bp.push(v.x, v.y, v.z); bc.push(s.c.r, s.c.g, s.c.b); ba.push(s.w); bl.push((s.off || 0) + i / m); });
    });
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
    bg.setAttribute('color', new THREE.Float32BufferAttribute(bc, 3));
    bg.setAttribute('alpha', new THREE.Float32BufferAttribute(ba, 1));
    bg.setAttribute('along', new THREE.Float32BufferAttribute(bl, 1));
    beads.geometry.dispose(); beads.geometry = bg;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3));
    g.setAttribute('alpha', new THREE.Float32BufferAttribute(as, 1));
    g.setAttribute('along', new THREE.Float32BufferAttribute(ls, 1));
    glow.geometry.dispose(); glow.geometry = g;
  }

  // ---- 分野の名前（HTML を星の上に重ねる）。関係から見つけた分野の星の重心に置く（D-124） ----
  const labels = document.createElement('div');
  labels.className = 'cosmos-labels';
  const marks = (api.fields || []).map(f => {
    const mine = units.map((u, i) => [u, i]).filter(([u]) => u.f === f.id);
    if (!mine.length) return null;
    const c = new THREE.Vector3();
    mine.forEach(([, i]) => c.add(P[i]));
    c.multiplyScalar(1 / mine.length);
    const spread = Math.sqrt(mine.reduce((a, [, i]) => a + P[i].distanceToSquared(c), 0) / mine.length);
    const el = document.createElement('button');
    el.type = 'button'; el.className = 'cosmos-label'; el.textContent = f.name;
    el.style.setProperty('--c', api.fieldColor(f.id));
    el.addEventListener('click', e => { e.stopPropagation(); api.onField && api.onField(f.id); });
    labels.appendChild(el);
    return { id: f.id, at: c, r: spread, el };
  }).filter(Boolean);
  const markOf = id => marks.find(m => m.id === id);

  // ---- 目（カメラ）：ドラッグで回し、ホイールとつまみで寄る。触らないと、ゆっくり回る ----
  const view = { target: new THREE.Vector3(), r: 100, th: .7, ph: 1.15 }, vel = { th: 0, ph: 0 };
  let fly = null, lastTouch = 0, running = true, host = null;
  function place() {
    const s = Math.sin(view.ph);
    camera.position.set(view.target.x + view.r * s * Math.cos(view.th), view.target.y + view.r * Math.cos(view.ph), view.target.z + view.r * s * Math.sin(view.th));
    camera.lookAt(view.target);
  }
  function flyTo(target, r, ms = 1300) {
    fly = { t0: performance.now(), ms, from: { target: view.target.clone(), r: view.r }, to: { target: target.clone(), r } };
  }
  const pointers = new Map();
  let drag = null, pinch = 0;
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    api.onTouch && api.onTouch();
    drag = { x: e.clientX, y: e.clientY, moved: 0 };
    lastTouch = performance.now(); fly = null;
  });
  canvas.addEventListener('pointermove', e => {
    const p = pointers.get(e.pointerId);
    if (!p) { if (e.pointerType === 'mouse') hover(e); return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) view.r = THREE.MathUtils.clamp(view.r * pinch / d, 6, 260);
      pinch = d; drag && (drag.moved += 99);
      return;
    }
    if (drag) {
      drag.moved += Math.abs(dx) + Math.abs(dy);
      vel.th = dx * .005; vel.ph = -dy * .005;
      view.th += vel.th; view.ph = THREE.MathUtils.clamp(view.ph + vel.ph, .15, Math.PI - .15);
    }
    lastTouch = performance.now();
  });
  const up = e => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = 0;
    if (drag && drag.moved < 6 && pointers.size === 0) click(e);
    if (pointers.size === 0) drag = null;
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    view.r = THREE.MathUtils.clamp(view.r * Math.exp(e.deltaY * .0012), 6, 260);
    lastTouch = performance.now(); fly = null;
  }, { passive: false });

  // ---- 星を選ぶ ----
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pickAt(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    ray.params.Points.threshold = Math.max(.6, view.r * .012);
    let best = null;
    ray.intersectObject(stars).forEach(h => {
      if (alpha[h.index] < .2) return;
      const score = h.distanceToRay / Math.max(1, h.distance * .02);
      if (!best || score < best.score) best = { i: h.index, score };
    });
    return best ? units[best.i].id : null;
  }
  function click(e) { const id = pickAt(e); api.onPick && api.onPick(id); }
  let hoverRaf = 0;
  function hover(e) {
    if (hoverRaf) return;
    hoverRaf = requestAnimationFrame(() => { hoverRaf = 0; api.onHover && api.onHover(pickAt(e), e.clientX, e.clientY); });
  }

  // ---- 状態を描く ----
  // fn は星の状態の名前、pfn は進み（途中なら日の割合、済なら腕だめしの解けた割合）を返す
  const STATE = { later: 0, ready: 1, doing: 2, review: 2, done: 3, ri: 4 };
  function setStates(fn, pfn) {
    units.forEach((u, i) => { state[i] = STATE[fn(u.id)] ?? 0; prog[i] = pfn ? pfn(u.id) : 0; });
    sg.attributes.state.needsUpdate = true; sg.attributes.prog.needsUpdate = true;
  }
  // 見せる濃さ：1 は見える、低いほど沈む。目標の外の星と糸は沈める
  // boost：目標の星座では、目標の星どうしの糸を濃くする。
  // lens（橋の見方）：橋の星を残してほかを沈め、領域をまたぐ糸を濃く、同じ領域の糸を薄くする
  let lens = false;
  function setAlpha(fn, boost = 1) {
    units.forEach((u, i) => { const a = fn(u.id); alpha[i] = lens && !api.bridges.has(u.id) ? a * .45 : a; });
    sg.attributes.alpha.needsUpdate = true;
    pairs.forEach(([a, b], k) => {
      const v = Math.min(alpha[a], alpha[b]), len = P[a].distanceTo(P[b]);
      const f = lens ? (units[a].region !== units[b].region ? 3 : .2) : 1;
      ea[k * 2] = ea[k * 2 + 1] = (.012 + .05 * v * v * boost) * f / (1 + len / 14);
    });
    eg.attributes.alpha.needsUpdate = true;
  }
  setAlpha(() => 1);

  // ---- 動かす ----
  const clock = new THREE.Clock();
  function resize() {
    if (!host) return;
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    beadMat.uniforms.scale.value = ringMat.uniforms.scale.value = starMat.uniforms.scale.value = h * renderer.getPixelRatio() / 900;
  }
  const v = new THREE.Vector3();
  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    const t = clock.getElapsedTime(), now = performance.now();
    starMat.uniforms.time.value = glowMat.uniforms.time.value = beadMat.uniforms.time.value = ringMat.uniforms.time.value = t;
    [starMat, threadMat, glowMat].forEach(m => m.uniforms.fog.value.set(view.r * .55, view.r * 1.6));
    if (fly) {
      const k = Math.min(1, (now - fly.t0) / fly.ms), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      view.target.lerpVectors(fly.from.target, fly.to.target, e);
      view.r = fly.from.r + (fly.to.r - fly.from.r) * e;
      if (k >= 1) fly = null;
    } else if (!drag) {
      vel.th *= .94; vel.ph *= .94;
      view.th += vel.th; view.ph = THREE.MathUtils.clamp(view.ph + vel.ph, .15, Math.PI - .15);
      if (now - lastTouch > 3500) view.th += .0009;
    }
    place();
    renderer.render(scene, camera);
    // 分野の名前：手前ほどはっきり、奥は薄く
    const w = canvas.clientWidth, h = canvas.clientHeight;
    marks.forEach(l => {
      v.copy(l.at).project(camera);
      const vis = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      l.el.style.display = vis ? '' : 'none';
      if (!vis) return;
      const depth = camera.position.distanceTo(l.at) / view.r;
      l.el.style.transform = `translate(${(v.x + 1) / 2 * w}px, ${(1 - v.y) / 2 * h}px) translate(-50%, -50%)`;
      l.el.style.opacity = THREE.MathUtils.clamp(1.6 - depth, .25, 1).toFixed(2);
    });
  }

  return {
    // 置き場所を移す（画面を描き直しても、目の位置と状態は引き継ぐ）
    attach(el) {
      host = el; el.appendChild(canvas); el.appendChild(labels);
      resize();
      if (!running) { running = true; clock.start(); }
      requestAnimationFrame(frame);
    },
    pause() { running = false; },
    resize,
    setStates, setAlpha,
    setLens(on) { lens = !!on; },
    // 前提の鎖：[[前提, 単元], ...] を、前提から単元へ光が流れる曲線で描く。depth は光の出発のずれ
    glowEdges(list, tint) {
      setGlow(list.map(([a, b, off]) => ({ a: P[index.get(a)], b: P[index.get(b)], c: tint ? new THREE.Color(tint) : new THREE.Color().fromArray(col, index.get(b) * 3), w: .9, bulge: .08, off: off || 0 })));
    },
    // 組み合わせの弧：2 つの星を大きくふくらむ弧でつなぎ、真ん中へ向けて光を流す。meet があれば、そこへも糸を引く
    arc(a, b, meet = []) {
      const A = P[index.get(a)], B = P[index.get(b)], segs = [];
      const cv = curve(A, B, .45), mid = cv.getPoint(.5);
      const ca = new THREE.Color().fromArray(col, index.get(a) * 3), cb = new THREE.Color().fromArray(col, index.get(b) * 3);
      segs.push({ a: A, b: mid, c: ca, w: 1, bulge: .2, n: 24 }, { a: B, b: mid, c: cb, w: 1, bulge: .2, n: 24 });
      meet.forEach(m => {
        const M = P[index.get(m)];
        segs.push({ a: A, b: M, c: ca, w: .7, bulge: .1 }, { a: B, b: M, c: cb, w: .7, bulge: .1 });
      });
      setGlow(segs);
      setRings([a, b, ...meet]);
      return mid;
    },
    clearGlow() { setGlow([]); setRings([]); },
    mark(ids) { setRings(ids); },
    focus(ids, rMin = 18) {
      const box = new THREE.Box3();
      ids.forEach(id => index.has(id) && box.expandByPoint(P[index.get(id)]));
      if (box.isEmpty()) return;
      const c = box.getCenter(new THREE.Vector3()), r = THREE.MathUtils.clamp(box.getSize(new THREE.Vector3()).length() * .9, rMin, 85);
      flyTo(c, r);
    },
    // 分野へ寄る：その分野の星の重心へ、星の広がりに合わせた距離で
    flyField(id) {
      const m = markOf(id);
      if (m) flyTo(m.at, THREE.MathUtils.clamp(m.r * 3.2, 26, 90));
    },
    home() { flyTo(new THREE.Vector3(), 100); },
    // 選んだ星のまわりを回す（D-112）：回転の中心を、中心（原点）とその星の中点に移し、どの向きに回しても両方が画面に収まる距離にする
    orbit(id) {
      if (!index.has(id)) return;
      const p = P[index.get(id)], c = p.clone().multiplyScalar(.5), d = Math.max(p.length() / 2, 4);
      const half = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * Math.min(1, camera.aspect));
      flyTo(c, THREE.MathUtils.clamp(d / Math.tan(half) * 1.15, 18, 150));
    },
    project(id) {
      if (!index.has(id)) return null;
      v.copy(P[index.get(id)]).project(camera);
      return v.z < 1 ? { x: (v.x + 1) / 2 * canvas.clientWidth, y: (1 - v.y) / 2 * canvas.clientHeight } : null;
    },
  };
}

window.Space = { mount };
window.dispatchEvent(new Event('space-ready'));
