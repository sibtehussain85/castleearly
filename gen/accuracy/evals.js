// Evaluate every position of every game with Stockfish 19 lite, same settings as the site's review.js
// (go depth 15 movetime 1500; score from the side to move; mate encoded like play.js).
// Usage: node evals.js games.json out.json [workers]
const { spawn } = require("child_process");
const fs = require("fs");
const Chess = require("../../../castleearly/assets/engine.js");
const SF = "../../../castleearly/assets/stockfish/stockfish-19-lite-single.js";
const SF_MATE = 100000, GO = process.env.GO || "depth 15 movetime 1500";
const [, , inF, outF, nw] = process.argv;
const games = JSON.parse(fs.readFileSync(inF, "utf8"));
let out = {};
try { out = JSON.parse(fs.readFileSync(outF, "utf8")); } catch (e) {}

function engine() {
  const p = spawn("node", [SF], { stdio: ["pipe", "pipe", "ignore"] });
  let buf = "", job = null, ready = null;
  p.stdout.on("data", (d) => {
    buf += d; let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (l === "readyok" && ready) { const r = ready; ready = null; r(); continue; }
      if (!job) continue;
      if (l.startsWith("info ") && l.includes(" score ") && !l.includes("bound")) {
        const d = / depth (\d+)/.exec(l), cp = / score cp (-?\d+)/.exec(l), mt = / score mate (-?\d+)/.exec(l);
        if (d) job.depth = +d[1];
        if (cp) job.score = +cp[1];
        else if (mt) { const y = +mt[1]; job.score = y > 0 ? SF_MATE - (2 * y - 1) : y < 0 ? -(SF_MATE + 2 * y) : -SF_MATE; }
      } else if (l.startsWith("bestmove")) {
        const bm = l.split(/\s+/)[1], j = job; job = null;
        j.cb({ best: bm && bm !== "(none)" ? bm : null, score: j.score == null ? 0 : j.score, depth: j.depth || 0 });
      }
    }
  });
  const send = (s) => p.stdin.write(s + "\n");
  send("uci");
  return {
    ready: () => new Promise((r) => { ready = r; send("isready"); }),
    search: (fen) => new Promise((cb) => { job = { cb }; send("position fen " + fen); send("go " + GO); }),
    kill: () => p.kill(),
  };
}

async function evalGame(e, g) {
  const c = new Chess(), fens = [c.fen()];
  for (const u of g.u) { if (!c.move(u)) throw new Error("illegal " + u + " in " + g.url); fens.push(c.fen()); }
  const res = [];
  for (const f of fens) {
    const st = new Chess(f).status();
    if (st.over) res.push({ best: null, score: st.reason === "checkmate" ? -SF_MATE : 0, depth: 0 });
    else res.push(await e.search(f));
  }
  return res;
}

(async () => {
  const todo = games.filter((g) => !out[g.url]);
  const t0 = Date.now(); let done = 0;
  const workers = Array.from({ length: +(nw || 2) }, async () => {
    const e = engine(); await e.ready();
    while (todo.length) {
      const g = todo.shift();
      out[g.url] = await evalGame(e, g);
      done++;
      fs.writeFileSync(outF, JSON.stringify(out));
      console.log(done + "/" + (done + todo.length), g.url, ((Date.now() - t0) / 1000).toFixed(0) + "s");
    }
    e.kill();
  });
  await Promise.all(workers);
})();
