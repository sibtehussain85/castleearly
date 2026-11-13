// Links the Smothered mate page (Nov 13, 2026) into the site. Safe to re-run.
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const pages = require('./pages4');
const SITE = '/home/claude/castleearly';
const TODAY = '2026-11-13';
const rd = f => fs.readFileSync(path.join(SITE, f), 'utf8');
const wr = (f, s) => fs.writeFileSync(path.join(SITE, f), s);

// 1. Learn menu on every page.
const OLD = '<a href="/learn/en-passant/">En passant</a></div>';
const NEW = '<a href="/learn/en-passant/">En passant</a><a href="/learn/smothered-mate/">Smothered mate</a></div>';
let n = 0;
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    if (f === '.git') continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) { const t = fs.readFileSync(p, 'utf8'); if (t.includes(OLD)) { fs.writeFileSync(p, t.split(OLD).join(NEW)); n++; } }
  }
})(SITE);
console.log('menu: ' + n + ' pages');

// 2. In-text links: Learn hub card, Caro-Kann lesson, tactics page.
let s = rd('learn/index.html');
const card = { href: '/learn/smothered-mate/', line: '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1|Nf7#', flip: 0, tag: 'Checkmates', tagCls: '', title: 'Smothered mate', text: 'Checkmate with a single knight, plus three opening traps.' };
const ki = s.indexOf('<h2>Keep learning</h2>'), kc = s.indexOf('<div class="cards">', ki);
if (ki > 0 && !s.includes('class="card card-thumb" href="/learn/smothered-mate/"')) { s = s.slice(0, kc + 19) + '\n' + L.card(card) + s.slice(kc + 19); wr('learn/index.html', s); console.log('learn hub: card'); }

// 3. Sitemap.
s = rd('sitemap.xml');
for (const p of pages) { const loc = `https://castleearly.com/learn/${p.slug}/`; if (!s.includes(loc)) s = s.replace('</urlset>', `  <url><loc>${loc}</loc><lastmod>${TODAY}</lastmod></url>\n</urlset>`); }
for (const u of ['learn/']) s = s.replace(new RegExp(`(<loc>https://castleearly\\.com/${u.replace(/\//g, '\\/')}</loc><lastmod>)[^<]+`), `$1${TODAY}`);
wr('sitemap.xml', s); console.log('sitemap: ' + (s.match(/<url>/g) || []).length);

// 4. Search index.
s = rd('assets/search-index.js');
const m = s.match(/^([\s\S]*?window\.CE_SEARCH=)(\[[\s\S]*\]);?\s*$/);
const idx = JSON.parse(m[2]);
const extra = { 'smothered-mate': "smothered mate smother checkmate knight mate philidor's legacy philidors legacy lucena queen sacrifice Nf7 caro-kann trap Nd6 budapest gambit trap Nd3 blackburne shilling Nf3 checkmate patterns" };
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
if (!s.includes('/learn/smothered-mate/')) {
  const add = pages.map(p => `- [${p.title}](https://castleearly.com/learn/${p.slug}/): ${p.desc}`).join('\n');
  s = s.replace(/(- \[En Passant in Chess[^\n]*\n)/, `$1${add}\n`);
  wr('llms.txt', s); console.log('llms: ' + (s.includes('/learn/smothered-mate/') ? 'added' : 'NOT ADDED'));
}
