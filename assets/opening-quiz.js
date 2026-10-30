/* "Which chess opening suits you?" quiz. Five questions, then the best matches from CastleEarly's lessons. */
(function () {
  "use strict";
  // a = attacking, s = solid, t = strategic (0-3); th = how much theory (1-3); st = O open / C closed; lv = level needed (1-3)
  var OP = {
    "italian-game": { n: "Italian Game", side: "w", a: 2, s: 2, t: 2, th: 1, st: "O", lv: 1, why: "Simple ideas, fast development and pressure on f7. The classic first opening." },
    "ruy-lopez": { n: "Ruy Lopez", side: "w", a: 1, s: 2, t: 3, th: 3, st: "O", lv: 2, why: "Deep, rich strategy. World champions have played it for centuries." },
    "scotch-game": { n: "Scotch Game", side: "w", a: 2, s: 1, t: 2, th: 2, st: "O", lv: 2, why: "Opens the center on move 3 for a clear, active game." },
    "vienna-game": { n: "Vienna Game", side: "w", a: 3, s: 1, t: 1, th: 1, st: "O", lv: 1, why: "Flexible and sneaky, with the f4 gambit when you want a fight." },
    "four-knights-game": { n: "Four Knights Game", side: "w", a: 1, s: 3, t: 1, th: 1, st: "O", lv: 1, why: "Pure, safe development. It teaches the opening rules better than anything." },
    "fried-liver-attack": { n: "Fried Liver Attack", side: "w", a: 3, s: 0, t: 0, th: 2, st: "O", lv: 1, why: "A wild knight sacrifice that wins lots of fast games against unprepared players." },
    "london-system": { n: "London System", side: "w", a: 1, s: 3, t: 2, th: 1, st: "C", lv: 1, why: "One setup against everything, a safe king and very little to memorize." },
    "queens-gambit": { n: "Queen's Gambit", side: "w", a: 1, s: 2, t: 3, th: 2, st: "C", lv: 2, why: "Classical pressure on d5 and clear plans like the minority attack." },
    "english-opening": { n: "English Opening", side: "w", a: 0, s: 2, t: 3, th: 2, st: "C", lv: 3, why: "Control the center from the side and outplay your opponent slowly." },
    "sicilian-defense": { n: "Sicilian Defense", side: "e4", a: 3, s: 0, t: 2, th: 3, st: "O", lv: 2, why: "The fighting answer to 1.e4. Unbalanced games where Black plays to win." },
    "french-defense": { n: "French Defense", side: "e4", a: 1, s: 2, t: 3, th: 2, st: "C", lv: 2, why: "A rock-solid pawn chain and clear targets to attack." },
    "caro-kann-defense": { n: "Caro-Kann Defense", side: "e4", a: 0, s: 3, t: 2, th: 1, st: "C", lv: 1, why: "Super solid, easy to learn, and great in the endgame." },
    "scandinavian-defense": { n: "Scandinavian Defense", side: "e4", a: 1, s: 2, t: 1, th: 1, st: "O", lv: 1, why: "Almost no theory: you play 1...d5 and the same setup every game." },
    "petrov-defense": { n: "Petrov Defense", side: "e4", a: 0, s: 3, t: 1, th: 2, st: "O", lv: 2, why: "Symmetrical and very hard to beat. A favorite of top players." },
    "kings-indian-defense": { n: "King's Indian Defense", side: "d4", a: 3, s: 0, t: 2, th: 3, st: "C", lv: 3, why: "Let White take the center, then launch a kingside attack." },
    "nimzo-indian-defense": { n: "Nimzo-Indian Defense", side: "d4", a: 1, s: 2, t: 3, th: 3, st: "C", lv: 3, why: "Pins and doubled pawns: one of the most respected defenses in chess." },
    "queens-gambit-declined": { n: "Queen's Gambit Declined", side: "d4", a: 0, s: 3, t: 2, th: 2, st: "C", lv: 1, why: "Classical and solid. Hold d5 and free your game later." },
    "slav-defense": { n: "Slav Defense", side: "d4", a: 1, s: 3, t: 2, th: 2, st: "C", lv: 1, why: "Solid like the QGD, but your light-squared bishop stays free." }
  };
  var FEN = {
    "italian-game": ["r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R", "f1,c4"], "ruy-lopez": ["r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R", "f1,b5"],
    "scotch-game": ["r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R", "d2,d4"], "vienna-game": ["rnbqkbnr/pppp1ppp/8/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR", "b1,c3"],
    "four-knights-game": ["r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R", "g8,f6"], "fried-liver-attack": ["r1bqkb1r/ppp2Npp/2n5/3np3/2B5/8/PPPP1PPP/RNBQK2R", "g5,f7"],
    "london-system": ["rnbqkbnr/ppp1pppp/8/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR", "c1,f4"], "queens-gambit": ["rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR", "c2,c4"],
    "english-opening": ["rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR", "c2,c4"], "sicilian-defense": ["rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR", "c7,c5"],
    "french-defense": ["rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR", "e7,e6"], "caro-kann-defense": ["rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR", "c7,c6"],
    "scandinavian-defense": ["rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR", "d7,d5"], "petrov-defense": ["rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R", "g8,f6"],
    "kings-indian-defense": ["rnbqk2r/ppp1ppbp/3p1np1/8/2PPP3/2N5/PP3PPP/R1BQKBNR", "d7,d6"], "nimzo-indian-defense": ["rnbqk2r/pppp1ppp/4pn2/8/1bPP4/2N5/PP2PPPP/R1BQKBNR", "f8,b4"],
    "queens-gambit-declined": ["rnbqkbnr/ppp2ppp/4p3/3p4/2PP4/8/PP2PPPP/RNBQKBNR", "e7,e6"], "slav-defense": ["rnbqkbnr/pp2pppp/2p5/3p4/2PP4/8/PP2PPPP/RNBQKBNR", "c7,c6"]
  };
  var QS = [
    { k: "side", q: "Which color do you need an opening for?", o: [["w", "\u2654 White"], ["b", "\u265a Black"], ["both", "Both colors"]] },
    { k: "style", q: "What kind of games do you enjoy most?", o: [["a", "\u2694\ufe0f Attacking, sharp and tactical"], ["s", "\ud83d\udee1\ufe0f Safe and solid. I hate losing quickly"], ["t", "\u265f\ufe0f Slow plans and squeezing my opponent"]] },
    { k: "th", q: "How much do you want to memorize?", o: [["1", "As little as possible"], ["2", "Some moves are fine"], ["3", "I love studying lines"]] },
    { k: "st", q: "Which positions feel more comfortable?", o: [["O", "Open: pieces flying everywhere"], ["C", "Closed: pawn chains and maneuvering"], ["any", "No preference"]] },
    { k: "lv", q: "How would you describe your level?", o: [["1", "Brand new to chess"], ["2", "I play casually online"], ["3", "Club or tournament player"]] }
  ];

  function score(o, ans) {
    var s = (o[ans.style] || 0) * 3;
    s -= Math.abs(o.th - +ans.th) * 2;
    if (ans.st !== "any") s += o.st === ans.st ? 2 : -1;
    s -= Math.max(0, o.lv - +ans.lv) * 2.5;
    return s;
  }
  function best(group, ans, n) {
    return Object.keys(OP).filter(function (k) { return OP[k].side === group; })
      .sort(function (x, y) { return score(OP[y], ans) - score(OP[x], ans); }).slice(0, n);
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function go() {
    var box = document.getElementById("oq");
    if (!box) return;
    var i = 0, ans = {};
    function card(slug, label, top) {
      var o = OP[slug], f = FEN[slug], flip = o.side !== "w";
      return '<a class="oq-card' + (top ? " top" : "") + '" href="/openings/' + slug + '/">' +
        '<div class="mini-board" data-fen="' + f[0] + '" data-hl="' + f[1] + '" data-flip="' + (flip ? 1 : 0) + '" aria-hidden="true"></div>' +
        '<div><span class="oq-label">' + label + "</span><h3>" + esc(o.n) + "</h3><p>" + esc(o.why) + '</p><span class="oq-go">Start the lesson \u2192</span></div></a>';
    }
    function result() {
      var html = '<div class="oq-result"><p class="oq-h">Your openings</p>';
      if (ans.side === "w" || ans.side === "both") {
        var w = best("w", ans, 2);
        html += card(w[0], ans.side === "both" ? "With White" : "Best match", true) + card(w[1], "Also try", false);
      }
      if (ans.side === "b" || ans.side === "both") {
        var e = best("e4", ans, 2), d = best("d4", ans, 1);
        html += card(e[0], "Against 1.e4", true) + card(d[0], "Against 1.d4", true) + (ans.side === "b" ? card(e[1], "Also try vs 1.e4", false) : "");
      }
      html += '<div class="oq-again"><button type="button" class="btn ghost" id="oq-restart">\u21ba Take the quiz again</button> <a class="btn" href="/openings/">See all openings</a></div></div>';
      box.innerHTML = html;
      if (window.CEDrawBoards) window.CEDrawBoards();
      box.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    function render() {
      if (i >= QS.length) return result();
      var q = QS[i];
      box.innerHTML = '<div class="oq-q"><div class="lq-top"><span>Question ' + (i + 1) + " of " + QS.length + "</span>" +
        (i ? '<button type="button" class="oq-back">\u2190 Back</button>' : "") + '</div><div class="lq-bar"><i style="width:' + (i / QS.length * 100) + '%"></i></div>' +
        '<p class="oq-text">' + q.q + '</p><div class="oq-opts">' +
        q.o.map(function (o) { return '<button type="button" class="oq-opt" data-v="' + o[0] + '">' + o[1] + "</button>"; }).join("") + "</div></div>";
    }
    box.addEventListener("click", function (e) {
      var b = e.target.closest(".oq-opt");
      if (b) { ans[QS[i].k] = b.getAttribute("data-v"); i++; render(); return; }
      if (e.target.closest(".oq-back")) { i = Math.max(0, i - 1); render(); return; }
      if (e.target.closest("#oq-restart")) { i = 0; ans = {}; render(); }
    });
    render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
})();
