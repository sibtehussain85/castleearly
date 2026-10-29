// GET /api/reviews — approved reviews for the public Feedback page.
import { json, db } from "../_shared.js";

export async function onRequestGet({ env }) {
  let D;
  try {
    D = await db(env);
  } catch (e) {
    return json({ reviews: [], count: 0, average: null });
  }
  const { results } = await D.prepare(
    "SELECT name, rating, message, created FROM entries WHERE kind = 'review' AND status = 'approved' ORDER BY created DESC LIMIT 100"
  ).all();
  const reviews = results.map((r) => ({ name: r.name || "A CastleEarly player", rating: r.rating, message: r.message, date: r.created.slice(0, 10) }));
  const count = reviews.length;
  const average = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : null;
  return json({ reviews, count, average }, 200, { "Cache-Control": "public, max-age=120" });
}
