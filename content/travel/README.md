# Travel map: how to add a country

1. Make a folder per country inside `content/travel/photos/`, named in English
   (e.g. `content/travel/photos/Japan/`).
2. Drop your photos in (jpg / png / webp).
3. Optional: `story.txt` = a short note about the trip (shown in the hover pop-up),
   `dates.txt` = when you went (e.g. `Summer 2023`).
4. From the project root run `python3 tools/build_travel.py`, then commit and push.

Hovering a highlighted country on the website shows a pop-up window with up to 4 photos
and your story; clicking opens the full gallery.
