// Links the new trap pages into the rest of the site. Safe to re-run (skips work already done).
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const pages = require('./pages');
const SITE = '/home/claude/castleearly';
const TODAY = '2026-10-30';
const rd = f => fs.readFileSync(path.join(SITE, f), 'utf8');
const wr = (f, s) => fs.writeFileSync(path.join(SITE, f), s);
function must(s, a, msg) { if (!s.includes(a)) throw new Error('Not found (' + msg + '): ' + a.slice(0, 80)); }

const libCards = {
  'scholars-mate': { href: '/openings/scholars-mate/', line: 'e4 e5 Bc4 Nc6 Qh5 Nf6 Qxf7#', flip: 0, tag: 'Trap', tagCls: '', title: "Scholar's Mate", text: '1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? 4.Qxf7#. The 4-move mate, and how to stop it.' },
  'fools-mate': { href: '/openings/fools-mate/', line: 'f3 e5 g4 Qh4#', flip: 0, tag: 'Trap', tagCls: '', title: "Fool's Mate", text: '1.f3 e5 2.g4?? Qh4#. The fastest checkmate in chess.' },
  'englund-gambit': { href: '/openings/englund-gambit/', line: 'd4 e5', flip: 1, tag: 'vs 1.d4', tagCls: 'black', title: 'Englund Gambit', text: '1.d4 e5. A trappy gambit for Black that ends in ...Qc1#.' },
  'stafford-gambit': { href: '/openings/stafford-gambit/', line: 'e4 e5 Nf3 Nf6 Nxe5 Nc6', flip: 1, tag: 'vs 1.e4', tagCls: 'black', title: 'Stafford Gambit', text: '1.e4 e5 2.Nf3 Nf6 3.Nxe5 Nc6. Wild traps against f2.' },
};

// 1. Openings library: new "Opening traps" section and updated counts.
let s = rd('openings/index.html');
if (!s.includes('id="traps"')) {
  const anchor = '</div>\n</main>';
  must(s, anchor, 'library end');
  const sec = `</div>\n<h2 id="traps">Opening traps and quick checkmates</h2>\n<p class="group-blurb">The traps beginners fall for most. Learn them so you can spot them in time, or set them yourself.</p>\n<div class="cards">\n${Object.values(libCards).map(L.card).join('\n')}\n</div>\n</main>`;
  s = s.replace(anchor, sec);
  s = s.replace(/A library of 18 chess openings for White and defenses for Black, each with an interactive board, plans, traps and a practice mode\./g,
    'A library of 18 chess openings for White and Black plus the most common opening traps, each with an interactive board, plans and a practice mode.');
  must(s, 'There are 18 openings in total, covering the most popular choices for both colors.', 'library intro');
  s = s.replace('There are 18 openings in total, covering the most popular choices for both colors.',
    'There are 18 openings covering the most popular choices for both colors, plus a section on <a href="#traps">opening traps</a> like Scholar\'s Mate and the Stafford Gambit.');
  wr('openings/index.html', s);
  console.log('library: added traps section');
}

// 2. Menu: "Opening traps" link in the Openings dropdown on every page.
const NAV_OLD = '<a href="/openings/#black-e4">Defenses for Black</a><a href="/openings/">All openings →</a>';
const NAV_NEW = '<a href="/openings/#black-e4">Defenses for Black</a><a href="/openings/#traps">Opening traps</a><a href="/openings/">All openings →</a>';
let navCount = 0;
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    if (f === '.git' || f === 'node_modules') continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) {
      const t = fs.readFileSync(p, 'utf8');
      if (t.includes(NAV_OLD)) { fs.writeFileSync(p, t.split(NAV_OLD).join(NAV_NEW)); navCount++; }
    }
  }
})(SITE);
console.log('menu: updated ' + navCount + ' pages');

