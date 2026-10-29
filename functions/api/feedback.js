// POST /api/feedback — saves a review (shown on the site only after approval) or private feedback.
import { KINDS, json, db, sha256, clean } from "../_shared.js";

const PER_HOUR = 5;

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: "Something went wrong. Please try again." }, 400);
  }

  // Spam traps: a hidden field people never fill in, and a form sent impossibly fast.
  if (body.website || (Number(body.elapsed) > 0 && Number(body.elapsed) < 2500)) {
    return json({ ok: true });
  }

  const kind = KINDS.includes(body.kind) ? body.kind : null;
  const message = clean(body.message, 1500);
  const name = clean(body.name, 60);
  const email = clean(body.email, 120);
  const rating = kind === "review" ? Math.round(Number(body.rating)) : null;

  if (!kind) return json({ ok: false, error: "Please choose review or private feedback." }, 400);
  if (message.length < 10) return json({ ok: false, error: "Please write at least a few words (10+ characters)." }, 400);
  if (kind === "review" && !(rating >= 1 && rating <= 5)) return json({ ok: false, error: "Please choose a star rating." }, 400);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: "That email address doesn't look right." }, 400);

  let D;
  try {
    D = await db(env);
  } catch (e) {
    return json({ ok: false, error: "Feedback isn't available right now. Please email hello@castleearly.com instead." }, 503);
  }

  const ip = await sha256((request.headers.get("CF-Connecting-IP") || "unknown") + "|castleearly");
  const since = new Date(Date.now() - 3600 * 1000).toISOString();
  const recent = await D.prepare("SELECT COUNT(*) AS n FROM entries WHERE ip = ? AND created > ?").bind(ip.slice(0, 32), since).first();
  if (recent && recent.n >= PER_HOUR) {
    return json({ ok: false, error: "Thanks! You've sent a few messages already. Please try again in an hour." }, 429);
  }

  await D.prepare("INSERT INTO entries (kind, name, email, rating, message, status, created, ip) VALUES (?, ?, ?, ?, ?, 'new', ?, ?)")
    .bind(kind, name || null, kind === "feedback" ? email || null : null, rating, message, new Date().toISOString(), ip.slice(0, 32))
    .run();

  return json({ ok: true });
}

export async function onRequest() {
  return json({ ok: false, error: "Method not allowed" }, 405, { Allow: "POST" });
}
