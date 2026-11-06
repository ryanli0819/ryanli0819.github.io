# Interactive Travel Map — content needed

This folder holds the data that drives the interactive world map: which countries Ryan has visited, and the photos attached to each.

**Nothing here yet is real content.** Build the map and click-to-view-photos interaction against the schema in `countries-template.json` so it's fully wired up and ready — reading from this JSON file (or whatever format is easiest to maintain) rather than hardcoding countries into the component — but don't invent a visited-countries list. Wait for Ryan's real data.

## What's needed from Ryan

- The list of countries he's actually visited.
- For each: photos to show when that country is clicked (file paths), and optionally dates visited and a short note/memory.

## Suggested folder layout once real content arrives

```
content/travel/
  photos/
    usa/
      photo1.jpg
    japan/
      photo1.jpg
      photo2.jpg
    ...
  countries.json   <- filled-in version of countries-template.json
```
