// Content for the four Group A pages. Every move line here is played through the engine at build time.
const { mv, story, quickCheck, trainer, ideas, keyFacts } = require('./lib');

const SCH = 'e4 e5 Bc4 Nc6 Qh5 Nf6 Qxf7#';
const SCH2 = 'e4 e5 Qh5 Nc6 Bc4 Nf6 Qxf7#';
const SCHDEF = 'e4 e5 Qh5 Nc6 Bc4 g6 Qf3 Nf6';
const FOOL = 'f3 e5 g4 Qh4#';
const ENG = 'd4 e5 dxe5 Nc6 Nf3 Qe7 Bf4 Qb4+ Bd2 Qxb2 Bc3 Bb4 Qd2 Bxc3 Qxc3 Qc1#';
const ENGW = 'd4 e5 dxe5 Nc6 Nf3 Qe7 Nc3 Nxe5 e4';
const STAF = 'e4 e5 Nf3 Nf6 Nxe5 Nc6 Nxc6 dxc6 d3 Bc5 Bg5 Nxe4 Bxd8 Bxf2+ Ke2 Bg4#';
const STAF2 = 'e4 e5 Nf3 Nf6 Nxe5 Nc6 Nxc6 dxc6 e5 Ne4 d4 Qh4';
const STAFW = 'e4 e5 Nf3 Nf6 Nxe5 Nc6 Nxc6 dxc6 d3 Bc5 Be2 h5 Nc3';
const cut = (l, n) => l.split(' ').slice(0, n).join(' ');

