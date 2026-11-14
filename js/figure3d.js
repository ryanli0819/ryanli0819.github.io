/* First screen: Ryan's own Spline scene "Breakout: a puck smashing through the glass"
   (assets/hero/breakout.splinecode, from his public Spline link), loaded with Spline's runtime.
   Changes applied in code after loading, per Ryan's notes:
   - puck almost flat, front edge tipped toward the bottom, flying well out in front of the glass
   - shards carried toward the screen: golden-angle spiral in a widening cone, bigger the closer they get
   - transparent background so the blurred photo of Ryan (#10) shows through the glass
   - straight-on camera; drag to orbit (zoom/pan off so the page still scrolls); background blurs while dragging
   If Spline can't load, js/puck3d.js (a three.js version of the same idea) takes over. */
const wrap = document.getElementById("stage3d");
const stage = document.getElementById("stagePin");
let canvas = document.getElementById("figure");
const SCENE = "assets/hero/breakout-glass.splinecode";   // Ryan's puck-through-the-glass scene
const SHOT_SCENE = "assets/hero/shot.splinecode";         // Ryan's hockey-player shot scene (plays first)
const RUNTIME = "https://cdn.spline.design/@splinetool/runtime@2.0.183/build/runtime.js"; // the version the scene was published with

function cssScroll() {
  const r = wrap.getBoundingClientRect(), span = Math.max(1, wrap.offsetHeight - innerHeight);
  wrap.style.setProperty("--sp", Math.min(1, Math.max(0, -r.top / span)).toFixed(3));
}
addEventListener("scroll", cssScroll, { passive: true }); cssScroll();

function tweak(app) {
  const portrait = innerWidth / innerHeight < 0.8;
  app.setBackgroundColor("rgba(0,0,0,0)");

  // glass: keep the cracks, make the sheet see-through so the photo behind reads
  const sheet = app.findObjectByName("Pane Shattered Sheet");
  if (sheet && sheet.material) {
    const L = sheet.material.layers || [];
    L.forEach(l => { if (l.type === "transmission") l.visible = false; if (l.type === "color") l.alpha = 0.12; });
    sheet.material.alpha = 0.25;
  }

  // puck: nearly flat, tipped toward the bottom, well out of the glass
  const puck = app.findObjectByName("Hockey Puck");
  if (puck) { puck.rotation.set(-1.134, 0, -0.1); puck.position.set(portrait ? 0 : 60, portrait ? -40 : -90, 520); }

  // shards: carried toward the screen in a widening golden-angle cone
  const group = app.findObjectByName("Glass Shards");
  const edges = app.findObjectByName("Glass Shards Gold Rim Edges");
  if (edges) edges.visible = false; // the combined edge mesh can't follow individual shards
  const shards = app.getAllObjects().filter(o => /^Glass Shard \d+$/.test(o.name)).sort((a, b) => +a.name.split(" ")[2] - +b.name.split(" ")[2]);
  const gp = group ? group.position : { x: 0, y: 0, z: 0 };
  const N = shards.length, GA = Math.PI * (3 - Math.sqrt(5)), spread = portrait ? 0.75 : 1;
  shards.forEach((s, i) => {
    const t = Math.pow((i + 0.5) / N, 0.8);
    const z = -30 + t * 1050;
    const r = (70 + t * 560) * (0.8 + 0.4 * ((i * 37) % 11) / 11) * spread;
    const a = i * GA;
    let x = Math.cos(a) * r * 1.35, y = Math.sin(a) * r * 0.85;
    if (Math.abs(z - 520) < 170 && Math.hypot(x - 60, (y + 90) * 1.4) < 230) { x *= 1.8; y *= 1.8; } // keep the puck clear
    s.position.set(x - gp.x, y - gp.y, z - gp.z);
    const sc = 0.7 + t * t * 1.9; s.scale.set(sc, sc, sc);
    s.rotation.set(Math.cos(a) * 0.6 + (i % 3) * 0.4, Math.sin(a) * 0.6, a);
  });

  // camera: straight on; orbit stays, zoom/pan off so scrolling the page still works
  const oc = app.controls && app.controls.orbitControls, cam = app._camera;
  if (oc) { oc.enableZoom = false; oc.enablePan = false; if (oc.target) oc.target.set(0, 0, 120); }
  if (cam) { cam.position.set(0, 60, portrait ? 2500 : 1500); cam.lookAt(0, 0, 120); }
  if (oc && oc.update) oc.update();
}

