# Fun side: photo folders

Each card in the "Off the ice" section has its own folder here:

| Card | Folder |
|---|---|
| 🏒 Varsity Hockey | `content/fun/hockey/` |
| 🥏 Ultimate Frisbee | `content/fun/ultimate-frisbee/` |
| 📰 The Musket | `content/fun/the-musket/` |
| 🏮 Chinese American Association | `content/fun/chinese-american-association/` |
| 🧩 LexMACS | `content/fun/lexmacs/` |

1. Drop photos (jpg / png / webp / gif) into a folder.
2. Optional: add `story.txt` to replace the text on the back of that card.
3. From the project root run `python3 tools/build_fun.py`, then commit and push.

To add a new card, add an entry to `fun` in `js/data.js` with a new `folder` name and create that folder.
Travel photos live in `content/travel/photos/` instead (see `content/travel/README.md`).
