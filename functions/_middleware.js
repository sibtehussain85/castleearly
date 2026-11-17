// Google AdSense, switched on from the Cloudflare dashboard (no code changes needed).
//
// While the ADSENSE_ID variable is NOT set, this file does nothing: pages are served
// exactly as they are and /ads.txt returns 404.
//
// To turn ads on: Cloudflare dashboard -> Workers & Pages -> castleearly -> Settings ->
// Variables and secrets -> add ADSENSE_ID = your publisher ID (e.g. pub-1234567890123456
// or ca-pub-1234567890123456) for Production, then redeploy (Deployments -> Retry deployment).
// That adds the AdSense script to every page and serves /ads.txt automatically.

const ID_RE = /^(?:ca-)?pub-(\d{10,20})$/;

export async function onRequest(context) {
  const { request, env, next } = context;
  const match = ID_RE.exec(String(env.ADSENSE_ID || "").trim());
  if (!match) return next(); // ads off: change nothing

  const digits = match[1];
  const url = new URL(request.url);

  if (url.pathname === "/ads.txt") {
    return new Response(`google.com, pub-${digits}, DIRECT, f08c47fec0942fa0\n`, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
    });
  }

  const response = await next();
  if (request.method !== "GET" || url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/")) {
    return response;
  }
  const type = response.headers.get("Content-Type") || "";
  if (!type.includes("text/html")) return response;

  const tag =
    `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${digits}" ` +
    `crossorigin="anonymous"></script>`;
  return new HTMLRewriter()
    .on("head", { element(el) { el.append(tag, { html: true }); } })
    .transform(response);
}