/* ---------- the break: hidden until the player's puck hits the glass ---------- */
const easeOut = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
function setupBreak(app) {
  const puck = app.findObjectByName("Hockey Puck");
  const pane = app.findObjectByName("Cracked Glass Pane");
  const shards = app.getAllObjects().filter(o => /^Glass Shard \d+$/.test(o.name));
  const finals = shards.map(s => ({ s, p: { x: s.position.x, y: s.position.y, z: s.position.z }, sc: s.scale.x, r: [s.rotation.x, s.rotation.y, s.rotation.z] }));
  const pf = puck ? { p: [puck.position.x, puck.position.y, puck.position.z], r: [puck.rotation.x, puck.rotation.y, puck.rotation.z] } : null;
  const group = app.findObjectByName("Glass Shards"), gp = group ? group.position : { x: 0, y: 0, z: 0 };
  const hole = { x: -gp.x, y: -gp.y, z: -48 - gp.z }; // the hole, in the shards group's local space

  function hide() {
    if (puck) puck.visible = false;
    if (pane) pane.visible = false;
    finals.forEach(f => { f.s.visible = false; });
    stage.classList.add("pre-impact"); stage.classList.remove("broken");
  }
  let t0 = null;
  function burst(now) {
    if (t0 === null) { t0 = now; if (pane) pane.visible = true; stage.classList.remove("pre-impact"); stage.classList.add("broken"); }
    const t = (now - t0) / 1000;
    if (puck && pf) { // puck punches out of the hole and lands in its pose, with a last bit of spin
      const k = easeOut(t / 0.55); puck.visible = true;
      puck.position.set(pf.p[0] * k, pf.p[1] * k, -60 + (pf.p[2] + 60) * k);
      puck.rotation.set(pf.r[0], pf.r[1] + (1 - k) * 2.4, pf.r[2]);
    }
    finals.forEach((f, i) => {
      const k = easeOut((t - 0.04 - (i / finals.length) * 0.25) / 0.9); if (k <= 0) return;
      f.s.visible = true;
      f.s.position.set(hole.x + (f.p.x - hole.x) * k, hole.y + (f.p.y - hole.y) * k, hole.z + (f.p.z - hole.z) * k);
      const sc = f.sc * (0.2 + 0.8 * k); f.s.scale.set(sc, sc, sc);
      f.s.rotation.set(f.r[0] + (1 - k) * 3, f.r[1] + (1 - k) * 2, f.r[2]);
    });
    if (t < 1.4) requestAnimationFrame(burst); else t0 = null;
  }
  const go = () => requestAnimationFrame(burst);
  return { hide, go };
}

function crackSVG() { // a quick spider crack drawn over the screen at the moment of impact
  const cx = 50, cy = 46; let d = "";
  for (let i = 0; i < 16; i++) {
    let a = (i / 16) * Math.PI * 2 + (Math.random() - .5) * .3, r = 3, x = cx, y = cy; d += `M${cx},${cy}`;
    while (r < 90) { r += 6 + Math.random() * 10; a += (Math.random() - .5) * .25; x = cx + Math.cos(a) * r; y = cy + Math.sin(a) * r * .75; d += ` L${x.toFixed(1)},${y.toFixed(1)}`; }
  }
  for (const rr of [8, 16, 27]) { d += ` M${cx + rr},${cy}`; for (let k = 1; k <= 24; k++) { const a = (k / 24) * Math.PI * 2, j = rr * (0.9 + Math.random() * .2); d += ` L${(cx + Math.cos(a) * j).toFixed(1)},${(cy + Math.sin(a) * j * .75).toFixed(1)}`; } }
  return `<svg viewBox="0 0 100 92" preserveAspectRatio="xMidYMid slice"><path d="${d}" fill="none" stroke="#fff6dc" stroke-width=".35" stroke-linejoin="round"/></svg>`;
}

