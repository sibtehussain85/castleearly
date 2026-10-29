// Shared helpers for the feedback / reviews API (Cloudflare Pages Functions + D1).
// Needs a D1 database bound as "DB" and, for the admin page, a secret variable "ADMIN_KEY".

export const KINDS = ["review", "feedback"];

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

let ready = false;
export async function db(env) {
  if (!env.DB) throw new Error("Database is not connected yet.");
  if (!ready) {
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kind TEXT NOT NULL,
        name TEXT,
        email TEXT,
        rating INTEGER,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        created TEXT NOT NULL,
        ip TEXT
      )`
    ).run();
    await env.DB.prepare("CREATE INDEX IF NOT EXISTS entries_kind_status ON entries (kind, status, created)").run();
    ready = true;
  }
  return env.DB;
}

export async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Compares hashes so the check takes the same time whatever the key is.
export async function isAdmin(request, env) {
  const key = request.headers.get("X-Admin-Key") || "";
  if (!env.ADMIN_KEY || !key) return false;
  const [a, b] = await Promise.all([sha256(key), sha256(env.ADMIN_KEY)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function clean(s, max) {
  return String(s == null ? "" : s)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, max);
}
