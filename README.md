# Ryan Li — Personal Website Project

This folder is the starting kit for building Ryan's personal website with Claude Code. It is meant to be opened as a project folder (`cd` into it, then run `claude`) so the agent has everything it needs without having to ask Ryan to re-explain the project from scratch.

## Start here, in order

1. Read `BRIEF.md` — the full spec: what the site is, its three sections, design direction, and a recommended (not mandatory) tech stack.
2. Read everything under `content/` — this is the real written content for the site, already drafted from Ryan's resume and this conversation. Some files have `TODO` markers where a link, image, or detail is still missing — see `content/projects/_TODO-links-and-info.md` for the full checklist.
3. Check `assets/resume/` — Ryan's current resume (PDF) is there for reference on formatting, phrasing, and any detail not already copied into `content/`.
4. `content/art/` and `content/travel/` are currently near-empty — they have a README and a template data file each, because Ryan still needs to supply the actual images and travel data. Don't invent placeholder art or fabricate countries/photos; ask Ryan directly for these, or build the gallery/map components against the template schema so they're ready the moment he drops real files in.

## What Ryan asked for (in his words, paraphrased)

A single personal site, public, that shows both sides of him:

- **Professional/technical side** — every project he's done, high school through college, each one properly described and linked to its real source (GitHub repo, published paper, competition leaderboard, etc. — not invented).
- **Fun side** — an art portfolio section, and an interactive world map where visited countries can be clicked to explore photos stored for that country.

He wants to build this with Claude Code (the CLI), which is why this is a local project folder rather than something built remotely.

## Note on publishing

Once built, this should end up somewhere genuinely public and ownable by Ryan — e.g. deployed to Vercel, Netlify, or GitHub Pages on a domain or subdomain he controls — not left as a local-only build, since the whole point is "a website that anyone can access."

---

## The website (built)

Plain HTML/CSS/JS — no build step. Files: `index.html`, `css/style.css`, `js/data.js`, `js/main.js`, `js/rink.js`, `js/map.js`.

**Run it locally** (needed so the art/travel JSON files can load):

    python3 -m http.server 5173     # then open http://localhost:5173

**Edit content:** almost everything lives in `js/data.js` — projects, timeline, fun cards, bio, stats.
Each project's `missing` list renders as a dashed "📥 Info needed" box inside its *More info* dropdown;
delete items as you fill them in. Set `SHOW_MISSING_INFO = false` to hide all of those boxes before going public.

**Art:** add images to `content/art/images/`, copy `captions-template.json` → `captions.json`, fill it in.
**Travel map:** put photos in `content/travel/photos/<Country>/` (plus optional `story.txt`, `dates.txt`)
and run `python3 tools/build_travel.py`. See `content/travel/README.md`.
**Demo videos:** explainer videos are rendered by `tools/explainer.html` (run `python3 tools/upload_server.py`,
open http://localhost:5174/tools/explainer.html, call `renderAll()`).
**Photo:** put a headshot in `assets/img/` and set `person.photo` in `js/data.js`.

**Deploy:** push this folder to a GitHub repo and turn on GitHub Pages (or drag it into Netlify).
Exclude the `Hockey CNN Yolov1 project info/` folder — it's ~250 MB and contains a third-party repo; the demo video
is already copied to `assets/video/`.

Fun bits: flick the puck into a net on the hero rink, the "30-sec view" toggle hides the playful sections for recruiters,
and typing `goal` anywhere triggers an easter egg.
