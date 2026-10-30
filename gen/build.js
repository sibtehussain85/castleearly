// Builds the new lesson pages into the site repo, using the Petrov page as the shell.
const fs = require('fs');
const { line, sf, uciToSan } = require('./chesslib');
const L = require('./lib');
const pages = require('./pages').concat(require('./pages2'));

const SITE = '/home/claude/castleearly';
const TODAY = '2026-10-30';
const shell = fs.readFileSync(SITE + '/openings/petrov-defense/index.html', 'utf8');
const headerEnd = shell.indexOf('<main');
const footerStart = shell.indexOf('<footer');
const HEADER = shell.slice(shell.indexOf('<body>'), headerEnd);
const FOOTER = shell.slice(footerStart);
const VER = shell.match(/\?v=([a-z0-9]+)/)[1];

// Quiz: wrong options are tempting moves from the page's pool, each checked by Stockfish
// to be at least 1.5 pawns worse than the answer. Falls back to the engine's own list.
const val = l => l.mate != null ? (l.mate > 0 ? 100000 - l.mate : -100000 - l.mate) : l.cp;
async function buildQuiz(p) {
  const qs = p.quiz.items.map(it => {
    const fen = L.pos(it.line).fen;
    const after = line(it.answer, fen).steps.slice(-1)[0];
    return { it, fen, after, moveNo: +fen.split(' ')[5] };
  });
  const evals = await sf(qs.map(q => q.fen), 14, 12);
  // Evaluate every pool move in one engine run.
  const poolJobs = [];
  qs.forEach((q, i) => (q.it.pool || []).forEach(san => {
    const r = line(san, q.fen).steps.slice(-1)[0];
    poolJobs.push({ i, san: r.san, fen: r.fen, mate: r.mate });
  }));
  const poolEvals = await sf(poolJobs.filter(j => !j.mate).map(j => j.fen), 14, 1);
  let k = 0;
  poolJobs.forEach(j => { if (j.mate) j.v = 100000; else { const l = poolEvals[k++].lines[0]; j.v = l ? -val(l) : 0; } });
  const out = [];
  qs.forEach((q, i) => {
    const lines = evals[i].lines.map(l => ({ san: uciToSan(q.fen, l.move), v: val(l) }));
    const ansSan = q.after.san;
    const ans = lines.find(l => l.san.replace(/[+#]/g, '') === ansSan.replace(/[+#]/g, ''));
    if (!ans) throw new Error(`${p.slug}: answer ${ansSan} not in engine top list at ${q.fen}: ${lines.map(l => l.san + ' ' + l.v).join(', ')}`);
    if (lines[0].v - ans.v > 60 && Math.abs(ans.v) < 90000) console.warn(`  note ${p.slug} q${i + 1}: answer ${ansSan} is ${lines[0].v - ans.v}cp below best ${lines[0].san}`);
    const pool = poolJobs.filter(j => j.i === i);
    const worse = v => ans.v - v >= 150 || (ans.v > 90000 && ans.v - v >= 1); // a slower mate is worse than a faster one
    let wrong = pool.filter(j => worse(j.v)).map(j => j.san);
    pool.filter(j => !worse(j.v)).forEach(j => console.log(`    rejected ${j.san} (${j.v}) - not clearly worse`));
    for (const l of lines) { if (wrong.length >= 2) break; if (l.san !== ans.san && !wrong.includes(l.san) && worse(l.v)) wrong.push(l.san); }
    wrong = wrong.slice(0, 2);
    if (wrong.length < 2) throw new Error(`${p.slug} q${i + 1}: not enough clearly worse options`);
    out.push({ fen: q.fen, answer: ansSan, note: q.it.note, from: q.after.from, to: q.after.to, wrong, moveNo: q.moveNo, black: p.quiz.side === 'b' });
    console.log(`  q${i + 1} ${ansSan} (${ans.v}) wrong: ${wrong.map(w => w + ' ' + ((pool.find(j => j.san === w) || lines.find(l => l.san === w)) || {}).v).join(', ')}`);
  });
  return Object.assign({ slug: p.slug, side: p.quiz.side, flip: p.quiz.flip }, p.quiz.ask ? { ask: p.quiz.ask } : {}, { questions: out });
}

function schema(p, url) {
  const article = {
    '@context': 'https://schema.org', '@type': 'Article', headline: p.ogTitle, description: p.desc,
    image: `https://castleearly.com/assets/og/${p.sec || 'openings'}-${p.slug}.jpg`,
    datePublished: TODAY, dateModified: TODAY,
    author: { '@type': 'Person', name: 'Hussain', url: 'https://castleearly.com/about/' },
    publisher: { '@type': 'Organization', name: 'CastleEarly', url: 'https://castleearly.com/' },
    mainEntityOfPage: url,
  };
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://castleearly.com/' },
    { '@type': 'ListItem', position: 2, name: p.sec === 'learn' ? 'Learn' : 'Openings', item: `https://castleearly.com/${p.sec || 'openings'}/` },
    { '@type': 'ListItem', position: 3, name: p.name, item: url },
  ] };
  const faq = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: L.strip(a) } })) };
  return { main: JSON.stringify([article, crumbs], null, 2), faq: JSON.stringify(faq, null, 1) };
}

