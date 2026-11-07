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

  /* ---------- Data Mine: SQL query → result ---------- */
  V.datamine = (el) => {
    const sql = "SELECT region, COUNT(*)\nFROM trips\nGROUP BY region;";
    const rows = [["North", 42], ["East", 35], ["South", 28], ["West", 19]];
    el.innerHTML = `<div class="v-sql"><pre aria-label="${sql}"><code></code><span class="v-caret">▍</span></pre>
      <div class="v-bars">${rows.map(([k, v]) => `<div class="v-row"><span>${k}</span><div><i data-w="${v / 42 * 100}"></i></div><b>${v}</b></div>`).join("")}</div></div>${note()}`;
    const code = el.querySelector("code"), bars = el.querySelectorAll(".v-row i");
    const run = () => {
      code.textContent = ""; bars.forEach(b => b.style.width = "0");
      let n = 0;
      const type = () => {
        code.textContent = sql.slice(0, ++n);
        if (n < sql.length) setTimeout(type, reduce ? 0 : 45);
        else bars.forEach((b, j) => setTimeout(() => b.style.width = b.dataset.w + "%", 150 * j));
      };
      type();
    };
    onVisible(el, () => { run(); if (!reduce) setInterval(run, 9000); });
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

  /* ---------- Ventrix: daily count vs expected stock, discrepancy flagged ---------- */
  V.ventrix = (el) => {
    const W = 400, H = 170, days = 14, r = rng(3);
    const expected = Array.from({ length: days }, (_, i) => 60 - i * 1.6);
    const counted = expected.map((e, i) => i === 9 ? e - 12 : e + (r() - .5) * 2);
    const bw = (W - 40) / days;
    const Y = (v) => H - 24 - (v / 70) * (H - 44);
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="v-svg" role="img" aria-label="Bar chart of daily AC unit counts against expected stock; one day is flagged as a discrepancy">
      ${counted.map((v, i) => `<rect class="v-bar ${i === 9 ? "flag" : ""}" x="${24 + i * bw + 3}" width="${bw - 6}" y="${H - 24}" height="0" data-y="${Y(v)}" data-h="${H - 24 - Y(v)}" rx="3" style="fill:${i === 9 ? "var(--gold)" : "color-mix(in srgb, var(--red) 55%, var(--card))"}"/>`).join("")}
      <polyline points="${expected.map((e, i) => `${24 + i * bw + bw / 2},${Y(e)}`).join(" ")}" style="fill:none;stroke:var(--ink);stroke-width:1.6;stroke-dasharray:4 4"/>
      <text x="${24 + 9 * bw + bw / 2}" y="${Y(counted[9]) - 30}" text-anchor="middle" class="v-ax v-flagtxt">⚠ −12 units</text>
      <text x="24" y="${H - 6}" class="v-ax">day 1 → 14 · bars = counted · dashed = expected</text>
    </svg>${note()}`;
    onVisible(el, () => el.querySelectorAll(".v-bar").forEach((b, i) => setTimeout(() => {
      b.setAttribute("y", b.dataset.y); b.setAttribute("height", b.dataset.h);
    }, reduce ? 0 : i * 60)));
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
