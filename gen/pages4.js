// Learn-section page: Smothered mate (Nov 13, 2026). Lines "FEN|moves" start from a custom position.
// Every position below was checked with the site engine and Stockfish 19 before publishing.
const { mv, story, quickCheck, ideas, keyFacts } = require('./lib');

const BASIC = '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1';                 // Nf7#: the pattern in one move
const PHIL = 'r1r3k1/pp4pp/8/6N1/q7/8/PP2Q1PP/7K w - - 0 1';        // Philidor's legacy: Qe6+ ... Qg8+!! Rxg8 Nf7#
const PHILM = 'Qe6+ Kh8 Nf7+ Kg8 Nh6+ Kh8 Qg8+ Rxg8 Nf7#';
const PINH = '6rk/6pp/8/8/5N2/8/8/6KR w - - 0 1';                  // Ng6#: the h-pawn is pinned
const CARO = 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nd7 Qe2 Ngf6';              // 6.Nd6#
const BUDA = 'd4 Nf6 c4 e5 dxe5 Ng4 Bf4 Nc6 Nf3 Bb4+ Nbd2 Qe7 a3 Ngxe5 axb4'; // 8...Nd3#
const BSG = 'e4 e5 Nf3 Nc6 Bc4 Nd4 Nxe5 Qg5 Nxf7 Qxg2 Rf1 Qxe4+ Be2';         // 7...Nf3#
const S1 = 'k7/8/2K5/8/8/8/8/1Q6 w - - 0 1';
const FR = 'e4 e6 e5 d5';

