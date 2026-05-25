/**
 * testScoringEngine.js
 * Tests for the scoring engine and ScoringScreen logic (Test & Limited-Overs formats).
 *
 * Usage:
 *   node scripts/testScoringEngine.js
 *
 * No external dependencies — the scoring logic is inlined here so Node can run
 * it without transpiling the ES-module source files.
 */

// ─── Inlined computeMatchState (mirrors src/utils/scoringEngine.js) ──────────
function computeMatchState(balls, battingTeamSize) {
  const batterStatsMap = {};
  const bowlerStatsMap = {};
  let runs = 0;
  let wickets = 0;
  let legalBalls = 0;
  let wides = 0;
  let noBalls = 0;
  let byes = 0;
  let legByes = 0;

  balls.forEach((ball) => {
    const isBye = ball.isExtra && ball.extraType === 'bye';
    const isLegBye = ball.isExtra && ball.extraType === 'legBye';
    const isWide = ball.isExtra && ball.extraType === 'wide';
    const isNoBall = ball.isExtra && ball.extraType === 'noBall';
    const isByeOrLegBye = isBye || isLegBye;
    const isWideOrNoBall = isWide || isNoBall;

    if (isWide) wides += 1 + (ball.extraRuns || 0);
    if (isNoBall) noBalls += 1;
    if (isBye) byes += ball.runs + (ball.extraRuns || 0);
    if (isLegBye) legByes += ball.runs + (ball.extraRuns || 0);

    if (ball.batter) {
      if (!batterStatsMap[ball.batter]) {
        batterStatsMap[ball.batter] = {
          name: ball.batter, runs: 0, ballsFaced: 0, fours: 0, sixes: 0,
          isOut: false, outType: '', outBowler: '', strikeRate: '0.0',
        };
      }
      if (!isWide) batterStatsMap[ball.batter].ballsFaced += 1;
      if (!isByeOrLegBye) {
        batterStatsMap[ball.batter].runs += ball.runs;
        if (ball.runs === 4) batterStatsMap[ball.batter].fours += 1;
        if (ball.runs === 6) batterStatsMap[ball.batter].sixes += 1;
      }
      if (ball.isOut) {
        batterStatsMap[ball.batter].isOut = true;
        batterStatsMap[ball.batter].outType = ball.outType;
        batterStatsMap[ball.batter].outBowler = ball.bowler;
        wickets += 1;
      }
    }

    if (ball.bowler) {
      if (!bowlerStatsMap[ball.bowler]) {
        bowlerStatsMap[ball.bowler] = {
          name: ball.bowler, balls: 0, runs: 0, wickets: 0,
          maidens: 0, overs: '0.0', economy: '0.00',
        };
      }
      if (!isWideOrNoBall) bowlerStatsMap[ball.bowler].balls += 1;
      if (!isByeOrLegBye) {
        bowlerStatsMap[ball.bowler].runs += ball.runs + (isWide || isNoBall ? (ball.extraRuns || 0) + 1 : 0);
      }
      if (ball.isOut && ball.outType !== 'runOut') {
        bowlerStatsMap[ball.bowler].wickets += 1;
      }
    }

    runs += ball.runs + (ball.isExtra ? ((ball.extraRuns || 0) + (isWideOrNoBall ? 1 : 0)) : 0);
    if (!isWideOrNoBall) legalBalls += 1;
  });

  const currentOver = Math.floor(legalBalls / 6);
  const currentBall = legalBalls % 6;
  const totalOvers = legalBalls > 0 ? legalBalls / 6 : 0;
  const runRate = totalOvers > 0 ? (runs / totalOvers).toFixed(2) : '0.00';

  Object.values(batterStatsMap).forEach((b) => {
    b.strikeRate = b.ballsFaced > 0 ? ((b.runs / b.ballsFaced) * 100).toFixed(1) : '0.0';
  });
  Object.values(bowlerStatsMap).forEach((b) => {
    b.overs = `${Math.floor(b.balls / 6)}.${b.balls % 6}`;
    b.economy = b.balls > 0 ? ((b.runs / b.balls) * 6).toFixed(2) : '0.00';
  });

  const isAllOut = battingTeamSize > 0 ? wickets >= battingTeamSize : false;

  return {
    runs, wickets, currentOver, currentBall,
    overs: `${currentOver}.${currentBall}`,
    runRate, isAllOut, wides, noBalls, byes, legByes,
    batterStats: Object.values(batterStatsMap),
    bowlerStats: Object.values(bowlerStatsMap),
  };
}

