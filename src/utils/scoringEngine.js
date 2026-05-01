export function computeMatchState(balls, battingTeamSize) {
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

    // Track extra types
    if (isWide) wides += 1 + (ball.extraRuns || 0);
    if (isNoBall) noBalls += 1;
    if (isBye) byes += ball.runs + (ball.extraRuns || 0);
    if (isLegBye) legByes += ball.runs + (ball.extraRuns || 0);

    // Batter stats
    if (ball.batter) {
      if (!batterStatsMap[ball.batter]) {
        batterStatsMap[ball.batter] = {
          name: ball.batter,
          runs: 0,
          ballsFaced: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          outType: '',
          outBowler: '',
          strikeRate: '0.0',
        };
      }
      if (!isWide) {
        batterStatsMap[ball.batter].ballsFaced += 1;
      }
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

    // Bowler stats
    if (ball.bowler) {
      if (!bowlerStatsMap[ball.bowler]) {
        bowlerStatsMap[ball.bowler] = {
          name: ball.bowler,
          balls: 0,
          runs: 0,
          wickets: 0,
          maidens: 0,
          overs: '0.0',
          economy: '0.00',
        };
      }
      if (!isWideOrNoBall) {
        bowlerStatsMap[ball.bowler].balls += 1;
      }
      const bowlerRuns = ball.runs + (ball.isExtra ? (ball.extraRuns || 0) : 0);
      // Byes and leg byes don't count against bowler
      if (!isByeOrLegBye) {
        bowlerStatsMap[ball.bowler].runs += ball.runs + (isWide || isNoBall ? (ball.extraRuns || 0) + 1 : 0);
      }
      if (ball.isOut && ball.outType !== 'runOut') {
        bowlerStatsMap[ball.bowler].wickets += 1;
      }
    }

    // Total runs
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

  // Innings ends when all players are dismissed (last man plays alone until out)
  const isAllOut = battingTeamSize > 0 ? wickets >= battingTeamSize : false;

  return {
    runs,
    wickets,
    currentOver,
    currentBall,
    overs: `${currentOver}.${currentBall}`,
    runRate,
    isAllOut,
    wides,
    noBalls,
    byes,
    legByes,
    batterStats: Object.values(batterStatsMap),
    bowlerStats: Object.values(bowlerStatsMap),
  };
}

export function computeResult(innings1, innings2, teamASize) {
  if (innings2.runs > innings1.runs) {
    const wicketsLeft = (teamASize - 1) - innings2.wickets;
    return `${innings2.team} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`;
  } else if (innings2.runs < innings1.runs) {
    const margin = innings1.runs - innings2.runs;
    return `${innings1.team} won by ${margin} run${margin !== 1 ? 's' : ''}`;
  } else {
    return 'Match tied';
  }
}

export function computeLeadTrail(match, currentRuns, currentWickets, currentOver, currentBall) {
  const { currentInnings, target, oversLimit, matchType } = match;

  if (currentInnings === 1) {
    const battingTeam = match.battingCardTitle.replace(' - Batting', '');
    return `${battingTeam} batting`;
  }

  if (currentInnings === 2) {
    const battingTeam = match.battingCardTitle.replace(' - Batting', '');
    const runsNeeded = target - currentRuns;

    if (runsNeeded <= 0) {
      const bowlingTeam = match.bowlingCardTitle.replace(' - Bowling', '');
      const wicketsLeft = (match.currentInnings === 2
        ? (match.teamA === battingTeam ? match.teamAPlayers : match.teamBPlayers).length - 1
        : 0) - currentWickets;
      return `${battingTeam} won by ${Math.max(0, wicketsLeft)} wicket${wicketsLeft !== 1 ? 's' : ''}`;
    }

    const legalBalls = currentOver * 6 + currentBall;
    const ballsRemaining = oversLimit ? oversLimit * 6 - legalBalls : null;

    if (ballsRemaining !== null) {
      return `${battingTeam} need ${runsNeeded} run${runsNeeded !== 1 ? 's' : ''} off ${ballsRemaining} ball${ballsRemaining !== 1 ? 's' : ''}`;
    } else {
      return `${battingTeam} need ${runsNeeded} run${runsNeeded !== 1 ? 's' : ''}`;
    }
  }

  const battingTeam = match.battingCardTitle.replace(' - Batting', '');
  return `${battingTeam} batting`;
}

export function getOversString(over, ball) {
  return `${over}.${ball}`;
}

export function getBatterDisplay(stat) {
  if (!stat) return '';
  return `${stat.name} ${stat.runs}*(${stat.ballsFaced})`;
}

export function getBowlerDisplay(stat) {
  if (!stat) return '';
  return `${stat.name} ${stat.wickets}-${stat.runs} (${stat.overs} ov)`;
}
