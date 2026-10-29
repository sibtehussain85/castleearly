// /api/admin — private: lists every entry and lets the owner approve, hide or delete them.
// Every request must carry the X-Admin-Key header matching the ADMIN_KEY secret set in Cloudflare.
import { json, db, isAdmin } from "../_shared.js";

export async function onRequest({ request, env }) {
  if (!env.ADMIN_KEY) return json({ ok: false, error: "ADMIN_KEY is not set in Cloudflare yet." }, 503);
  if (!(await isAdmin(request, env))) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return json({ ok: false, error: "Wrong admin key." }, 401);
  }
  let D;
  try {
    D = await db(env);
  } catch (e) {
    return json({ ok: false, error: "The database is not connected yet." }, 503);
  }

  if (request.method === "GET") {
    const { results } = await D.prepare(
      "SELECT id, kind, name, email, rating, message, status, created FROM entries ORDER BY created DESC LIMIT 500"
    ).all();
    return json({ ok: true, entries: results });
  }

  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return json({ ok: false, error: "Bad request" }, 400);
    }
    const id = Number(body.id);
    if (!Number.isInteger(id)) return json({ ok: false, error: "Bad id" }, 400);
    if (body.action === "delete") {
      await D.prepare("DELETE FROM entries WHERE id = ?").bind(id).run();
    } else if (["approved", "hidden", "read"].includes(body.action)) {
      await D.prepare("UPDATE entries SET status = ? WHERE id = ?").bind(body.action, id).run();
    } else {
      return json({ ok: false, error: "Unknown action" }, 400);
    }
    return json({ ok: true });
  }

  return json({ ok: false, error: "Method not allowed" }, 405);
}
