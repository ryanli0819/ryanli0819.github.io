/* Interactive travel map.
   Data: content/travel/countries.json — generate it with `python3 tools/build_travel.py`
   after dropping photos into content/travel/photos/<Country Name>/.
   Hovering a visited country opens a pop-up window with its photos and story;
   clicking (or Enter) opens the full photo gallery. */
(function () {
  const mapEl = document.getElementById("map");
  const tip = document.getElementById("mapTip");
  const pop = document.getElementById("mapPop");
  if (!mapEl) return;

  const ALIASES = {
    "united states": "united states of america", "usa": "united states of america", "us": "united states of america", "america": "united states of america",
    "uk": "united kingdom", "great britain": "united kingdom", "england": "united kingdom", "scotland": "united kingdom",
    "korea": "south korea", "republic of korea": "south korea", "czech republic": "czechia", "holland": "netherlands",
    "hong kong": "china", "macau": "china", "macao": "china", "uae": "united arab emirates", "dubai": "united arab emirates",
    "türkiye": "turkey", "turkiye": "turkey",
    "dominican republic": "dominican rep.", "bosnia": "bosnia and herz.", "bosnia and herzegovina": "bosnia and herz."
  };
  const norm = (s) => { const k = String(s || "").trim().toLowerCase(); return ALIASES[k] || k; };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const photoSrc = (p) => p.startsWith("http") || p.startsWith("content/") ? p : "content/travel/" + p;

  async function loadTravel() {
    try {
      const res = await fetch("content/travel/countries.json", { cache: "no-cache" });
      if (!res.ok) return [];
      const json = await res.json();
      return (json.countries || []).filter(c => c && c.name && !String(c.name).startsWith("TODO"));
    } catch { return []; }
  }

  async function init() {
    if (!window.d3 || !window.topojson) { mapEl.innerHTML = '<p class="map-loading">Map couldn\'t load (offline?).</p>'; return; }
    const [world, visited] = await Promise.all([
      d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json").catch(() => null),
      loadTravel()
    ]);
    if (!world) { mapEl.innerHTML = '<p class="map-loading">Map couldn\'t load (offline?).</p>'; return; }

    const byName = new Map(), byNum = new Map();
    visited.forEach(c => { byName.set(norm(c.name), c); if (c.isoNumeric) byNum.set(String(c.isoNumeric).padStart(3, "0"), c); });
    const lookup = (f) => byNum.get(String(f.id)) || byName.get(norm(f.properties.name));

    const features = topojson.feature(world, world.objects.countries).features.filter(f => f.properties.name !== "Antarctica");
    const width = 960, height = 470;
    const projection = d3.geoNaturalEarth1().fitExtent([[8, 8], [width - 8, height - 8]], { type: "FeatureCollection", features });
    const path = d3.geoPath(projection);

    mapEl.innerHTML = "";
    const svg = d3.select(mapEl).append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("role", "group")
      .attr("aria-label", visited.length ? `World map. ${visited.length} visited countries are highlighted; tab to one to see photos.` : "World map");
    const g = svg.append("g");
    g.append("path").attr("class", "graticule").attr("d", path(d3.geoGraticule10()));

    let hideTimer, current = null;
    const box = () => mapEl.parentElement.getBoundingClientRect();

    function showPop(c, x, y) {
      clearTimeout(hideTimer);
      if (current !== c) {
        current = c;
        const photos = (c.photos || []).slice(0, 4);
        pop.innerHTML = `
          <div class="pop-head"><b>📍 ${esc(c.name)}</b>${c.datesVisited ? `<span>${esc(c.datesVisited)}</span>` : ""}</div>
          ${photos.length ? `<div class="pop-photos n${photos.length}">${photos.map((p, i) => `<button data-i="${i}" aria-label="Open photo ${i + 1} from ${esc(c.name)}"><img src="${esc(photoSrc(p))}" alt="" loading="lazy"></button>`).join("")}</div>`
                          : `<div class="pop-empty">📸 photos coming soon</div>`}
          ${c.note ? `<p class="pop-note">${esc(c.note)}</p>` : ""}
          ${(c.photos || []).length ? `<button class="pop-more" data-i="0">See all ${c.photos.length} photo${c.photos.length > 1 ? "s" : ""} →</button>` : ""}`;
      }
      const b = box(), pw = pop.offsetWidth || 300, ph = pop.offsetHeight || 260;
      let left = x - b.left + 18, top = y - b.top - ph / 2;
      if (left + pw > b.width - 8) left = x - b.left - pw - 18;
      top = Math.max(8, Math.min(b.height - ph - 8, top));
      pop.style.left = Math.max(8, left) + "px"; pop.style.top = top + "px";
      pop.classList.add("show"); tip.classList.remove("show");
    }
    const hidePop = () => { hideTimer = setTimeout(() => { pop.classList.remove("show"); current = null; }, 250); };
    pop.addEventListener("mouseenter", () => clearTimeout(hideTimer));
    pop.addEventListener("mouseleave", hidePop);
    pop.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b && current) openGallery(current, +b.dataset.i); });

    function showTip(ev, f) {
      const b = box();
      tip.textContent = f.properties.name;
      tip.style.left = ev.clientX - b.left + "px"; tip.style.top = ev.clientY - b.top + "px";
      tip.classList.add("show");
    }

    function openGallery(c, i) {
      const photos = (c.photos || []).map(p => ({ src: photoSrc(p), alt: `Photo from ${c.name}`, caption: `${c.name}${c.note ? ": " + c.note : ""}` }));
      if (photos.length) window.openLightbox(photos, i || 0);
      else window.toast(`${c.name}: photos coming soon`);
    }

    g.selectAll("path.country").data(features).join("path")
      .attr("class", f => { const c = lookup(f); return "country" + (c ? " visited" : "") + (c && c.home ? " home" : ""); })
      .attr("d", path)
      .attr("tabindex", f => lookup(f) ? 0 : null)
      .attr("role", f => lookup(f) ? "button" : null)
      .attr("aria-label", f => { const c = lookup(f); return c ? `${c.name}. Show photos.` : null; })
      .on("mousemove", (ev, f) => { const c = lookup(f); c ? showPop(c, ev.clientX, ev.clientY) : (hidePop(), showTip(ev, f)); })
      .on("mouseleave", (ev, f) => { tip.classList.remove("show"); if (lookup(f)) hidePop(); })
      .on("click", (ev, f) => { const c = lookup(f); if (!c) return; if (ev.pointerType === "touch" || matchMedia("(hover: none)").matches) showPop(c, ev.clientX, ev.clientY); else openGallery(c, 0); })
      .on("keydown", (ev, f) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); openGallery(lookup(f), 0); } })
      .on("focus", (ev, f) => { const r = ev.target.getBoundingClientRect(); showPop(lookup(f), r.left + r.width / 2, r.top + r.height / 2); })
      .on("blur", hidePop);

    svg.call(d3.zoom().scaleExtent([1, 8]).translateExtent([[0, 0], [width, height]]).on("zoom", (ev) => { g.attr("transform", ev.transform); pop.classList.remove("show"); }));

    window.dispatchEvent(new CustomEvent("travel-loaded", { detail: { count: visited.length } }));
  }
  init();
})();
