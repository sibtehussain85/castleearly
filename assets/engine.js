/*
 * CastleEarly chess engine \u2014 full rules + a small computer opponent.
 * No dependencies. Works in the page, in a Web Worker, and in Node (for tests).
 * Squares: 0 = a1, 7 = h1, 56 = a8, 63 = h8.
 */
(function (root) {
  "use strict";

  var FILES = "abcdefgh";
  var START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  function sqName(s) { return FILES[s & 7] + ((s >> 3) + 1); }
  function sqIdx(n) { return FILES.indexOf(n[0]) + 8 * (parseInt(n[1], 10) - 1); }
  function colorOf(p) { return p === "" ? "" : (p === p.toUpperCase() ? "w" : "b"); }

  /* ---------- Precomputed tables ---------- */
  var KNT = [], KGT = [], RAYS = [];
  var DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]; // 0-3 diagonal, 4-7 straight
  (function () {
    var kn = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
    for (var s = 0; s < 64; s++) {
      var f = s & 7, r = s >> 3, i, nf, nr;
      KNT[s] = []; KGT[s] = []; RAYS[s] = [];
      for (i = 0; i < 8; i++) {
        nf = f + kn[i][0]; nr = r + kn[i][1];
        if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) KNT[s].push(nr * 8 + nf);
        nf = f + DIRS[i][0]; nr = r + DIRS[i][1];
        if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) KGT[s].push(nr * 8 + nf);
        var ray = []; nf = f; nr = r;
        while (true) {
          nf += DIRS[i][0]; nr += DIRS[i][1];
          if (nf < 0 || nf > 7 || nr < 0 || nr > 7) break;
          ray.push(nr * 8 + nf);
        }
        RAYS[s].push(ray);
      }
    }
  })();

  /* ---------- Game state ---------- */
  function Chess(fen) { this.load(fen || START_FEN); }

  Chess.prototype.load = function (fen) {
    var parts = fen.trim().split(/\s+/);
    if (parts.length < 4) throw new Error("Invalid FEN");
    this.board = new Array(64).fill("");
    this.kings = { w: -1, b: -1 };
    var rows = parts[0].split("/");
    if (rows.length !== 8) throw new Error("Invalid FEN board");
    for (var r = 0; r < 8; r++) {
      var f = 0;
      for (var c = 0; c < rows[r].length; c++) {
        var ch = rows[r][c];
        if (/\d/.test(ch)) f += parseInt(ch, 10);
        else {
          var s = (7 - r) * 8 + f;
          this.board[s] = ch;
          if (ch === "K") this.kings.w = s;
          if (ch === "k") this.kings.b = s;
          f++;
        }
      }
    }
    this.turn = parts[1] === "b" ? "b" : "w";
    this.castling = parts[2] === "-" ? "" : parts[2];
    this.ep = parts[3] === "-" ? -1 : sqIdx(parts[3]);
    this.half = parseInt(parts[4] || "0", 10);
    this.full = parseInt(parts[5] || "1", 10);
    this.stack = [];
    this.sanHistory = [];
    this.keys = [this.key()];
  };

  Chess.prototype.fen = function () {
    var out = [];
    for (var r = 7; r >= 0; r--) {
      var row = "", empty = 0;
      for (var f = 0; f < 8; f++) {
        var p = this.board[r * 8 + f];
        if (p === "") empty++;
        else { if (empty) { row += empty; empty = 0; } row += p; }
      }
      if (empty) row += empty;
      out.push(row);
    }
    return out.join("/") + " " + this.turn + " " + (this.castling || "-") + " " +
      (this.ep >= 0 ? sqName(this.ep) : "-") + " " + this.half + " " + this.full;
  };

  Chess.prototype.key = function () {
    return this.board.join(",") + this.turn + this.castling + this.ep;
  };

  /* ---------- Attacks ---------- */
  Chess.prototype.attacked = function (sq, by) {
    var b = this.board, f = sq & 7, i, s, p;
    // pawns
    if (by === "w") {
      if (f > 0 && sq - 9 >= 0 && b[sq - 9] === "P") return true;
      if (f < 7 && sq - 7 >= 0 && b[sq - 7] === "P") return true;
    } else {
      if (f < 7 && sq + 9 < 64 && b[sq + 9] === "p") return true;
      if (f > 0 && sq + 7 < 64 && b[sq + 7] === "p") return true;
    }
    var N = by === "w" ? "N" : "n", K = by === "w" ? "K" : "k";
    var B = by === "w" ? "B" : "b", R = by === "w" ? "R" : "r", Q = by === "w" ? "Q" : "q";
    for (i = 0; i < KNT[sq].length; i++) if (b[KNT[sq][i]] === N) return true;
    for (i = 0; i < KGT[sq].length; i++) if (b[KGT[sq][i]] === K) return true;
    for (var d = 0; d < 8; d++) {
      var ray = RAYS[sq][d];
      for (i = 0; i < ray.length; i++) {
        p = b[ray[i]];
        if (p === "") continue;
        if (p === Q || (d < 4 ? p === B : p === R)) return true;
        break;
      }
    }
    return false;
  };

  Chess.prototype.inCheck = function (color) {
    color = color || this.turn;
    return this.attacked(this.kings[color], color === "w" ? "b" : "w");
  };

  /* ---------- Move generation ---------- */
  // Move object: {from, to, piece, captured, promotion, flag}
  // flag: "n" normal, "b" double pawn push, "e" en passant, "k" castle kingside, "q" castle queenside
  Chess.prototype.pseudoMoves = function (capturesOnly) {
    var b = this.board, us = this.turn, them = us === "w" ? "b" : "w";
    var moves = [], s, p, i, t, tp;
    var promoPieces = us === "w" ? ["Q", "R", "B", "N"] : ["q", "r", "b", "n"];
    function add(from, to, piece, captured, flag, promoRank) {
      if (promoRank) {
        for (var k = 0; k < 4; k++) moves.push({ from: from, to: to, piece: piece, captured: captured, promotion: promoPieces[k], flag: flag });
      } else moves.push({ from: from, to: to, piece: piece, captured: captured, promotion: "", flag: flag });
    }
    for (s = 0; s < 64; s++) {
      p = b[s];
      if (p === "" || colorOf(p) !== us) continue;
      var type = p.toLowerCase();
      if (type === "p") {
        var dir = us === "w" ? 8 : -8;
        var startRank = us === "w" ? 1 : 6, lastRank = us === "w" ? 7 : 0;
        var one = s + dir, f = s & 7;
        var promo = (one >> 3) === lastRank;
        if (b[one] === "" && (!capturesOnly || promo)) {
          add(s, one, p, "", "n", promo);
          if (!capturesOnly && (s >> 3) === startRank && b[one + dir] === "") add(s, one + dir, p, "", "b", false);
        }
        var caps = us === "w" ? [[f > 0, s + 7], [f < 7, s + 9]] : [[f > 0, s - 9], [f < 7, s - 7]];
        for (i = 0; i < 2; i++) {
          if (!caps[i][0]) continue;
          t = caps[i][1]; tp = b[t];
          if (tp !== "" && colorOf(tp) === them) add(s, t, p, tp, "n", promo);
          else if (t === this.ep) add(s, t, p, us === "w" ? "p" : "P", "e", false);
        }
      } else if (type === "n" || type === "k") {
        var targets = type === "n" ? KNT[s] : KGT[s];
        for (i = 0; i < targets.length; i++) {
          t = targets[i]; tp = b[t];
          if (tp === "") { if (!capturesOnly) add(s, t, p, "", "n"); }
          else if (colorOf(tp) === them) add(s, t, p, tp, "n");
        }
        if (type === "k" && !capturesOnly) this.castleMoves(s, moves);
      } else {
        var d0 = type === "r" ? 4 : 0, d1 = type === "b" ? 4 : 8;
        for (var d = d0; d < d1; d++) {
          var ray = RAYS[s][d];
          for (i = 0; i < ray.length; i++) {
            t = ray[i]; tp = b[t];
            if (tp === "") { if (!capturesOnly) add(s, t, p, "", "n"); continue; }
            if (colorOf(tp) === them) add(s, t, p, tp, "n");
            break;
          }
        }
      }
    }
    return moves;
  };

  Chess.prototype.castleMoves = function (s, moves) {
    var b = this.board, us = this.turn, them = us === "w" ? "b" : "w";
    var home = us === "w" ? 4 : 60;
    if (s !== home) return;
    var K = us === "w" ? "K" : "k", Q = us === "w" ? "Q" : "q", R = us === "w" ? "R" : "r";
    if (this.castling.indexOf(K) >= 0 && b[home + 1] === "" && b[home + 2] === "" && b[home + 3] === R &&
        !this.attacked(home, them) && !this.attacked(home + 1, them) && !this.attacked(home + 2, them))
      moves.push({ from: home, to: home + 2, piece: b[home], captured: "", promotion: "", flag: "k" });
    if (this.castling.indexOf(Q) >= 0 && b[home - 1] === "" && b[home - 2] === "" && b[home - 3] === "" && b[home - 4] === R &&
        !this.attacked(home, them) && !this.attacked(home - 1, them) && !this.attacked(home - 2, them))
      moves.push({ from: home, to: home - 2, piece: b[home], captured: "", promotion: "", flag: "q" });
  };

  Chess.prototype.make = function (m) {
    var b = this.board, us = this.turn;
    this.stack.push({ m: m, castling: this.castling, ep: this.ep, half: this.half, full: this.full });
    b[m.to] = m.promotion || m.piece;
    b[m.from] = "";
    if (m.flag === "e") b[us === "w" ? m.to - 8 : m.to + 8] = "";
    if (m.flag === "k") { b[m.from + 1] = b[m.from + 3]; b[m.from + 3] = ""; }
    if (m.flag === "q") { b[m.from - 1] = b[m.from - 4]; b[m.from - 4] = ""; }
    var type = m.piece.toLowerCase();
    if (type === "k") this.kings[us] = m.to;
    // castling rights
    if (this.castling) {
      var c = this.castling;
      if (type === "k") c = c.replace(us === "w" ? /[KQ]/g : /[kq]/g, "");
      if (m.from === 0 || m.to === 0) c = c.replace("Q", "");
      if (m.from === 7 || m.to === 7) c = c.replace("K", "");
      if (m.from === 56 || m.to === 56) c = c.replace("q", "");
      if (m.from === 63 || m.to === 63) c = c.replace("k", "");
      this.castling = c;
    }
    this.ep = m.flag === "b" ? (m.from + m.to) >> 1 : -1;
    this.half = (type === "p" || m.captured) ? 0 : this.half + 1;
    if (us === "b") this.full++;
    this.turn = us === "w" ? "b" : "w";
  };

  Chess.prototype.unmake = function () {
    var st = this.stack.pop(), m = st.m, b = this.board;
    this.turn = this.turn === "w" ? "b" : "w";
    var us = this.turn;
    b[m.from] = m.piece;
    b[m.to] = m.flag === "e" ? "" : m.captured;
    if (m.flag === "e") b[us === "w" ? m.to - 8 : m.to + 8] = m.captured;
    if (m.flag === "k") { b[m.from + 3] = b[m.from + 1]; b[m.from + 1] = ""; }
    if (m.flag === "q") { b[m.from - 4] = b[m.from - 1]; b[m.from - 1] = ""; }
    if (m.piece.toLowerCase() === "k") this.kings[us] = m.from;
    this.castling = st.castling; this.ep = st.ep; this.half = st.half; this.full = st.full;
  };

  Chess.prototype.legalMoves = function (capturesOnly) {
    var us = this.turn, them = us === "w" ? "b" : "w", out = [];
    var pm = this.pseudoMoves(capturesOnly);
    for (var i = 0; i < pm.length; i++) {
      this.make(pm[i]);
      if (!this.attacked(this.kings[us], them)) out.push(pm[i]);
      this.unmake();
    }
    return out;
  };

  /* ---------- Public helpers ---------- */
  Chess.prototype.san = function (m, legal) {
    var s;
    if (m.flag === "k") s = "O-O";
    else if (m.flag === "q") s = "O-O-O";
    else {
      var type = m.piece.toUpperCase();
      var cap = m.captured !== "";
      if (type === "P") {
        s = (cap ? FILES[m.from & 7] + "x" : "") + sqName(m.to) + (m.promotion ? "=" + m.promotion.toUpperCase() : "");
      } else {
        var amb = false, sameFile = false, sameRank = false;
        for (var i = 0; i < legal.length; i++) {
          var o = legal[i];
          if (o.piece === m.piece && o.to === m.to && o.from !== m.from) {
            amb = true;
            if ((o.from & 7) === (m.from & 7)) sameFile = true;
            if ((o.from >> 3) === (m.from >> 3)) sameRank = true;
          }
        }
        var dis = "";
        if (amb) {
          if (!sameFile) dis = FILES[m.from & 7];
          else if (!sameRank) dis = String((m.from >> 3) + 1);
          else dis = sqName(m.from);
        }
        s = type + dis + (cap ? "x" : "") + sqName(m.to);
      }
    }
    this.make(m);
    if (this.inCheck()) s += this.legalMoves().length === 0 ? "#" : "+";
    this.unmake();
    return s;
  };

  // Returns moves with readable fields. Optional: only moves from one square.
  Chess.prototype.moves = function (fromName) {
    var legal = this.legalMoves(), out = [];
    for (var i = 0; i < legal.length; i++) {
      var m = legal[i];
      if (fromName && sqName(m.from) !== fromName) continue;
      out.push({ from: sqName(m.from), to: sqName(m.to), piece: m.piece, captured: m.captured, promotion: m.promotion, flag: m.flag });
    }
    return out;
  };

  // Plays a move given as {from:"e2", to:"e4", promotion:"q"} or "e2e4" / "e7e8q". Returns move info or null.
  Chess.prototype.move = function (mv) {
    if (typeof mv === "string") mv = { from: mv.slice(0, 2), to: mv.slice(2, 4), promotion: mv[4] || "" };
    var legal = this.legalMoves(), from = sqIdx(mv.from), to = sqIdx(mv.to);
    for (var i = 0; i < legal.length; i++) {
      var m = legal[i];
      if (m.from !== from || m.to !== to) continue;
      if (m.promotion && m.promotion.toLowerCase() !== (mv.promotion || "q").toLowerCase()) continue;
      var san = this.san(m, legal);
      this.make(m);
      this.sanHistory.push(san);
      this.keys.push(this.key());
      return { from: mv.from, to: mv.to, piece: m.piece, captured: m.captured, promotion: m.promotion, flag: m.flag, san: san };
    }
    return null;
  };

  Chess.prototype.undo = function () {
    if (!this.stack.length) return null;
    var m = this.stack[this.stack.length - 1].m;
    this.unmake();
    this.sanHistory.pop();
    this.keys.pop();
    return { from: sqName(m.from), to: sqName(m.to) };
  };

  Chess.prototype.history = function () { return this.sanHistory.slice(); };
  Chess.prototype.get = function (name) { return this.board[sqIdx(name)]; };
  Chess.prototype.isCheckmate = function () { return this.inCheck() && this.legalMoves().length === 0; };
  Chess.prototype.isStalemate = function () { return !this.inCheck() && this.legalMoves().length === 0; };
  Chess.prototype.isInsufficient = function () {
    var minors = 0, bishopsColor = [];
    for (var s = 0; s < 64; s++) {
      var p = this.board[s].toLowerCase();
      if (p === "" || p === "k") continue;
      if (p === "p" || p === "r" || p === "q") return false;
      minors++;
      if (p === "b") bishopsColor.push(((s >> 3) + (s & 7)) % 2);
    }
    if (minors <= 1) return true;
    if (minors === bishopsColor.length && bishopsColor.every(function (c) { return c === bishopsColor[0]; })) return true;
    return false;
  };
  Chess.prototype.isRepetition = function () {
    var k = this.keys[this.keys.length - 1], n = 0;
    for (var i = 0; i < this.keys.length; i++) if (this.keys[i] === k) n++;
    return n >= 3;
  };
  Chess.prototype.status = function () {
    var noMoves = this.legalMoves().length === 0;
    if (noMoves && this.inCheck()) return { over: true, result: this.turn === "w" ? "0-1" : "1-0", reason: "checkmate" };
    if (noMoves) return { over: true, result: "1/2-1/2", reason: "stalemate" };
    if (this.isInsufficient()) return { over: true, result: "1/2-1/2", reason: "insufficient material" };
    if (this.half >= 100) return { over: true, result: "1/2-1/2", reason: "50-move rule" };
    if (this.isRepetition()) return { over: true, result: "1/2-1/2", reason: "threefold repetition" };
    return { over: false };
  };

  /* ---------- Computer opponent ---------- */
  var VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  // Piece-square tables from White's point of view, index 0 = a8 (row by row from rank 8).
  var PST = {
    p: [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
    n: [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
    b: [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
    r: [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
    q: [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
    k: [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20],
    ke: [-50,-40,-30,-20,-20,-30,-40,-50, -30,-20,-10,0,0,-10,-20,-30, -30,-10,20,30,30,20,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,20,30,30,20,-10,-30, -30,-30,0,0,0,0,-30,-30, -50,-30,-30,-30,-30,-30,-30,-50]
  };
  var MATE = 100000;

  // Score from the point of view of the side to move.
  Chess.prototype.evaluate = function () {
    var b = this.board, score = 0, nonPawn = 0, s, p, t;
    for (s = 0; s < 64; s++) { p = b[s]; if (p !== "" && "nbrq".indexOf(p.toLowerCase()) >= 0) nonPawn += VAL[p.toLowerCase()]; }
    var endgame = nonPawn <= 2600;
    for (s = 0; s < 64; s++) {
      p = b[s];
      if (p === "") continue;
      t = p.toLowerCase();
      var white = p !== t;
      var idx = white ? (7 - (s >> 3)) * 8 + (s & 7) : (s >> 3) * 8 + (s & 7);
      var tbl = t === "k" && endgame ? PST.ke : PST[t];
      var v = VAL[t] + tbl[idx];
      score += white ? v : -v;
    }
    // In endgames, push the losing king to the edge and bring kings together (helps checkmate)
    if (endgame) {
      var wk = this.kings.w, bk = this.kings.b;
      var dist = Math.abs((wk & 7) - (bk & 7)) + Math.abs((wk >> 3) - (bk >> 3));
      if (score > 300) score += (14 - dist) * 6 + centerDist(bk) * 10;
      if (score < -300) score -= (14 - dist) * 6 + centerDist(wk) * 10;
    }
    return this.turn === "w" ? score : -score;
  };
  function centerDist(s) { var f = s & 7, r = s >> 3; return Math.max(3 - f, f - 4) + Math.max(3 - r, r - 4); }

  function orderMoves(moves, best) {
    for (var i = 0; i < moves.length; i++) {
      var m = moves[i], sc = 0;
      if (best && m.from === best.from && m.to === best.to && m.promotion === best.promotion) sc = 1e6;
      else {
        if (m.captured) sc += 10 * VAL[m.captured.toLowerCase()] - VAL[m.piece.toLowerCase()] + 1000;
        if (m.promotion) sc += VAL[m.promotion.toLowerCase()];
      }
      m._s = sc;
    }
    moves.sort(function (a, b) { return b._s - a._s; });
    return moves;
  }

  Chess.prototype.quiesce = function (alpha, beta, ctx) {
    ctx.nodes++;
    var stand = this.evaluate();
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;
    var us = this.turn, them = us === "w" ? "b" : "w";
    var moves = orderMoves(this.pseudoMoves(true));
    for (var i = 0; i < moves.length; i++) {
      this.make(moves[i]);
      if (this.attacked(this.kings[us], them)) { this.unmake(); continue; }
      var sc = -this.quiesce(-beta, -alpha, ctx);
      this.unmake();
      if (sc >= beta) return beta;
      if (sc > alpha) alpha = sc;
    }
    return alpha;
  };

  Chess.prototype.search = function (depth, alpha, beta, ply, ctx) {
    if (ctx.nodes++ % 2048 === 0 && Date.now() > ctx.deadline) ctx.stop = true;
    if (ctx.stop) return 0;
    if (ply > 0 && this.half >= 100) return 0;
    if (depth <= 0) return this.quiesce(alpha, beta, ctx);
    var us = this.turn, them = us === "w" ? "b" : "w";
    var inCheck = this.attacked(this.kings[us], them);
    if (inCheck) depth++;
    var moves = orderMoves(this.pseudoMoves(false), ply === 0 ? ctx.pv : null);
    var legal = 0, bestScore = -MATE * 2;
    for (var i = 0; i < moves.length; i++) {
      var m = moves[i];
      this.make(m);
      if (this.attacked(this.kings[us], them)) { this.unmake(); continue; }
      legal++;
      var sc = -this.search(depth - 1, -beta, -alpha, ply + 1, ctx);
      this.unmake();
      if (ctx.stop) return 0;
      if (sc > bestScore) {
        bestScore = sc;
        if (ply === 0) ctx.best = m;
      }
      if (sc > alpha) alpha = sc;
      if (alpha >= beta) break;
    }
    if (legal === 0) return inCheck ? -MATE + ply : 0;
    return bestScore;
  };

  // Root move scores (used for weaker levels so they make human-like, not random, moves)
  Chess.prototype.scoreRootMoves = function (depth, ctx) {
    var us = this.turn, them = us === "w" ? "b" : "w", out = [];
    var moves = orderMoves(this.pseudoMoves(false));
    for (var i = 0; i < moves.length; i++) {
      this.make(moves[i]);
      if (this.attacked(this.kings[us], them)) { this.unmake(); continue; }
      var sc;
      if (this.legalMoves().length === 0) sc = this.inCheck() ? MATE : 0; // mate or stalemate right now
      else sc = -this.search(depth - 1, -MATE * 2, MATE * 2, 1, ctx);
      this.unmake();
      out.push({ m: moves[i], s: sc });
    }
    return out;
  };

  // Small opening book so the computer opens like a person (popular, sound first moves).
  var BOOK_LINES = [
    "e2e4 e7e5 g1f3 b8c6 f1c4 f8c5", "e2e4 e7e5 g1f3 b8c6 f1b5 a7a6", "e2e4 e7e5 g1f3 b8c6 d2d4 e5d4",
    "e2e4 c7c5 g1f3 d7d6 d2d4 c5d4", "e2e4 c7c5 g1f3 b8c6", "e2e4 e7e6 d2d4 d7d5", "e2e4 c7c6 d2d4 d7d5",
    "d2d4 d7d5 c2c4 e7e6", "d2d4 d7d5 c1f4 g8f6", "d2d4 g8f6 c2c4 e7e6", "d2d4 g8f6 c2c4 g7g6",
    "g1f3 d7d5 d2d4 g8f6", "c2c4 e7e5 b1c3 g8f6"
  ];
  var BOOK = null;
  function bookKey(c) { return c.board.join(",") + c.turn; }
  function buildBook() {
    BOOK = {};
    BOOK_LINES.forEach(function (line) {
      var c = new Chess();
      line.split(" ").forEach(function (mv) {
        var k = bookKey(c);
        (BOOK[k] = BOOK[k] || []).indexOf(mv) < 0 && BOOK[k].push(mv);
        c.move(mv);
      });
    });
  }

  // level: "easy" | "medium" | "hard". Returns "e2e4"-style string or null.
  Chess.prototype.bestMove = function (level, rand) {
    rand = rand || Math.random;
    var legal = this.legalMoves();
    if (!legal.length) return null;
    if (level !== "easy") {
      if (!BOOK) buildBook();
      var book = BOOK[bookKey(this)];
      if (book) return book[Math.floor(rand() * book.length)];
    }
    var ctx = { nodes: 0, stop: false, deadline: Date.now() + 60000, best: null, pv: null };
    var pick;
    if (level === "easy" || level === "medium") {
      var depth = level === "easy" ? 1 : 2;
      var noise = level === "easy" ? 120 : 35;
      var scored = this.scoreRootMoves(depth, ctx);
      for (var i = 0; i < scored.length; i++) {
        // never miss a mate in one, even on easy
        if (scored[i].s > MATE - 10) { pick = scored[i].m; break; }
        scored[i].n = scored[i].s + (rand() * 2 - 1) * noise;
      }
      if (!pick) {
        scored.sort(function (a, b) { return b.n - a.n; });
        pick = scored[0].m;
      }
    } else {
      ctx.deadline = Date.now() + (level === "max" ? 3000 : 1200);
      var bestSoFar = null;
      for (var d = 1; d <= 6; d++) {
        ctx.best = null; ctx.stop = false;
        var sc = this.search(d, -MATE * 2, MATE * 2, 0, ctx);
        if (ctx.stop) break;
        bestSoFar = ctx.best; ctx.pv = ctx.best;
        if (Math.abs(sc) > MATE - 100) break;
      }
      pick = bestSoFar || legal[0];
    }
    return sqName(pick.from) + sqName(pick.to) + (pick.promotion ? pick.promotion.toLowerCase() : "");
  };

  // Game review: best move + score, and the score of the move actually played, at the same depth.
  // Scores are from the point of view of the side to move. Returns uci strings.
  Chess.prototype.analyze = function (ms, played, maxDepth) {
    var legal = this.legalMoves(), us = this.turn;
    var out = { best: null, score: 0, played: played || null, playedScore: null, depth: 0, n: legal.length };
    if (!legal.length) { out.score = this.inCheck() ? -MATE : 0; return out; }
    var pm = null;
    if (played) for (var i = 0; i < legal.length; i++) {
      var u = sqName(legal[i].from) + sqName(legal[i].to) + (legal[i].promotion ? legal[i].promotion.toLowerCase() : "");
      if (u === played) pm = legal[i];
    }
    var ctx = { nodes: 0, stop: false, deadline: Date.now() + ms, best: null, pv: null };
    maxDepth = maxDepth || 8;
    for (var d = 1; d <= maxDepth; d++) {
      ctx.best = null; ctx.stop = false;
      var sc = this.search(d, -MATE * 2, MATE * 2, 0, ctx);
      if (ctx.stop || !ctx.best) break;
      var best = ctx.best, psc = sc;
      if (pm && !(pm.from === best.from && pm.to === best.to && pm.promotion === best.promotion)) {
        var saveDl = ctx.deadline;
        ctx.deadline = Date.now() + Math.max(ms, 400) * 2; // finish this depth for the played move
        this.make(pm);
        psc = -this.search(d - 1, -MATE * 2, MATE * 2, 1, ctx);
        this.unmake();
        ctx.deadline = saveDl;
        if (ctx.stop) break;
        if (psc > sc) { sc = psc; best = pm; } // same score: the played move is as good
      }
      out.best = sqName(best.from) + sqName(best.to) + (best.promotion ? best.promotion.toLowerCase() : "");
      out.score = sc; out.playedScore = pm ? psc : null; out.depth = d;
      ctx.pv = best;
      if (Math.abs(sc) > MATE - 100) break;
      if (Date.now() > ctx.deadline) break;
    }
    if (!out.best) { // nothing finished (very slow device): fall back to a 1-ply look
      var sr = this.scoreRootMoves(1, { nodes: 0, stop: false, deadline: Date.now() + 1e9 });
      sr.sort(function (a, b) { return b.s - a.s; });
      out.best = sqName(sr[0].m.from) + sqName(sr[0].m.to) + (sr[0].m.promotion ? sr[0].m.promotion.toLowerCase() : "");
      out.score = sr[0].s; out.depth = 1;
      if (pm) sr.forEach(function (x) { if (x.m === pm) out.playedScore = x.s; });
    }
    if (pm && out.playedScore === null) out.playedScore = out.score;
    return out;
  };
  Chess.MATE = MATE;
  Chess.inBook = function (fen, uci) {
    if (!BOOK) buildBook();
    var b = BOOK[bookKey(new Chess(fen))];
    return !!(b && b.indexOf(uci) >= 0);
  };

  Chess.START_FEN = START_FEN;
  Chess.sqName = sqName;
  Chess.sqIdx = sqIdx;

  /* ---------- Exports ---------- */
  if (typeof module !== "undefined" && module.exports) module.exports = Chess;
  else root.CEChess = Chess;

  // When loaded as a Web Worker: answer {fen, level} with {move}
  if (typeof window === "undefined" && typeof importScripts === "function") {
    root.onmessage = function (e) {
      try {
        var c = new Chess(e.data.fen);
        if (e.data.analyze) root.postMessage({ id: e.data.id, analysis: c.analyze(e.data.analyze.ms, e.data.analyze.played, e.data.analyze.depth) });
        else root.postMessage({ id: e.data.id, move: c.bestMove(e.data.level) });
      } catch (err) { root.postMessage({ id: e.data.id, error: String(err) }); }
    };
  }
})(typeof self !== "undefined" ? self : this);
