import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, Alert, StatusBar, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subscribeToMatch, updateMatch } from '../services/matchService';
import { computeMatchState } from '../utils/scoringEngine';
import { colors, DISMISSAL_TYPES, DISMISSAL_LABELS } from '../utils/constants';

// ─── Helper: picker modal ─────────────────────────────────────────────────────
function PickerModal({ visible, title, options, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalOption} onPress={() => onSelect(item)}>
                <Text style={styles.modalOptionText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Helper: dismissal modal ──────────────────────────────────────────────────
function DismissalModal({ visible, batterName, onConfirm, onClose }) {
  const [outType, setOutType] = useState('bowled');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{batterName} — Dismissal</Text>
          <View style={styles.dismissalGrid}>
            {DISMISSAL_TYPES.map((dt) => (
              <TouchableOpacity
                key={dt}
                style={[styles.dismissalBtn, outType === dt && styles.dismissalBtnActive]}
                onPress={() => setOutType(dt)}
              >
                <Text style={[styles.dismissalText, outType === dt && styles.dismissalTextActive]}>
                  {DISMISSAL_LABELS[dt]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.confirmBtn} onPress={() => onConfirm(outType)}>
            <Text style={styles.confirmBtnText}>Confirm Wicket</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── BallCircle ───────────────────────────────────────────────────────────────
function BallCircle({ ball, small }) {
  let bg = '#444';
  let label = ball.runs === 0 ? '•' : String(ball.runs);
  const size = small ? 28 : 34;
  if (ball.isOut) { bg = colors.error; label = 'W'; }
  else if (ball.runs === 4) { bg = colors.success; label = '4'; }
  else if (ball.runs === 6) { bg = colors.warning; label = '6'; }
  else if (ball.isExtra) {
    bg = '#FF9800';
    if (ball.extraType === 'wide') label = 'Wd';
    else if (ball.extraType === 'noBall') label = 'NB';
    else if (ball.extraType === 'bye') label = 'B';
    else label = 'LB';
  }
  return (
    <View style={[styles.ballCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.ballCircleText, { fontSize: small ? 9 : 11 }]}>{label}</Text>
    </View>
  );
}

// ─── Main ScoringScreen ───────────────────────────────────────────────────────
export default function ScoringScreen({ route, navigation }) {
  const {
    matchId, matchName, matchType, oversLimit,
    teamA, teamB, teamAPlayers, teamBPlayers,
  } = route.params;

  const [match, setMatch] = useState(null);
  const [balls, setBalls] = useState([]);
  const [striker, setStriker] = useState(null);
  const [nonStriker, setNonStriker] = useState(null);
  const [bowler, setBowler] = useState(null);
  const [previousBowler, setPreviousBowler] = useState(null);

  // Modals
  const [strikerPickerVisible, setStrikerPickerVisible] = useState(false);
  const [nonStrikerPickerVisible, setNonStrikerPickerVisible] = useState(false);
  const [bowlerPickerVisible, setBowlerPickerVisible] = useState(false);
  const [newBatterPickerVisible, setNewBatterPickerVisible] = useState(false);
  const [newBowlerPickerVisible, setNewBowlerPickerVisible] = useState(false);
  const [dismissalModalVisible, setDismissalModalVisible] = useState(false);

  // Pending state for after dismissal / over end
  const pendingBallRef = useRef(null);
  const [pendingNewBatterCallback, setPendingNewBatterCallback] = useState(null);
  const [pendingNewBowlerCallback, setPendingNewBowlerCallback] = useState(null);

  useEffect(() => {
    const unsub = subscribeToMatch(matchId, (m) => {
      setMatch(m);
      setBalls(m.balls || []);
      setStriker(m.currentBatters?.[0] || null);
      setNonStriker(m.currentBatters?.[1] || null);
      setBowler(m.currentBowler || null);
    });
    return unsub;
  }, [matchId]);

  if (!match) return <View style={styles.container} />;

  const currentInnings = match.currentInnings || 1;
  const battingTeam = match.battingCardTitle?.replace(' - Batting', '') || teamA;
  const bowlingTeam = match.bowlingCardTitle?.replace(' - Bowling', '') || teamB;
  const battingTeamPlayers = battingTeam === teamA ? teamAPlayers : teamBPlayers;
  const bowlingTeamPlayers = battingTeam === teamA ? teamBPlayers : teamAPlayers;
  const teamSize = battingTeamPlayers.length;

  const state = computeMatchState(balls, teamSize);
  const { runs, wickets, currentOver, currentBall, runRate, isAllOut, wides, noBalls, byes, legByes } = state;

  const isLastBatter = wickets >= teamSize - 2 && wickets < teamSize - 1;
  const currentOverBalls = balls.filter((b, i) => {
    // Count legal balls in current over
    let legal = 0;
    for (let j = 0; j <= i; j++) {
      const b2 = balls[j];
      const isWide = b2.isExtra && b2.extraType === 'wide';
      const isNoBall = b2.isExtra && b2.extraType === 'noBall';
      if (!isWide && !isNoBall) legal++;
    }
    const overNum = Math.floor((legal - 1) / 6);
    return overNum === currentOver && legal > 0;
  });
  // simpler: just last balls in this over
  const thisOverBalls = [];
  let lb = 0;
  for (const b of balls) {
    const isWide = b.isExtra && b.extraType === 'wide';
    const isNoBall = b.isExtra && b.extraType === 'noBall';
    if (!isWide && !isNoBall) lb++;
    if (Math.floor((lb - (isWide || isNoBall ? 0 : 1)) / 6) === currentOver) {
      thisOverBalls.push(b);
    }
  }

  // Required rate (2nd innings chasing)
  const legalBallsTotal = currentOver * 6 + currentBall;
  const ballsRemaining = oversLimit ? oversLimit * 6 - legalBallsTotal : null;
  const runsNeeded = (match.target || 0) - runs;
  const requiredRate = (ballsRemaining && ballsRemaining > 0 && currentInnings > 1)
    ? ((runsNeeded / ballsRemaining) * 6).toFixed(2)
    : null;

  // Available batters (not out, not yet selected)
  const outBatters = state.batterStats.filter((b) => b.isOut).map((b) => b.name);
  const usedBatters = state.batterStats.map((b) => b.name);
  const availableBatters = battingTeamPlayers.filter(
    (p) => !outBatters.includes(p) && p !== striker && p !== nonStriker
  );
  const availableBowlers = bowlingTeamPlayers.filter((p) => p !== previousBowler);

  // ── Score Update Helper ────────────────────────────────────────────────────
  async function pushBall(ball) {
    const newBalls = [...balls, ball];
    const newState = computeMatchState(newBalls, teamSize);

    const newOver = newState.currentOver;
    const newBall = newState.currentBall;
    const newRuns = newState.runs;
    const newWickets = newState.wickets;
    const totalLegal = newOver * 6 + newBall;
    const rr = totalLegal > 0 ? ((newRuns / totalLegal) * 6).toFixed(2) : '0.00';

    // Compute lead/trail
    let leadTrail = `${battingTeam} batting`;
    if (currentInnings > 1) {
      const need = (match.target || 0) - newRuns;
      const ballsLeft = oversLimit ? oversLimit * 6 - totalLegal : null;
      if (need <= 0) {
        const wLeft = (teamSize - 1) - newWickets;
        leadTrail = `${battingTeam} won by ${Math.max(0, wLeft)} wicket${wLeft !== 1 ? 's' : ''}`;
      } else if (ballsLeft !== null) {
        leadTrail = `${battingTeam} need ${need} run${need !== 1 ? 's' : ''} off ${ballsLeft} ball${ballsLeft !== 1 ? 's' : ''}`;
      } else {
        leadTrail = `${battingTeam} need ${need} more run${need !== 1 ? 's' : ''}`;
      }
    }

    // Swap striker on odd runs (excluding wides)
    let newStriker = striker;
    let newNonStriker = nonStriker;
    const isWide = ball.isExtra && ball.extraType === 'wide';
    if (!isWide && !ball.isOut) {
      const totalBatRuns = ball.runs;
      if (totalBatRuns % 2 === 1) {
        newStriker = nonStriker;
        newNonStriker = striker;
      }
    }

    await updateMatch(matchId, {
      score: `${newRuns}/${newWickets}`,
      overs: `Overs: ${newOver}.${newBall}`,
      runRate: `Rate: ${rr}`,
      matchStatus: 'In Progress',
      leadTrail,
      battingCardTitle: `${battingTeam} - Batting`,
      bowlingCardTitle: `${bowlingTeam} - Bowling`,
      currentInnings,
      currentOver: newOver,
      currentBall: newBall,
      currentBatters: [newStriker, newNonStriker],
      currentBowler: bowler,
      balls: newBalls,
      batterStats: newState.batterStats,
      bowlerStats: newState.bowlerStats,
    });

    return { newState, newBalls, newStriker, newNonStriker, newOver, newBall, newRuns, newWickets, leadTrail };
  }

  // ── Handle Ball Tap ─────────────────────────────────────────────────────────
  async function handleBall(runs, ballType, isExtra, extraType, extraRuns) {
    if (!striker || !bowler) {
      Alert.alert('Setup Required', 'Select striker and bowler first.');
      return;
    }

    const ball = {
      runs,
      ballType,
      isOut: false,
      outType: '',
      batter: striker,
      bowler,
      isExtra: isExtra || false,
      extraType: extraType || '',
      extraRuns: extraRuns || 0,
    };

    const result = await pushBall(ball);
    const { newState, newBalls, newOver, newBall, newWickets, newRuns } = result;

    // Check over complete
    if (!isExtra || (extraType !== 'wide' && extraType !== 'noBall')) {
      if (newBall === 0 && newOver > (result.newOver - 1)) {
        // Over just ended — check innings/match end first
      }
    }

    await checkInningsOrMatchEnd(newState, newBalls, newRuns, newWickets, newOver, newBall, result.leadTrail);

    // If over ended (newBall===0 and over changed)
    const prevLegal = currentOver * 6 + currentBall;
    const newLegal = newOver * 6 + newBall;
    const overCompleted = newBall === 0 && newLegal > 0 && newLegal > prevLegal;
    if (overCompleted && !newState.isAllOut) {
      setTimeout(() => {
        setPreviousBowler(bowler);
        setNewBowlerPickerVisible(true);
      }, 200);
    }
  }

  // ── Handle Wicket ──────────────────────────────────────────────────────────
  function handleWicketTap() {
    if (!striker || !bowler) {
      Alert.alert('Setup Required', 'Select striker and bowler first.');
      return;
    }
    setDismissalModalVisible(true);
  }

  async function handleDismissalConfirm(outType) {
    setDismissalModalVisible(false);

    const ball = {
      runs: 0,
      ballType: 'wicket',
      isOut: true,
      outType,
      batter: striker,
      bowler,
      isExtra: false,
      extraType: '',
      extraRuns: 0,
    };

    const result = await pushBall(ball);
    const { newState, newBalls, newOver, newBall, newWickets, newRuns } = result;

    const ended = await checkInningsOrMatchEnd(newState, newBalls, newRuns, newWickets, newOver, newBall, result.leadTrail);
    if (ended) return;

    // Check if innings still alive — prompt for new batter
    if (!newState.isAllOut) {
      setTimeout(() => {
        setNewBatterPickerVisible(true);
      }, 300);

      // Over end check
      const newLegal = newOver * 6 + newBall;
      const prevLegal = currentOver * 6 + currentBall;
      if (newBall === 0 && newLegal > 0 && newLegal > prevLegal) {
        setPreviousBowler(bowler);
        // Will show bowler picker after batter selected
      }
    }
  }

  function handleNewBatterSelect(name) {
    setNewBatterPickerVisible(false);
    setStriker(name);
    updateMatch(matchId, { currentBatters: [name, nonStriker] });
  }

  function handleNewBowlerSelect(name) {
    setNewBowlerPickerVisible(false);
    setBowler(name);
    // Swap striker/non-striker at end of over
    const tmp = striker;
    setStriker(nonStriker);
    setNonStriker(tmp);
    updateMatch(matchId, {
      currentBowler: name,
      currentBatters: [nonStriker, striker],
    });
  }

  // ── Check if innings or match should end ────────────────────────────────────
  async function checkInningsOrMatchEnd(newState, newBalls, newRuns, newWickets, newOver, newBall, leadTrail) {
    const oversComplete = oversLimit && newOver >= oversLimit && newBall === 0;
    const allOut = newState.isAllOut;

    if (!oversComplete && !allOut) return false;

    // Innings has ended
    const inningsData = {
      team: battingTeam,
      runs: newRuns,
      wickets: newWickets,
      overs: `${newOver}.${newBall}`,
      balls: newBalls,
      batterStats: newState.batterStats,
      bowlerStats: newState.bowlerStats,
    };

    if (matchType === 'TEST') {
      // Test: go to innings break with data
      navigation.replace('InningsBreak', {
        matchId,
        inningsData,
        inningsNumber: currentInnings,
        matchType,
        teamA, teamB, teamAPlayers, teamBPlayers,
        oversLimit: null,
        matchName,
        innings1Runs: currentInnings === 1 ? newRuns : (match.innings1?.runs || 0),
        innings2Runs: currentInnings === 2 ? newRuns : (match.innings2?.runs || 0),
      });
      return true;
    }

    if (currentInnings === 1) {
      // 1st innings end → go to innings break
      navigation.replace('InningsBreak', {
        matchId,
        inningsData,
        inningsNumber: 1,
        matchType,
        oversLimit,
        teamA, teamB, teamAPlayers, teamBPlayers,
        matchName,
        innings1Runs: newRuns,
      });
      return true;
    }

    // 2nd innings (limited overs) — match ends
    const team1Runs = match.innings1?.runs || match.target - 1;
    let result;
    if (newRuns > team1Runs) {
      const wLeft = (teamSize - 1) - newWickets;
      result = `${battingTeam} won by ${Math.max(0, wLeft)} wicket${wLeft !== 1 ? 's' : ''}`;
    } else if (newRuns < team1Runs) {
      const margin = team1Runs - newRuns;
      result = `${bowlingTeam} won by ${margin} run${margin !== 1 ? 's' : ''}`;
    } else {
      result = 'Match tied';
    }

    await updateMatch(matchId, {
      result,
      leadTrail: result,
      matchFinished: true,
      status: 'finished',
      matchStatus: 'Match Complete',
      innings2: inningsData,
    });

    navigation.replace('MatchSummary', { matchId, matchName });
    return true;
  }

  // ── Undo Last Ball ──────────────────────────────────────────────────────────
  async function handleUndo() {
    if (balls.length === 0) return;
    Alert.alert('Undo Last Ball', 'Remove the last ball?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Undo', style: 'destructive',
        onPress: async () => {
          const newBalls = balls.slice(0, -1);
          const newState = computeMatchState(newBalls, teamSize);
          const { runs: r, wickets: w, currentOver: co, currentBall: cb } = newState;
          const totalLegal = co * 6 + cb;
          const rr = totalLegal > 0 ? ((r / totalLegal) * 6).toFixed(2) : '0.00';

          // Find current batters from state (non-out batters)
          const activeBatters = battingTeamPlayers.filter(
            (p) => !newState.batterStats.find((b) => b.name === p && b.isOut)
              && newState.batterStats.find((b) => b.name === p)
          );

          await updateMatch(matchId, {
            score: `${r}/${w}`,
            overs: `Overs: ${co}.${cb}`,
            runRate: `Rate: ${rr}`,
            currentOver: co,
            currentBall: cb,
            balls: newBalls,
            batterStats: newState.batterStats,
            bowlerStats: newState.bowlerStats,
          });
        },
      },
    ]);
  }

  // ── End Match ──────────────────────────────────────────────────────────────
  function handleEndMatch() {
    const options = matchType === 'TEST'
      ? [
          { text: 'Draw', onPress: () => endMatchWith('Match drawn') },
          { text: `${battingTeam} won`, onPress: () => endMatchWith(`${battingTeam} won`) },
          { text: `${bowlingTeam} won`, onPress: () => endMatchWith(`${bowlingTeam} won`) },
          { text: 'Cancel', style: 'cancel' },
        ]
      : [
          { text: 'Confirm End', style: 'destructive', onPress: () => endMatchWith('Match ended') },
          { text: 'Cancel', style: 'cancel' },
        ];

    Alert.alert('End Match', 'How would you like to end the match?', options);
  }

  async function endMatchWith(result) {
    const inningsData = {
      team: battingTeam,
      runs,
      wickets,
      overs: `${currentOver}.${currentBall}`,
      balls,
      batterStats: state.batterStats,
      bowlerStats: state.bowlerStats,
    };

    const updateData = {
      result,
      leadTrail: result,
      matchFinished: true,
      status: 'finished',
      matchStatus: 'Match Complete',
    };
    if (currentInnings === 1) updateData.innings1 = inningsData;
    if (currentInnings === 2) updateData.innings2 = inningsData;
    if (currentInnings === 3) updateData.innings3 = inningsData;
    if (currentInnings === 4) updateData.innings4 = inningsData;

    await updateMatch(matchId, updateData);
    navigation.replace('MatchSummary', { matchId, matchName });
  }

  // ── Test Declaration ───────────────────────────────────────────────────────
  function handleDeclare() {
    Alert.alert('Declare Innings', `Declare ${battingTeam} innings at ${runs}/${wickets}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Declare', onPress: async () => {
          const inningsData = {
            team: battingTeam,
            runs,
            wickets,
            overs: `${currentOver}.${currentBall}`,
            balls,
            batterStats: state.batterStats,
            bowlerStats: state.bowlerStats,
          };
          navigation.replace('InningsBreak', {
            matchId,
            inningsData,
            inningsNumber: currentInnings,
            matchType,
            oversLimit: null,
            teamA, teamB, teamAPlayers, teamBPlayers,
            matchName,
            innings1Runs: currentInnings === 1 ? runs : (match.innings1?.runs || 0),
            innings2Runs: currentInnings === 2 ? runs : (match.innings2?.runs || 0),
            declared: true,
          });
        }
      },
    ]);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const batterStat = (name) => state.batterStats.find((b) => b.name === name);
  const bowlerStat = (name) => state.bowlerStats.find((b) => b.name === name);

  // Last balls of current over (up to 6)
  const lastOverBalls = (() => {
    const result = [];
    let legal = 0;
    for (const b of balls) {
      const w = b.isExtra && b.extraType === 'wide';
      const nb = b.isExtra && b.extraType === 'noBall';
      if (!w && !nb) legal++;
      const overIdx = w || nb ? Math.floor(legal / 6) : Math.floor((legal - 1) / 6);
      if (overIdx === currentOver) result.push(b);
    }
    return result;
  })();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>{matchName}</Text>
          <View style={styles.headerActions}>
            {matchType === 'TEST' && (
              <TouchableOpacity style={styles.declareBtn} onPress={handleDeclare}>
                <Text style={styles.declareBtnText}>Declare</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.endBtn} onPress={handleEndMatch}>
              <Text style={styles.endBtnText}>End</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          {/* Score Panel */}
          <View style={styles.scorePanel}>
            <Text style={styles.teamNameLabel}>{battingTeam}</Text>
            <Text style={styles.scoreBig}>{runs}/{wickets}</Text>
            <Text style={styles.oversText}>({currentOver}.{currentBall} ov)</Text>
            <View style={styles.rateRow}>
              <Text style={styles.rateText}>Rate: {runRate}</Text>
              {requiredRate && currentInnings > 1 && (
                <Text style={[styles.rateText, { color: colors.warning }]}>  Req: {requiredRate}</Text>
              )}
            </View>
            {match.leadTrail ? <Text style={styles.leadTrail}>{match.leadTrail}</Text> : null}
            <Text style={styles.inningsLabel}>Innings {currentInnings}</Text>
          </View>

          {/* Players Panel */}
          <View style={styles.playersPanel}>
            {/* Striker */}
            <TouchableOpacity
              style={styles.playerRow}
              onPress={() => setStrikerPickerVisible(true)}
            >
              <View style={styles.strikerBadge}><Text style={styles.strikerStar}>★</Text></View>
              {striker ? (
                <View style={{ flex: 1 }}>
                  <Text style={styles.playerName}>{striker}</Text>
                  {batterStat(striker) && (
                    <Text style={styles.playerStats}>
                      {batterStat(striker).runs}* ({batterStat(striker).ballsFaced})  SR: {batterStat(striker).strikeRate}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.selectPlayerText}>Select Striker</Text>
              )}
            </TouchableOpacity>

            {/* Non-Striker (hidden when last batter) */}
            {!isAllOut && (
              <TouchableOpacity
                style={styles.playerRow}
                onPress={() => setNonStrikerPickerVisible(true)}
              >
                <View style={[styles.strikerBadge, { backgroundColor: 'transparent' }]}>
                  <Text style={styles.nonStrikerDot}>○</Text>
                </View>
                {nonStriker ? (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.playerName}>{nonStriker}</Text>
                    {batterStat(nonStriker) && (
                      <Text style={styles.playerStats}>
                        {batterStat(nonStriker).runs} ({batterStat(nonStriker).ballsFaced})
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.selectPlayerText}>Select Non-Striker</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Bowler */}
            <TouchableOpacity
              style={[styles.playerRow, { borderTopWidth: 1, borderTopColor: colors.border }]}
              onPress={() => setBowlerPickerVisible(true)}
            >
              <View style={[styles.strikerBadge, { backgroundColor: 'rgba(255,193,7,0.15)' }]}>
                <Text style={{ color: colors.warning, fontWeight: 'bold', fontSize: 12 }}>B</Text>
              </View>
              {bowler ? (
                <View style={{ flex: 1 }}>
                  <Text style={styles.playerName}>{bowler}</Text>
                  {bowlerStat(bowler) && (
                    <Text style={styles.playerStats}>
                      {bowlerStat(bowler).wickets}-{bowlerStat(bowler).runs} ({bowlerStat(bowler).overs} ov)  Econ: {bowlerStat(bowler).economy}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.selectPlayerText}>Select Bowler</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Ball Input Buttons */}
          <View style={styles.ballInputSection}>
            <View style={styles.ballRow}>
              {[0, 1, 2, 3].map((r) => (
                <TouchableOpacity key={r} style={styles.ballBtn} onPress={() => handleBall(r, 'normal', false, '', 0)}>
                  <Text style={styles.ballBtnText}>{r}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.ballBtn, styles.ballBtnGreen]} onPress={() => handleBall(4, 'four', false, '', 0)}>
                <Text style={[styles.ballBtnText, { color: colors.background }]}>4★</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ballBtn, styles.ballBtnYellow]} onPress={() => handleBall(6, 'six', false, '', 0)}>
                <Text style={[styles.ballBtnText, { color: colors.background }]}>6★</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ballRow}>
              <TouchableOpacity style={[styles.ballBtnWide, styles.ballBtnExtra]} onPress={() => handleBall(0, 'wide', true, 'wide', 0)}>
                <Text style={styles.ballBtnExtraText}>WIDE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ballBtnWide, styles.ballBtnExtra]} onPress={() => handleBall(0, 'noBall', true, 'noBall', 0)}>
                <Text style={styles.ballBtnExtraText}>NO BALL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ballBtnWide, styles.ballBtnExtra]} onPress={() => handleBall(0, 'bye', true, 'bye', 0)}>
                <Text style={styles.ballBtnExtraText}>BYE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ballBtnWide, styles.ballBtnExtra]} onPress={() => handleBall(0, 'legBye', true, 'legBye', 0)}>
                <Text style={styles.ballBtnExtraText}>LEG BYE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ballBtnWide, styles.ballBtnWicket]} onPress={handleWicketTap}>
                <Text style={styles.ballBtnWicketText}>WICKET 🔴</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Last Over Circles */}
          <View style={styles.lastOverSection}>
            <Text style={styles.lastOverLabel}>This Over</Text>
            <View style={styles.lastOverBalls}>
              {lastOverBalls.map((b, i) => <BallCircle key={i} ball={b} small />)}
              {lastOverBalls.length === 0 && <Text style={styles.noOverText}>—</Text>}
            </View>
          </View>

          {/* Extras */}
          <View style={styles.extrasRow}>
            {[['W', wides], ['NB', noBalls], ['B', byes], ['LB', legByes]].map(([label, val]) => (
              <View key={label} style={styles.extraItem}>
                <Text style={styles.extraLabel}>{label}</Text>
                <Text style={styles.extraVal}>{val}</Text>
              </View>
            ))}
            <View style={styles.extraItem}>
              <Text style={styles.extraLabel}>Total Extras</Text>
              <Text style={styles.extraVal}>{wides + noBalls + byes + legByes}</Text>
            </View>
          </View>

          {/* Undo */}
          <TouchableOpacity style={styles.undoBtn} onPress={handleUndo}>
            <Text style={styles.undoBtnText}>↩ Undo Last Ball</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Modals */}
      <PickerModal
        visible={strikerPickerVisible}
        title="Select Striker"
        options={battingTeamPlayers.filter((p) => !state.batterStats.find((b) => b.name === p && b.isOut) && p !== nonStriker)}
        onSelect={(p) => { setStriker(p); setStrikerPickerVisible(false); updateMatch(matchId, { currentBatters: [p, nonStriker] }); }}
        onClose={() => setStrikerPickerVisible(false)}
      />
      <PickerModal
        visible={nonStrikerPickerVisible}
        title="Select Non-Striker"
        options={battingTeamPlayers.filter((p) => !state.batterStats.find((b) => b.name === p && b.isOut) && p !== striker)}
        onSelect={(p) => { setNonStriker(p); setNonStrikerPickerVisible(false); updateMatch(matchId, { currentBatters: [striker, p] }); }}
        onClose={() => setNonStrikerPickerVisible(false)}
      />
      <PickerModal
        visible={bowlerPickerVisible}
        title="Select Bowler"
        options={availableBowlers}
        onSelect={(p) => { setBowler(p); setBowlerPickerVisible(false); updateMatch(matchId, { currentBowler: p }); }}
        onClose={() => setBowlerPickerVisible(false)}
      />
      <PickerModal
        visible={newBatterPickerVisible}
        title="New Batter"
        options={availableBatters}
        onSelect={handleNewBatterSelect}
        onClose={() => setNewBatterPickerVisible(false)}
      />
      <PickerModal
        visible={newBowlerPickerVisible}
        title="New Bowler (different from last over)"
        options={availableBowlers}
        onSelect={handleNewBowlerSelect}
        onClose={() => setNewBowlerPickerVisible(false)}
      />
      <DismissalModal
        visible={dismissalModalVisible}
        batterName={striker || ''}
        onConfirm={handleDismissalConfirm}
        onClose={() => setDismissalModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  headerActions: { flexDirection: 'row', gap: 8 },
  endBtn: { backgroundColor: colors.error, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  endBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  declareBtn: { backgroundColor: colors.warning, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  declareBtnText: { color: colors.background, fontWeight: 'bold', fontSize: 13 },

  scorePanel: {
    backgroundColor: colors.surfaceElevated,
    padding: 20, alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  teamNameLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: 4 },
  scoreBig: { color: colors.textPrimary, fontSize: 48, fontWeight: 'bold', letterSpacing: -1 },
  oversText: { color: colors.textSecondary, fontSize: 15, marginTop: 2 },
  rateRow: { flexDirection: 'row', marginTop: 6 },
  rateText: { color: colors.textSecondary, fontSize: 13 },
  leadTrail: { color: colors.accent, fontSize: 13, marginTop: 6, textAlign: 'center' },
  inningsLabel: { color: colors.textMuted, fontSize: 11, marginTop: 4 },

  playersPanel: {
    backgroundColor: colors.surface,
    marginHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  playerRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  strikerBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(200,255,58,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  strikerStar: { color: colors.accent, fontWeight: 'bold', fontSize: 14 },
  nonStrikerDot: { color: colors.textMuted, fontSize: 16 },
  playerName: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  playerStats: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  selectPlayerText: { color: colors.accent, fontSize: 14, flex: 1 },

  ballInputSection: { padding: 16, gap: 10 },
  ballRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  ballBtn: {
    flex: 1, minWidth: 48, paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
  },
  ballBtnText: { color: colors.textPrimary, fontWeight: 'bold', fontSize: 16 },
  ballBtnGreen: { backgroundColor: colors.success, borderColor: colors.success },
  ballBtnYellow: { backgroundColor: colors.warning, borderColor: colors.warning },
  ballBtnWide: {
    flex: 1, minWidth: 60, paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, borderWidth: 1,
  },
  ballBtnExtra: { backgroundColor: 'rgba(255,152,0,0.15)', borderColor: '#FF9800' },
  ballBtnExtraText: { color: '#FF9800', fontWeight: '700', fontSize: 11 },
  ballBtnWicket: { backgroundColor: 'rgba(255,82,82,0.15)', borderColor: colors.error },
  ballBtnWicketText: { color: colors.error, fontWeight: '700', fontSize: 11 },

  lastOverSection: { paddingHorizontal: 16, paddingVertical: 10 },
  lastOverLabel: { color: colors.textMuted, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  lastOverBalls: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  noOverText: { color: colors.textMuted },
  ballCircle: { alignItems: 'center', justifyContent: 'center' },
  ballCircleText: { color: '#fff', fontWeight: 'bold' },

  extrasRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
    gap: 4,
  },
  extraItem: { flex: 1, alignItems: 'center' },
  extraLabel: { color: colors.textMuted, fontSize: 10, textTransform: 'uppercase' },
  extraVal: { color: colors.textPrimary, fontWeight: 'bold', fontSize: 16, marginTop: 2 },

  undoBtn: {
    marginHorizontal: 16, marginTop: 12,
    paddingVertical: 14, alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  undoBtnText: { color: colors.warning, fontWeight: '600', fontSize: 14 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#1A1A1A', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '80%',
  },
  modalTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalOption: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalOptionText: { color: colors.textPrimary, fontSize: 16, textAlign: 'center' },
  modalCancel: { marginTop: 12, paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { color: colors.textMuted, fontSize: 16 },

  dismissalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  dismissalBtn: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 8, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  dismissalBtnActive: { backgroundColor: colors.error, borderColor: colors.error },
  dismissalText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  dismissalTextActive: { color: '#fff' },
  confirmBtn: { backgroundColor: colors.error, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginBottom: 4 },
  confirmBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
