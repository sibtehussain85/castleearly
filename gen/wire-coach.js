// Nov 6, 2026: adds "Play <opening> against the Coach" to every opening/trap lesson,
// and loads coach.js on the tactics page and home page (puzzle explanations).
// The coach's opening book = the page's own trainer lines (from the start position).
// Safe to re-run: pages that already have the coach get their book refreshed.
// Usage: node wire-coach.js [slug ...]
const fs = require('fs');
const path = require('path');
const SITE = '/home/claude/castleearly';
const SKIP = new Set(['best-chess-openings-for-beginners', 'which-opening-suits-you']);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const today = '2026-11-06';

function pages(only) {
  const dir = path.join(SITE, 'openings');
  return fs.readdirSync(dir).filter(d => fs.existsSync(path.join(dir, d, 'index.html')) && !SKIP.has(d) && (!only.length || only.includes(d)));
}

function bookFrom(html) {
  const lines = [];
  // trainers are left as JSON in the HTML source (board.js reads them on load)
  const re = /<div class="trainer">\s*<script type="application\/json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    let d; try { d = JSON.parse(m[1]); } catch (e) { continue; }
    if (d.fen) continue; // custom start position: not an opening line
    const side = (d.practiceSide || d.orientation || 'white') === 'black' ? 'b' : 'w';
    lines.push({ side, moves: d.moves.map(x => [x.uci, x.san, x.note || '']) });
  }
  return lines;
}

function nameOf(html) {
  const bc = html.match(/"position": 3,\s*"name": "([^"]+)"/);
  if (bc) return bc[1];
  return (html.match(/<h1[^>]*>([^<:]+)/) || [, 'this opening'])[1].trim();
}

function section(slug, name, side, lines) {
  const label = /Mate$/.test(name) ? name : 'the ' + name;
  const Label = label[0].toUpperCase() + label.slice(1);
  const data = JSON.stringify({ lines }).replace(/</g, '\\u003c');
  return `<section class="coach-sec" id="coach" aria-labelledby="coach-h">
<div class="prose"><h2 id="coach-h">Play ${esc(label)} against the Coach</h2>
<p>Practice ${esc(label)} in a real game. The Coach plays the main lines from this page, then keeps going with Stockfish at your level. After every move it tells you what was good, what was a mistake, and why, in plain words.</p></div>
<div class="coach-card">
<div class="coach-intro"><p>Choose the Coach's strength (about 600 to 2200+) and your side. Every comment is checked by Stockfish, and <b>✨ Explain more</b> puts it in simpler words.</p><button type="button" class="btn coach-start" data-for="coach-${slug}">♟ Start a game vs the Coach</button></div>
<div class="coach" id="coach-${slug}" data-name="${esc(name)}" data-label="${esc(label)}" data-side="${side}" hidden><script type="application/json" class="coach-book">${data}</script></div>
<noscript><p>Turn on JavaScript to play the Coach.</p></noscript>
<p class="co-note">${esc(Label)} lines come from this lesson. The Coach runs Stockfish 19 in your browser, free.</p>
</div>
</section>
`;
}

const only = process.argv.slice(2);
let n = 0;
for (const slug of pages(only)) {
  const file = path.join(SITE, 'openings', slug, 'index.html');
  let h = fs.readFileSync(file, 'utf8');
  const lines = bookFrom(h);
  if (!lines.length) { console.log('skip (no lines):', slug); continue; }
  const name = nameOf(h);
  const side = lines[0].side;
  const sec = section(slug, name, side, lines);
  if (h.includes('id="coach"')) {
    h = h.replace(/<section class="coach-sec" id="coach"[\s\S]*?<\/section>\n/, sec);
  } else {
    const anchor = h.indexOf('<section class="lq" id="test-yourself"');
    const alt = h.indexOf('<h2>Keep learning</h2>');
    const at = anchor >= 0 ? anchor : alt;
    if (at < 0) { console.log('skip (no anchor):', slug); continue; }
    h = h.slice(0, at) + sec + h.slice(at);
    // table of contents + link under the top board
    h = h.replace(/(<nav class="side-card side-toc"[^>]*>[\s\S]*?)(<a href="#test-yourself")/, '$1<a href="#coach">Play vs the Coach</a>$2');
    h = h.replace('</section> <article>', `</section> <p class="coach-link"><a href="#coach">♟ Play this opening vs the Coach <small>Free · every move explained</small></a></p> <article>`);
    if (!h.includes('class="coach-link"')) h = h.replace(/(<section class="top-board" id="top-board"[\s\S]*?<\/section>)/, `$1\n<p class="coach-link"><a href="#coach">♟ Play this opening vs the Coach <small>Free · every move explained</small></a></p>`);
  }
  fs.writeFileSync(file, h);
  n++;
  console.log('ok', slug, '|', name, '| side', side, '| lines', lines.length, '| moves', lines.map(l => l.moves.length).join('+'));
}

// tactics + home: load coach.js after play.js (puzzle explanations)
for (const f of ['tactics/index.html', 'index.html']) {
  const file = path.join(SITE, f);
  let h = fs.readFileSync(file, 'utf8');
  if (h.includes('/assets/coach.js')) continue;
  h = h.replace(/(<script src="\/assets\/play\.js\?v=([0-9a-f]+)" defer><\/script>)/, '$1\n<script src="/assets/coach.js?v=$2" defer></script>');
  fs.writeFileSync(file, h);
  console.log('coach.js added to', f);
}

// sitemap dates
const sm = path.join(SITE, 'sitemap.xml');
let s = fs.readFileSync(sm, 'utf8');
for (const slug of pages(only)) s = s.replace(new RegExp(`(<loc>https://castleearly.com/openings/${slug}/</loc><lastmod>)[^<]+`), `$1${today}`);
s = s.replace(/(<loc>https:\/\/castleearly.com\/tactics\/<\/loc><lastmod>)[^<]+/, `$1${today}`);
fs.writeFileSync(sm, s);
console.log('pages:', n);
