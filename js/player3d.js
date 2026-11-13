/* Intro shot, behind the glass: a blurred 3D hockey player (Lexington black/orange, #10) winds up, the stick flexes
   on the ice, the puck flies at the screen, and he finishes by pointing his stick at the viewer.
   Built from simple shapes and blurred with CSS, so it reads as a silhouette in the background.
   Fires window event "shot-impact" when the puck reaches the glass; js/figure3d.js plays the break on that. */
import * as THREE from "three";

const holder = document.getElementById("playerCanvas");
const stage = document.getElementById("stagePin");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const IMPACT_T = 1.3; // seconds into the shot

let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: holder, antialias: true, alpha: true }); }
catch { setTimeout(() => dispatchEvent(new CustomEvent("shot-impact")), 600); throw new Error("no webgl"); }
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0a0c12, 10, 26);

/* ---------- arena: icy haze with speed lines on the ice (pose/mood reference: front-on slap shot photo) ---------- */
const HAZE = 0xd3e2ec;
scene.fog = new THREE.Fog(HAZE, 7, 20);
function speedIce() {
  const c = document.createElement("canvas"); c.width = c.height = 1024; const g = c.getContext("2d");
  const base = g.createRadialGradient(512, 380, 40, 512, 512, 760);
  base.addColorStop(0, "#c9dce8"); base.addColorStop(0.45, "#6f97b3"); base.addColorStop(1, "#2b4f69");
  g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 1400; i++) { // streaks radiating from the player, like motion blur on the ice
    const a = Math.random() * Math.PI * 2, r0 = 60 + Math.random() * 460, len = 20 + Math.random() * 120 * (r0 / 400);
    const x = 512 + Math.cos(a) * r0, y = 380 + Math.sin(a) * r0 * 0.9;
    g.strokeStyle = `rgba(235,245,252,${0.15 + Math.random() * 0.45})`; g.lineWidth = 2 + Math.random() * 5 * (r0 / 500);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len * 0.9); g.stroke();
  }
  g.strokeStyle = "rgba(240,248,255,.5)"; g.lineWidth = 3; g.beginPath(); g.ellipse(512, 470, 330, 120, 0, 0, Math.PI * 2); g.stroke(); // faint faceoff circle
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const ice = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), new THREE.MeshStandardMaterial({ map: speedIce(), roughness: 0.25, metalness: 0.05 }));
ice.rotation.x = -Math.PI / 2; ice.position.z = 2; scene.add(ice);
const back = new THREE.Mesh(new THREE.PlaneGeometry(60, 24), new THREE.MeshBasicMaterial({ color: HAZE }));
back.position.set(0, 9, -8); scene.add(back);
scene.add(new THREE.HemisphereLight(0xf2f8ff, 0x6b8aa3, 1.6));
const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(-2.5, 5, 6); scene.add(key);
const rim = new THREE.DirectionalLight(0xdfeeff, 1.6); rim.position.set(3, 4, -6); scene.add(rim);

/* ---------- the player ---------- */
const BLACK = new THREE.MeshStandardMaterial({ color: 0x15151a, roughness: 0.6 });
const ORANGE = new THREE.MeshStandardMaterial({ color: 0xe0782a, roughness: 0.55 });
const WHITE = new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.6 });
const SKIN = new THREE.MeshStandardMaterial({ color: 0xd9a77f, roughness: 0.7 });
const GLOSS = new THREE.MeshStandardMaterial({ color: 0x101014, roughness: 0.25, metalness: 0.3 });
const capsule = (r, l, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 12), m);

