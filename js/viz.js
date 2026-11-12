/* Per-project visualizations. Each one renders into <div class="viz" data-viz="<project id>">.
   Visuals marked "illustrative" explain how a project works; they are not real project data.
   The Titanic chart uses the real survival rates from Kaggle's training set. */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const note = (t = "illustrative") => `<span class="viz-note">${t}</span>`;
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function onVisible(el, fn) {
    if (!("IntersectionObserver" in window)) return fn();
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { threshold: 0.25 });
    io.observe(el);
  }

  const V = {};

  /* ---------- ASABC: real examples + real results (paper, Table III) ---------- */
  V.asabc = (el) => {
    // Example messages and model behaviour described in the paper (Fig. 4/5)
    const msgs = [
      ["well played", "pos"], ["666", "pos"], ["Nice try!", "pos"], ["This is stupid", "neg"],
      ["WP", "pos"], ["🤡🤡🤡", "neg"], ["2333", "pos"], ["Double Kill!", "oops"], ["FGNB", "pos"]
    ];
    const tag = { pos: "✓ positive", neg: "✕ negative", oops: "⚠ flagged (corner case)" };
    const sets = [
      ["Validation (same room)", 1786, 83.5, 0.905],
      ["Same room, later", 65065, 77.4, 0.868],
      ["Same game, other rooms", 50659, 75.9, 0.858],
      ["Other games", 28507, 77.3, 0.867],
      ["Food · outdoor · shopping", 41191, 76.2, 0.860]
    ];
    el.innerHTML = `<div class="v-chat">
        <div class="v-screen"><div class="v-lane"></div><div class="v-lane"></div><div class="v-lane"></div></div>
        <div class="v-arb"><b>🤖 ASABC filter</b><small>trained on 8,925 msgs<br>8,382 positive · 543 negative</small></div>
      </div>
      <div class="v-res-head"><b>Results on 185k+ unseen messages</b>
        <div class="v-toggle" role="group" aria-label="Metric"><button class="on" data-m="acc">Accuracy</button><button data-m="f1">F1</button></div></div>
      <div class="v-hbars v-asabc-bars"></div>${note("real results · IEEE AIxHeart 2024")}`;
    const lanes = el.querySelectorAll(".v-lane");
    let i = 0;
    const spawn = () => {
      const [text, k] = msgs[i % msgs.length]; i++;
      const b = document.createElement("span");
      b.className = "v-bullet"; b.textContent = text;
      lanes[i % lanes.length].appendChild(b);
      setTimeout(() => { b.classList.add(k); b.dataset.tag = tag[k]; }, 2300);
      b.addEventListener("animationend", () => b.remove());
    };
    const box = el.querySelector(".v-asabc-bars");
    const draw = (m) => {
      box.innerHTML = sets.map(([k, n, acc, f1]) => {
        const v = m === "acc" ? acc : f1 * 100;
        return `<div class="v-row" title="${n.toLocaleString()} messages"><span>${k}</span><div><i data-w="${v}"></i></div><b>${m === "acc" ? acc + "%" : f1.toFixed(2)}</b></div>`;
      }).join("");
      requestAnimationFrame(() => requestAnimationFrame(() => box.querySelectorAll("i").forEach(x => x.style.width = x.dataset.w + "%")));
      el.querySelectorAll(".v-toggle button").forEach(b => b.classList.toggle("on", b.dataset.m === m));
    };
    el.querySelector(".v-toggle").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) draw(b.dataset.m); });
    onVisible(el, () => { draw("acc"); spawn(); if (!reduce) setInterval(spawn, 1200); });
  };

  /* ---------- Hockey: the CV pipeline (shown under the real demo video) ---------- */
  V["hockey-cv"] = (el) => {
    const steps = [["🎞️", "Game film"], ["📦", "YOLO detects people + puck"], ["👕", "CNN sorts teams by jersey"], ["➡️", "Track movement vectors"], ["📊", "Speed & team stats"]];
    el.innerHTML = `<ol class="v-pipe">${steps.map(([i, t]) => `<li><span>${i}</span>${t}</li>`).join("")}</ol>`;
    const items = el.querySelectorAll("li"); let k = 0;
    const tick = () => { items.forEach((li, j) => li.classList.toggle("on", j === k)); k = (k + 1) % items.length; };
    tick(); if (!reduce) setInterval(tick, 1100);
  };

  /* ---------- Aviation: raw vs cleaned simulator telemetry ---------- */
  V.aviation = (el) => {
    const W = 400, H = 170, r = rng(7), N = 120;
    const alt = (t) => t < .25 ? Math.sin((t / .25) * Math.PI / 2) : t < .7 ? 1 + Math.sin(t * 40) * .015 : Math.cos(((t - .7) / .3) * Math.PI / 2);
    const X = (i) => 20 + (i / (N - 1)) * (W - 30), Y = (v) => H - 22 - v * (H - 50);
    let raw = "", clean = "", gap = false;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1); let v = alt(t) + (r() - .5) * .12;
      if ([30, 61, 95].includes(i)) v += (r() > .5 ? .45 : -.4);         // sensor spikes
      const missing = (i > 44 && i < 52) || (i > 80 && i < 85);             // dropped frames
      if (missing) { gap = true; continue; }
      raw += `${raw === "" || gap ? "M" : "L"}${X(i).toFixed(1)},${Y(v).toFixed(1)} `; gap = false;
      clean += `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(alt(t)).toFixed(1)} `;
    }
    el.innerHTML = `<div class="v-toggle" role="group" aria-label="Show raw or cleaned data">
        <button class="on" data-m="raw">Raw export</button><button data-m="clean">Cleaned</button></div>
      <svg viewBox="0 0 ${W} ${H}" class="v-svg" role="img" aria-label="Line chart of simulated altitude: noisy raw export with spikes and gaps versus a smooth cleaned series">
        <line x1="20" y1="${H - 22}" x2="${W - 10}" y2="${H - 22}" style="stroke:var(--line)"/>
        <text x="20" y="${H - 6}" class="v-ax">time →</text><text x="22" y="16" class="v-ax">altitude</text>
        <path d="${raw}" class="v-raw" style="fill:none;stroke:var(--ink-3);stroke-width:1.4"/>
        <path d="${clean}" class="v-clean" pathLength="1" style="fill:none;stroke:var(--red);stroke-width:2.6;stroke-linecap:round"/>
        <g class="v-flags">${[30, 61, 95].map(i => `<circle cx="${X(i)}" cy="${Y(alt(i / (N - 1)))}" r="9" style="fill:none;stroke:var(--gold);stroke-width:2"/>`).join("")}</g>
      </svg>${note()}`;
    const svg = el.querySelector("svg");
    const set = (m) => { svg.dataset.mode = m; el.querySelectorAll(".v-toggle button").forEach(b => b.classList.toggle("on", b.dataset.m === m)); };
    el.querySelector(".v-toggle").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) set(b.dataset.m); });
    set("raw");
    onVisible(el, () => setTimeout(() => set("clean"), reduce ? 0 : 1600));
  };

  /* ---------- Kaggle Titanic: real survival rates ---------- */
  V.kaggle = (el) => {
    const sets = {
      sex: [["Female", 74.2], ["Male", 18.9]],
      class: [["1st class", 63.0], ["2nd class", 47.3], ["3rd class", 24.2]]
    };
    el.innerHTML = `<div class="v-toggle" role="group" aria-label="Group survival rate by">
        <button class="on" data-m="sex">By sex</button><button data-m="class">By class</button></div>
      <div class="v-hbars"></div><div class="v-trophy">🏆 my model: 100% public LB</div>${note("real data · Kaggle train set")}`;
    const box = el.querySelector(".v-hbars");
    const draw = (m) => {
      box.innerHTML = sets[m].map(([k, v]) => `<div class="v-row"><span>${k}</span><div><i data-w="${v}"></i></div><b>${v}%</b></div>`).join("");
      requestAnimationFrame(() => requestAnimationFrame(() => box.querySelectorAll("i").forEach(i => i.style.width = i.dataset.w + "%")));
      el.querySelectorAll(".v-toggle button").forEach(b => b.classList.toggle("on", b.dataset.m === m));
    };
    el.querySelector(".v-toggle").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) draw(b.dataset.m); });
    onVisible(el, () => draw("sex"));
  };

  /* ---------- Drowning detection: pool camera that flags a still swimmer ---------- */
  V.drowning = (el) => {
    el.innerHTML = `<canvas class="v-canvas" role="img" aria-label="Animated top-down pool: swimmers move along lanes; when one stops moving the AI camera flags an alert"></canvas>
      <div class="v-alert" aria-hidden="true">⚠ No movement · alert lifeguard</div>${note()}`;
    const cv = el.querySelector("canvas"), ctx = cv.getContext("2d"), alertEl = el.querySelector(".v-alert");
    const swimmers = [0, 1, 2, 3, 4].map(i => ({ lane: i, x: .15 + i * .17, dir: i % 2 ? -1 : 1, sp: .0022 + i * .0004 }));
    let W, H, t0 = performance.now();
    const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    const frame = (now) => {
      if (!W) size();
      const t = ((now - t0) / 1000) % 8, victim = swimmers[2], still = t > 3;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#89CDFA"; ctx.globalAlpha = .35; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
      ctx.strokeStyle = css("--red"); ctx.setLineDash([6, 6]); ctx.lineWidth = 1.5;
      for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(0, (H / 5) * i); ctx.lineTo(W, (H / 5) * i); ctx.stroke(); }
      ctx.setLineDash([]);
      swimmers.forEach(s => {
        if (!(s === victim && still) && !reduce) { s.x += s.dir * s.sp; if (s.x > .94 || s.x < .06) s.dir *= -1; }
        const x = s.x * W, y = (H / 5) * (s.lane + .5) + (s === victim && still ? Math.sin(now / 300) * 1.5 : 0);
        const flagged = s === victim && t > 4.2;
        ctx.fillStyle = flagged ? css("--red") : css("--ink");
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = flagged ? css("--red") : css("--gold"); ctx.lineWidth = 2;
        const pad = flagged ? 14 + Math.sin(now / 150) * 3 : 11;
        ctx.strokeRect(x - pad, y - pad, pad * 2, pad * 2);
      });
      if (t < .05) swimmers.forEach((s, i) => s.x = .15 + i * .17);
      alertEl.classList.toggle("show", t > 4.2);
      requestAnimationFrame(frame);
    };
    new ResizeObserver(size).observe(cv);
    onVisible(el, () => requestAnimationFrame(frame));
  };

  /* ---------- Ventrix: warehouse heat map of AC units by product, bay and week ---------- */
  V.ventrix = (el) => {
    const PRODUCTS = [
      { code: "WA08", name: "Window AC 8k BTU" }, { code: "WA12", name: "Window AC 12k BTU" },
      { code: "PA10", name: "Portable AC 10k" }, { code: "MS18", name: "Mini-split 18k" }, { code: "HP24", name: "Heat pump 24k" }
    ];
    const WEEKS = ["May 4", "May 11", "May 18", "May 25", "Jun 1", "Jun 8", "Jun 15", "Jun 22", "Jun 29", "Jul 6"];
    // ---- floor plan (viewBox 640 x 400) ----
    const cells = [];
    "ABCD".split("").forEach((row, r) => { for (let i = 0; i < 6; i++) cells.push({ id: `${row}${i + 1}`, x: 140 + i * 54, y: 34 + r * 66, w: 50, h: 34, kind: "rack" }); });
    for (let i = 0; i < 6; i++) cells.push({ id: `F${i + 1}`, x: 488 + (i % 2) * 66, y: 34 + Math.floor(i / 2) * 72, w: 60, h: 64, kind: "bulk" });
    for (let i = 0; i < 3; i++) cells.push({ id: `S${i + 1}`, x: 140 + i * 64, y: 300, w: 58, h: 40, kind: "stage" });
    for (let i = 0; i < 3; i++) cells.push({ id: `O${i + 1}`, x: 400 + i * 74, y: 300, w: 68, h: 40, kind: "out" });
    const cap = { rack: 1, bulk: 1.9, stage: .8, out: .9 };
    // where each product "lives" and how it moves through the summer (illustrative model)
    const model = {
      WA08: (w) => ({ cx: 300 - w * 6, cy: 60 + w * 26, sd: 120, total: 420 - w * 30 }),
      WA12: (w) => ({ cx: 230 + w * 22, cy: 80 + w * 22, sd: 110, total: 520 - w * 34 }),
      PA10: (w) => ({ cx: 210, cy: 200 + Math.sin(w) * 30, sd: 90, total: 260 - w * 12 }),
      MS18: (w) => ({ cx: 540, cy: 90 + w * 8, sd: 80, total: 300 + (w > 5 ? -40 : 15) * (w % 3) }),
      HP24: (w) => ({ cx: 560, cy: 220 - w * 6, sd: 70, total: 90 + w * 26 })
    };
    const data = {}; // data[week][code][cellId] = count
    WEEKS.forEach((_, w) => {
      data[w] = {};
      PRODUCTS.forEach((p, pi) => {
        const m = model[p.code](w), r = rng(100 + w * 7 + pi * 131);
        const wts = cells.map(c => { const dx = c.x + c.w / 2 - m.cx, dy = c.y + c.h / 2 - m.cy; return Math.exp(-(dx * dx + dy * dy) / (2 * m.sd * m.sd)) * cap[c.kind] * (0.75 + r() * 0.5); });
        const sum = wts.reduce((a, b) => a + b, 0);
        data[w][p.code] = Object.fromEntries(cells.map((c, i) => [c.id, Math.round(m.total * wts[i] / sum)]));
      });
    });
    const FLAG = { week: 5, cell: "C4", code: "WA12", missing: 12 };
    const countOf = (w, code, id) => code === "ALL" ? PRODUCTS.reduce((a, p) => a + data[w][p.code][id], 0) : data[w][code][id];
    const maxOf = (code) => Math.max(...WEEKS.flatMap((_, w) => cells.map(c => countOf(w, code, c.id))));
    const work = document.body.classList.contains("page-work");
    const stops = work ? [[0, [255, 251, 238]], [.3, [226, 207, 150]], [.62, [201, 162, 39]], [1, [122, 74, 30]]]
                       : [[0, [246, 250, 255]], [.3, [137, 205, 250]], [.62, [254, 182, 193]], [1, [214, 64, 106]]];
    const heat = (t) => { for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { const [a, ca] = stops[i - 1], [b, cb] = stops[i], k = (t - a) / (b - a); return `rgb(${ca.map((v, j) => Math.round(v + (cb[j] - v) * k)).join(",")})`; } return `rgb(${stops[stops.length - 1][1].join(",")})`; };
    const serials = (w, code, id) => { // serial range for this bay, numbered in a fixed walk order
      let start = 1; for (const c of cells) { if (c.id === id) break; start += data[w][code][c.id]; }
      const n = data[w][code][id]; return n ? `${code}-26-${String(start).padStart(4, "0")} → ${String(start + n - 1).padStart(4, "0")}` : "none";
    };

    el.innerHTML = `
      <div class="wh-controls">
        <div class="v-toggle wh-products" role="group" aria-label="Product">
          <button class="on" data-p="ALL">All units</button>${PRODUCTS.map(p => `<button data-p="${p.code}" title="${p.name}">${p.code}</button>`).join("")}
        </div>
        <div class="wh-week"><button class="wh-play" aria-label="Play weeks">▶</button>
          <input type="range" min="0" max="${WEEKS.length - 1}" value="0" aria-label="Week"><span class="wh-wlabel"></span></div>
      </div>
      <svg viewBox="0 0 640 400" class="v-svg wh" role="img" aria-label="Warehouse floor plan heat map showing AC unit counts per storage bay">
        <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" style="stroke:var(--line);stroke-width:2"/></pattern></defs>
        <rect x="8" y="8" width="624" height="368" rx="6" class="wh-wall"/>
        <rect x="14" y="14" width="106" height="72" class="wh-room"/><text x="67" y="46" class="wh-lbl" text-anchor="middle">Office</text><text x="67" y="60" class="wh-sub" text-anchor="middle">inventory desk</text>
        <rect x="14" y="94" width="106" height="74" class="wh-room" style="fill:url(#hatch)"/><text x="67" y="128" class="wh-lbl" text-anchor="middle">Returns / QA</text><text x="67" y="142" class="wh-sub" text-anchor="middle">cage</text>
        <rect x="14" y="176" width="106" height="60" class="wh-room"/><text x="67" y="204" class="wh-lbl" text-anchor="middle">Parts &amp;</text><text x="67" y="218" class="wh-lbl" text-anchor="middle">accessories</text>
        <rect x="14" y="244" width="106" height="96" class="wh-room"/><text x="67" y="288" class="wh-lbl" text-anchor="middle">⚡ Forklift</text><text x="67" y="302" class="wh-lbl" text-anchor="middle">charging</text>
        ${"ABCD".split("").map((r, i) => `<text x="134" y="${55 + i * 66}" class="wh-row" text-anchor="end">${r}</text>`).join("")}
        ${[0, 1, 2].map(i => `<text x="300" y="${84 + i * 66}" class="wh-aisle" text-anchor="middle">aisle ${i + 1}</text>`).join("")}
        <text x="554" y="26" class="wh-sub" text-anchor="middle">bulk floor storage</text>
        <text x="236" y="294" class="wh-sub" text-anchor="middle">inbound staging</text><text x="511" y="294" class="wh-sub" text-anchor="middle">outbound staging</text>
        <path d="M128 276 H624 M470 34 V268" class="wh-path"/>
        <g class="wh-cells">${cells.map(c => `<g class="wh-cell" data-id="${c.id}" tabindex="0" role="button"><rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="4"/><text x="${c.x + c.w / 2}" y="${c.y + c.h / 2 + 4}" text-anchor="middle"></text><text class="wh-id" x="${c.x + 4}" y="${c.y + 9}">${c.id}</text></g>`).join("")}</g>
        ${[0, 1, 2, 3].map(i => `<rect x="${150 + i * 120}" y="370" width="70" height="12" rx="2" class="wh-dock"/><text x="${185 + i * 120}" y="394" class="wh-sub" text-anchor="middle">dock ${i + 1}</text>`).join("")}
        <g class="wh-flag" style="display:none"><circle r="10" style="fill:var(--card);stroke:#d6406a;stroke-width:2"/><text y="4" text-anchor="middle" style="font-size:12px">⚠</text></g>
      </svg>
      <div class="wh-foot">
        <div class="wh-legend"><span>fewer</span><i></i><span>more units</span></div>
        <div class="wh-stats"></div>
      </div>
      <div class="wh-tip" role="status" aria-live="polite"></div>${note("illustrative data")}`;

    let code = "ALL", week = 0, playing = null, sel = null;
    const svg = el.querySelector("svg"), slider = el.querySelector("input"), tip = el.querySelector(".wh-tip"), flag = el.querySelector(".wh-flag");
    function draw() {
      const max = maxOf(code);
      let total = 0, hot = null;
      el.querySelectorAll(".wh-cell").forEach(g => {
        const id = g.dataset.id, n = countOf(week, code, id), t = Math.min(1, n / max);
        total += n; if (!hot || n > hot.n) hot = { id, n };
        g.querySelector("rect").style.fill = n ? heat(t) : "var(--card)";
        const tx = g.querySelector("text"); tx.textContent = n || ""; tx.style.fill = t > .8 ? "#fff" : "#1d2a47";
      });
      el.querySelector(".wh-wlabel").textContent = `Week of ${WEEKS[week]}`;
      const flagOn = week === FLAG.week && (code === "ALL" || code === FLAG.code);
      const fc = cells.find(c => c.id === FLAG.cell); flag.style.display = flagOn ? "" : "none";
      flag.setAttribute("transform", `translate(${fc.x + fc.w - 2},${fc.y + 2})`);
      el.querySelector(".wh-stats").innerHTML = `<b>${total.toLocaleString()}</b> units · hottest bay <b>${hot.id}</b> (${hot.n})${flagOn ? ` · <span class="wh-warn">⚠ ${FLAG.cell}: ${FLAG.missing} WA12 units missing vs. system</span>` : ""}`;
      if (sel) showTip(sel);
    }
    function showTip(id) {
      sel = id;
      const rows = (code === "ALL" ? PRODUCTS : PRODUCTS.filter(p => p.code === code)).map(p => {
        const n = data[week][p.code][id]; return n ? `<tr><td>${p.code}</td><td>${n}</td><td>${serials(week, p.code, id)}</td></tr>` : "";
      }).join("");
      const flagged = id === FLAG.cell && week === FLAG.week;
      tip.innerHTML = `<b>Bay ${id}</b> · week of ${WEEKS[week]}${flagged ? ` <span class="wh-warn">⚠ counted ${countOf(week, "WA12", id)}, system says ${countOf(week, "WA12", id) + FLAG.missing}</span>` : ""}
        ${rows ? `<table><tr><th>Model</th><th>Units</th><th>Serial range</th></tr>${rows}</table>` : "<p>Empty bay</p>"}`;
      tip.classList.add("show");
      el.querySelectorAll(".wh-cell").forEach(g => g.classList.toggle("sel", g.dataset.id === id));
    }
    el.querySelector(".wh-products").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; code = b.dataset.p; el.querySelectorAll(".wh-products button").forEach(x => x.classList.toggle("on", x === b)); draw(); });
    slider.addEventListener("input", () => { week = +slider.value; draw(); });
    el.querySelector(".wh-play").addEventListener("click", (e) => {
      if (playing) { clearInterval(playing); playing = null; e.target.textContent = "▶"; return; }
      e.target.textContent = "❚❚";
      playing = setInterval(() => { week = (week + 1) % WEEKS.length; slider.value = week; draw(); }, 900);
    });
    svg.addEventListener("mouseover", (e) => { const g = e.target.closest(".wh-cell"); if (g) showTip(g.dataset.id); });
    svg.addEventListener("focusin", (e) => { const g = e.target.closest(".wh-cell"); if (g) showTip(g.dataset.id); });
    svg.addEventListener("click", (e) => { const g = e.target.closest(".wh-cell"); if (g) showTip(g.dataset.id); });
    draw();
    onVisible(el, () => { if (!reduce) el.querySelector(".wh-play").click(); setTimeout(() => { if (playing) el.querySelector(".wh-play").click(); }, 9500); });
  };

  /* ---------- Visual odometry: estimated vs true camera path from feature points ---------- */
  V.vo = (el) => {
    const W = 400, H = 170, r = rng(11);
    const pts = Array.from({ length: 70 }, () => [r() * W, r() * H]);
    const truth = "M30,140 C110,140 120,40 200,50 S320,150 370,60";
    const est = "M30,140 C115,135 128,48 205,58 S325,140 372,72";
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="v-svg" role="img" aria-label="Camera trajectory estimated from tracked feature points, drawn next to the true path">
      <g>${pts.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.8" class="v-feat" style="fill:var(--ink-3)"/>`).join("")}</g>
      <path d="${truth}" style="fill:none;stroke:var(--ink-3);stroke-width:2;stroke-dasharray:5 5"/>
      <path d="${est}" class="v-est" pathLength="1" style="fill:none;stroke:var(--red);stroke-width:2.6;stroke-linecap:round"/>
      <g class="v-cam"><polygon points="-8,-6 8,0 -8,6" style="fill:var(--gold);stroke:var(--ink);stroke-width:1"/></g>
      <text x="12" y="16" class="v-ax">— estimated   - - true path</text>
    </svg>${note()}`;
    const path = el.querySelector(".v-est"), cam = el.querySelector(".v-cam"), feats = el.querySelectorAll(".v-feat");
    const len = path.getTotalLength();
    const run = () => {
      const start = performance.now(), dur = reduce ? 1 : 4000;
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        path.style.strokeDasharray = `${p} 1`;
        const a = path.getPointAtLength(p * len), b = path.getPointAtLength(Math.min(len, p * len + 1));
        cam.setAttribute("transform", `translate(${a.x},${a.y}) rotate(${Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI})`);
        feats.forEach(f => { const d = Math.hypot(f.cx.baseVal.value - a.x, f.cy.baseVal.value - a.y); f.style.fill = d < 45 ? css("--gold") : ""; });
        if (p < 1) requestAnimationFrame(step); else if (!reduce) setTimeout(run, 1500);
      };
      requestAnimationFrame(step);
    };
    onVisible(el, run);
  };

  window.renderViz = function () {
    document.querySelectorAll(".viz[data-viz]").forEach(el => { const fn = V[el.dataset.viz]; if (fn) fn(el); else el.remove(); });
  };
})();
