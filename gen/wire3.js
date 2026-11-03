// Links the En passant page (Nov 3, 2026) into the site. Safe to re-run.
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const pages = require('./pages3');
const SITE = '/home/claude/castleearly';
const TODAY = '2026-11-03';
const rd = f => fs.readFileSync(path.join(SITE, f), 'utf8');
const wr = (f, s) => fs.writeFileSync(path.join(SITE, f), s);

// 1. Learn menu on every page.
const OLD = '<a href="/learn/zugzwang/">Zugzwang</a></div>';
const NEW = '<a href="/learn/zugzwang/">Zugzwang</a><a href="/learn/en-passant/">En passant</a></div>';
let n = 0;
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    if (f === '.git') continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) { const t = fs.readFileSync(p, 'utf8'); if (t.includes(OLD) && !t.includes('/learn/en-passant/">En passant</a></div>')) { fs.writeFileSync(p, t.split(OLD).join(NEW)); n++; } }
  }
})(SITE);
console.log('menu: ' + n + ' pages');

// 2. In-text links: special moves lesson, tactics puzzle, Learn hub card.
let s = rd('learn/special-moves/index.html');
const SM = '<p>You must do it <strong>immediately</strong>, on the very next move, or the chance is gone.</p>';
if (!s.includes('Full guide to en passant')) {
  if (!s.includes(SM)) throw new Error('special-moves anchor not found');
  s = s.replace(SM, SM.replace('</p>', ' <a href="/learn/en-passant/">Full guide to en passant →</a></p>'));
  wr('learn/special-moves/index.html', s); console.log('special-moves: linked');
}
s = rd('tactics/index.html');
if (!s.includes('Learn more about en passant')) {
  const i = s.indexOf('id="en-passant"');
  const j = s.indexOf('</p>', i);
  if (i > 0 && j > 0) { s = s.slice(0, j) + ' <a href="/learn/en-passant/">Learn more about en passant →</a>' + s.slice(j); wr('tactics/index.html', s); console.log('tactics: linked'); }
}
s = rd('learn/index.html');
const card = { href: '/learn/en-passant/', line: 'e4 e6 e5 d5', flip: 0, tag: 'Rules', tagCls: '', title: 'En passant', text: 'The special pawn capture, with examples and practice.' };
const ki = s.indexOf('<h2>Keep learning</h2>'), kc = s.indexOf('<div class="cards">', ki);
if (ki > 0 && !s.includes('class="card card-thumb" href="/learn/en-passant/"')) { s = s.slice(0, kc + 19) + '\n' + L.card(card) + s.slice(kc + 19); wr('learn/index.html', s); console.log('learn hub: card'); }

// 3. Sitemap.
s = rd('sitemap.xml');
for (const p of pages) { const loc = `https://castleearly.com/learn/${p.slug}/`; if (!s.includes(loc)) s = s.replace('</urlset>', `  <url><loc>${loc}</loc><lastmod>${TODAY}</lastmod></url>\n</urlset>`); }
for (const u of ['learn/', 'learn/special-moves/', 'tactics/']) s = s.replace(new RegExp(`(<loc>https://castleearly\\.com/${u.replace(/\//g, '\\/')}</loc><lastmod>)[^<]+`), `$1${TODAY}`);
wr('sitemap.xml', s); console.log('sitemap: ' + (s.match(/<url>/g) || []).length);

// 4. Search index.
s = rd('assets/search-index.js');
const m = s.match(/^([\s\S]*?window\.CE_SEARCH=)(\[[\s\S]*\]);?\s*$/);
const idx = JSON.parse(m[2]);
const extra = { 'en-passant': 'en passant enpassant en-passant e.p. in passing pawn capture special pawn move holy hell google en passant two squares' };
for (const p of pages) {
  const u = `learn/${p.slug}/`;
  const html = rd(u + 'index.html');
  const heads = [...html.matchAll(/<h[123][^>]*>(.*?)<\/h[123]>/g)].map(x => L.strip(x[1])).join(' ');
  const e = { t: p.title, u, s: 'Learn', d: p.desc, k: `${heads} ${p.faq.map(x => x[0]).join(' ')} ${extra[p.slug]}` };
  const at = idx.findIndex(x => x.u === u); if (at >= 0) idx[at] = e; else idx.push(e);
}
fs.writeFileSync(path.join(SITE, 'assets/search-index.js'), m[1] + JSON.stringify(idx) + ';\n');
console.log('search: ' + idx.length + ' entries');

// 5. llms.txt.
s = rd('llms.txt');
if (!s.includes('/learn/en-passant/')) {
  const add = pages.map(p => `- [${p.title}](https://castleearly.com/learn/${p.slug}/): ${p.desc}`).join('\n');
  s = s.replace(/(- \[Zugzwang in Chess[^\n]*\n)/, `$1${add}\n`);
  wr('llms.txt', s); console.log('llms: ' + (s.includes('/learn/en-passant/') ? 'added' : 'NOT ADDED'));
}
