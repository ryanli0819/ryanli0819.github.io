/* First screen: a cinematic 3D scene built around Ryan.
   - Ryan: cut out of a photo and inflated into a 3D relief (assets/hero/ryan-figure.webp + ryan-depth.png)
   - Around him: a brass clockwork gear, a clock-dial ring, tilted orbit rings, a belt of angular debris, gold stardust
   - Drag to orbit the camera (the DOM background and the name blur while you drag)
   - Scroll: the camera flies in through the rings before the intro section arrives */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const wrap = document.getElementById("stage3d");
const stage = document.getElementById("stagePin");
const canvas = document.getElementById("figure");
const fallback = document.getElementById("figureFallback");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const small = innerWidth < 720;

const loadImage = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
const rand = (a, b) => a + Math.random() * (b - a);

async function init() {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" }); }
  catch { return; }
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const [tex, dimg] = await Promise.all([
    new THREE.TextureLoader().loadAsync(small ? "assets/hero/ryan-figure-sm.webp" : "assets/hero/ryan-figure.webp"),
    loadImage("assets/hero/ryan-depth.png")
  ]);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  /* ---------- Ryan ---------- */
  const dc = document.createElement("canvas"); dc.width = dimg.width; dc.height = dimg.height;
  const dctx = dc.getContext("2d"); dctx.drawImage(dimg, 0, 0);
  const D = dctx.getImageData(0, 0, dc.width, dc.height).data;
  const depthAt = (u, v) => {
    const x = u * (dc.width - 1), y = v * (dc.height - 1), x0 = Math.floor(x), y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, dc.width - 1), y1 = Math.min(y0 + 1, dc.height - 1), fx = x - x0, fy = y - y0;
    const p = (xx, yy) => D[(yy * dc.width + xx) * 4] / 255;
    return (p(x0, y0) * (1 - fx) + p(x1, y0) * fx) * (1 - fy) + (p(x0, y1) * (1 - fx) + p(x1, y1) * fx) * fy;
  };
  const aspect = tex.image.width / tex.image.height, H = 2, W = H * aspect, DEPTH = 0.26;
  const SX = small ? 110 : 180, SY = small ? 200 : 330;
  const geo = new THREE.PlaneGeometry(W, H, SX, SY);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  let z = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) z[i] = depthAt(uv.getX(i), 1 - uv.getY(i));
  const cols = SX + 1, rows = SY + 1;
  for (let pass = 0; pass < 4; pass++) { // smooth 8-bit depth steps so the surface has no banding
    const nz = new Float32Array(z.length);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      let sum = 0, n = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dcc = -1; dcc <= 1; dcc++) {
        const rr = r + dr, cc = c + dcc; if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;
        sum += z[rr * cols + cc]; n++;
      }
      nz[r * cols + c] = z[r * cols + c] === 0 ? 0 : sum / n;
    }
    z = nz;
  }
  for (let i = 0; i < pos.count; i++) pos.setZ(i, z[i] * DEPTH);
  geo.computeVertexNormals();
  const ryan = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    map: tex, alphaTest: 0.5, roughness: 0.85, metalness: 0, envMapIntensity: 0.25,
    emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.32
  }));
  const hero = new THREE.Group(); hero.add(ryan); scene.add(hero);

  /* ---------- Materials ---------- */
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9953f, metalness: 0.92, roughness: 0.32 });
  const darkBrass = new THREE.MeshStandardMaterial({ color: 0x6e4a22, metalness: 0.85, roughness: 0.45 });
  const rock = new THREE.MeshStandardMaterial({ color: 0x3a2c1e, metalness: 0.2, roughness: 0.9, flatShading: true });

  /* ---------- Clockwork behind him ---------- */
  function gearGeometry(R, teeth, depth, hole) {
    const s = new THREE.Shape(), step = (Math.PI * 2) / teeth;
    for (let i = 0; i < teeth; i++) {
      const a = i * step;
      [[R, a], [R + depth, a + step * 0.15], [R + depth, a + step * 0.45], [R, a + step * 0.6]].forEach(([r, t], j) => {
        const x = Math.cos(t) * r, y = Math.sin(t) * r; (i === 0 && j === 0) ? s.moveTo(x, y) : s.lineTo(x, y);
      });
    }
    s.closePath();
    const h = new THREE.Path(); h.absarc(0, 0, hole, 0, Math.PI * 2, true); s.holes.push(h);
    return new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 1, curveSegments: 64 });
  }
  const gear = new THREE.Mesh(gearGeometry(0.98, 60, 0.06, 0.9), darkBrass);
  gear.position.set(0, 0.5, -0.9); hero.add(gear);
  const gear2 = new THREE.Mesh(gearGeometry(0.42, 22, 0.05, 0.3), darkBrass);
  gear2.position.set(1.05, 0.95, -1.0); gear2.scale.setScalar(0.75); hero.add(gear2);
  const gear3 = new THREE.Mesh(gearGeometry(0.3, 16, 0.045, 0.2), brass);
  gear3.position.set(-1.05, -0.2, -0.95); hero.add(gear3);

  const dial = new THREE.Group(); dial.position.set(0, 0.5, -0.8); dial.scale.setScalar(0.85);
  dial.add(new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.006, 6, 160), brass));
  dial.add(new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.004, 6, 160), darkBrass));
  const tickGeo = new THREE.BoxGeometry(0.012, 0.07, 0.01), tickGeoBig = new THREE.BoxGeometry(0.022, 0.12, 0.012);
  for (let i = 0; i < 60; i++) {
    const big = i % 5 === 0, t = new THREE.Mesh(big ? tickGeoBig : tickGeo, brass), a = (i / 60) * Math.PI * 2;
    t.position.set(Math.cos(a) * 0.84, Math.sin(a) * 0.84, 0); t.rotation.z = a - Math.PI / 2; dial.add(t);
  }
  hero.add(dial);

  /* ---------- Orbit rings + debris belt (pass in front of and behind him) ---------- */
  const orbits = [];
  function orbit(radius, tube, tilt, spin, mat) {
    const g = new THREE.Group(); g.rotation.set(tilt[0], tilt[1], tilt[2]);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 220), mat); ring.rotation.x = Math.PI / 2; g.add(ring);
    hero.add(g); orbits.push({ g, spin }); return g;
  }
  const o1 = orbit(1.55, 0.016, [0.32, 0, -0.22], 0.12, brass);
  const o2 = orbit(1.95, 0.009, [-0.2, 0, 0.35], -0.08, darkBrass);
  orbit(2.4, 0.005, [0.5, 0.3, 0.1], 0.05, brass);
  [[o1, 1.55, 0.05], [o2, 1.95, 0.035]].forEach(([g, r, s]) => {
    for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(s, 16, 12), brass), a = k * 2.1; m.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); g.add(m); }
  });
  const belt = new THREE.Group(); belt.rotation.set(0.32, 0, -0.22); hero.add(belt);
  const shapes = [new THREE.TetrahedronGeometry(1), new THREE.OctahedronGeometry(1), new THREE.IcosahedronGeometry(1, 0), new THREE.BoxGeometry(1.2, 0.5, 0.8)];
  const debris = [];
  for (let i = 0; i < (small ? 40 : 80); i++) {
    const m = new THREE.Mesh(shapes[i % shapes.length], i % 5 === 0 ? brass : rock), s = rand(0.015, 0.07), a = Math.random() * Math.PI * 2, r = rand(1.45, 2.05);
    m.scale.setScalar(s); m.position.set(Math.cos(a) * r, rand(-0.08, 0.08), Math.sin(a) * r);
    m.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6)); belt.add(m); debris.push({ m, rx: rand(-1, 1), ry: rand(-1, 1) });
  }

  /* ---------- Glow + stardust ---------- */
  const glowTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(255,222,150,1)"); grd.addColorStop(0.3, "rgba(240,180,80,.45)"); grd.addColorStop(1, "rgba(240,180,80,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.55 }));
  glow.scale.set(3.6, 3.6, 1); glow.position.set(0, 0.45, -1.1); hero.add(glow);
  const sparks = [];
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.9 }));
    s.scale.set(0.22, 0.22, 1); (i % 2 ? o1 : o2).add(s); sparks.push({ s, r: i % 2 ? 1.55 : 1.95, a: i * 1.3, sp: rand(0.25, 0.5) });
  }
  const N = small ? 700 : 1600, sp = new Float32Array(N * 3), sc = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = rand(4, 16), t = Math.random() * Math.PI * 2, p = Math.acos(rand(-1, 1));
    sp.set([r * Math.sin(p) * Math.cos(t), r * Math.cos(p) * 0.6, r * Math.sin(p) * Math.sin(t) - 4], i * 3);
    const warm = Math.random(); sc.set([1, 0.78 + warm * 0.2, 0.45 + warm * 0.4], i * 3);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3)); sg.setAttribute("color", new THREE.BufferAttribute(sc, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(stars);

  /* ---------- Lights ---------- */
  scene.add(new THREE.HemisphereLight(0xfff1d6, 0x2a1a0a, 1.2));
  const key = new THREE.DirectionalLight(0xfff4e0, 1.6); key.position.set(-1.5, 2, 3); scene.add(key);
  const rimL = new THREE.PointLight(0xffb347, 6, 6); rimL.position.set(-1.8, 1.2, -1); scene.add(rimL);
  const rimR = new THREE.PointLight(0xffd27a, 5, 6); rimR.position.set(1.9, 0.4, -0.8); scene.add(rimR);

  /* ---------- Camera + interaction ---------- */
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const target = new THREE.Vector3(0, 0.15, 0);
  let yaw = 0, pitch = 0, tYaw = 0, tPitch = 0, dragging = false, lx = 0, ly = 0, lastMove = 0, mx = 0, my = 0, scrollP = 0;
  const YAW_MAX = 0.42, PITCH_MAX = 0.14; // a single photo only holds up for a gentle turn of Ryan himself

  function layout() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const fovR = THREE.MathUtils.degToRad(camera.fov / 2);
    let dist = (H / 2) / Math.tan(fovR) * 1.3;
    if (w / h < 0.8) dist = Math.max(dist, 1.35 / Math.tan(fovR) / camera.aspect);
    camera.userData.dist = dist;
    hero.position.y = w / h < 0.8 ? -0.55 : -0.2;
    camera.updateProjectionMatrix();
  }

  const clock = new THREE.Clock();
  function render() {
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime, k = reduce ? 0.15 : 1;
    if (!dragging && performance.now() - lastMove > 1400) {
      tYaw += ((reduce ? 0 : Math.sin(t / 2.6) * 0.1) + mx * 0.12 - tYaw) * 0.03; tPitch += (my * 0.05 - tPitch) * 0.03;
    }
    yaw += (tYaw - yaw) * 0.12; pitch += (tPitch - pitch) * 0.12;
    gear.rotation.z += dt * 0.08 * k; gear2.rotation.z -= dt * 0.22 * k; gear3.rotation.z += dt * 0.3 * k; dial.rotation.z -= dt * 0.03 * k;
    orbits.forEach(o => o.g.rotation.y += dt * o.spin * k);
    belt.rotation.y += dt * 0.06 * k;
    debris.forEach(d => { d.m.rotation.x += dt * d.rx * k; d.m.rotation.y += dt * d.ry * k; });
    sparks.forEach(s => { s.a += dt * s.sp * k; s.s.position.set(Math.cos(s.a) * s.r, 0, Math.sin(s.a) * s.r); });
    stars.rotation.y += dt * 0.01 * k;
    glow.material.opacity = 0.5 + Math.sin(t * 1.3) * 0.06;
    const d = camera.userData.dist * (1 - scrollP * 0.55);
    camera.position.set(Math.sin(yaw) * Math.cos(pitch) * d, Math.sin(pitch) * d + scrollP * 0.35, Math.cos(yaw) * Math.cos(pitch) * d);
    target.y = 0.15 + scrollP * 0.45;
    camera.lookAt(target);
    key.position.set(-1.5 + mx * 2, 2 - my, 3);
    renderer.render(scene, camera);
    stage.style.setProperty("--yaw", yaw.toFixed(3));
    if (visible) requestAnimationFrame(render); else running = false;
  }

  function onScroll() {
    const r = wrap.getBoundingClientRect(), span = Math.max(1, wrap.offsetHeight - innerHeight);
    scrollP = Math.min(1, Math.max(0, -r.top / span));
    wrap.style.setProperty("--sp", scrollP.toFixed(3));
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true; lx = e.clientX; ly = e.clientY; stage.classList.add("dragging"); try { stage.setPointerCapture(e.pointerId); } catch {}
  });
  stage.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5;
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
    tYaw = Math.max(-YAW_MAX, Math.min(YAW_MAX, tYaw - dx * 0.004));
    if (e.pointerType !== "touch") tPitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, tPitch + dy * 0.003));
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
  if (fallback) fallback.hidden = true;
}

init().catch((e) => console.warn("3D scene failed", e));
