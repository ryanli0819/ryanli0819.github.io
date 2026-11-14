/* Opening shot, hand-animated in 2D (canvas, 60fps): #19 faces the viewer, winds up, the stick flexes hard against
   the ice, the puck rockets straight at the screen, and he holds the follow-through.
   Fires window event "shot-impact" when the puck reaches the glass (js/figure3d.js plays the break). */
(function () {
  const cv = document.getElementById("playerCanvas");
  const stage = document.getElementById("stagePin");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fixed = new URLSearchParams(location.search).get("shotT"); // testing: freeze at a time
  const IMPACT = 1.86;

  // colours: navy + gold kit, #19
  const C = { line: "#0b0906", jersey: "#1f2a44", jersey2: "#2b3a5c", gold: "#F2C14E", pants: "#141b2c", sock: "#1f2a44",
    skin: "#E3B08A", helmet: "#151c2e", cage: "#c9d2dc", glove: "#F2C14E", glove2: "#1f2a44", skate: "#111", blade: "#e9eef3",
    shaft: "#F1ECDF", tape: "#f4f4f4", puck: "#0d0d0f" };

  let W = 0, H = 0, S = 1, GX = 0, GY = 0;
  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S = Math.min(H / 640, W / 520); GX = W * 0.5; GY = H * 0.8;
  }
  addEventListener("resize", size); size();

  /* ---------- keyframes (hands/stick relative to the hips, in "S" units; +x = viewer's right, +y = down) ---------- */
  // tx,ty: top hand; phi: shaft direction (0 = straight down, - = toward viewer's left, + = right); flex: bow of the shaft
  // crouch: knee bend; lean: torso tilt (+ = toward viewer's right); look: head turn
  const K = [
    { t: 0.00, tx: -38, ty: -118, phi: 0.32, flex: 0, crouch: 0.35, lean: 0.00 },
    { t: 0.45, tx: -40, ty: -120, phi: 0.30, flex: 0, crouch: 0.45, lean: -0.02 },
    { t: 1.05, tx: -78, ty: -196, phi: -2.35, flex: 0, crouch: 0.4, lean: -0.16 },  // windup, blade high to the left
    { t: 1.30, tx: -44, ty: -112, phi: -0.25, flex: 0.05, crouch: 0.6, lean: -0.05 },
    { t: 1.42, tx: -36, ty: -86, phi: 0.38, flex: 0.62, crouch: 0.72, lean: 0.04 },  // blade hits the ice beside him: big flex
    { t: 1.52, tx: -12, ty: -100, phi: 0.78, flex: 0.22, crouch: 0.66, lean: 0.1 },    // release
    { t: 1.62, tx: 14, ty: -130, phi: 1.3, flex: -0.12, crouch: 0.55, lean: 0.14 },  // recoil whips the other way
    { t: 2.05, tx: 42, ty: -170, phi: 2.3, flex: 0, crouch: 0.45, lean: 0.16 },      // follow-through high to the right
    { t: 3.00, tx: 44, ty: -172, phi: 2.32, flex: 0, crouch: 0.42, lean: 0.15 }
  ];
  const sm = (x) => x * x * (3 - 2 * x);
  function pose(t) {
    let i = 0; while (i < K.length - 2 && t > K[i + 1].t) i++;
    const a = K[i], b = K[i + 1], u = sm(Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)))), o = {};
    for (const k in a) o[k] = a[k] + (b[k] - a[k]) * u; return o;
  }

  /* ---------- drawing helpers ---------- */
  const L = 232; // stick length
  function limb(x1, y1, x2, y2, w, col, bendDir = 1) { // two-segment limb with a soft elbow/knee
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const ex = mx - (dy / len) * 14 * S * bendDir, ey = my + (dx / len) * 14 * S * bendDir;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = C.line; ctx.lineWidth = w + 5 * S; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(ex, ey, x2, y2); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(ex, ey, x2, y2); ctx.stroke();
  }
  function blob(x, y, rx, ry, col, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = col; ctx.strokeStyle = C.line; ctx.lineWidth = 2.5 * S;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  function arena(t, shooting) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#c7d8e6"); g.addColorStop(0.5, "#dfe9f1"); g.addColorStop(0.62, "#eef4f8"); g.addColorStop(1, "#d3e1ec");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const boardY = GY - 250 * S;
    ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.fillRect(0, boardY, W, 46 * S);
    ctx.fillStyle = "#c9953f"; ctx.fillRect(0, boardY + 46 * S, W, 8 * S);
    ctx.strokeStyle = "rgba(31,134,201,.45)"; ctx.lineWidth = 10 * S; ctx.beginPath(); ctx.moveTo(0, GY + 40 * S); ctx.lineTo(W, GY + 70 * S); ctx.stroke(); // blue line
    // speed lines on the ice once he swings
    if (shooting > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, shooting) * 0.55; ctx.strokeStyle = "#ffffff"; ctx.lineCap = "round";
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2, r0 = 120 * S + (i * 37 % 9) * 18 * S, r1 = r0 + (60 + (i * 53 % 7) * 22) * S;
        ctx.lineWidth = (1.5 + (i % 3)) * S; ctx.beginPath();
        ctx.moveTo(GX + Math.cos(a) * r0, GY - 40 * S + Math.sin(a) * r0 * 0.6); ctx.lineTo(GX + Math.cos(a) * r1, GY - 40 * S + Math.sin(a) * r1 * 0.6); ctx.stroke();
      }
      ctx.restore();
    }
    // ice shadow
    ctx.fillStyle = "rgba(20,35,55,.18)"; ctx.beginPath(); ctx.ellipse(GX, GY + 6 * S, 130 * S, 16 * S, 0, 0, Math.PI * 2); ctx.fill();
  }

  function stick(top, phi, flex) {
    // shaft end, clamped to the ice; the more it is pushed into the ice the more it bows
    let ex = top.x + Math.sin(phi) * L * S, ey = top.y + Math.cos(phi) * L * S, extra = 0;
    const ice = GY + 4 * S;
    if (ey > ice) { extra = (ey - ice) / (L * S); ey = ice; }
    const bow = flex + extra * 1.6;
    const mx = (top.x + ex) / 2, my = (top.y + ey) / 2, dx = ex - top.x, dy = ey - top.y, len = Math.hypot(dx, dy) || 1;
    const cx = mx + (dy / len) * bow * L * S * 0.9, cy = my - (dx / len) * bow * L * S * 0.9; // bow sideways
    ctx.lineCap = "round";
    ctx.strokeStyle = C.line; ctx.lineWidth = 14 * S; ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
    ctx.strokeStyle = C.shaft; ctx.lineWidth = 9 * S; ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.lineWidth = 2 * S; ctx.beginPath(); ctx.moveTo(top.x - 2 * S, top.y); ctx.quadraticCurveTo(cx - 2 * S, cy, ex - 2 * S, ey); ctx.stroke();
    // blade: a hooked paddle at the end, roughly along the ice
    const tx = ex - cx, ty = ey - cy, tl = Math.hypot(tx, ty) || 1; // tangent at the end
    const bx = tx / tl, by = ty / tl, side = Math.sin(phi) >= 0 ? 1 : -1;
    const px = -by * side, py = bx * side;
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(Math.atan2(py, px));
    ctx.fillStyle = "#1a1a1e"; ctx.strokeStyle = C.line; ctx.lineWidth = 2.5 * S;
    ctx.beginPath(); ctx.moveTo(-4 * S, -6 * S); ctx.quadraticCurveTo(30 * S, -10 * S, 52 * S, -2 * S); ctx.quadraticCurveTo(56 * S, 6 * S, 46 * S, 9 * S); ctx.lineTo(-4 * S, 7 * S); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.tape; ctx.fillRect(14 * S, -5 * S, 22 * S, 10 * S);
    ctx.restore();
    // tape at the knob
    ctx.fillStyle = C.tape; ctx.beginPath(); ctx.arc(top.x, top.y, 5 * S, 0, Math.PI * 2); ctx.fill();
    return { x: ex, y: ey, bow };
  }

  function player(p, t) {
    const hipY = GY - (150 - p.crouch * 34) * S, hipX = GX + p.lean * 40 * S;
    const shY = hipY - 128 * S, shX = hipX + p.lean * 70 * S;
    // legs: wide stance, knees out
    const footL = { x: GX - 70 * S, y: GY }, footR = { x: GX + 70 * S, y: GY };
    limb(hipX - 26 * S, hipY + 6 * S, footL.x, footL.y - 18 * S, 30 * S, C.sock, -1);
    limb(hipX + 26 * S, hipY + 6 * S, footR.x, footR.y - 18 * S, 30 * S, C.sock, 1);
    // gold sock stripes
    [[footL, -1], [footR, 1]].forEach(([f]) => { ctx.strokeStyle = C.gold; ctx.lineWidth = 7 * S; ctx.beginPath(); ctx.moveTo(f.x - 14 * S, f.y - 50 * S); ctx.lineTo(f.x + 14 * S, f.y - 50 * S); ctx.stroke(); });
    // skates
    [footL, footR].forEach((f, i) => {
      ctx.fillStyle = C.skate; ctx.strokeStyle = C.line; ctx.lineWidth = 2.5 * S;
      roundRect(f.x - (i ? 8 : 22) * S, f.y - 22 * S, 30 * S, 22 * S, 6 * S); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.blade; ctx.fillRect(f.x - (i ? 10 : 24) * S, f.y - 2 * S, 34 * S, 5 * S);
    });
    // pants
    ctx.fillStyle = C.pants; ctx.strokeStyle = C.line; ctx.lineWidth = 3 * S;
    roundRect(hipX - 52 * S, hipY - 18 * S, 104 * S, 58 * S, 14 * S); ctx.fill(); ctx.stroke();
    // torso (jersey), tilted with the lean
    ctx.save(); ctx.translate((hipX + shX) / 2, (hipY + shY) / 2 - 4 * S); ctx.rotate(p.lean * 0.5);
    ctx.fillStyle = C.jersey; ctx.beginPath();
    ctx.moveTo(-62 * S, -62 * S); ctx.quadraticCurveTo(0, -78 * S, 62 * S, -62 * S); ctx.lineTo(56 * S, 64 * S); ctx.quadraticCurveTo(0, 74 * S, -56 * S, 64 * S); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.gold; ctx.fillRect(-56 * S, 40 * S, 112 * S, 10 * S); ctx.fillRect(-56 * S, 54 * S, 112 * S, 5 * S);
    ctx.fillStyle = C.gold; ctx.font = `900 ${58 * S}px "Big Shoulders Display", Impact, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.strokeStyle = C.line; ctx.lineWidth = 4 * S; ctx.strokeText("19", 0, -6 * S); ctx.fillText("19", 0, -6 * S);
    // collar
    ctx.fillStyle = C.gold; ctx.beginPath(); ctx.moveTo(-16 * S, -70 * S); ctx.lineTo(0, -52 * S); ctx.lineTo(16 * S, -70 * S); ctx.closePath(); ctx.fill();
    ctx.restore();
    // head: faces the viewer
    const hx = shX + p.lean * 10 * S, hy = shY - 40 * S;
    blob(hx, hy + 4 * S, 30 * S, 34 * S, C.skin);
    ctx.fillStyle = C.line; ctx.beginPath(); ctx.arc(hx - 10 * S, hy + 2 * S, 3.2 * S, 0, Math.PI * 2); ctx.arc(hx + 10 * S, hy + 2 * S, 3.2 * S, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.line; ctx.lineWidth = 2.5 * S; ctx.beginPath(); ctx.arc(hx, hy + 14 * S, 8 * S, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); // determined grin
    ctx.fillStyle = C.helmet; ctx.beginPath(); ctx.ellipse(hx, hy - 6 * S, 36 * S, 32 * S, 0, Math.PI, 0); ctx.lineTo(hx + 36 * S, hy + 8 * S); ctx.lineTo(hx + 30 * S, hy + 8 * S); ctx.lineTo(hx + 30 * S, hy - 4 * S); ctx.lineTo(hx - 30 * S, hy - 4 * S); ctx.lineTo(hx - 30 * S, hy + 8 * S); ctx.lineTo(hx - 36 * S, hy + 8 * S); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = C.cage; ctx.lineWidth = 2 * S; // cage
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(hx + i * 11 * S, hy - 4 * S); ctx.lineTo(hx + i * 9 * S, hy + 36 * S); ctx.stroke(); }
    for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(hx - 28 * S, hy + (8 + j * 11) * S); ctx.quadraticCurveTo(hx, hy + (14 + j * 11) * S, hx + 28 * S, hy + (8 + j * 11) * S); ctx.stroke(); }
    // stick + arms
    const top = { x: hipX + p.tx * S, y: hipY + p.ty * S };
    const end = stick(top, p.phi, p.flex);
    const low = { x: top.x + (end.x - top.x) * 0.42, y: top.y + (end.y - top.y) * 0.42 };
    limb(shX - 52 * S, shY + 8 * S, top.x, top.y, 22 * S, C.jersey2, 1);
    limb(shX + 52 * S, shY + 8 * S, low.x, low.y, 22 * S, C.jersey2, -1);
    blob(top.x, top.y, 15 * S, 13 * S, C.glove);
    blob(low.x, low.y, 15 * S, 13 * S, C.glove);
    return end;
  }

  function puckAt(x, y, s, alpha = 1, spin = 0) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y);
    ctx.fillStyle = "#26262a"; ctx.beginPath(); ctx.ellipse(0, 4 * s, 18 * s, 7 * s, spin, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.puck; ctx.beginPath(); ctx.ellipse(0, 0, 18 * s, 7 * s, spin, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = Math.max(1, s * 0.8); ctx.beginPath(); ctx.ellipse(0, 0, 14 * s, 5 * s, spin, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  let t0 = null, fired = false, contact = null;
  function frame(now) {
    if (t0 === null) t0 = now;
    const t = fixed !== null ? +fixed : reduce ? 3 : (now - t0) / 1000;
    const p = pose(Math.min(t, 3));
    const shooting = Math.max(0, Math.min(1, (t - 1.3) / 0.15)) * (t < 2.4 ? 1 : Math.max(0, 1 - (t - 2.4)));
    arena(t, shooting);
    // the puck sits just in front of his blade until contact
    const puckHome = { x: GX + 66 * S, y: GY + 4 * S };
    if (t < 1.42) { player(p, t); puckAt(puckHome.x, puckHome.y, S); }
    else {
      const end = player(p, t);
      const k = Math.min(1, (t - 1.42) / (IMPACT - 1.42)), e = k * k * (3 - 2 * k);
      if (k < 1) {
        // straight at the viewer: grows fast, rises to eye level, slight motion blur
        const s = S * (1 + e * e * 16), x = puckHome.x + (W * 0.5 - puckHome.x) * e, y = puckHome.y + (H * 0.46 - puckHome.y) * e;
        for (let g = 3; g >= 1; g--) puckAt(x - (x - puckHome.x) * 0.05 * g, y - (y - puckHome.y) * 0.05 * g, s * (1 - g * 0.06), 0.15, Math.sin(t * 9) * 0.25);
        puckAt(x, y, s, 1, Math.sin(t * 9) * 0.25);
      } else if (!fired) { fired = true; dispatchEvent(new CustomEvent("shot-impact")); }
      // ice spray at contact
      if (t < 1.75) {
        const k2 = (t - 1.42) / 0.33;
        for (let i = 0; i < 16; i++) {
          const a = -Math.PI * (0.15 + 0.7 * (i / 15)), d = 20 * S + k2 * 70 * S * (0.6 + (i % 4) * 0.15);
          ctx.fillStyle = `rgba(255,255,255,${0.9 * (1 - k2)})`; ctx.beginPath();
          ctx.arc(puckHome.x + Math.cos(a) * d, puckHome.y + Math.sin(a) * d * 0.7, (3 - k2 * 2) * S, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    if (!document.hidden) requestAnimationFrame(frame); else running = false;
  }
  let running = true;
  if (document.fonts) document.fonts.load('900 40px "Big Shoulders Display"').catch(() => {});
  requestAnimationFrame(frame);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !running) { running = true; requestAnimationFrame(frame); } });
  addEventListener("replay-shot", () => { t0 = null; fired = false; });
})();
