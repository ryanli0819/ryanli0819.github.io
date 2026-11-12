/* Landing figure: Ryan, cut out of a photo and inflated into a 3D relief with three.js.
   Drag to orbit the camera around the figure (the background stays put and blurs while you drag).
   Texture: assets/hero/ryan-figure.webp (cutout with alpha). Shape: assets/hero/ryan-depth.png (white = closer). */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const stage = document.getElementById("stage3d");
const canvas = document.getElementById("figure");
const fallback = document.getElementById("figureFallback");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

function loadImage(src) {
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
}

async function init() {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" }); }
  catch { return; }
  const small = innerWidth < 720;
  const [tex, dimg] = await Promise.all([
    new THREE.TextureLoader().loadAsync(small ? "assets/hero/ryan-figure-sm.webp" : "assets/hero/ryan-figure.webp"),
    loadImage("assets/hero/ryan-depth.png")
  ]);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  // read depth pixels
  const dc = document.createElement("canvas"); dc.width = dimg.width; dc.height = dimg.height;
  const dctx = dc.getContext("2d"); dctx.drawImage(dimg, 0, 0);
  const D = dctx.getImageData(0, 0, dc.width, dc.height).data;
  const depthAt = (u, v) => { // bilinear, u,v in 0..1 (v=0 top)
    const x = u * (dc.width - 1), y = v * (dc.height - 1), x0 = Math.floor(x), y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, dc.width - 1), y1 = Math.min(y0 + 1, dc.height - 1), fx = x - x0, fy = y - y0;
    const p = (xx, yy) => D[(yy * dc.width + xx) * 4] / 255;
    return (p(x0, y0) * (1 - fx) + p(x1, y0) * fx) * (1 - fy) + (p(x0, y1) * (1 - fx) + p(x1, y1) * fx) * fy;
  };

  const aspect = tex.image.width / tex.image.height, H = 2, W = H * aspect, DEPTH = 0.42;
  const SX = small ? 110 : 180, SY = small ? 200 : 330;
  const geo = new THREE.PlaneGeometry(W, H, SX, SY);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  let z = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) z[i] = depthAt(uv.getX(i), 1 - uv.getY(i));
  // smooth the 8-bit depth steps so the surface has no banding
  const cols = SX + 1, rows = SY + 1;
  for (let pass = 0; pass < 4; pass++) {
    const nz = new Float32Array(z.length);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      let sum = 0, n = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr, cc = c + dc; if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;
        sum += z[rr * cols + cc]; n++;
      }
      nz[r * cols + c] = z[r * cols + c] === 0 ? 0 : sum / n;
    }
    z = nz;
  }
  for (let i = 0; i < pos.count; i++) pos.setZ(i, z[i] * DEPTH);
  geo.computeVertexNormals();

  const front = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.04, roughness: 0.85, metalness: 0, side: THREE.FrontSide }));
  const figure = new THREE.Group(); figure.add(front);
  const scene = new THREE.Scene(); scene.add(figure);
  scene.add(new THREE.HemisphereLight(0xfff8ea, 0x8a6a40, 2.4));
  const key = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(-1.5, 1.8, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd27a, 1.1); rim.position.set(2.5, 1, -2); scene.add(rim);

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  const target = new THREE.Vector3(0, 0, DEPTH * 0.3);

  // orbit state
  let yaw = 0, pitch = 0, tYaw = 0, tPitch = 0, dragging = false, lx = 0, ly = 0, lastMove = 0, mx = 0, my = 0;
  const YAW_MAX = 0.9, PITCH_MAX = 0.28; // ~52° and ~16°: the photo only has a front, so the view stays in front of it

  function layout() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // fit figure height to ~96% of the viewport, feet below the fold
    const portrait = w / h < .8;
    let dist = (H / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.18;
    if (portrait) dist = Math.max(dist, (W / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / camera.aspect * 1.25);
    camera.userData.dist = dist;
    figure.position.y = -0.2;
    camera.updateProjectionMatrix();
  }

  function render(t) {
    if (!dragging) {
      const idle = reduce ? 0 : Math.sin(t / 2600) * 0.16;
      if (performance.now() - lastMove > 1400) { tYaw += (idle + mx * 0.12 - tYaw) * 0.03; tPitch += (my * 0.05 - tPitch) * 0.03; }
    }
    yaw += (tYaw - yaw) * 0.12; pitch += (tPitch - pitch) * 0.12;
    const d = camera.userData.dist;
    camera.position.set(Math.sin(yaw) * Math.cos(pitch) * d, Math.sin(pitch) * d, Math.cos(yaw) * Math.cos(pitch) * d);
    camera.lookAt(target);
    key.position.set(-1.5 + mx * 2, 1.8 - my, 3);
    renderer.render(scene, camera);
    stage.style.setProperty("--yaw", yaw.toFixed(3));
    if (visible) requestAnimationFrame(render); else running = false;
  }

  // pointer: drag to orbit (horizontal drags on touch, so vertical swipes still scroll the page)
  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true; lx = e.clientX; ly = e.clientY; stage.classList.add("dragging");
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5;
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
    tYaw = Math.max(-YAW_MAX, Math.min(YAW_MAX, tYaw - dx * 0.008));
    if (e.pointerType !== "touch") tPitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, tPitch + dy * 0.005));
    lastMove = performance.now();
  });
  const end = () => { if (!dragging) return; dragging = false; lastMove = performance.now(); stage.classList.remove("dragging"); };
  stage.addEventListener("pointerup", end); stage.addEventListener("pointercancel", end); stage.addEventListener("lostpointercapture", end);

  let visible = true, running = false;
  const start = () => { if (!running) { running = true; requestAnimationFrame(render); } };
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); }).observe(stage);
  addEventListener("resize", layout);
  layout(); start();
  stage.classList.add("ready");
  if (fallback) fallback.hidden = true;
}

init().catch(() => {});
