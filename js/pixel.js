/* The divide between the work side and the fun side: a surf landing.
   Pinned full-screen canvas driven by scroll:
   1) the surfer from the timeline keeps riding the wave channel down to the bottom of the screen,
   2) launches up off the lip in a spinning jump,
   3) lands in the middle, and the ripples from the landing spread out until the whole screen is the fun side's blue. */
(function () {
  const sec = document.getElementById("fun-side");
  const cv = document.getElementById("pixelCanvas");
  const cap = document.getElementById("pixelCap");
  if (!sec || !cv) return;
  const ctx = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FUN = "#03203D", STONE = "#639CC5", WATER = "#3F79A6", WATER2 = "#5E97C2";
  let W = 0, H = 0, sand = "#F0E5DB";
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const easeInOut = (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const v = getComputedStyle(document.body).getPropertyValue("--ice").trim(); if (/^#[0-9a-f]{6}$/i.test(v)) sand = v;
    draw();
  }
  const progress = () => { const r = sec.getBoundingClientRect(); return clamp(-r.top / Math.max(1, sec.offsetHeight - innerHeight)); };

  function channel(x, w, t) { // the wave channel, same look as the timeline
    ctx.save();
    ctx.fillStyle = "rgba(99,156,197,.22)"; ctx.fillRect(x - w / 2 - 13, 0, w + 26, H);
    ctx.fillStyle = WATER; ctx.fillRect(x - w / 2, 0, w, H);
    ctx.fillStyle = WATER2; ctx.fillRect(x - w / 2 + 5, 0, w - 10, H);
    ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.setLineDash([18, 26]); ctx.lineDashOffset = -t * 60; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    ctx.setLineDash([2, 7]); ctx.lineWidth = 2; ctx.strokeStyle = "#F4FAFF";
    [x - w / 2 + 3, x + w / 2 - 3].forEach(e => { ctx.beginPath(); ctx.moveTo(e, 0); ctx.lineTo(e, H); ctx.stroke(); });
    ctx.restore();
  }
  const EMOJI = `"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  function surfer(x, y, scale, rot, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
    ctx.font = `${W < 720 ? 24 : 30}px ${EMOJI}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("🏄", 0, 0); ctx.restore();
  }
  function pushWave(x, y, t) { // same wave as on the timeline, right behind him (mirrored so it curls the way he rides)
    ctx.save(); ctx.translate(x, y); ctx.scale(-(1 + Math.sin(t * 5.7) * 0.04), 1 + Math.sin(t * 5.7) * 0.04);
    ctx.font = `${W < 720 ? 34 : 44}px ${EMOJI}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("🌊", 0, 0); ctx.restore();
  }

  function draw() {
    if (!W) return;
    const p = reduce ? 1 : progress(), t = performance.now() / 1000;
    const cx = W / 2, cw = W < 720 ? 40 : 58, land = { x: cx, y: H * 0.56 };
    const secTop = sec.getBoundingClientRect().top, LINE = innerHeight * 0.55; // the timeline surfer rides this line of the screen
    // phases
    const ride = clamp(p / 0.4), jump = clamp((p - 0.4) / 0.22), ripple = clamp((p - 0.62) / 0.3);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = sand; ctx.fillRect(0, 0, W, H);

    if (ripple < 1) channel(cx, cw, p * 6);

    // ripples: the landing floods the screen with the fun side's blue
    if (ripple > 0) {
      const maxR = Math.hypot(W, H) * 0.62, R = easeOut(ripple) * maxR;
      ctx.fillStyle = FUN; ctx.beginPath(); ctx.arc(land.x, land.y, R, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 5; i++) { // rings running ahead of and inside the flood
        const rr = R * (1.08 - i * 0.17) + Math.sin(t * 3 + i) * 2; if (rr <= 4) continue;
        ctx.strokeStyle = i === 0 ? "rgba(99,156,197,.9)" : `rgba(${i % 2 ? "255,255,255" : "99,156,197"},${0.5 - i * 0.07})`;
        ctx.lineWidth = i === 0 ? 4 : 2; ctx.beginPath(); ctx.ellipse(land.x, land.y, rr, rr * (i === 0 ? 1 : 0.92), 0, 0, Math.PI * 2); ctx.stroke();
      }
      // splash droplets right at the landing
      if (ripple < 0.35) {
        const k = ripple / 0.35;
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2, d = 20 + k * 90;
          ctx.fillStyle = `rgba(255,255,255,${1 - k})`; ctx.beginPath(); ctx.arc(land.x + Math.cos(a) * d, land.y + Math.sin(a) * d * 0.6 - k * 30, 4 * (1 - k) + 1, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    // the surfer
    if (jump <= 0) {
      // entering: he is still on the timeline's line until this scene pins; then he rides on down to the bottom
      let y = null;
      if (secTop > 0) { if (secTop <= LINE) y = LINE - secTop; }
      else y = LINE + easeInOut(ride) * (H * 0.88 - LINE);
      if (y !== null) {
        ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.beginPath(); ctx.ellipse(cx, y + 10, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
        pushWave(cx, y - 34, t);
        surfer(cx, y, 1, 0, 1);
      }
    } else {
      const startY = H * 0.88, peakY = H * 0.2;
      const u = jump, y = (1 - u) * (1 - u) * startY + 2 * (1 - u) * u * peakY + u * u * land.y; // arc up and back down
      const sc = 1 + Math.sin(u * Math.PI) * 1.4 + u * 0.4;
      const rot = easeInOut(u) * Math.PI * 2;
      if (u < 1 || ripple < 0.5) surfer(cx, y, sc, rot, ripple > 0 ? 1 - ripple * 2 : 1);
      if (u < 1) { ctx.fillStyle = "rgba(30,40,50,.12)"; ctx.beginPath(); ctx.ellipse(cx, startY + 20, 30 * (1 - u * .6), 7, 0, 0, Math.PI * 2); ctx.fill(); }
    }

    if (cap) cap.classList.toggle("show", p > 0.84);
  }

  let raf = 0;
  const loop = () => { draw(); raf = requestAnimationFrame(loop); };
  new IntersectionObserver(es => { if (es[0].isIntersecting) { if (!raf) loop(); } else { cancelAnimationFrame(raf); raf = 0; } }).observe(sec);
  addEventListener("resize", size); size();
})();
