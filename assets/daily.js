/* Daily puzzle streak and "share your result" (kept in this browser only). Plain ASCII. */
(function () {
  "use strict";
  var KEY = "ce-daily";
  function get() { try { return JSON.parse(localStorage.getItem(KEY) || "null") || {}; } catch (e) { return {}; } }
  function put(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }

  function go() {
    var board = document.getElementById("daily-board"), box = document.getElementById("daily-box");
    if (!board || !box) return;
    var day = +board.getAttribute("data-day"), no = +board.getAttribute("data-no");
    if (!day) return;
    var s = get();
    // a streak survives until a full day is missed
    var alive = s.last === day || s.last === day - 1;
    var streak = alive ? (s.streak || 0) : 0;

    function render(justSolved, tries) {
      var solvedToday = s.last === day;
      var html = '<div class="daily-streak"><span class="fire" aria-hidden="true">\ud83d\udd25</span><span><strong>' + streak +
        "-day streak</strong>" + (s.best > streak ? " \u00b7 best " + s.best : "") + "</span></div>";
      if (solvedToday) {
        html += '<p class="daily-done">\u2705 Solved today' + (s.tries === 0 ? " on the first try" : "") + ". Come back tomorrow for puzzle #" + (no + 1) + ".</p>" +
          '<button type="button" class="btn daily-share">Share my result</button><span class="daily-copied" role="status"></span>';
      } else {
        html += '<p class="daily-done">' + (streak ? "Solve today's puzzle to keep your streak going." : "Solve today's puzzle to start a streak.") + "</p>";
      }
      box.innerHTML = html;
      if (justSolved) box.classList.add("pop");
    }

    function shareText() {
      var mark = s.tries === 0 ? "\u2705 first try" : "\u2705 in " + (s.tries + 1) + " tries";
      return "CastleEarly daily puzzle #" + no + " " + mark + " \ud83d\udd25" + streak + "\nhttps://castleearly.com/";
    }

    board.addEventListener("ce-solved", function (e) {
      if (s.last === day) return; // already counted today
      var tries = (e.detail && e.detail.mistakes) || 0;
      streak = (s.last === day - 1 ? (s.streak || 0) : 0) + 1;
      s = { last: day, streak: streak, best: Math.max(s.best || 0, streak), tries: tries, total: (s.total || 0) + 1 };
      put(s);
      render(true, tries);
    });

    box.addEventListener("click", function (e) {
      if (!e.target.closest(".daily-share")) return;
      var text = shareText(), note = box.querySelector(".daily-copied");
      if (navigator.share) {
        navigator.share({ text: text }).catch(function () {});
        return;
      }
      var done = function () { if (note) note.textContent = "Copied! Paste it anywhere."; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { if (note) note.textContent = text; });
      else if (note) note.textContent = text;
    });

    render(false);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
})();
