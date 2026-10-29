/* CastleEarly feedback page: send a review or private feedback, and show approved reviews. */
(function () {
  "use strict";
  var form = document.getElementById("fb-form");
  if (!form) return;
  var started = Date.now();
  var status = form.querySelector(".fb-status");
  var btn = form.querySelector("button[type=submit]");
  var msgLabel = document.getElementById("fb-msg-label");
  var msg = form.elements.message;

  function kind() { return form.querySelector("input[name=kind]:checked").value; }

  function sync() {
    var k = kind();
    form.querySelectorAll("[data-for]").forEach(function (el) { el.hidden = el.getAttribute("data-for") !== k; });
    msgLabel.textContent = k === "review" ? "Your review" : "Your message";
    msg.placeholder = k === "review" ? "What did you like? What could be better?" : "A mistake you spotted, an opening you'd like next, an idea...";
    btn.textContent = k === "review" ? "Send review" : "Send privately";
    form.querySelectorAll(".fb-opt").forEach(function (o) { o.classList.toggle("on", o.querySelector("input").checked); });
  }
  form.querySelectorAll("input[name=kind]").forEach(function (r) { r.addEventListener("change", sync); });
  if (location.hash === "#private") { form.querySelector("input[value=feedback]").checked = true; }
  sync();

  function say(text, bad) {
    status.textContent = text;
    status.className = "fb-status" + (bad ? " bad" : " good");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var k = kind();
    var rating = form.querySelector("input[name=rating]:checked");
    var text = msg.value.trim();
    if (k === "review" && !rating) { say("Please choose a star rating.", true); return; }
    if (text.length < 10) { say("Please write at least a few words.", true); msg.focus(); return; }
    btn.disabled = true;
    say("Sending...");
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: k,
        rating: rating ? Number(rating.value) : null,
        name: form.elements.name.value,
        email: k === "feedback" ? form.elements.email.value : "",
        message: text,
        website: form.elements.website.value,
        elapsed: Date.now() - started
      })
    }).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: "Something went wrong. Please try again." }; });
    }).then(function (d) {
      btn.disabled = false;
      if (!d.ok) { say(d.error || "Something went wrong. Please try again.", true); return; }
      form.reset();
      form.querySelector("input[value=" + k + "]").checked = true;
      sync();
      say(k === "review" ? "Thank you! Your review will appear here once I've read it." : "Thank you! Your feedback was sent privately.");
    }).catch(function () {
      btn.disabled = false;
      say("Couldn't send. Check your connection, or email hello@castleearly.com.", true);
    });
  });

  // ---- approved reviews ----
  var list = document.getElementById("fb-list");
  var summary = document.getElementById("fb-summary");
  function stars(n) {
    var s = "";
    for (var i = 1; i <= 5; i++) s += i <= n ? "\u2605" : "\u2606";
    return s;
  }
  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function niceDate(iso) {
    try { return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); } catch (e) { return iso; }
  }
  fetch("/api/reviews").then(function (r) { return r.json(); }).then(function (d) {
    if (!d.count) {
      summary.textContent = "No reviews yet. Be the first to leave one!";
      return;
    }
    summary.innerHTML = '<span class="fb-avg" aria-hidden="true">' + stars(Math.round(d.average)) + "</span> <strong>" + d.average.toFixed(1) +
      "</strong> out of 5 from " + d.count + (d.count === 1 ? " review" : " reviews");
    list.innerHTML = d.reviews.map(function (r) {
      return '<figure class="fb-card"><div class="fb-card-top"><span class="fb-stars-s" aria-label="' + r.rating + ' out of 5 stars">' + stars(r.rating) +
        '</span><span class="fb-date">' + esc(niceDate(r.date)) + "</span></div><blockquote>" + esc(r.message).replace(/\n/g, "<br>") +
        "</blockquote><figcaption>" + esc(r.name) + "</figcaption></figure>";
    }).join("");
  }).catch(function () {
    summary.textContent = "Reviews couldn't be loaded right now.";
  });
})();