module.exports = [
/* ------------------------------------------------------------------ */
{
  slug: 'scholars-mate',
  name: "Scholar's Mate",
  title: "Scholar's Mate: How to Do It and Stop It",
  desc: "Scholar's Mate is the 4-move checkmate: 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? 4.Qxf7#. See how it works, every move order, and the simple defense with ...g6.",
  ogTitle: "Scholar's Mate: the 4-Move Checkmate and How to Stop It",
  h1: "Scholar's Mate: the 4-move checkmate and how to stop it",
  ogLines: ["Scholar's Mate:", 'the 4-move checkmate'],
  eyebrow: 'Opening trap · 4-move checkmate',
  readMin: 6,
  flip: 1,
  hero: { line: SCH, flip: 0, cap: "1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? 4.Qxf7#" },
  intro: "Scholar's Mate is the four-move checkmate almost every chess player runs into in their first games. White's queen and bishop team up against the f7 pawn, and if Black doesn't notice, it's checkmate on move 4. Here's exactly how it works and, more importantly, how to stop it every time.",
  head: () => `<div class="answer-box"><p class="answer-label">Quick answer</p><p>Scholar's Mate is a four-move checkmate: <b>${mv(SCH, '1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? 4.Qxf7#')}</b>. White's queen and bishop both attack f7, a square that only Black's king defends, so the queen captures there with checkmate. To stop it, block the queen with ${mv('e4 e5 Bc4 Nc6 Qh5 g6', '3...g6')} (or defend f7 with ${mv('e4 e5 Bc4 Nc6 Qh5 Qe7', '3...Qe7')}), then chase the queen away with ...Nf6.</p></div>
${keyFacts([
  ['Moves', mv(SCH, '1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? 4.Qxf7#')],
  ['Target', 'The f7 pawn, defended only by the king'],
  ['Length', 'Checkmate on move 4'],
  ['Best defense', `${mv('e4 e5 Bc4 Nc6 Qh5 g6', '3...g6')}, then ...Nf6 when the queen moves`],
])}${ideas([
  ['🎯', 'f7 is weak', 'At the start of the game, only the king defends it.'],
  ['🤝', 'Queen and bishop', 'Bc4 and Qh5 both aim at f7.'],
  ['🛡️', 'Block with ...g6', 'One pawn move shuts the queen out and attacks it.'],
  ['⏱️', 'Gain time', '...Nf6 hits the queen again while Black develops.'],
  ['⚠️', 'Not a real plan', 'Against careful players the early queen just gets chased.'],
])}`,
  body: () => [
`<h2 id="how-it-works">How Scholar's Mate works, move by move</h2>
${story({ line: cut(SCH, 5), hl: 'f7', arrows: '!h5f7,!c4f7', cap: 'Queen and bishop both aim at f7. Only the king defends it.', cls: 'prose' }, `White opens with ${mv('e4', '1.e4')} and brings the bishop out with ${mv('e4 e5 Bc4', '2.Bc4')}, already looking at f7. Then ${mv(cut(SCH, 5), '3.Qh5')} adds the queen. Now two pieces attack f7 and only Black's king defends it. The queen also attacks the e5 pawn, which pulls Black's attention away from the real threat.`)}${quickCheck('After 3.Qh5, which square is White really aiming at?', ['f7', 'e5', 'h7'], 0, 'e5 is attacked too, but the deadly threat is Qxf7 checkmate.')}`,
{ trainer: { title: "Scholar's Mate", orientation: 'white', practiceSide: 'white', intro: 'Watch the four-move checkmate. In Practice mode you play White.', moves: SCH, notes: [
  'White takes the center and opens lines for the queen and the bishop.',
  'Black answers in the center.',
  'The bishop aims straight at f7.',
  'A normal developing move. Nothing is wrong yet.',
  'The queen joins the attack on f7 and also hits e5.',
  'The blunder. The knight attacks the queen but does nothing about f7.',
  'Checkmate. The bishop protects the queen, so the king cannot take it, and it has nowhere to run.'] } },
`<h2 id="move-order">The other move order: 2.Qh5 first</h2>
${story({ line: SCH2, hl: 'f7,e8', arrows: 'c4f7', cap: 'Same mate, different order: Qh5 came before Bc4.' }, `Some players bring the queen out first with ${mv('e4 e5 Qh5', '2.Qh5')}, then follow with ${mv('e4 e5 Qh5 Nc6 Bc4', '3.Bc4')}. The idea is identical: two attackers on f7. After ${mv('e4 e5 Qh5 Nc6 Bc4 Nf6', '3...Nf6??')} it's ${mv(SCH2, '4.Qxf7#')} again. Whatever the order, ask one question every time White's queen comes out early: <strong>what is it attacking?</strong>`)}
<p>There's also a slower version with the queen on f3, ${mv('e4 e5 Bc4 Nc6 Qf3', '3.Qf3')}, aiming at f7 from a distance. The defense is the same idea: cover f7 before you do anything else. Here ${mv('e4 e5 Bc4 Nc6 Qf3 Nf6', '3...Nf6')} blocks the queen and develops a piece.</p>
<h2 id="stop">How to stop Scholar's Mate</h2>
${story({ line: cut(SCHDEF, 6), hl: 'g6', arrows: '!g6h5', cap: '3...g6 shuts the queen out and attacks it.' }, `The cleanest defense is ${mv(cut(SCHDEF, 6), '3...g6')}. The pawn blocks the queen's path to f7 and attacks the queen at the same time, so White has to spend another move on it.`)}
${story({ line: SCHDEF, hl: 'f6', arrows: '~f3f7', cap: '...Nf6 blocks the queen. f7 is safe and Black is developing.' }, `White usually tries again with ${mv(cut(SCHDEF, 7), '4.Qf3')}, renewing the threat on f7. Answer with ${mv(SCHDEF, '4...Nf6')}: the knight blocks the queen and develops. Black now has two pieces out, and White's queen is sitting on the square the g1 knight wanted.`)}${quickCheck("After 2.Qh5 Nc6 3.Bc4, what's Black's best defense?", ['3...g6', '3...Nf6', '3...d6'], 0, 'Both 3...Nf6 and 3...d6 allow 4.Qxf7#. 3...g6 (or 3...Qe7) stops it.')}`,
{ trainer: { title: "How to stop Scholar's Mate", orientation: 'black', practiceSide: 'black', intro: 'The correct defense. In Practice mode you play Black.', moves: SCHDEF, notes: [
  'White takes the center.',
  'Black answers in the center.',
  'The queen comes out early and attacks e5.',
  'Defend e5 with a developing move.',
  'The bishop joins: now f7 is attacked twice.',
  'Block the queen and attack it at the same time.',
  'The queen retreats but keeps aiming at f7.',
  'The knight blocks the f-file. f7 is safe and Black is well developed.'] } },
`<p>${mv('e4 e5 Bc4 Nc6 Qh5 Qe7', '3...Qe7')} also works: the queen defends f7 directly. It's a little less natural because it blocks the f8 bishop for a while, but it's completely safe.</p>
<h2 id="should-you">Should you play Scholar's Mate?</h2>
<p>Against someone who has only just learned the rules, it wins a lot of games. Against anyone who knows the defense, it backfires. Black blocks with ...g6, develops with ...Nf6 and keeps hitting the queen, and White has spent three or four moves on one piece. Stockfish rates the position after ${mv(SCHDEF, '3...g6 4.Qf3 Nf6')} as slightly better for Black.</p>
<p>If you like the idea of attacking f7, learn the <a href="/openings/italian-game/">Italian Game</a> or the <a href="/openings/fried-liver-attack/">Fried Liver Attack</a> instead. They use the same Bc4 idea, but with proper development, so they still work against stronger players.</p>
<!-- AD SLOT (mid article) — add after AdSense approval -->
<h2 id="mistakes">Common mistakes</h2>
<ul>
${story({ tag: 'li', line: cut(SCH, 6), hl: 'f7', arrows: '!h5f7,!c4f7', cap: '3...Nf6?? attacks the queen but ignores the threat on f7.' }, `<strong>Attacking the queen instead of defending f7.</strong> ${mv(cut(SCH, 6), '3...Nf6??')} looks active, but it's checkmate next move.`)}
<li><strong>Only looking at the e5 pawn.</strong> Qh5 attacks e5 too, and many beginners defend e5 and forget about f7.</li>
<li><strong>Bringing your own queen out too early.</strong> If you try Scholar's Mate and it doesn't work, your queen becomes a target. Develop your knights and bishops first.</li>
</ul>
<div class="callout clubtip" data-lx><p class="mine-h">💡 Club-level tip</p><p>Every time your opponent's queen moves, take two seconds to check every square it attacks. That one habit stops Scholar's Mate, <a href="/openings/fools-mate/">Fool's Mate</a> and most early queen tricks.</p></div>`,
  ],
  faq: [
    ["How many moves is Scholar's Mate?", 'Four moves: 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? 4.Qxf7#. White gives checkmate on move 4.'],
    ["Is Scholar's Mate the fastest checkmate?", `No. <a href="/openings/fools-mate/">Fool's Mate</a> is faster: it ends on move 2. Scholar's Mate is simply the most common quick checkmate between beginners.`],
    ["How do you stop Scholar's Mate?", 'Defend f7 before it is attacked twice. When the queen is on h5, play ...g6; when it goes to f3, play ...Nf6. ...Qe7 also defends f7.'],
    ["Is it bad to play Scholar's Mate?", "It isn't against the rules or bad manners. It's just a poor plan against players who know the defense, because the early queen gets chased and you fall behind in development."],
    ["Can Black do Scholar's Mate?", 'Yes, if White is careless. The same pattern works against f2, with Black\'s queen and c5 bishop both aiming at it. The defense for White is the same idea: cover f2 in time.'],
  ],
  quiz: { side: 'b', flip: 1, items: [
    { line: 'e4 e5 Qh5', answer: 'Nc6', pool: ['g6', 'Nf6', 'Bc5', 'Ke7'], note: 'Defend e5 and develop. Now watch f7.' },
    { line: 'e4 e5 Qh5 Nc6 Bc4', answer: 'g6', pool: ['Nf6', 'd6'], note: 'Block the queen and attack it.' },
    { line: SCHDEF.split(' ').slice(0, 7).join(' '), answer: 'Nf6', pool: ['d6', 'Bg7'], note: 'Block the f-file and develop.' },
    { line: 'e4 e5 Bc4 Nc6 Qh5', answer: 'g6', pool: ['Nf6', 'd6'], note: 'Same defense in the other move order.' },
    { line: 'e4 e5 Bc4 Nc6 Qf3', answer: 'Nf6', pool: ['d6', 'Bc5'], note: 'The knight shuts the queen out of f7.' },
  ] },
  related: [
    { href: '/openings/fools-mate/', line: FOOL, flip: 0, tag: 'Trap', tagCls: '', title: "Fool's Mate", text: 'The fastest checkmate in chess, in just two moves.' },
    { href: '/openings/italian-game/', line: 'e4 e5 Nf3 Nc6 Bc4', flip: 0, tag: '1.e4', tagCls: 'white', title: 'Italian Game', text: 'The grown-up way to aim at f7 with Bc4.' },
    { href: '/openings/fried-liver-attack/', line: 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5', flip: 0, tag: '1.e4', tagCls: 'white', title: 'Fried Liver Attack', text: 'A real attack on f7 with Ng5 and a knight sacrifice.' },
  ],
},
/* ------------------------------------------------------------------ */
{
  slug: 'fools-mate',
  name: "Fool's Mate",
  title: "Fool's Mate: the Fastest Checkmate in Chess",
  desc: "Fool's Mate is the fastest checkmate in chess: 1.f3 e5 2.g4?? Qh4#. See why it works, every version of it, and the simple rule that keeps you safe.",
  ogTitle: "Fool's Mate: the Fastest Checkmate in Chess (2 Moves)",
  h1: "Fool's Mate: the fastest checkmate in chess",
  ogLines: ["Fool's Mate:", 'the fastest checkmate'],
  eyebrow: 'Opening trap · 2-move checkmate',
  readMin: 5,
  flip: 0,
  hero: { line: FOOL, flip: 0, cap: '1.f3 e5 2.g4?? Qh4#' },
  intro: "Fool's Mate is the fastest possible checkmate in chess. It takes only two moves, and it only happens when White makes two weak pawn moves in a row. You'll rarely see it in a real game, but understanding why it works makes your king safer in every game you play.",
  head: () => `<div class="answer-box"><p class="answer-label">Quick answer</p><p>Fool's Mate is checkmate in two moves: <b>${mv(FOOL, '1.f3 e5 2.g4?? Qh4#')}</b>. White's f- and g-pawn moves open the diagonal from h4 to e1, and Black's queen checks the king along it. Nothing can block, capture or escape, so it's checkmate. It is the fastest checkmate possible in chess.</p></div>
${keyFacts([
  ['Moves', mv(FOOL, '1.f3 e5 2.g4?? Qh4#')],
  ['Length', '2 moves each, the fastest possible'],
  ['Cause', 'White pushes the f- and g-pawns and opens the e1–h4 diagonal'],
  ['How to avoid it', "Don't push the f- and g-pawns early, especially together"],
])}${ideas([
  ['⚡', 'Fastest mate', 'Two moves is the minimum. Nothing is faster.'],
  ['↘️', 'The e1–h4 diagonal', 'f3 (or f4) plus g4 leaves it wide open.'],
  ['👑', 'One queen move', '...Qh4 checks along the open diagonal.'],
  ['🚫', 'No escape', "The king is boxed in by its own pieces."],
  ['🧠', 'The lesson', 'Keep the pawns in front of your king until you castle.'],
])}`,
  body: () => [
`<h2 id="how-it-works">How Fool's Mate works</h2>
${story({ line: 'f3 e5 g4', hl: 'e1,h4', arrows: '~d8h4', cap: 'After 2.g4?? the diagonal from h4 to e1 is wide open.', cls: 'prose' }, `${mv('f3', '1.f3')} is already a weak move: it takes the best square from the g1 knight and loosens the king. After ${mv('f3 e5', '1...e5')}, Black's queen can see h4. Then ${mv('f3 e5 g4', '2.g4??')} opens the last door.`)}
${story({ line: FOOL, hl: 'h4,e1', arrows: '!h4e1', cap: 'Qh4#: nothing can block, and the king has nowhere to go.', cls: 'prose' }, `${mv(FOOL, '2...Qh4#')} is checkmate. The queen checks along the diagonal. The king can't escape: d1, d2, e2 and f1 are filled by White's own pieces, and f2 is covered by the queen. Nothing can block on g3 or f2, and nothing can take the queen.`)}${quickCheck("In Fool's Mate, which two White moves cause the problem?", ['f3 and g4', 'e4 and d4', 'Nf3 and Bc4'], 0, 'Moving the f- and g-pawns opens the diagonal from h4 to the king.')}`,
{ trainer: { title: "Fool's Mate", orientation: 'white', practiceSide: 'black', intro: 'The fastest checkmate in chess. In Practice mode you play Black and give the mate.', moves: FOOL, notes: [
  "A weak first move: it takes the knight's best square and weakens the king.",
  'Black takes the center and opens a path for the queen.',
  'The losing blunder. Now the e1–h4 diagonal is completely open.',
  'Checkmate in two moves.'] } },
`<h2 id="versions">Other ways Fool's Mate happens</h2>
<ul>
${story({ tag: 'li', line: 'f4 e5 g4 Qh4#', hl: 'h4,e1', arrows: '!h4e1', cap: '1.f4 e5 2.g4?? Qh4#' }, `${mv('f4 e5 g4 Qh4#', '1.f4 e5 2.g4?? Qh4#')}: the same idea with f4 instead of f3.`)}
${story({ tag: 'li', line: 'g4 e5 f3 Qh4#', hl: 'h4,e1', arrows: '!h4e1', cap: '1.g4 e5 2.f3?? Qh4#' }, `${mv('g4 e5 f3 Qh4#', '1.g4 e5 2.f3?? Qh4#')}: the pawn moves in the other order.`)}
${story({ tag: 'li', line: 'g4 e6 f4 Qh4#', hl: 'h4,e1', arrows: '!h4e1', cap: '1.g4 e6 2.f4?? Qh4#' }, `${mv('g4 e6 f4 Qh4#', '1.g4 e6 2.f4?? Qh4#')}: Black doesn't even need ...e5, because ...e6 opens the queen's diagonal too.`)}
${story({ tag: 'li', line: 'e4 g5 d4 f6 Qh5#', hl: 'h5,e8', arrows: '!h5e8', cap: "Fool's Mate for White: 3.Qh5#" }, `<strong>Black can fall for it too.</strong> After ${mv('e4 g5 d4 f6', '1.e4 g5 2.d4 f6??')}, White mates with ${mv('e4 g5 d4 f6 Qh5#', '3.Qh5#')}. It takes one move longer because White moves first.`)}
</ul>
<h2 id="avoid">How to never get Fool's Mated</h2>
<p>The rule is simple: <strong>don't move the f- and g-pawns early, especially both of them.</strong> Those pawns shield your king. In the opening, move your center pawns, develop your knights and bishops, and castle. Even ${mv('f4', '1.f4')} (the Bird's Opening) is fine on its own, as long as you don't follow it with an early g4.</p>
<p>If you ever do push the f-pawn early, check the e1–h4 diagonal (or e8–h5 if you're Black) before every move until you've castled.</p>
<h2 id="vs-scholars">Fool's Mate vs Scholar's Mate</h2>
<table>
<thead><tr><th></th><th>Fool's Mate</th><th><a href="/openings/scholars-mate/">Scholar's Mate</a></th></tr></thead>
<tbody>
<tr><td>Moves to mate</td><td>2</td><td>4</td></tr>
<tr><td>Usually delivered by</td><td>Black</td><td>White</td></tr>
<tr><td>Weak point</td><td>The e1–h4 diagonal</td><td>The f7 pawn</td></tr>
<tr><td>Cause</td><td>Two weak pawn moves</td><td>Ignoring a queen and bishop threat</td></tr>
<tr><td>How common</td><td>Very rare</td><td>Common between beginners</td></tr>
</tbody>
</table>
<!-- AD SLOT (mid article) — add after AdSense approval -->
<h2 id="mistakes">Common mistakes</h2>
<ul>
<li><strong>Pushing pawns to "make room".</strong> Moves like f3 and g4 don't develop anything and open lines to your own king.</li>
<li><strong>Not checking the queen's diagonals.</strong> When your opponent's queen can reach h4 (or h5), ask what it would attack there.</li>
${story({ tag: 'li', line: 'e4 g5 d4 f6 Qh5#', hl: 'h5,e8', arrows: '!h5e8', cap: '...g5 and ...f6 open the e8–h5 diagonal.' }, `<strong>Playing ...g5 and ...f6 as Black.</strong> The same mate works against you, with the white queen landing on h5.`)}
</ul>
<div class="callout clubtip" data-lx><p class="mine-h">💡 Club-level tip</p><p>Fool's Mate itself is rare, but the same diagonal causes real trouble in club games. Once your f-pawn has moved, a queen or bishop check on h4 (or h5 for Black) is often much stronger than it looks.</p></div>`,
  ],
  faq: [
    ['What is the fastest checkmate in chess?', "Fool's Mate: 1.f3 e5 2.g4?? Qh4#. It's checkmate after just two moves by each side, and nothing can be faster."],
    ["Can White give Fool's Mate?", 'Not in two moves, because White moves first. The fastest mate for White takes three moves, for example 1.e4 g5 2.d4 f6?? 3.Qh5#.'],
    ["Why is it called Fool's Mate?", "Because only a fool would play both f3 (or f4) and g4 at the start. It's the classic example of how not to open a game."],
    ["Does Fool's Mate happen in real games?", 'Very rarely, and almost only between complete beginners. Its real value is the lesson: keep the pawns in front of your king until you have castled.'],
    ["What's the difference between Fool's Mate and Scholar's Mate?", `Fool's Mate ends in two moves and comes from White's own weak pawn moves. <a href="/openings/scholars-mate/">Scholar's Mate</a> takes four moves and is an attack on f7 with the queen and bishop.`],
  ],
  quiz: { side: 'b', flip: 0, items: [
    { line: 'f3 e5 g4', answer: 'Qh4#', pool: ['Qg5', 'Bc5'], note: "The classic Fool's Mate." },
    { line: 'f4 e5 g4', answer: 'Qh4#', pool: ['Qg5', 'Bc5'], note: 'Same diagonal, same mate.' },
    { line: 'g4 e5 f3', answer: 'Qh4#', pool: ['Qg5', 'Bc5'], note: 'The pawn moves came in the other order.' },
    { line: 'g4 e6 f4', answer: 'Qh4#', pool: ['Qg5', 'Bc5'], note: '...e6 opens the queen\'s diagonal too.' },
    { line: 'f3 e6 g4', answer: 'Qh4#', pool: ['Qg5', 'Bc5'], note: 'Checkmate on the e1–h4 diagonal again.' },
  ] },
  related: [
    { href: '/openings/scholars-mate/', line: 'e4 e5 Bc4 Nc6 Qh5 Nf6 Qxf7#', flip: 0, tag: 'Trap', tagCls: '', title: "Scholar's Mate", text: 'The 4-move checkmate on f7, and how to stop it.' },
    { href: '/learn/', line: '', flip: 0, tag: 'Rules', tagCls: '', title: 'How to play chess', text: 'Check, checkmate and the rest of the rules, step by step.' },
    { href: '/endgames/', line: '', flip: 0, tag: 'Endgames', tagCls: '', title: 'Basic checkmates', text: 'Practice mating with king and queen or king and rook.' },
  ],
},
/* ------------------------------------------------------------------ */
{
  slug: 'englund-gambit',
  name: 'Englund Gambit',
  title: 'Englund Gambit: the Trap and How to Beat It',
  desc: 'Learn the Englund Gambit (1.d4 e5) move by move: the famous ...Qc1# trap, how White should answer, whether it is any good, and a free practice board.',
  ogTitle: 'Englund Gambit: the Famous Trap and How to Beat It',
  h1: 'Englund Gambit: the trap and how to beat it',
  ogLines: ['Englund Gambit:', 'the trap and how to', 'beat it'],
  eyebrow: 'Gambit for Black · vs 1.d4',
  readMin: 7,
  flip: 1,
  hero: { line: ENG, flip: 1, cap: 'The Englund trap ends with 8...Qc1#' },
  intro: 'The Englund Gambit is a cheeky reply to 1.d4: Black plays 1...e5 and gives a pawn away straight away. It is not objectively sound, but it hides one of the best-known traps in chess, and plenty of club players have been checkmated by it in under ten moves.',
  head: () => `<div class="answer-box"><p class="answer-label">Quick answer</p><p>The Englund Gambit starts <b>${mv('d4 e5', '1.d4 e5')}</b>. After ${mv(cut(ENG, 6), '2.dxe5 Nc6 3.Nf3 Qe7')}, Black attacks the e5 pawn and sets a trap: if ${mv(cut(ENG, 11), '4.Bf4 Qb4+ 5.Bd2 Qxb2 6.Bc3??')}, then ${mv(cut(ENG, 12), '6...Bb4!')} leads to ${mv(ENG, '8...Qc1#')}. It's a fun surprise weapon, but with correct play, such as ${mv(cut(ENG, 10) + ' Nc3', '6.Nc3')}, White stays better.</p></div>
${keyFacts([
  ['Moves', mv('d4 e5', '1.d4 e5')],
  ['Type', 'Gambit for Black against 1.d4'],
  ['Main trap', `${mv(cut(ENG, 11), '6.Bc3??')} ${mv(cut(ENG, 12), 'Bb4!')} and ...Qc1#`],
  ['Engine verdict', 'Better for White with correct play'],
])}${ideas([
  ['🎁', 'A pawn gift', '1...e5 gives a pawn to drag White into tactics.'],
  ['🎯', 'Pressure on e5', '...Nc6 and ...Qe7 attack the pawn on e5.'],
  ['👑', 'Queen raid', '...Qb4+ and ...Qxb2 grab material on the queenside.'],
  ['⚠️', 'The c1 square', "When White's pieces get tangled, ...Qc1# appears."],
  ['✅', "White's antidote", 'Develop with Nc3 and keep the advantage.'],
])}`,
  body: () => [
`<h2 id="trap">The famous Englund trap, move by move</h2>
${story({ line: cut(ENG, 6), hl: 'e5', arrows: '!e7e5,!c6e5', cap: '...Nc6 and ...Qe7 both attack e5.', cls: 'prose' }, `After ${mv('d4 e5 dxe5', '2.dxe5')}, Black attacks the pawn with ${mv('d4 e5 dxe5 Nc6', '2...Nc6')} and ${mv(cut(ENG, 6), '3...Qe7')}. White's natural way to keep it is ${mv(cut(ENG, 7), '4.Bf4')}.`)}
${story({ line: cut(ENG, 10), hl: 'b2', arrows: '!b2a1,!b2b1', cap: '...Qxb2 attacks the rook on a1 and the knight on b1.', cls: 'prose' }, `Now ${mv(cut(ENG, 8), '4...Qb4+')} checks the king and attacks the b2 pawn at the same time. After ${mv(cut(ENG, 10), '5.Bd2 Qxb2')}, Black's queen is attacking the rook on a1 and the knight on b1.`)}
${story({ line: cut(ENG, 12), hl: 'c3,e1', arrows: '!b4c3', cap: '6...Bb4! pins the bishop on c3 to the king.', cls: 'prose' }, `The natural-looking ${mv(cut(ENG, 11), '6.Bc3??')} attacks Black's queen, but ${mv(cut(ENG, 12), '6...Bb4!')} pins the bishop to White's king. Black threatens both ...Qxa1 and ...Bxc3+. White's best try, ${mv(cut(ENG, 13), '7.Qd2')}, defends c3, but after ${mv(cut(ENG, 15), '7...Bxc3 8.Qxc3')} comes ${mv(ENG, '8...Qc1#')}.`)}${quickCheck('After 5...Qxb2, which White move keeps the advantage?', ['6.Nc3', '6.Bc3', '6.e3'], 0, '6.Bc3?? runs into ...Bb4, and 6.e3 loses the rook to ...Qxa1. 6.Nc3 covers everything and keeps White ahead.')}`,
{ trainer: { title: 'The Englund trap', orientation: 'black', practiceSide: 'black', intro: 'Black sets the trap. In Practice mode you play Black.', moves: ENG, notes: [
  'White takes the center.',
  'The Englund Gambit: Black offers a pawn.',
  'White accepts.',
  'Attack e5 and develop.',
  'White defends e5.',
  'A third attacker on e5, and the queen is ready to jump to b4.',
  'White defends e5 once more.',
  'Check, and the queen also attacks b2.',
  'Block the check.',
  'Black grabs the pawn and attacks the rook on a1.',
  'The mistake: it attacks the queen but walks into a pin. (6.Nc3 was correct.)',
  'Pin the bishop to the king. Now ...Qxa1 or ...Bxc3+ is coming.',
  'White defends c3 again.',
  'Black takes anyway.',
  'White recaptures with the queen...',
  '...and the queen lands on c1 with checkmate.'] } },
`<h2 id="white">How White should answer the Englund Gambit</h2>
${story({ line: cut(ENGW, 7), hl: 'c3', arrows: 'c3d5,c3b5', cap: '4.Nc3: develop instead of clinging to the pawn.' }, `The simplest plan is to develop normally. ${mv(cut(ENGW, 7), '4.Nc3')} brings a piece out and covers b5 and d5. If Black wins the pawn back with ${mv(cut(ENGW, 8), '4...Nxe5')}, White takes the center with ${mv(ENGW, '5.e4')} and is ahead in development. Stockfish rates White clearly better.`)}
<p>A more ambitious try is ${mv('d4 e5 dxe5 Nc6 Nf3 Qe7 Qd5', '4.Qd5')}, protecting e5 with the queen. After ${mv('d4 e5 dxe5 Nc6 Nf3 Qe7 Qd5 f6 exf6 Nxf6 Qb3', '4...f6 5.exf6 Nxf6 6.Qb3')}, White is a clean pawn up.</p>`,
{ trainer: { title: 'Beating the Englund Gambit', orientation: 'white', practiceSide: 'white', intro: "White's safe, strong answer. In Practice mode you play White.", moves: ENGW, notes: [
  'White takes the center.',
  'The Englund Gambit.',
  'Accept the pawn.',
  'Black attacks e5.',
  'Defend e5 and develop.',
  'A third attack on e5.',
  'Develop instead of clinging to the pawn. The knight covers b5 and d5.',
  'Black wins the pawn back.',
  'White grabs the center with a big lead in development.'] } },
`<h2 id="good">Is the Englund Gambit good?</h2>
<p>Not at a high level. Stockfish gives White a clear edge after almost every sensible reply, and strong players know the trap. But below about 1200, many opponents have never seen it, the trap is easy to fall into, and the positions are sharp enough that one slip decides the game. Use it as a surprise weapon in fast games, not as your main defense to 1.d4.</p>
<p>For a reliable answer to 1.d4, learn the <a href="/openings/queens-gambit-declined/">Queen's Gambit Declined</a> or the <a href="/openings/slav-defense/">Slav Defense</a>.</p>
<!-- AD SLOT (mid article) — add after AdSense approval -->
<h2 id="mistakes">Common mistakes</h2>
<ul>
<li><strong>As Black, expecting the trap every game.</strong> If White plays 4.Nc3 or 4.Qd5, you're simply a pawn down. Know the normal plans too.</li>
<li><strong>As White, holding on to the e5 pawn at all costs.</strong> Defending it with Bf4 and then Bc3 is exactly how the trap happens.</li>
${story({ tag: 'li', line: ENG, hl: 'c1,e1', arrows: '!c1e1', cap: '8...Qc1#: the back rank was never safe.' }, `<strong>As White, forgetting about c1.</strong> Once the bishop has left c1 and the queen has moved, ...Qc1 can be checkmate.`)}
</ul>
<div class="callout clubtip" data-lx><p class="mine-h">💡 Club-level tip</p><p>If you face the Englund as White, don't try to keep the e5 pawn forever. Play Nc3, then e4, and enjoy the center. If you've already gone 4.Bf4 Qb4+ 5.Bd2 Qxb2, the safe move is 6.Nc3.</p></div>`,
  ],
  faq: [
    ['Is the Englund Gambit sound?', 'No. With accurate play White keeps an advantage, usually an extra pawn or a big lead in development. It is a trappy surprise weapon, not a main line.'],
    ['What is the Englund Gambit trap?', '1.d4 e5 2.dxe5 Nc6 3.Nf3 Qe7 4.Bf4 Qb4+ 5.Bd2 Qxb2 6.Bc3?? Bb4! 7.Qd2 Bxc3 8.Qxc3 Qc1#.'],
    ['How do you beat the Englund Gambit?', 'Take the pawn with 2.dxe5, defend it with 3.Nf3, then develop with 4.Nc3 and 5.e4. If you have played 4.Bf4 Qb4+ 5.Bd2 Qxb2, answer with 6.Nc3, not 6.Bc3.'],
    ['Who is the Englund Gambit named after?', 'Fritz Englund, a Swedish player from the early 1900s.'],
    ['Is the Englund Gambit good for beginners?', `As a surprise in blitz it can be fun, and it teaches tactics. As your main defense to 1.d4, choose something solid like the <a href="/openings/queens-gambit-declined/">Queen's Gambit Declined</a>.`],
  ],
  quiz: { side: 'b', flip: 1, items: [
    { line: cut(ENG, 7), answer: 'Qb4+', pool: ['Qxe5', 'Nxe5', 'Qc5', 'd6'], note: 'Check, and the queen eyes b2.' },
    { line: cut(ENG, 9), answer: 'Qxb2', pool: ['Qxd2+', 'Qe7'], note: 'Grab the pawn and attack the rook.' },
    { line: cut(ENG, 11), answer: 'Bb4', pool: ['Qxa1', 'Qb6'], note: 'Pin the bishop to the king.' },
    { line: cut(ENG, 13), answer: 'Bxc3', pool: ['Qxa1', 'Qc1+'], note: 'Take on c3 and set up the mate.' },
    { line: cut(ENG, 15), answer: 'Qc1#', pool: ['Qxc3', 'Qxa1'], note: 'Checkmate on the back rank.' },
  ] },
  related: [
    { href: '/openings/stafford-gambit/', line: 'e4 e5 Nf3 Nf6 Nxe5 Nc6', flip: 1, tag: 'vs 1.e4', tagCls: 'black', title: 'Stafford Gambit', text: 'Another trap-filled gambit for Black, against 1.e4.' },
    { href: '/openings/queens-gambit-declined/', line: 'd4 d5 c4 e6', flip: 1, tag: 'vs 1.d4', tagCls: 'black', title: "Queen's Gambit Declined", text: '1.d4 d5 2.c4 e6. The solid main answer to 1.d4.' },
    { href: '/openings/london-system/', line: 'd4 d5 Bf4', flip: 0, tag: '1.d4', tagCls: 'white', title: 'London System', text: 'An easy 1.d4 setup for White.' },
  ],
},
/* ------------------------------------------------------------------ */
{
  slug: 'stafford-gambit',
  name: 'Stafford Gambit',
  title: 'Stafford Gambit: Traps and How to Refute It',
  desc: 'Learn the Stafford Gambit (1.e4 e5 2.Nf3 Nf6 3.Nxe5 Nc6) move by move: its two deadliest traps, how White should refute it, and a free practice board.',
  ogTitle: 'Stafford Gambit: the Traps and How to Refute It',
  h1: 'Stafford Gambit: the traps and how to refute it',
  ogLines: ['Stafford Gambit:', 'the traps and how', 'to refute it'],
  eyebrow: 'Gambit for Black · vs 1.e4',
  readMin: 7,
  flip: 1,
  hero: { line: STAF, flip: 1, cap: 'The Stafford trap ends with 8...Bg4#' },
  intro: 'The Stafford Gambit is a wild, trap-filled gambit for Black that starts from the Petrov Defense. Black lets White take the e5 pawn, develops at lightning speed and hopes White grabs too much. It became famous in online blitz, so if you play 1.e4, you will meet it.',
  head: () => `<div class="answer-box"><p class="answer-label">Quick answer</p><p>The Stafford Gambit is <b>${mv(cut(STAF, 6), '1.e4 e5 2.Nf3 Nf6 3.Nxe5 Nc6!?')}</b>. Black gives a pawn for fast development and traps. The most famous one is ${mv(cut(STAF, 12), '4.Nxc6 dxc6 5.d3 Bc5 6.Bg5?? Nxe4!')}, and if ${mv(cut(STAF, 13), '7.Bxd8')} then ${mv(STAF, '7...Bxf2+ 8.Ke2 Bg4#')}. White's best answer is calm development, such as ${mv(cut(STAFW, 11), '5.d3 Bc5 6.Be2')}, which keeps the extra pawn.</p></div>
${keyFacts([
  ['Moves', mv(cut(STAF, 6), '1.e4 e5 2.Nf3 Nf6 3.Nxe5 Nc6')],
  ['Type', 'Gambit for Black, from the Petrov Defense'],
  ['Main trap', `${mv(cut(STAF, 11), '6.Bg5??')} ${mv(cut(STAF, 12), 'Nxe4!')} and ...Bg4#`],
  ['Engine verdict', 'Clearly better for White with calm play'],
])}${ideas([
  ['🎁', 'A pawn for speed', "Black gives e5 and opens lines for both bishops."],
  ['🎯', 'f2 is the target', '...Bc5, ...Nxe4 and ...Qh4 all aim at f2.'],
  ['👑', 'Queen sacrifice', 'In the main trap Black lets the queen go and mates instead.'],
  ['🪤', 'Natural moves lose', 'Bg5 and g3 look normal but walk into tricks.'],
  ['✅', "White's antidote", 'd3, Be2 and castle. The extra pawn stays.'],
])}`,
  body: () => [
`<h2 id="trap">The main Stafford trap, move by move</h2>
${story({ line: cut(STAF, 8), arrows: '~c8g4,~f8c5', cap: 'After 4...dxc6 both of Black\'s bishops are free to come out.', cls: 'prose' }, `After ${mv(cut(STAF, 6), '3...Nc6')}, White usually trades with ${mv(cut(STAF, 7), '4.Nxc6')} and Black recaptures ${mv(cut(STAF, 8), '4...dxc6')}. Black's pawns look a bit damaged, but the d-file opens and both bishops can come out quickly.`)}
${story({ line: cut(STAF, 10), hl: 'c5,f2', arrows: '!c5f2', cap: '...Bc5 aims at f2, the weakest square in White\'s camp.', cls: 'prose' }, `After ${mv(cut(STAF, 10), '5.d3 Bc5')}, Black's bishop stares at f2, the weakest square in White's position.`)}
${story({ line: cut(STAF, 12), hl: 'f2,d8', arrows: '!c5f2,!e4f2', cap: '6...Nxe4! leaves the queen hanging on purpose.', cls: 'prose' }, `The natural pin ${mv(cut(STAF, 11), '6.Bg5??')} is the mistake. Black ignores the attack on the queen and plays ${mv(cut(STAF, 12), '6...Nxe4!')}. If White grabs the queen with ${mv(cut(STAF, 13), '7.Bxd8')}, then ${mv(STAF, '7...Bxf2+ 8.Ke2 Bg4#')} is checkmate. Even if White doesn't take the queen, f2 can't hold: Stockfish rates the position after 6...Nxe4 as winning for Black.`)}${quickCheck('After 5.d3 Bc5 6.Bg5, what should Black play?', ['6...Nxe4', '6...h6', '6...Be7'], 0, '6...Nxe4! wins: if White takes the queen, ...Bxf2+ and ...Bg4# follow. 6...Be7 is just passive, and 6...h6 lets White off the hook.')}`,
{ trainer: { title: 'The Stafford trap', orientation: 'black', practiceSide: 'black', intro: 'Black sets the main trap. In Practice mode you play Black.', moves: STAF, notes: [
  'White takes the center.',
  'Black answers.',
  'The knight attacks e5.',
  'The Petrov: Black counterattacks e4.',
  'White takes the pawn.',
  'The Stafford Gambit: Black offers the pawn instead of winning back e4.',
  'White trades knights.',
  'Recapture away from the center to open lines for the bishop and queen.',
  'White protects e4.',
  'The bishop aims at f2.',
  'The mistake: it pins the knight and attacks the queen.',
  'Black ignores the queen and attacks f2 a second time.',
  'White takes the queen...',
  '...but the bishop checks the king.',
  'The only legal move.',
  'Checkmate, with the queen still lost on d8.'] } },
`<h2 id="trap2">A second trap: 5.e5 and ...Qh4</h2>
${story({ line: STAF2, hl: 'h4,f2', arrows: '!h4f2,!e4f2', cap: '...Qh4 attacks f2 twice, with the knight already on e4.' }, `Many White players kick the knight with ${mv(cut(STAF2, 10), '5.e5 Ne4')} and continue ${mv(STAF2, '6.d4 Qh4')}. Now f2 is attacked twice. The natural ${mv(STAF2 + ' g3', '7.g3?')} loses material to ${mv(STAF2 + ' g3 Nxg3', '7...Nxg3!')}.`)}
${story({ line: STAF2 + ' g3 Nxg3 fxg3 Qe4+', hl: 'e1,h1', arrows: '!e4e1,!e4h1', cap: '...Qe4+ checks the king and wins the rook on h1.' }, `If White takes with ${mv(STAF2 + ' g3 Nxg3 fxg3', '8.fxg3')}, then ${mv(STAF2 + ' g3 Nxg3 fxg3 Qe4+', '8...Qe4+')} checks the king and wins the rook on h1. Taking with the other pawn, ${mv(STAF2 + ' g3 Nxg3 hxg3 Qxh1', '8.hxg3 Qxh1')}, loses the rook too. White's correct move was ${mv(STAF2 + ' Qe2', '7.Qe2!')}, which defends f2 and keeps White better.`)}`,
`<h2 id="white">How White should refute the Stafford Gambit</h2>
<p>The best answer to a trap-filled gambit is almost always the same: <strong>don't grab more, don't pin, develop and castle.</strong> You're already a pawn up.</p>`,
{ trainer: { title: 'Refuting the Stafford Gambit', orientation: 'white', practiceSide: 'white', intro: "White's calm, strong answer. In Practice mode you play White.", moves: STAFW, notes: [
  'White takes the center.',
  'Black answers.',
  'Attack e5.',
  'The Petrov.',
  'Take the pawn.',
  'The Stafford Gambit.',
  'Trade knights.',
  'Black recaptures to open lines.',
  'Protect e4 calmly. This is the key move.',
  'The bishop eyes f2.',
  'Not Bg5! The bishop on e2 covers g4 and gets ready to castle.',
  "Black's usual try: the h-pawn supports ...Ng4 and ...Bg4 ideas.",
  'Develop and get ready to castle. White keeps the extra pawn, and Stockfish rates White better.'] } },
