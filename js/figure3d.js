/* First screen: "Breakout". A puck has just smashed through rink glass and is flying at the viewer.
   - Behind: a blurred photo of Ryan (#10) skating at the camera, plus his name (both DOM layers, they blur while you drag)
   - Glass pane with a jagged hole and gold spiderweb cracks; the puck's shadow lands on it (spotlight, like three.js webgl_lights_spotlight)
   - The puck: lying almost flat, tipped toward the bottom, knurled diamond edge, smooth gloss faces, RYAN LI engraved underneath
   - Shards stream toward the screen on a golden-angle spiral inside a widening cone (closer = bigger), plus gold dust points
   - Drag to orbit around the puck (drag down to see the name underneath). Scroll flies the camera in.
   If window.SPLINE_HERO holds a Spline export URL (prod.spline.design/.../scene.splinecode), that scene is shown instead. */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const wrap = document.getElementById("stage3d");
const stage = document.getElementById("stagePin");
const canvas = document.getElementById("figure");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const small = innerWidth < 720;
const rand = (a, b) => a + Math.random() * (b - a);
const easeOut = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 4);

/* ---------- Optional: Ryan's own Spline scene ---------- */
async function trySpline() {
  const url = window.SPLINE_HERO;
  if (!url || !/^https:\/\/prod\.spline\.design\/.+\.splinecode$/.test(url)) return false;
  await import("https://cdn.jsdelivr.net/npm/@splinetool/viewer@2.0.111/build/spline-viewer.js");
  const v = document.createElement("spline-viewer");
  v.setAttribute("url", url); v.setAttribute("loading-anim-type", "none"); v.className = "spline-hero";
  canvas.replaceWith(v);
  stage.classList.add("ready", "is-spline");
  return true;
}

