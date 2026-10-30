// Learn-section pages: Stalemate and Zugzwang. Lines "FEN|moves" start from a custom position.
const { mv, story, quickCheck, ideas, keyFacts } = require('./lib');

const S1 = 'k7/8/2K5/8/8/8/8/1Q6 w - - 0 1';
const S2 = '2k5/8/2K5/8/8/8/8/3Q4 w - - 0 1';
const S3 = '7k/8/5K2/8/8/8/8/6Q1 w - - 0 1';
const SP = 'k7/P7/1K6/8/8/8/8/8 b - - 0 1';
const TREB = '8/8/8/1Kp5/2Pk4/8/8/8 w - - 0 1';
const TREBB = '8/8/8/1Kp5/2Pk4/8/8/8 b - - 0 1';
const OPP = '8/8/4k3/8/4K3/4P3/8/8 b - - 0 1';

module.exports = [
/* ------------------------------------------------------------------ */
{
  sec: 'learn',
  slug: 'stalemate',
  name: 'Stalemate',
  title: 'Stalemate in Chess: Rules and Examples',
  desc: "Stalemate in chess is a draw: the player to move has no legal move but isn't in check. Clear examples, how to avoid it, and how to save lost games with it.",
  ogTitle: 'Stalemate in Chess: Rules, Examples and How to Avoid It',
  h1: 'Stalemate in chess: what it is and how to avoid it',
  ogLines: ['Stalemate in chess:', 'what it is and how', 'to avoid it'],
  eyebrow: 'Chess rules · draws',
  ogEyebrow: 'Chess rules',
  readMin: 6,
  flip: 0,
  hero: { line: S1 + '|Qb6', flip: 0, cap: 'Black to move has no legal move: stalemate.' },
  intro: "Stalemate is the chess rule that turns a lot of winning positions into draws. It happens when the player whose turn it is has no legal move, but their king is not in check. Beginners throw away half points to it all the time, usually with an extra queen on the board. Here's how it works and how to make sure it never happens to you.",
  head: () => `<div class="answer-box"><p class="answer-label">Quick answer</p><p><b>Stalemate is a draw.</b> It happens when the player to move has <b>no legal moves</b> and their king is <b>not in check</b>. For example, with Black's king on a8, ${mv(S1 + '|Qb6', 'Qb6??')} leaves Black with no move at all, so the game is drawn, while ${mv(S1 + '|Qb7#', 'Qb7#')} would have been checkmate. Each player gets half a point.</p></div>
${keyFacts([
  ['Result', 'Draw (½–½)'],
  ['When', 'The side to move has no legal move and is not in check'],
  ['Most common cause', 'A queen taking every square away from a lone king'],
  ['Golden rule', 'Leave the enemy king a move until you can give checkmate'],
])}${ideas([
  ['🤝', "It's a draw", 'No matter how much material you have.'],
  ['🚫', 'No legal move', 'Not a single piece or pawn can move.'],
  ['👑', 'Not in check', "That's the difference from checkmate."],
  ['🔍', 'Look before you move', 'Count the enemy king\'s free squares first.'],
  ['🛟', 'A lifeline', 'When you are losing, stalemate can save the game.'],
])}`,
  body: () => [
`<h2 id="what-is">What is stalemate?</h2>
${story({ line: S1 + '|Qb6', hl: 'a8', arrows: 'b6a7,b6b8,c6b7', cap: 'No check, but every square around the king is covered.', cls: 'prose' }, `Look at the position after ${mv(S1 + '|Qb6', 'Qb6')}. Black's king on a8 is not in check. But a7 and b8 are covered by the queen, and b7 by both the queen and the king. Black has no other pieces, so Black has no legal move at all. That's stalemate: the game is over, and it's a draw.`)}${quickCheck('Black to move has no legal moves and is not in check. What is the result?', ['Draw', 'White wins', 'Black wins'], 0, 'Stalemate is always a draw, however much material one side has.')}`,
{ trainer: { title: 'Checkmate, not stalemate', orientation: 'white', practiceSide: 'white', intro: 'Mate with king and queen without giving stalemate. In Practice mode you play White.', moves: S2 + '|Qd7+ Kb8 Qb7#', notes: [
  'Check from d7, protected by the king. Black has just one square left: b8.',
  'The only legal move.',
  'Checkmate. The queen on b7 is protected by the king, and every escape square is covered.'] } },
`<p>The tempting ${mv(S2 + '|Qd6', '1.Qd6??')} looks like it traps the king, but it's stalemate: Black has no legal move and isn't in check.</p>
<h2 id="vs-checkmate">Stalemate vs checkmate</h2>
<table>
<thead><tr><th></th><th>Checkmate</th><th>Stalemate</th></tr></thead>
<tbody>
<tr><td>Is the king in check?</td><td>Yes</td><td>No</td></tr>
<tr><td>Legal moves left</td><td>None</td><td>None</td></tr>
<tr><td>Result</td><td>The side that gave mate wins</td><td>Draw (½–½)</td></tr>
</tbody>
</table>
<h2 id="avoid">How to avoid stalemate</h2>
<ul>
<li><strong>Before every move, ask: will my opponent still have a legal move?</strong> If the answer is no and you're not giving check, choose another move.</li>
${story({ tag: 'li', line: S3 + '|Qg6', hl: 'h8', arrows: 'g6h7,g6g8,f6g7', cap: "Qg6?? is stalemate: the queen is a knight's jump from the king." }, `<strong>Watch the knight's-jump pattern.</strong> A queen a knight's jump away from a cornered king, like ${mv(S3 + '|Qg6', 'Qg6??')}, is the classic stalemate. ${mv(S3 + '|Qg7#', 'Qg7#')} is the mate.`)}
<li><strong>Bring your king closer first.</strong> A queen can't give mate on her own. Leave the enemy king some room while your own king walks over to help.</li>
<li><strong>Watch out for blocked pawns.</strong> If your opponent's only other pieces are blocked pawns, they can't move either.</li>
</ul>
<h2 id="pawn">The king and pawn stalemate</h2>
${story({ line: SP + '|', hl: 'a8', arrows: 'a7b8,b6b7', cap: 'Black to move: b8 and b7 are covered, and a7 is protected.' }, `Endgames with a rook pawn (an a- or h-pawn) often end in stalemate. Here Black's king is on a8, with White's pawn on a7 and king on b6. Black to move has no legal move: b8 is covered by the pawn and b7 by the king. It's a draw, even though White is a pawn up. Practice the basic endings in our <a href="/endgames/">endgame drills</a>.`)}
<h2 id="save">Using stalemate to save a lost game</h2>
<p>If you're losing badly, stalemate is your friend. Head for the corner with your king, and look for ways to give away your remaining pieces so that your king has no moves left. Strong players set stalemate traps in lost positions all the time, and beginners with a big material lead often fall for them.</p>
<!-- AD SLOT (mid article) — add after AdSense approval -->
<h2 id="mistakes">Common mistakes</h2>
<ul>
<li><strong>Grabbing every last pawn.</strong> Taking your opponent's last piece that can move may leave them with no moves at all.</li>
<li><strong>Chasing the king with the queen alone.</strong> You need your king's help to give mate, so bring it closer.</li>
<li><strong>Moving too fast when winning.</strong> Most stalemates happen in completely won positions, often in time trouble.</li>
</ul>
<div class="callout clubtip" data-lx><p class="mine-h">💡 Club-level tip</p><p>When you're winning with a queen, slow down at the end. Before each move, count the enemy king's free squares. If the answer would be zero and you're not giving check, stop and pick a different move.</p></div>`,
  ],
  faq: [
    ['Is stalemate a win or a draw?', 'A draw. Each player gets half a point, no matter how much material is left on the board.'],
    ['What is the difference between stalemate and checkmate?', 'In both, the side to move has no legal move. In checkmate the king is in check, so that player loses. In stalemate the king is not in check, so the game is a draw.'],
    ['Can it be stalemate with other pieces still on the board?', "Yes. If every one of a player's pieces is blocked or pinned and the king has no safe square, it's stalemate, even with plenty of material left."],
    ['What if the king has no moves but another piece can move?', 'Then it is not stalemate and the game goes on. Stalemate only happens when the player has no legal move at all.'],
    ['Is stalemate a draw under official rules?', 'Yes. Under the official FIDE rules, and US Chess rules, stalemate ends the game in a draw.'],
  ],
  quiz: { side: 'w', flip: 0, ask: "Find the best move, and don't give stalemate!", items: [
    { line: S1 + '|', answer: 'Qb7#', pool: ['Qb6', 'Kb6'], note: 'Mate. Qb6?? would have been stalemate.' },
    { line: S3 + '|', answer: 'Qg7#', pool: ['Qg6', 'Kg6'], note: 'Mate. Qg6?? would have been stalemate.' },
    { line: 'k7/8/1K6/8/8/8/8/7R w - - 0 1|', answer: 'Rh8#', pool: ['Rb1', 'Rh7'], note: 'Back-rank mate with the rook.' },
    { line: 'k7/2Q5/1K6/8/8/8/8/8 w - - 0 1|', answer: 'Qb7#', pool: ['Kc6', 'Ka6'], note: 'Black has no moves, so you must give check, not pass.' },
    { line: S2 + '|', answer: 'Qd7+', pool: ['Qd6'], note: 'Check first; Qb7# follows. Qd6?? is stalemate.' },
  ] },
  related: [
    { href: '/learn/zugzwang/', line: TREB + '|', flip: 0, tag: 'Concept', tagCls: '', title: 'Zugzwang', text: 'When every move you can make makes things worse.' },
    { href: '/endgames/', line: '', flip: 0, tag: 'Endgames', tagCls: '', title: 'Basic checkmates', text: 'Practice mating with king and queen or king and rook.' },
    { href: '/openings/fools-mate/', line: 'f3 e5 g4 Qh4#', flip: 0, tag: 'Trap', tagCls: '', title: "Fool's Mate", text: 'The fastest checkmate in chess.' },
  ],
},
/* ------------------------------------------------------------------ */
{
  sec: 'learn',
  slug: 'zugzwang',
  name: 'Zugzwang',
  title: 'Zugzwang in Chess: Meaning and Examples',
  desc: 'Zugzwang is when every move you can make worsens your position. Learn what it means, the famous trébuchet, the opposition in pawn endgames, and practice it.',
  ogTitle: 'Zugzwang in Chess: Meaning, Examples and the Opposition',
  h1: 'Zugzwang: when every move makes things worse',
  ogLines: ['Zugzwang:', 'when every move', 'makes things worse'],
  eyebrow: 'Chess concepts · endgames',
  ogEyebrow: 'Chess concepts',
  readMin: 6,
  flip: 0,
  hero: { line: TREB + '|', flip: 0, cap: 'The trébuchet: whoever has to move loses.' },
  intro: "Zugzwang is a German word meaning “compulsion to move”. In chess you can't pass, so sometimes having to move is a disaster: every legal move makes your position worse. It decides many endgames, and once you understand it, you'll win positions that look like draws.",
  head: () => `<div class="answer-box"><p class="answer-label">Quick answer</p><p><b>Zugzwang</b> is a position where the player to move would rather pass, because <b>every legal move makes their position worse</b>. Chess doesn't allow passing, so they have to weaken themselves. It's most common in king and pawn endgames. In ${mv(TREB + '|', 'the trébuchet')}, whoever is on move loses their pawn and the game.</p></div>
${keyFacts([
  ['Meaning', '“Compulsion to move” (German)'],
  ['Where', 'Mostly endgames, especially king and pawn endings'],
  ['Key idea', 'Having the move is a disadvantage'],
  ['Related', `The opposition, triangulation and <a href="/learn/stalemate/">stalemate</a>`],
])}${ideas([
  ['⏳', "You can't pass", 'Every turn you must make a move, even a bad one.'],
  ['↔️', 'Whoever moves loses', 'In mutual zugzwang, the turn decides the game.'],
  ['👑', 'The opposition', 'Kings facing each other: the side to move gives way.'],
  ['🧮', 'Count the tempo', 'Spare pawn moves let you hand the move back.'],
  ['🎯', 'Squeeze first', 'Take away useful moves and the win often comes by itself.'],
])}`,
  body: () => [
`<h2 id="what-is">What does zugzwang mean?</h2>
${story({ line: TREB + '|', hl: 'c4,c5', arrows: '!b5c5,!d4c4', cap: 'Both kings attack a pawn. Whoever moves must let their own pawn go.', cls: 'prose' }, `Here both kings attack the enemy pawn, and each pawn is defended only by its own king. If White has to move, the king must step away from c4 and Black takes it. If Black has to move, White takes c5 instead. Whoever is on move loses. This position is called the <strong>trébuchet</strong>, and it's the purest example of <strong>mutual zugzwang</strong>.`)}${quickCheck('In the trébuchet, who is better if it is White to move?', ['Black', 'White', "Nobody, it's a draw"], 0, 'White must move the king away from c4, so Black wins the pawn and the game.')}`,
{ trainer: { title: 'The trébuchet', orientation: 'white', practiceSide: 'white', intro: 'Black is on move, so Black is in zugzwang. In Practice mode you play White.', moves: TREBB + '|Ke4 Kxc5 Ke5 Kb5 Ke6 c5', notes: [
  'Black has to move, and every king move abandons the c5 pawn.',
  'White wins the pawn.',
  "Black's king hurries back toward the c-pawn.",
  'White clears the way for the pawn.',
  'Too slow.',
  'The pawn runs, and Stockfish rates White as winning.'] } },
`<h2 id="opposition">The opposition: zugzwang in pawn endgames</h2>
${story({ line: OPP + '|', hl: 'e4,e6', arrows: '', cap: 'Kings face each other with one square between: the side to move gives way.' }, `The most useful kind of zugzwang is the <strong>opposition</strong>. When the kings face each other with one square between them, the side that has to move must give way. In this position, if Black is to move, Black's king has to step aside and White's king marches forward: Stockfish says White wins. If White is to move, it's only a draw. Same position, different result, just because of whose turn it is.`)}${quickCheck("Kings on e4 and e6, White pawn on e3. If you're White, who do you want to be on move?", ['Black', 'White'], 0, "If Black has to move, Black's king gives way and White wins. If White has to move, it's a draw.")}`,
{ trainer: { title: 'Winning with the opposition', orientation: 'white', practiceSide: 'white', intro: 'Black is on move and has to give way. In Practice mode you play White.', moves: OPP + '|Kd6 Kf5 Ke7 Ke5 Kf7 Kd6 Kf6 e4', notes: [
  'Black is in zugzwang and must give way.',
  "White's king goes forward on the other side.",
  'Black stays close to the pawn.',
  'White takes the opposition again.',
  'Black has to step aside once more.',
  "White's king reaches the sixth rank, in front of its pawn.",
  'Black waits.',
  'With the king leading the way, the pawn now advances safely. White is winning.'] } },
`<h2 id="middlegame">Zugzwang in the middlegame</h2>
<p>Zugzwang is rare with lots of pieces on the board, because there are usually harmless waiting moves. It appears when one side is completely tied up: every piece is guarding something, and any move lets something go. The famous game Sämisch–Nimzowitsch (Copenhagen, 1923), often called the "Immortal Zugzwang Game", ends exactly like that.</p>
<h2 id="use">How to use zugzwang in your games</h2>
<ul>
<li><strong>In king and pawn endgames, count who will be on move.</strong> Often the winner is simply the player who gets the opposition.</li>
<li><strong>Keep waiting moves in reserve.</strong> A spare pawn move, or a king move that keeps everything protected, can hand the move back to your opponent.</li>
<li><strong>Learn triangulation.</strong> A king can "lose" a move by walking in a small triangle, putting the opponent in zugzwang.</li>
<li><strong>Squeeze before you strike.</strong> Take away your opponent's useful moves first; the winning breakthrough often comes by itself.</li>
</ul>
<!-- AD SLOT (mid article) — add after AdSense approval -->
<h2 id="mistakes">Common mistakes</h2>
<ul>
<li><strong>Rushing the king forward.</strong> Walking straight at the enemy king often gives away the opposition.</li>
<li><strong>Pushing pawns too early.</strong> Pawn moves are your spare tempi. Keep them for when you need to pass the move.</li>
<li><strong>Forgetting about stalemate.</strong> When your opponent has no moves at all, it isn't zugzwang, it's <a href="/learn/stalemate/">stalemate</a>, and that's a draw.</li>
</ul>
<div class="callout clubtip" data-lx><p class="mine-h">💡 Club-level tip</p><p>In any king and pawn endgame, before you move your king, ask yourself: after my move, who has the opposition? That one question wins (and saves) a lot of club games. You'll also find zugzwang among our <a href="/tactics/">28 tactics</a>.</p></div>`,
  ],
  faq: [
    ['What does zugzwang mean?', "It's German for 'compulsion to move'. In chess it describes a position where any move the player makes worsens their position."],
    ['How do you pronounce zugzwang?', 'Roughly TSOOK-tsvahng, the German way. Many English speakers say ZUG-zwang, and both are understood.'],
    ['What is the difference between zugzwang and stalemate?', "In zugzwang the player has legal moves, but they all hurt. In stalemate the player has no legal move at all and isn't in check, and the game is a draw."],
    ['What is mutual zugzwang?', 'A position where whoever has to move is worse off, like the trébuchet. The result depends only on whose turn it is.'],
    ['Is zugzwang only in endgames?', 'Mostly, but not only. It can happen in the middlegame when one side is completely tied up, as in Sämisch–Nimzowitsch, 1923.'],
  ],
  quiz: { side: 'w', flip: 0, ask: 'Find the king move that wins.', items: [
    { line: '8/8/4k3/8/8/4K3/4P3/8 w - - 0 1|', answer: 'Ke4', pool: ['Kf3', 'Kd3'], note: 'Take the opposition: now Black has to give way.' },
    { line: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1|', answer: 'Kd6', pool: ['Kd5', 'Kf5'], note: "Stay on the sixth rank. Retreating throws the win away." },
    { line: '4k3/8/8/4K3/4P3/8/8/8 w - - 0 1|', answer: 'Ke6', pool: ['Kf5', 'Kd5'], note: 'The king goes in front of its pawn, to the sixth rank.' },
    { line: '8/8/3k4/8/8/3K4/3P4/8 w - - 0 1|', answer: 'Kd4', pool: ['Kc3', 'Ke3'], note: 'Take the opposition with the king in front of the pawn.' },
  ] },
  related: [
    { href: '/learn/stalemate/', line: S1 + '|Qb6', flip: 0, tag: 'Rules', tagCls: '', title: 'Stalemate', text: 'No legal move and not in check: a draw.' },
    { href: '/endgames/', line: '', flip: 0, tag: 'Endgames', tagCls: '', title: 'Basic endgames', text: 'Practice the basic checkmates and king and pawn endings.' },
    { href: '/tactics/', line: '', flip: 0, tag: 'Tactics', tagCls: '', title: 'Chess tactics', text: '28 patterns with puzzles, zugzwang included.' },
  ],
},
];
