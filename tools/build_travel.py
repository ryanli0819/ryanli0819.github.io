"""Build content/travel/countries.json from your photo folders.

1. Make one folder per country inside content/travel/photos/, named after the
   country in English, e.g.  content/travel/photos/Japan/
2. Drop your photos in (jpg / jpeg / png / webp / gif).
3. Optional: add story.txt in the folder with a short note about the trip
   (shown in the pop-up), and dates.txt with when you went (e.g. "Summer 2023").
4. Run from the project root:   python3 tools/build_travel.py

Existing notes/dates in countries.json are kept unless story.txt / dates.txt
override them. Countries listed in countries.json without a folder are kept too,
so you can mark a country as visited before you have photos.
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRAVEL = os.path.join(ROOT, "content", "travel")
PHOTOS = os.path.join(TRAVEL, "photos")
OUT = os.path.join(TRAVEL, "countries.json")
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def read(path):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read().strip()
    except FileNotFoundError:
        return None


def main():
    existing = {}
    if os.path.exists(OUT):
        with open(OUT, encoding="utf-8") as f:
            for c in json.load(f).get("countries", []):
                existing[c["name"].lower()] = c

    os.makedirs(PHOTOS, exist_ok=True)
    for folder in sorted(os.listdir(PHOTOS)):
        d = os.path.join(PHOTOS, folder)
        if not os.path.isdir(d):
            continue
        photos = sorted(
            f"photos/{folder}/{f}" for f in os.listdir(d)
            if os.path.splitext(f)[1].lower() in EXTS
        )
        c = existing.get(folder.lower(), {"name": folder})
        c["photos"] = photos
        story, dates = read(os.path.join(d, "story.txt")), read(os.path.join(d, "dates.txt"))
        if story:
            c["note"] = story
        if dates:
            c["datesVisited"] = dates
        existing[folder.lower()] = c

    countries = sorted(existing.values(), key=lambda c: c["name"])
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"countries": countries}, f, ensure_ascii=False, indent=2)
    total = sum(len(c.get("photos", [])) for c in countries)
    print(f"Wrote {OUT}: {len(countries)} countries, {total} photos")


if __name__ == "__main__":
    main()
