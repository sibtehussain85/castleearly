// Helpers: play SAN lines with the site's engine, and ask Stockfish for evaluations.
const Chess = require('/home/claude/castleearly/assets/engine.js');
const { spawnSync } = require('child_process');

function sanOf(c, m, legal) { return c.san(m, legal); }

// Play one SAN move (with or without + / #). Returns {uci, san, from, to} or throws.
function playSan(c, san) {
  const want = san.replace(/[+#!?]+$/g, '');
  const legal = c.legalMoves();
  for (const m of legal) {
    const s = sanOf(c, m, legal);
    if (s.replace(/[+#]+$/g, '') === want) {
      const FILES = 'abcdefgh';
      const nm = q => FILES[q & 7] + ((q >> 3) + 1);
      const uci = nm(m.from) + nm(m.to) + (m.promotion ? m.promotion.toLowerCase() : '');
      const r = c.move(uci);
      return { uci, san: r.san, from: nm(m.from), to: nm(m.to) };
    }
  }
  throw new Error('Illegal move ' + san + ' at ' + c.fen() + ' legal: ' + legal.map(m => sanOf(c, m, legal)).join(' '));
}

// Play a line "e4 e5 Nf3 ..." (move numbers allowed). Returns list of steps with fen after each.
function line(str, startFen) {
  const c = new Chess(startFen);
  const toks = str.replace(/\d+\.(\.\.)?/g, ' ').trim().split(/\s+/).filter(Boolean);
  const steps = [];
  for (const t of toks) {
    const before = c.fen();
    const mv = playSan(c, t);
    steps.push(Object.assign(mv, { before, fen: c.fen(), mate: c.isCheckmate(), check: c.inCheck() }));
  }
  return { c, steps };
}

// Stockfish: evaluate FENs one after another in one engine process.
// Returns Promise<[{fen, lines:[{move, cp|mate}]}]>, scores from the side to move.
function sf(fens, depth = 16, multipv = 3) {
  const { spawn } = require('child_process');
  const p = spawn('node', ['/home/claude/castleearly/assets/stockfish/stockfish-19-lite-single.js']);
  let buf = '', waiter = null, cur = {};
  p.stdout.on('data', d => {
    buf += d; let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const l = buf.slice(0, i); buf = buf.slice(i + 1);
      const m = l.match(/^info depth (\d+) .*multipv (\d+) score (cp|mate) (-?\d+).* pv (\S+)/);
      if (m && +m[1] === depth) cur[m[2]] = { move: m[5], [m[3]]: +m[4] };
      if ((l.startsWith('bestmove') || l.startsWith('readyok')) && waiter) { const w = waiter; waiter = null; w(); }
    }
  });
  const send = c => p.stdin.write(c + '\n');
  const wait = () => new Promise(r => waiter = r);
  return (async () => {
    send('uci'); send('setoption name MultiPV value ' + multipv); send('isready'); await wait();
    const out = [];
    for (const f of fens) {
      cur = {}; send('position fen ' + f); send('go depth ' + depth); await wait();
      out.push({ fen: f, lines: Object.values(cur) });
    }
    p.stdin.end(); p.kill();
    return out;
  })();
}

// Convert a UCI move to SAN in a position.
function uciToSan(fen, uci) {
  const c = new Chess(fen); const legal = c.legalMoves();
  const FILES = 'abcdefgh'; const nm = q => FILES[q & 7] + ((q >> 3) + 1);
  for (const m of legal) if (nm(m.from) + nm(m.to) + (m.promotion ? m.promotion.toLowerCase() : '') === uci) return c.san(m, legal);
  return '?' + uci;
}

module.exports = { Chess, line, playSan, sf, uciToSan };
