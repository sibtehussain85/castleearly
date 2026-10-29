/*
 * CastleEarly game import: load a player's public games from Chess.com or Lichess
 * (their free public APIs, called straight from the visitor's browser) or from a pasted PGN,
 * then analyze any game with Stockfish 19 lite. CastleEarly is not affiliated with Chess.com or Lichess.
 */
(function () {
  "use strict";
  var Chess = window.CEChess;
  var $ = function (s) { return document.querySelector(s); };
  var form = $("#an-form");
  if (!form || !Chess) return;
  var statusEl = $("#an-status"), listEl = $("#an-list"), gamesSec = $("#an-games"), boardSec = $("#an-board");
  var moreBtn = $("#an-more"), titleEl = $("#an-games-title");
  var SITE_NAME = { chesscom: "Chess.com", lichess: "Lichess" };
  var st = null; // current search

  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function status(html, cls) { statusEl.className = "an-status" + (cls ? " " + cls : ""); statusEl.innerHTML = html || ""; statusEl.hidden = !html; }
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  /* ---------- PGN / SAN \u2192 moves ---------- */
  function sanToUci(c, san) {
    var want = san.replace(/[+#!?]+$/g, "").replace(/0-0-0/, "O-O-O").replace(/0-0/, "O-O");
    var legal = c.legalMoves();
    for (var i = 0; i < legal.length; i++) {
      var s = c.san(legal[i], legal).replace(/[+#]/g, "");
      if (s === want || s.replace("=", "") === want.replace("=", "")) {
        var m = legal[i];
        return Chess.sqName(m.from) + Chess.sqName(m.to) + (m.promotion ? m.promotion.toLowerCase() : "");
      }
    }
    return null;
  }
  function pgnHeaders(pgn) {
    var h = {}, re = /\[(\w+)\s+"([^"]*)"\]/g, m;
    while ((m = re.exec(pgn))) h[m[1]] = m[2];
    return h;
  }
  function pgnSans(pgn) {
    var body = pgn.replace(/\[[^\]]*\]/g, " ").replace(/\{[^}]*\}/g, " ").replace(/;[^\n]*/g, " ");
    var depth = 0, out = "";
    for (var i = 0; i < body.length; i++) { // drop (variations), even nested ones
      var ch = body[i];
      if (ch === "(") depth++;
      else if (ch === ")") depth = Math.max(0, depth - 1);
      else if (!depth) out += ch;
    }
    return out.replace(/\$\d+/g, " ").replace(/\d+\.(\.\.)?/g, " ").split(/\s+/).filter(function (t) {
      return t && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t);
    });
  }
  // Returns {fen, moves:[uci]} or throws a readable error
  function toMoves(fen, sans) {
    var c = new Chess(fen || Chess.START_FEN), moves = [];
    for (var i = 0; i < sans.length; i++) {
      var u = sanToUci(c, sans[i]);
      if (!u) throw new Error("couldn't read move " + (Math.floor(i / 2) + 1) + " (" + sans[i] + ")");
      c.move(u); moves.push(u);
    }
    return { fen: fen || Chess.START_FEN, moves: moves };
  }

  /* ---------- Chess.com (Published-Data API) ---------- */
  var CC_REASON = { checkmated: "checkmate", resigned: "resignation", timeout: "time", abandoned: "abandonment", agreed: "agreement",
    repetition: "repetition", stalemate: "stalemate", insufficient: "insufficient material", "50move": "the 50-move rule",
    timevsinsufficient: "time vs insufficient material", kingofthehill: "king of the hill", threecheck: "three checks", bughousepartnerlose: "partner loss" };
  // Backup route: Chess.com also serves JSONP (a script tag), used if a browser blocks the normal request
  var jsonpN = 0;
  function ccJsonp(url) {
    return new Promise(function (resolve, reject) {
      var name = "ceCC" + Date.now() + (jsonpN++), s = document.createElement("script"), done = false;
      function end() { done = true; try { delete window[name]; } catch (e) { window[name] = undefined; } if (s.parentNode) s.parentNode.removeChild(s); }
      var timer = setTimeout(function () { if (!done) { end(); reject(new Error("network")); } }, 20000);
      window[name] = function (data) {
        clearTimeout(timer); end();
        if (data && data.code === 0 && !data.archives && !data.games) { var e = new Error("notfound"); e.code = 404; reject(e); }
        else resolve(data);
      };
      s.onerror = function () { clearTimeout(timer); if (!done) { end(); reject(new Error("network")); } };
      s.src = url + (url.indexOf("?") < 0 ? "?" : "&") + "callback=" + name;
      document.head.appendChild(s);
    });
  }
  function ccJson(url) {
    return ccFetch(url).catch(function (err) {
      if (err && (err.code || /busy|answered/.test(err.message))) throw err; // a real answer from Chess.com
      return ccJsonp(url); // the request itself failed: try the backup route
    });
  }
  function ccFetch(url) {
    return fetch(url).then(function (r) {
      if (r.status === 404 || r.status === 410) { var e = new Error("notfound"); e.code = 404; throw e; }
      if (r.status === 429) throw new Error("Chess.com is busy right now. Please try again in a minute.");
      if (!r.ok) throw new Error("Chess.com answered with an error (" + r.status + "). Please try again later.");
      return r.json();
    });
  }
  function ccGame(g) {
    if (g.rules && g.rules !== "chess") return null;
    if (!g.pgn) return null;
    var h = pgnHeaders(g.pgn), res = h.Result || "*";
    if (g.white && g.black) {
      if (g.white.result === "win") res = "1-0"; else if (g.black.result === "win") res = "0-1";
      else if (res === "*") res = "1/2-1/2";
    }
    var loser = res === "1-0" ? g.black : res === "0-1" ? g.white : g.white;
    var tc = g.time_control || "", tcl = tc;
    if (/^\d+(\+\d+)?$/.test(tc)) { var p = tc.split("+"); tcl = (+p[0] >= 60 ? Math.round(+p[0] / 60) : (+p[0] / 60).toFixed(1).replace(/\.0$/, "")) + "+" + (p[1] || 0); }
    else if (/^1\/\d+$/.test(tc)) tcl = Math.round(+tc.split("/")[1] / 86400) + " day";
    var opening = "";
    if (h.ECOUrl) opening = decodeURIComponent(h.ECOUrl.split("/").pop()).replace(/-/g, " ").replace(/\s\d.*$/, "").replace(/\.\.\..*$/, "");
    return {
      site: "chesscom", url: g.url, pgn: g.pgn,
      fen: h.SetUp === "1" && h.FEN ? h.FEN : null,
      white: { name: (g.white && g.white.username) || h.White || "White", rating: g.white && g.white.rating },
      black: { name: (g.black && g.black.username) || h.Black || "Black", rating: g.black && g.black.rating },
      result: res, reason: res === "1/2-1/2" ? CC_REASON[g.white && g.white.result] || "draw" : CC_REASON[loser && loser.result] || "",
      speed: g.time_class || "", tc: tcl, date: (g.end_time || 0) * 1000, opening: opening
    };
  }
  function ccStart(user) {
    return ccJson("https://api.chess.com/pub/player/" + encodeURIComponent(user.toLowerCase()) + "/games/archives").then(function (d) {
      st.archives = (d && d.archives) || [];
      st.idx = st.archives.length - 1;
      if (!st.archives.length) st.done = true;
    });
  }
  function ccMore() { // newest months first; keep going until we have ~20 new games (max 4 months per click)
    var added = 0, months = 0;
    function step() {
      if (st.idx < 0) { st.done = true; return Promise.resolve(added); }
      return ccJson(st.archives[st.idx--]).then(function (d) {
        var games = ((d && d.games) || []).slice().reverse().map(ccGame).filter(Boolean);
        addGames(games); added += games.length; months++;
        if (st.idx < 0) st.done = true;
        if (added < 20 && months < 4 && st.idx >= 0) return step();
        return added;
      });
    }
    return step();
  }

  /* ---------- Lichess (public API) ---------- */
  var LI_REASON = { mate: "checkmate", resign: "resignation", outoftime: "time", timeout: "abandonment", draw: "agreement", stalemate: "stalemate", cheat: "cheat detection", noStart: "no start", variantEnd: "variant end" };
  function liGame(g) {
    if (!g || !g.moves || (g.variant && g.variant !== "standard" && g.variant !== "fromPosition")) return null;
    if (g.status === "aborted" || g.status === "noStart") return null;
    var pl = g.players || {}, w = pl.white || {}, b = pl.black || {};
    var name = function (p, d) { return (p.user && p.user.name) || (p.aiLevel ? "Stockfish level " + p.aiLevel : d); };
    var res = g.winner === "white" ? "1-0" : g.winner === "black" ? "0-1" : "1/2-1/2";
    var tc = g.clock ? Math.round(g.clock.initial / 60 * 10) / 10 + "+" + g.clock.increment : g.daysPerTurn ? g.daysPerTurn + " day" : "";
    return {
      site: "lichess", url: "https://lichess.org/" + g.id, sans: g.moves.split(" "),
      fen: g.initialFen || null,
      white: { name: name(w, "White"), rating: w.rating }, black: { name: name(b, "Black"), rating: b.rating },
      result: res, reason: LI_REASON[g.status] || g.status || "",
      speed: g.speed || "", tc: tc, date: g.lastMoveAt || g.createdAt || 0, opening: (g.opening && g.opening.name) || "",
      created: g.createdAt
    };
  }
  function liMore() {
    var url = "https://lichess.org/api/games/user/" + encodeURIComponent(st.user) + "?max=30&opening=true&clocks=false&evals=false" + (st.until ? "&until=" + st.until : "");
    return fetch(url, { headers: { Accept: "application/x-ndjson" } }).then(function (r) {
      if (r.status === 404) { var e = new Error("notfound"); e.code = 404; throw e; }
      if (r.status === 429) throw new Error("Lichess is busy right now. Please wait a minute and try again.");
      if (!r.ok) throw new Error("Lichess answered with an error (" + r.status + "). Please try again later.");
      return r.text();
    }).then(function (text) {
      var raw = text.split("\n").filter(function (l) { return l.trim(); }).map(function (l) { return JSON.parse(l); });
      if (raw.length < 30) st.done = true;
      if (raw.length) st.until = raw[raw.length - 1].createdAt - 1;
      var games = raw.map(liGame).filter(Boolean);
      addGames(games);
      return games.length;
    });
  }

  /* ---------- Game list ---------- */
  function fmtDate(ms) {
    if (!ms) return "";
    try { return new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); } catch (e) { return ""; }
  }
  function addGames(games) {
    games.forEach(function (g) {
      var i = st.games.length;
      st.games.push(g);
      var me = g.white.name.toLowerCase() === st.user.toLowerCase() ? "w" : g.black.name.toLowerCase() === st.user.toLowerCase() ? "b" : null;
      var out = g.result === "1/2-1/2" ? "draw" : !me ? "other" : (g.result === "1-0") === (me === "w") ? "win" : "loss";
      var letter = { win: "W", loss: "L", draw: "D", other: g.result === "1-0" ? "1-0" : "0-1" }[out];
      var plies = g.sans ? g.sans.length : pgnSans(g.pgn).length;
      if (plies < 2) { st.games[i] = null; return; }
      var p = function (x) { return esc(x.name) + (x.rating ? ' <span class="an-r">(' + esc(x.rating) + ")</span>" : ""); };
      var b = document.createElement("button");
      b.type = "button"; b.className = "an-game"; b.setAttribute("data-i", i);
      b.innerHTML = '<span class="an-res ' + out + '" title="' + esc(g.result + (g.reason ? " by " + g.reason : "")) + '">' + letter + "</span>" +
        '<span class="an-main"><span class="an-players"><span class="an-w">\u2654</span> ' + p(g.white) + ' <span class="an-vs">vs</span> <span class="an-b">\u265a</span> ' + p(g.black) + "</span>" +
        '<span class="an-meta">' + [g.speed ? g.speed.charAt(0).toUpperCase() + g.speed.slice(1) + (g.tc ? " " + esc(g.tc) : "") : esc(g.tc), fmtDate(g.date), Math.ceil(plies / 2) + " moves", g.opening ? esc(g.opening) : ""].filter(Boolean).join(" \u00b7 ") + "</span></span>" +
        '<span class="an-go">Analyze \u2192</span>';
      listEl.appendChild(b);
    });
  }

  function search(site, user) {
    user = (user || "").trim().replace(/^@/, "");
    if (!/^[A-Za-z0-9_-]{2,30}$/.test(user)) { status("Please type a valid " + SITE_NAME[site] + " username (letters, numbers, - and _).", "bad"); return; }
    st = { site: site, user: user, games: [], done: false, idx: -1, archives: [], until: null, busy: true };
    var my = st;
    store("ce-an-site", site); store("ce-an-user", user);
    try { history.replaceState(null, "", "?" + site + "=" + encodeURIComponent(user)); } catch (e) {}
    listEl.innerHTML = ""; gamesSec.hidden = true; moreBtn.hidden = true;
    status('<span class="an-spin"></span> Loading ' + esc(user) + "'s games from " + SITE_NAME[site] + "\u2026");
    var p = site === "chesscom" ? ccStart(user).then(ccMore) : liMore();
    p.then(function () {
      if (st !== my) return;
      st.busy = false;
      var n = st.games.filter(Boolean).length;
      if (!n) { status("We found <b>" + esc(user) + "</b> on " + SITE_NAME[site] + ", but there are no standard chess games to show yet.", "bad"); return; }
      status("");
      titleEl.textContent = user + "'s games on " + SITE_NAME[site];
      gamesSec.hidden = false;
      moreBtn.hidden = st.done;
    }, function (err) {
      if (st !== my) return;
      st.busy = false;
      if (err && err.code === 404) status("We couldn't find the " + SITE_NAME[site] + " player <b>" + esc(user) + "</b>. Check the spelling, or switch between Chess.com and Lichess.", "bad");
      else if (err && err.message && !/fetch|network|load failed/i.test(err.message)) status(esc(err.message), "bad");
      else status("We couldn't reach " + SITE_NAME[site] + ". Check your internet connection and try again.", "bad");
    });
  }

  moreBtn.addEventListener("click", function () {
    if (!st || st.busy || st.done) return;
    st.busy = true; moreBtn.disabled = true; moreBtn.textContent = "Loading\u2026";
    var my = st;
    (st.site === "chesscom" ? ccMore() : liMore()).then(function () { if (st !== my) return; st.busy = false; }, function () { if (st !== my) return; st.busy = false; })
      .then(function () { moreBtn.disabled = false; moreBtn.textContent = "Load older games"; moreBtn.hidden = st.done; });
  });

  /* ---------- Open a game in the analysis board ---------- */
  var boardRoot = boardSec.querySelector(".playboard");
  function board() { return boardRoot && boardRoot._board; }
  function analyze(g, flipForUser) {
    var b = board();
    if (!b) { status("The board could not load. Please refresh the page.", "bad"); return; }
    var parsed;
    try { parsed = toMoves(g.fen, g.sans || pgnSans(g.pgn)); }
    catch (e) { status("Sorry, we " + esc(e.message) + " in this game.", "bad"); return; }
    status("");
    var label = function (x) { return x.name + (x.rating ? " (" + x.rating + ")" : ""); };
    boardSec.hidden = false;
    $("#an-board-title").textContent = g.white.name + " vs " + g.black.name + (g.result ? "  \u00b7  " + g.result.replace("1/2-1/2", "\u00bd-\u00bd") : "");
    var link = $("#an-board-link");
    if (g.url) { link.href = g.url; link.textContent = "View on " + SITE_NAME[g.site]; link.hidden = false; } else link.hidden = true;
    b.onBack = function () { boardSec.hidden = true; var t = gamesSec.hidden ? form : gamesSec; t.scrollIntoView({ behavior: "smooth", block: "start" }); };
    b.loadGame({ fen: parsed.fen, moves: parsed.moves, names: { w: label(g.white), b: label(g.black) }, flip: flipForUser, result: g.result });
    boardSec.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  listEl.addEventListener("click", function (e) {
    var b = e.target.closest(".an-game");
    if (!b || !st) return;
    var g = st.games[+b.getAttribute("data-i")];
    if (!g) return;
    var cur = listEl.querySelector(".an-game.on"); if (cur) cur.classList.remove("on");
    b.classList.add("on");
    analyze(g, g.black.name.toLowerCase() === st.user.toLowerCase());
  });

  /* ---------- Pasted PGN ---------- */
  var pgnForm = $("#an-pgn-form");
  if (pgnForm) pgnForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var txt = $("#an-pgn").value.trim();
    if (!txt) { status("Paste a PGN first.", "bad"); return; }
    var games = txt.split(/\n\s*\n(?=\[Event )/); // several games? take the first
    var pgn = games[0], h = pgnHeaders(pgn);
    var g = { site: "", url: "", pgn: pgn, fen: h.SetUp === "1" && h.FEN ? h.FEN : (h.FEN || null),
      white: { name: h.White || "White", rating: h.WhiteElo && h.WhiteElo !== "?" ? h.WhiteElo : "" },
      black: { name: h.Black || "Black", rating: h.BlackElo && h.BlackElo !== "?" ? h.BlackElo : "" }, result: h.Result && h.Result !== "*" ? h.Result : "" };
    if (h.Variant && !/standard|from position/i.test(h.Variant)) { status("Only standard chess games can be analyzed.", "bad"); return; }
    if (pgnSans(pgn).length < 1) { status("We couldn't find any moves in that PGN.", "bad"); return; }
    analyze(g, false);
  });

  /* ---------- Search form ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var site = form.querySelector('input[name="site"]:checked').value;
    search(site, form.querySelector("#an-user").value);
  });
  // Prefill from the link (?chesscom=name or ?lichess=name) or from the last search
  var q = location.search.match(/[?&](chesscom|lichess)=([^&]+)/);
  var site0 = q ? q[1] : load("ce-an-site"), user0 = q ? decodeURIComponent(q[2]) : load("ce-an-user");
  if (site0 && SITE_NAME[site0]) { var r = form.querySelector('input[name="site"][value="' + site0 + '"]'); if (r) r.checked = true; }
  if (user0) form.querySelector("#an-user").value = user0;
  if (q) search(q[1], decodeURIComponent(q[2]));

  // tests
  window.CEImport = { pgnSans: pgnSans, toMoves: toMoves, ccGame: ccGame, liGame: liGame };
})();
