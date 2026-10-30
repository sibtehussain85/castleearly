# CastleEarly site tools (not deployed content)

This branch holds the generators Claude uses to add lessons. The live site is the `main` branch.

- `gen/pages.js` – lesson content (moves are checked with the site's engine at build time)
- `gen/build.js` – builds pages into a clone of `main` (Stockfish picks and checks quiz options)
- `gen/wire.js` – adds pages to the library, menu, related lessons, sitemap, search index, llms.txt
- `gen/og.py` + `gen/sprites/` – share images
- Paths assume the site is cloned at /home/claude/castleearly and these files at /home/claude/gen.