// 3. "Keep learning" cards on related lessons (inserted before the last card).
const relatedAdds = {
  'openings/petrov-defense/index.html': 'stafford-gambit',
  'openings/italian-game/index.html': 'scholars-mate',
  'openings/fried-liver-attack/index.html': 'scholars-mate',
  'openings/london-system/index.html': 'englund-gambit',
  'openings/queens-gambit-declined/index.html': 'englund-gambit',
  'openings/queens-gambit/index.html': 'englund-gambit',
};
for (const [f, slug] of Object.entries(relatedAdds)) {
  let t = rd(f);
  if (t.includes(`href="/openings/${slug}/"`)) continue;
  const i = t.indexOf('<h2>Keep learning</h2>');
  const end = t.indexOf('<a class="card" href="/openings/">', i);
  if (i < 0 || end < 0) { console.log('  skip ' + f); continue; }
  t = t.slice(0, end) + L.card(libCards[slug]) + '\n' + t.slice(end);
  // Also add it to the sidebar "Practice next" list.
  t = t.replace('<a href="/">♟ Play the computer</a>', `<a href="/openings/${slug}/">${L.esc(libCards[slug].title)}</a><a href="/">♟ Play the computer</a>`);
  wr(f, t); console.log('related: ' + f + ' -> ' + slug);
}

// 4. Homepage and beginners page counts.
s = rd('index.html');
s = s.replace('<p>18 openings for White and Black, from the Italian Game to the Fried Liver Attack, with plans, traps and a practice mode.</p>',
  '<p>18 openings for White and Black, from the Italian Game to the Fried Liver Attack, plus the classic opening traps, with plans and a practice mode.</p>');
wr('index.html', s);

// 5. Sitemap.
s = rd('sitemap.xml');
for (const p of pages) {
  const loc = `https://castleearly.com/openings/${p.slug}/`;
  if (!s.includes(loc)) s = s.replace('</urlset>', `  <url><loc>${loc}</loc><lastmod>${TODAY}</lastmod></url>\n</urlset>`);
}
s = s.replace(/(<loc>https:\/\/castleearly\.com\/openings\/<\/loc><lastmod>)[^<]+/, `$1${TODAY}`);
wr('sitemap.xml', s);
console.log('sitemap: ' + (s.match(/<url>/g) || []).length + ' urls');

// 6. Site search index.
s = rd('assets/search-index.js');
const m = s.match(/^([\s\S]*?window\.CE_SEARCH=)(\[[\s\S]*\]);?\s*$/);
const idx = JSON.parse(m[2]);
const extra = { 'scholars-mate': 'scholars mate 4 move checkmate four move checkmate quickest checkmate qxf7 f7 trap how to stop', 'fools-mate': 'fools mate 2 move checkmate fastest checkmate qh4 two move checkmate', 'englund-gambit': 'englund gambit 1.d4 e5 trap qc1 charlick', 'stafford-gambit': 'stafford gambit petrov trap bg4 eric rosen refute' };
for (const p of pages) {
  const u = `openings/${p.slug}/`;
  const html = rd(u + 'index.html');
  const heads = [...html.matchAll(/<h[123][^>]*>(.*?)<\/h[123]>/g)].map(x => L.strip(x[1])).join(' ');
  const faqs = p.faq.map(x => x[0]).join(' ');
  const e = { t: p.title, u, s: 'Openings', d: p.desc, k: `${heads} ${faqs} ${extra[p.slug]}` };
  const at = idx.findIndex(x => x.u === u);
  if (at >= 0) idx[at] = e; else idx.push(e);
}
fs.writeFileSync(path.join(SITE, 'assets/search-index.js'), m[1] + JSON.stringify(idx) + ';\n');
console.log('search: ' + idx.length + ' entries');

// 7. llms.txt (for AI assistants and answer engines).
s = rd('llms.txt');
if (!s.includes('## Opening traps')) {
  const sec = '## Opening traps\n' + pages.map(p => `- [${p.title}](https://castleearly.com/openings/${p.slug}/): ${p.desc}`).join('\n') + '\n\n## Tactics and endgames';
  must(s, '## Tactics and endgames', 'llms tactics');
  s = s.replace('## Tactics and endgames', sec);
  s = s.replace('learn the rules, 18 openings, 28 tactics', 'learn the rules, 18 openings, the classic opening traps, 28 tactics');
  s = s.replace('A library of 18 chess openings for White and defenses for Black, each with an interactive board, plans, traps and a practice mode.',
    'A library of 18 chess openings for White and Black plus the most common opening traps, each with an interactive board, plans and a practice mode.');
  wr('llms.txt', s);
  console.log('llms.txt: added traps');
}
