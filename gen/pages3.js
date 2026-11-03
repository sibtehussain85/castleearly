// Learn-section page: En passant (Nov 3, 2026). Lines "FEN|moves" start from a custom position.
// Every position below was checked with Stockfish 19 (depth 16-18) before publishing.
const { mv, story, quickCheck, ideas, keyFacts } = require('./lib');

const FR = 'e4 e6 e5 d5';                                         // White's e5-pawn vs ...d7-d5
const BL = '4k3/8/8/8/3p4/8/4P3/4K3 w - - 0 1';                    // Black's d4-pawn vs e2-e4 (diagram only)
const PIN = '4k3/2p5/8/KP5r/8/8/8/8 b - - 0 1';                  // ...c5: bxc6 e.p. would be illegal
const MATE = 'r2q1rn1/ppp2ppk/8/7P/5N2/8/PBP2PP1/2KQ3R b - - 0 1'; // ...g5?? hxg6 e.p.# (double check)
const RACE = '8/6p1/8/7P/8/5k2/8/1K6 b - - 0 1';                 // ...g5: hxg6 e.p. and the pawn queens
const CHK = '2r3k1/3p1ppp/8/4P3/4K3/8/5PPP/5R2 b - - 0 1';        // ...d5+: exd6 e.p. removes the checking pawn
const DISC = 'r3kb1r/ppqp1ppp/2n3n1/4P3/6b1/2N2N2/PPP2PPP/R1BQRBK1 b - - 0 1'; // ...d5: exd6 e.p.+ then dxc7
const FORK = 'r1bq1rk1/pppp1ppp/2n5/4P3/2B1N3/8/PPP1QPPP/R4RK1 b - - 0 1';      // ...d5 forks Bc4 and Ne4
const S1 = 'k7/8/2K5/8/8/8/8/1Q6 w - - 0 1';

