# CastleEarly site tools (not deployed content)

This branch holds the generators Claude uses to add lessons. The live site is the `main` branch.

- `gen/pages.js` – lesson content (moves are checked with the site's engine at build time)
- `gen/build.js` – builds pages into a clone of `main` (Stockfish picks and checks quiz options)
- `gen/wire.js` – adds pages to the library, menu, related lessons, sitemap, search index, llms.txt
- `gen/og.py` + `gen/sprites/` – share images
- Paths assume the site is cloned at /home/claude/castleearly and these files at /home/claude/gen.
- `gen/pages2.js` + `gen/wire2.js` – Learn-section pages (Stalemate, Zugzwang); lines can be "FEN|moves"
- Learn pages: set `sec: 'learn'`; quizzes may set `ask` (custom question)
- `gen/wire-coach.js` – adds "Play <opening> against the Coach" to every opening/trap lesson (book = the page's trainer lines) and loads coach.js on tactics + home. Re-run after adding a lesson: `node wire-coach.js <slug>`
- `tests/` – coach tests: `coachtest.js` (Node + Stockfish explanations), `cdp.js` + `e2e2.js` (headless Chrome end-to-end; serve the site with `python3 -m http.server 8765` from the site folder first)
