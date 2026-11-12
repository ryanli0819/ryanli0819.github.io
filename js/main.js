(function () {
  const S = window.SITE;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Missing-info drop box ---------- */
  function dropbox(items, hint) {
    if (!window.SHOW_MISSING_INFO || !items || !items.length) return "";
    return `<div class="dropbox">
      <p class="dropbox-title">📥 Info needed</p>
      <ul>${items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>
      ${hint ? `<p class="hint">${hint}</p>` : ""}
    </div>`;
  }

  /* ---------- Hero ---------- */
  $("#stats").innerHTML = S.stats.map(s => `<li><b>${esc(s.value)}</b><span>${esc(s.label)}</span></li>`).join("");

  /* ---------- About ---------- */
  const P = S.person;
  $("#photo").innerHTML = P.photo
    ? `<img src="${esc(P.photo)}" alt="Photo of ${esc(P.name)}">`
    : `<span class="initials">RL</span>${window.SHOW_MISSING_INFO ? '<span class="photo-note">📥 photo coming soon</span>' : ""}`;
  if (P.photo) $("#photo").classList.add("filled");
  $("#bio").innerHTML = P.bio.map(p => `<p>${esc(p)}</p>`).join("");
  $("#facts").innerHTML = [
    ["Studying", `${P.degree}`],
    ["School", P.school],
    ["Grad", P.grad],
    ["Based", P.location]
  ].map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");
  $("#aboutMissing").innerHTML = dropbox(P.missing, "Edit <code>person</code> in <code>js/data.js</code>.");
  $("#skills").innerHTML = Object.entries(S.skills).map(([k, list]) =>
    `<h3>${esc(k)}</h3><ul class="tags">${list.map(t => `<li>${esc(t)}</li>`).join("")}</ul>`).join("");

  /* ---------- Projects ---------- */
  const eraLabel = { hs: "High school", college: "College", work: "Experience", unknown: "" };
  function projectCard(p) {
    const awardish = /award|1st|2nd|published/i.test(p.badge);
    const badgeCls = /soon/i.test(p.badge) ? "soon" : awardish ? "award" : "";
    const linkList = [...p.links];
    if (p.repo) linkList.push({ label: "GitHub repo", url: p.repo, gh: true });
    const linkHtml = (list) => list.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener" class="${l.gh ? "gh-link" : ""}">${esc(l.label)} ↗</a>`).join("");
    const links = linkList.length ? linkHtml(linkList) : `<span class="nolink">Link coming soon</span>`;
    const metrics = p.metrics.length
      ? `<div class="metrics">${p.metrics.map(m => `<div class="metric"><b>${esc(m.value)}</b><span>${esc(m.label)}</span></div>`).join("")}</div>` : "";
    const video = p.video
      ? `<video src="${esc(p.video)}" muted loop playsinline autoplay controls preload="metadata" aria-label="Demo of ${esc(p.title)} running on game footage"></video>` : "";
    const media = video + `<div class="viz${video ? " viz-plain" : ""}" data-viz="${esc(p.id)}"></div>`;
    const needCount = window.SHOW_MISSING_INFO ? p.missing.length : 0;
    const head = `
      <div class="project-top">
        <span class="project-icon" aria-hidden="true">${p.icon}</span>
        <span class="badge ${badgeCls}">${esc(p.badge)}</span>
        <span class="era">${esc(eraLabel[p.era] || "")}</span>
      </div>
      <h3>${esc(p.title)}</h3>
      <div class="when">${esc(p.when)}</div>`;
    const main = `
      <p class="summary">${esc(p.summary)}</p>
      ${p.citation ? `<p class="cite">${p.citation}</p>` : ""}
      ${metrics}
      <ul class="tags">${p.skills.map(s => `<li>${esc(s)}</li>`).join("")}</ul>
      <div class="project-links">${links}</div>`;
    const more = `
      <div class="card-actions">
        <button class="btn primary sm" data-open="${esc(p.id)}">▶ Demo &amp; details</button>
        ${needCount ? `<span class="need">${needCount} to add</span>` : ""}
      </div>`;
    const body = p.wideViz
      ? media + `<div class="wide-main">${main}</div>`
      : p.featured
      ? `<div class="featured-body"><div>${main}</div><div class="media-col">${media}</div></div>`
      : media + main;
    return `<article class="project reveal ${p.featured ? "featured" : ""}" data-tags="${[...p.tags, p.era].join(" ")}" id="p-${esc(p.id)}">
      ${head}${body}${more}</article>`;
  }
  $("#projectList").innerHTML = S.projects.map(projectCard).join("");
  if (window.renderViz) window.renderViz();

  /* ---------- Project modal: demo video + full description + skills ---------- */
  const modal = $("#projModal");
  function openProject(id) {
    const p = S.projects.find(x => x.id === id); if (!p) return;
    const linkList = [...p.links]; if (p.repo) linkList.push({ label: "GitHub repo (code, README, video)", url: p.repo, gh: true });
    $("#pmBody").innerHTML = `
      ${p.demo ? `<figure class="pm-video"><video src="${esc(p.demo)}" controls autoplay muted playsinline preload="metadata"></video>
        <figcaption>${p.demoKind === "real" ? "🎥 Real demo: my model running on game footage" : "🎬 Explainer animation of how the project works (not real project footage)"}</figcaption></figure>` : ""}
      <div class="pm-text">
        <div class="project-top"><span class="project-icon" aria-hidden="true">${p.icon}</span><span class="badge">${esc(p.badge)}</span></div>
        <h2 id="pmTitle">${esc(p.title)}</h2>
        <p class="when">${esc(p.when)}</p>
        <p class="pm-summary">${esc(p.summary)}</p>
        ${p.details.length ? `<h3>What I did</h3><ul class="did">${p.details.map(d => `<li>${esc(d)}</li>`).join("")}</ul>` : ""}
        <h3>Skills used</h3><ul class="tags">${p.skills.map(s => `<li>${esc(s)}</li>`).join("")}</ul>
        ${p.metrics.length ? `<h3>Results</h3><div class="metrics">${p.metrics.map(m => `<div class="metric"><b>${esc(m.value)}</b><span>${esc(m.label)}</span></div>`).join("")}</div>` : ""}
        ${p.citation ? `<h3>Citation</h3><p class="cite">${p.citation}</p>` : ""}
        <div class="project-links pm-links">${linkList.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener" class="${l.gh ? "gh-link" : ""}">${esc(l.label)} ↗</a>`).join("")}</div>
        ${dropbox(p.missing, `Edit project <code>${esc(p.id)}</code> in <code>js/data.js</code>.`)}
      </div>`;
    modal.showModal();
    history.replaceState(null, "", "#project-" + p.id);
  }
  $("#projectList").addEventListener("click", (e) => { const b = e.target.closest("[data-open]"); if (b) openProject(b.dataset.open); });
  $("#pmClose").onclick = () => modal.close();
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });
  modal.addEventListener("close", () => { $("#pmBody").innerHTML = ""; history.replaceState(null, "", location.pathname + "#projects"); });
  if (location.hash.startsWith("#project-")) openProject(location.hash.slice(9));

  // filters
  $("#filters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-filter]"); if (!b) return;
    document.querySelectorAll("#filters .chip").forEach(c => c.classList.toggle("active", c === b));
    const f = b.dataset.filter;
    document.querySelectorAll(".project").forEach(card => {
      card.classList.toggle("hidden", f !== "all" && !card.dataset.tags.split(" ").includes(f));
    });
  });

  // subtle 3D tilt on hover (pointer devices only)
  if (matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches) {
    document.querySelectorAll(".project").forEach(card => {
      card.addEventListener("mousemove", (e) => {
        if (e.target.closest("video, details[open]")) { card.style.transform = ""; return; }
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(900px) rotateY(${x * 3}deg) rotateX(${-y * 3}deg) translateY(-3px)`;
      });
      card.addEventListener("mouseleave", () => card.style.transform = "");
    });
  }

  /* ---------- Timeline: a road trip from Grade 9 to Purdue ---------- */
  (function road() {
    const el = $("#road"); if (!el) return;
    const KIND = {
      build: { c: "#FEB6C1", e: "🛠️", n: "built" }, learn: { c: "#89CDFA", e: "📚", n: "learned" },
      play: { c: "#e2577c", e: "🏒", n: "played" }, work: { c: "#f6c453", e: "💼", n: "worked" }
    };
    const SIGNS = [[9, "Grade 9", "9"], [10, "Grade 10", "10"], [11, "Grade 11", "11"], [12, "Grade 12", "12"], [12.6, "Summer '26", "S"], [13, "Purdue", "P"]];
    const signOf = (v) => SIGNS.filter(s => s[0] <= v).pop();
    const items = S.timeline.map((t, i) => ({ ...t, i })).sort((a, b) => a.from - b.from || a.i - b.i);
    const yearText = (t) => t.to > t.from ? `<span class="r-span">⇆ ${esc(t.when)}</span>` : "";

    let html = `<svg class="road-svg" aria-hidden="true"></svg><div class="r-row r-sign start"><span class="r-board go">START</span></div>`;
    let lastSign = null, side = 0;
    items.forEach(t => {
      const sg = signOf(t.from);
      if (sg !== lastSign) { lastSign = sg; html += `<div class="r-row r-sign" data-v="${sg[0]}"><span class="r-board"><small>EXIT ${sg[2]}</small>${sg[1]}</span></div>`; }
      const k = KIND[t.kind], s = side++ % 2 ? "right" : "left";
      html += `<div class="r-row r-stop ${s}" role="listitem" data-i="${t.i}" style="--k:${k.c}">
        <article class="r-card"><div class="r-meta"><span class="r-kind">${k.e} ${k.n}</span><span class="r-when">${esc(t.when)}</span></div>
          <h3>${esc(t.title)}</h3><p>${esc(t.text)}</p>${yearText(t)}</article>
        <span class="r-pin" aria-hidden="true">${k.e}</span></div>`;
    });
    html += `<div class="r-row r-sign end"><span class="r-board finish">🏁 To be continued…</span></div>`;
    el.innerHTML = html;
    const svg = el.querySelector(".road-svg");
    let path, len = 0, car, stops = [];

    function draw() {
      const box = el.getBoundingClientRect();
      const pts = [...el.querySelectorAll(".r-row")].map(r => {
        const a = r.querySelector(".r-pin, .r-board"), b = a.getBoundingClientRect();
        return { x: b.left + b.width / 2 - box.left, y: b.top + b.height / 2 - box.top, row: r };
      });
      pts.forEach(p => { if (p.row.classList.contains("r-sign")) p.x = pts.find(q => q.row.classList.contains("r-stop")) ? box.width / 2 : p.x; });
      const narrow = box.width < 720;
      if (narrow) pts.forEach(p => p.x = pts[1] ? (el.querySelector(".r-pin").getBoundingClientRect().left + 20 - box.left) : p.x);
      let d = `M${pts[0].x},0 L${pts[0].x},${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], m = (b.y - a.y) / 2; d += ` C${a.x},${a.y + m} ${b.x},${b.y - m} ${b.x},${b.y}`; }
      d += ` L${pts.at(-1).x},${box.height}`;
      const W = narrow ? 40 : 58;
      // lanes for anything that lasted more than a year
      const spans = items.filter(t => t.to > t.from);
      const yAt = (sel) => { const r = el.querySelector(sel); return r ? r.getBoundingClientRect().top - box.top + r.offsetHeight / 2 : box.height; };
      const lanes = spans.map((t, k) => {
        const y1 = yAt(`.r-stop[data-i="${t.i}"]`), nextSign = SIGNS.find(s => s[0] > t.to);
        const y2 = nextSign ? yAt(`.r-sign[data-v="${nextSign[0]}"]`) - 24 : box.height;
        const n = spans.length, off = (k - (n - 1) / 2) * (W - 16) / Math.max(n - 1, 1);
        return `<clipPath id="lc${k}"><rect x="0" y="${y1}" width="${box.width}" height="${Math.max(0, y2 - y1)}"/></clipPath>
          <path d="${d}" class="lane" clip-path="url(#lc${k})" transform="translate(${off.toFixed(1)},0)" style="stroke:${KIND[t.kind].c}"><title>${esc(t.title)}: ${esc(t.when)}</title></path>`;
      }).join("");
      svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      svg.style.setProperty("--w", W + "px");
      svg.innerHTML = `<path d="${d}" class="verge"/><path d="${d}" class="asphalt"/><path d="${d}" class="edge"/><path d="${d}" class="asphalt inner"/>
        <path d="${d}" class="center"/>${lanes}
        <g class="car"><g transform="scale(${narrow ? .8 : 1})">
          <rect x="-17" y="-11" width="7" height="4" rx="1.5" class="tyre"/><rect x="8" y="-11" width="7" height="4" rx="1.5" class="tyre"/>
          <rect x="-17" y="7" width="7" height="4" rx="1.5" class="tyre"/><rect x="8" y="7" width="7" height="4" rx="1.5" class="tyre"/>
          <rect x="-20" y="-9" width="40" height="18" rx="7" class="body"/><rect x="2" y="-7" width="7" height="14" rx="2.5" class="glass"/>
          <rect x="-12" y="-6.5" width="5" height="13" rx="2" class="glass"/><rect x="-6" y="-7" width="7" height="14" rx="1.5" class="roof"/>
          <circle cx="19" cy="-5.5" r="1.8" class="lamp"/><circle cx="19" cy="5.5" r="1.8" class="lamp"/></g></g>`;
      path = svg.querySelector(".center"); len = path.getTotalLength(); car = svg.querySelector(".car");
      stops = [...el.querySelectorAll(".r-stop")];
      move();
    }

    let lastP = -1;
    function move() {
      if (!path) return;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * .55 - r.top) / r.height));
      if (Math.abs(p - lastP) < 1e-4) return; lastP = p;
      const at = Math.max(1, p * len), a = path.getPointAtLength(at), b = path.getPointAtLength(Math.max(0, at - 2));
      const ang = Math.atan2(a.y - b.y, a.x - b.x) * 180 / Math.PI;
      car.setAttribute("transform", `translate(${a.x.toFixed(1)},${a.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
      stops.forEach(s => { const y = s.offsetTop + s.offsetHeight / 2; s.classList.toggle("passed", a.y >= y - 30); s.classList.toggle("here", Math.abs(a.y - y) < s.offsetHeight / 2 + 10); });
    }
    let raf = 0;
    addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; move(); }); }, { passive: true });
    if ("ResizeObserver" in window) new ResizeObserver(() => { lastP = -1; draw(); }).observe(el); else { addEventListener("resize", draw); }
    draw();
    if (document.fonts) document.fonts.ready.then(() => { lastP = -1; draw(); });

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("shown"); io.unobserve(e.target); } }), { threshold: .25 });
      el.querySelectorAll(".r-stop").forEach(s => io.observe(s));
    } else el.querySelectorAll(".r-stop").forEach(s => s.classList.add("shown"));
  })();

  /* ---------- Fun flip cards (photos from content/fun/<folder>/) ---------- */
  let funPhotos = {};
  function renderFun() {
    $("#funGrid").innerHTML = S.fun.map((f, i) => {
      const extra = funPhotos[f.folder] || {}, n = (extra.photos || []).length;
      const cover = n ? `style="--cover:url('${esc(new URL(extra.photos[0], location.href).href)}')"` : "";
      return `
      <div class="flip reveal in ${n ? "has-photos" : ""}" role="button" tabindex="0" data-i="${i}" aria-label="${esc(f.title)}: ${esc(f.front)}. Flip for more.">
        <div class="flip-inner">
          <div class="flip-face flip-front" ${cover}>
            <span class="fi" aria-hidden="true">${f.icon}</span>
            ${n ? `<span class="photo-count">📸 ${n}</span>` : ""}
            <div><h4>${esc(f.title)}</h4><small>${esc(f.front)}</small></div>
          </div>
          <div class="flip-face flip-back"><p>${esc(extra.story || f.back)}</p>
            ${n ? `<button class="see-photos" data-folder="${esc(f.folder)}">See ${n} photo${n > 1 ? "s" : ""} →</button>` : ""}</div>
        </div>
      </div>`;
    }).join("");
  }
  renderFun();
  fetch("content/fun/fun.json", { cache: "no-cache" }).then(r => r.ok ? r.json() : {}).then(j => { funPhotos = j || {}; renderFun(); }).catch(() => {});
  $("#funGrid").addEventListener("click", (e) => {
    const sp = e.target.closest(".see-photos");
    if (sp) {
      e.stopPropagation();
      const f = S.fun.find(x => x.folder === sp.dataset.folder);
      openLightbox(funPhotos[f.folder].photos.map(src => ({ src, alt: f.title, caption: `${f.icon} ${f.title}` })), 0);
      return;
    }
    const c = e.target.closest(".flip"); if (c) c.classList.toggle("flipped");
  });
  $("#funGrid").addEventListener("keydown", (e) => {
    const c = e.target.closest(".flip"); if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); c.classList.toggle("flipped"); }
  });

  /* ---------- Art gallery (data-driven) ---------- */
  (async function loadArt() {
    let pieces = [];
    try {
      const res = await fetch("content/art/captions.json", { cache: "no-cache" });
      if (res.ok) pieces = ((await res.json()).pieces || []).filter(p => p.file && !String(p.title).startsWith("TODO"));
    } catch { /* not added yet */ }
    const el = $("#gallery");
    if (!pieces.length) {
      if (!window.SHOW_MISSING_INFO) { el.hidden = true; return; }
      el.classList.add("is-empty");
      el.innerHTML = `<div class="empty-art">
          <div class="frame">🖼️</div><div class="frame">✏️</div><div class="frame">🎨</div>
        </div>${dropbox(["Artwork images in content/art/images/", "A captions.json with title, medium, date and an optional note for each piece"],
          "Copy <code>content/art/captions-template.json</code> → <code>captions.json</code> and fill it in. The gallery picks it up automatically.")}`;
      return;
    }
    const items = pieces.map(p => ({
      src: "content/art/" + p.file,
      alt: p.alt || `${p.title}, ${p.medium}`,
      caption: `${p.title} · ${p.medium}${p.date ? " · " + p.date : ""}${p.note ? ". " + p.note : ""}`
    }));
    el.innerHTML = pieces.map((p, i) => `
      <figure class="reveal"><button data-i="${i}" aria-label="Open ${esc(p.title)}">
        <img src="${esc(items[i].src)}" alt="${esc(items[i].alt)}" loading="lazy">
        <figcaption><b>${esc(p.title)}</b><span>${esc(p.medium)}${p.date ? " · " + esc(p.date) : ""}</span></figcaption>
      </button></figure>`).join("");
    el.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b) openLightbox(items, +b.dataset.i); });
    observeReveals();
  })();

  /* ---------- Lightbox ---------- */
  const lb = $("#lightbox"); let lbItems = [], lbIdx = 0;
  function renderLb() {
    const it = lbItems[lbIdx];
    $("#lbImg").src = it.src; $("#lbImg").alt = it.alt || ""; $("#lbCap").textContent = it.caption || "";
    const multi = lbItems.length > 1;
    $("#lbPrev").style.visibility = $("#lbNext").style.visibility = multi ? "visible" : "hidden";
  }
  window.openLightbox = function (items, i) { lbItems = items; lbIdx = i; renderLb(); lb.showModal(); };
  $("#lbClose").onclick = () => lb.close();
  $("#lbPrev").onclick = () => { lbIdx = (lbIdx - 1 + lbItems.length) % lbItems.length; renderLb(); };
  $("#lbNext").onclick = () => { lbIdx = (lbIdx + 1) % lbItems.length; renderLb(); };
  lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") $("#lbPrev").click(); if (e.key === "ArrowRight") $("#lbNext").click(); });

  /* ---------- Toast ---------- */
  let tt;
  window.toast = function (msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2200);
  };

  /* ---------- Confetti ---------- */
  const cv = $("#confetti"), cx = cv.getContext("2d"); let parts = [], running = false;
  function confetti(x = innerWidth / 2, y = innerHeight / 3) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cv.width = innerWidth; cv.height = innerHeight;
    const css = getComputedStyle(document.documentElement);
    const cols = ["--red", "--blue", "--gold", "--green", "--purple"].map(v => css.getPropertyValue(v).trim());
    for (let i = 0; i < 120; i++) parts.push({
      x, y, vx: (Math.random() - .5) * 14, vy: Math.random() * -12 - 3, r: Math.random() * 6 + 3,
      c: cols[i % cols.length], a: Math.random() * 6, life: 0, puck: i % 15 === 0
    });
    if (!running) { running = true; requestAnimationFrame(tick); }
  }
  function tick() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts.forEach(p => {
      p.vy += .35; p.x += p.vx; p.y += p.vy; p.a += .15; p.life++;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.puck ? "#111" : p.c;
      if (p.puck) { cx.beginPath(); cx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2); cx.fill(); }
      else cx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6);
      cx.restore();
    });
    parts = parts.filter(p => p.y < cv.height + 20 && p.life < 240);
    if (parts.length) requestAnimationFrame(tick); else { running = false; cx.clearRect(0, 0, cv.width, cv.height); }
  }

  /* ---------- Rink goals ---------- */
  let goals = 0;
  window.addEventListener("rink-goal", (e) => {
    goals++; $("#goals").textContent = goals;
    const flash = $("#goalFlash"); flash.classList.add("show");
    const r = $("#rink").getBoundingClientRect();
    confetti(e.detail.side === "left" ? r.left + r.width * .08 : r.right - r.width * .08, r.top + r.height / 2);
    setTimeout(() => flash.classList.remove("show"), 900);
    const target = e.detail.side === "left" ? "#fun" : "#projects";
    toast(e.detail.side === "left" ? "🥳 Goal! Heading to the fun side…" : "🎯 Goal! Heading to projects…");
    setTimeout(() => document.querySelector(target).scrollIntoView({ behavior: "smooth" }), 1000);
  });

  /* ---------- Easter egg: type "goal" ---------- */
  let buf = "";
  window.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea")) return;
    buf = (buf + e.key.toLowerCase()).slice(-4);
    if (buf === "goal") { confetti(); toast("🚨 GOOOAL! You found the easter egg."); }
  });

  /* ---------- Theme & 30-sec view ---------- */
  const root = document.documentElement;
  const storage = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
  const savedTheme = storage.get("theme"); if (savedTheme) root.dataset.theme = savedTheme;
  $("#themeToggle").onclick = () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark"; storage.set("theme", root.dataset.theme);
  };
  const skimBtn = $("#skimToggle");
  function setSkim(on) {
    document.body.classList.toggle("skim", on); skimBtn.setAttribute("aria-pressed", on);
    storage.set("skim", on ? "1" : "0");
  }
  setSkim(storage.get("skim") === "1");
  skimBtn.onclick = () => { const on = !document.body.classList.contains("skim"); setSkim(on); toast(on ? "30-sec view: just the essentials" : "Full view: fun side unlocked 🎉"); };

  /* ---------- Copy email ---------- */
  $("#copyEmail").onclick = async () => {
    try { await navigator.clipboard.writeText(P.email); toast("📋 Email copied!"); }
    catch { location.href = "mailto:" + P.email; }
  };

  /* ---------- Reveal on scroll ---------- */
  const io = "IntersectionObserver" in window ? new IntersectionObserver((ents) => ents.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { threshold: .12 }) : null;
  function observeReveals() {
    document.querySelectorAll(".reveal:not(.in)").forEach(el => io ? io.observe(el) : el.classList.add("in"));
  }
  observeReveals();

  $("#year").textContent = new Date().getFullYear();
})();
