// Nov 6, 2026: SEO upgrade of /openings/english-opening/ (hand-built page, not in pages*.js).
// Page was position ~7 for "english opening" with 0 clicks: new title/description,
// variations table, a simple system for White, how Black should reply, more FAQs.
// Run once: node upgrade-english.js  (refuses to run twice)
const fs = require('fs');
const L = require('./lib');
const { mv, story, trainer, quickCheck, esc, strip } = L;
const FILE = '/home/claude/castleearly/openings/english-opening/index.html';
let h = fs.readFileSync(FILE, 'utf8');
if (h.includes('id="variations"')) { console.log('already done'); process.exit(0); }

const TITLE = 'English Opening (1.c4): Chess Moves, Plans and Variations';
const DESC = 'The English Opening in chess starts 1.c4. Learn the main lines, a simple setup for White and how Black should reply, step by step on a free interactive board.';
const OG = 'English Opening in Chess: Main Lines on a Free Practice Board';

const rep = (a, b) => { if (!h.includes(a)) throw new Error('missing: ' + a.slice(0, 80)); h = h.replace(a, b); };
const repRe = (re, b) => { if (!re.test(h)) throw new Error('missing: ' + re); h = h.replace(re, b); };

repRe(/<title>[^<]*<\/title>/, `<title>${esc(TITLE)} | CastleEarly</title>`);
repRe(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(DESC)}">`);
repRe(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(OG)}">`);
repRe(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(DESC)}">`);
repRe(/<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${esc(TITLE)} – CastleEarly">`);
repRe(/"headline": "[^"]*"/, `"headline": "${OG}"`);
repRe(/("@type": "Article",[\s\S]*?"description": )"[^"]*"/, `$1"${DESC}"`);
rep('"dateModified": "2026-10-29"', '"dateModified": "2026-11-06"');
repRe(/<h1>[^<]*<\/h1>/, '<h1>English Opening (1.c4): moves, plans and variations</h1>');
rep('Updated October 29, 2026', 'Updated November 6, 2026');
rep('7 min read', '11 min read');

// ---------- new sections ----------
const variations = `
<h2 id="variations">English Opening variations at a glance</h2>
<p>Black has many replies to ${mv('c4', '1.c4')}, and each one has its own name. Most club games start with one of these six. The ECO codes are the labels chess databases use, and the whole English runs from A10 to A39.</p>
<table>
<thead><tr><th>Black plays</th><th>Name</th><th>ECO</th><th>A simple plan for White</th></tr></thead>
<tbody>
<tr><td>${mv('c4 e5', '1...e5')}</td><td>Reversed Sicilian (King's English)</td><td>A20–A29</td><td>Nc3, g3, Bg2, then Nf3 or d3 and e4</td></tr>
<tr><td>${mv('c4 c5', '1...c5')}</td><td>Symmetrical English</td><td>A30–A39</td><td>Nc3, g3, Bg2, Nf3, castle, then fight for d5</td></tr>
<tr><td>${mv('c4 Nf6', '1...Nf6')}</td><td>Anglo-Indian Defense</td><td>A15–A19</td><td>Nc3 and g3, or e4 if Black plays ...e6</td></tr>
<tr><td>${mv('c4 e6', '1...e6')}</td><td>Agincourt Defense</td><td>A13</td><td>Nf3, g3, Bg2, castle, b3</td></tr>
<tr><td>${mv('c4 c6', '1...c6')}</td><td>Caro-Kann Defensive System</td><td>A11</td><td>Nf3, g3, Bg2, then d4 or b3</td></tr>
<tr><td>${mv('c4 g6', '1...g6')}</td><td>King's Indian setup (A10)</td><td>A10</td><td>The Botvinnik setup below: Nc3, g3, Bg2, e4</td></tr>
</tbody>
</table>
${story({ line: 'c4 e5 Nc3 Nf6 Nf3 Nc6', arrows: 'f3e5,c3d5', cap: 'The Four Knights English: all four knights out, and White already eyes e5 and d5.' }, `The most common branch of the Reversed Sicilian is the <strong>Four Knights English</strong>, ${mv('c4 e5 Nc3 Nf6 Nf3 Nc6', '1.c4 e5 2.Nc3 Nf6 3.Nf3 Nc6')}. White usually goes on with ${mv('c4 e5 Nc3 Nf6 Nf3 Nc6 g3', '4.g3')}, and if Black strikes with ...d5, White takes and puts the bishop on g2, just like in the main line at the top of the page.`)}
${story({ line: 'c4 e6 Nf3 d5 g3 Nf6 Bg2 Be7 O-O O-O b3', arrows: 'g2d5,~c1b2', cap: 'Agincourt: two bishops aimed at the center from g2 and b2.' }, `Against ${mv('c4 e6', '1...e6')} and ...d5 (the Agincourt), White can keep the center flexible: ${mv('c4 e6 Nf3 d5 g3 Nf6 Bg2 Be7 O-O O-O b3', 'Nf3, g3, Bg2, castle and b3')}, then Bb2. Both bishops point at the center from the side, which is the English idea in its purest form.`)}
${quickCheck('After 1.c4 e5, what is the position usually called?', ['Reversed Sicilian', 'Queen’s Gambit', 'French Defense'], 0, 'With 1...e5 Black has a Sicilian position with the colors reversed, and White is the one with the extra move.')}
`;

const botvinnik = `
<h2 id="botvinnik">A simple setup for White: the Botvinnik system</h2>
${story({ line: 'c4 g6 Nc3 Bg7 g3 Nf6 Bg2 O-O e4 d6 Nge2', hl: 'c4,e4', arrows: 'c4d5,e4d5,c3d5', cap: 'Botvinnik setup: pawns on c4 and e4, knights on c3 and e2, bishop on g2. d5 is White’s square.' }, `If you don't want to learn many lines, use one setup against almost anything: pawns on <strong>c4 and e4</strong>, knights on <strong>c3 and e2</strong>, bishop on <strong>g2</strong>, then castle. It's named after world champion Mikhail Botvinnik. The pawns on c4 and e4 grip the d5 square, and the knight on e2 leaves the f-pawn free to push to f4 later.`)}
<p>It works best against setups where Black plays ...g6 and ...d6. Step through it, then practice White's moves.</p>
`;
const botTrainer = trainer({
  title: 'English Opening — Botvinnik system',
  orientation: 'white', practiceSide: 'white',
  intro: 'One setup for White against a King’s Indian setup. Press ▶ to begin.',
  moves: 'c4 g6 Nc3 Bg7 g3 Nf6 Bg2 O-O e4 d6 Nge2 e5 O-O Nc6 d3',
  notes: [
    'The English.',
    'Black plans a fianchetto too.',
    'White adds control of d5.',
    'The bishop takes the long diagonal.',
    'White prepares Bg2.',
    'Black develops.',
    'White’s bishop takes its long diagonal as well.',
    'Black castles.',
    'The key Botvinnik move: c4 and e4 together grip d5.',
    'Black supports a later ...e5.',
    'The knight goes to e2, not f3, so the f-pawn can push to f4 later.',
    'Black claims space in the center.',
    'White castles. The king is safe behind the g2 bishop.',
    'Black develops the last knight.',
    'd3 completes the setup. Next ideas: f4, or Nd5.',
  ],
});

const asBlack = `
<h2 id="as-black">How to play against the English as Black</h2>
${story({ line: 'c4 e5', arrows: 'e5d4,~b8c6', cap: '1...e5: Black takes the center at once.' }, `The simplest answer is ${mv('c4 e5', '1...e5')}. Black grabs the center right away and develops naturally with ...Nf6, ...Nc6 and ...Bb4 or ...Be7. You get a Sicilian with colors reversed, so White is a move up, but the position is very solid for Black.`)}
${story({ line: 'c4 e5 Nc3 Nf6 g3 c6', arrows: '~d7d5', cap: '...c6 prepares ...d5 and builds a strong center.' }, `A good beginner plan is ${mv('c4 e5 Nc3 Nf6 g3 c6', '...c6 followed by ...d5')}. Black builds a pawn center and takes away the d5 square White wanted.`)}
<p>If you already play the Sicilian against ${mv('e4', '1.e4')}, try ${mv('c4 c5', '1...c5')} and copy White's setup. If you play the King's Indian or Nimzo-Indian against ${mv('d4', '1.d4')}, start with ${mv('c4 Nf6', '1...Nf6')}: White often plays d4 later, and you are back in the opening you know.</p>
${quickCheck('Black wants a solid center against the English. Which plan is the simplest?', ['...e5, then ...c6 and ...d5', '...h5 and ...h4', '...a5 and ...Ra6'], 0, 'Taking the center with ...e5 and then supporting ...d5 with ...c6 is the most natural plan for Black.')}
`;

const compare = `
<h2 id="vs-e4-d4">English Opening vs 1.e4 and 1.d4</h2>
<table>
<thead><tr><th></th><th>English (1.c4)</th><th>1.e4</th><th>1.d4</th></tr></thead>
<tbody>
<tr><td>Center</td><td>Controlled from the side</td><td>Occupied at once</td><td>Occupied at once</td></tr>
<tr><td>Typical games</td><td>Slow, maneuvering</td><td>Open, tactical</td><td>Closed, strategic</td></tr>
<tr><td>Theory to learn</td><td>Ideas more than long lines</td><td>A lot</td><td>A lot</td></tr>
<tr><td>Surprise value at club level</td><td>High</td><td>Low</td><td>Medium</td></tr>
<tr><td>Can turn into</td><td>Queen's Gambit, King's Indian, Sicilian-type positions</td><td>Open games, Sicilian, French</td><td>Queen's Gambit, Indian defenses</td></tr>
</tbody>
</table>
<p>Many top players have used the English as a main weapon, including world champions <strong>Mikhail Botvinnik</strong>, <strong>Garry Kasparov</strong> and <strong>Magnus Carlsen</strong>. It's common at every level, from beginners to world championship matches.</p>
`;

const mistakesAnchor = '<!-- AD SLOT (mid article) — add after AdSense approval -->\n<h2 id="mistakes">';
rep(mistakesAnchor, '<!-- AD SLOT (mid article) — add after AdSense approval -->\n' + variations + '</div>\n' + botvinnik.replace(/^/, '<div class="prose">') + '</div>\n' + botTrainer + '\n<div class="prose">\n' + asBlack + compare + '<h2 id="mistakes">');

// ---------- FAQ ----------
const newFaq = [
  ['What is the English Opening in chess?', `The English Opening is a chess opening for White that starts with ${mv('c4', '1.c4')}. White pushes the c-pawn two squares to control the d5 square from the side, and usually follows with Nc3, g3 and Bg2.`],
  ['Is the English Opening good?', 'Yes. It is one of the most popular and successful first moves for White and is played at every level, including by world champions. It is solid, flexible and hard for unprepared opponents to meet.'],
  ['Is the English Opening aggressive?', 'Not usually. It is a positional opening that builds slowly. It can get sharp, for example in the Reversed Sicilian when White plays e4 and f4, but most games are about squares and plans rather than early attacks.'],
  ['What is the Reversed Sicilian?', `It is the English after ${mv('c4 e5', '1.c4 e5')}. The position looks like a Sicilian Defense with the colors swapped, so White plays the "Sicilian" side with an extra move.`],
  ['How should Black play against the English?', `The simplest reply is ${mv('c4 e5', '1...e5')}, developing with ...Nf6 and ...Nc6 and aiming for ...d5. Players who know the Sicilian can try ${mv('c4 c5', '1...c5')}, and players who play Indian defenses can start with ${mv('c4 Nf6', '1...Nf6')}.`],
  ['Why is it called the English Opening?', 'It is named after Howard Staunton, the leading English player of the 1840s, who used it in his 1843 match against Pierre Saint-Amant and at the London 1851 tournament.'],
];
rep('<div class="faq">\n', '<div class="faq">\n' + newFaq.map(([q, a]) => `<details>\n<summary>${esc(q)}</summary>\n<p>${a}</p>\n</details>\n`).join(''));
// FAQPage schema: new questions first, then the old two
repRe(/("@type": "FAQPage",\s*"mainEntity": \[)/, (m) => m + '\n' + newFaq.map(([q, a]) => '  ' + JSON.stringify({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: strip(a) } })).join(',\n') + ',');

// ---------- lead and table of contents ----------
rep('<a href="#symmetrical">The Symmetrical English</a>', '<a href="#symmetrical">The Symmetrical English</a><a href="#variations">Variations at a glance</a><a href="#botvinnik">The Botvinnik system</a><a href="#as-black">How to play it as Black</a><a href="#vs-e4-d4">English vs 1.e4 and 1.d4</a>');

fs.writeFileSync(FILE, h);
console.log('ok', h.length);
