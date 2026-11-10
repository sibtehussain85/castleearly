# Accuracy tuning (Nov 10, 2026)
- games.json: 52 Chess.com games with Chess.com's official accuracies (aw/ab), UCI moves. Collected in Chrome from api.chess.com (games' `accuracies` field exists for any reviewed game) by crawling from Huss1383's opponents + random CMs; ratings 450-2500.
- evals.json: Stockfish 19 lite evals per position (site settings: depth 15 movetime 1500), from `node evals.js games.json evals.json 2` (~8 min).
- model.js: replica of review.js classify()+summary() with parameters; final.json = shipped values.
- tune.js: `node tune.js report|fit|cv`. Result: MAE 2.2 (was 14.7), 2-fold CV test MAE 2.1-3.3; ~2 points in every rating band; random moves score ~23.
- To add games: append to games.json, rerun evals.js (it resumes), then tune.js.
