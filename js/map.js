/* Interactive travel map.
   Reads content/travel/countries.json (same shape as countries-template.json).
   A country is matched by its "name" (as spelled in the world atlas, e.g.
   "United States of America", "China", "Japan") or by "isoNumeric"
   (e.g. "840" for the USA). Add `"home": true` to colour your home country gold. */
(function () {
  const mapEl = document.getElementById("map");
  const tip = document.getElementById("mapTip");
  if (!mapEl) return;

  // Common alternate spellings → the name used in the world-atlas file.
  const ALIASES = {
    "united states": "united states of america", "usa": "united states of america", "us": "united states of america",
    "uk": "united kingdom", "great britain": "united kingdom", "england": "united kingdom",
    "south korea": "south korea", "korea": "south korea", "czech republic": "czechia",
    "hong kong": "china", "macau": "china", "uae": "united arab emirates"
  };
  const norm = (s) => { const k = String(s || "").trim().toLowerCase(); return ALIASES[k] || k; };

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

    const features = topojson.feature(world, world.objects.countries).features
      .filter(f => f.properties.name !== "Antarctica");
    const width = 960, height = 470;
    const projection = d3.geoNaturalEarth1().fitExtent([[8, 8], [width - 8, height - 8]], { type: "FeatureCollection", features });
    const path = d3.geoPath(projection);

    mapEl.innerHTML = "";
    const svg = d3.select(mapEl).append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "group")
      .attr("aria-label", visited.length ? `World map. ${visited.length} visited countries are highlighted; tab to them and press Enter to see photos.` : "World map");

    const g = svg.append("g");
    g.append("path").attr("class", "graticule").attr("d", path(d3.geoGraticule10()));

    g.selectAll("path.country").data(features).join("path")
      .attr("class", f => { const c = lookup(f); return "country" + (c ? " visited" : "") + (c && c.home ? " home" : ""); })
      .attr("d", path)
      .attr("tabindex", f => lookup(f) ? 0 : null)
      .attr("role", f => lookup(f) ? "button" : null)
      .attr("aria-label", f => { const c = lookup(f); return c ? `${c.name}${c.datesVisited ? ", " + c.datesVisited : ""}. Open photos.` : null; })
      .on("mousemove", (ev, f) => showTip(ev, f))
      .on("mouseleave", () => tip.classList.remove("show"))
      .on("click", (ev, f) => openCountry(lookup(f)))
      .on("keydown", (ev, f) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); openCountry(lookup(f)); } })
      .on("focus", (ev, f) => { const b = ev.target.getBoundingClientRect(); showTip({ clientX: b.left + b.width / 2, clientY: b.top + b.height / 2 }, f); })
      .on("blur", () => tip.classList.remove("show"));

    // zoom & pan
    svg.call(d3.zoom().scaleExtent([1, 8]).translateExtent([[0, 0], [width, height]])
      .on("zoom", (ev) => g.attr("transform", ev.transform)));

    function showTip(ev, f) {
      const c = lookup(f);
      const box = mapEl.parentElement.getBoundingClientRect();
      tip.textContent = c ? `📍 ${c.name}${c.photos && c.photos.length ? ` · ${c.photos.length} photo${c.photos.length > 1 ? "s" : ""}` : ""}` : f.properties.name;
      tip.style.left = ev.clientX - box.left + "px";
      tip.style.top = ev.clientY - box.top + "px";
      tip.classList.add("show");
    }

    function openCountry(c) {
      if (!c) return;
      const photos = (c.photos || []).map(p => ({
        src: p.startsWith("http") || p.startsWith("content/") ? p : "content/travel/" + p,
        caption: `${c.name}${c.datesVisited ? " · " + c.datesVisited : ""}${c.note ? ": " + c.note : ""}`,
        alt: `Photo from ${c.name}`
      }));
      if (photos.length) window.openLightbox(photos, 0);
      else window.toast(`${c.name}: no photos added yet`);
    }

    window.dispatchEvent(new CustomEvent("travel-loaded", { detail: { count: visited.length } }));
  }

  init();
})();
