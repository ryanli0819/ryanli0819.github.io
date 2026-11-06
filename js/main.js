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
  const words = ["hockey film", "live-stream chat", "flight-sim data", "warehouse inventory", "Titanic manifests"];
  let wi = 0;
  const rot = $("#rotator");
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setInterval(() => {
      rot.classList.add("out");
      setTimeout(() => { wi = (wi + 1) % words.length; rot.textContent = words[wi]; rot.classList.remove("out"); }, 250);
    }, 2400);
  }

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
    const links = p.links.length
      ? p.links.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join("")
      : `<span class="nolink">Link coming soon</span>`;
    const metrics = p.metrics.length
      ? `<div class="metrics">${p.metrics.map(m => `<div class="metric"><b>${esc(m.value)}</b><span>${esc(m.label)}</span></div>`).join("")}</div>` : "";
    const media = p.video
      ? `<video src="${esc(p.video)}" muted loop playsinline autoplay controls preload="metadata" aria-label="Demo of ${esc(p.title)} running on game footage"></video>` : "";
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
      <details class="more">
        <summary><span class="chev">▸</span> More info${needCount ? `<span class="need">${needCount} to add</span>` : ""}</summary>
        <div class="more-body">
          ${p.details.length ? `<ul class="did">${p.details.map(d => `<li>${esc(d)}</li>`).join("")}</ul>` : `<p style="margin:0;color:var(--ink-3)">More details on the way.</p>`}
          ${dropbox(p.missing, `Edit project <code>${esc(p.id)}</code> in <code>js/data.js</code>.`)}
        </div>
      </details>`;
    const body = p.featured && media
      ? `<div class="featured-body"><div>${main}</div><div>${media}</div></div>`
      : main + media;
    return `<article class="project reveal ${p.featured ? "featured" : ""}" data-tags="${[...p.tags, p.era].join(" ")}" id="p-${esc(p.id)}">
      ${head}${body}${more}</article>`;
  }
  $("#projectList").innerHTML = S.projects.map(projectCard).join("");

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

  /* ---------- Timeline ---------- */
  $("#timelineList").innerHTML = S.timeline.map((t, i) => `
    <li class="tl-item tl-${t.kind}">
      <div class="tl-dot"></div>
      <button class="tl-card" aria-expanded="${i === 0}">
        <span class="tl-when">${esc(t.when)}</span>
        <span class="tl-title">${esc(t.title)}</span>
        <span class="tl-text">${esc(t.text)}</span>
      </button>
    </li>`).join("");
  $("#timelineList").addEventListener("click", (e) => {
    const b = e.target.closest(".tl-card"); if (!b) return;
    b.setAttribute("aria-expanded", b.getAttribute("aria-expanded") !== "true");
  });

  /* ---------- Fun flip cards ---------- */
  $("#funGrid").innerHTML = S.fun.map(f => `
    <button class="flip reveal" aria-label="${esc(f.title)}: ${esc(f.front)}. Flip for more.">
      <div class="flip-inner">
        <div class="flip-face flip-front">
          <span class="fi" aria-hidden="true">${f.icon}</span>
          <div><h4>${esc(f.title)}</h4><small>${esc(f.front)}</small></div>
        </div>
        <div class="flip-face flip-back">${esc(f.back)}</div>
      </div>
    </button>`).join("");
  $("#funGrid").addEventListener("click", (e) => {
    const c = e.target.closest(".flip"); if (c) c.classList.toggle("flipped");
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
      if (!window.SHOW_MISSING_INFO) { el.hidden = true; $("#artHead").hidden = true; return; }
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

  window.addEventListener("travel-loaded", (e) => {
    if (e.detail.count) return;
    $("#mapSub").textContent = "Hover around the world. Travel pins are on the way.";
    $("#travelEmpty").innerHTML = dropbox(["List of countries you've visited", "Photos for each country (content/travel/photos/<country>/)"],
      "Copy <code>content/travel/countries-template.json</code> → <code>countries.json</code>. Each country you add lights up on the map.");
  });

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
