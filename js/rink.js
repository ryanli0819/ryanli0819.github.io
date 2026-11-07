/* Mini hockey rink: drag & flick (or tap to shoot) the puck.
   Score in the left net -> fun side, right net -> projects.
   Fires window event "rink-goal" with detail.side = "left" | "right". */
(function () {
  const canvas = document.getElementById("rink");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  const puck = { x: 0, y: 0, vx: 0, vy: 0, r: 9 };
  let dragging = false, history = [], scored = false, colors = {};

  const geo = () => {
    const goalL = W * 0.09, goalR = W * 0.91;
    return {
      goalL, goalR,
      netHalf: H * 0.11,
      netDepth: W * 0.035,
      cornerR: Math.min(H * 0.46, W * 0.2),
      blueL: W * 0.36, blueR: W * 0.64
    };
  };

  function readColors() {
    const s = getComputedStyle(document.documentElement);
    const v = (n) => s.getPropertyValue(n).trim();
    colors = { ice: v("--rink-ice"), red: v("--red"), blue: v("--gold"), ink: v("--ink"), ink3: v("--ink-3"), line: v("--line") };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const oldW = W, oldH = H;
    W = rect.width; H = rect.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    puck.r = Math.max(7, Math.min(11, W / 55));
    if (!oldW) { puck.x = W / 2; puck.y = H / 2; }
    else { puck.x *= W / oldW; puck.y *= H / oldH; }
    readColors();
  }

  function draw() {
    const g = geo();
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 3;
    // center red line
    ctx.strokeStyle = colors.red; ctx.globalAlpha = .55;
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    // blue lines
    ctx.strokeStyle = colors.blue; ctx.lineWidth = 5; ctx.globalAlpha = .45;
    [g.blueL, g.blueR].forEach(x => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); });
    // goal lines
    ctx.strokeStyle = colors.red; ctx.lineWidth = 2; ctx.globalAlpha = .5;
    [g.goalL, g.goalR].forEach(x => { ctx.beginPath(); ctx.moveTo(x, H * 0.08); ctx.lineTo(x, H * 0.92); ctx.stroke(); });
    // center circle + dot
    ctx.strokeStyle = colors.blue; ctx.lineWidth = 2; ctx.globalAlpha = .45;
    ctx.beginPath(); ctx.arc(W / 2, H / 2, H * 0.17, 0, Math.PI * 2); ctx.stroke();
    // faceoff circles
    ctx.strokeStyle = colors.red; ctx.globalAlpha = .35;
    [[W * 0.2, H * 0.28], [W * 0.2, H * 0.72], [W * 0.8, H * 0.28], [W * 0.8, H * 0.72]].forEach(([x, y]) => {
      ctx.beginPath(); ctx.arc(x, y, H * 0.13, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = colors.red; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    });
    // creases
    ctx.globalAlpha = .18; ctx.fillStyle = colors.blue;
    ctx.beginPath(); ctx.arc(g.goalL, H / 2, g.netHalf * 1.25, -Math.PI / 2, Math.PI / 2); ctx.fill();
    ctx.beginPath(); ctx.arc(g.goalR, H / 2, g.netHalf * 1.25, Math.PI / 2, Math.PI * 1.5); ctx.fill();
    // nets
    ctx.globalAlpha = 1; ctx.strokeStyle = colors.red; ctx.lineWidth = 3;
    ctx.strokeRect(g.goalL - g.netDepth, H / 2 - g.netHalf, g.netDepth, g.netHalf * 2);
    ctx.strokeRect(g.goalR, H / 2 - g.netHalf, g.netDepth, g.netHalf * 2);
    // net mesh
    ctx.lineWidth = 1; ctx.globalAlpha = .35;
    for (let i = 1; i < 5; i++) {
      const yy = H / 2 - g.netHalf + (i * g.netHalf * 2) / 5;
      ctx.beginPath(); ctx.moveTo(g.goalL - g.netDepth, yy); ctx.lineTo(g.goalL, yy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(g.goalR, yy); ctx.lineTo(g.goalR + g.netDepth, yy); ctx.stroke();
    }
    // labels
    ctx.globalAlpha = .55; ctx.fillStyle = colors.ink3;
    ctx.font = `600 ${Math.max(10, W / 48)}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillText("FUN", g.goalL + W * 0.07, H / 2 + 4);
    ctx.fillText("WORK", g.goalR - W * 0.075, H / 2 + 4);
    ctx.globalAlpha = 1;
    // puck shadow + puck
    ctx.fillStyle = "rgba(0,0,0,.15)";
    ctx.beginPath(); ctx.ellipse(puck.x + 2, puck.y + 3, puck.r, puck.r * .8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = colors.ink;
    ctx.beginPath(); ctx.arc(puck.x, puck.y, puck.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(puck.x, puck.y, puck.r * .6, 0, Math.PI * 2); ctx.stroke();
  }

  function step() {
    if (!dragging && !scored) {
      puck.x += puck.vx; puck.y += puck.vy;
      puck.vx *= 0.985; puck.vy *= 0.985;
      if (Math.hypot(puck.vx, puck.vy) < 0.05) { puck.vx = puck.vy = 0; }
      collide();
      checkGoal();
    }
    draw();
    requestAnimationFrame(step);
  }

  function collide() {
    const r = puck.r, g = geo(), R = g.cornerR, e = 0.82;
    // straight walls
    if (puck.y < r) { puck.y = r; puck.vy = Math.abs(puck.vy) * e; }
    if (puck.y > H - r) { puck.y = H - r; puck.vy = -Math.abs(puck.vy) * e; }
    if (puck.x < r) { puck.x = r; puck.vx = Math.abs(puck.vx) * e; }
    if (puck.x > W - r) { puck.x = W - r; puck.vx = -Math.abs(puck.vx) * e; }
    // rounded corners
    const corners = [[R, R], [W - R, R], [R, H - R], [W - R, H - R]];
    for (const [cx, cy] of corners) {
      const inX = (cx === R ? puck.x < cx : puck.x > cx);
      const inY = (cy === R ? puck.y < cy : puck.y > cy);
      if (!inX || !inY) continue;
      const dx = puck.x - cx, dy = puck.y - cy, d = Math.hypot(dx, dy), max = R - r;
      if (d > max) {
        const nx = dx / d, ny = dy / d;
        puck.x = cx + nx * max; puck.y = cy + ny * max;
        const dot = puck.vx * nx + puck.vy * ny;
        if (dot > 0) { puck.vx -= 2 * dot * nx * e; puck.vy -= 2 * dot * ny * e; puck.vx *= e; puck.vy *= e; }
      }
    }
    // back + side of nets (solid from behind)
    [[g.goalL - g.netDepth, g.goalL], [g.goalR, g.goalR + g.netDepth]].forEach(([x0, x1], i) => {
      const y0 = H / 2 - g.netHalf, y1 = H / 2 + g.netHalf;
      const inside = puck.x > x0 - r && puck.x < x1 + r && puck.y > y0 - r && puck.y < y1 + r;
      if (!inside) return;
      const fromFront = i === 0 ? puck.vx < 0 && puck.x > g.goalL - 2 : puck.vx > 0 && puck.x < g.goalR + 2;
      if (fromFront && puck.y > y0 && puck.y < y1) return; // goal path
      // bounce off the frame
      const overlapX = Math.min(Math.abs(puck.x - (x0 - r)), Math.abs(x1 + r - puck.x));
      const overlapY = Math.min(Math.abs(puck.y - (y0 - r)), Math.abs(y1 + r - puck.y));
      if (overlapX < overlapY) { puck.vx *= -e; puck.x += puck.x < (x0 + x1) / 2 ? -overlapX : overlapX; }
      else { puck.vy *= -e; puck.y += puck.y < H / 2 ? -overlapY : overlapY; }
    });
  }

  function checkGoal() {
    const g = geo();
    const inY = Math.abs(puck.y - H / 2) < g.netHalf - puck.r * .3;
    // collide() already keeps pucks out of the net from behind/sides, so any
    // puck past the goal line inside the posts went in through the front.
    if (inY && puck.x < g.goalL - puck.r * .5) goal("left");
    else if (inY && puck.x > g.goalR + puck.r * .5) goal("right");
  }

  function goal(side) {
    scored = true; puck.vx = puck.vy = 0;
    window.dispatchEvent(new CustomEvent("rink-goal", { detail: { side } }));
    setTimeout(() => { puck.x = W / 2; puck.y = H / 2; scored = false; }, 1200);
  }

  function shoot(tx, ty, power) {
    const dx = tx - puck.x, dy = ty - puck.y, d = Math.hypot(dx, dy) || 1;
    const sp = power ?? Math.min(22, 6 + d / 18);
    puck.vx = (dx / d) * sp; puck.vy = (dy / d) * sp;
  }

  // ---- pointer input ----
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; };
  canvas.addEventListener("pointerdown", (e) => {
    if (scored) return;
    const p = pos(e);
    if (Math.hypot(p.x - puck.x, p.y - puck.y) < puck.r * 3.5) {
      dragging = true; history = [p]; puck.vx = puck.vy = 0;
      canvas.setPointerCapture(e.pointerId);
    } else {
      shoot(p.x, p.y);
    }
  });
  const setStick = (x) => { const left = x < W / 2; canvas.classList.toggle("stick-left", left); canvas.classList.toggle("stick-right", !left); };
  canvas.addEventListener("pointerleave", () => canvas.classList.remove("stick-left", "stick-right"));
  canvas.addEventListener("pointermove", (e) => {
    setStick(pos(e).x);
    if (!dragging) return;
    const p = pos(e);
    puck.x = Math.max(puck.r, Math.min(W - puck.r, p.x));
    puck.y = Math.max(puck.r, Math.min(H - puck.r, p.y));
    history.push(p); if (history.length > 6) history.shift();
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    const a = history[0], b = history[history.length - 1];
    const dt = Math.max(16, b.t - a.t);
    let vx = ((b.x - a.x) / dt) * 16, vy = ((b.y - a.y) / dt) * 16;
    const sp = Math.hypot(vx, vy), max = 26;
    if (sp > max) { vx *= max / sp; vy *= max / sp; }
    puck.vx = vx; puck.vy = vy;
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  // keyboard-friendly shoot buttons
  document.querySelectorAll("[data-shoot]").forEach(btn => btn.addEventListener("click", () => {
    const g = geo(); puck.x = W / 2; puck.y = H / 2;
    const left = btn.dataset.shoot === "left";
    shoot(left ? g.goalL - g.netDepth / 2 : g.goalR + g.netDepth / 2, H / 2, 16);
  }));

  window.addEventListener("resize", resize);
  new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readColors);
  resize();
  requestAnimationFrame(step);
})();