module.exports = [
{
  sec: 'learn',
  slug: 'smothered-mate',
  date: '2026-11-13',
  name: 'Smothered mate',
  title: 'Smothered Mate in Chess: Pattern, Examples and Traps',
  desc: "A smothered mate is checkmate by a knight when the king is boxed in by its own pieces. Learn the pattern, Philidor's legacy, three opening traps and practice.",
  ogTitle: "Smothered Mate in Chess: The Pattern, Philidor's Legacy and Opening Traps",
  h1: 'Smothered mate: checkmate with a single knight',
  ogLines: ['Smothered mate:', 'checkmate with', 'a single knight'],
  eyebrow: 'Checkmate patterns · knights',
  ogEyebrow: 'Checkmate patterns',
  readMin: 8,
  flip: 0,
  hero: { line: BASIC + '|Nf7#', flip: 0, cap: 'Nf7#: the king is trapped by its own rook and pawns.' },
  intro: "A smothered mate is one of the prettiest checkmates in chess: a lone knight gives check, and the king can't move because its own pieces are standing on every escape square. It often comes with a queen sacrifice, and it also turns up in a few well-known opening traps. Here is the pattern, how to set it up, and how to stop it happening to you.",
  head: () => `<div class="answer-box"><p class="answer-label">Quick answer</p><p>A <b>smothered mate</b> is a checkmate delivered by a <b>knight</b> when the enemy king has <b>no free squares because its own pieces surround it</b>. A knight's check can't be blocked, so if the knight can't be captured, the game is over. The classic example is a king on h8 hemmed in by a rook on g8 and pawns on g7 and h7: a knight landing on f7 is checkmate, as in ${mv(BASIC + '|Nf7#', 'Nf7#')}.</p></div>
${keyFacts([
  ['Mating piece', 'Always a knight'],
  ['Why it works', "The king's own pieces take away every escape square, and a knight check cannot be blocked"],
  ['Most common squares', 'Knight on f7 against a king on h8 (f2 against a king on h1)'],
  ['Famous version', "Philidor's legacy: a queen sacrifice on g8, then Nf7#"],
  ['Also called', "Philidor's legacy (the queen-sacrifice version)"],
])}${ideas([
  ['♞', 'Knight only', 'Only a knight can jump over the wall of pieces.'],
  ['🧱', 'Own pieces block', "The king is trapped by its own rook and pawns, not by yours."],
  ['👑', 'Queen sacrifice', 'Give the queen on g8 to force a rook onto the last free square.'],
  ['✌️', 'Double check', 'Queen and knight checking together force the king into the corner.'],
  ['🪟', 'The cure', 'One pawn move (h6 or g6) gives the king air.'],
])}`,
  body: () => [
`<h2 id="what-is">What is a smothered mate?</h2>
${story({ line: BASIC + '|', hl: 'h8,g8,g7,h7', arrows: 'g5f7', cap: "Black's king has no free square: g8, g7 and h7 are all taken by Black's own pieces.", cls: 'prose' }, `Look at Black's king on h8. It has three neighbouring squares, g8, g7 and h7, and every one of them is occupied by a black piece. The king is safe from most attacks behind that wall, but it also can't move at all. It has been <strong>smothered</strong>.`)}${story({ line: BASIC + '|Nf7#', hl: 'g5,f7,h8', arrows: '!f7h8', cap: 'Nf7#. Nothing can capture the knight, a knight check cannot be blocked, and the king cannot move.', cls: 'prose' }, `Now White plays ${mv(BASIC + '|Nf7#', 'Nf7#')}. There are only three ways to answer a check: move the king, capture the checking piece, or block the check. The king can't move, nothing attacks f7, and a knight's check <strong>can never be blocked</strong>, because the knight jumps. That's checkmate, with a single piece.`)}${quickCheck('Why can a check from a knight never be blocked?', ['The knight jumps, so there is no square in between', 'Knights are worth more than pawns', 'Only queens can be blocked'], 0, 'A queen, rook or bishop checks along a line, so a piece can step in between. A knight jumps straight to its square, so there is nothing to block.')}`,
{ trainer: { title: "Philidor's legacy: the queen sacrifice", orientation: 'white', practiceSide: 'white', intro: 'White forces a smothered mate in five moves by giving away the queen. In Practice mode you play White.', moves: PHIL + '|' + PHILM, notes: [
  'The queen checks on the long diagonal to g8. If Black steps to f8, Qf7 is checkmate at once.',
  'So the king goes into the corner.',
  'The knight checks from f7. Black cannot capture it.',
  'The king has to come back out.',
  'Double check! The knight checks from h6 and uncovers the queen. In a double check the king must move.',
  'Back into the corner. (On f8 it would again be mate by Qf7.)',
  'The key move: the queen is sacrificed on g8. The king cannot take, because the knight on h6 protects the queen.',
  'The rook has to capture, and now it fills the last free square next to the king.',
  'Smothered mate. The king is boxed in by its own rook and pawns.'] } },
`<h2 id="philidor">Philidor's legacy, step by step</h2>
<p>You'll rarely find the king already boxed in. Usually you have to <em>force</em> the last blocking piece onto the board, and the best-known way to do it is called <strong>Philidor's legacy</strong>. You need a queen and a knight near the enemy king, and the enemy king on g8 with its g- and h-pawns still at home.</p>
<ol>
<li>${story({ tag: 'span', line: PHIL + '|Qe6+', arrows: '!e6g8', cap: 'Step 1: the queen checks on the diagonal that leads to g8.' }, `<strong>Check on the diagonal.</strong> ${mv(PHIL + '|Qe6+', '1.Qe6+')} drives the king to h8. (After 1...Kf8, 2.Qf7 is mate.)`)}</li>
<li>${story({ tag: 'span', line: PHIL + '|Qe6+ Kh8 Nf7+ Kg8 Nh6+', arrows: '!h6g8,!e6g8', cap: 'Step 2: double check from the knight and the queen.' }, `<strong>Knight to f7, then double check.</strong> After ${mv(PHIL + '|Qe6+ Kh8 Nf7+', '2.Nf7+')} Kg8, the knight jumps away with ${mv(PHIL + '|Qe6+ Kh8 Nf7+ Kg8 Nh6+', '3.Nh6+')}. The knight and the queen both give check, so Black can't block or capture: the king must go back to h8.`)}</li>
<li>${story({ tag: 'span', line: PHIL + '|Qe6+ Kh8 Nf7+ Kg8 Nh6+ Kh8 Qg8+', arrows: 'h6g8,~c8g8', cap: 'Step 3: the queen sacrifice. Only the rook can take.' }, `<strong>Sacrifice the queen.</strong> ${mv(PHIL + '|Qe6+ Kh8 Nf7+ Kg8 Nh6+ Kh8 Qg8+', '4.Qg8+!!')} looks like a blunder, but the knight on h6 protects the queen, so the king can't capture. Black must play ...Rxg8.`)}</li>
<li>${story({ tag: 'span', line: PHIL + '|' + PHILM, arrows: '!f7h8', cap: 'Step 4: Nf7#. The rook on g8 now blocks its own king.' }, `<strong>Knight back to f7.</strong> ${mv(PHIL + '|' + PHILM, '5.Nf7#')}. The rook that just took your queen is now part of the wall.`)}</li>
</ol>
<p>The pattern is named after the French master François-André Philidor, but it is much older: it already appears in Luis Ramírez de Lucena's chess book of 1497, one of the oldest printed chess books that survives.</p>
${quickCheck("In Philidor's legacy, why can't the king simply capture the queen on g8?", ['The knight on h6 protects the queen', 'Kings cannot capture queens', 'The king is in stalemate'], 0, 'The knight on h6 guards g8, and a king can never capture a protected piece. So the rook has to take, and that smothers the king.')}
<!-- AD SLOT (mid article) — add after AdSense approval -->
<h2 id="openings">Smothered mate in the opening: three traps</h2>
<p>Smothered mates don't only happen in the corner. In the opening, the king is still in the middle with its own queen, bishops and pawns packed around it, and sometimes a pawn that could capture the knight is <strong>pinned</strong>. Three traps are worth knowing.</p>
<h3 id="caro-kann">1. The Caro-Kann trap: 6.Nd6#</h3>
${story({ tag: 'p', line: CARO + ' Nd6#', hl: 'e4,d6,e8', arrows: '!d6e8,!e2e7', cap: '6.Nd6#. The e7-pawn cannot take the knight: it is pinned by the queen on e2.' }, `After ${mv('e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nd7 Qe2', '1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Nd7 5.Qe2')}, White's queen move looks odd, but it sets a trap. If Black develops naturally with ${mv(CARO, '5...Ngf6??')}, then ${mv(CARO + ' Nd6#', '6.Nd6#')} is checkmate. The pawn on e7 can't capture the knight because it is pinned to the king by the queen on e2. Black should play 5...Ndf6 instead, which Stockfish rates as about equal.`)}`,
{ trainer: { title: 'Caro-Kann trap: mate in 6 moves', orientation: 'white', practiceSide: 'white', intro: 'A real opening trap in the Caro-Kann Defense. In Practice mode you play White.', moves: CARO + ' Nd6#', notes: [
  "White opens with the king's pawn.",
  'The Caro-Kann Defense.',
  'White takes the centre.',
  'Black challenges it.',
  'White defends the e-pawn.',
  'Black captures.',
  'The knight recaptures and sits in the centre.',
  'Black prepares ...Ngf6 so that a knight can recapture on f6.',
  'The trap. The queen lines up with the black king behind the knight.',
  'The natural move, and a blunder. 5...Ndf6 was correct.',
  'Smothered mate. The e7-pawn is pinned by the queen, so it cannot take the knight.'] } },
`<h3 id="budapest">2. The Budapest Gambit trap: 8...Nd3#</h3>
${story({ tag: 'p', line: BUDA + ' Nd3#', hl: 'e5,d3,e1', arrows: '!d3e1,!e7e2', cap: '8...Nd3#. The e2-pawn is pinned by the queen on e7.' }, `This one is for Black. In the <strong>Budapest Gambit</strong>, after ${mv('d4 Nf6 c4 e5 dxe5 Ng4 Bf4 Nc6 Nf3 Bb4+ Nbd2 Qe7 a3 Ngxe5', '1.d4 Nf6 2.c4 e5 3.dxe5 Ng4 4.Bf4 Nc6 5.Nf3 Bb4+ 6.Nbd2 Qe7 7.a3 Ngxe5')}, Black's bishop on b4 looks like a free piece. But if White grabs it with ${mv(BUDA, '8.axb4??')}, then ${mv(BUDA + ' Nd3#', '8...Nd3#')} ends the game. White's e2-pawn is pinned by the queen on e7, and the king is smothered by its own queen, bishop and knights. White should play 8.Nxe5 instead.`)}
<h3 id="blackburne">3. The Blackburne Shilling trap: 7...Nf3#</h3>
${story({ tag: 'p', line: BSG + ' Nf3#', hl: 'd4,f3,e1', arrows: '!f3e1,!e4e2', cap: '7...Nf3#. The bishop on e2 is pinned by the queen, so it cannot take the knight.' }, `After ${mv('e4 e5 Nf3 Nc6 Bc4 Nd4', '1.e4 e5 2.Nf3 Nc6 3.Bc4 Nd4')}, Black offers the e5-pawn. If White takes it with ${mv('e4 e5 Nf3 Nc6 Bc4 Nd4 Nxe5', '4.Nxe5?')}, then ${mv('e4 e5 Nf3 Nc6 Bc4 Nd4 Nxe5 Qg5', '4...Qg5!')} attacks the knight and the g2-pawn together. The greedy ${mv('e4 e5 Nf3 Nc6 Bc4 Nd4 Nxe5 Qg5 Nxf7', '5.Nxf7??')} loses to 5...Qxg2 6.Rf1 Qxe4+ 7.Be2 ${mv(BSG + ' Nf3#', 'Nf3#')}. The simple answer is 4.Nxd4 (or 4.O-O), and White is a little better.`)}
<h2 id="pinned">The pinned-pawn version</h2>
${story({ tag: 'p', line: PINH + '|Ng6#', hl: 'f4,g6,h7', arrows: '!g6h8,!h1h7', cap: 'Ng6#. The h7-pawn would like to capture, but it is pinned by the rook on h1.' }, `All three opening traps share one idea: a pawn that <em>could</em> take the knight is pinned. The same thing happens in the corner. Here ${mv(PINH + '|Ng6#', 'Ng6#')} is checkmate even though the h7-pawn attacks g6, because that pawn is pinned to its king by the rook on h1. When you see a boxed-in king, check whether the pieces guarding the knight's square are really free to move.`)}
<h2 id="how-to-spot">How to spot a smothered mate</h2>
<ul>
<li><strong>The enemy king has few or no free squares</strong>, and its own pieces are the reason.</li>
<li><strong>You have a knight within one or two jumps</strong> of a checking square (f7, g6, h6 against a castled king; d6, d3, f3, f6 against a king in the middle).</li>
<li><strong>The checking square can't be captured</strong>, or the piece guarding it is pinned.</li>
<li><strong>One square is still free?</strong> Look for a sacrifice that forces an enemy piece onto it, like Qg8+ in Philidor's legacy.</li>
</ul>
<h2 id="defend">How to avoid being smothered</h2>
<ul>
<li><strong>Give your king air.</strong> A quiet pawn move like h3 or h6 (often called “luft”) gives the king an escape square and ends most smothered-mate ideas.</li>
<li><strong>Watch for a queen and knight together</strong> near your king. They are the two pieces that work best as a team.</li>
<li><strong>Be careful with Kh8 or Kh1</strong> when an enemy knight can reach f7 or f2 with check.</li>
<li><strong>Check your pinned pawns.</strong> In the Caro-Kann and Budapest traps the losing side had a pawn attacking the knight's square, but it was pinned.</li>
<li><strong>Don't grab “free” pieces without looking.</strong> In two of the three traps above, the losing move was a greedy capture.</li>
</ul>
<div class="callout clubtip" data-lx><p class="mine-h">💡 Club-level tip</p><p>When your opponent's knight comes close to your king, count your king's free squares before you do anything else. If the answer is zero, make an escape square now. To practise knight checks and forks, try our <a href="/tactics/">tactics puzzles</a>, and see <a href="/openings/caro-kann-defense/">the Caro-Kann Defense</a> and <a href="/openings/#traps">more opening traps</a> for the lines above.</p></div>`,
  ],
  faq: [
    ['What is a smothered mate in chess?', 'A checkmate given by a knight when the enemy king cannot move because its own pieces occupy every square around it. Since a knight check cannot be blocked, the king is mated if the knight cannot be captured.'],
    ['Why is it called a smothered mate?', 'Because the king is “smothered” by its own pieces. They stand on all of its escape squares, so it has no room to move when the knight gives check.'],
    ["What is Philidor's legacy?", "The best-known way to force a smothered mate. The attacker checks with the queen, gives a double check with the knight, sacrifices the queen on g8 so that a rook has to capture, and then mates with the knight on f7. It is named after François-André Philidor, although it appears in Lucena's book of 1497."],
    ['Can a smothered mate happen in the opening?', 'Yes. Well-known examples are 6.Nd6# in the Caro-Kann Defense, 8...Nd3# in the Budapest Gambit and 7...Nf3# in the Blackburne Shilling trap. In each one a pawn or piece that could capture the knight is pinned.'],
    ['Which piece gives a smothered mate?', 'Always a knight. It is the only piece that can jump over other pieces, so it is the only one that can check a king that is completely surrounded.'],
    ['How do you prevent a smothered mate?', 'Give your king an escape square with a pawn move such as h3 or h6, keep an eye on enemy knights near your king, and check whether the pawns guarding the knight’s checking square are pinned.'],
    ['Is a smothered mate always in the corner?', 'No. The corner is the most common place, but any king that is fully blocked by its own pieces can be smothered, including a king still on e1 or e8 in the opening.'],
    ['Do you have to sacrifice the queen for a smothered mate?', 'No. The queen sacrifice is only needed when one square next to the king is still free and you have to force an enemy piece onto it. If the king is already boxed in, the knight check alone is mate.'],
  ],
  quiz: { side: 'w', flip: 0, ask: 'White to move. Find the best move.', items: [
    { line: BASIC + '|', answer: 'Nf7#', pool: ['Nxh7', 'Ne6'], note: "The king's own rook and pawns leave it no square, and nothing can capture the knight." },
    { line: PHIL + '|Qe6+ Kh8 Nf7+ Kg8', answer: 'Nh6+', pool: ['Qe8+', 'Qxc8+'], note: 'Double check from the knight and the queen. The king has to go back to h8, and then Qg8+ forces the smothered mate.' },
    { line: PHIL + '|Qe6+ Kh8 Nf7+ Kg8 Nh6+ Kh8', answer: 'Qg8+', pool: ['Qe5', 'Qxc8+'], note: 'The queen sacrifice. Only the rook can capture, and then Nf7 is checkmate.' },
    { line: CARO, answer: 'Nd6#', pool: ['Nxf6+', 'Nf3'], note: 'Smothered mate in the opening: the e7-pawn is pinned by your queen on e2.' },
    { line: PINH + '|', answer: 'Ng6#', pool: ['Rxh7+', 'Nh5'], note: 'The h7-pawn cannot take the knight because your rook pins it to the king.' },
  ] },
  related: [
    { href: '/learn/stalemate/', line: S1 + '|Qb6', flip: 0, tag: 'Rules', tagCls: '', title: 'Stalemate', text: 'No legal move and not in check: a draw.' },
    { href: '/openings/scholars-mate/', line: 'e4 e5 Qh5 Nc6 Bc4 Nf6 Qxf7#', flip: 0, tag: 'Trap', tagCls: '', title: "Scholar's Mate", text: 'The 4-move checkmate, and how to stop it.' },
    { href: '/learn/en-passant/', line: FR, flip: 0, tag: 'Rules', tagCls: '', title: 'En passant', text: 'The special pawn capture, with examples and practice.' },
  ],
},
];
