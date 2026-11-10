// Replica of review.js classify() + summary() with tunable parameters.
const Chess = require("../../../castleearly/assets/engine.js");
const MATE = Chess.MATE;
const isMate = (s) => Math.abs(s) > MATE - 200;
const mateIn = (s) => Math.ceil((MATE - Math.abs(s)) / 2);
function winPct(s) { if (isMate(s)) return s > 0 ? 100 : 0; const cp = Math.max(-1000, Math.min(1000, s)); return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1); }
function winPctK(s, k, cap) { if (isMate(s)) return s > 0 ? 100 : 0; const cp = Math.max(-cap, Math.min(cap, s)); return 50 + 50 * (2 / (1 + Math.exp(-k * cp)) - 1); }
const capCp = (s, c = 2000) => (isMate(s) ? (s > 0 ? c : -c) : Math.max(-c, Math.min(c, s)));
const acplAccuracy = (x) => Math.max(0, Math.min(100, 103.3979 - 0.3820659 * x - 0.002169231 * x * x));
const moveAccuracy = (d) => Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * d) - 3.1669));

// Precompute per-move raw facts once per game (independent of parameters)
function prep(g, res) {
  const c = new Chess(), fens = [c.fen()];
  for (const u of g.u) { c.move(u); fens.push(c.fen()); }
  const n = g.u.length, moves = [];
  for (let i = 0; i <= n; i++) {
    const a = res[i];
    a.n = new Chess(fens[i]).legalMoves().length;
    if (i === n) continue;
    const ps = -res[i + 1].score;
    a.playedScore = a.best === g.u[i] || ps > a.score ? a.score : ps;
  }
  let stillBook = true;
  for (let i = 0; i < n; i++) {
    const a = res[i], fen = fens[i], uci = g.u[i], mover = fen.split(" ")[1];
    const best = a.score, played = a.playedScore;
    const book = stillBook && Chess.inBook(fen, uci);
    const isBest = uci === a.best || played >= best - 5;
    if (!(book || a.n === 1)) stillBook = false;
    moves.push({ i, mover, best, played, forced: a.n === 1, book, isBest });
  }
  // white-POV evals for volatility weights
  const ev = [];
  for (let k = 0; k <= n; k++) {
    const st = new Chess(fens[k]).status(), turn = fens[k].split(" ")[1];
    ev.push(st.over ? (st.result === "1-0" ? MATE : st.result === "0-1" ? -MATE : 0) : turn === "w" ? res[k].score : -res[k].score);
  }
  return { moves, ev, n };
}

// Default P reproduces production exactly
const DEF = { kWide: 0.0012, capWide: 3000, wideMul: 1.5, dropMul: 1.5, mateMistakeCap: 60,
  wLichess: 0.5, harmFrac: 0.5, acplCap: 2000, volMin: 0.5, volMax: 12, accFloor: 0, accMode: "prod" };

function score(pg, P = DEF) {
  const s = { w: { list: [], cpl: 0, n: 0 }, b: { list: [], cpl: 0, n: 0 } };
  const wps = pg.ev.map(winPct), nMoves = pg.n;
  const win = Math.max(2, Math.min(8, Math.floor(nMoves / 10)));
  const weight = (i) => {
    const from = Math.max(0, i - win + 2), seg = wps.slice(from, i + 2);
    if (seg.length < 2) return 0.5;
    const m = seg.reduce((a, b) => a + b, 0) / seg.length;
    const v = seg.reduce((a, x) => a + (x - m) * (x - m), 0) / seg.length;
    return Math.max(P.volMin, Math.min(P.volMax, Math.sqrt(v)));
  };
  for (const mv of pg.moves) {
    if (mv.forced) continue;
    const side = s[mv.mover];
    let acc, cpLoss;
    if (mv.book) { acc = 100; cpLoss = 0; }
    else {
      const dN = Math.max(0, winPct(mv.best) - winPct(mv.played));
      const dW = Math.max(0, winPctK(mv.best, P.kWide, P.capWide) - winPctK(mv.played, P.kWide, P.capWide));
      acc = moveAccuracy(Math.max(dN, dW * P.wideMul) * P.dropMul);
      const drop = Math.max(dN, dW);
      const isMistakeMate = isMate(mv.best) && mv.best > 0 && !(isMate(mv.played) && mv.played > 0) && mateIn(mv.best) <= 1 && !mv.isBest;
      if (isMistakeMate) acc = Math.min(acc, P.mateMistakeCap);
      acc = Math.max(P.accFloor, acc);
      cpLoss = Math.max(0, capCp(mv.best, P.acplCap) - capCp(mv.played, P.acplCap));
    }
    side.list.push({ acc, w: weight(mv.i) }); side.cpl += cpLoss; side.n++;
  }
  const out = {};
  for (const k of ["w", "b"]) {
    const sd = s[k];
    if (!sd.n) { out[k] = null; continue; }
    let ws = 0, wsum = 0, inv = 0;
    for (const m of sd.list) { ws += m.acc * m.w; wsum += m.w; inv += 1 / Math.max(m.acc, 1); }
    const vol = ws / wsum, harm = sd.n / inv;
    const lichess = vol * (1 - P.harmFrac) + harm * P.harmFrac;
    const acpl = acplAccuracy(sd.cpl / sd.n);
    out[k] = P.wLichess * lichess + (1 - P.wLichess) * acpl;
    out[k + "_parts"] = { vol, harm, acpl, n: sd.n };
  }
  return out;
}
module.exports = { prep, score, DEF, winPct, moveAccuracy, acplAccuracy };
