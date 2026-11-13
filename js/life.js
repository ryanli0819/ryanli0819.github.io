/* "Life in frames": motion components in the spirit of Skiper UI, built without a framework.
   - Hero video that shrinks into a card as you scroll
   - Pinned horizontal highlight reel (videos play when on screen)
   - Hockey accordion, 3D photo ring (with an optional Spline scene), food cursor trail, photo marquees
   Media lives in assets/life/; the lists are in window.LIFE (js/data.js). */
(function () {
  const L = window.LIFE; if (!L) return;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const IMG = (slug) => `assets/life/img/${slug}.jpg`, VID = (f) => `assets/life/video/${f}`;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const asItems = (list) => list.map(([slug, cap]) => ({ src: IMG(slug), alt: cap, caption: cap }));
  const track = (name) => window.track && window.track(name, name);

  /* ---------- Split-letter name ---------- */
  const h1 = $(".split-in > span[aria-hidden]");
  if (h1) h1.innerHTML = [...h1.textContent].map((ch, i) => `<i style="--d:${i * 55}ms">${ch === " " ? "&nbsp;" : esc(ch)}</i>`).join("");

  /* ---------- Hero video: scale into a card on scroll ---------- */
  const stage = $("#heroStage"), media = $(".hero-media"), hv = $("#heroVideo");
  if (reduce && hv) { hv.removeAttribute("autoplay"); hv.pause(); }
  function heroScroll() {
    if (!stage) return;
    const r = stage.getBoundingClientRect(), p = clamp(-r.top / (stage.offsetHeight * .9));
    const off = r.top > innerHeight || p >= 1;
    media.style.setProperty("--p", p.toFixed(3));
    if (hv && !reduce) { if (off && !hv.paused) hv.pause(); else if (!off && hv.paused) hv.play().catch(() => {}); }
  }

  /* ---------- Video lightbox ---------- */
  const vbox = $("#vbox"), vbv = $("#vbVideo");
  function openVideo(v) {
    vbv.src = VID(v.src); $("#vbCap").textContent = v.cap; vbox.showModal(); vbv.muted = false; vbv.play().catch(() => {});
    track("video/" + v.src);
  }
  $("#vbClose").addEventListener("click", () => vbox.close());
  vbox.addEventListener("close", () => { vbv.pause(); vbv.removeAttribute("src"); vbv.load(); });
  vbox.addEventListener("click", (e) => { if (e.target === vbox) vbox.close(); });

  /* ---------- Highlight reel: a 2-second countdown, then one sport after another with a 1-second card in between ---------- */
  const rv = $("#rlVideo"), card = $("#rlCard"), sportsBar = $("#rlSports"), stageEl = $("#rlStage");
  sportsBar.innerHTML = L.reel.map((r, i) => `<button class="rl-sport" role="tab" data-i="${i}" aria-label="${esc(r.sport)}"><span>${r.icon}</span><small>${esc(r.sport)}</small><i><b></b></i></button>`).join("");
  const bars = [...sportsBar.querySelectorAll(".rl-sport")];
  let cur = -1, started = false, inView = false, timer = null;
  function showCard(i, text, ms, then) {
    const r = L.reel[i]; $("#rlIcon").textContent = r.icon; $("#rlName").textContent = r.sport; $("#rlCount").textContent = text || "";
    card.classList.add("show"); clearTimeout(timer);
    if (text === "2") timer = setTimeout(() => { $("#rlCount").textContent = "1"; timer = setTimeout(() => { card.classList.remove("show"); then(); }, ms / 2); }, ms / 2);
    else timer = setTimeout(() => { card.classList.remove("show"); then(); }, ms);
  }
  function play(i) {
    cur = i; const r = L.reel[i];
    bars.forEach((b, k) => { b.classList.toggle("on", k === i); b.classList.toggle("done", k < i); if (k >= i) b.querySelector("b").style.transform = "scaleX(0)"; });
    stageEl.classList.toggle("tall", !!r.tall);
    $("#rlTag").innerHTML = `${r.icon} <b>${esc(r.sport)}</b> · ${esc(r.note)}`;
    rv.src = VID(r.src); rv.currentTime = 0;
    if (inView) rv.play().catch(() => {});
  }
  function next() { const n = cur + 1; if (n < L.reel.length) showCard(n, "", 1000, () => play(n)); else { bars.forEach(b => b.classList.add("done")); showCard(0, "↻ again", 1500, () => play(0)); } }
  rv.addEventListener("ended", next);
  rv.addEventListener("timeupdate", () => { if (cur >= 0 && rv.duration) bars[cur].querySelector("b").style.transform = `scaleX(${(rv.currentTime / rv.duration).toFixed(3)})`; });
  sportsBar.addEventListener("click", (e) => { const b = e.target.closest(".rl-sport"); if (!b) return; started = true; clearTimeout(timer); card.classList.remove("show"); play(+b.dataset.i); track("reel/" + L.reel[+b.dataset.i].sport); });
  $("#rlSound").addEventListener("click", (e) => { rv.muted = !rv.muted; e.currentTarget.textContent = rv.muted ? "🔇 Sound off" : "🔊 Sound on"; e.currentTarget.setAttribute("aria-pressed", String(!rv.muted)); });
  if ("IntersectionObserver" in window) new IntersectionObserver(es => {
    inView = es[0].isIntersecting;
    if (inView && !started) { started = true; showCard(0, "2", 2000, () => play(0)); }
    else if (inView && cur >= 0 && !card.classList.contains("show")) rv.play().catch(() => {});
    else if (!inView) rv.pause();
  }, { threshold: 0.5 }).observe(stageEl);

  /* ---------- Hockey accordion ---------- */
  const acc = $("#hockeyAcc"), hockey = asItems(L.hockey);
  acc.innerHTML = L.hockey.map(([slug, cap], i) => `
    <button class="acc-item ${i === 0 ? "open" : ""}" data-i="${i}" aria-label="${esc(cap)}. Open gallery.">
      <img src="${IMG(slug)}" alt="" loading="lazy"><span class="acc-cap"><b>${String(i + 1).padStart(2, "0")}</b> ${esc(cap)}</span>
    </button>`).join("");
  const openAcc = (b) => { acc.querySelectorAll(".open").forEach(x => x !== b && x.classList.remove("open")); b.classList.add("open"); };
  acc.addEventListener("mouseover", (e) => { const b = e.target.closest(".acc-item"); if (b) openAcc(b); });
  acc.addEventListener("focusin", (e) => { const b = e.target.closest(".acc-item"); if (b) openAcc(b); });
  acc.addEventListener("click", (e) => { const b = e.target.closest(".acc-item"); if (b) window.openLightbox(hockey, +b.dataset.i); });

  /* ---------- 3D photo ring (+ optional Spline scene) ---------- */
  const ringStage = $("#ringStage"), ring = $("#ring"), world = asItems(L.world), N = world.length;
  if (window.SPLINE_SCENE && /^https:\/\/my\.spline\.design\//.test(window.SPLINE_SCENE)) {
    ringStage.insertAdjacentHTML("beforebegin", `<div class="spline-frame"><iframe src="${esc(window.SPLINE_SCENE)}" title="3D scene made in Spline" loading="lazy" allow="fullscreen"></iframe></div>`);
  }
  ring.innerHTML = L.world.map(([slug, cap], i) => `
    <button class="ring-item" data-i="${i}" style="--a:${(360 / N) * i}deg" aria-label="${esc(cap)}">
      <img src="${IMG(slug)}" alt="" loading="lazy" draggable="false"><span>${esc(cap)}</span></button>`).join("");
  const items = [...ring.children];
  let angle = 0, vel = reduce ? 0 : .12, dragging = false, lastX = 0, moved = 0, ringVisible = false;
  function layoutRing() {
    const w = innerWidth < 720 ? 150 : 210;
    ring.style.setProperty("--w", w + "px");
    ring.style.setProperty("--r", Math.round(w / (2 * Math.tan(Math.PI / N)) + 24) + "px");
  }
  function drawRing() {
    ring.style.transform = `translateZ(calc(var(--r) * -1)) rotateY(${angle}deg)`;
    items.forEach((it, i) => {
      const c = Math.cos(((360 / N) * i + angle) * Math.PI / 180);
      it.style.setProperty("--f", ((c + 1) / 2).toFixed(3));
      it.classList.toggle("front", c > .93);
    });
  }
  function spin() {
    if (ringVisible) {
      if (!dragging) { angle -= vel; vel += ((reduce ? 0 : .12) - vel) * .02; }
      drawRing();
    }
    requestAnimationFrame(spin);
  }
  ringStage.addEventListener("pointerdown", (e) => { dragging = true; moved = 0; lastX = e.clientX; ringStage.setPointerCapture(e.pointerId); });
  ringStage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
    angle += dx * .25; vel = -dx * .25;
  });
  const endDrag = (e) => {
    if (!dragging) return; dragging = false;
    if (moved < 6) {
      const el = document.elementsFromPoint(e.clientX, e.clientY).find(x => x.classList && x.classList.contains("ring-item"));
      if (el) window.openLightbox(world, +el.dataset.i);
    }
  };
  ringStage.addEventListener("pointerup", endDrag);
  ringStage.addEventListener("pointercancel", () => dragging = false);
  ring.addEventListener("keydown", (e) => { const b = e.target.closest(".ring-item"); if (b && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); window.openLightbox(world, +b.dataset.i); } });
  ring.addEventListener("focusin", (e) => { const b = e.target.closest(".ring-item"); if (b) { angle = -(360 / N) * +b.dataset.i; vel = 0; drawRing(); } });
  if ("IntersectionObserver" in window) new IntersectionObserver(es => ringVisible = es[0].isIntersecting).observe(ringStage); else ringVisible = true;
  layoutRing(); drawRing(); requestAnimationFrame(spin);

  /* ---------- Food cursor trail ---------- */
  const trail = $("#eatTrail"), cap = $("#trailCap");
  L.eats.forEach(([slug]) => { const im = new Image(); im.src = IMG(slug); });
  let k = 0, lx = -999, ly = -999, live = [];
  function drop(x, y) {
    const [slug, name] = L.eats[k++ % L.eats.length];
    const im = document.createElement("img");
    im.src = IMG(slug); im.alt = ""; im.className = "trail-img";
    im.style.left = x + "px"; im.style.top = y + "px"; im.style.setProperty("--rot", (Math.random() * 16 - 8).toFixed(1) + "deg");
    trail.appendChild(im); live.push(im);
    cap.textContent = name; trail.classList.add("used");
    setTimeout(() => im.classList.add("out"), 900);
    setTimeout(() => { im.remove(); live = live.filter(x => x !== im); }, 1500);
    if (live.length > 9) live.shift().remove();
  }
  trail.addEventListener("pointermove", (e) => {
    const r = trail.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (Math.hypot(x - lx, y - ly) > (innerWidth < 720 ? 50 : 90)) { lx = x; ly = y; drop(x, y); }
  });
  trail.addEventListener("pointerdown", (e) => { const r = trail.getBoundingClientRect(); lx = e.clientX - r.left; ly = e.clientY - r.top; drop(lx, ly); });
  trail.style.touchAction = "pan-y";

  /* ---------- Marquees ---------- */
  const people = asItems(L.people), half = Math.ceil(L.people.length / 2);
  [[$("#mq1"), L.people.slice(0, half), 0], [$("#mq2"), L.people.slice(half), half]].forEach(([el, list, off]) => {
    const cells = list.map(([slug, c], j) => `<button class="mq-item" data-i="${off + j}" aria-label="${esc(c)}"><img src="${IMG(slug)}" alt="" loading="lazy"><span>${esc(c)}</span></button>`).join("");
    el.innerHTML = `<div class="mq-row">${cells}${cells.replace(/<button /g, '<button tabindex="-1" aria-hidden="true" ')}</div>`;
    el.addEventListener("click", (e) => { const b = e.target.closest(".mq-item"); if (b) window.openLightbox(people, +b.dataset.i); });
  });

  /* ---------- Scroll + resize ---------- */
  let raf = 0;
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; heroScroll(); }); };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", layoutRing);
  heroScroll();
})();
