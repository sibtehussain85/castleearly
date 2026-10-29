/* CastleEarly private feedback inbox. The admin key is kept only in this browser. */
(function () {
  "use strict";
  var root = document.getElementById("adm");
  if (!root) return;
  var KEY = "ce-admin-key";
  var login = document.getElementById("adm-login");
  var box = document.getElementById("adm-box");
  var listEl = document.getElementById("adm-list");
  var countEl = document.getElementById("adm-count");
  var status = login.querySelector(".fb-status");
  var entries = [];
  var filter = "new";

  function getKey() { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } }
  function setKey(k) { try { if (k) localStorage.setItem(KEY, k); else localStorage.removeItem(KEY); } catch (e) {} }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function stars(n) { var s = ""; for (var i = 1; i <= 5; i++) s += i <= n ? "\u2605" : "\u2606"; return s; }

  function api(method, body) {
    return fetch("/api/admin", {
      method: method,
      headers: { "Content-Type": "application/json", "X-Admin-Key": getKey() },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) { return r.json().then(function (d) { d.status = r.status; return d; }); });
  }

  function load() {
    status.textContent = "Loading...";
    api("GET").then(function (d) {
      if (!d.ok) {
        status.textContent = d.error || "Couldn't open the inbox.";
        if (d.status === 401) setKey("");
        login.hidden = false; box.hidden = true;
        return;
      }
      status.textContent = "";
      login.hidden = true; box.hidden = false;
      entries = d.entries;
      render();
    }).catch(function () { status.textContent = "Network error. Try again."; });
  }

  function render() {
    var shown = entries.filter(function (e) {
      if (filter === "new") return e.status === "new";
      if (filter === "all") return true;
      return e.kind === filter;
    });
    var fresh = entries.filter(function (e) { return e.status === "new"; }).length;
    countEl.textContent = entries.length + " total \u00b7 " + fresh + " new";
    if (!shown.length) { listEl.innerHTML = '<p class="adm-empty">Nothing here.</p>'; return; }
    listEl.innerHTML = shown.map(function (e) {
      var isReview = e.kind === "review";
      var badge = isReview ? '<span class="adm-tag rv">Review ' + stars(e.rating) + "</span>" : '<span class="adm-tag pv">Private</span>';
      var st = '<span class="adm-st st-' + esc(e.status) + '">' + esc(e.status === "approved" ? "on website" : e.status) + "</span>";
      var btns = isReview
        ? (e.status === "approved"
          ? '<button type="button" data-a="hidden">Remove from site</button>'
          : '<button type="button" class="ok" data-a="approved">Publish on site</button>' + (e.status === "hidden" ? "" : '<button type="button" data-a="hidden">Don\'t publish</button>'))
        : (e.status === "new" ? '<button type="button" class="ok" data-a="read">Mark as read</button>' : "");
      btns += '<button type="button" class="del" data-a="delete">Delete</button>';
      var who = esc(e.name || "No name") + (e.email ? ' \u00b7 <a href="mailto:' + esc(e.email) + '">' + esc(e.email) + "</a>" : "");
      return '<article class="adm-item" data-id="' + e.id + '"><div class="adm-top">' + badge + st + '<span class="adm-date">' +
        esc(new Date(e.created).toLocaleString()) + '</span></div><p class="adm-msg">' + esc(e.message).replace(/\n/g, "<br>") +
        '</p><p class="adm-who">' + who + '</p><div class="adm-btns">' + btns + "</div></article>";
    }).join("");
  }

  listEl.addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-a]");
    if (!b) return;
    var item = b.closest(".adm-item");
    var id = Number(item.getAttribute("data-id"));
    var action = b.getAttribute("data-a");
    if (action === "delete" && !item.classList.contains("confirm")) {
      item.classList.add("confirm");
      b.textContent = "Click again to delete forever";
      return;
    }
    b.disabled = true;
    api("POST", { id: id, action: action }).then(function (d) {
      if (!d.ok) { b.disabled = false; b.textContent = d.error || "Failed"; return; }
      if (action === "delete") entries = entries.filter(function (e) { return e.id !== id; });
      else entries.forEach(function (e) { if (e.id === id) e.status = action; });
      render();
    });
  });

  root.querySelectorAll(".adm-tabs button").forEach(function (t) {
    t.addEventListener("click", function () {
      filter = t.getAttribute("data-f");
      root.querySelectorAll(".adm-tabs button").forEach(function (x) { x.classList.toggle("on", x === t); });
      render();
    });
  });

  login.addEventListener("submit", function (e) {
    e.preventDefault();
    setKey(login.elements.key.value.trim());
    login.elements.key.value = "";
    load();
  });
  document.getElementById("adm-out").addEventListener("click", function () {
    setKey(""); box.hidden = true; login.hidden = false; entries = []; listEl.innerHTML = "";
  });

  if (getKey()) load();
})();