async function playSequence(Application, shotApp) {
  const calm = (a) => { const oc = a.controls && a.controls.orbitControls; if (oc) { oc.enableZoom = false; oc.enablePan = false; } a.setBackgroundColor("rgba(0,0,0,0)"); };
  // second canvas for the glass scene, loaded underneath while the shot plays
  const glassCanvas = canvas.cloneNode(false); glassCanvas.id = "figureGlass"; glassCanvas.classList.add("glass-scene");
  canvas.after(glassCanvas);
  const crack = document.createElement("div"); crack.className = "s3-crack"; crack.setAttribute("aria-hidden", "true"); stage.appendChild(crack);
  const glassApp = new Application(glassCanvas);
  const glassReady = glassApp.load(SCENE).then(() => calm(glassApp)).catch(() => {});
  await shotApp.load(SHOT_SCENE); calm(shotApp);
  window.ryanSpline = shotApp; window.ryanSplineGlass = glassApp;
  stage.classList.remove("pre-impact"); stage.classList.add("ready", "as-designed", "shooting");
  const start = performance.now(), puck = shotApp.findObjectByName("Shot Puck");
  let done = false;
  const breakThrough = async () => {
    if (done) return; done = true;
    crack.innerHTML = crackSVG(); stage.classList.add("flash", "cracked");
    await glassReady;
    setTimeout(() => {
      stage.classList.remove("shooting"); stage.classList.add("broken", "glass-on");
      setTimeout(() => { stage.classList.remove("flash", "cracked"); try { shotApp.stop(); } catch {} }, 700);
    }, 260);
  };
  // his script: release at 1.35s, the puck reaches the camera just before 2.0s (first loop)
  (function watch() {
    if (done) return;
    const t = (performance.now() - start) / 1000, z = puck && puck.position ? puck.position.z : 0;
    if (z > 150 || t > 1.95) breakThrough(); else requestAnimationFrame(watch);
  })();
}

async function initSpline() {
  const { Application } = await import(RUNTIME);
  const app = new Application(canvas);
  if (window.HERO_AS_DESIGNED) return playSequence(Application, app);
  await app.load(SCENE);
  window.ryanSpline = app;
  if (window.HERO_AS_DESIGNED) {
    // 1) Ryan's shot scene plays; 2) when its puck reaches the screen the screen cracks;
    // 3) his puck-through-the-glass scene takes over. Both exactly as he designed them, with transparent backgrounds
    //    so the blurred photo behind shows through; only zoom/pan are off so the page still scrolls.
    const calm = (a) => { const oc = a.controls && a.controls.orbitControls; if (oc) { oc.enableZoom = false; oc.enablePan = false; } a.setBackgroundColor("rgba(0,0,0,0)"); };
    calm(app);
    stage.classList.remove("pre-impact"); stage.classList.add("ready", "as-designed", "shooting");
    // the shot scene was loaded above into `canvas` as SCENE; swap: load the shot into it instead, glass into a second canvas
    return;
  }
  tweak(app);
  const brk = setupBreak(app);
  if (window.__shotImpacted) brk.go(); else { brk.hide(); addEventListener("shot-impact", () => brk.go(), { once: true }); }
  addEventListener("replay-shot", () => { brk.hide(); addEventListener("shot-impact", () => brk.go(), { once: true }); });
  stage.classList.add("ready");
  // background blurs while dragging
  canvas.addEventListener("pointerdown", () => stage.classList.add("dragging"));
  addEventListener("pointerup", () => stage.classList.remove("dragging"));
  addEventListener("pointercancel", () => stage.classList.remove("dragging"));
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (stage.classList.contains("broken")) tweak(app); }, 200); });
}

addEventListener("shot-impact", () => { window.__shotImpacted = true; stage.classList.add("flash"); setTimeout(() => stage.classList.remove("flash"), 450); });
initSpline().catch(async (e) => {
  console.warn("Spline scene failed, using the three.js backup", e);
  const fresh = canvas.cloneNode(false); canvas.replaceWith(fresh); canvas = fresh;
  await import("./puck3d.js");
});
