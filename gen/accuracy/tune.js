// Fit accuracy parameters to Chess.com's official numbers.
const fs = require("fs");
const { prep, score, DEF } = require("./model.js");
const games = JSON.parse(fs.readFileSync("games.json"));
const ev = JSON.parse(fs.readFileSync("evals.json"));
const data = games.filter((g) => ev[g.url]).map((g, idx) => ({ g, idx, pg: prep(g, JSON.parse(JSON.stringify(ev[g.url]))) }));

function evalSet(P, set) {
  let ae = 0, se = 0, n = 0, bias = 0, worst = [];
  for (const d of set) {
    const s = score(d.pg, P);
    for (const [k, t] of [["w", d.g.aw], ["b", d.g.ab]]) {
      if (s[k] == null) continue;
      const e = s[k] - t; ae += Math.abs(e); se += e * e; bias += e; n++;
      worst.push({ e, url: d.g.url, side: k, ours: s[k], cc: t, elo: k === "w" ? d.g.w : d.g.b });
    }
  }
  worst.sort((a, b) => Math.abs(b.e) - Math.abs(a.e));
  return { mae: ae / n, rmse: Math.sqrt(se / n), bias: bias / n, n, worst };
}

// parameter space
const SPACE = {
  wLichess: [0, 1], harmFrac: [0, 1], dropMul: [0.5, 2.5], wideMul: [0, 2], kWide: [0.0006, 0.003],
  volMin: [0.1, 3], volMax: [3, 30], mateMistakeCap: [30, 100], accFloor: [0, 50], acplCap: [200, 2000],
};
const rnd = (a, b) => a + Math.random() * (b - a);

function fit(train, iters = 2500, seed = DEF) {
  let best = { ...seed }, bestErr = evalSet(best, train).mae;
  for (let it = 0; it < iters; it++) {
    const cand = { ...best };
    const keys = Object.keys(SPACE), nChange = 1 + Math.floor(Math.random() * 2);
    for (let c = 0; c < nChange; c++) {
      const k = keys[Math.floor(Math.random() * keys.length)], [a, b] = SPACE[k];
      const step = (b - a) * (it < iters / 2 ? 0.25 : 0.07);
      cand[k] = Math.max(a, Math.min(b, cand[k] + rnd(-step, step)));
    }
    const e = evalSet(cand, train).mae;
    if (e < bestErr) { best = cand; bestErr = e; }
  }
  return { P: best, err: bestErr };
}

const mode = process.argv[2] || "report";
if (mode === "report") {
  const r = evalSet(DEF, data);
  console.log("CURRENT formula on", r.n, "sides: MAE", r.mae.toFixed(2), "RMSE", r.rmse.toFixed(2), "bias", r.bias.toFixed(2));
  console.log("worst:", r.worst.slice(0, 8).map((w) => `${w.url}${w.side} ours ${w.ours.toFixed(1)} cc ${w.cc} (${w.e > 0 ? "+" : ""}${w.e.toFixed(1)})`).join("\n  "));
}
if (mode === "cv") {
  // 2-fold cross-validation, repeated with shuffles
  const res = [];
  for (let rep = 0; rep < 3; rep++) {
    const sh = data.slice().sort(() => Math.random() - 0.5), A = sh.filter((_, i) => i % 2), B = sh.filter((_, i) => !(i % 2));
    for (const [tr, te] of [[A, B], [B, A]]) {
      const f = fit(tr, 1500);
      res.push({ train: f.err, test: evalSet(f.P, te).mae, testCur: evalSet(DEF, te).mae });
    }
  }
  console.log(res.map((r) => `train ${r.train.toFixed(2)} | test ${r.test.toFixed(2)} (current ${r.testCur.toFixed(2)})`).join("\n"));
}
if (mode === "fit") {
  let best = null;
  for (let r = 0; r < 4; r++) { const f = fit(data, 3000); if (!best || f.err < best.err) best = f; }
  const r = evalSet(best.P, data);
  console.log("FIT: MAE", r.mae.toFixed(2), "RMSE", r.rmse.toFixed(2), "bias", r.bias.toFixed(2));
  console.log(JSON.stringify(best.P));
  fs.writeFileSync("best.json", JSON.stringify(best.P));
  console.log("worst:", r.worst.slice(0, 8).map((w) => `${w.url}${w.side} ours ${w.ours.toFixed(1)} cc ${w.cc} (${w.e > 0 ? "+" : ""}${w.e.toFixed(1)})`).join("\n  "));
}
module.exports = { evalSet, data };