module.exports = [
{
  sec: 'learn',
  slug: 'en-passant',
  date: '2026-11-03',
  name: 'En passant',
  title: 'En Passant in Chess: Rules and Examples',
  desc: 'En passant is a special pawn capture: take a pawn that moved two squares past yours, on the very next move only. Rules, examples and practice.',
  ogTitle: 'En Passant in Chess: The Rule Explained With Examples',
  h1: 'En passant: the chess rule explained',
  ogLines: ['En passant:', 'the chess rule', 'explained'],
  eyebrow: 'Chess rules · pawns',
  ogEyebrow: 'Chess rules',
  readMin: 7,
  flip: 0,
  hero: { line: FR, flip: 0, cap: 'Black just played ...d7-d5. White can take en passant: exd6.' },
  intro: "En passant is the chess rule that surprises almost every new player. The first time it happens, it looks like a bug: a pawn captures sideways onto an empty square, and the pawn next to it disappears. It's a real rule, it has been part of chess for centuries, and it takes about two minutes to learn. Here's exactly how it works.",
  head: () => `<div class="answer-box"><p class="answer-label">Quick answer</p><p><b>En passant</b> (French for “in passing”) is a special pawn capture. When a pawn moves <b>two squares</b> from its starting square and lands <b>right beside an enemy pawn</b>, that enemy pawn may capture it <b>as if it had moved only one square</b>. It is allowed <b>only on the very next move</b>. For example, after ${mv(FR, '1.e4 e6 2.e5 d5')}, White can play ${mv(FR + ' exd6', '3.exd6')}: the e5-pawn moves to d6 and the pawn on d5 is removed.</p></div>
${keyFacts([
  ['Who', 'Only a pawn can capture en passant, and only a pawn can be captured'],
  ['When', 'Immediately after the enemy pawn moves two squares, or never'],
  ['Where', 'Your pawn must be on its fifth rank: rank 5 for White, rank 4 for Black'],
  ['Notation', 'Written like a normal pawn capture, e.g. exd6 (adding “e.p.” is optional)'],
])}${ideas([
  ['♟', 'Pawns only', 'No other piece can capture en passant.'],
  ['⏱', 'Now or never', 'Wait one move and the chance is gone.'],
  ['5️⃣', 'Fifth rank', 'Your pawn must already be far up the board.'],
  ['↗️', 'Lands behind', 'Your pawn goes to the square the enemy pawn skipped.'],
  ['🤷', 'Optional', "You don't have to take, unless it's your only legal move."],
])}`,
  body: () => [
`<h2 id="what-is">What is en passant?</h2>
${story({ line: FR, hl: 'd5,e5', arrows: 'e5d6', cap: 'Black\'s pawn jumped from d7 to d5, past the d6 square that White\'s e5-pawn attacks.', cls: 'prose' }, `A pawn on its starting square may move one or two squares forward. The two-square move was added to speed the game up, but it created a loophole: a pawn could jump straight past an enemy pawn that was waiting to capture it. En passant closes that loophole. In this position, after ${mv(FR, '1.e4 e6 2.e5 d5')}, Black's d-pawn has jumped past d6, the square White's e5-pawn attacks. White may capture it anyway, exactly as if it had only moved to d6.`)}${story({ line: FR + ' exd6', hl: 'e5,d6', arrows: '', cap: 'After exd6: White\'s pawn lands on d6 and the black pawn on d5 is removed.', cls: 'prose' }, `After ${mv(FR + ' exd6', '3.exd6')}, White's pawn moves diagonally to d6, an empty square, and the black pawn on d5 is taken off the board. That's the only capture in chess where the capturing piece doesn't land on the square of the piece it takes.`)}${quickCheck("Black's f-pawn moves from f7 to f5 and lands next to your pawn on e5. If you capture en passant, where does your pawn go?", ['f6', 'f5', 'e6'], 0, 'Your pawn lands on f6, the square the black pawn passed over, and the pawn on f5 is removed.')}`,
{ trainer: { title: 'Your first en passant', orientation: 'white', practiceSide: 'white', intro: 'Watch White capture en passant on move 3. In Practice mode you play White.', moves: FR + ' exd6 Bxd6', notes: [
  'White starts with the king\'s pawn.',
  'Black plays the French Defense.',
  'White pushes on to e5. This pawn is now on its fifth rank.',
  'Black moves the d-pawn two squares. It lands on d5, right beside the e5-pawn, after passing d6.',
  'En passant! The e5-pawn captures as if Black had played only ...d6. It moves to d6 and the pawn on d5 is removed.',
  'Black takes back. Stockfish rates the position as equal.'] } },
`<h2 id="rules">The en passant rules, step by step</h2>
<p>An en passant capture is legal only when <strong>all four</strong> of these are true:</p>
<ol>
<li><strong>Your pawn is on its fifth rank.</strong> For White that's the 5th rank, for Black the 4th rank.</li>
<li><strong>An enemy pawn moves two squares</strong> from its starting square in one move.</li>
<li><strong>It lands right beside your pawn</strong>, on the same rank and an adjacent file.</li>
<li><strong>You capture on the very next move.</strong> If you play anything else first, the right is lost for good.</li>
</ol>
<p>Your pawn then moves diagonally forward to the square the enemy pawn passed over, and the enemy pawn is removed. Everything else is a normal move: if the capture would leave your own king in check, it's illegal, just like any other move.</p>
${story({ line: BL + '|', hl: 'd4,e2', arrows: 'e2e4,~d4e3', cap: 'If White plays e2-e4, Black\'s d4-pawn may capture it en passant by moving to e3.' }, `<strong>It works the same way for Black.</strong> Here Black's pawn is on d4, Black's fifth rank. If White plays e2-e4, the pawn jumps over e3, a square the d4-pawn attacks, so Black may answer ...dxe3, landing on e3 and removing the pawn on e4.`)}
${quickCheck('Black pushed the d-pawn two squares, but you made a different move. Can you still capture it en passant on your next turn?', ['No', 'Yes', 'Only with check'], 0, 'En passant is only allowed on the move right after the two-square pawn move. After that, the chance is gone.')}
<h2 id="when-not">When you can't capture en passant</h2>
<ul>
<li><strong>The pawn moved only one square.</strong> Then it didn't pass your pawn, so there's nothing to capture “in passing”.</li>
<li><strong>The pawn arrived beside yours in two separate moves.</strong> Only a single two-square move counts.</li>
<li><strong>You waited a move.</strong> The right expires immediately.</li>
<li><strong>It isn't a pawn.</strong> Knights, bishops and other pieces can never capture or be captured en passant.</li>
</ul>
${story({ tag: 'p', line: PIN + '|c5', hl: 'b5,c5', arrows: '!h5a5', cap: 'bxc6 e.p. is illegal: removing both pawns would expose White\'s king to the rook.' }, `<strong>A tricky case: the pin along the rank.</strong> After ${mv(PIN + '|c5', '...c5')}, White's b5-pawn would normally be able to take en passant. But capturing would remove <em>both</em> pawns from the fifth rank at once, and the rook on h5 would then attack White's king on a5. A move that leaves your own king in check is illegal, so bxc6 is not allowed here.`)}
<!-- AD SLOT (mid article) — add after AdSense approval -->`,
{ trainer: { title: 'En passant in the endgame', orientation: 'white', practiceSide: 'white', intro: 'Black plays ...g5 to get past your pawn. In Practice mode you play White.', moves: RACE + '|g5 hxg6 Kg4 g7 Kf5 g8=Q', notes: [
  'Black pushes the g-pawn two squares, trying to slip past White\'s h5-pawn and run for g1.',
  'En passant! The h5-pawn takes on g6, and Black has no pawns left.',
  "Black's king heads back, but it is two moves too slow.",
  'The pawn keeps running.',
  'Black can\'t reach g8 in time.',
  'A new queen. Stockfish sees a forced checkmate for White.'] } },
`<h2 id="tactics">En passant with check and checkmate</h2>
<p>Because en passant opens a line and puts a pawn on a new square at the same moment, it can create surprising attacks. An en passant capture can give check, uncover a check from a piece behind it, or even capture a pawn that is giving check.</p>
${story({ tag: 'p', line: MATE + '|g5 hxg6', hl: 'h5,g6,h7', arrows: '!h1h7,!g6h7', cap: 'hxg6 e.p. is checkmate: double check from the rook and the new pawn.' }, `Here Black attacked the knight with ${mv(MATE + '|g5', '1...g5??')}, and ${mv(MATE + '|g5 hxg6', '2.hxg6#')} is checkmate. The pawn leaving h5 opens the h-file for the rook on h1, and the pawn landing on g6 checks the king too. It's a <strong>double check</strong>, so the king must move, but g8 is blocked by Black's own knight, g7 is covered by the bishop on b2, g6 is protected by the knight, and h6 and h8 are on the rook's file. A famous real game, Gundersen–Faul (Melbourne, 1928), ended with a very similar en passant checkmate by double check.`)}
<h2 id="notation">How to write en passant</h2>
<p>In <a href="/learn/chess-notation/">algebraic notation</a>, en passant is written like any pawn capture: the file the pawn came from, “x”, and the square it lands on. White's capture above is <strong>exd6</strong>. You can add <strong>e.p.</strong> (exd6 e.p.) to make it clear, but it's optional. In a FEN, the computer format for a position, the square right behind a pawn that has just moved two squares (d6 in our example) is written in the en passant field. Some programs write it after every two-square pawn move, others only when an en passant capture is actually possible.</p>
<h2 id="history">Why does en passant exist?</h2>
<p>In early chess, pawns could only move one square at a time. Sometime between the 13th and 16th centuries, players in Europe added the two-square first move to speed up the opening. En passant was added so that this new move couldn't be used to sneak a pawn past an enemy pawn without risk. It's already described in Ruy López's chess book of 1561, but it wasn't accepted everywhere at once: Italy only adopted it, along with the other international rules, in 1880. Today it's part of the official FIDE Laws of Chess and the US Chess rules.</p>
<h2 id="mistakes">Common mistakes</h2>
<ul>
<li><strong>Not knowing the rule exists.</strong> Many casual players think their opponent cheated or the app glitched. Chess apps only allow legal moves, so if it happened, it was legal.</li>
<li><strong>Trying it too late.</strong> If you don't capture right away, the chance is gone.</li>
<li><strong>Trying it after a one-square move.</strong> Only a two-square move can be captured en passant.</li>
<li><strong>Forgetting your opponent can do it too.</strong> Before pushing a pawn two squares past an enemy pawn, check what happens after the en passant capture.</li>
</ul>
<div class="callout clubtip" data-lx><p class="mine-h">💡 Club-level tip</p><p>Whenever one of your pawns reaches the fifth rank, look at the pawns on the files next to it. If one of them is still on its starting square, a two-square push will give you an en passant chance, and if it moves only one square, it walks into a normal capture. Either way, your advanced pawn is guarding both squares. Read more about pawns in <a href="/learn/special-moves/">castling, en passant and promotion</a>, or try the en passant trick in our <a href="/tactics/#en-passant">tactics puzzles</a>.</p></div>`,
  ],
  faq: [
    ['What is en passant in chess?', 'A special pawn capture. When a pawn moves two squares from its starting square and lands beside an enemy pawn, that enemy pawn may capture it as if it had moved only one square, but only on the very next move.'],
    ['Is en passant forced?', "No. Under the official rules it's optional, like any other capture. The only exception is when en passant is your only legal move: then you have to play it."],
    ['Can you capture en passant after waiting a move?', 'No. The capture must be made immediately, on the move right after the two-square pawn move. If you play anything else, the right is lost.'],
    ['Can a pawn capture en passant if the enemy pawn moved one square?', 'No. En passant only applies to a pawn that has just moved two squares from its starting square.'],
    ['Can en passant be checkmate?', 'Yes. An en passant capture can give check, uncover a check from another piece, or both at once. Gundersen–Faul (Melbourne, 1928) ended with an en passant checkmate by double check.'],
    ['Can you capture en passant to get out of check?', 'Yes, if the pawn giving check has just moved two squares. Capturing it en passant removes the checking pawn, as long as the capture does not leave your king in check some other way.'],
    ['How do you pronounce en passant?', 'Roughly “on pa-SAHN”. It is French for “in passing”. Many English speakers say “en PASS-ant”, and both are understood.'],
    ['Why is en passant such a popular joke online?', 'Because so many casual players have never heard of it, it looks like a bug the first time it happens. Online chess communities turned that surprise into a long-running joke.'],
  ],
  quiz: { side: 'w', flip: 0, ask: 'Black just moved a pawn two squares. Find the best move for White.', items: [
    { line: CHK + '|d5+', answer: 'exd6', pool: ['Kxd5', 'Kd4'], note: 'En passant gets out of check, wins a pawn and gives you a passed pawn on d6.' },
    { line: FORK + '|d5', answer: 'exd6', pool: ['Bd3', 'Bb5'], note: 'En passant removes the pawn that was forking your bishop and knight.' },
    { line: DISC + '|d5', answer: 'exd6+', pool: ['Nxd5', 'Qxd5'], note: 'Discovered check from the rook on e1, and the new pawn on d6 also attacks the queen. Black will lose the queen.' },
    { line: RACE + '|g5', answer: 'hxg6', pool: ['Kc2', 'Ka2'], note: "Take it! Black has no pawns left, and the black king is too far away to stop your g-pawn." },
    { line: MATE + '|g5', answer: 'hxg6#', pool: ['Nh3', 'Nd3'], note: 'Checkmate by double check: the rook on h1 and the new pawn on g6.' },
  ] },
  related: [
    { href: '/learn/special-moves/', line: FR, flip: 0, tag: 'Rules', tagCls: '', title: 'Special moves', text: 'Castling, en passant and promotion in one lesson.' },
    { href: '/learn/stalemate/', line: S1 + '|Qb6', flip: 0, tag: 'Rules', tagCls: '', title: 'Stalemate', text: 'No legal move and not in check: a draw.' },
    { href: '/learn/chess-notation/', line: '', flip: 0, tag: 'Rules', tagCls: '', title: 'Chess notation', text: 'How to read and write chess moves like exd6.' },
  ],
},
];
