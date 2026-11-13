/* The divide between the work side and the fun side.
   A pinned full-screen canvas: as you scroll, the khaki page breaks apart into pixels, the pixels fly back in color,
   and they rebuild into a full-screen frame: the first frame of the surfing video that the fun side opens with. */
(function () {
  const sec = document.getElementById("fun-side");
  const cv = document.getElementById("pixelCanvas");
  const cap = document.getElementById("pixelCap");
  if (!sec || !cv) return;
  const ctx = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const img = new Image(); img.src = "assets/hero/surf-poster.jpg";
  let W = 0, H = 0, bs = 14, cols = 0, rows = 0, blocks = [], ready = false;
  let KHAKI = [236, 226, 200];
  function readIce() { // match the work side's paper color (light or dark mode)
    const v = getComputedStyle(document.body).getPropertyValue("--ice").trim(), m = v.match(/^#?([0-9a-f]{6})$/i);
    if (m) KHAKI = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16));
  }
  const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3));
  const easeIn = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * t);

  function build() {
    readIce();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bs = W < 720 ? 10 : 14; cols = Math.ceil(W / bs); rows = Math.ceil(H / bs);
    // sample the image "cover"-fitted at block resolution, with the hero's dark shade baked in
    const s = document.createElement("canvas"); s.width = cols; s.height = rows; const g = s.getContext("2d");
    const r = Math.max(cols / img.width, rows / img.height), dw = img.width * r, dh = img.height * r;
    g.drawImage(img, (cols - dw) / 2, (rows - dh) / 2, dw, dh);
    const shade = g.createLinearGradient(0, 0, cols, 0);
    shade.addColorStop(0, "rgba(13,20,36,.62)"); shade.addColorStop(.5, "rgba(13,20,36,.4)"); shade.addColorStop(1, "rgba(13,20,36,.18)");
    g.fillStyle = shade; g.fillRect(0, 0, cols, rows);
    const px = g.getImageData(0, 0, cols, rows).data;
    blocks = [];
    const cx = cols / 2, cy = rows / 2, maxd = Math.hypot(cx, cy);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4, d = Math.hypot(x - cx, y - cy) / maxd;
      const a = Math.atan2(y - cy, x - cx) + (Math.random() - .5) * 1.2, fly = (0.35 + Math.random() * 0.9) * Math.max(W, H);
      blocks.push({
        x: x * bs, y: y * bs, c: [px[i], px[i + 1], px[i + 2]],
        ox: Math.cos(a) * fly, oy: Math.sin(a) * fly,
        out: d * 0.25 + Math.random() * 0.15,          // when it leaves (center first)
        back: (1 - d) * 0.25 + Math.random() * 0.2,     // when it returns (edges first, center last)
        s: 0.4 + Math.random() * 0.8
      });
    }
    ready = true; draw();
  }

  function progress() {
    const r = sec.getBoundingClientRect(), span = Math.max(1, sec.offsetHeight - innerHeight);
    return Math.min(1, Math.max(0, -r.top / span));
  }

  function draw() {
    if (!ready) return;
    const p = reduce ? 1 : progress();
    ctx.clearRect(0, 0, W, H);
    // phase A (0–.4): khaki pixels scatter; phase B (.35–.9): colored pixels fly home; phase C (.88–1): the photo sharpens
    const A = p / 0.4, B = (p - 0.35) / 0.55;
    for (const b of blocks) {
      const out = easeIn((A - b.out) / 0.6), back = ease((B - b.back) / 0.55);
      let k = out * (1 - back);                       // how far from home
      if (B <= 0) k = out;
      const col = back > 0 ? b.c : KHAKI;
      const size = bs * (back > 0 ? 0.55 + 0.45 * back : 1 - out * (1 - b.s) * 0.6);
      if (B <= 0 && out >= 1) continue;               // fully gone during the gap
      const alpha = B > 0 && back <= 0 ? 0 : 1;
      if (!alpha) continue;
      ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
      ctx.fillRect(b.x + b.ox * k + (bs - size) / 2, b.y + b.oy * k + (bs - size) / 2, size + 0.6, size + 0.6);
    }
    const C = Math.min(1, Math.max(0, (p - 0.88) / 0.12));
    if (C > 0 && img.complete) {
      ctx.globalAlpha = C;
      const r = Math.max(W / img.width, H / img.height), dw = img.width * r, dh = img.height * r;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      const shade = ctx.createLinearGradient(0, 0, W, 0);
      shade.addColorStop(0, "rgba(13,20,36,.62)"); shade.addColorStop(.5, "rgba(13,20,36,.4)"); shade.addColorStop(1, "rgba(13,20,36,.18)");
      ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    sec.style.setProperty("--px", p.toFixed(3));
    if (cap) cap.classList.toggle("show", p > 0.8);
  }

  let raf = 0;
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); }, { passive: true });
  addEventListener("resize", () => { if (img.complete) build(); });
  if (img.complete) build(); else img.onload = build;
})();
