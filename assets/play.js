/*
 * CastleEarly play board.
 * <div class="playboard" data-kind="play|drill|puzzle" ...></div>
 *   play   : full game with opponent picker (computer / friend), level and color
 *   drill  : play a set position against the computer (data-fen, data-player, data-level)
 *   puzzle : find the right moves (inner <script type="application/json"> {fen, moves:[uci...], goal, explain})
 * Needs engine.js (CEChess) and pieces.js (CE_PIECE_SVG) loaded first.
 */
(function () {
  "use strict";
  var Chess = window.CEChess;
  var FILES = "abcdefgh";
  var NAMES = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };
  var VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  var LEVEL_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard", master: "Master" };
  var REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var SLIDE_MS = 190;

  /* ---------- Confetti (tiny canvas burst, removed after 2 seconds) ---------- */
  function confetti(host) {
    if (REDUCED) return;
    var c = document.createElement("canvas"), r = host.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.className = "pb-confetti"; c.width = r.width * dpr; c.height = r.height * dpr;
    host.appendChild(c);
    var ctx = c.getContext("2d"), colors = ["#6fb36a", "#e8b04a", "#ffffff", "#f2d390", "#4f9a3a", "#ff7a59"], parts = [];
    for (var i = 0; i < 140; i++) {
      parts.push({ x: c.width * (0.3 + Math.random() * 0.4), y: c.height * 0.62, vx: (Math.random() - 0.5) * 11 * dpr, vy: (-Math.random() * 8 - 4) * dpr,
        w: (4 + Math.random() * 5) * dpr, h: (7 + Math.random() * 7) * dpr, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, col: colors[i % colors.length] });
    }
    var start = performance.now();
    (function frame(t) {
      var el = t - start;
      ctx.clearRect(0, 0, c.width, c.height);
      parts.forEach(function (p) {
        p.vy += 0.2 * dpr; p.vy = Math.min(p.vy, 3.2 * dpr); p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
        ctx.globalAlpha = el < 1800 ? 1 : Math.max(0, 1 - (el - 1800) / 1200);
        ctx.fillStyle = p.col; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      });
      if (el < 3000) requestAnimationFrame(frame); else if (c.parentNode) c.parentNode.removeChild(c);
    })(start);
  }

  // Where engine.js lives (same folder as this script) \u2014 used for the background worker
  var scriptSrc = (document.currentScript && document.currentScript.src) || "";
  var VER = (scriptSrc.match(/\?.*$/) || [""])[0]; // site version, so updates reach browsers at once
  var ENGINE_URL = scriptSrc.replace(/play\.js(\?.*)?$/, "engine.js") + VER;

  /* ---------- Sounds: shared "Soft tok" set from sound.js ---------- */
  var NOOP = function () {};
  var SFX = window.CESound || { move: NOOP, capture: NOOP, castle: NOOP, check: NOOP, win: NOOP, lose: NOOP, wrong: NOOP, start: NOOP, isOn: function () { return false; }, setOn: NOOP };

  /* ---------- Computer opponent (runs in a background worker when possible) ---------- */
  var worker = null, workerFailed = false, jobId = 0, pending = {};
  function askEngine(fen, level, cb) {
    var id = ++jobId;
    if (!workerFailed && !worker && ENGINE_URL && window.Worker) {
      try {
        worker = new Worker(ENGINE_URL);
        worker.onmessage = function (e) { var f = pending[e.data.id]; delete pending[e.data.id]; if (f) f(e.data.move); };
        worker.onerror = function () { workerFailed = true; worker = null; flushPendingOnMainThread(); };
      } catch (e) { workerFailed = true; worker = null; }
    }
    if (worker) { pending[id] = cb; pending[id].job = { fen: fen, level: level }; worker.postMessage({ id: id, fen: fen, level: level }); }
    else setTimeout(function () { cb(new Chess(fen).bestMove(level)); }, 30);
  }
  function flushPendingOnMainThread() {
    Object.keys(pending).forEach(function (id) {
      var f = pending[id]; delete pending[id];
      setTimeout(function () { f(new Chess(f.job.fen).bestMove(f.job.level)); }, 30);
    });
  }

  /* ---------- Stockfish 19 lite (GPLv3, see /credits/) ----------
   * Only downloaded when someone picks the Master level, asks for a hint, or reviews a game.
   * If it can't run, callers fall back to the CastleEarly engine and say so. */
  var SF_URL = scriptSrc.replace(/play\.js(\?.*)?$/, "stockfish/stockfish-19-lite-single.js");
  var SF_MATE = 100000;
  function UciEngine() { this.worker = null; this.state = "idle"; this.waiting = []; this.job = null; this.queue = []; this.failure = ""; }
  UciEngine.prototype.init = function (cb) {
    var self = this;
    if (this.state === "ready") return cb(null);
    if (this.state === "failed") return cb(this.failure);
    this.waiting.push(cb);
    if (this.state === "loading") return;
    this.state = "loading";
    if (typeof WebAssembly !== "object" || !window.Worker) return this.fail("this browser can't run it (no WebAssembly support)");
    // Quick check that the files can be downloaded, so a blocked or missing file fails in seconds, not 30 s
    if (window.fetch && !UciEngine.checked) {
      UciEngine.checked = Promise.all([SF_URL, SF_URL.replace(/\.js$/, ".wasm")].map(function (u) {
        return fetch(u, { method: u === SF_URL ? "GET" : "HEAD" }).then(function (r) { if (!r.ok) throw new Error(r.status); });
      }));
    }
    if (UciEngine.checked) {
      UciEngine.checked.then(function () { self.boot(); }, function () { UciEngine.checked = null; self.fail("it couldn't be downloaded"); });
    } else this.boot();
  };
  UciEngine.prototype.boot = function () {
    var self = this;
    if (this.state !== "loading") return;
    try { this.worker = new Worker(SF_URL); }
    catch (e) { return this.fail("your browser blocked it"); }
    this.loadTimer = setTimeout(function () { self.fail("it took too long to start"); }, 30000);
    this.worker.onerror = function (e) {
      if (e && e.preventDefault) e.preventDefault();
      self.fail(self.state === "loading" ? "it couldn't be downloaded or started" : "it stopped working");
    };
    this.worker.onmessage = function (e) { self.line(String(e.data)); };
    this.worker.postMessage("uci");
  };
  UciEngine.prototype.fail = function (why) {
    if (this.state === "failed") return;
    this.state = "failed"; this.failure = why;
    clearTimeout(this.loadTimer); clearTimeout(this.jobTimer);
    try { if (this.worker) this.worker.terminate(); } catch (e) {}
    this.worker = null;
    var w = this.waiting; this.waiting = [];
    w.forEach(function (f) { f(why); });
    var jobs = (this.job ? [this.job] : []).concat(this.queue);
    this.job = null; this.queue = [];
    jobs.forEach(function (j) { j.cb(why); });
  };
  UciEngine.prototype.line = function (l) {
    if (l === "uciok") { this.worker.postMessage("isready"); return; }
    if (l === "readyok" && this.state === "loading") {
      clearTimeout(this.loadTimer);
      this.state = "ready";
      var w = this.waiting; this.waiting = [];
      w.forEach(function (f) { f(null); });
      this.pump();
      return;
    }
    var j = this.job;
    if (!j) return;
    if (l.indexOf("info ") === 0 && l.indexOf(" score ") > 0 && l.indexOf("bound") < 0) {
      var m = / multipv (\d+)/.exec(l);
      if (m && m[1] !== "1") return;
      var d = / depth (\d+)/.exec(l), cp = / score cp (-?\d+)/.exec(l), mt = / score mate (-?\d+)/.exec(l), pv = / pv (\S+)/.exec(l);
      if (d) j.depth = +d[1];
      if (cp) j.score = +cp[1];
      else if (mt) { var y = +mt[1]; j.score = y > 0 ? SF_MATE - (2 * y - 1) : y < 0 ? -(SF_MATE + 2 * y) : -SF_MATE; }
      if (pv) j.pv = pv[1];
    } else if (l.indexOf("bestmove") === 0) {
      clearTimeout(this.jobTimer);
      this.job = null;
      var bm = l.split(" ")[1];
      j.cb(null, { best: bm && bm !== "(none)" ? bm : null, score: j.score == null ? 0 : j.score, depth: j.depth || 0 });
      this.pump();
    }
  };
  // go: e.g. "depth 15 movetime 1000" or "movetime 800"
  UciEngine.prototype.search = function (fen, go, cb) {
    var self = this;
    if (this.state === "failed") return setTimeout(function () { cb(self.failure); }, 0);
    this.queue.push({ fen: fen, go: go, cb: cb });
    this.init(function (err) { if (!err) self.pump(); });
  };
  UciEngine.prototype.pump = function () {
    var self = this;
    if (this.state !== "ready" || this.job || !this.queue.length) return;
    var j = this.job = this.queue.shift();
    this.worker.postMessage("position fen " + j.fen);
    this.worker.postMessage("go " + j.go);
    var ms = /movetime (\d+)/.exec(j.go);
    this.jobTimer = setTimeout(function () { self.fail("it stopped responding"); }, (ms ? +ms[1] : 3000) + 15000);
  };
  UciEngine.prototype.stop = function () {
    this.queue = [];
    if (this.state === "failed") return;
    clearTimeout(this.loadTimer); clearTimeout(this.jobTimer);
    try { if (this.worker) this.worker.terminate(); } catch (e) {}
    this.worker = null; this.job = null; this.state = "idle"; this.waiting = [];
  };
  var playSF = null; // shared Stockfish for the Master level and hints
  function getPlaySF() { if (!playSF || (playSF.state === "failed" && !playSF.failure)) playSF = new UciEngine(); return playSF; }

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function sq(name) { return FILES.indexOf(name[0]) + 8 * (parseInt(name[1], 10) - 1); }
  function nm(i) { return FILES[i & 7] + ((i >> 3) + 1); }

  /* ======================================================= */
  function Board(root) {
    this.root = root;
    this.kind = root.getAttribute("data-kind") || "play";
    this.saveKey = root.getAttribute("data-save") || "";
    this.puzzle = null;
    if (this.kind === "puzzle") {
      var cfg = root.querySelector('script[type="application/json"]');
      this.puzzle = JSON.parse(cfg.textContent);
    }
    this.settings = {
      opponent: "computer",
      level: root.getAttribute("data-level") || "medium",
      color: root.getAttribute("data-player") || "w"
    };
    this.startFen = (this.puzzle && this.puzzle.fen) || root.getAttribute("data-fen") || Chess.START_FEN;
    this.flipped = false;
    this.selected = -1;
    this.thinking = false;
    this.intro = !REDUCED;
    this.over = null;
    this.drag = null;
    this.build();
    if (!this.restore()) this.newGame(true);
  }

  Board.prototype.build = function () {
    var self = this, r = this.root;
    r.innerHTML = "";
    r.classList.add("pb");

    if (this.kind === "play") {
      var setup = el("div", "pb-setup");
      setup.innerHTML =
        '<div class="pb-seg" role="group" aria-label="Opponent">' +
        '<button type="button" data-opp="computer">\ud83e\udd16 vs Computer</button>' +
        '<button type="button" data-opp="friend">\ud83d\udc65 vs Friend</button></div>' +
        '<div class="pb-opts">' +
        '<label class="pb-field"><span>Level</span><select data-set="level" id="pb-level">' +
        '<option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option><option value="master">Master (Stockfish)</option></select></label>' +
        '<label class="pb-field"><span>Play as</span><select data-set="color" id="pb-color">' +
        '<option value="w">White</option><option value="b">Black</option><option value="r">Random</option></select></label>' +
        "</div>" +
        '<button type="button" class="pb-fs-top" data-fs="1" aria-label="Full screen" title="Full screen">\u26f6<span> Full screen</span></button>';
      r.appendChild(setup);
      setup.addEventListener("click", function (e) {
        if (e.target.closest("[data-fs]")) { self.toggleFs(); return; }
        var b = e.target.closest("[data-opp]");
        if (!b) return;
        self.settings.opponent = b.getAttribute("data-opp");
        self.newGame();
      });
      setup.addEventListener("change", function (e) {
        var s = e.target.getAttribute("data-set");
        if (!s) return;
        self.settings[s] = e.target.value;
        self.newGame();
      });
      this.setupEl = setup;
    }

    var main = el("div", "pb-main");
    var left = el("div", "pb-left");
    this.topBar = el("div", "pb-player");
    this.boardEl = el("div", "pb-board");
    this.boardEl.setAttribute("role", "group");
    this.boardEl.setAttribute("aria-label", "Chess board");
    this.botBar = el("div", "pb-player");
    left.appendChild(this.topBar); left.appendChild(this.boardEl); left.appendChild(this.botBar);

    var side = el("div", "pb-side");
    this.statusEl = el("div", "pb-status");
    this.statusEl.setAttribute("aria-live", "polite");
    this.movesEl = el("div", "pb-moves");
    var tools = el("div", "pb-tools");
    var buttons = this.kind === "review"
      ? [["review", "\ud83d\udcc8 Analyze"], ["flip", "\u21c5 Flip"], ["sound", ""]]
      : this.kind === "sandbox"
      ? [["retry", "\u21ba Reset"], ["flip", "\u21c5 Flip"], ["sound", ""]]
      : this.kind === "puzzle"
      ? [["retry", "\u21ba Retry"], ["hint", "\ud83d\udca1 Hint"], ["flip", "\u21c5 Flip"], ["sound", ""]]
      : [["new", "\uff0b New game"], ["undo", "\u21b6 Undo"], ["hint", "\ud83d\udca1 Hint"], ["review", "\ud83d\udcc8 Analyze"], ["flip", "\u21c5 Flip"], ["sound", ""]];
    if (this.kind !== "sandbox") buttons.push(["fs", "\u26f6 Full screen"]);
    buttons.forEach(function (b) {
      var btn = el("button", "pb-btn", b[1]);
      btn.type = "button"; btn.setAttribute("data-act", b[0]);
      if (b[0] === "fs") { btn.className = "pb-btn pb-fs-btn"; btn.setAttribute("aria-label", "Full screen"); }
      tools.appendChild(btn);
    });
    this.soundBtn = tools.querySelector('[data-act="sound"]');
    tools.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (!b) return;
      var a = b.getAttribute("data-act");
      if (a === "new") self.newGame();
      if (a === "retry") self.newGame();
      if (a === "undo") self.undo();
      if (a === "flip") { self.flipped = !self.flipped; self.render(); }
      if (a === "hint") self.hint();
      if (a === "review") self.openReview();
      if (a === "fs") self.toggleFs();
      if (a === "sound") {
        SFX.setOn(!SFX.isOn());
        if (SFX.isOn()) SFX.move();
        self.updateSoundBtn();
      }
    });
    this.noticeEl = el("div", "pb-notice");
    this.noticeEl.hidden = true;
    side.appendChild(this.noticeEl);
    side.appendChild(this.statusEl);
    if (this.kind !== "puzzle" && this.kind !== "sandbox") side.appendChild(this.movesEl);
    side.appendChild(tools);
    main.appendChild(left); main.appendChild(side);
    r.appendChild(main);
    this.updateSoundBtn();

    // squares
    this.sqEls = [];
    for (var i = 0; i < 64; i++) {
      var s = el("div", "pb-sq");
      s.setAttribute("role", "button");
      s.dataset.i = i;
      this.sqEls.push(s);
    }

    // overlay (promotion / game over)
    this.overlay = el("div", "pb-overlay");
    this.overlay.hidden = true;
    this.boardEl.appendChild(this.overlay);

    // pointer input (mouse + touch): drag or tap-tap
    this.boardEl.addEventListener("pointerdown", function (e) { self.onDown(e); });
    window.addEventListener("pointermove", function (e) { self.onMove(e); }, { passive: false });
    window.addEventListener("pointerup", function (e) { self.onUp(e); });
    window.addEventListener("pointercancel", function () { self.cancelDrag(); });
    this.boardEl.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  };

  // Full screen: the board fills the whole screen. Uses the browser's real full screen where it exists
  // (computers, Android) and a fixed full-window layout everywhere (including iPhone, which has no full screen API).
  Board.prototype.toggleFs = function (force) {
    var on = force === undefined ? !this.fs : force;
    if (on === !!this.fs) return;
    var self = this, r = this.root, de = document.documentElement;
    this.fs = on;
    r.classList.toggle("pb-fs", on);
    de.classList.toggle("pb-fs-lock", on);
    var fsBtns = r.querySelectorAll('[data-act="fs"]');
    for (var i = 0; i < fsBtns.length; i++) {
      fsBtns[i].textContent = on ? "\u2715 Exit" : "\u26f6 Full screen";
      fsBtns[i].setAttribute("aria-label", on ? "Exit full screen" : "Full screen");
    }
    var req = r.requestFullscreen || r.webkitRequestFullscreen;
    var cur = document.fullscreenElement || document.webkitFullscreenElement;
    if (on) {
      this.fsScroll = window.scrollY;
      if (req && !cur) { try { var pr = req.call(r, { navigationUI: "hide" }); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {} }
      if (!this.fsWired) {
        this.fsWired = true;
        var sync = function () {
          var c = document.fullscreenElement || document.webkitFullscreenElement;
          if (!c && self.fs && self.fsNative) self.toggleFs(false);
          self.fsNative = !!c;
        };
        document.addEventListener("fullscreenchange", sync);
        document.addEventListener("webkitfullscreenchange", sync);
        document.addEventListener("keydown", function (e) { if (e.key === "Escape" && self.fs && !self.fsNative) self.toggleFs(false); });
      }
    } else {
      this.fsNative = false;
      var exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (cur && exit) { try { var pe = exit.call(document); if (pe && pe.catch) pe.catch(function () {}); } catch (e) {} }
      if (this.fsScroll !== undefined) window.scrollTo(0, this.fsScroll);
    }
    this.render();
  };

  Board.prototype.updateSoundBtn = function () {
    if (!this.soundBtn) return;
    this.soundBtn.textContent = SFX.isOn() ? "\ud83d\udd0a" : "\ud83d\udd07";
    this.soundBtn.setAttribute("aria-label", SFX.isOn() ? "Mute sounds" : "Turn sounds on");
  };

  /* ---------- Game flow ---------- */
  Board.prototype.playerColor = function () { return this.myColor; };
  Board.prototype.isHumanTurn = function () {
    if (this.review || this.kind === "review") return false;
    if (this.kind === "sandbox") return !this.thinking;
    if (this.over || this.thinking) return false;
    if (this.kind === "play" && this.settings.opponent === "friend") return true;
    return this.game.turn === this.myColor;
  };

  Board.prototype.newGame = function (silent) {
    if (this.review && this.endReview) this.endReview(true);
    this.game = new Chess(this.startFen);
    this.over = null; this.selected = -1; this.thinking = false; this.lastMove = null;
    this.puzzleStep = 0; this.hintSq = -1; this.mistakes = 0;
    this.token = (this.token || 0) + 1;
    var c = this.settings.color;
    if (this.kind === "puzzle") c = this.game.turn;
    if (c === "r") c = Math.random() < 0.5 ? "w" : "b";
    this.myColor = c;
    this.flipped = this.myColor === "b";
    if (this.kind === "play" && this.settings.opponent === "friend") this.flipped = false;
    this.message = this.kind === "puzzle" ? null : "";
    this.updateNotice();
    this.hideOverlay();
    this.render();
    this.save();
    if (!silent && this.kind !== "puzzle") SFX.start();
    this.maybeComputerMove();
  };

  Board.prototype.isComputerGame = function () {
    return this.kind === "drill" || (this.kind === "play" && this.settings.opponent === "computer");
  };

  Board.prototype.maybeComputerMove = function () {
    var self = this;
    if (this.over || !this.isComputerGame() || this.game.turn === this.myColor) return;
    this.thinking = true;
    this.render();
    var token = this.token, fen = this.game.fen(), started = Date.now();
    this.engineMove(fen, this.settings.level, function (mv) {
      var wait = Math.max(0, 350 - (Date.now() - started)); // feel natural, never instant
      setTimeout(function () {
        if (token !== self.token) return; // a new game started meanwhile
        self.thinking = false;
        if (mv) self.applyMove(mv.slice(0, 2), mv.slice(2, 4), mv[4] || "", true);
        else self.render();
      }, wait);
    });
  };

  // Master level = Stockfish lite. If it can't run, the CastleEarly engine (Hard) plays instead.
  Board.prototype.engineMove = function (fen, level, cb) {
    var self = this;
    if (level !== "master") return askEngine(fen, level, cb);
    if (this.sfDown) return askEngine(fen, "hard", cb);
    getPlaySF().search(fen, "movetime 700", function (err, r) {
      if (err || !r || !r.best) {
        self.sfDown = true;
        self.sfReason = err || "no move came back";
        self.updateNotice();
        askEngine(fen, "hard", cb);
        return;
      }
      cb(r.best);
    });
  };

  Board.prototype.updateNotice = function () {
    if (!this.noticeEl) return;
    var t = "", cls = "info";
    if (this.isComputerGame() && this.settings.level === "master") {
      if (this.sfDown) { cls = "bad"; t = "<b>Stockfish lite isn't working</b> on this device" + (this.sfReason ? " (" + this.sfReason + ")" : "") + ", so the computer is using the CastleEarly engine (beginner-to-club strength) instead."; }
      else {
        var self = this;
        t = "<b>Master level:</b> you're playing Stockfish 19 lite, a world-class chess engine, right in your browser. Good luck!";
        getPlaySF().init(function (err) { if (err && !self.sfDown) { self.sfDown = true; self.sfReason = err; self.updateNotice(); } });
      }
    }
    this.noticeEl.className = "pb-notice " + cls;
    this.noticeEl.innerHTML = t;
    this.noticeEl.hidden = !t;
  };

  Board.prototype.applyMove = function (from, to, promo, byComputer) {
    var res = this.game.move({ from: from, to: to, promotion: promo || "q" });
    if (!res) return false;
    this.lastMove = [sq(from), sq(to)];
    this.selected = -1; this.hintSq = -1;
    if (!this.skipAnim && !REDUCED) {
      var pairs = [[sq(from), sq(to)]], f0 = sq(from);
      if (res.flag === "k") pairs.push([f0 + 3, f0 + 1]);
      if (res.flag === "q") pairs.push([f0 - 4, f0 - 1]);
      this.anim = { pairs: pairs, t0: performance.now() };
    }
    this.skipAnim = false;
    if (this.kind === "sandbox") {
      // Give the move back to White so the learner can keep exploring
      var f = this.game.fen().split(" ");
      f[1] = "w"; f[3] = "-";
      var keepLast = this.lastMove;
      this.game = new Chess(f.join(" "));
      this.lastMove = keepLast;
      if (res.captured) SFX.capture(); else if (res.flag === "k" || res.flag === "q") SFX.castle(); else SFX.move();
      this.render();
      return res;
    }
    var st = this.game.status();
    if (st.over) this.finish(st);
    else if (this.game.inCheck()) SFX.check();
    else if (res.captured) SFX.capture();
    else if (res.flag === "k" || res.flag === "q") SFX.castle();
    else SFX.move();
    this.render();
    this.save();
    if (!st.over && this.kind !== "puzzle") this.maybeComputerMove();
    return res;
  };

  Board.prototype.finish = function (st) {
    if (this.kind === "puzzle") { this.over = { title: "", sub: "", result: st.result }; return; }
    var you = this.myColor === "w" ? "1-0" : "0-1";
    var title, sub;
    var friend = this.kind === "play" && this.settings.opponent === "friend";
    if (st.result === "1/2-1/2") { title = "Draw"; sub = "By " + st.reason + "."; SFX.lose(); }
    else if (friend) { title = (st.result === "1-0" ? "White" : "Black") + " wins!"; sub = "By " + st.reason + "."; SFX.win(); confetti(this.boardEl); }
    else if (st.result === you) { title = "You won! \ud83c\udf89"; sub = "Checkmate. Nice work."; SFX.win(); confetti(this.boardEl); }
    else { title = "Computer wins"; sub = "By " + st.reason + ". Try again?"; SFX.lose(); }
    this.over = { title: title, sub: sub, result: st.result };
    this.showGameOver();
  };

  Board.prototype.undo = function () {
    if (this.kind === "puzzle" || this.review) return;
    this.token++;
    this.thinking = false;
    var n = this.isComputerGame() ? (this.game.turn === this.myColor ? 2 : 1) : 1;
    var undone = false;
    for (var i = 0; i < n; i++) if (this.game.undo()) undone = true;
    if (!undone) return;
    this.over = null; this.hideOverlay();
    var h = this.game.stack;
    this.lastMove = h.length ? [h[h.length - 1].m.from, h[h.length - 1].m.to] : null;
    this.selected = -1; this.hintSq = -1;
    this.render(); this.save();
    this.maybeComputerMove();
  };

  Board.prototype.hint = function () {
    var self = this;
    if (this.review) return;
    if (this.kind === "puzzle") {
      if (this.over) return;
      var mv = this.puzzle.moves[this.puzzleStep];
      this.hintSq = sq(mv.slice(0, 2));
      this.message = { cls: "info", text: "Hint: move the piece on the highlighted square." };
      this.render();
      return;
    }
    if (!this.isHumanTurn()) return;
    this.statusEl.textContent = "Thinking about a hint\u2026";
    var token = this.token;
    var fen = this.game.fen();
    var useSF = !this.sfDown && playSF && playSF.state === "ready";
    var ask = useSF ? function (f, cb) { playSF.search(f, "movetime 400", function (err, r) { if (err || !r || !r.best) askEngine(f, "hard", cb); else cb(r.best); }); } : function (f, cb) { askEngine(f, "hard", cb); };
    ask(fen, function (m) {
      if (token !== self.token || !m) return;
      self.hintSq = sq(m.slice(0, 2));
      self.hintTo = sq(m.slice(2, 4));
      self.render();
    });
  };

  /* ---------- Puzzle logic ---------- */
  Board.prototype.puzzleMove = function (from, to, promo) {
    var self = this, want = this.puzzle.moves[this.puzzleStep];
    var tried = from + to + (promo || "");
    var ok = tried === want || (want.length === 5 && tried === want) || (want.length === 4 && from + to === want);
    // Also accept any move that checkmates when the puzzle's goal is mate
    if (!ok && this.puzzle.goal === "mate") {
      var test = new Chess(this.game.fen());
      if (test.move({ from: from, to: to, promotion: promo || "q" }) && test.isCheckmate()) ok = true;
    }
    if (!ok) {
      var legal = new Chess(this.game.fen()).move({ from: from, to: to, promotion: promo || "q" });
      if (!legal) return false;
      this.mistakes++;
      SFX.wrong();
      this.message = { cls: "bad", text: "Not the best move. Look for checks, captures and threats, then try again." };
      this.selected = -1;
      if (this.mistakes >= 2) this.hintSq = sq(want.slice(0, 2));
      this.render();
      return true;
    }
    this.applyMove(from, to, promo);
    this.over = null;
    this.puzzleStep++;
    if ((this.game.status().over && this.game.status().reason === "checkmate") || this.puzzleStep >= this.puzzle.moves.length) {
      this.over = { title: "Solved! \ud83c\udf89", sub: this.puzzle.explain || "", result: "" };
      this.message = { cls: "good", text: "<b>Solved!</b> " + (this.puzzle.explain || "") };
      SFX.win();
      confetti(this.boardEl);
      this.render();
      this.announceSolved();
      return true;
    }
    this.message = { cls: "good", text: "Correct! Keep going\u2026" };
    this.render();
    var reply = this.puzzle.moves[this.puzzleStep], token = this.token;
    this.thinking = true;
    setTimeout(function () {
      if (token !== self.token) return;
      self.thinking = false;
      self.applyMove(reply.slice(0, 2), reply.slice(2, 4), reply[4] || "");
      self.puzzleStep++;
      if (self.puzzleStep >= self.puzzle.moves.length || self.game.status().over) {
        self.over = { title: "Solved", sub: "", result: "" };
        self.message = { cls: "good", text: "<b>Solved!</b> " + (self.puzzle.explain || "") };
        SFX.win();
        confetti(self.boardEl);
        self.announceSolved();
      } else {
        self.message = { cls: "info", text: "Your move. Find the follow-up." };
      }
      self.render();
    }, 550);
    return true;
  };

  // Lets other scripts (daily puzzle streak) know a puzzle was solved
  Board.prototype.announceSolved = function () {
    try { this.root.dispatchEvent(new CustomEvent("ce-solved", { bubbles: true, detail: { mistakes: this.mistakes || 0 } })); } catch (e) {}
  };

  /* ---------- Input ---------- */
  Board.prototype.squareFromPoint = function (x, y) {
    var r = this.boardEl.getBoundingClientRect();
    if (x < r.left || x >= r.right || y < r.top || y >= r.bottom) return -1;
    var f = Math.floor((x - r.left) / (r.width / 8)), row = Math.floor((y - r.top) / (r.height / 8));
    return this.flipped ? (row * 8 + (7 - f)) : ((7 - row) * 8 + f);
  };

  Board.prototype.isOwnPiece = function (i) {
    var p = this.game.board[i];
    if (!p) return false;
    var color = p === p.toUpperCase() ? "w" : "b";
    return color === this.game.turn;
  };

  Board.prototype.targetsFrom = function (i) {
    return this.game.moves(nm(i)).filter(function (m) { return (m.captured || "").toLowerCase() !== "k"; }).map(function (m) { return sq(m.to); });
  };

  Board.prototype.tryMove = function (fromI, toI) {
    var self = this;
    var from = nm(fromI), to = nm(toI);
    var cands = this.game.moves(from).filter(function (m) { return m.to === to && (m.captured || "").toLowerCase() !== "k"; });
    if (!cands.length) return false;
    if (cands[0].promotion) { this.askPromotion(from, to); return true; }
    if (this.kind === "puzzle") return this.puzzleMove(from, to, "");
    return !!this.applyMove(from, to, "");
  };

  Board.prototype.onDown = function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (!this.overlay.hidden) return;
    var i = this.squareFromPoint(e.clientX, e.clientY);
    if (i < 0) return;
    if (!this.isHumanTurn()) return;
    if (this.selected >= 0 && this.selected !== i && !this.isOwnPiece(i)) {
      // second tap on a target square
      if (!this.tryMove(this.selected, i)) { this.selected = -1; this.render(); }
      return;
    }
    if (!this.isOwnPiece(i)) { this.selected = -1; this.render(); return; }
    e.preventDefault();
    var wasSelected = this.selected === i;
    this.selected = i;
    this.render();
    var pieceEl = this.sqEls[i].querySelector(".pb-pc");
    if (!pieceEl) return;
    var rect = this.boardEl.getBoundingClientRect(), size = rect.width / 8;
    var ghost = el("div", "pb-ghost", pieceEl.innerHTML);
    ghost.style.width = ghost.style.height = size + "px";
    this.drag = { from: i, ghost: ghost, pieceEl: pieceEl, size: size, moved: false, wasSelected: wasSelected, x: e.clientX, y: e.clientY, id: e.pointerId };
    try { this.boardEl.setPointerCapture(e.pointerId); } catch (err) {}
  };

  Board.prototype.onMove = function (e) {
    var d = this.drag;
    if (!d) return;
    if (!d.moved && Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) < 5) return;
    if (!d.moved) { d.moved = true; document.body.appendChild(d.ghost); d.pieceEl.classList.add("pb-lifted"); }
    e.preventDefault();
    d.ghost.style.transform = "translate(" + (e.clientX - d.size / 2) + "px," + (e.clientY - d.size / 2) + "px)";
    var over = this.squareFromPoint(e.clientX, e.clientY);
    for (var k = 0; k < 64; k++) this.sqEls[k].classList.toggle("pb-hover", k === over);
  };

  Board.prototype.onUp = function (e) {
    var d = this.drag;
    if (!d) return;
    this.drag = null;
    if (d.ghost.parentNode) d.ghost.parentNode.removeChild(d.ghost);
    d.pieceEl.classList.remove("pb-lifted");
    for (var k = 0; k < 64; k++) this.sqEls[k].classList.remove("pb-hover");
    var to = this.squareFromPoint(e.clientX, e.clientY);
    if (d.moved) {
      this.skipAnim = true;
      if (to >= 0 && to !== d.from && this.tryMove(d.from, to)) return;
      this.skipAnim = false;
      this.selected = -1; this.render();
    } else if (d.wasSelected) {
      this.selected = -1; this.render(); // tapping the selected piece again deselects it
    }
  };
  Board.prototype.cancelDrag = function () {
    if (!this.drag) return;
    if (this.drag.ghost.parentNode) this.drag.ghost.parentNode.removeChild(this.drag.ghost);
    this.drag.pieceEl.classList.remove("pb-lifted");
    this.drag = null;
  };

  /* ---------- Game review (review.js is only downloaded when someone asks for a review) ---------- */
  var REVIEW_URL = scriptSrc.replace(/play\.js(\?.*)?$/, "review.js") + VER, reviewLoading = null;
  Board.prototype.openReview = function () {
    var self = this;
    if (this.review || this.game.stack.length < 1) return;
    if (Board.prototype.startReview) { this.startReview(); return; }
    if (!reviewLoading) {
      reviewLoading = [];
      var s = document.createElement("script");
      s.src = REVIEW_URL;
      s.onload = function () { var q = reviewLoading; reviewLoading = null; q.forEach(function (f) { f(); }); };
      s.onerror = function () { reviewLoading = null; self.message = { cls: "bad", text: "The analysis could not load. Check your connection and try again." }; self.render(); };
      document.head.appendChild(s);
    }
    this.statusEl.textContent = "Loading the analysis\u2026";
    reviewLoading.push(function () { if (self.startReview) self.startReview(); });
  };

  // Load a finished game (e.g. imported from Chess.com or Lichess) and analyze it.
  // g = { fen, moves: [uci...], names: {w, b}, flip, result }
  Board.prototype.loadGame = function (g) {
    if (this.review && this.endReview) this.endReview(true);
    this.token = (this.token || 0) + 1;
    this.startFen = g.fen || Chess.START_FEN;
    this.game = new Chess(this.startFen);
    for (var i = 0; i < g.moves.length; i++) if (!this.game.move(g.moves[i])) break;
    this.names = g.names || null;
    this.flipped = !!g.flip; this.myColor = g.flip ? "b" : "w";
    this.over = { title: "", sub: "", result: g.result || "" };
    this.selected = -1; this.hintSq = -1; this.thinking = false; this.message = "";
    var h = this.game.stack;
    this.lastMove = h.length ? [h[h.length - 1].m.from, h[h.length - 1].m.to] : null;
    this.reviewCache = null;
    this.hideOverlay();
    this.render();
    this.openReview();
  };

  /* ---------- Overlays ---------- */
  Board.prototype.askPromotion = function (from, to) {
    var self = this, white = this.game.turn === "w";
    this.overlay.innerHTML = '<div class="pb-card"><p>Promote to:</p><div class="pb-promo"></div></div>';
    var box = this.overlay.querySelector(".pb-promo");
    ["q", "r", "b", "n"].forEach(function (t) {
      var b = el("button", "pb-promo-btn", window.CE_PIECE_SVG(white ? t.toUpperCase() : t));
      b.type = "button"; b.setAttribute("aria-label", NAMES[t]);
      b.addEventListener("click", function () {
        self.hideOverlay();
        if (self.kind === "puzzle") self.puzzleMove(from, to, t);
        else self.applyMove(from, to, t);
      });
      box.appendChild(b);
    });
    this.overlay.hidden = false;
  };

  Board.prototype.showGameOver = function () {
    var self = this;
    if (this.kind === "puzzle" || this.kind === "review") return;
    this.overlay.innerHTML = '<div class="pb-card"><h3></h3><p></p><div class="pb-card-actions">' +
      (this.game.stack.length >= 2 ? '<button type="button" class="pb-btn primary pb-review-btn" data-o="review">\ud83d\udcc8 Analyze game <small>free</small></button>' : "") +
      '<button type="button" class="pb-btn' + (this.game.stack.length >= 2 ? "" : " primary") + '" data-o="again">Play again</button>' +
      '<button type="button" class="pb-btn" data-o="look">View board</button></div></div>';
    this.overlay.querySelector("h3").textContent = this.over.title;
    this.overlay.querySelector("p").textContent = this.over.sub;
    this.overlay.querySelector('[data-o="again"]').addEventListener("click", function () { self.newGame(); });
    this.overlay.querySelector('[data-o="look"]').addEventListener("click", function () { self.hideOverlay(); });
    var rb = this.overlay.querySelector('[data-o="review"]');
    if (rb) rb.addEventListener("click", function () { self.openReview(); });
    setTimeout(function () { self.overlay.hidden = false; }, 450);
  };
  Board.prototype.hideOverlay = function () { this.overlay.hidden = true; this.overlay.innerHTML = ""; };

  /* ---------- Saving (each visitor's own browser) ---------- */
  Board.prototype.save = function () {
    if (!this.saveKey) return;
    try {
      var moves = this.game.stack.map(function (s) { return nm(s.m.from) + nm(s.m.to) + (s.m.promotion ? s.m.promotion.toLowerCase() : ""); });
      localStorage.setItem(this.saveKey, JSON.stringify({ s: this.settings, c: this.myColor, f: this.startFen, m: moves, v: 1 }));
    } catch (e) {}
  };
  Board.prototype.restore = function () {
    if (!this.saveKey) return false;
    try {
      var d = JSON.parse(localStorage.getItem(this.saveKey) || "null");
      if (!d || d.v !== 1 || d.f !== this.startFen) return false;
      this.settings = d.s; this.myColor = d.c;
      this.game = new Chess(this.startFen);
      for (var i = 0; i < d.m.length; i++) if (!this.game.move(d.m[i])) return false;
      this.over = null; this.selected = -1; this.thinking = false; this.hintSq = -1;
      this.token = 1;
      var h = this.game.stack;
      this.lastMove = h.length ? [h[h.length - 1].m.from, h[h.length - 1].m.to] : null;
      this.flipped = this.myColor === "b" && this.settings.opponent !== "friend";
      if (this.game.status().over) return false; // finished games start fresh
      this.message = d.m.length ? { cls: "info", text: "Welcome back! Your last game is restored." } : "";
      this.updateNotice();
      this.render();
      this.maybeComputerMove();
      return true;
    } catch (e) { return false; }
  };

  /* ---------- Sliding pieces ---------- */
  Board.prototype.screenPos = function (i) {
    var f = i & 7, r = i >> 3;
    return this.flipped ? { x: 7 - f, y: r } : { x: f, y: 7 - r };
  };
  Board.prototype.playSlide = function () {
    var a = this.anim;
    if (!a) return;
    var t = performance.now() - a.t0;
    if (t >= SLIDE_MS) { this.anim = null; return; }
    for (var k = 0; k < a.pairs.length; k++) {
      var from = this.screenPos(a.pairs[k][0]), to = this.screenPos(a.pairs[k][1]);
      var el = this.sqEls[a.pairs[k][1]].querySelector(".pb-pc");
      if (!el || !el.animate) continue;
      el.style.zIndex = 6;
      var an = el.animate([
        { transform: "translate(" + (from.x - to.x) * 100 + "%," + (from.y - to.y) * 100 + "%)" },
        { transform: "translate(0,0)" }
      ], { duration: SLIDE_MS, easing: "cubic-bezier(.25,.8,.3,1)" });
      an.currentTime = t;
      (function (e) { an.onfinish = function () { e.style.zIndex = ""; }; })(el);
    }
  };

  /* ---------- Rendering ---------- */
  // Pieces each side has captured in THIS game (works for any starting position)
  Board.prototype.material = function () {
    var res = { w: { caps: [], pts: 0 }, b: { caps: [], pts: 0 } };
    var order = "qrbnp";
    this.game.stack.forEach(function (s) {
      var m = s.m;
      if (m.captured) {
        var by = m.piece === m.piece.toUpperCase() ? "w" : "b";
        res[by].caps.push(m.captured);
        res[by].pts += VALUE[m.captured.toLowerCase()];
      }
      if (m.promotion) {
        var side = m.promotion === m.promotion.toUpperCase() ? "w" : "b";
        res[side].pts += VALUE[m.promotion.toLowerCase()] - 1;
      }
    });
    ["w", "b"].forEach(function (c) {
      res[c].caps.sort(function (a, b) { return order.indexOf(a.toLowerCase()) - order.indexOf(b.toLowerCase()); });
    });
    return res;
  };

  Board.prototype.playerBar = function (bar, color) {
    var mat = this.material(), me = mat[color], other = mat[color === "w" ? "b" : "w"];
    var name;
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    if (this.names) name = this.names[color];
    else if (this.kind === "sandbox") name = color === "w" ? "White" : "Black";
    else if (this.kind === "puzzle") name = color === this.myColor ? "You" : "Opponent";
    else if (this.isComputerGame()) name = color === this.myColor ? "You" : "Computer \u00b7 " + LEVEL_LABEL[this.settings.level];
    else name = color === "w" ? "White" : "Black";
    var diff = me.pts - other.pts;
    var caps = me.caps.map(function (p) { return '<span class="pb-cap">' + window.CE_PIECE_SVG(p) + "</span>"; }).join("");
    var turn = !this.over && this.game.turn === color;
    bar.className = "pb-player" + (turn ? " pb-turn" : "");
    bar.innerHTML = '<span class="pb-avatar">' + window.CE_PIECE_SVG(color === "w" ? "K" : "k") + "</span>" +
      '<span class="pb-name">' + (this.names ? esc(name) : name) + (turn && this.thinking ? ' <span class="pb-dots">thinking</span>' : "") + "</span>" +
      '<span class="pb-caps">' + caps + (diff > 0 ? '<span class="pb-diff">+' + diff + "</span>" : "") + "</span>";
  };

  Board.prototype.render = function () {
    var g = this.game, b = g.board;
    var legalTargets = this.selected >= 0 ? this.targetsFrom(this.selected) : [];
    var checkSq = g.inCheck() ? g.kings[g.turn] : -1;

    // squares in display order
    var frag = document.createDocumentFragment();
    for (var v = 0; v < 64; v++) {
      var row = v >> 3, col = v & 7;
      var i = this.flipped ? row * 8 + (7 - col) : (7 - row) * 8 + col;
      var s = this.sqEls[i], p = b[i];
      var light = ((i >> 3) + (i & 7)) % 2 === 1;
      var cls = "pb-sq " + (light ? "l" : "d");
      if (this.lastMove && (i === this.lastMove[0] || i === this.lastMove[1])) cls += " last";
      if (i === this.selected) cls += " sel";
      if (i === checkSq) cls += " check";
      if (i === this.hintSq || (this.hintTo === i && this.hintSq >= 0)) cls += " hint";
      if (legalTargets.indexOf(i) >= 0) cls += p ? " cap" : " dot";
      s.className = cls;
      var html = "";
      if (row === 7) html += '<span class="pb-co f">' + FILES[i & 7] + "</span>";
      if (col === 0) html += '<span class="pb-co r">' + ((i >> 3) + 1) + "</span>";
      if (p) html += '<span class="pb-pc"' + (this.intro ? ' style="animation-delay:' + (row * 55) + 'ms"' : "") + ">" + window.CE_PIECE_SVG(p) + "</span>";
      s.innerHTML = html;
      s.setAttribute("aria-label", nm(i) + (p ? ", " + (p === p.toUpperCase() ? "white " : "black ") + NAMES[p.toLowerCase()] : ""));
      frag.appendChild(s);
    }
    this.boardEl.insertBefore(frag, this.overlay);
    if (this.hintSq < 0) this.hintTo = -1;
    if (this.intro) {
      var bEl = this.boardEl;
      bEl.classList.add("pb-intro");
      this.intro = false;
      setTimeout(function () { bEl.classList.remove("pb-intro"); }, 1100);
    }
    this.playSlide();

    var bottom = this.flipped ? "b" : "w";
    this.playerBar(this.botBar, bottom);
    this.playerBar(this.topBar, bottom === "w" ? "b" : "w");

    // status line
    var text, cls = "";
    if (this.message && this.message.text) { text = this.message.text; cls = this.message.cls; }
    else if (this.kind === "sandbox") {
      text = this.root.getAttribute("data-prompt") || "Tap a white piece to see where it can move.";
    }
    else if (this.kind === "puzzle") {
      text = "<b>" + (g.turn === "w" ? "White" : "Black") + " to move.</b> " + (this.puzzle.prompt || "Find the best move.");
    } else if (this.over) { text = "<b>" + this.over.title + "</b> " + this.over.sub; }
    else if (this.thinking) text = "Computer is thinking\u2026";
    else if (this.isComputerGame()) text = g.turn === this.myColor ? "<b>Your move.</b> Drag a piece or tap it, then tap a square." : "";
    else text = "<b>" + (g.turn === "w" ? "White" : "Black") + " to move.</b>";
    if (!this.over && g.inCheck() && this.kind !== "puzzle" && this.kind !== "sandbox") text += " <b class='pb-warn'>Check!</b>";
    this.statusEl.className = "pb-status " + cls;
    this.statusEl.innerHTML = text;
    if (this.message && this.kind !== "puzzle" && !this.message.sticky) this.message = "";

    // move list
    if (this.kind !== "puzzle" && this.kind !== "sandbox") {
      var h = g.history(), html2 = "";
      var startBlack = this.startFen.split(" ")[1] === "b";
      var moveNo = parseInt(this.startFen.split(" ")[5] || "1", 10);
      var list = startBlack ? ["\u2026"].concat(h) : h;
      for (var k = 0; k < list.length; k += 2) {
        html2 += '<span class="pb-mv"><span class="pb-mn">' + (moveNo + k / 2) + ".</span>" +
          "<span>" + list[k] + "</span><span>" + (list[k + 1] || "") + "</span></span>";
      }
      this.movesEl.innerHTML = html2 || '<span class="pb-empty">Moves will appear here.</span>';
      this.movesEl.scrollTop = this.movesEl.scrollHeight;
    }

    // setup controls
    if (this.setupEl) {
      var self = this;
      this.setupEl.querySelectorAll("[data-opp]").forEach(function (btn) {
        btn.setAttribute("aria-pressed", btn.getAttribute("data-opp") === self.settings.opponent ? "true" : "false");
      });
      this.setupEl.querySelector(".pb-opts").hidden = this.settings.opponent !== "computer";
      this.setupEl.querySelector('[data-set="level"]').value = this.settings.level;
      this.setupEl.querySelector('[data-set="color"]').value = this.settings.color;
    }
    var undoBtn = this.root.querySelector('[data-act="undo"]');
    if (undoBtn) undoBtn.disabled = g.stack.length === 0;
    var revBtn = this.root.querySelector('[data-act="review"]');
    if (revBtn) revBtn.disabled = g.stack.length < 2 || this.thinking;
    if (this.review && this.reviewPaint) this.reviewPaint();
  };

  window.CEPlay = { Board: Board, Chess: Chess, engineUrl: ENGINE_URL, sfx: SFX, el: el, nm: nm, sq: sq, reduced: REDUCED, UciEngine: UciEngine, sfUrl: SF_URL };

  function start(r) {
    if (r._ce) return;
    r._ce = true;
    try { r._board = new Board(r); }
    catch (err) { r.innerHTML = '<p class="callout warn">The board could not load. Please refresh the page.</p>'; if (window.console) console.error(err); }
  }
  function init() {
    if (!Chess || !window.CE_PIECE_SVG) return;
    // Build every board right away so the page never jumps while scrolling
    document.querySelectorAll(".playboard").forEach(start);
    // Re-apply a #link jump once the boards have their final size
    if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
