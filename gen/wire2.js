// Links the Learn pages (Stalemate, Zugzwang) into the site. Safe to re-run.
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const pages = require('./pages2');
const SITE = '/home/claude/castleearly';
const TODAY = '2026-10-30';
const rd = f => fs.readFileSync(path.join(SITE, f), 'utf8');
const wr = (f, s) => fs.writeFileSync(path.join(SITE, f), s);

// 1. Learn menu: add both pages on every page.
const OLD = '<a href="/learn/chess-notation/">Chess notation</a></div>';
const NEW = '<a href="/learn/chess-notation/">Chess notation</a><a href="/learn/stalemate/">Stalemate</a><a href="/learn/zugzwang/">Zugzwang</a></div>';
let n = 0;
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    if (f === '.git') continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) { const t = fs.readFileSync(p, 'utf8'); if (t.includes(OLD) && !t.includes('/learn/stalemate/">Stalemate</a><a href="/learn/zugzwang/')) { fs.writeFileSync(p, t.split(OLD).join(NEW)); n++; } }
  }
})(SITE);
console.log('menu: ' + n + ' pages');

// 2. In-text links: the rules page's stalemate definitions and the zugzwang tactic.
let s = rd('learn/index.html');
s = s.replace('<li><strong>Stalemate:</strong> the player to move is <em>not</em> in check but has no legal moves. The game is a draw.</li>',
  '<li><strong>Stalemate:</strong> the player to move is <em>not</em> in check but has no legal moves. The game is a draw. <a href="/learn/stalemate/">More on stalemate →</a></li>');
const card = { href: '/learn/stalemate/', line: 'k7/8/2K5/8/8/8/8/1Q6 w - - 0 1|Qb6', flip: 0, tag: 'Rules', tagCls: '', title: 'Stalemate', text: 'No legal move and not in check: why it is a draw, and how to avoid it.' };
const ki = s.indexOf('<h2>Keep learning</h2>'), kc = s.indexOf('<div class="cards">', ki);
if (ki > 0 && !s.includes('class="card card-thumb" href="/learn/stalemate/"')) s = s.slice(0, kc + 19) + '\n' + L.card(card) + s.slice(kc + 19);
wr('learn/index.html', s);
s = rd('tactics/index.html');
if (!s.includes('Learn more about zugzwang')) {
  const i = s.indexOf('id="zugzwang"');
  const j = s.indexOf('</p>', i);
  if (i > 0 && j > 0) { s = s.slice(0, j) + ' <a href="/learn/zugzwang/">Learn more about zugzwang →</a>' + s.slice(j); wr('tactics/index.html', s); console.log('tactics: linked'); }
}

// 3. Sitemap.
s = rd('sitemap.xml');
for (const p of pages) { const loc = `https://castleearly.com/learn/${p.slug}/`; if (!s.includes(loc)) s = s.replace('</urlset>', `  <url><loc>${loc}</loc><lastmod>${TODAY}</lastmod></url>\n</urlset>`); }
s = s.replace(/(<loc>https:\/\/castleearly\.com\/learn\/<\/loc><lastmod>)[^<]+/, `$1${TODAY}`);
wr('sitemap.xml', s); console.log('sitemap: ' + (s.match(/<url>/g) || []).length);

// 4. Search index.
s = rd('assets/search-index.js');
const m = s.match(/^([\s\S]*?window\.CE_SEARCH=)(\[[\s\S]*\]);?\s*$/);
const idx = JSON.parse(m[2]);
const extra = { stalemate: 'stalemate draw no legal moves not in check stale mate king queen stalemate trap', zugzwang: 'zugzwang zugswang compulsion to move opposition trebuchet mutual zugzwang triangulation' };
for (const p of pages) {
  const u = `learn/${p.slug}/`;
  const html = rd(u + 'index.html');
  const heads = [...html.matchAll(/<h[123][^>]*>(.*?)<\/h[123]>/g)].map(x => L.strip(x[1])).join(' ');
  const e = { t: p.title, u, s: 'Learn', d: p.desc, k: `${heads} ${p.faq.map(x => x[0]).join(' ')} ${extra[p.slug]}` };
  const at = idx.findIndex(x => x.u === u); if (at >= 0) idx[at] = e; else idx.push(e);
}
fs.writeFileSync(path.join(SITE, 'assets/search-index.js'), m[1] + JSON.stringify(idx) + ';\n');

// 5. llms.txt.
s = rd('llms.txt');
if (!s.includes('/learn/stalemate/')) {
  const add = pages.map(p => `- [${p.title}](https://castleearly.com/learn/${p.slug}/): ${p.desc}`).join('\n');
  s = s.replace(/(- \[Chess Notation Explained[^\n]*\n)/, `$1${add}\n`);
  wr('llms.txt', s); console.log('llms: added');
}
