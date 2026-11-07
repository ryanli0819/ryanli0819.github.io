/* Visitor tracking via GoatCounter (privacy-friendly: no cookies, no personal data).
   Counts page views plus a few events so you can see what visitors engage with:
   project windows opened, demo videos played, résumé/GitHub/Canva clicks, countries
   hovered, rink goals. Does nothing until ANALYTICS.goatcounter is set in js/data.js. */
(function () {
  const code = (window.ANALYTICS || {}).goatcounter;
  window.track = function () {};
  if (!code) return;
  const endpoint = `https://${code}.goatcounter.com/count`;

  const s = document.createElement("script");
  s.async = true; s.src = "https://gc.zgo.at/count.js";
  s.dataset.goatcounter = endpoint;
  document.head.appendChild(s);

  const queue = [];
  window.track = function (name, title) {
    const ev = { path: name, title: title || name, event: true };
    if (window.goatcounter && window.goatcounter.count) window.goatcounter.count(ev);
    else queue.push(ev);
  };
  s.addEventListener("load", () => { queue.splice(0).forEach(ev => window.goatcounter.count(ev)); });

  // Clicks on links/buttons worth knowing about
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a, button"); if (!a) return;
    const href = a.getAttribute("href") || "";
    if (href.includes("Ryan_Li_Resume.pdf")) track("click-resume", "Résumé opened");
    else if (href.includes("github.com/ryanli0819")) track("click-github" + (href.split("ryanli0819")[1] || ""), "GitHub link");
    else if (href.includes("canva.com")) track("click-canva", "Canva portfolio opened");
    else if (href.startsWith("mailto:") || a.id === "copyEmail") track("click-email", "Email clicked");
    else if (a.dataset.open) track("project-" + a.dataset.open, "Project window: " + a.dataset.open);
  }, true);

  // Demo videos played (first play only per video)
  document.addEventListener("play", (e) => {
    const v = e.target; if (!(v instanceof HTMLVideoElement) || v.dataset.tracked || !v.controls) return;
    if (!v.closest("#projModal")) return;
    v.dataset.tracked = "1";
    track("demo-play/" + (v.currentSrc.split("/").pop() || "video"), "Demo video played");
  }, true);

  window.addEventListener("rink-goal", () => track("rink-goal", "Scored a goal on the rink"));
  let hovered = new Set();
  window.addEventListener("country-hover", (e) => {
    if (hovered.has(e.detail)) return; hovered.add(e.detail);
    track("country/" + e.detail, "Hovered country: " + e.detail);
  });

  // Public visitor counter (only if enabled in GoatCounter settings)
  fetch(`https://${code}.goatcounter.com/counter/TOTAL.json`).then(r => r.ok ? r.json() : null).then(j => {
    const el = document.getElementById("visitorCount");
    if (j && j.count && el) { el.textContent = `👀 ${j.count} visitors so far`; el.hidden = false; }
  }).catch(() => {});
})();
