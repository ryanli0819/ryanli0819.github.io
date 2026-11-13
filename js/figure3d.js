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
const SCENE = "assets/hero/breakout.splinecode";
const RUNTIME = "https://cdn.spline.design/@splinetool/runtime@2.0.179/build/runtime.js"; // the version the scene was published with

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

async function initSpline() {
  const { Application } = await import(RUNTIME);
  const app = new Application(canvas);
  await app.load(SCENE);
  tweak(app);
  window.ryanSpline = app;
  stage.classList.add("ready");
  // background blurs while dragging
  canvas.addEventListener("pointerdown", () => stage.classList.add("dragging"));
  addEventListener("pointerup", () => stage.classList.remove("dragging"));
  addEventListener("pointercancel", () => stage.classList.remove("dragging"));
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => tweak(app), 200); });
}

initSpline().catch(async (e) => {
  console.warn("Spline scene failed, using the three.js backup", e);
  const fresh = canvas.cloneNode(false); canvas.replaceWith(fresh); canvas = fresh;
  await import("./puck3d.js");
});
