/* CastleEarly interactive lessons: move pop-up boards, a board that follows your reading,
   quick checks, the "Test yourself" quiz and lesson progress. Plain ASCII on purpose. */
(function () {
  "use strict";
  var LEARNED = "ce-learned";

  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || "null");
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
  }
  function learned() { var l = store(LEARNED); return Array.isArray(l) ? l : []; }
  function markLearned(slug) {
    var l = learned();
    if (l.indexOf(slug) < 0) { l.push(slug); store(LEARNED, l); }
    document.querySelectorAll(".lq-mark").forEach(function (b) { b.textContent = "\u2713 Learned"; b.classList.add("done"); b.disabled = true; });
    var hero = document.querySelector(".ph-text h1");
    if (hero && !document.querySelector(".learned-pill")) {
      var pill = document.createElement("span");
      pill.className = "learned-pill"; pill.textContent = "\u2713 Learned";
      hero.parentNode.insertBefore(pill, hero);
    }
  }

  // ---------- board drawing (squares + pieces + glowing squares + arrows) ----------
  var FILES = "abcdefgh";
  function parseFen(fen) {
    var rows = (fen || "8/8/8/8/8/8/8/8").split(" ")[0].split("/"), grid = [];
    for (var r = 0; r < 8; r++) {
      var row = [];
      (rows[r] || "8").split("").forEach(function (ch) {
        if (/\d/.test(ch)) for (var k = 0; k < +ch; k++) row.push(""); else row.push(ch);
      });
      grid.push(row);
    }
    return grid;
  }
  function xy(sq, flip) {
    var f = FILES.indexOf(sq[0]), r = +sq[1];
    var x = flip ? 7 - f : f, y = flip ? r - 1 : 8 - r;
    return [x + 0.5, y + 0.5];
  }
  function arrowSvg(list, flip) {
    if (!list.length) return "";
    var out = '<svg class="lb-arrows" viewBox="0 0 8 8" aria-hidden="true"><defs>' +
      '<marker id="ah-g" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto"><path d="M0 0L10 5L0 10z" fill="rgba(31,122,72,.9)"/></marker>' +
      '<marker id="ah-r" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto"><path d="M0 0L10 5L0 10z" fill="rgba(200,48,48,.9)"/></marker>' +
      '<marker id="ah-b" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto"><path d="M0 0L10 5L0 10z" fill="rgba(35,96,200,.9)"/></marker></defs>';
    list.forEach(function (a) {
      if (!a) return;
      var kind = "g";
      if (a[0] === "!") { kind = "r"; a = a.slice(1); }
      else if (a[0] === "~") { kind = "b"; a = a.slice(1); }
      var p1 = xy(a.slice(0, 2), flip), p2 = xy(a.slice(2, 4), flip);
      var dx = p2[0] - p1[0], dy = p2[1] - p1[1], len = Math.sqrt(dx * dx + dy * dy) || 1;
      var cut = len > 1.5 ? 0.32 : 0.12, ex = p2[0] - dx / len * cut, ey = p2[1] - dy / len * cut; // stop before the centre so the head is visible
      var col = kind === "r" ? "rgba(200,48,48,.82)" : kind === "b" ? "rgba(35,96,200,.8)" : "rgba(31,122,72,.85)";
      out += '<line x1="' + p1[0] + '" y1="' + p1[1] + '" x2="' + ex.toFixed(3) + '" y2="' + ey.toFixed(3) + '" stroke="' + col +
        '" stroke-width=".17" stroke-linecap="round"' + (kind === "b" ? ' stroke-dasharray=".28 .2"' : "") + ' marker-end="url(#ah-' + kind + ')"/>';
    });
    return out + "</svg>";
  }
  function drawBoard(el, fen, hl, arrows, flip) {
    if (!window.CE_PIECE_SVG) return;
    var grid = parseFen(fen), html = "";
    hl = hl || []; arrows = arrows || [];
    for (var v = 0; v < 64; v++) {
      var rr = flip ? 7 - (v >> 3) : (v >> 3), cc = flip ? 7 - (v & 7) : (v & 7);
      var name = FILES[cc] + (8 - rr), p = grid[rr][cc] || "";
      var coord = "";
      if ((flip ? rr === 0 : rr === 7)) coord += '<i class="lb-f">' + FILES[cc] + "</i>";
      if ((flip ? cc === 7 : cc === 0)) coord += '<i class="lb-r">' + (8 - rr) + "</i>";
      html += '<div class="lb-sq ' + ((rr + cc) % 2 ? "d" : "l") + (hl.indexOf(name) >= 0 ? " h" : "") + '">' + coord + (p ? window.CE_PIECE_SVG(p) : "") + "</div>";
    }
    el.innerHTML = '<div class="lb-grid">' + html + "</div>" + arrowSvg(arrows, flip);
    el.classList.add("lb");
  }
  function list(s) { return s ? s.split(",").filter(Boolean) : []; }
  var FLIP = false;

  // ---------- pop-up board for moves and "See it" chips ----------
  var pop = null, popFor = null;
  function closePop() { if (pop) { pop.remove(); pop = null; if (popFor) popFor.setAttribute("aria-expanded", "false"); popFor = null; } }
  function openPop(btn, fen, hl, arrows, cap) {
    if (popFor === btn) { closePop(); return; }
    closePop();
    pop = document.createElement("div");
    pop.className = "mv-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "Board position");
    pop.innerHTML = '<div class="mv-pop-board"></div>' + (cap ? '<p class="mv-pop-cap"></p>' : "") + '<button type="button" class="mv-pop-x" aria-label="Close">\u2715</button>';
    if (cap) pop.querySelector(".mv-pop-cap").textContent = cap;
    document.body.appendChild(pop);
    drawBoard(pop.querySelector(".mv-pop-board"), fen, hl, arrows, FLIP);
    var r = btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    var left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), document.documentElement.clientWidth - w - 8);
    var top = r.bottom + 8;
    if (top + h > window.innerHeight - 8 && r.top - h - 8 > 8) top = r.top - h - 8;
    pop.style.left = left + window.scrollX + "px";
    pop.style.top = top + window.scrollY + "px";
    popFor = btn; btn.setAttribute("aria-expanded", "true");
    pop.querySelector(".mv-pop-x").addEventListener("click", closePop);
  }
  document.addEventListener("click", function (e) {
    var mv = e.target.closest("button.mv");
    if (mv) { e.preventDefault(); openPop(mv, mv.getAttribute("data-fen"), list(mv.getAttribute("data-hl")), [], mv.textContent); return; }
    var see = e.target.closest("button.see");
    if (see) {
      var st = see.closest("[data-story]");
      if (st) openPop(see, st.getAttribute("data-fen"), list(st.getAttribute("data-hl")), list(st.getAttribute("data-arrows")), st.getAttribute("data-cap"));
      return;
    }
    if (pop && !e.target.closest(".mv-pop")) closePop();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePop(); });
  window.addEventListener("resize", closePop);

  // ---------- board that follows the reading (computer screens) ----------
  function story() {
    var card = document.querySelector(".story-card");
    var els = document.querySelectorAll("[data-story]");
    if (!card || !els.length) return;
    var board = card.querySelector(".story-board"), cap = card.querySelector(".story-cap");
    FLIP = board.getAttribute("data-flip") === "1";
    var current = null;
    function show(el) {
      if (el === current) return;
      if (current) current.classList.remove("story-on");
      current = el; el.classList.add("story-on");
      drawBoard(board, el.getAttribute("data-fen"), list(el.getAttribute("data-hl")), list(el.getAttribute("data-arrows")), FLIP);
      cap.textContent = el.getAttribute("data-cap") || "";
      board.classList.remove("flash"); void board.offsetWidth; board.classList.add("flash");
    }
    drawBoard(board, board.getAttribute("data-fen"), list(board.getAttribute("data-hl")), list(board.getAttribute("data-arrows")), FLIP);
    if (!window.IntersectionObserver) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) show(en.target); });
    }, { rootMargin: "-38% 0px -52% 0px" });
    els.forEach(function (el) {
      io.observe(el);
      el.addEventListener("mouseenter", function () { if (window.matchMedia("(min-width: 1081px)").matches) show(el); });
    });
  }

  // ---------- quick checks ----------
  function checks() {
    document.querySelectorAll(".qc").forEach(function (box) {
      var ans = +box.getAttribute("data-answer");
      box.addEventListener("click", function (e) {
        var b = e.target.closest(".qc-opt");
        if (!b || box.classList.contains("answered")) return;
        var ok = +b.getAttribute("data-i") === ans;
        box.classList.add("answered", ok ? "right" : "wrong");
        box.querySelectorAll(".qc-opt").forEach(function (o) {
          o.disabled = true;
          if (+o.getAttribute("data-i") === ans) o.classList.add("correct");
        });
        if (!ok) b.classList.add("picked");
        var why = box.querySelector(".qc-why");
        why.hidden = false;
        why.insertAdjacentHTML("afterbegin", "<strong>" + (ok ? "\u2705 Correct! " : "\u274c Not quite. ") + "</strong>");
      });
    });
  }

  // ---------- "Test yourself" quiz ----------
  function shuffle(a, seed) {
    var s = seed; a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; var j = Math.floor(s / 233280 * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function quiz() {
    var sec = document.querySelector(".lq");
    if (!sec) return;
    var data;
    try { data = JSON.parse(sec.querySelector("script[type='application/json']").textContent); } catch (e) { return; }
    var box = sec.querySelector(".lq-box"), qs = data.questions, i = 0, score = 0;
    var who = data.side === "w" ? "White" : "Black";
    function render() {
      if (i >= qs.length) return finish();
      var q = qs[i];
      var opts = shuffle([q.answer].concat(q.wrong), i * 7 + qs.length);
      box.innerHTML =
        '<div class="lq-top"><span class="lq-step">Question ' + (i + 1) + " of " + qs.length + '</span><span class="lq-score">Score ' + score + "</span></div>" +
        '<div class="lq-bar"><i style="width:' + (i / qs.length * 100) + '%"></i></div>' +
        '<div class="lq-main"><div class="lq-board"></div><div class="lq-side">' +
        '<p class="lq-q"><strong>' + who + " to play, move " + q.moveNo + ".</strong> What's the main-line move?</p>" +
        '<div class="lq-opts">' + opts.map(function (o) { return '<button type="button" class="lq-opt" data-m="' + o + '">' + o + "</button>"; }).join("") + "</div>" +
        '<p class="lq-fb" hidden></p><button type="button" class="btn lq-next" hidden>' + (i + 1 < qs.length ? "Next question \u2192" : "See my score") + "</button></div></div>";
      drawBoard(box.querySelector(".lq-board"), q.fen, [], [], data.flip === 1);
    }
    function finish() {
      var pct = score / qs.length, msg = pct === 1 ? "Perfect! You know this opening." : pct >= 0.6 ? "Nice work! Replay the main line once more to lock it in." : "Good start. Step through the main line again, then retry.";
      box.innerHTML = '<div class="lq-end"><p class="lq-big">' + score + " / " + qs.length + '</p><p>' + msg + '</p><div class="lq-end-btns"><button type="button" class="btn ghost lq-again">\u21ba Try again</button></div></div>';
      if (pct >= 0.6) markLearned(data.slug);
      try { var best = store("ce-quiz-" + data.slug) || 0; if (score > best) store("ce-quiz-" + data.slug, score); } catch (e) {}
    }
    box.addEventListener("click", function (e) {
      var o = e.target.closest(".lq-opt");
      if (o && !box.querySelector(".lq-opt[disabled]")) {
        var q = qs[i], ok = o.getAttribute("data-m") === q.answer;
        if (ok) score++;
        box.querySelectorAll(".lq-opt").forEach(function (b) {
          b.disabled = true;
          if (b.getAttribute("data-m") === q.answer) b.classList.add("correct");
        });
        if (!ok) o.classList.add("picked");
        drawBoard(box.querySelector(".lq-board"), q.fen, [q.from, q.to], [q.from + q.to], data.flip === 1);
        var fb = box.querySelector(".lq-fb");
        fb.hidden = false;
        fb.innerHTML = "<strong>" + (ok ? "\u2705 Correct!" : "\u274c The main line plays " + q.answer + ".") + "</strong> ";
        fb.appendChild(document.createTextNode(q.note || ""));
        box.querySelector(".lq-score").textContent = "Score " + score;
        var nx = box.querySelector(".lq-next"); nx.hidden = false; nx.focus({ preventScroll: true });
        return;
      }
      if (e.target.closest(".lq-next")) { i++; render(); return; }
      if (e.target.closest(".lq-again")) { i = 0; score = 0; render(); }
    });
    render();
    sec.querySelectorAll(".lq-mark").forEach(function (b) { b.addEventListener("click", function () { markLearned(b.getAttribute("data-slug")); }); });
    if (learned().indexOf(data.slug) >= 0) markLearned(data.slug);
  }

  function go() {
    var lq = document.querySelector(".lq script[type='application/json']");
    if (lq) { try { FLIP = JSON.parse(lq.textContent).flip === 1; } catch (e) {} }
    story(); checks(); quiz();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
})();
