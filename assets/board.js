/*
 * CastleEarly opening trainer
 * Plain JavaScript, no libraries. Each <div class="trainer"> on a page holds a
 * <script type="application/json"> with the line to teach:
 *   { "orientation": "white", "practiceSide": "white",
 *     "moves": [ { "uci": "e2e4", "san": "e4", "note": "..." }, ... ] }
 */
(function () {
  "use strict";

  var FILES = "abcdefgh";
  var START = "rnbqkbnrpppppppp" + "................................" + "PPPPPPPPRNBQKBNR";

  /* ---------- Position logic (pure, testable) ---------- */

  // board: array of 64, index = file + 8 * (7 - rank)  -> a8 is 0, h1 is 63
  function startBoard() { return START.split("").map(function (c) { return c === "." ? null : c; }); }

  function sqIndex(name) {
    var f = FILES.indexOf(name[0]);
    var r = parseInt(name[1], 10) - 1;
    if (f < 0 || r < 0 || r > 7) throw new Error("Bad square " + name);
    return f + 8 * (7 - r);
  }
  function sqName(i) { return FILES[i % 8] + (8 - Math.floor(i / 8)); }
  function isWhite(p) { return p && p === p.toUpperCase(); }

  // Applies a move written as UCI ("e2e4", "e1g1", "e7e8q"). Returns a new board.
  function applyMove(board, uci) {
    var b = board.slice();
    var from = sqIndex(uci.slice(0, 2));
    var to = sqIndex(uci.slice(2, 4));
    var piece = b[from];
    if (!piece) throw new Error("No piece on " + uci.slice(0, 2) + " for move " + uci);
    var kind = piece.toLowerCase();
    var df = (to % 8) - (from % 8);

    // Castling: king moves two files, rook jumps over
    if (kind === "k" && Math.abs(df) === 2) {
      var row = Math.floor(from / 8) * 8;
      if (df > 0) { b[row + 5] = b[row + 7]; b[row + 7] = null; }
      else { b[row + 3] = b[row + 0]; b[row + 0] = null; }
    }
    // En passant: pawn moves diagonally to an empty square
    if (kind === "p" && df !== 0 && !b[to]) {
      var capturedSq = Math.floor(from / 8) * 8 + (to % 8);
      b[capturedSq] = null;
    }
    b[to] = piece;
    b[from] = null;
    // Promotion
    if (uci.length === 5) {
      var promo = uci[4];
      b[to] = isWhite(piece) ? promo.toUpperCase() : promo.toLowerCase();
    }
    return b;
  }

  // Basic sanity check used by the test script: the piece moving belongs to the
  // side to move, and it does not land on its own piece.
  function validateLine(moves) {
    var b = startBoard();
    for (var i = 0; i < moves.length; i++) {
      var m = moves[i];
      var from = sqIndex(m.uci.slice(0, 2));
      var to = sqIndex(m.uci.slice(2, 4));
      var p = b[from];
      var whiteToMove = i % 2 === 0;
      if (!p) return "Move " + (i + 1) + " (" + m.san + "): no piece on " + m.uci.slice(0, 2);
      if (isWhite(p) !== whiteToMove) return "Move " + (i + 1) + " (" + m.san + "): wrong side's piece";
      if (b[to] && isWhite(b[to]) === whiteToMove) return "Move " + (i + 1) + " (" + m.san + "): lands on own piece";
      var letter = m.san.replace(/[+#!?x=]/g, "")[0];
      var expected = /[KQRBN]/.test(letter) ? letter : (m.san.indexOf("O-O") === 0 ? "K" : "P");
      if (p.toUpperCase() !== expected) return "Move " + (i + 1) + " (" + m.san + "): piece on " + m.uci.slice(0, 2) + " is " + p;
      b = applyMove(b, m.uci);
    }
    return null;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { startBoard: startBoard, applyMove: applyMove, validateLine: validateLine, sqIndex: sqIndex, sqName: sqName };
    return;
  }

  /* ---------- Piece artwork (original simple SVG set) ---------- */

  var SHAPES = {
    p: '<circle cx="22.5" cy="14" r="5.5"/><path d="M16 34c.5-6 2.5-10 6.5-12.5C26.5 24 28.5 28 29 34z"/><rect x="12" y="34" width="21" height="5" rx="2"/>',
    r: '<path d="M12 18V10h4v3h4v-3h5v3h4v-3h4v8z"/><rect x="15" y="18" width="15" height="16"/><rect x="11" y="34" width="23" height="5" rx="2"/>',
    n: '<path d="M14 34c0-7 3-11 6-15-3 0-5 1-7 2.5l-2.5-2.5C12 14 15 10 19 8l2-4 1.5 3.5C29 9 33 17 33 34z"/><circle class="dt" cx="19.5" cy="13" r="1.4"/><rect x="11" y="34" width="23" height="5" rx="2"/>',
    b: '<circle cx="22.5" cy="9" r="2.6"/><path d="M16 33c-1-8 1.5-14 6.5-20.5C27.5 19 30 25 29 33z"/><path class="ln" d="M25 17l-5 6"/><rect x="11" y="33" width="23" height="6" rx="2"/>',
    q: '<path d="M13 34L10 16l6 9 2.5-12 4 11 4-11L29 25l6-9-3 18z"/><circle cx="10" cy="14.5" r="2.2"/><circle cx="18.5" cy="11.5" r="2.2"/><circle cx="26.5" cy="11.5" r="2.2"/><circle cx="35" cy="14.5" r="2.2"/><rect x="11" y="34" width="23" height="5" rx="2"/>',
    k: '<rect x="21" y="4" width="3" height="11"/><rect x="17.5" y="7" width="10" height="3"/><path d="M14 34c-2-6-1-12 4-14 3-1.2 6-1.2 9 0 5 2 6 8 4 14z"/><rect x="11" y="34" width="23" height="5" rx="2"/>'
  };

  function pieceSVG(p) {
    if (window.CE_PIECE_SVG) return window.CE_PIECE_SVG(p);
    var white = isWhite(p);
    var fill = white ? "#fbf8f1" : "#26221d";
    var stroke = white ? "#26221d" : "#0f0d0b";
    var detail = white ? "#26221d" : "#fbf8f1";
    return '<svg viewBox="0 0 45 45" aria-hidden="true"><g fill="' + fill + '" stroke="' + stroke +
      '" stroke-width="1.5" stroke-linejoin="round">' +
      SHAPES[p.toLowerCase()].replace('class="dt"', 'fill="' + detail + '" stroke="none"')
        .replace('class="ln"', 'fill="none" stroke="' + detail + '" stroke-linecap="round"') +
      "</g></svg>";
  }
  var NAMES = { p: "pawn", r: "rook", n: "knight", b: "bishop", q: "queen", k: "king" };

  /* ---------- Trainer UI ---------- */

  function Trainer(root) {
    var cfgEl = root.querySelector('script[type="application/json"]');
    this.cfg = JSON.parse(cfgEl.textContent);
    this.root = root;
    this.moves = this.cfg.moves;
    this.flip = this.cfg.orientation === "black";
    this.practiceSide = this.cfg.practiceSide || this.cfg.orientation || "white";
    this.positions = [startBoard()];
    for (var i = 0; i < this.moves.length; i++) this.positions.push(applyMove(this.positions[i], this.moves[i].uci));
    this.ply = 0;
    this.mode = "learn";
    this.selected = null;
    this.misses = 0;
    this.build();
    this.render();
  }

  Trainer.prototype.build = function () {
    var self = this;
    var title = this.cfg.title || "Interactive board";
    this.root.innerHTML =
      '<div class="board-wrap"><div class="board" role="grid" aria-label="Chess board"></div>' +
      '<div class="controls">' +
      '<button type="button" data-a="start" aria-label="Go to start">&#9198;</button>' +
      '<button type="button" data-a="prev" aria-label="Previous move">&#9664;</button>' +
      '<button type="button" data-a="next" aria-label="Next move">&#9654;</button>' +
      '<button type="button" data-a="end" aria-label="Go to last move">&#9197;</button>' +
      '<button type="button" data-a="flip" aria-label="Flip board">&#8645;</button>' +
      "</div></div>" +
      '<div class="side"><h3>' + title + "</h3>" +
      '<div class="mode-tabs" role="group" aria-label="Mode">' +
      '<button type="button" data-m="learn" aria-pressed="true">Learn</button>' +
      '<button type="button" data-m="practice" aria-pressed="false">Practice</button></div>' +
      '<div class="note" aria-live="polite"></div>' +
      '<div class="movelist"></div><div class="progress"></div></div>';

    this.boardEl = this.root.querySelector(".board");
    this.noteEl = this.root.querySelector(".note");
    this.listEl = this.root.querySelector(".movelist");
    this.progEl = this.root.querySelector(".progress");

    // Squares
    this.squares = [];
    for (var i = 0; i < 64; i++) {
      var sq = document.createElement("div");
      sq.className = "sq";
      sq.setAttribute("role", "gridcell");
      sq.addEventListener("click", this.onSquare.bind(this));
      this.squares.push(sq);
    }

    // Move list
    var html = "";
    for (var m = 0; m < this.moves.length; m++) {
      if (m % 2 === 0) html += '<span class="pair"><span class="num">' + (m / 2 + 1) + ".</span>";
      html += '<button type="button" data-ply="' + (m + 1) + '">' + this.moves[m].san + "</button>";
      if (m % 2 === 1 || m === this.moves.length - 1) html += "</span>";
    }
    this.listEl.innerHTML = html;
    this.listEl.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (self.mode !== "learn") self.setMode("learn");
      self.go(parseInt(b.getAttribute("data-ply"), 10));
    });

    this.root.querySelector(".controls").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var a = b.getAttribute("data-a");
      if (a === "flip") { self.flip = !self.flip; self.render(); return; }
      if (self.mode !== "learn") self.setMode("learn");
      if (a === "start") self.go(0);
      if (a === "prev") self.go(self.ply - 1);
      if (a === "next") self.go(self.ply + 1);
      if (a === "end") self.go(self.moves.length);
    });

    this.root.querySelector(".mode-tabs").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (b) self.setMode(b.getAttribute("data-m"));
    });

    this.root.tabIndex = 0;
    this.root.addEventListener("keydown", function (e) {
      if (self.mode !== "learn") return;
      if (e.key === "ArrowRight") { self.go(self.ply + 1); e.preventDefault(); }
      if (e.key === "ArrowLeft") { self.go(self.ply - 1); e.preventDefault(); }
    });
  };

  Trainer.prototype.go = function (ply) {
    var prev = this.ply;
    this.ply = Math.max(0, Math.min(this.moves.length, ply));
    this.selected = null;
    this.render();
    if (this.ply === prev + 1) this.slide(this.moves[prev].uci);
  };

  // Smoothly slide the piece that just moved (and the rook when castling)
  Trainer.prototype.slide = function (uci) {
    var snd = window.CESound;
    if (snd) {
      var before = this.positions[this.ply - 1], f0 = sqIndex(uci.slice(0, 2)), t0 = sqIndex(uci.slice(2, 4));
      var mover = before && before[f0];
      if (mover && mover.toLowerCase() === "k" && Math.abs((t0 % 8) - (f0 % 8)) === 2) snd.castle();
      else if (before && (before[t0] || (mover && mover.toLowerCase() === "p" && (t0 % 8) !== (f0 % 8)))) snd.capture();
      else snd.move();
    }
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var self = this, from = sqIndex(uci.slice(0, 2)), to = sqIndex(uci.slice(2, 4));
    var pairs = [[from, to]];
    var p = this.positions[this.ply][to];
    if (p && p.toLowerCase() === "k" && Math.abs((to % 8) - (from % 8)) === 2) {
      var row = Math.floor(from / 8) * 8;
      pairs.push((to % 8) > (from % 8) ? [row + 7, row + 5] : [row, row + 3]);
    }
    pairs.forEach(function (pr) {
      var el = self.squares[pr[1]].querySelector(".pc");
      if (!el || !el.animate) return;
      var a = self.flip ? 63 - pr[0] : pr[0], b2 = self.flip ? 63 - pr[1] : pr[1];
      var dx = (a % 8) - (b2 % 8), dy = Math.floor(a / 8) - Math.floor(b2 / 8);
      el.style.zIndex = 6;
      el.animate([{ transform: "translate(" + dx * 100 + "%," + dy * 100 + "%)" }, { transform: "none" }],
        { duration: 190, easing: "cubic-bezier(.25,.8,.3,1)" }).onfinish = function () { el.style.zIndex = ""; };
    });
  };

  Trainer.prototype.userColorIsWhite = function () { return this.practiceSide === "white"; };
  Trainer.prototype.isUserTurn = function () { return (this.ply % 2 === 0) === this.userColorIsWhite(); };

  Trainer.prototype.setMode = function (mode) {
    this.mode = mode;
    this.root.classList.toggle("practice", mode === "practice");
    var tabs = this.root.querySelectorAll(".mode-tabs button");
    for (var i = 0; i < tabs.length; i++) tabs[i].setAttribute("aria-pressed", tabs[i].getAttribute("data-m") === mode ? "true" : "false");
    this.selected = null;
    this.misses = 0;
    this.feedback = null;
    if (mode === "practice") {
      this.ply = 0;
      this.flip = this.practiceSide === "black";
      this.render();
      this.autoReply();
    } else {
      this.render();
    }
  };

  // In practice mode, play the opponent's moves automatically.
  Trainer.prototype.autoReply = function () {
    var self = this;
    if (this.mode !== "practice" || this.ply >= this.moves.length || this.isUserTurn()) { this.render(); return; }
    this.render();
    setTimeout(function () {
      if (self.mode !== "practice") return;
      self.ply++;
      self.render();
      self.slide(self.moves[self.ply - 1].uci);
    }, 450);
  };

  Trainer.prototype.onSquare = function (e) {
    if (this.mode !== "practice" || this.ply >= this.moves.length || !this.isUserTurn()) return;
    var idx = parseInt(e.currentTarget.getAttribute("data-i"), 10);
    var board = this.positions[this.ply];
    var p = board[idx];
    var mine = p && isWhite(p) === this.userColorIsWhite();

    if (this.selected === null || mine) {
      if (mine) { this.selected = idx; this.render(); }
      return;
    }
    var expected = this.moves[this.ply];
    var tried = sqName(this.selected) + sqName(idx);
    if (tried === expected.uci.slice(0, 4)) {
      this.selected = null;
      this.misses = 0;
      this.feedback = { ok: true, text: "<strong>Correct: " + expected.san + ".</strong> " + expected.note };
      this.ply++;
      if (this.ply >= this.moves.length) {
        this.feedback = { ok: true, text: "<strong>Line complete!</strong> You played the whole opening. Press Practice again to repeat it, or try it from the other side." };
      }
      this.autoReply();
      this.slide(expected.uci);
    } else {
      this.misses++;
      if (window.CESound) window.CESound.wrong();
      var sqEl = this.squares[idx];
      sqEl.classList.remove("wrong"); void sqEl.offsetWidth; sqEl.classList.add("wrong");
      this.selected = null;
      this.feedback = { ok: false, text: this.misses >= 2
        ? "<strong>Hint:</strong> move the piece on the highlighted square."
        : "<strong>Not this time.</strong> Think about the opening's main idea and try again." };
      this.render();
    }
  };

  Trainer.prototype.render = function () {
    var board = this.positions[this.ply];
    var last = this.ply > 0 ? this.moves[this.ply - 1].uci : null;
    var lastFrom = last ? sqIndex(last.slice(0, 2)) : -1;
    var lastTo = last ? sqIndex(last.slice(2, 4)) : -1;
    var hintSq = -1;
    if (this.mode === "practice" && this.misses >= 2 && this.ply < this.moves.length) hintSq = sqIndex(this.moves[this.ply].uci.slice(0, 2));

    this.boardEl.innerHTML = "";
    for (var v = 0; v < 64; v++) {
      var i = this.flip ? 63 - v : v;
      var sq = this.squares[i];
      var file = i % 8, rankRow = Math.floor(i / 8);
      var light = (file + rankRow) % 2 === 0;
      sq.className = "sq " + (light ? "l" : "d") +
        (i === lastFrom || i === lastTo ? " last" : "") +
        (i === this.selected ? " sel" : "") +
        (i === hintSq ? " hint" : "");
      sq.setAttribute("data-i", i);
      var p = board[i];
      var label = sqName(i) + (p ? ", " + (isWhite(p) ? "white " : "black ") + NAMES[p.toLowerCase()] : "");
      sq.setAttribute("aria-label", label);
      var inner = "";
      var col = v % 8, row = Math.floor(v / 8);
      if (row === 7) inner += '<span class="coord f">' + FILES[file] + "</span>";
      if (col === 0) inner += '<span class="coord r">' + (8 - rankRow) + "</span>";
      if (p) inner += '<span class="pc">' + pieceSVG(p) + "</span>";
      sq.innerHTML = inner;
      this.boardEl.appendChild(sq);
    }

    // Note panel
    this.noteEl.className = "note" + (this.feedback ? (this.feedback.ok ? " ok" : " err") : "");
    if (this.mode === "practice") {
      if (this.feedback) this.noteEl.innerHTML = this.feedback.text;
      else this.noteEl.innerHTML = "<strong>Practice mode.</strong> You play " + this.practiceSide +
        ". Tap a piece, then tap the square it should move to.";
      if (this.ply < this.moves.length && !this.isUserTurn() && !this.feedback) this.noteEl.innerHTML += " Waiting for the opponent\u2026";
    } else if (this.ply === 0) {
      this.noteEl.innerHTML = this.cfg.intro || "Press \u25b6 to step through the opening move by move.";
    } else {
      var m = this.moves[this.ply - 1];
      var num = Math.floor((this.ply - 1) / 2) + 1 + ((this.ply - 1) % 2 === 0 ? ". " : "... ");
      this.noteEl.innerHTML = "<strong>" + num + m.san + "</strong> \u2014 " + m.note;
    }

    // Move list highlight
    var btns = this.listEl.querySelectorAll("button");
    for (var b = 0; b < btns.length; b++) btns[b].classList.toggle("cur", parseInt(btns[b].getAttribute("data-ply"), 10) === this.ply);

    // Controls
    var ctr = this.root.querySelectorAll(".controls button");
    ctr[0].disabled = ctr[1].disabled = this.ply === 0 && this.mode === "learn";
    ctr[2].disabled = ctr[3].disabled = this.ply === this.moves.length && this.mode === "learn";

    this.progEl.textContent = this.mode === "practice"
      ? "Progress: " + Math.floor(this.ply / 2) + " / " + Math.ceil(this.moves.length / 2) + " moves"
      : "Move " + this.ply + " of " + this.moves.length + " \u00b7 Use \u2190 \u2192 keys on desktop";
    if (this.mode === "practice" && this.feedback && this.feedback.ok && this.ply < this.moves.length) {
      var self = this;
      clearTimeout(this._fb);
      this._fb = setTimeout(function () { if (self.feedback && self.feedback.ok) { self.feedback = null; } }, 2500);
    }
  };

  function init() {
    var els = document.querySelectorAll(".trainer");
    for (var i = 0; i < els.length; i++) {
      try { new Trainer(els[i]); }
      catch (err) { els[i].innerHTML = '<p class="callout warn">The board could not load. Please refresh the page.</p>'; if (window.console) console.error(err); }
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
