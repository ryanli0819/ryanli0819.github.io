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

/* ---------- arena: ice, boards, lights ---------- */
const ice = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshStandardMaterial({ color: 0xdfe8f2, roughness: 0.18, metalness: 0.1 }));
ice.rotation.x = -Math.PI / 2; scene.add(ice);
const boards = new THREE.Mesh(new THREE.BoxGeometry(40, 1.1, 0.2), new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.6 }));
boards.position.set(0, 0.55, -6); scene.add(boards);
const kick = new THREE.Mesh(new THREE.BoxGeometry(40, 0.22, 0.22), new THREE.MeshStandardMaterial({ color: 0xc9953f, roughness: 0.5 }));
kick.position.set(0, 0.11, -5.98); scene.add(kick);
const back = new THREE.Mesh(new THREE.PlaneGeometry(60, 20), new THREE.MeshBasicMaterial({ color: 0x0a0c12 }));
back.position.set(0, 8, -9); scene.add(back);
for (let i = -3; i <= 3; i++) { // arena light rigs
  const l = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff2d0 }));
  l.position.set(i * 3.2, 6.5, -7.5); scene.add(l);
}
scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x20242c, 1.1));
const key = new THREE.DirectionalLight(0xfff0d8, 2.2); key.position.set(-3, 6, 6); scene.add(key);
const rim = new THREE.DirectionalLight(0xffc070, 2.4); rim.position.set(3, 4, -6); scene.add(rim);

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
const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), GLOSS); helmet.position.y = 0.02; head.add(helmet);
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
const K = [
  { t: 0.00, yaw: -1.05, hx: 0.05, hy: 0.98, hz: 0.42, rx: -0.3, sw: 0.15, bend: 0, tw: 0, cr: 0.12 },
  { t: 0.55, yaw: -1.1, hx: -0.18, hy: 1.32, hz: 0.32, rx: -0.2, sw: -2.3, bend: 0, tw: -0.6, cr: 0.16 },
  { t: 0.80, yaw: -1.05, hx: 0.02, hy: 0.96, hz: 0.46, rx: -0.3, sw: -0.12, bend: 0.26, tw: 0.1, cr: 0.26 },
  { t: 0.92, yaw: -1.0, hx: 0.16, hy: 0.98, hz: 0.46, rx: -0.3, sw: 0.4, bend: 0.03, tw: 0.25, cr: 0.24 },
  { t: 1.25, yaw: -0.9, hx: 0.25, hy: 1.32, hz: 0.42, rx: -0.3, sw: 1.5, bend: 0, tw: 0.5, cr: 0.12 },
  { t: 1.95, yaw: -0.25, hx: 0.2, hy: 1.3, hz: 0.5, rx: -1.72, sw: 0.18, bend: 0, tw: 0.08, cr: 0.06 },
  { t: 2.60, yaw: 0.12, hx: 0.22, hy: 1.32, hz: 0.52, rx: -1.72, sw: 0.22, bend: 0, tw: 0, cr: 0.05 }
];
const smooth = (x) => x * x * (3 - 2 * x);
function pose(t) {
  let i = 0; while (i < K.length - 2 && t > K[i + 1].t) i++;
  const a = K[i], b = K[i + 1], u = smooth(Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t))));
  const o = {}; for (const k in a) o[k] = a[k] + (b[k] - a[k]) * u; return o;
}

const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
camera.position.set(0, 1.0, 6.2); camera.lookAt(0, 1.05, 0);
function layout() {
  const w = holder.clientWidth, h = holder.clientHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.position.z = w / h < 0.8 ? 9.5 : 6.2;
  camera.updateProjectionMatrix();
}
addEventListener("resize", layout); layout();

let t0 = null, fired = false, puckStart = null;
const tmp = new THREE.Vector3(), tmpB = new THREE.Vector3();
function frame(now) {
  if (t0 === null) t0 = now;
  const fixed = new URLSearchParams(location.search).get("shotT"); // testing: freeze the shot at a time
  let t = fixed !== null ? +fixed : reduce ? 3 : (now - t0) / 1000;
  const idle = t > 2.6 ? Math.sin((t - 2.6) * 1.6) * 0.012 : 0;
  const p = pose(Math.min(t, 2.6));

  root.rotation.y = p.yaw; root.position.set(0.15, 0, 0);
  hips.position.y = 0.98 - p.cr * 0.5 + idle;
  spine.rotation.set(p.cr * 0.9, p.tw, 0);
  head.rotation.set(-p.cr * 0.6, -p.tw * 0.7 - p.yaw * 0.25, 0);
  legL.thigh.rotation.set(-p.cr * 1.4, 0, 0.12); legL.knee.rotation.x = p.cr * 2.2;
  legR.thigh.rotation.set(-p.cr * 0.9 + 0.1, 0, -0.12); legR.knee.rotation.x = p.cr * 1.6;

  hands.position.set(p.hx, p.hy + idle, p.hz);
  hands.rotation.set(0, 0, 0); hands.rotateX(p.rx); hands.rotateZ(p.sw);
  buildShaft(p.bend);

  // arms: shoulders → elbows → hands (top hand at the knob, bottom hand down the shaft)
  scene.updateMatrixWorld(true);
  const top = hands.localToWorld(new THREE.Vector3(0, -0.03, 0)), low = hands.localToWorld(new THREE.Vector3(-p.bend * 0.6, -0.42, 0));
  const sL = spine.localToWorld(shoulderL.clone()), sR = spine.localToWorld(shoulderR.clone());
  [[sL, top, 0, 0], [sR, low, 2, 1]].forEach(([s, h, mi, gi]) => {
    const elbow = tmp.copy(s).lerp(h, 0.5); elbow.y -= 0.12;
    const e = elbow.clone();
    segment(armMeshes[mi], s, e, 0.065); segment(armMeshes[mi + 1], e, h, 0.055);
    gloves[gi].position.copy(h); gloves[gi].quaternion.copy(armMeshes[mi + 1].quaternion);
  });

  // puck: on the blade until release, then straight at the screen
  const bladeW = hands.localToWorld(tmpB.set(0.18, -STICK_L, 0.03));
  if (t < 0.92) { puck.position.set(bladeW.x + 0.05, 0.02, bladeW.z); puck.visible = true; }
  else {
    if (!puckStart) puckStart = puck.position.clone();
    const k = Math.min(1, (t - 0.92) / (IMPACT_T - 0.92)), e = k * k;
    puck.position.lerpVectors(puckStart, new THREE.Vector3(0.05, 0.95, camera.position.z - 2.2), e);
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