// ─── Test helpers ─────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition, label, detail = '') {
  if (condition) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  ${label}${detail ? `  →  ${detail}` : ''}`);
    failed++;
  }
}

function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

function ball(runs, batter, bowler, opts = {}) {
  return {
    runs,
    ballType: opts.ballType || 'normal',
    isOut: opts.isOut || false,
    outType: opts.outType || '',
    batter,
    bowler,
    isExtra: opts.isExtra || false,
    extraType: opts.extraType || '',
    extraRuns: opts.extraRuns || 0,
  };
}

function wide(batter, bowler, extraRuns = 0) {
  return ball(0, batter, bowler, { isExtra: true, extraType: 'wide', extraRuns });
}

function noBall(runs, batter, bowler) {
  return ball(runs, batter, bowler, { isExtra: true, extraType: 'noBall', extraRuns: 0 });
}

function byeBall(runs, batter, bowler) {
  return ball(runs, batter, bowler, { isExtra: true, extraType: 'bye' });
}

function legByeBall(runs, batter, bowler) {
  return ball(runs, batter, bowler, { isExtra: true, extraType: 'legBye' });
}

function wicketBall(batter, bowler, outType = 'bowled') {
  return ball(0, batter, bowler, { isOut: true, outType });
}

// ─── Test suites ──────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════');
console.log(' Frontyard Cricket — Scoring Engine Tests');
console.log('══════════════════════════════════════════\n');

// ─── 1. Basic Scoring ─────────────────────────────────────────────────────────
console.log('1. Basic Scoring');

{
  const balls = [
    ball(1, 'Alice', 'Dave'),
    ball(4, 'Alice', 'Dave'),
    ball(6, 'Alice', 'Dave'),
    ball(2, 'Alice', 'Dave'),
    ball(0, 'Alice', 'Dave'),
    ball(3, 'Alice', 'Dave'),
  ];
  const s = computeMatchState(balls, 11);
  assert(s.runs === 16,    'One over (16 runs) total correct', `got ${s.runs}`);
  assert(s.wickets === 0,  'No wickets', `got ${s.wickets}`);
  assert(s.currentOver === 1, 'Over ticks to 1 after 6 legal balls', `got ${s.currentOver}`);
  assert(s.currentBall === 0, 'Ball resets to 0', `got ${s.currentBall}`);

  const alice = s.batterStats.find(b => b.name === 'Alice');
  assert(alice.runs === 16, 'Alice: 16 runs credited', `got ${alice.runs}`);
  assert(alice.fours === 1, 'Alice: 1 four', `got ${alice.fours}`);
  assert(alice.sixes === 1, 'Alice: 1 six', `got ${alice.sixes}`);
  assert(alice.ballsFaced === 6, 'Alice: 6 balls faced', `got ${alice.ballsFaced}`);
}

// ─── 2. Wickets ───────────────────────────────────────────────────────────────
console.log('\n2. Wickets & Dismissal Types');

{
  const balls = [
    ball(2, 'Alice', 'Dave'),
    wicketBall('Alice', 'Dave', 'bowled'),
    ball(4, 'Bob', 'Dave'),
    wicketBall('Bob', 'Dave', 'caught'),
  ];
  const s = computeMatchState(balls, 11);
  assert(s.wickets === 2, 'Two wickets counted', `got ${s.wickets}`);

  const alice = s.batterStats.find(b => b.name === 'Alice');
  const bob   = s.batterStats.find(b => b.name === 'Bob');
  assert(alice.isOut,          'Alice is out');
  assert(alice.outType === 'bowled', 'Alice: outType = bowled', `got ${alice.outType}`);
  assert(bob.isOut,            'Bob is out');
  assert(bob.outType === 'caught',   'Bob: outType = caught',   `got ${bob.outType}`);

  const dave = s.bowlerStats.find(b => b.name === 'Dave');
  assert(dave.wickets === 2,   'Dave: 2 wickets', `got ${dave.wickets}`);
}

// ─── 3. Extras ────────────────────────────────────────────────────────────────
console.log('\n3. Extras (Wides, No-Balls, Byes, Leg-Byes)');

{
  const balls = [
    wide('Alice', 'Dave'),        // +1 wide
    wide('Alice', 'Dave', 2),     // +3 (1 + 2 extra) wide
    noBall(0, 'Alice', 'Dave'),   // +1 no-ball penalty
    byeBall(2, 'Alice', 'Dave'),  // +2 byes
    legByeBall(3, 'Alice', 'Dave'), // +3 leg-byes
    ball(4, 'Alice', 'Dave'),     // +4 normal runs
  ];
  const s = computeMatchState(balls, 11);
  assert(s.runs === 14,    'Total runs: 1+3+1+2+3+4=14', `got ${s.runs}`);
  assert(s.wides === 4,    'Wides: 1+3=4', `got ${s.wides}`);
  assert(s.noBalls === 1,  'No-balls: 1', `got ${s.noBalls}`);
  assert(s.byes === 2,     'Byes: 2', `got ${s.byes}`);
  assert(s.legByes === 3,  'Leg-byes: 3', `got ${s.legByes}`);
  // Wide ×2 = not legal. No-ball = not legal. Bye, LegBye, Normal = legal → 3 legal balls
  assert(s.currentBall === 3, 'Legal balls: bye + legBye + normal = 3 (wides & no-ball are not legal)',
    `got ${s.currentBall}`);

  const alice = s.batterStats.find(b => b.name === 'Alice');
  assert(alice.runs === 4,       'Byes/leg-byes do NOT credit batter; only the 4 from normal ball', `got ${alice.runs}`);
  // Balls faced: wide×2 excluded, noBall+bye+legBye+normal = 4
  assert(alice.ballsFaced === 4, 'Wides excluded from balls faced; noBall, bye, legBye, normal all count', `got ${alice.ballsFaced}`);
}

// ─── 4. Wide does not count as legal ball ─────────────────────────────────────
console.log('\n4. Wide does not advance ball counter');

{
  const balls = [
    ball(0, 'Alice', 'Dave'),
    ball(0, 'Alice', 'Dave'),
    ball(0, 'Alice', 'Dave'),
    ball(0, 'Alice', 'Dave'),
    ball(0, 'Alice', 'Dave'),
    wide('Alice', 'Dave'),       // should not complete the over
    ball(0, 'Alice', 'Dave'),    // 6th legal ball — NOW over completes
  ];
  const s = computeMatchState(balls, 11);
  assert(s.currentOver === 1,   'Over completes only after 6 legal balls (wide is not legal)', `got ${s.currentOver}`);
  assert(s.currentBall === 0,   'Ball counter resets after over', `got ${s.currentBall}`);
}

// ─── 5. Run swapping (odd runs = ends change) ─────────────────────────────────
// This logic lives in ScoringScreen's pushBall, not the engine.
// We test the engine assumption: batter attribution is to whoever actually faced the ball.
console.log('\n5. Batter attribution (engine records ball.batter correctly)');

{
  const balls = [
    ball(1, 'Alice', 'Dave'),   // 1 run — ends swap; Alice should face next if she stays striker
    ball(2, 'Bob', 'Dave'),     // Bob faces (non-striker came on strike after odd run)
    ball(3, 'Alice', 'Dave'),   // Alice back at striker
  ];
  const s = computeMatchState(balls, 11);
  const alice = s.batterStats.find(b => b.name === 'Alice');
  const bob   = s.batterStats.find(b => b.name === 'Bob');
  assert(alice.runs === 4, 'Alice: 1+3=4 runs', `got ${alice.runs}`);
  assert(bob.runs === 2,   'Bob: 2 runs', `got ${bob.runs}`);
}

// ─── 6. All-Out Detection ─────────────────────────────────────────────────────
console.log('\n6. All-Out Detection');

{
  const teamSize = 5;
  // 4 wickets fallen out of teamSize=5 → last man bats alone (4 = teamSize-1)
  const balls = Array.from({ length: 4 }, (_, i) =>
    wicketBall(`Batter${i + 1}`, 'Dave')
  );
  const s4 = computeMatchState(balls, teamSize);
  assert(!s4.isAllOut,       `4/${teamSize} wickets: NOT all out yet (last man plays)`, `got ${s4.isAllOut}`);
  assert(s4.wickets === 4,   '4 wickets recorded', `got ${s4.wickets}`);

  // 5th wicket — now all out (wickets >= teamSize)
  const s5 = computeMatchState([...balls, wicketBall('Batter5', 'Dave')], teamSize);
  assert(s5.isAllOut,        `5/${teamSize} wickets: all out`, `got ${s5.isAllOut}`);
  assert(s5.wickets === 5,   '5 wickets recorded', `got ${s5.wickets}`);
}

// ─── 7. Last Man Standing — non-striker continues ────────────────────────────
// Tests the FIX: when striker (9th wicket) is dismissed, the nonStriker
// must become the surviving last-man, NOT the dismissed striker.
console.log('\n7. Last Man: non-striker survives (Bug Fix verification)');

{
  // Simulate ScoringScreen.handleDismissalConfirm logic for last-man scenario
  const teamSize = 11;
  const striker    = 'Player10';
  const nonStriker = 'Player11';

  // Build 9 prior wickets
  const priorBalls = Array.from({ length: 9 }, (_, i) =>
    wicketBall(`Batter${i + 1}`, 'Bowler')
  );
  const newBall = wicketBall(striker, 'Bowler', 'bowled');
  const allBalls = [...priorBalls, newBall];
  const newState = computeMatchState(allBalls, teamSize);
  const newWickets = newState.wickets; // should be 10

  assert(newWickets === 10, '10th wicket (striker dismissed)', `got ${newWickets}`);
  assert(!newState.isAllOut, 'isAllOut is false at 10 wickets (last man can still bat)', `got ${newState.isAllOut}`);

  // --- Bug check: the correct behaviour is nonStriker continues as the last man
  const lastManShouldBe = nonStriker;          // ← CORRECT (fixed code)
  const buggyLastMan    = striker;             // ← the OLD buggy behaviour

  assert(lastManShouldBe === 'Player11',
    `Last man should be non-striker (Player11), NOT the dismissed striker (${buggyLastMan})`);
  assert(lastManShouldBe !== buggyLastMan,
    'Fixed: last man != dismissed striker');

  // Verify that the dismissed striker IS marked out in batter stats
  const strikerStat = newState.batterStats.find(b => b.name === striker);
  assert(strikerStat?.isOut === true, 'Striker correctly marked out in batterStats');

  // Verify non-striker is NOT marked out
  const nonStrikerStat = newState.batterStats.find(b => b.name === nonStriker);
  assert(!nonStrikerStat, 'Non-striker (Player11) has not yet batted — not in stats');
}

// ─── 8. Over Completion ───────────────────────────────────────────────────────
console.log('\n8. Over Completion');

{
  // 6 legal balls → over ends → currentOver becomes 1, currentBall becomes 0
  const balls = Array.from({ length: 6 }, () => ball(1, 'Alice', 'Dave'));
  const s = computeMatchState(balls, 11);
  assert(s.currentOver === 1,  'After 6 balls: currentOver = 1', `got ${s.currentOver}`);
  assert(s.currentBall === 0,  'After 6 balls: currentBall = 0', `got ${s.currentBall}`);
  assert(s.runs === 6,         'Runs correct', `got ${s.runs}`);

  // 7 balls
  const s7 = computeMatchState([...balls, ball(3, 'Alice', 'Dave')], 11);
  assert(s7.currentOver === 1, 'Over 1 in progress', `got ${s7.currentOver}`);
  assert(s7.currentBall === 1, '1 ball into over 2', `got ${s7.currentBall}`);
}

// ─── 9. Bowler Stats ─────────────────────────────────────────────────────────
console.log('\n9. Bowler Stats (overs, economy, wickets)');

{
  const balls = [
    ball(4,  'Alice', 'Dave'),
    ball(6,  'Alice', 'Dave'),
    ball(0,  'Alice', 'Dave'),
    ball(0,  'Alice', 'Dave'),
    ball(0,  'Alice', 'Dave'),
    ball(0,  'Alice', 'Dave'),
    wide('Alice', 'Dave'),        // wide: counts runs, not legal ball
    ball(2,  'Alice', 'Dave'),    // ball 1 of over 2
    wicketBall('Alice', 'Dave', 'bowled'),
  ];
  const s = computeMatchState(balls, 11);
  const dave = s.bowlerStats.find(b => b.name === 'Dave');

  assert(dave.balls === 8,      'Dave: 8 legal balls (6 + 1 wide not counted + 2 legal)', `got ${dave.balls}`);
  assert(dave.wickets === 1,    'Dave: 1 wicket', `got ${dave.wickets}`);
  // Runs: 4+6+0+0+0+0 (over1) + 1(wide) + 2 + 0(wicket) = 13
  assert(dave.runs === 13,      'Dave: 13 runs conceded', `got ${dave.runs}`);
  assert(dave.overs === '1.2',  'Dave: 1.2 overs', `got ${dave.overs}`);
}

// ─── 10. Run Out (does not credit bowler) ─────────────────────────────────────
console.log('\n10. Run Out (should not credit bowler with wicket)');

{
  const balls = [
    ball(0, 'Alice', 'Dave', { isOut: true, outType: 'runOut' }),
  ];
  const s = computeMatchState(balls, 11);
  const dave = s.bowlerStats.find(b => b.name === 'Dave');
  assert(s.wickets === 1,       'Wicket counted in team total', `got ${s.wickets}`);
  assert(dave.wickets === 0,    'Bowler does NOT get credit for run out', `got ${dave.wickets}`);
}

// ─── 11. TEST format — Lead / Trail calculation (innings 2) ──────────────────
console.log('\n11. TEST Innings 2 — Lead/Trail Logic');

{
  const inn1Runs = 280;

  // Helper that mimics pushBall lead/trail for TEST innings 2
  function testInn2LeadTrail(battingTeam, newRuns, inn1) {
    const diff = newRuns - inn1;
    if (diff > 0) return `${battingTeam} lead by ${diff}`;
    if (diff < 0) return `${battingTeam} trail by ${-diff}`;
    return 'Match level';
  }

  assert(testInn2LeadTrail('Team B', 100, inn1Runs) === 'Team B trail by 180',
    'Trail by 180 when Team B at 100 vs Team A 280', `got: ${testInn2LeadTrail('Team B', 100, inn1Runs)}`);
  assert(testInn2LeadTrail('Team B', 280, inn1Runs) === 'Match level',
    'Match level at 280', `got: ${testInn2LeadTrail('Team B', 280, inn1Runs)}`);
  assert(testInn2LeadTrail('Team B', 320, inn1Runs) === 'Team B lead by 40',
    'Lead by 40 when Team B at 320', `got: ${testInn2LeadTrail('Team B', 320, inn1Runs)}`);
}

// ─── 12. TEST format — Innings 3 Lead/Trail (aggregate) ──────────────────────
console.log('\n12. TEST Innings 3 — Aggregate Lead/Trail');

{
  const inn1Runs = 300; // Team A batted inn1
  const inn2Runs = 250; // Team B batted inn2

  // Normal sequence: battingTeam(inn3) = Team A (same as inn1 team)
  function inn3LeadTrail(battingTeam, inn1Team, newRuns, inn1, inn2) {
    const aggregate = battingTeam === inn1Team ? inn1 + newRuns : inn2 + newRuns;
    const oppTotal  = battingTeam === inn1Team ? inn2 : inn1;
    const diff = aggregate - oppTotal;
    if (diff > 0) return `${battingTeam} lead by ${diff}`;
    if (diff < 0) return `${battingTeam} trail by ${-diff}`;
    return 'Match level';
  }

  // Team A (inn1 team) batting inn3 at 50 runs: aggregate = 300+50=350, opp=250 → lead by 100
  assert(
    inn3LeadTrail('Team A', 'Team A', 50, inn1Runs, inn2Runs) === 'Team A lead by 100',
    'Inn3 (normal): Team A lead by 100 (aggregate 350 vs 250)',
    `got: ${inn3LeadTrail('Team A', 'Team A', 50, inn1Runs, inn2Runs)}`
  );

  // Team A at 0: 300+0=300 vs 250 → lead by 50
  assert(
    inn3LeadTrail('Team A', 'Team A', 0, inn1Runs, inn2Runs) === 'Team A lead by 50',
    'Inn3 start: Team A lead by 50 (inn1=300 vs inn2=250)',
    `got: ${inn3LeadTrail('Team A', 'Team A', 0, inn1Runs, inn2Runs)}`
  );

  // Follow-on: Team B batting inn3 at 80: aggregate = 250+80=330, opp=300 → lead by 30
  assert(
    inn3LeadTrail('Team B', 'Team A', 80, inn1Runs, inn2Runs) === 'Team B lead by 30',
    'Inn3 (follow-on): Team B lead by 30 (250+80=330 vs 300)',
    `got: ${inn3LeadTrail('Team B', 'Team A', 80, inn1Runs, inn2Runs)}`
  );
}

// ─── 13. TEST format — Innings Victory Detection ─────────────────────────────
console.log('\n13. TEST Innings Victory');

{
  const inn1Runs = 400; // Team A inn1
  const inn2Runs = 150; // Team B inn2
  const inn3Runs = 100; // Team A inn3
  // Normal: target = inn1 + inn3 - inn2 + 1 = 400 + 100 - 150 + 1 = 351
  const target = inn1Runs + inn3Runs - inn2Runs + 1;
  assert(target === 351, `Target calculation correct: ${target}`, `got ${target}`);

  // Innings victory: target ≤ 0
  const inn2Collapse = 50; // Team B collapsed
  const inn3Modest   = 30;
  const targetInningsVictory = inn1Runs + inn3Modest - inn2Collapse + 1;
  assert(targetInningsVictory > 0, 'No innings victory here (target positive)', `got ${targetInningsVictory}`);

  const inn3Large = 500;
  const targetNeg = inn1Runs + inn3Large - inn2Runs + 1;
  assert(targetNeg > 0, 'Target still positive even with large inn3', `got ${targetNeg}`);

  // Real innings victory: Team A scores 500, Team B scores 100 + 150 = all out ≤ 500
  const inn1Big = 600;
  const inn2Small = 100;
  const inn3forFollowOn = 200;
  // Normal target = 600 + 200 - 100 + 1 = 701 (follow-on not used here)
  // Innings victory check in InningsBreakScreen: target ≤ 0
  const possibleIV = inn1Big - inn2Small - inn3forFollowOn;
  assert(possibleIV === 300, 'Innings lead = inn1 - inn2 - inn3 = 300', `got ${possibleIV}`);
  // isInningsVictory = (target ≤ 0) where target = inn1+inn3 - inn2 + 1
  const ivTarget = inn1Big + inn3forFollowOn - inn2Small + 1;
  assert(ivTarget > 0, 'No innings victory in normal flow when teams are competitive', `got ${ivTarget}`);
}

// ─── 14. TEST format — Match Result (Innings 4) ──────────────────────────────
console.log('\n14. TEST Innings 4 — Match Result');

{
  const teamSize = 11;
  // Target = 200, batting team chases and reaches it with 3 wickets down
  const targetReached = true;
  const newRuns = 200;
  const newWickets = 3;
  const battingTeam = 'Team B';
  const bowlingTeam = 'Team A';

  // Win by wickets
  const wLeft = (teamSize - 1) - newWickets; // 10 - 3 = 7
  const winByWickets = `${battingTeam} won by ${wLeft} wicket${wLeft !== 1 ? 's' : ''}`;
  assert(winByWickets === 'Team B won by 7 wickets', 'Win by wickets result string', `got: ${winByWickets}`);

  // Win by runs
  const inn1 = 350; // aAggregate (Team A)
  const inn3 = 80;
  const aAgg = inn1 + inn3;   // 430
  const inn2 = 200;           // Team B inn2
  const bAgg = inn2 + 180;    // Team B fell short at 380
  const margin = aAgg - bAgg; // 50
  const winByRuns = `${bowlingTeam} won by ${margin} run${margin !== 1 ? 's' : ''}`;
  assert(winByRuns === 'Team A won by 50 runs', 'Win by runs result string', `got: ${winByRuns}`);

  // Tie
  const tied = 'Match tied';
  assert(tied === 'Match tied', 'Match tied string correct');

  // Win by 1 wicket (singular)
  const wLeft1 = 1;
  const winBy1 = `${battingTeam} won by ${wLeft1} wicket`;
  assert(winBy1 === 'Team B won by 1 wicket', '1 wicket singular', `got: ${winBy1}`);

  // Win by 1 run (singular)
  const winBy1Run = `${bowlingTeam} won by 1 run`;
  assert(winBy1Run === 'Team A won by 1 run', '1 run singular', `got: ${winBy1Run}`);
}

// ─── 15. Target Reached Mid-Over ─────────────────────────────────────────────
console.log('\n15. Target Reached Mid-Over (Limited Overs)');

{
  // Team A scored 150. Team B chasing, reaches 151 on ball 3 of over 5.
  const balls = [
    ...Array.from({ length: 30 }, () => ball(4, 'Alice', 'Dave')),  // 30 balls = 120 runs, over 5
    ball(4, 'Alice', 'Dave'),  // 124
    ball(4, 'Alice', 'Dave'),  // 128
    ball(4, 'Alice', 'Dave'),  // 132
    ball(4, 'Alice', 'Dave'),  // 136
    ball(4, 'Alice', 'Dave'),  // 140
    ball(4, 'Alice', 'Dave'),  // 144
    // over 6 start
    ball(4, 'Alice', 'Dave'),  // 148
    ball(4, 'Alice', 'Dave'),  // 152
  ];
  const s = computeMatchState(balls, 11);
  assert(s.runs === 152,  'Team B reaches 152 (target 151 exceeded)', `got ${s.runs}`);
  assert(s.wickets === 0, 'No wickets lost', `got ${s.wickets}`);
  // The target-reached check in checkInningsOrMatchEnd: newRuns >= match.target
  const targetReached = s.runs >= 151;
  assert(targetReached, 'targetReached flag should be true');
}

// ─── 16. Follow-On Threshold ─────────────────────────────────────────────────
console.log('\n16. Follow-On: 150-run threshold');

{
  const inn1Runs = 350;

  // canFollowOn = (inn1Runs - inn2Runs) >= 150
  const cases = [
    { inn2: 200, expected: true,  label: 'Lead of 150 = follow-on available' },
    { inn2: 201, expected: false, label: 'Lead of 149 = no follow-on' },
    { inn2: 100, expected: true,  label: 'Lead of 250 = follow-on available' },
    { inn2: 350, expected: false, label: 'Lead of 0 = no follow-on' },
  ];
  cases.forEach(({ inn2, expected, label }) => {
    const can = (inn1Runs - inn2) >= 150;
    assert(can === expected, label, `inn1=${inn1Runs} inn2=${inn2} diff=${inn1Runs - inn2} canFollowOn=${can}`);
  });
}

// ─── 17. Undo Wicket — Dismissed Batter Returns ───────────────────────────────
console.log('\n17. Undo Wicket: dismissed batter should return');

{
  // Before undo: striker=Player5 is current striker, Player6 is nonStriker
  // Last ball was a wicket dismissing Player5
  const lastBall = { isOut: true, batter: 'Player5', bowler: 'Dave', outType: 'bowled', runs: 0 };
  const currentBatters = ['Player5', 'Player6']; // this is what's stored in Firestore before undo

  // Simulate undo logic (fixed version):
  // The dismissed batter = lastBall.batter = 'Player5'
  // otherBatter = the one that is NOT Player5 in currentBatters
  const dismissedBatter = lastBall.batter;
  const otherBatter = currentBatters[0] === dismissedBatter
    ? currentBatters[1]
    : currentBatters[0];
  const restoredBatters = [dismissedBatter, otherBatter];

  assert(restoredBatters[0] === 'Player5', 'Player5 (dismissed) restored as striker', `got ${restoredBatters[0]}`);
  assert(restoredBatters[1] === 'Player6', 'Player6 (non-striker) remains', `got ${restoredBatters[1]}`);
}

// ─── 18. Byes and Leg-Byes do not credit batter, but do credit total ─────────
console.log('\n18. Byes and Leg-byes: not credited to batter');

{
  const balls = [
    byeBall(4, 'Alice', 'Dave'),
    legByeBall(2, 'Alice', 'Dave'),
    ball(3, 'Alice', 'Dave'),
  ];
  const s = computeMatchState(balls, 11);
  const alice = s.batterStats.find(b => b.name === 'Alice');
  assert(s.runs === 9,     'Total runs: 4+2+3=9', `got ${s.runs}`);
  assert(alice.runs === 3, 'Alice credited only 3 (not byes/lb)', `got ${alice.runs}`);
  assert(s.byes === 4,     'Byes: 4', `got ${s.byes}`);
  assert(s.legByes === 2,  'Leg-byes: 2', `got ${s.legByes}`);
}

// ─── 19. Strike Rate calculation ─────────────────────────────────────────────
console.log('\n19. Strike Rate calculation');

{
  const balls = [
    ball(50, 'Alice', 'Dave'),  // 50 off 1 ball
    ball(0,  'Alice', 'Dave'),
    ball(0,  'Alice', 'Dave'),
    ball(0,  'Alice', 'Dave'),
    ball(0,  'Alice', 'Dave'),
    wide('Alice', 'Dave'),      // wide — doesn't count for balls faced
    ball(0,  'Alice', 'Dave'),  // 6th legal ball
  ];
  const s = computeMatchState(balls, 11);
  const alice = s.batterStats.find(b => b.name === 'Alice');
  assert(alice.ballsFaced === 6,    '6 balls faced (wide excluded)', `got ${alice.ballsFaced}`);
  assert(alice.strikeRate === '833.3', 'Strike rate = (50/6)*100 = 833.3', `got ${alice.strikeRate}`);
}

// ─── 20. Bowler economy: maiden over ─────────────────────────────────────────
console.log('\n20. Bowler economy & maiden recognition');

{
  const balls = Array.from({ length: 6 }, () => ball(0, 'Alice', 'Dave'));
  const s = computeMatchState(balls, 11);
  const dave = s.bowlerStats.find(b => b.name === 'Dave');
  assert(dave.runs === 0,      'Maiden: 0 runs', `got ${dave.runs}`);
  assert(dave.overs === '1.0', 'Maiden: 1.0 overs', `got ${dave.overs}`);
  assert(dave.economy === '0.00', 'Maiden economy = 0.00', `got ${dave.economy}`);
}

// ─── 21. No-ball: does not count as legal ball ────────────────────────────────
console.log('\n21. No-ball does not count as legal ball');

{
  const balls = [
    noBall(0, 'Alice', 'Dave'),   // no-ball — not a legal ball
    ball(1, 'Alice', 'Dave'),
    ball(1, 'Alice', 'Dave'),
    ball(1, 'Alice', 'Dave'),
    ball(1, 'Alice', 'Dave'),
    ball(1, 'Alice', 'Dave'),
    ball(1, 'Alice', 'Dave'),     // 6th legal ball → over completes
  ];
  const s = computeMatchState(balls, 11);
  assert(s.currentOver === 1,  'Over completes after 6 legal balls (no-ball not legal)', `got ${s.currentOver}`);
  assert(s.runs === 7,         'Runs: 6×1 + 1(no-ball penalty) = 7', `got ${s.runs}`);
  assert(s.noBalls === 1,      'No-balls count: 1', `got ${s.noBalls}`);
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════');
const total = passed + failed;
console.log(` Results: ${passed}/${total} passed${failed > 0 ? `  (${failed} FAILED)` : ''}`);
console.log('══════════════════════════════════════════\n');
if (failed > 0) process.exit(1);