const root = new THREE.Group(); scene.add(root);
const hips = new THREE.Group(); root.add(hips);
const pelvis = capsule(0.17, 0.12, BLACK); pelvis.rotation.z = Math.PI / 2; hips.add(pelvis);
const spine = new THREE.Group(); spine.position.y = 0.08; hips.add(spine);
const torso = capsule(0.22, 0.38, BLACK); torso.position.y = 0.32; torso.scale.set(1.15, 1, 0.8); spine.add(torso);
const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.08, 20), ORANGE); stripe.position.y = 0.14; stripe.scale.set(1.15, 1, 0.8); spine.add(stripe);
const yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.1, 20), ORANGE); yoke.position.y = 0.56; yoke.scale.set(1.15, 1, 0.8); spine.add(yoke);
const head = new THREE.Group(); head.position.y = 0.78; spine.add(head);
head.add(new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 12), SKIN));
const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 12, Math.PI * 0.25, Math.PI * 1.5, 0, Math.PI * 0.6), GLOSS); helmet.position.y = 0.02; head.add(helmet);
const brim = new THREE.Mesh(new THREE.SphereGeometry(0.127, 16, 6, -Math.PI * 0.25, Math.PI * 0.5, 0, Math.PI * 0.3), GLOSS); brim.position.y = 0.02; head.add(brim);
const cage = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.008, 6, 20, Math.PI), new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 0.8, roughness: 0.3 }));
cage.rotation.set(0, 0, Math.PI); cage.position.set(0, -0.01, 0.06); head.add(cage);
const shoulderL = new THREE.Vector3(0.27, 0.58, 0), shoulderR = new THREE.Vector3(-0.27, 0.58, 0);
// legs
function leg(x) {
  const thigh = new THREE.Group(); thigh.position.set(x, -0.05, 0); hips.add(thigh);
  const t = capsule(0.1, 0.32, BLACK); t.position.y = -0.22; thigh.add(t);
  const knee = new THREE.Group(); knee.position.y = -0.44; thigh.add(knee);
  const s = capsule(0.075, 0.32, ORANGE); s.position.y = -0.2; knee.add(s);
  const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12), BLACK); sock.position.y = -0.16; knee.add(sock);
  const skate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.3), BLACK); skate.position.set(0, -0.42, 0.05); knee.add(skate);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.03, 0.32), WHITE); blade.position.set(0, -0.485, 0.05); knee.add(blade);
  return { thigh, knee };
}
const legL = leg(0.12), legR = leg(-0.12);
// arms: segments stretched between points each frame
const armMeshes = [0, 1, 2, 3].map(i => { const m = capsule(i % 2 ? 0.055 : 0.065, 1, i % 2 ? BLACK : BLACK); scene.add(m); return m; });
const gloves = [0, 1].map(() => { const g = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.14), BLACK); scene.add(g); return g; });
const up = new THREE.Vector3(0, 1, 0);
function segment(mesh, a, b, r) {
  const d = new THREE.Vector3().subVectors(b, a), len = d.length();
  mesh.position.copy(a).addScaledVector(d, 0.5);
  mesh.quaternion.setFromUnitVectors(up, d.normalize());
  mesh.scale.set(1, Math.max(0.05, len / (1 + 2 * r)), 1);
}
// stick: shaft rebuilt each frame so it can flex
const hands = new THREE.Group(); root.add(hands);
const STICK_L = 1.45;
const shaftMat = new THREE.MeshStandardMaterial({ color: 0x1c1c22, roughness: 0.35, metalness: 0.2 });
let shaft = new THREE.Mesh(new THREE.BufferGeometry(), shaftMat); hands.add(shaft);
const bladeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.02), new THREE.MeshStandardMaterial({ color: 0xe6e6e6, roughness: 0.5 }));
hands.add(bladeMesh);
const tape = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8), WHITE); tape.position.y = -0.04; hands.add(tape);
function buildShaft(bend) {
  const pts = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector3(-bend * Math.sin(Math.PI * t), -t * STICK_L, 0)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  shaft.geometry.dispose(); shaft.geometry = new THREE.TubeGeometry(curve, 24, 0.016, 6, false);
  bladeMesh.position.set(0.13, -STICK_L - 0.01, 0.02);
  return curve;
}
// puck
const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.025, 20), GLOSS); scene.add(puck);

/* ---------- the shot, as keyframes ---------- */
// yaw: body turn (side-on −π/2 → facing the viewer 0); h*: hands position (player space); rx: stick tilt; sw: swing; bend: flex
const K = [ // pose reference: front-on slap shot, stick swept up to the viewer's right on the follow-through
  { t: 0.00, yaw: -0.45, hx: -0.12, hy: 0.98, hz: 0.38, rx: -0.22, sw: 0.25, bend: 0, tw: -0.1, cr: 0.18, sp: 0.22 },
  { t: 0.50, yaw: -0.55, hx: -0.28, hy: 1.34, hz: 0.26, rx: -0.12, sw: -2.25, bend: 0, tw: -0.55, cr: 0.2, sp: 0.26 },
  { t: 0.80, yaw: -0.3, hx: -0.06, hy: 0.92, hz: 0.42, rx: -0.25, sw: -0.12, bend: 0.26, tw: -0.05, cr: 0.32, sp: 0.3 },
  { t: 0.92, yaw: -0.15, hx: 0.04, hy: 0.95, hz: 0.45, rx: -0.22, sw: 0.45, bend: 0.03, tw: 0.15, cr: 0.32, sp: 0.32 },
  { t: 1.30, yaw: 0.12, hx: 0.1, hy: 1.24, hz: 0.48, rx: -0.12, sw: 2.05, bend: 0, tw: 0.32, cr: 0.27, sp: 0.34 },
  { t: 2.60, yaw: 0.15, hx: 0.1, hy: 1.25, hz: 0.48, rx: -0.12, sw: 2.08, bend: 0, tw: 0.3, cr: 0.26, sp: 0.34 }
];
const smooth = (x) => x * x * (3 - 2 * x);
function pose(t) {
  let i = 0; while (i < K.length - 2 && t > K[i + 1].t) i++;
  const a = K[i], b = K[i + 1], u = smooth(Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t))));
  const o = {}; for (const k in a) o[k] = a[k] + (b[k] - a[k]) * u; return o;
}

