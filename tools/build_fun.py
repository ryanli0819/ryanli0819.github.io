"""Build content/fun/fun.json from the photo folders in content/fun/<folder>/.
Run from the project root:  python3 tools/build_fun.py
Optional story.txt in a folder replaces the text on the back of that card."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUN = os.path.join(ROOT, "content", "fun")
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

# Photos already listed from assets/life/img/ (the "Life in frames" set) are kept.
try:
    old = json.load(open(os.path.join(FUN, "fun.json"), encoding="utf-8"))
except Exception:
    old = {}

out = {}
for folder in sorted(os.listdir(FUN)):
    d = os.path.join(FUN, folder)
    if not os.path.isdir(d):
        continue
    photos = sorted(f"content/fun/{folder}/{f}" for f in os.listdir(d) if os.path.splitext(f)[1].lower() in EXTS)
    kept = [p for p in old.get(folder, {}).get("photos", []) if p.startswith("assets/")]
    entry = {"photos": kept + photos}
    story = os.path.join(d, "story.txt")
    if os.path.exists(story):
        entry["story"] = open(story, encoding="utf-8").read().strip()
    out[folder] = entry

with open(os.path.join(FUN, "fun.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
print(f"Wrote content/fun/fun.json: " + ", ".join(f"{k} ({len(v['photos'])})" for k, v in out.items()))
