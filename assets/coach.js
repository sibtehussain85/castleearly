/*
 * CastleEarly Coach: play an opening against Stockfish and get every move explained.
 *  - Opening pages: <div class="coach" data-name="Englund Gambit" data-side="b"> with a
 *    <script type="application/json" class="coach-book"> holding the page's main lines.
 *    The coach follows those lines first, then plays Stockfish at the chosen strength.
 *  - Tactics pages: wrong puzzle moves are explained, and solved puzzles get the idea named.
 * Explanations come from Stockfish lines checked with the CastleEarly rules engine.
 * "Explain more" sends those checked facts to /api/coach (AI wording, daily limit).
 * Needs engine.js, pieces.js and play.js loaded first. Keep this file ASCII.
 */
(function () {
  "use strict";
  var P = window.CEPlay, Chess = window.CEChess;
  if (!P || !Chess) return;
  var FILES = "abcdefgh";
  var VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
  var NAME = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };
  var MATE = 100000;
  var LEVELS = [
    { elo: 600, t: 320, rnd: 0.12, ms: 300 },
    { elo: 800, t: 210, rnd: 0.06, ms: 350 },
    { elo: 1000, t: 140, rnd: 0.03, ms: 400 },
    { elo: 1200, t: 85, rnd: 0.01, ms: 450 },
    { elo: 1500, t: 45, rnd: 0, ms: 550 },
    { elo: 1800, t: 18, rnd: 0, ms: 650 },
    { elo: 2200, t: 0, rnd: 0, ms: 800 }
  ];
  var LABELS = {
    book: { t: "Book", ic: "\ud83d\udcd6", c: "book" },
    great: { t: "Great move", ic: "!", c: "great" },
    best: { t: "Best", ic: "\u2605", c: "best" },
    excellent: { t: "Excellent", ic: "\ud83d\udc4d", c: "excellent" },
    good: { t: "Good", ic: "\u2713", c: "good" },
    inaccuracy: { t: "Inaccuracy", ic: "?!", c: "inacc" },
    mistake: { t: "Mistake", ic: "?", c: "mistake" },
    blunder: { t: "Blunder", ic: "??", c: "blunder" }
  };
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function nm(i) { return FILES[i & 7] + ((i >> 3) + 1); }
  function idx(n) { return FILES.indexOf(n[0]) + 8 * (parseInt(n[1], 10) - 1); }
  function colorOf(p) { return !p ? "" : p === p.toUpperCase() ? "w" : "b"; }
  function other(c) { return c === "w" ? "b" : "w"; }
  function bookKey(fen) { return fen.split(" ").slice(0, 4).join(" "); }

  /* ---------- Stockfish with several lines (MultiPV) ---------- */
  function SF() { this.w = null; this.state = "idle"; this.q = []; this.job = null; this.waiting = []; }
  SF.prototype.init = function (cb) {
    var self = this;
    if (this.state === "ready") return cb(null);
    if (this.state === "failed") return cb("failed");
    this.waiting.push(cb);
    if (this.state === "loading") return;
    this.state = "loading";
    if (typeof WebAssembly !== "object" || !window.Worker) return this.fail();
    try { this.w = new Worker(P.sfUrl); } catch (e) { return this.fail(); }
    this.w.onerror = function (e) { if (e && e.preventDefault) e.preventDefault(); self.fail(); };
    this.w.onmessage = function (e) { self.line(String(e.data)); };
    this.timer = setTimeout(function () { if (self.state === "loading") self.fail(); }, 30000);
    this.w.postMessage("uci");
  };
  SF.prototype.fail = function () {
    this.state = "failed";
    clearTimeout(this.timer);
    try { if (this.w) this.w.terminate(); } catch (e) {}
    this.w = null;
    var w = this.waiting; this.waiting = [];
    w.forEach(function (f) { f("failed"); });
    var jobs = (this.job ? [this.job] : []).concat(this.q);
    this.job = null; this.q = [];
    jobs.forEach(function (j) { j.cb(fallback(j.fen, j.mpv)); });
  };
  SF.prototype.line = function (l) {
    if (l === "uciok") { this.w.postMessage("setoption name MultiPV value 4"); this.w.postMessage("isready"); return; }
    if (l === "readyok" && this.state === "loading") {
      clearTimeout(this.timer);
      this.state = "ready";
      var w = this.waiting; this.waiting = [];
      w.forEach(function (f) { f(null); });
      this.pump();
      return;
    }
    var j = this.job;
    if (!j) return;
    if (l.indexOf("info ") === 0 && l.indexOf(" pv ") > 0 && l.indexOf("bound") < 0) {
      var d = +(/ depth (\d+)/.exec(l) || [0, 0])[1], k = +(/ multipv (\d+)/.exec(l) || [0, 1])[1];
      var cp = / score cp (-?\d+)/.exec(l), mt = / score mate (-?\d+)/.exec(l);
      var pv = l.slice(l.indexOf(" pv ") + 4).trim().split(/\s+/);
      var s = cp ? +cp[1] : mt ? (+mt[1] > 0 ? MATE - (2 * +mt[1] - 1) : -(MATE + 2 * +mt[1])) : 0;
      if (mt && +mt[1] === 0) s = -MATE;
      if (!j.lines[k] || d >= j.lines[k].d) j.lines[k] = { d: d, move: pv[0], score: s, pv: pv };
    } else if (l.indexOf("bestmove") === 0) {
      clearTimeout(j.t);
      this.job = null;
      var out = [];
      for (var i = 1; i <= 4; i++) if (j.lines[i]) out.push(j.lines[i]);
      out.sort(function (a, b) { return b.score - a.score; });
      if (!out.length) { var bm = l.split(" ")[1]; if (bm && bm !== "(none)") out.push({ move: bm, score: 0, pv: [bm] }); }
      j.cb(out);
      this.pump();
    }
  };
  SF.prototype.pump = function () {
    var self = this;
    if (this.state !== "ready" || this.job || !this.q.length) return;
    var j = this.job = this.q.shift();
    j.lines = {};
    this.w.postMessage("position fen " + j.fen);
    this.w.postMessage("go movetime " + j.ms);
    j.t = setTimeout(function () { self.fail(); }, j.ms + 15000);
  };
  // cb(lines): lines sorted best first, scores from the side to move
  SF.prototype.analyse = function (fen, ms, cb) {
    var self = this;
    if (this.state === "failed") return setTimeout(function () { cb(fallback(fen)); }, 0);
    this.q.push({ fen: fen, ms: ms, cb: cb, mpv: 4 });
    this.init(function () { self.pump(); });
  };
  // If Stockfish can't run: the CastleEarly engine gives one line
  function fallback(fen) {
    var c = new Chess(fen);
    if (!c.legalMoves().length) return [];
    var a = c.analyze(500, null, 6);
    return a.best ? [{ move: a.best, score: Math.abs(a.score) > Chess.MATE - 200 ? (a.score > 0 ? MATE - 5 : -MATE + 5) : a.score, pv: [a.best], weak: true }] : [];
  }
  var sf = new SF();
  var cache = {};
  function analyse(fen, ms, cb) {
    var k = fen + "|" + ms;
    if (cache[k]) {
      if (cache[k].res) return setTimeout(function () { cb(cache[k].res); }, 0);
      cache[k].cbs.push(cb); return;
    }
    cache[k] = { cbs: [cb] };
    sf.analyse(fen, ms, function (res) { cache[k].res = res; var c = cache[k].cbs; cache[k].cbs = []; c.forEach(function (f) { f(res); }); });
  }

  /* ---------- Scores ---------- */
  function isMate(s) { return Math.abs(s) > MATE - 500; }
  function mateIn(s) { return Math.ceil((MATE - Math.abs(s)) / 2); }
  function winPct(s) {
    if (isMate(s)) return s > 0 ? 100 : 0;
    var cp = Math.max(-1000, Math.min(1000, s));
    return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
  }

  /* ---------- Board facts ---------- */
  var KN = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
  var KG = [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
  function on(f, r) { return f >= 0 && f < 8 && r >= 0 && r < 8; }
  // Squares holding pieces of color `by` that attack square s (pins ignored)
  function attackers(b, s, by) {
    var out = [], f = s & 7, r = s >> 3, i, ff, rr, p;
    var pr = by === "w" ? r - 1 : r + 1, P = by === "w" ? "P" : "p";
    [-1, 1].forEach(function (df) { if (on(f + df, pr) && b[pr * 8 + f + df] === P) out.push(pr * 8 + f + df); });
    for (i = 0; i < 8; i++) {
      ff = f + KN[i][0]; rr = r + KN[i][1];
      if (on(ff, rr) && b[rr * 8 + ff] === (by === "w" ? "N" : "n")) out.push(rr * 8 + ff);
      ff = f + KG[i][0]; rr = r + KG[i][1];
      if (on(ff, rr) && b[rr * 8 + ff] === (by === "w" ? "K" : "k")) out.push(rr * 8 + ff);
    }
    for (i = 0; i < 8; i++) {
      ff = f; rr = r;
      while (true) {
        ff += KG[i][0]; rr += KG[i][1];
        if (!on(ff, rr)) break;
        p = b[rr * 8 + ff];
        if (!p) continue;
        if (colorOf(p) === by) {
          var t = p.toLowerCase();
          if (t === "q" || (i < 4 ? t === "b" : t === "r")) out.push(rr * 8 + ff);
        }
        break;
      }
    }
    return out;
  }
  // Squares a piece on s attacks
  function attacksFrom(b, s) {
    var p = b[s], out = [], f = s & 7, r = s >> 3, t = p.toLowerCase(), c = colorOf(p), i, ff, rr;
    if (t === "p") { var dr = c === "w" ? 1 : -1; [-1, 1].forEach(function (df) { if (on(f + df, r + dr)) out.push((r + dr) * 8 + f + df); }); return out; }
    if (t === "n" || t === "k") {
      var T = t === "n" ? KN : KG;
      for (i = 0; i < 8; i++) { ff = f + T[i][0]; rr = r + T[i][1]; if (on(ff, rr)) out.push(rr * 8 + ff); }
      return out;
    }
    for (i = 0; i < 8; i++) {
      if (t === "b" && i >= 4) continue;
      if (t === "r" && i < 4) continue;
      ff = f; rr = r;
      while (true) { ff += KG[i][0]; rr += KG[i][1]; if (!on(ff, rr)) break; out.push(rr * 8 + ff); if (b[rr * 8 + ff]) break; }
    }
    return out;
  }
  function minVal(b, sqs) { var m = 999; sqs.forEach(function (s) { m = Math.min(m, VAL[b[s].toLowerCase()]); }); return m; }
  // Pieces of `color` that can be won: attacked and undefended, or attacked by something cheaper
  function loose(b, color) {
    var out = [];
    for (var s = 0; s < 64; s++) {
      var p = b[s];
      if (!p || colorOf(p) !== color || p.toLowerCase() === "k" || p.toLowerCase() === "p") continue;
      var at = attackers(b, s, other(color));
      if (!at.length) continue;
      var de = attackers(b, s, color);
      if (!de.length || minVal(b, at) < VAL[p.toLowerCase()]) out.push(s);
    }
    return out;
  }
  function material(b, color) {
    var m = 0;
    for (var s = 0; s < 64; s++) if (b[s] && b[s].toLowerCase() !== "k") m += (colorOf(b[s]) === color ? 1 : -1) * VAL[b[s].toLowerCase()];
    return m;
  }
  // Material won by `color` along an engine line (lets the captures finish)
  function lineGain(fen, pv, color, maxPly) {
    var c = new Chess(fen), start = material(c.board, color), last = start, n = 0;
    maxPly = maxPly || 6;
    for (var i = 0; i < pv.length && i < maxPly + 4; i++) {
      var res = c.move(pv[i]);
      if (!res) break;
      n++;
      var next = pv[i + 1];
      last = material(c.board, color);
      if (n >= maxPly) {
        // stop once the next move is not a capture
        if (!next) break;
        var nt = idx(next.slice(2, 4));
        if (!c.board[nt]) break;
      }
    }
    return last - start;
  }
  function gainText(n) {
    if (n >= 8) return "about a queen";
    if (n >= 5) return "about a rook";
    if (n >= 3) return "a piece";
    if (n >= 2) return "two pawns";
    return "a pawn";
  }
  function sanLine(fen, pv, n) {
    var c = new Chess(fen), out = [], mn = parseInt(fen.split(" ")[5] || "1", 10), black = fen.split(" ")[1] === "b";
    for (var i = 0; i < pv.length && i < n; i++) {
      var r = c.move(pv[i]);
      if (!r) break;
      var num = black ? (i === 0 ? mn + "..." : i % 2 === 1 ? (mn + (i + 1) / 2) + "." : "") : (i % 2 === 0 ? (mn + i / 2) + "." : "");
      out.push(num + r.san);
    }
    return out.join(" ");
  }
  function sanOf(fen, uci) { var r = new Chess(fen).move(uci); return r ? r.san : uci; }
  function moveNo(fen) { var p = fen.split(" "); return p[5] + (p[1] === "w" ? "." : "..."); }

  // Facts about one move. who: "you" or "me" (the coach). Returns {san, facts:[], tags:{}}
  function describe(fen, uci, who) {
    var c = new Chess(fen), before = c.board.slice(), mover = c.turn;
    var res = c.move(uci);
    if (!res) return { san: uci, facts: [], tags: {} };
    var b = c.board, from = idx(uci.slice(0, 2)), to = idx(uci.slice(2, 4));
    // who: "you" (learner vs coach), "me" (the coach), "puz" (learner in a puzzle), "opp" (puzzle opponent)
    var me = { you: "your", me: "my", puz: "your", opp: "their" }[who], them = { you: "my", me: "your", puz: "the", opp: "your" }[who];
    var piece = (res.promotion || res.piece).toLowerCase(), facts = [], tags = {};
    var mate = c.isCheckmate(), check = c.inCheck(), wasCheck = new Chess(fen).inCheck();
    if (mate) { facts.push("is checkmate"); tags.mate = 1; return { san: res.san, facts: facts, tags: tags }; }
    if (res.flag === "k" || res.flag === "q") { facts.push("castles, so " + me + " king is safe and a rook joins the game"); tags.castle = 1; }
    if (res.captured) {
      var cap = res.captured.toLowerCase(), defd = attackers(before, to, other(mover)).length;
      if (!defd && cap !== "p") { facts.push("takes " + them + " " + NAME[cap] + " for free"); tags.win = 1; }
      else if (VAL[cap] > VAL[res.piece.toLowerCase()] && cap !== "p") { facts.push("wins " + them + " " + NAME[cap] + " for a " + NAME[res.piece.toLowerCase()]); tags.win = 1; }
      else facts.push("takes " + them + " " + NAME[cap]);
      tags.capture = 1;
    }
    if (wasCheck) { facts.push(res.piece.toLowerCase() === "k" ? "steps out of check" : res.captured ? "gets out of check" : "blocks the check"); tags.escape = 1; }
    if (res.promotion) { facts.push("makes a new " + NAME[res.promotion.toLowerCase()]); tags.promo = 1; }
    // fork / attacks by the moved piece
    var targets = attacksFrom(b, to).filter(function (s) { return b[s] && colorOf(b[s]) !== mover; });
    var good = targets.filter(function (s) {
      var t = b[s].toLowerCase();
      if (t === "k") return true;
      if (t === "p") return false;
      return VAL[t] > VAL[piece] || !attackers(b, s, other(mover)).length;
    });
    if (good.length >= 2) {
      facts.push((check ? "checks and " : "") + "forks " + them + " " + good.map(function (s) { return NAME[b[s].toLowerCase()]; }).join(" and "));
      tags.fork = 1;
    } else {
      if (check) { facts.push("gives check"); tags.check = 1; }
      good.forEach(function (s) { if (b[s].toLowerCase() !== "k") { facts.push("attacks " + them + " " + NAME[b[s].toLowerCase()] + " on " + nm(s)); tags.attack = 1; } });
    }
    // pressure on a pawn that has more attackers than defenders (like f7 after Ng5)
    if (!tags.capture && !tags.attack && !tags.fork) {
      targets.forEach(function (s) {
        if (tags.pawnHit || b[s].toLowerCase() !== "p") return;
        if (attackers(b, s, mover).length > attackers(b, s, other(mover)).length) { facts.push("attacks " + them + " weak pawn on " + nm(s)); tags.pawnHit = 1; }
      });
    }
    // pins by a line piece
    if ("bqr".indexOf(piece) >= 0) {
      for (var d = 0; d < 8; d++) {
        if (piece === "b" && d >= 4) continue;
        if (piece === "r" && d < 4) continue;
        var ff = to & 7, rr = to >> 3, first = -1;
        while (true) {
          ff += KG[d][0]; rr += KG[d][1];
          if (!on(ff, rr)) break;
          var q = rr * 8 + ff, pp = b[q];
          if (!pp) continue;
          if (colorOf(pp) === mover) break;
          if (first < 0) { first = q; continue; }
          var t1 = b[first].toLowerCase(), t2 = pp.toLowerCase();
          if ("kqr".indexOf(t2) >= 0 && VAL[t2] > VAL[t1] && t1 !== "k" && (t1 !== "p" || t2 === "k" || t2 === "q")) {
            facts.push("pins " + them + " " + NAME[t1] + " to " + them + " " + NAME[t2]);
            tags.pin = 1;
          }
          break;
        }
      }
    }
    // pieces left hanging by this move
    var lo = loose(b, mover).filter(function (s) { return s === to || !loose(before, mover).some(function (x) { return x === s; }); });
    if (lo.length && !tags.mate) tags.leaves = lo.map(function (s) { return NAME[b[s].toLowerCase()] + " on " + nm(s); });
    // opening ideas for quiet moves
    var full = parseInt(fen.split(" ")[5] || "1", 10);
    if (!facts.length && full <= 12) {
      var homeRank = mover === "w" ? 0 : 7, fromRank = from >> 3;
      if ((piece === "n" || piece === "b") && fromRank === homeRank) { facts.push("develops " + me + " " + NAME[piece] + " toward the center"); tags.develop = 1; }
      else if (piece === "p" && "de".indexOf(FILES[from & 7]) >= 0) { facts.push("takes space in the center"); tags.center = 1; }
      else if (piece === "q" && full <= 6) tags.earlyQueen = 1;
    }
    return { san: res.san, facts: facts, tags: tags };
  }
  function joinFacts(f) {
    if (!f.length) return "";
    if (f.length === 1) return f[0];
    return f.slice(0, -1).join(", ") + " and " + f[f.length - 1];
  }

  /* ---------- Grading a move ---------- */
  // pre: lines before the move (mover to move); post: lines after it (opponent to move)
  function grade(pre, post, uci, inBook) {
    if (!pre || !pre.length) return { cls: "good", drop: 0 };
    var best = pre[0].score, played = null;
    for (var i = 0; i < pre.length; i++) if (pre[i].move === uci) played = pre[i].score;
    if (played === null) played = post && post.length ? -post[0].score : best;
    var drop = Math.max(0, winPct(best) - winPct(played));
    var cls;
    if (isMate(best) && best > 0 && !(isMate(played) && played > 0)) cls = drop >= 20 ? "blunder" : mateIn(best) <= 2 ? "mistake" : drop < 5 ? "good" : "inaccuracy";
    if (!cls) {
      if (uci === pre[0].move || played >= best - 8) cls = "best";
      else cls = drop < 2 ? "excellent" : drop < 5 ? "good" : drop < 10 ? "inaccuracy" : drop < 20 ? "mistake" : "blunder";
    }
    if (cls === "best" && pre.length > 1 && !pre[0].weak) {
      var gap = winPct(pre[0].score) - winPct(pre[1].score);
      if (gap >= 15 && winPct(best) < 97 && winPct(best) > 30) cls = "great";
    }
    // allowing a checkmate the other side didn't have is always a blunder
    if (post && post[0] && isMate(post[0].score) && post[0].score > 0 && !(isMate(best) && best < 0)) cls = "blunder";
    if (inBook && drop < 12 && cls !== "blunder") cls = "book";
    return { cls: cls, drop: drop, best: best, played: played };
  }

  /* ---------- Book from the page's lines ---------- */
  function Book(data) {
    this.tree = {};
    var self = this;
    (data.lines || []).forEach(function (L, li) {
      var c = new Chess();
      for (var i = 0; i < L.moves.length; i++) {
        var m = L.moves[i], k = bookKey(c.fen());
        var arr = self.tree[k] || (self.tree[k] = []);
        var ex = null;
        arr.forEach(function (x) { if (x.uci === m[0]) ex = x; });
        if (!ex) arr.push({ uci: m[0], san: m[1], note: m[2] || "", sides: [L.side], line: li });
        else if (ex.sides.indexOf(L.side) < 0) ex.sides.push(L.side);
        if (!c.move(m[0])) break;
      }
    });
  }
  Book.prototype.at = function (fen) { return this.tree[bookKey(fen)] || []; };
  Book.prototype.find = function (fen, uci) { var a = this.at(fen); for (var i = 0; i < a.length; i++) if (a[i].uci === uci) return a[i]; return null; };
  // Coach's book choice: prefer lines written for the learner's side (e.g. the trap the learner sets)
  Book.prototype.pick = function (fen, learner) {
    var a = this.at(fen);
    if (!a.length) return null;
    var pref = a.filter(function (x) { return x.sides.indexOf(learner) >= 0; });
    var pool = pref.length ? pref : a;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  /* ---------- Text for the learner's move ---------- */
  function explainMove(e) {
    // e: {fen, uci, after, pre, post, g, book, bookHere, you}
    var d = describe(e.fen, e.uci, "you"), out = [], cls = e.g.cls;
    var good = ["book", "great", "best", "excellent", "good"].indexOf(cls) >= 0;
    if (cls === "book" && e.book && e.book.note) out.push(e.book.note);
    if (cls === "book" && e.g.drop >= 5) out.push("It's the line this lesson teaches, but Stockfish thinks it's a little risky: it gives the other side a small edge if they know the right answer.");
    if (good) {
      if (d.tags.mate) out.push("Checkmate! Well played.");
      else if (d.facts.length && cls !== "book") out.push(d.san + " " + joinFacts(d.facts) + ".");
      else if (cls === "great") out.push("This was the only strong move here. Well found.");
      else if (!out.length) out.push(cls === "good" ? "A reasonable move." : "A strong move.");
      if (d.tags.leaves && cls === "good") out.push("Careful: your " + d.tags.leaves[0] + " is not well defended.");
    } else {
      var rep = e.post && e.post[0];
      if (rep && isMate(rep.score) && rep.score > 0) {
        out.push("This lets me checkmate: " + sanLine(e.after, rep.pv, Math.min(rep.pv.length, 2 * mateIn(rep.score) - 1)) + ".");
      } else if (rep) {
        var rd = describe(e.after, rep.move, "me"), loss = lineGain(e.after, rep.pv, e.coach, 6);
        var s = "Now I can play " + moveNo(e.after) + rd.san;
        if (rd.facts.length) s += ", which " + joinFacts(rd.facts);
        if (loss >= 1) s += (rd.facts.length ? ". In the end I win " : " and win ") + gainText(loss);
        else if (!rd.facts.length) s += " and get the better position";
        out.push(s + ".");
        if (d.tags.leaves && !(rd.tags.capture)) out.push("Your " + d.tags.leaves[0] + " was left undefended.");
      }
      var b = e.pre && e.pre[0];
      if (b && b.move !== e.uci) {
        if (isMate(b.score) && b.score > 0) out.push("You had checkmate: " + sanLine(e.fen, b.pv, 2 * mateIn(b.score) - 1) + ".");
        else {
          var bd = describe(e.fen, b.move, "you"), gain = lineGain(e.fen, b.pv, e.you, 6);
          var t = "Better was " + moveNo(e.fen) + bd.san;
          if (bd.facts.length) t += ": it " + joinFacts(bd.facts);
          if (gain >= 1 && !bd.tags.win) t += (bd.facts.length ? ", and " : ", which ") + "wins " + gainText(gain);
          out.push(t + ".");
        }
        var bb = e.bookHere && e.bookHere.filter(function (x) { return x.uci === b.move; })[0];
        if (bb && bb.note) out.push("That is the main line: " + bb.note);
      }
    }
    if (e.bookHere && e.bookHere.length && !e.book) {
      var main = e.bookHere[0];
      out.push("You left the main line of " + e.name + " here. The usual move is " + moveNo(e.fen) + main.san + ".");
    }
    if (d.tags.earlyQueen && !good) out.push("Tip: bringing the queen out early lets the other side gain time by attacking it.");
    return { san: d.san, text: out.join(" "), facts: d.facts };
  }
  // Text for the coach's own move
  function explainCoach(fen, uci, book, you) {
    var d = describe(fen, uci, "me"), out = [];
    if (book && book.note) out.push(book.note);
    else if (d.facts.length) out.push("It " + joinFacts(d.facts) + ".");
    else out.push("A quiet move: I'm improving my position.");
    var c = new Chess(fen); c.move(uci);
    var said = d.facts.join(" ");
    var lo = loose(c.board, you).filter(function (s) { return said.indexOf("on " + nm(s)) < 0; }).map(function (s) { return NAME[c.board[s].toLowerCase()] + " on " + nm(s); });
    if (lo.length && !d.tags.mate) out.push("Watch out: your " + lo.join(" and ") + (lo.length > 1 ? " are" : " is") + " under attack.");
    return { san: d.san, text: out.join(" ") };
  }

  /* ---------- "Explain more": AI wording of the checked facts ---------- */
  function askAI(payload, cb) {
    if (!window.fetch) return cb("This browser can't reach the coach.");
    fetch("/api/coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (j) { if (j && j.ok) cb(null, j.text); else cb((j && j.error) || "The coach couldn't answer right now."); })
      .catch(function () { cb("The coach couldn't answer right now."); });
  }
  function aiBlock(getPayload) {
    var wrap = document.createElement("div");
    wrap.className = "co-ai";
    wrap.innerHTML = '<button type="button" class="co-more">\u2728 Explain more</button>' +
      '<form class="co-ask" hidden><input type="text" maxlength="160" placeholder="Ask about this move (optional)" aria-label="Your question"><button type="submit">Ask</button></form>' +
      '<p class="co-ai-out" hidden></p>';
    var out = wrap.querySelector(".co-ai-out"), btn = wrap.querySelector(".co-more"), form = wrap.querySelector(".co-ask");
    function run(q) {
      out.hidden = false; out.className = "co-ai-out wait"; out.textContent = "The coach is thinking\u2026";
      var p = getPayload(); p.question = q || "";
      askAI(p, function (err, text) {
        out.className = "co-ai-out" + (err ? " err" : "");
        out.textContent = err || text;
        form.hidden = false;
      });
    }
    btn.addEventListener("click", function () { btn.hidden = true; run(""); });
    form.addEventListener("submit", function (e) { e.preventDefault(); var v = form.querySelector("input").value.trim(); if (v) run(v); });
    return wrap;
  }

  /* ======================================================= */
  /* Coach game on opening pages                             */
  /* ======================================================= */
  function CoachBoard(root, opts) {
    this.co = opts;
    this.notes = [];
    P.Board.call(this, root);
  }
  CoachBoard.prototype = Object.create(P.Board.prototype);
  CoachBoard.prototype.constructor = CoachBoard;
  CoachBoard.prototype.level = function () { return LEVELS[this.co.level] || LEVELS[2]; };
  CoachBoard.prototype.setNames = function () {
    var you = this.myColor;
    var n = {}; n[you] = "You"; n[other(you)] = "Coach \u00b7 " + this.level().elo;
    this.names = n;
  };
  CoachBoard.prototype.newGame = function (silent) {
    this.notes = [];
    if (this.co && this.co.panel) this.co.panel.reset();
    P.Board.prototype.newGame.call(this, silent);
    this.setNames(); this.render();
    if (this.co && this.co.panel) this.co.panel.start(this);
    this.prefetch();
  };
  CoachBoard.prototype.prefetch = function () {
    if (this.over || !this.game || this.game.turn !== this.myColor) return;
    analyse(this.game.fen(), 700, function () {});
  };
  CoachBoard.prototype.applyMove = function (from, to, promo, byComputer) {
    var fen = this.game.fen(), ply = this.game.stack.length;
    var res = P.Board.prototype.applyMove.call(this, from, to, promo, byComputer);
    if (!res || !this.co) return res;
    var uci = from + to + (res.promotion ? res.promotion.toLowerCase() : "");
    if (!byComputer) this.onHumanMove(fen, uci, ply);
    else { this.onCoachMove(fen, uci, ply); this.prefetch(); }
    return res;
  };
  CoachBoard.prototype.onHumanMove = function (fen, uci, ply) {
    var self = this, after = this.game.fen();
    var bookHere = this.co.book.at(fen), book = this.co.book.find(fen, uci);
    var entry = this.co.panel.add({ who: "you", ply: ply, pending: true, san: this.game.history()[ply] });
    analyse(fen, 700, function (pre) {
      analyse(after, 700, function (post) {
        var g = grade(pre, post, uci, !!book);
        var you = self.myColor, ex = explainMove({ fen: fen, uci: uci, after: after, pre: pre, post: post, g: g, book: book, bookHere: bookHere, you: you, coach: other(you), name: self.co.label });
        var bestSan = pre && pre[0] ? sanOf(fen, pre[0].move) : "";
        self.co.panel.fill(entry, {
          cls: g.cls, text: ex.text, best: pre && pre[0] && pre[0].move !== uci && ["inaccuracy", "mistake", "blunder"].indexOf(g.cls) >= 0 ? pre[0].move : null,
          payload: function () {
            return { kind: "move", opening: self.co.name, side: you === "w" ? "White" : "Black", elo: self.level().elo, fen: fen, move: ex.san,
              label: LABELS[g.cls].t, best: bestSan, bestLine: pre && pre[0] ? sanLine(fen, pre[0].pv, 6) : "",
              reply: post && post[0] ? sanLine(after, post[0].pv, 6) : "", facts: ex.text, book: book && book.note ? book.note : "" };
          }
        });
        var L = LABELS[g.cls], first = (ex.text.match(/^.*?[.!](\s|$)/) || [ex.text])[0].trim();
        self.coachLine = { ply: ply, cls: ["inaccuracy", "mistake", "blunder"].indexOf(g.cls) >= 0 ? "bad" : "good",
          html: "<b>" + L.ic + " " + esc(ex.san) + ": " + L.t + ".</b> " + esc(first.length > 140 ? first.slice(0, 137) + "\u2026" : first) + " <a href='#coach-list-" + self.co.id + "' class='pb-sub'>More below</a>" };
        self.render();
        self.stats(g.cls);
      });
    });
  };
  CoachBoard.prototype.onCoachMove = function (fen, uci, ply) {
    var book = this.co.book.find(fen, uci);
    var ex = explainCoach(fen, uci, book, this.myColor);
    this.co.panel.add({ who: "me", ply: ply, san: this.game.history()[ply], text: ex.text, book: !!book });
  };
  CoachBoard.prototype.stats = function () {};
  // The coach's move: the page's opening line first, then Stockfish at the chosen strength
  CoachBoard.prototype.engineMove = function (fen, level, cb) {
    var self = this, token = this.token;
    var bk = this.co.book.pick(fen, this.myColor);
    var L = this.level();
    analyse(fen, 700, function (lines) {
      if (token !== self.token) return;
      if (bk) return cb(bk.uci);
      cb(pickMove(fen, lines, L));
    });
  };
  function pickMove(fen, lines, L) {
    if (!lines.length) return null;
    if (L.rnd && Math.random() < L.rnd) {
      var legal = new Chess(fen).moves();
      var m = legal[Math.floor(Math.random() * legal.length)];
      return m.from + m.to + (m.promotion ? m.promotion.toLowerCase() : "");
    }
    if (!L.t || lines.length === 1) return lines[0].move;
    var best = lines[0].score, ws = lines.map(function (l) {
      if (isMate(best) && best > 0 && L.elo >= 1200) return l === lines[0] ? 1 : 0; // stronger levels never miss a mate
      return Math.exp(-(Math.min(2000, best - l.score)) / L.t);
    });
    var sum = ws.reduce(function (a, b) { return a + b; }, 0), x = Math.random() * sum;
    for (var i = 0; i < lines.length; i++) { x -= ws[i]; if (x <= 0) return lines[i].move; }
    return lines[0].move;
  }
  // Hint: first the piece, then the square (from Stockfish's best move)
  CoachBoard.prototype.hint = function () {
    var self = this;
    if (!this.isHumanTurn()) return;
    var fen = this.game.fen(), token = this.token;
    this.message = { cls: "info", text: "Coach is looking for a hint\u2026" }; this.render();
    analyse(fen, 700, function (lines) {
      if (token !== self.token || !lines.length) return;
      var mv = lines[0].move, c = new Chess(fen), p = c.board[idx(mv.slice(0, 2))];
      self.hintSq = idx(mv.slice(0, 2));
      var d = describe(fen, mv, "you");
      if (self.hintStage === fen) { self.hintTo = idx(mv.slice(2, 4)); self.message = { cls: "info", text: "Hint: " + d.san + (d.facts.length ? " " + joinFacts(d.facts) : "") + "." }; }
      else {
        self.hintStage = fen; self.hintTo = -1;
        var idea = d.tags.mate ? "There is a checkmate." : d.tags.fork ? "Look for a fork." : d.tags.pin ? "Look for a pin." : d.tags.win ? "You can win material." : d.tags.check ? "A check is strong here." : "";
        self.message = { cls: "info", text: "Hint: move your " + NAME[p.toLowerCase()] + " on " + mv.slice(0, 2) + ". " + idea + " Press Hint again to see the square." };
      }
      self.render();
    });
  };

  /* ---------- Coach panel (move-by-move comments) ---------- */
  function Panel(host, getBoard) {
    this.host = host; this.getBoard = getBoard;
    host.innerHTML = '<div class="co-head"><span class="co-avatar" aria-hidden="true">\ud83c\udf93</span><div><b>Coach</b><span class="co-sum"></span></div></div><ol class="co-list" aria-live="polite"></ol>';
    this.list = host.querySelector(".co-list"); this.sum = host.querySelector(".co-sum");
    this.counts = {};
  }
  Panel.prototype.setId = function (id) { this.list.id = "coach-list-" + id; };
  Panel.prototype.reset = function () { this.list.innerHTML = ""; this.counts = {}; this.sum.textContent = ""; };
  Panel.prototype.start = function (board) {
    var you = board.myColor === "w" ? "White" : "Black";
    this.add({ who: "me", ply: -1, text: "Let's play " + board.co.label + ". You have " + you + ". I'll follow the main lines from this page, then play like a " + board.level().elo + " player. After every move I'll tell you what it does." });
  };
  Panel.prototype.add = function (o) {
    var li = document.createElement("li");
    li.className = "co-it " + (o.who === "you" ? "you" : "me");
    li.dataset.ply = o.ply;
    // a new move replaces comments for moves that were taken back
    [].slice.call(this.list.children).forEach(function (x) { if (+x.dataset.ply >= o.ply && o.ply >= 0) x.parentNode.removeChild(x); });
    var head = o.who === "you" ? '<span class="co-badge wait">\u2026</span><b>You: ' + esc(o.san || "") + "</b>" :
      o.san ? '<span class="co-badge me">' + (o.book ? "\ud83d\udcd6" : "\u265f") + "</span><b>Coach: " + esc(o.san) + "</b>" : "";
    li.innerHTML = '<p class="co-h">' + head + '</p><p class="co-t">' + esc(o.pending ? "Checking your move\u2026" : o.text || "") + "</p>";
    if (!head) li.querySelector(".co-h").remove();
    this.list.insertBefore(li, this.list.firstChild);
    this.trim();
    return li;
  };
  Panel.prototype.fill = function (li, o) {
    if (!li.parentNode) return;
    var L = LABELS[o.cls];
    var badge = li.querySelector(".co-badge");
    badge.className = "co-badge " + L.c; badge.textContent = L.ic;
    li.querySelector(".co-h b").insertAdjacentHTML("afterend", ' <span class="co-lab ' + L.c + '">' + L.t + "</span>");
    li.querySelector(".co-t").textContent = o.text;
    li.classList.add(L.c);
    var acts = document.createElement("div");
    acts.className = "co-acts";
    var self = this;
    if (o.best) {
      var sb = document.createElement("button");
      sb.type = "button"; sb.className = "co-show"; sb.textContent = "Show better move";
      sb.addEventListener("click", function () {
        var b = self.getBoard();
        // show it on the board only while that position is still on the board
        if (b.game.stack.length > +li.dataset.ply + 2) { sb.textContent = "Undo back to this move to see it"; return; }
        b.hintSq = idx(o.best.slice(0, 2)); b.hintTo = idx(o.best.slice(2, 4)); b.render();
      });
      acts.appendChild(sb);
    }
    acts.appendChild(aiBlock(o.payload));
    li.appendChild(acts);
    this.counts[o.cls] = (this.counts[o.cls] || 0) + 1;
    var c = this.counts, parts = [];
    ["blunder", "mistake", "inaccuracy"].forEach(function (k) { if (c[k]) parts.push(c[k] + " " + LABELS[k].t.toLowerCase() + (c[k] > 1 ? "s" : "")); });
    var goodN = (c.book || 0) + (c.great || 0) + (c.best || 0) + (c.excellent || 0) + (c.good || 0);
    this.sum.textContent = " \u00b7 " + goodN + " good move" + (goodN === 1 ? "" : "s") + (parts.length ? ", " + parts.join(", ") : "");
  };
  // Hide comments for moves that were taken back
  Panel.prototype.sync = function (plies) {
    [].forEach.call(this.list.children, function (li) { li.hidden = +li.dataset.ply >= plies; });
  };
  Panel.prototype.trim = function () { while (this.list.children.length > 60) this.list.removeChild(this.list.lastChild); };

  function startCoach(host) {
    if (host._co) return;
    var data;
    try { data = JSON.parse(host.querySelector("script.coach-book").textContent); } catch (e) { data = { lines: [] }; }
    var name = host.getAttribute("data-name") || "opening", label = host.getAttribute("data-label") || name, side = host.getAttribute("data-side") || "w";
    var lv = 2;
    try { var s = localStorage.getItem("ce-coach-level"); if (s !== null && LEVELS[+s]) lv = +s; } catch (e) {}
    host.innerHTML =
      '<div class="co-setup">' +
      '<label class="pb-field"><span>Coach strength</span><select data-co="level">' + LEVELS.map(function (L, i) { return '<option value="' + i + '"' + (i === lv ? " selected" : "") + ">" + (L.elo >= 2200 ? "2200+ (full Stockfish)" : "About " + L.elo) + "</option>"; }).join("") + "</select></label>" +
      '<label class="pb-field"><span>You play</span><select data-co="color"><option value="w"' + (side === "w" ? " selected" : "") + '>White</option><option value="b"' + (side === "b" ? " selected" : "") + ">Black</option></select></label>" +
      "</div>" +
      '<div class="co-grid"><div class="playboard co-board" data-kind="drill" data-player="' + side + '"></div><div class="co-panel"></div></div>';
    var root = host.querySelector(".co-board"), board = null;
    var opts = { id: host.id, name: name, label: label, book: new Book(data), level: lv };
    opts.panel = new Panel(host.querySelector(".co-panel"), function () { return board; });
    opts.panel.setId(host.id);
    root._ce = true;
    board = new CoachBoard(root, opts);
    root._board = board;
    host._co = board;
    // keep comments in step with Undo / Redo
    var origRender = board.render;
    board.render = function () {
      origRender.apply(this, arguments);
      if (opts.panel) opts.panel.sync(this.game.stack.length);
      // latest verdict right under the board (handy on phones)
      var cl = this.coachLine;
      var len = this.game.stack.length;
      if (cl && (cl.ply === len - 2 || cl.ply === len - 1) && !this.over && !(this.message && this.message.text)) {
        this.statusEl.className = "pb-status " + cl.cls;
        this.statusEl.innerHTML = cl.html + (this.thinking ? " <span class='pb-sub'>Coach is thinking\u2026</span>" : " <span class='pb-sub'>Your move.</span>");
      }
    };
    host.querySelector(".co-setup").addEventListener("change", function (e) {
      var k = e.target.getAttribute("data-co");
      if (k === "level") { opts.level = +e.target.value; try { localStorage.setItem("ce-coach-level", e.target.value); } catch (er) {} }
      if (k === "color") board.settings.color = e.target.value;
      board.newGame();
    });
  }

  /* ======================================================= */
  /* Tactics puzzles: explain wrong tries and name the idea  */
  /* ======================================================= */
  function puzzleNote(board) {
    var n = board.root.querySelector(".pz-coach");
    if (!n) { n = document.createElement("div"); n.className = "pz-coach"; board.root.appendChild(n); }
    return n;
  }
  var origPuzzle = P.Board.prototype.puzzleMove;
  P.Board.prototype.puzzleMove = function (from, to, promo) {
    if (this instanceof CoachBoard || !this.puzzle) return origPuzzle.apply(this, arguments);
    var fen = this.game.fen(), mistakes = this.mistakes, step = this.puzzleStep, want = this.puzzle.moves[step];
    var r = origPuzzle.apply(this, arguments);
    var self = this, uci = from + to + (promo || "");
    if (this.mistakes > mistakes) {
      var note = puzzleNote(this), token = this.token;
      note.innerHTML = '<p class="co-t wait">\ud83c\udf93 Coach: checking why ' + esc(sanOf(fen, uci)) + " doesn't work\u2026</p>";
      var c = new Chess(fen); c.move(uci);
      var after = c.fen(), you = fen.split(" ")[1];
      analyse(after, 600, function (post) {
        if (token !== self.token) return;
        var d = describe(fen, uci, "puz"), t = [];
        var rep = post[0];
        if (!rep) t.push(d.san + " doesn't do enough here.");
        else if (isMate(rep.score) && rep.score > 0) t.push("After " + d.san + ", the other side has checkmate: " + sanLine(after, rep.pv, 2 * mateIn(rep.score) - 1) + ".");
        else {
          var rd = describe(after, rep.move, "opp"), loss = lineGain(after, rep.pv, other(you), 6);
          t.push("After " + d.san + ", the reply " + rd.san + (rd.facts.length ? " " + joinFacts(rd.facts) : "") + (loss >= 1 ? ", and you lose " + gainText(loss) : ", and you haven't won anything") + ".");
        }
        var wd = describe(fen, want, "puz");
        var idea = wd.tags.mate ? "Look for a checkmate." : wd.tags.fork ? "Look for a move that attacks two things at once." : wd.tags.pin ? "Look for a pin." : wd.tags.check ? "Start with a check." : wd.tags.capture ? "Look at what you can capture." : "Look at checks, captures and threats.";
        t.push("Idea: " + idea);
        note.innerHTML = '<p class="co-t">\ud83c\udf93 <b>Coach:</b> ' + esc(t.join(" ")) + "</p>";
        note.appendChild(aiBlock(function () {
          return { kind: "puzzle-wrong", fen: fen, move: d.san, solution: sanOf(fen, want), facts: t.join(" "), goal: self.puzzle.prompt || "" };
        }));
      });
    } else if (this.over && /Solved/.test(this.over.title || "") && step === 0) {
      showIdea(this, fen, want);
    } else if (step === 0 && r) {
      // first correct move: name the idea right away
      showIdea(this, fen, want);
    }
    return r;
  };
  function showIdea(board, fen, want) {
    var d = describe(fen, want, "puz"), note = puzzleNote(board);
    var idea = d.tags.mate ? "a checkmate" : d.tags.fork ? "a fork" : d.tags.pin ? "a pin" : d.tags.win ? "winning material" : d.tags.check ? "a check that forces the reply" : "a strong move";
    note.innerHTML = '<p class="co-t">\ud83c\udf93 <b>Coach:</b> ' + esc(d.san + (d.facts.length ? " " + joinFacts(d.facts) : "") + ". The idea is " + idea + ".") + "</p>";
    note.appendChild(aiBlock(function () {
      return { kind: "puzzle-solved", fen: fen, move: d.san, facts: d.san + " " + joinFacts(d.facts), goal: board.puzzle.prompt || "", explain: board.puzzle.explain || "" };
    }));
  }
  // New puzzle attempt (Retry) clears the note
  var origNew = P.Board.prototype.newGame;
  P.Board.prototype.newGame = function () {
    var r = origNew.apply(this, arguments);
    if (this.kind === "puzzle") { var n = this.root.querySelector(".pz-coach"); if (n) n.innerHTML = ""; }
    return r;
  };

  window.CECoach = { start: startCoach, describe: describe, grade: grade, Book: Book, explainMove: explainMove, explainCoach: explainCoach, lineGain: lineGain, sanLine: sanLine, analyse: analyse, LEVELS: LEVELS, pickMove: pickMove };
  function init() { document.querySelectorAll(".coach[data-autostart]").forEach(startCoach); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
