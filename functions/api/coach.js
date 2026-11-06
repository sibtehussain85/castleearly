// POST /api/coach — "Explain more": turns Stockfish-checked facts into a short, friendly explanation.
// Needs a Workers AI binding named "AI" (Pages project > Settings > Bindings) and the D1 database "DB".
// Daily limits keep it inside Cloudflare's free Workers AI allowance.
import { json, sha256, clean } from "../_shared.js";

const PER_IP_DAY = 12;      // answers per visitor per day
const GLOBAL_DAY = 70;      // answers per day from the big model (free allowance is ~80)
const SMALL_DAY = 250;      // extra answers per day from the small model after that
const BIG = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const SMALL = "@cf/meta/llama-3.1-8b-instruct-fast";

let ready = false;
async function usageDb(env) {
  if (!env.DB) return null;
  if (!ready) {
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS coach_usage (day TEXT NOT NULL, who TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, who))").run();
    ready = true;
  }
  return env.DB;
}
async function bump(D, day, who) {
  await D.prepare("INSERT INTO coach_usage (day, who, n) VALUES (?, ?, 1) ON CONFLICT(day, who) DO UPDATE SET n = n + 1").bind(day, who).run();
}
async function count(D, day, who) {
  const r = await D.prepare("SELECT n FROM coach_usage WHERE day = ? AND who = ?").bind(day, who).first();
  return r ? r.n : 0;
}

function buildPrompt(b) {
  const f = (k, max = 400) => clean(b[k], max);
  const lines = [];
  if (b.kind === "move") {
    lines.push(`Opening being practised: ${f("opening", 60)}. The learner plays ${f("side", 10)} against a coach set to about ${Number(b.elo) || 1000} rating.`);
    lines.push(`Position before the move (FEN): ${f("fen", 100)}`);
    lines.push(`Learner's move: ${f("move", 12)} (engine verdict: ${f("label", 20)}).`);
    if (b.best) lines.push(`Engine's best move: ${f("best", 12)}. Best line: ${f("bestLine", 120)}`);
    if (b.reply) lines.push(`Engine's best reply after the learner's move: ${f("reply", 120)}`);
    if (b.book) lines.push(`Opening book note for this move: ${f("book", 300)}`);
    lines.push(`Checked explanation: ${f("facts", 700)}`);
  } else {
    lines.push(`Tactics puzzle. Goal: ${f("goal", 120)}. Position (FEN): ${f("fen", 100)}`);
    lines.push(`Learner's move: ${f("move", 12)}${b.kind === "puzzle-wrong" ? " (wrong)" : " (correct)"}.`);
    if (b.solution) lines.push(`The correct move: ${f("solution", 12)}.`);
    if (b.explain) lines.push(`Puzzle note: ${f("explain", 300)}`);
    lines.push(`Checked explanation: ${f("facts", 700)}`);
  }
  const q = clean(b.question, 160);
  return { facts: lines.join("\n"), question: q };
}

const SYSTEM = `You are CastleEarly's chess coach for beginners and club players (about 600-1500 rating).
Explain the given move in plain, friendly English in 3 to 5 short sentences.
Rules:
- Use ONLY the moves, lines and facts given. Never invent other moves, variations or piece positions.
- Explain the idea: what the move threatens or allows, and what to look for next time (a simple rule of thumb).
- Use standard algebraic notation exactly as written in the facts.
- If the learner asks a question that the facts can't answer, say so briefly and give the general principle instead.
- No headings, no lists, no emojis. Don't mention engines' numbers.`;

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, error: "Something went wrong." }, 400); }
  if (!body || !["move", "puzzle-wrong", "puzzle-solved"].includes(body.kind) || !clean(body.facts, 700)) {
    return json({ ok: false, error: "Nothing to explain yet." }, 400);
  }
  if (!env.AI) return json({ ok: false, error: "\"Explain more\" isn't switched on yet. The coach's notes above are still checked by Stockfish." }, 503);

  const day = new Date().toISOString().slice(0, 10);
  const ip = (await sha256((request.headers.get("CF-Connecting-IP") || "unknown") + "|coach")).slice(0, 24);
  let D = null;
  try { D = await usageDb(env); } catch (e) { D = null; }
  let model = BIG;
  if (D) {
    const [mine, all, small] = await Promise.all([count(D, day, ip), count(D, day, "*big"), count(D, day, "*small")]);
    if (mine >= PER_IP_DAY) return json({ ok: false, error: "You've used today's \"Explain more\" answers. They come back tomorrow. The notes above still explain every move." }, 429);
    if (all >= GLOBAL_DAY) {
      if (small >= SMALL_DAY) return json({ ok: false, error: "The coach is resting for today. Try \"Explain more\" again tomorrow." }, 429);
      model = SMALL;
    }
  }

  const { facts, question } = buildPrompt(body);
  const user = facts + "\n\n" + (question ? `The learner asks: "${question}"` : "Explain this move to the learner.");
  let text = "";
  try {
    const out = await env.AI.run(model, {
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: user }],
      max_tokens: 260,
      temperature: 0.3,
    });
    text = String((out && (out.response || (out.result && out.result.response))) || "").trim();
  } catch (e) {
    if (model === BIG) {
      try {
        model = SMALL;
        const out = await env.AI.run(SMALL, { messages: [{ role: "system", content: SYSTEM }, { role: "user", content: user }], max_tokens: 260, temperature: 0.3 });
        text = String((out && out.response) || "").trim();
      } catch (e2) { text = ""; }
    }
  }
  if (!text) return json({ ok: false, error: "The coach couldn't answer right now. Please try again in a minute." }, 502);
  if (D) {
    try { await Promise.all([bump(D, day, ip), bump(D, day, model === BIG ? "*big" : "*small")]); } catch (e) {}
  }
  return json({ ok: true, text: text.slice(0, 1200) });
}

export async function onRequest() {
  return json({ ok: false, error: "Method not allowed" }, 405, { Allow: "POST" });
}