async function buildPage(p) {
  console.log('Building ' + p.slug);
  const url = `https://castleearly.com/${p.sec || 'openings'}/${p.slug}/`;
  const sc = schema(p, url);
  const head = `<!DOCTYPE html>

<html lang="en" data-default-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${L.esc(p.title)} | CastleEarly</title>
<meta name="description" content="${L.esc(p.desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:title" content="${L.esc(p.ogTitle)}">
<meta property="og:description" content="${L.esc(p.desc)}">
<meta property="og:url" content="${url}">
<meta name="theme-color" content="#2f5d50">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/style.css?v=${VER}">
<script id="ce-theme-init">(function(){var d=document.documentElement,t=null;try{t=localStorage.getItem("ce-theme")}catch(e){}d.setAttribute("data-theme",t||d.getAttribute("data-default-theme")||"dark")})();</script>
<!-- After AdSense approval, paste the AdSense <script> tag here -->
<script type="application/ld+json">
${sc.main}
</script>
<!-- seo:start -->
<link rel="icon" href="/assets/favicon-48.png" sizes="48x48" type="image/png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta property="og:site_name" content="CastleEarly">
<meta property="og:locale" content="en_US">
<meta property="og:image" content="https://castleearly.com/assets/og/${p.sec || 'openings'}-${p.slug}.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${L.esc(p.title)} – CastleEarly">
<meta name="twitter:card" content="summary_large_image">
<meta name="author" content="Hussain">
<meta property="article:published_time" content="${TODAY}">
<meta property="article:modified_time" content="${TODAY}">
<script type="application/ld+json">
${sc.faq}
</script>
<!-- seo:end -->
</head>
`;
  const hp = L.pos(p.hero.line);
  const hero = `<main class="wrap has-hero"><div class="page-hero has-board"><div class="page-hero-in"><div class="ph-text"><nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/${p.sec || 'openings'}/">${p.sec === 'learn' ? 'Learn' : 'Openings'}</a> › ${L.esc(p.name)}</nav><p class="eyebrow">${L.esc(p.eyebrow)}</p><h1>${L.esc(p.h1)}</h1><div class="meta-row"><span>By <a href="/about/">Hussain</a></span><span>Updated October 30, 2026</span><span>${p.readMin} min read</span></div><p>${L.esc(p.intro)}</p></div><figure class="ph-board"><div class="mini-board" data-fen="${L.boardFen(hp.fen)}" data-hl="${hp.hl}" data-flip="${p.hero.flip}" aria-hidden="true"></div><figcaption>${L.esc(p.hero.cap)}</figcaption></figure></div></div>`;

  // Body blocks: strings are prose (the first one sits directly under the head like the shell does), objects are trainers.
  let body = `<article><div class="with-side"><div class="art-main">\n<div class="article-head prose" data-head="1">\n${p.head()}\n</div>\n`;
  const blocks = p.body();
  let first = true, adDone = false;
  for (const b of blocks) {
    if (typeof b === 'string') {
      body += first ? b + '\n' : `<div class="prose">\n${b}\n</div>\n`;
    } else {
      body += L.trainer(b.trainer) + '\n';
      if (!adDone) { body += '<!-- AD SLOT (after first board) — add after AdSense approval -->\n'; adDone = true; }
    }
    first = false;
  }
  const quiz = await buildQuiz(p);
  const who = p.quiz.side === 'b' ? 'Black' : 'White';
  body += `<div class="prose">\n${L.faqHtml(p.faq)}\n<section class="lq" id="test-yourself" data-lx data-slug="${p.slug}"><div class="prose"><h2>Test yourself</h2><p>${quiz.questions.length} positions from this lesson. Play ${who}: can you find the move?</p></div><div class="lq-box"><script type="application/json">${JSON.stringify(quiz)}</script><noscript><p>Turn on JavaScript to take the quiz.</p></noscript></div><div class="lq-done"><button type="button" class="btn ghost lq-mark" data-slug="${p.slug}">✓ Mark this lesson as learned</button></div></section><h2>Keep learning</h2>\n<div class="cards">\n${p.related.map(L.card).join('\n')}\n${p.sec === 'learn' ? '<a class="card" href="/learn/"><span class="tag">Rules</span><h3>How to play chess</h3><p>Every rule explained, step by step.</p></a>' : '<a class="card" href="/openings/#traps"><span class="tag">All traps</span><h3>Opening traps</h3><p>Every trap and quick checkmate on CastleEarly.</p></a>'}\n</div>\n</div>\n</div>`;

  // Sidebar: first story element drives the initial board; table of contents from h2 ids.
  const firstStory = body.match(/data-story data-fen="([^"]+)" data-hl="([^"]*)" data-arrows(?:="([^"]*)")? data-cap="([^"]*)"/);
  const toc = [...body.matchAll(/<h2 id="([^"]+)">(.*?)<\/h2>/g)].map(m => `<a href="#${m[1]}">${m[2]}</a>`).join('') + '<a href="#test-yourself" data-lx>Test yourself</a>';
  const side = `<aside class="art-side" aria-label="On this page and related"><div class="side-card story-card" data-lx aria-live="polite"><p class="side-h">On the board</p><div class="story-board" data-fen="${firstStory[1]}" data-hl="${firstStory[2]}" data-arrows="${firstStory[3] || ''}" data-flip="${p.flip}"></div><p class="story-cap">${firstStory[4]}</p></div><nav class="side-card side-toc" aria-label="On this page"><p class="side-h">On this page</p>${toc}</nav><div class="side-card side-links"><p class="side-h">Practice next</p>${p.related.map(r => `<a href="${r.href}">${L.esc(r.title)}</a>`).join('')}<a href="/">♟ Play the computer</a><a href="/analysis/">📈 Analyze your games</a><a href="/tactics/">⚡ Tactics puzzles</a></div><!-- AD SLOT (sidebar, desktop only) — add after AdSense approval --></aside></div></article>\n</main>\n`;

  const html = head + HEADER + hero + '\n' + body + side + FOOTER;
  const dir = `${SITE}/${p.sec || 'openings'}/${p.slug}`;
  let out = html;
  if (p.sec === 'learn') out = out.replace('<a href="/openings/" aria-current="page">Openings', '<a href="/openings/">Openings').replace('<div class="nav-dd"><a href="/learn/">Learn', '<div class="nav-dd"><a href="/learn/" aria-current="page">Learn');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/index.html`, out);
  console.log(`  wrote ${html.length} bytes`);
}

(async () => {
  const only = process.argv[2];
  for (const p of pages) if (!only || p.slug === only) await buildPage(p);
})().catch(e => { console.error('BUILD FAILED: ' + e.message); process.exit(1); });
