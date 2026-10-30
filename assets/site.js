/* Mobile menu + light/dark theme switch */
(function () {
  var btn = document.querySelector(".menu-btn"), nav = document.getElementById("site-nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      document.documentElement.classList.toggle("menu-open", open); // lock the page so swipes scroll the menu
    });
    // Close the menu (and unlock the page) when a link in it is tapped or the screen gets wide.
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a") && nav.classList.contains("open")) {
        nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false");
        document.documentElement.classList.remove("menu-open");
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 760 && nav.classList.contains("open")) {
        nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false");
        document.documentElement.classList.remove("menu-open");
      }
    });
  }
  var root = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  function paintMeta() { if (meta) meta.setAttribute("content", root.getAttribute("data-theme") === "dark" ? "#262421" : "#2f5d50"); }
  paintMeta();
  var tb = document.querySelector(".theme-btn");
  if (tb) {
    tb.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("ce-theme", next); } catch (e) {}
      paintMeta();
    });
  }
})();

/* Site search: the index (assets/search-index.js) is only downloaded when someone opens the search */
(function () {
  "use strict";
  var btn = document.querySelector(".search-btn");
  if (!btn) return;
  var me = document.currentScript || document.querySelector('script[src*="site.js"]');
  var src = (me && me.src) || "";
  var BASE = src.replace(/assets\/site\.js(\?.*)?$/, "");
  var logo = document.querySelector(".logo");
  var SUFFIX = /index\.html$/.test((logo && logo.getAttribute("href")) || "") || /\/index\.html$/.test(location.pathname) ? "index.html" : "";
  var STOP = { how: 1, to: 1, the: 1, a: 1, an: 1, in: 1, of: 1, do: 1, does: 1, what: 1, is: 1, are: 1, i: 1, for: 1, and: 1, with: 1, my: 1, can: 1, you: 1, on: 1, it: 1, me: 1, best: 0 };
  var SYN = { castle: ["castling"], castles: ["castling"], horse: ["knight"], review: ["analysis", "analyze"], analyse: ["analyze", "analysis"],
    analyze: ["analysis"], spanish: ["ruy"], russian: ["petrov"], petroff: ["petrov"], enpassant: ["passant"], ep: ["passant"],
    promote: ["promotion"], promoting: ["promotion"], bot: ["computer"], ai: ["computer"], engine: ["stockfish"], rule: ["rules"],
    puzzle: ["puzzles", "tactics"], puzzles: ["tactics"], mate: ["checkmate"], kingside: ["castling"], queenside: ["castling"], pins: ["pin"], forks: ["fork"] };
  var POPULAR = [
    { t: "Play chess vs the computer", u: "", s: "Play" },
    { t: "Analyze your Chess.com or Lichess games", u: "analysis/", s: "Game analysis" },
    { t: "The best chess openings for beginners", u: "openings/best-chess-openings-for-beginners/", s: "Openings" },
    { t: "Chess tactics: 28 patterns with puzzles", u: "tactics/", s: "Tactics" },
    { t: "How chess pieces move", u: "learn/how-chess-pieces-move/", s: "Learn" }
  ];
  var data = null, loading = false, open = false, items = [], active = -1, lastFocus = null;

  function norm(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\u2019']/g, "").replace(/[^a-z0-9.#+=]+/g, " ").trim(); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function href(u) { var p = u.split("#"); return BASE + p[0] + (SUFFIX && (p[0] === "" || /\/$/.test(p[0])) ? SUFFIX : "") + (p[1] ? "#" + p[1] : ""); }
  function lev(a, b, max) { // edit distance (swapped letters count as one typo), with early exit
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var pp = null, prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i]; var best = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (pp && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], pp[j - 2] + 1);
        if (cur[j] < best) best = cur[j];
      }
      if (best > max) return max + 1;
      pp = prev; prev = cur;
    }
    return prev[b.length];
  }
  function prep() {
    data.forEach(function (e) {
      e._t = " " + norm(e.t) + " "; e._k = " " + norm(e.k + " " + e.s) + " "; e._d = " " + norm(e.d) + " ";
      e._tw = e._t.split(" ").filter(function (w) { return w.length > 3; });
      e._kw = e._k.split(" ").filter(function (w) { return w.length > 3; });
      e._j = e._t.replace(/ /g, "");
    });
  }
  function tokenScore(e, tok, fuzzy) {
    var alts = [tok].concat(SYN[tok] || []), best = 0;
    alts.forEach(function (w) {
      var sc = 0;
      if (e._t.indexOf(" " + w + " ") >= 0) sc = 14; else if (e._t.indexOf(" " + w) >= 0) sc = 11; else if (w.length > 2 && e._t.indexOf(w) >= 0) sc = 7;
      else if (e._k.indexOf(" " + w) >= 0) sc = 5; else if (e._d.indexOf(" " + w) >= 0) sc = 3;
      if (sc > best) best = sc;
    });
    if (!best && tok.length >= 5 && e._j.indexOf(tok) >= 0) best = 10; // words typed together: "carokann"
    if (!best && fuzzy && tok.length >= 4) { // typo tolerance (only when exact matching finds little)
      var max = tok.length >= 8 ? 2 : 1;
      var near = function (w) { return lev(tok, w, max) <= max || lev(tok, w.slice(0, tok.length), max) <= max; };
      if (e._tw.some(near)) best = 9;
      else if (e._kw.some(near)) best = 3;
    }
    return best;
  }
  function search(q) {
    var exact = run(q, false);
    if (exact.length >= 3) return exact;
    var seen = {}, out = exact.slice();
    exact.forEach(function (e) { seen[e.u + e.t] = 1; });
    run(q, true).forEach(function (e) { if (!seen[e.u + e.t] && out.length < 12) out.push(e); });
    return out;
  }
  function run(q, fuzzy) {
    var all = norm(q).split(" ").filter(Boolean);
    var toks = all.filter(function (t) { return !STOP[t]; });
    if (!toks.length) toks = all;
    if (toks.length > 1) { var nc = toks.filter(function (t) { return t !== "chess"; }); if (nc.length) toks = nc; }
    if (!toks.length) return [];
    var need = Math.max(1, Math.ceil(toks.length * 0.67)), out = [];
    var phrase = norm(q);
    data.forEach(function (e) {
      var sc = 0, hit = 0;
      toks.forEach(function (t) { var s = tokenScore(e, t, fuzzy); if (s) { hit++; sc += s; } });
      if (hit < need) return;
      sc *= hit / toks.length;
      if (phrase.length > 3 && e._t.indexOf(phrase) >= 0) sc += 12;
      if (e.u.indexOf("#") < 0 && e.s.indexOf("FAQ") !== 0) sc += 3; // whole pages first on ties
      out.push({ e: e, sc: sc });
    });
    out.sort(function (a, b) { return b.sc - a.sc; });
    return out.slice(0, 12).map(function (x) { return x.e; });
  }

  // ---------- UI ----------
  var box = document.createElement("div");
  box.className = "srch"; box.hidden = true;
  box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Search CastleEarly");
  box.innerHTML = '<div class="srch-panel"><div class="srch-bar">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>' +
    '<input type="search" id="srch-q" placeholder="Search openings, tactics, rules\u2026" autocomplete="off" spellcheck="false" aria-label="Search" aria-controls="srch-list" role="combobox" aria-expanded="true" aria-autocomplete="list">' +
    '<button type="button" class="srch-close" aria-label="Close search"><span class="k">Esc</span><span class="x">\u2715</span></button></div>' +
    '<div class="srch-list" id="srch-list" role="listbox"></div></div>';
  document.body.appendChild(box);
  var input = box.querySelector("input"), list = box.querySelector(".srch-list");

  function mark(text, q) {
    var t = esc(text), toks = norm(q).split(" ").filter(function (w) { return w.length > 1 && !STOP[w]; });
    toks.forEach(function (w) { t = t.replace(new RegExp("(^|[^a-z])(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "$1<mark>$2</mark>"); });
    return t;
  }
  function render() {
    var q = input.value.trim(), res, html = "";
    if (!data) { list.innerHTML = '<p class="srch-empty">Loading\u2026</p>'; return; }
    if (!q) { res = POPULAR; html = '<p class="srch-head">Popular</p>'; }
    else res = search(q);
    if (q && !res.length) {
      list.innerHTML = '<p class="srch-empty">No results for \u201c' + esc(q) + '\u201d. Try an opening name (like <i>Sicilian</i>), a tactic (like <i>fork</i>) or a rule (like <i>castling</i>).</p>';
      items = []; active = -1; return;
    }
    res.forEach(function (e, i) {
      html += '<a class="srch-item" role="option" id="srch-o' + i + '" href="' + esc(href(e.u)) + '"><span class="srch-sec">' + esc(e.s) + '</span>' +
        '<span class="srch-t">' + (q ? mark(e.t, q) : esc(e.t)) + "</span>" + (e.d ? '<span class="srch-d">' + esc(e.d) + "</span>" : "") + "</a>";
    });
    list.innerHTML = html;
    items = [].slice.call(list.querySelectorAll(".srch-item"));
    setActive(q ? 0 : -1);
  }
  function setActive(i) {
    if (items[active]) items[active].classList.remove("on");
    active = i;
    if (items[active]) { items[active].classList.add("on"); items[active].scrollIntoView({ block: "nearest" }); input.setAttribute("aria-activedescendant", items[active].id); }
    else input.removeAttribute("aria-activedescendant");
  }
  function load() {
    if (data || loading) return;
    loading = true;
    var s = document.createElement("script");
    s.src = BASE + "assets/search-index.js" + ((me && me.src && (me.src.match(/\?.*$/) || [""])[0]) || "");
    s.onload = function () { data = window.CE_SEARCH || []; prep(); render(); };
    s.onerror = function () { loading = false; list.innerHTML = '<p class="srch-empty">Search couldn\u2019t load. Check your connection and try again.</p>'; };
    document.head.appendChild(s);
  }
  function show() {
    if (open) return;
    open = true; lastFocus = document.activeElement;
    box.hidden = false; document.documentElement.classList.add("srch-open");
    btn.setAttribute("aria-expanded", "true");
    load(); render();
    setTimeout(function () { input.focus(); input.select(); }, 20);
  }
  function hide() {
    if (!open) return;
    open = false; box.hidden = true; document.documentElement.classList.remove("srch-open");
    btn.setAttribute("aria-expanded", "false");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  btn.addEventListener("click", show);
  box.addEventListener("click", function (e) {
    if (e.target === box || e.target.closest(".srch-close")) hide();
    else if (e.target.closest(".srch-item")) setTimeout(hide, 0); // same-page #links: close the box
  });
  input.addEventListener("input", render);
  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); if (items.length) setActive((active + 1) % items.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (items.length) setActive((active - 1 + items.length) % items.length); }
    else if (e.key === "Enter") { var a = items[active] || items[0]; if (a) { e.preventDefault(); hide(); location.href = a.href; } }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && open) { e.preventDefault(); hide(); return; }
    var t = e.target, typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    if (!open && ((e.key === "/" && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k"))) { e.preventDefault(); show(); }
  });
  window.CESearch = { open: show, close: hide, query: function (q) { return data ? search(q) : null; } };
})();

/* Mini boards (header band, opening cards, tactics index), "On this page" highlighting, gentle fade-in */
(function () {
  "use strict";
  function drawBoards() {
    if (!window.CE_PIECE_SVG) return;
    var boards = document.querySelectorAll(".mini-board[data-fen]");
    for (var b = 0; b < boards.length; b++) {
      var el = boards[b];
      if (el.getAttribute("data-done")) continue;
      var rows = el.getAttribute("data-fen").split("/"), flip = el.getAttribute("data-flip") === "1";
      var hl = (el.getAttribute("data-hl") || "").split(","), grid = [], html = "";
      for (var r = 0; r < 8; r++) {
        var row = [];
        (rows[r] || "8").split("").forEach(function (ch) {
          if (/\d/.test(ch)) for (var k = 0; k < +ch; k++) row.push(""); else row.push(ch);
        });
        grid.push(row);
      }
      for (var v = 0; v < 64; v++) {
        var rr = flip ? 7 - (v >> 3) : (v >> 3), cc = flip ? 7 - (v & 7) : (v & 7);
        var name = "abcdefgh"[cc] + (8 - rr), p = grid[rr][cc] || "";
        html += '<div class="mb ' + ((rr + cc) % 2 ? "d" : "l") + (hl.indexOf(name) >= 0 ? " h" : "") + '">' + (p ? window.CE_PIECE_SVG(p) : "") + "</div>";
      }
      el.innerHTML = html;
      el.setAttribute("data-done", "1");
    }
  }
  function spy() {
    var links = document.querySelectorAll(".side-toc a");
    if (!links.length || !window.IntersectionObserver) return;
    var map = {}, current = null;
    for (var i = 0; i < links.length; i++) map[links[i].getAttribute("href").slice(1)] = links[i];
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          if (current) current.classList.remove("on");
          current = map[e.target.id]; if (current) current.classList.add("on");
        }
      });
    }, { rootMargin: "-90px 0px -65% 0px" });
    Object.keys(map).forEach(function (id) { var t = document.getElementById(id); if (t) io.observe(t); });
  }
  function reveal() {
    if (!window.IntersectionObserver) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var els = document.querySelectorAll(".cards .card, .tc-group, .puzzle-block, .trainer, .side-card, .feature");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -40px 0px" });
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      if (r.top > window.innerHeight) { els[i].classList.add("reveal"); io.observe(els[i]); } // only things below the fold
    }
  }
  // Thin bar at the top that fills as you read a lesson or guide
  function progress() {
    if (!document.querySelector(".with-side .art-main")) return;
    var bar = document.createElement("div");
    bar.className = "read-progress"; bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    var ticking = false;
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")";
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }
  // "Learned" badges on opening cards (saved in this browser when a lesson quiz is passed)
  function learnedBadges() {
    var l = [];
    try { l = JSON.parse(localStorage.getItem("ce-learned") || "[]") || []; } catch (e) {}
    if (/^\/openings\/?$/.test(location.pathname)) {
      var all = {}, lc = document.querySelectorAll('a.card[href^="/openings/"]');
      for (var j = 0; j < lc.length; j++) {
        var sl = lc[j].getAttribute("href").replace(/^\/openings\/|\/$/g, "");
        if (sl && sl.indexOf("best-") !== 0 && sl.indexOf("which-") !== 0) all[sl] = 1;
      }
      var total = Object.keys(all).length, got = 0;
      for (var k in all) if (l.indexOf(k) >= 0) got++;
      var hero = document.querySelector(".page-hero");
      if (total && hero) {
        var bar = document.createElement("div");
        bar.className = "op-progress wrap-inner";
        bar.innerHTML = got
          ? "<span>\ud83d\udcda</span><b>You've learned " + got + " of " + total + " openings</b><span class=\"bar\"><i style=\"width:" + Math.round(got / total * 100) + "%\"></i></span>"
          : "<span>\ud83c\udfc5</span><span><b>Track your progress.</b> Pass the \"Test yourself\" quiz at the end of a lesson to earn a \u2713 Learned badge.</span>";
        bar.innerHTML += '<a class="op-quiz" href="/openings/which-opening-suits-you/">Not sure where to start? Take the 1-minute quiz \u2192</a>';
        hero.parentNode.insertBefore(bar, hero.nextSibling);
      }
    }
    if (!l.length) return;
    var cards = document.querySelectorAll('a.card[href^="/openings/"]');
    for (var i = 0; i < cards.length; i++) {
      var slug = cards[i].getAttribute("href").replace(/^\/openings\/|\/$/g, "");
      if (l.indexOf(slug) >= 0) cards[i].classList.add("is-learned");
    }
  }
  window.CEDrawBoards = drawBoards;
  function go() { drawBoards(); spy(); reveal(); progress(); learnedBadges(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
})();