`<h2 id="good">Is the Stafford Gambit good?</h2>
<p>Not objectively. If White just develops, Stockfish gives White a clear advantage after ${mv(cut(STAF, 8), '4...dxc6')}. But it scores very well in fast online games because its traps are so natural. If you like the Petrov but want something sound, learn the real <a href="/openings/petrov-defense/">Petrov Defense</a>: after 3.Nxe5 it continues 3...d6, not 3...Nc6.</p>
<!-- AD SLOT (mid article) — add after AdSense approval -->
<h2 id="mistakes">Common mistakes</h2>
<ul>
${story({ tag: 'li', line: cut(STAF, 12), hl: 'f2', arrows: '!c5f2,!e4f2', cap: 'Bg5 is the move that loses to ...Nxe4.' }, `<strong>As White, pinning with Bg5.</strong> It's the exact move that loses to ...Nxe4.`)}
<li><strong>As White, answering ...Qh4 with g3.</strong> The knight jumps into g3 and a rook falls. Defend with Qe2 instead.</li>
<li><strong>As Black, playing only for traps.</strong> If White plays d3, Be2 and castles, you're simply a pawn down. Learn the normal plans too.</li>
</ul>
<div class="callout clubtip" data-lx><p class="mine-h">💡 Club-level tip</p><p>Against the Stafford, remember three calm moves: d3, Be2 and castle. Play them and most of the traps simply disappear.</p></div>`,
  ],
  faq: [
    ['Is the Stafford Gambit sound?', 'No. With calm play White keeps an extra pawn and a better position. It is popular in blitz because its traps are so easy to fall into.'],
    ['What is the Stafford Gambit trap?', '1.e4 e5 2.Nf3 Nf6 3.Nxe5 Nc6 4.Nxc6 dxc6 5.d3 Bc5 6.Bg5?? Nxe4! 7.Bxd8 Bxf2+ 8.Ke2 Bg4#.'],
    ['How do you refute the Stafford Gambit?', 'After 4...dxc6, play 5.d3, then Be2 and castle. Avoid Bg5, and against ...Qh4 ideas defend with Qe2 instead of g3.'],
    ['Who made the Stafford Gambit popular?', 'It became famous through online chess videos and streams, especially those of Eric Rosen.'],
    ['Is the Stafford Gambit the same as the Petrov?', `It starts from the <a href="/openings/petrov-defense/">Petrov Defense</a> (1.e4 e5 2.Nf3 Nf6), but after 3.Nxe5 the real Petrov continues 3...d6. 3...Nc6 is the Stafford Gambit.`],
  ],
  quiz: { side: 'b', flip: 1, items: [
    { line: cut(STAF, 7), answer: 'dxc6', pool: ['Nxe4', 'Qe7'], note: 'Recapture to open lines for the bishop and queen.' },
    { line: STAF2 + ' g3', answer: 'Nxg3', pool: ['Qe7', 'Qh3', 'Qh6', 'Bb4+'], note: 'The second trap: the knight takes on g3 and a rook falls.' },
    { line: cut(STAF, 11), answer: 'Nxe4', pool: ['Be7', 'h6'], note: 'Ignore the queen and hit f2 again.' },
    { line: cut(STAF, 13), answer: 'Bxf2+', pool: ['Kxd8', 'Bg4'], note: 'Check, and the mating net closes.' },
    { line: cut(STAF, 15), answer: 'Bg4#', pool: ['Kxd8', 'Bb6'], note: 'Checkmate.' },
  ] },
  related: [
    { href: '/openings/petrov-defense/', line: 'e4 e5 Nf3 Nf6', flip: 1, tag: 'vs 1.e4', tagCls: 'black', title: 'Petrov Defense', text: 'The sound version: 1.e4 e5 2.Nf3 Nf6 3.Nxe5 d6.' },
    { href: '/openings/englund-gambit/', line: 'd4 e5', flip: 1, tag: 'vs 1.d4', tagCls: 'black', title: 'Englund Gambit', text: 'A trap-filled gambit for Black against 1.d4.' },
    { href: '/openings/fried-liver-attack/', line: 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5', flip: 0, tag: '1.e4', tagCls: 'white', title: 'Fried Liver Attack', text: 'Attack f7 with a knight sacrifice.' },
  ],
},
];