/* ---------- Canvas textures ---------- */
function knurlTexture() { // diamond grip pattern for the puck's edge (used as a bump map)
  const c = document.createElement("canvas"); c.width = 1024; c.height = 128; const g = c.getContext("2d");
  g.fillStyle = "#808080"; g.fillRect(0, 0, c.width, c.height);
  const step = 16;
  for (let y = -step; y < c.height + step; y += step) for (let x = -step; x < c.width + step; x += step) {
    const ox = ((y / step) % 2) * step / 2;
    g.fillStyle = "#e6e6e6";
    g.beginPath(); g.moveTo(x + ox, y - step * .42); g.lineTo(x + ox + step * .42, y); g.lineTo(x + ox, y + step * .42); g.lineTo(x + ox - step * .42, y); g.closePath(); g.fill();
  }
  // smooth bands at top and bottom of the edge, like a real puck
  g.fillStyle = "#808080"; g.fillRect(0, 0, c.width, 14); g.fillRect(0, c.height - 14, c.width, 14);
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1); return t;
}
function faceTexture(name) { // puck face: gloss black, thin gold ring, optional engraved name
  const S = 1024, c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d");
  const grd = g.createRadialGradient(S * .4, S * .35, 0, S / 2, S / 2, S * .55);
  grd.addColorStop(0, "#1b1b1d"); grd.addColorStop(1, "#08080a"); g.fillStyle = grd; g.fillRect(0, 0, S, S);
  g.strokeStyle = "#c9953f"; g.lineWidth = 6; g.beginPath(); g.arc(S / 2, S / 2, S * .44, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 2; g.beginPath(); g.arc(S / 2, S / 2, S * .41, 0, Math.PI * 2); g.stroke();
  if (name) {
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = `italic 400 ${S * .2}px "Instrument Serif", Georgia, serif`;
    g.shadowColor = "rgba(0,0,0,.9)"; g.shadowOffsetY = 4; g.shadowBlur = 6;
    const tg = g.createLinearGradient(0, S * .4, 0, S * .6); tg.addColorStop(0, "#f6dc97"); tg.addColorStop(1, "#b57f2c");
    g.fillStyle = tg; g.fillText(name, S / 2, S * .48);
    g.shadowColor = "transparent";
    g.font = `500 ${S * .036}px "IBM Plex Mono", monospace`; g.fillStyle = "#c9953f";
    g.fillText("DATA ANALYTICS · PURDUE", S / 2, S * .64);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function dotTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,230,170,1)"); grd.addColorStop(.35, "rgba(240,190,90,.5)"); grd.addColorStop(1, "rgba(240,190,90,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}

async function init() {
  if (await trySpline()) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" }); }
  catch { stage.classList.add("ready"); return; }
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (document.fonts) { try { await document.fonts.load('italic 40px "Instrument Serif"'); } catch {} }

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const GOLD = 0xf3c45a;

  /* ---------- Glass pane with a jagged hole ---------- */
  const PW = 16, PH = 10, HOLE = 1.25;
  const holePts = [];
  for (let i = 0, n = 22; i < n; i++) {
    const a = (i / n) * Math.PI * 2, r = HOLE * (i % 2 ? rand(0.55, 0.8) : rand(0.95, 1.35));
    holePts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  const paneShape = new THREE.Shape([new THREE.Vector2(-PW / 2, -PH / 2), new THREE.Vector2(PW / 2, -PH / 2), new THREE.Vector2(PW / 2, PH / 2), new THREE.Vector2(-PW / 2, PH / 2)]);
  paneShape.holes.push(new THREE.Path(holePts.slice().reverse()));
  const pane = new THREE.Mesh(new THREE.ShapeGeometry(paneShape), new THREE.MeshPhysicalMaterial({
    color: 0xcfe0e4, transparent: true, opacity: 0.13, roughness: 0.04, metalness: 0, clearcoat: 1, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false }));
  const glass = new THREE.Group(); glass.add(pane);
  // the puck's shadow lands on the glass
  const shadowCatcher = new THREE.Mesh(new THREE.ShapeGeometry(paneShape), new THREE.ShadowMaterial({ opacity: 0.45 }));
  shadowCatcher.position.z = 0.005; shadowCatcher.receiveShadow = true; glass.add(shadowCatcher);

  // spiderweb cracks: radial lines + jittered rings, denser near the hole
  const crackPos = [], crackGlow = [];
  const RAYS = 26, rays = [];
  for (let i = 0; i < RAYS; i++) {
    const a0 = (i / RAYS) * Math.PI * 2 + rand(-0.06, 0.06); const pts = []; let r = HOLE * rand(0.9, 1.25), a = a0;
    while (r < 11) { pts.push([Math.cos(a) * r, Math.sin(a) * r]); r *= rand(1.12, 1.28); r += rand(0.15, 0.35); a += rand(-0.05, 0.05); }
    rays.push(pts);
    for (let k = 1; k < pts.length; k++) crackPos.push(pts[k - 1][0], pts[k - 1][1], 0.01, pts[k][0], pts[k][1], 0.01);
  }
  for (let ring = 1; ring < 9; ring++) for (let i = 0; i < RAYS; i++) {
    const A = rays[i][ring], B = rays[(i + 1) % RAYS][ring]; if (!A || !B || Math.random() < ring * 0.06) continue;
    const mx = (A[0] + B[0]) / 2 * rand(0.86, 0.96), my = (A[1] + B[1]) / 2 * rand(0.86, 0.96);
    crackPos.push(A[0], A[1], 0.01, mx, my, 0.01, mx, my, 0.01, B[0], B[1], 0.01);
  }
  for (let i = 0; i < holePts.length; i++) { const p = holePts[i], q = holePts[(i + 1) % holePts.length]; crackGlow.push(p.x, p.y, 0.01, q.x, q.y, 0.01); }
  const lineGeo = (arr) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3)); return g; };
  glass.add(new THREE.LineSegments(lineGeo(crackPos), new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.75 })));
  glass.add(new THREE.LineSegments(lineGeo(crackGlow), new THREE.LineBasicMaterial({ color: 0xfff1c8 })));
  const rimCurve = new THREE.CatmullRomCurve3(holePts.map(p => new THREE.Vector3(p.x, p.y, 0.02)), true, "catmullrom", 0.05);
  glass.add(new THREE.Mesh(new THREE.TubeGeometry(rimCurve, 220, 0.022, 6, true), new THREE.MeshBasicMaterial({ color: 0xffe3a0 })));
  // the hole itself reads darker: a soft shadow disc just behind the glass
  const holeShade = new THREE.Mesh(new THREE.CircleGeometry(HOLE * 1.6, 48), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }));
  holeShade.position.z = -0.4; glass.add(holeShade);
  glass.rotation.y = -0.12; glass.position.set(0.15, 0.25, 0);
  scene.add(glass);

  /* ---------- The puck ---------- */
  const R = 1, Hh = 0.667; // real puck: 3 in across, 1 in thick
  const bump = knurlTexture();
  const puckGeo = new THREE.CylinderGeometry(R, R, Hh, 128, 1, false);
  const sideMat = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0c, roughness: 0.42, metalness: 0.05, bumpMap: bump, bumpScale: 2.2, clearcoat: 0.4, clearcoatRoughness: 0.4 });
  const topMat = new THREE.MeshPhysicalMaterial({ map: faceTexture(null), roughness: 0.38, metalness: 0.0, clearcoat: 0.55, clearcoatRoughness: 0.3, envMapIntensity: 0.45 });
  const botMat = new THREE.MeshPhysicalMaterial({ map: faceTexture("Ryan Li"), roughness: 0.35, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 0.5 });
  const puckMesh = new THREE.Mesh(puckGeo, [sideMat, topMat, botMat]);
  puckMesh.castShadow = true;
  // bevel highlight rings
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.25, metalness: 0.3 });
  [Hh / 2, -Hh / 2].forEach(y => { const t = new THREE.Mesh(new THREE.TorusGeometry(R - 0.012, 0.016, 10, 128), ringMat); t.rotation.x = Math.PI / 2; t.position.y = y; puckMesh.add(t); });
  const puck = new THREE.Group(); puck.add(puckMesh);
  const PUCK_POS = new THREE.Vector3(0, 0.15, 2.1);
  puck.position.copy(PUCK_POS);
  puck.rotation.set(0.38, 0.0, -0.12); // almost flat, front edge tipped toward the bottom
  scene.add(puck);

  /* ---------- Shards: golden-angle spiral inside a cone from the hole to the screen ---------- */
  const shardShapes = [];
  for (let k = 0; k < 8; k++) {
    const s = new THREE.Shape(), n = 3 + (k % 3), pts = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + rand(-0.4, 0.4); pts.push([Math.cos(a) * rand(0.35, 1), Math.sin(a) * rand(0.15, 0.45)]); }
    pts.sort((p, q) => Math.atan2(p[1], p[0]) - Math.atan2(q[1], q[0]));
    pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath();
    shardShapes.push(new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: false }));
  }
  const shardMat = new THREE.MeshPhysicalMaterial({ color: 0xeaf2f2, transparent: true, opacity: 0.38, roughness: 0.02, metalness: 0.1, clearcoat: 1, envMapIntensity: 2.2, side: THREE.DoubleSide, depthWrite: false });
  const edgeMat = new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.9 });
  const shards = [], N = small ? 80 : 150, GA = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N, t = Math.pow(u, 0.75);                 // more shards near the hole
    const z = 0.15 + t * 5.6;                                          // from the glass toward the camera
    let r = (0.5 + t * 3.4) * (0.75 + 0.5 * ((i * 7919) % 97) / 97); // the cone widens toward the camera
    if (Math.abs(z - PUCK_POS.z) < 1 && r < 1.55) r = 1.55 + rand(0, 0.4); // keep the puck's face clear
    const a = i * GA, x = Math.cos(a) * r * 1.35, y = Math.sin(a) * r * 0.9 + 0.2;
    const size = (0.08 + t * t * 0.95) * rand(0.7, 1.3);              // exaggeration: closer = much bigger
    const geo = shardShapes[i % shardShapes.length];
    const m = new THREE.Mesh(geo, shardMat); m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
    m.scale.setScalar(size);
    const target = new THREE.Vector3(x, y, z);
    const dir = target.clone().sub(new THREE.Vector3(0, 0.2, 0)).normalize();
    m.lookAt(target.clone().add(dir)); m.rotateZ(rand(-0.5, 0.5)); // long axis follows the flight path
    m.position.set(0.15, 0.25, 0);
    scene.add(m);
    shards.push({ m, target, dir, delay: t * 0.35, spin: new THREE.Vector3(rand(-0.3, 0.3), rand(-0.3, 0.3), rand(-0.3, 0.3)), q0: m.quaternion.clone() });
  }

  /* ---------- Gold dust (point cloud) ---------- */
  const D = small ? 900 : 2200, dp = new Float32Array(D * 3), dv = new Float32Array(D);
  for (let i = 0; i < D; i++) {
    const t = Math.pow(Math.random(), 0.8), a = Math.random() * Math.PI * 2, r = (0.3 + t * 4) * Math.sqrt(Math.random());
    dp.set([Math.cos(a) * r * 1.4, Math.sin(a) * r * 0.9 + 0.2, t * 6], i * 3); dv[i] = rand(0.05, 0.25);
  }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.05, map: dotTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffe2a0 }));
  scene.add(dust);

  /* ---------- Lights ---------- */
  scene.add(new THREE.HemisphereLight(0xfff1d6, 0x1a120a, 0.5));
  const spot = new THREE.SpotLight(0xfff0d0, 55, 30, 0.42, 0.6, 1.6);   // key, like the spotlight example
  spot.position.set(-2.6, 5.2, 7.5); spot.target = puck; spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -0.0004; spot.shadow.radius = 6;
  scene.add(spot);
  const rim = new THREE.SpotLight(0xffb64d, 120, 25, 0.6, 0.8, 1.4);     // gold backlight through the hole
  rim.position.set(0.5, 1.5, -6); rim.target = puck; scene.add(rim);
  const kick = new THREE.PointLight(0xc9953f, 8, 6); kick.position.set(2.4, -0.8, 3.2); scene.add(kick);

  /* ---------- Camera + interaction ---------- */
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  let yaw = 0, pitch = 0, tYaw = 0, tPitch = 0, dragging = false, lx = 0, ly = 0, lastMove = 0, mx = 0, my = 0, scrollP = 0;
  const YAW = 1.15, PITCH_UP = 0.4, PITCH_DOWN = -1.2; // drag down to look under the puck and read the name

  function layout() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // puck ~ 40% of the width on desktop, ~75% on a phone
    const want = (w / h < 0.8 ? 0.78 : 0.4), fovR = THREE.MathUtils.degToRad(camera.fov / 2);
    camera.userData.dist = (2 * R / want) / (2 * Math.tan(fovR) * camera.aspect);
    camera.updateProjectionMatrix();
  }

  const clock = new THREE.Clock(); let t0 = null;
  function render() {
    const dt = Math.min(clock.getDelta(), 0.05), now = clock.elapsedTime; if (t0 === null) t0 = now;
    const T = reduce ? 10 : now - t0, k = reduce ? 0.2 : 1;
    if (!dragging && performance.now() - lastMove > 1600) {
      tYaw += ((reduce ? 0 : Math.sin(now / 3.2) * 0.12) + mx * 0.18 - tYaw) * 0.025;
      tPitch += (-my * 0.08 - tPitch) * 0.025;
    }
    yaw += (tYaw - yaw) * 0.1; pitch += (tPitch - pitch) * 0.1;

    // impact: the puck punches out first, the glass follows a beat later
    const pi = easeOut(T / 0.8);
    puck.position.set(PUCK_POS.x, PUCK_POS.y, -0.8 + (PUCK_POS.z + 0.8) * pi);
    puck.position.y += Math.sin(now * 0.9) * 0.03 * k;
    puckMesh.rotation.y += dt * 0.25 * k; // pucks spin in flight
    shards.forEach(s => {
      const p = easeOut((T - 0.12 - s.delay) / 1.1);
      s.m.position.set(0.15 + (s.target.x - 0.15) * p, 0.25 + (s.target.y - 0.25) * p, s.target.z * p);
      if (p >= 1) s.m.position.addScaledVector(s.dir, Math.sin(now * 0.4 + s.delay * 9) * 0.06 * k); // slow-motion drift
      s.m.quaternion.copy(s.q0); s.m.rotateX(s.spin.x * now * k); s.m.rotateY(s.spin.y * now * k);
      s.m.visible = p > 0.01;
    });
    const dpos = dustGeo.attributes.position;
    for (let i = 0; i < D; i++) { let z = dpos.getZ(i) + dv[i] * dt * k; if (z > 6) z = 0.05; dpos.setZ(i, z); }
    dpos.needsUpdate = true; dust.material.opacity = Math.min(1, T / 1.2);

    // camera orbits the puck; scroll flies it in toward the hole
    const d = camera.userData.dist * (1 - scrollP * 0.6), c = puck.position;
    camera.position.set(c.x + Math.sin(yaw) * Math.cos(pitch) * d, c.y + Math.sin(pitch) * d + 0.35, c.z + Math.cos(yaw) * Math.cos(pitch) * d);
    camera.lookAt(c.x, c.y - 0.05, c.z - 0.4);
    renderer.render(scene, camera);
    stage.style.setProperty("--yaw", yaw.toFixed(3));
    if (visible) requestAnimationFrame(render); else running = false;
  }

  function onScroll() {
    const r = wrap.getBoundingClientRect(), span = Math.max(1, wrap.offsetHeight - innerHeight);
    scrollP = Math.min(1, Math.max(0, -r.top / span));
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true; lx = e.clientX; ly = e.clientY; stage.classList.add("dragging");
    try { stage.setPointerCapture(e.pointerId); } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5;
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
    tYaw = Math.max(-YAW, Math.min(YAW, tYaw - dx * 0.006));
    if (e.pointerType !== "touch" || Math.abs(dy) > Math.abs(dx)) tPitch = Math.max(PITCH_DOWN, Math.min(PITCH_UP, tPitch - dy * 0.005));
    lastMove = performance.now();
  });
  const end = () => { if (!dragging) return; dragging = false; lastMove = performance.now(); stage.classList.remove("dragging"); };
  stage.addEventListener("pointerup", end); stage.addEventListener("pointercancel", end); stage.addEventListener("lostpointercapture", end);

  let visible = true, running = false;
  const start = () => { if (!running) { running = true; clock.getDelta(); requestAnimationFrame(render); } };
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); }).observe(wrap);
  addEventListener("resize", layout);
  layout(); start();
  stage.classList.add("ready");
}

// scroll progress for the CSS layers (name fade, keyword fade, hand-off to the intro) works with either scene
function cssScroll() {
  const r = wrap.getBoundingClientRect(), span = Math.max(1, wrap.offsetHeight - innerHeight);
  wrap.style.setProperty("--sp", Math.min(1, Math.max(0, -r.top / span)).toFixed(3));
}
addEventListener("scroll", cssScroll, { passive: true }); cssScroll();

init().catch((e) => { console.warn("3D scene failed", e); stage.classList.add("ready"); });
