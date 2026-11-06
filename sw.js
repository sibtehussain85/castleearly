/* CastleEarly service worker: lets the site install as an app and open faster.
   Pages: network first (always fresh), saved copy only when offline.
   /assets/: files carry ?v=<version>, so a saved copy is safe to reuse. Never touches /api/ or /admin/. */
var CACHE = "ce-v1";
self.addEventListener("install", function (e) { self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (/^\/(api|admin)\//.test(url.pathname)) return;
  if (url.pathname.indexOf("/assets/") === 0) {
    if (url.pathname.indexOf("/assets/stockfish/") === 0) return; // big engine files: browser cache handles them
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) { if (res.ok && url.search) c.put(req, res.clone()); return res; });
      });
    }));
    return;
  }
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return caches.match(req).then(function (hit) { return hit || caches.match("/"); }); }));
  }
});