const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
camera.position.set(0, 1.7, 6.2); camera.lookAt(0, 0.85, 0);
function layout() {
  const w = holder.clientWidth, h = holder.clientHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.position.z = w / h < 0.8 ? 9.5 : 6.2;
  camera.updateProjectionMatrix();
}
addEventListener("resize", layout); layout();

/* ---------- Ryan's own photos (cut out with macOS Vision): "ready" then "shot" ---------- */
const loader = new THREE.TextureLoader();
function card(src, h, aspect, cx) { // cx: where his body is across the image (0..1), so the card can be centred on him
  const t = loader.load(src); t.colorSpace = THREE.SRGBColorSpace;
  const w = h * aspect, m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.25, depthWrite: false, fog: true }));
  m.userData = { w, h, cx }; m.position.set((0.5 - cx) * w, h / 2 - 0.06, 0); scene.add(m); return m;
}
const ready = card("assets/hero/ryan-ready.webp", 1.9, 442 / 878, 0.5);
const shot = card("assets/hero/ryan-shot.webp", 2.0, 1200 / 900, 0.3);
const SHOT_TIP = { x: 0.985, y: 0.965 }; // blade tip in the shot photo
[root, ...armMeshes, ...gloves].forEach(o => o.visible = false); // the shape-built player is replaced by the photos
// soft contact shadows so the cut-outs sit on the ice
const shadowTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(10,20,30,.55)"); r.addColorStop(1, "rgba(10,20,30,0)");
  g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const blob = (w, d) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.005; scene.add(m); return m; };
const readyShadow = blob(1.1, 0.5), shotShadow = blob(1.6, 0.6);
ready.position.y -= 0.12; // feet on the ice


let t0 = null, fired = false, puckStart = null;
const tmp = new THREE.Vector3(), tmpB = new THREE.Vector3();
function frame(now) {
  if (t0 === null) t0 = now;
  const fixed = new URLSearchParams(location.search).get("shotT"); // testing: freeze the shot at a time
  let t = fixed !== null ? +fixed : reduce ? 3 : (now - t0) / 1000;
  const idle = t > 1.3 ? Math.sin((t - 1.3) * 1.6) * 0.012 : 0;
  const p = pose(Math.min(t, 2.6));

  // photo sequence: hold "ready", sink into the load, snap into "shot" with a lunge, then hold the follow-through
  const load = Math.min(1, Math.max(0, (t - 0.25) / 0.5)), snap = Math.min(1, Math.max(0, (t - 0.72) / 0.12));
  ready.material.opacity = 1 - snap; ready.visible = snap < 1;
  ready.scale.set(1 + load * 0.02, 1 - load * 0.05, 1); ready.rotation.z = load * 0.06;
  ready.position.y = ready.userData.h / 2 - 0.2 - load * 0.04 + idle;
  readyShadow.position.set(ready.position.x + 0.05, 0.005, ready.position.z + 0.05); readyShadow.material.opacity = 1 - snap;
  shot.material.opacity = snap; shot.visible = snap > 0;
  const lunge = Math.min(1, Math.max(0, (t - 0.72) / 0.35));
  shot.position.set((0.5 - shot.userData.cx) * shot.userData.w - 0.1 + lunge * 0.1, shot.userData.h / 2 - 0.16 + idle, -0.2 + lunge * 0.3);
  shot.scale.setScalar(0.96 + lunge * 0.04);
  shotShadow.position.set(shot.position.x - shot.userData.w * 0.12, 0.005, shot.position.z + 0.05); shotShadow.material.opacity = snap;

  // puck: on the blade until release, then straight at the screen
  const sw = shot.userData.w * shot.scale.x, sh = shot.userData.h * shot.scale.y;
  const bladeW = tmpB.set(shot.position.x + (SHOT_TIP.x - 0.5) * sw, shot.position.y + (0.5 - SHOT_TIP.y) * sh + 0.03, shot.position.z + 0.05);
  if (t < 0.84) { puck.position.set(0.35, 0.02, 0.25); puck.visible = t > 0.05; }
  else {
    if (!puckStart) puckStart = bladeW.clone();
    const k = Math.min(1, (t - 0.84) / (IMPACT_T - 0.84)), e = k * k;
    puck.position.lerpVectors(puckStart, new THREE.Vector3(-0.38, 1.3, camera.position.z - 2.2), e);
    puck.rotation.set(Math.PI / 2 * e, t * 18, 0);
    puck.visible = k < 1;
    if (k >= 1 && !fired) { fired = true; dispatchEvent(new CustomEvent("shot-impact")); }
  }

  renderer.render(scene, camera);
  if (stage.dataset.visible !== "0") requestAnimationFrame(frame); else { pending = true; }
}
let pending = false;
new IntersectionObserver(es => { stage.dataset.visible = es[0].isIntersecting ? "1" : "0"; if (es[0].isIntersecting && pending) { pending = false; requestAnimationFrame(frame); } }).observe(stage);
requestAnimationFrame(frame);

// replay the shot
addEventListener("replay-shot", () => { t0 = null; fired = false; puckStart = null; });
