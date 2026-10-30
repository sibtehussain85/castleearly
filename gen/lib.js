// Page-building helpers that produce the same markup as the existing CastleEarly lessons.
const { line } = require('./chesslib');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const boardFen = fen => fen.split(' ')[0];

// Position after a SAN line, plus last-move squares.
function pos(lineStr) {
  if (!lineStr.trim()) return { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', hl: '' };
  const { steps } = line(lineStr);
  const l = steps[steps.length - 1];
  return { fen: l.fen, hl: l.from + ',' + l.to, steps };
}

// A clickable move that opens a pop-up board.
function mv(lineStr, label) {
  const p = pos(lineStr);
  return `<button type="button" class="mv" data-lx data-fen="${boardFen(p.fen)}" data-hl="${p.hl}" title="Show on the board">${esc(label)}</button>`;
}

// A paragraph or list item that drives the side board.
// opts: {tag, line, hl (override), arrows, cap, cls}
function story(opts, html) {
  const tag = opts.tag || 'p';
  const p = pos(opts.line);
  const hl = opts.hl !== undefined ? opts.hl : p.hl;
  const cls = (opts.cls ? opts.cls + ' ' : '') + 'story-el';
  return `<${tag} data-story data-fen="${boardFen(p.fen)}" data-hl="${hl}" data-arrows${opts.arrows ? `="${opts.arrows}"` : ''} data-cap="${esc(opts.cap)}" class="${cls}">${html}<button type="button" class="see" data-lx aria-label="Show this on a board">♟ See it</button></${tag}>`;
}

function quickCheck(q, options, answerIdx, why) {
  return `<div class="qc" data-lx data-answer="${answerIdx}"><p class="qc-h">❓ Quick check</p><p class="qc-q">${esc(q)}</p><div class="qc-opts">${options.map((o, i) => `<button type="button" class="qc-opt" data-i="${i}">${esc(o)}</button>`).join('')}</div><p class="qc-why" hidden>${esc(why)}</p></div>`;
}

// Step-through trainer. notes: one note per move.
function trainer({ title, orientation, practiceSide, intro, moves, notes }) {
  const { steps } = line(moves);
  if (notes.length !== steps.length) throw new Error(`Trainer "${title}": ${steps.length} moves but ${notes.length} notes`);
  const data = { title, orientation, practiceSide, intro, moves: steps.map((s, i) => ({ uci: s.uci, san: s.san, note: notes[i] })) };
  return `<div class="trainer">\n<script type="application/json">\n${JSON.stringify(data, null, 1)}</script>\n</div>`;
}

function ideas(list) {
  return `<section class="ideas" data-lx aria-label="Key ideas"><p class="ideas-h">Key ideas in 20 seconds</p><div class="idea-grid">${list.map(([ic, t, d]) => `<div class="idea"><span class="idea-ic" aria-hidden="true">${ic}</span><p><strong>${esc(t)}</strong>${d}</p></div>`).join('')}</div></section>`;
}

function keyFacts(rows) {
  return `<div class="key-facts">\n<dl>\n${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('\n')}\n</dl>\n</div>`;
}

function faqHtml(faq) {
  return `<h2 id="faq">Frequently asked questions</h2>\n<div class="faq">\n${faq.map(([q, a]) => `<details>\n<summary>${esc(q)}</summary>\n<p>${a}</p>\n</details>`).join('\n')}\n</div>`;
}

function card({ href, line: l, flip, tag, tagCls, title, text }) {
  const p = pos(l || '');
  return `<a class="card card-thumb" href="${href}"><div class="mini-board" data-fen="${boardFen(p.fen)}" data-hl="${p.hl}" data-flip="${flip ? 1 : 0}" aria-hidden="true"></div><span class="tag ${tagCls}">${esc(tag)}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></a>`;
}

const strip = h => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

module.exports = { esc, boardFen, pos, mv, story, quickCheck, trainer, ideas, keyFacts, faqHtml, card, strip };
