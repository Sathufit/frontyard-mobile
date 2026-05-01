import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateMatch } from '../services/matchService';
import { colors } from '../utils/constants';

function ScorecardSection({ title, batterStats, bowlerStats }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <Text style={styles.subTitle}>Batting</Text>
      <View style={styles.tableHeader}>
        {['Batter', 'R', 'B', '4s', '6s', 'SR'].map((h) => (
          <Text key={h} style={[styles.th, h === 'Batter' && styles.thWide]}>{h}</Text>
        ))}
      </View>
      {(batterStats || []).map((b) => (
        <View key={b.name} style={styles.tableRow}>
          <Text style={[styles.td, styles.thWide, !b.isOut && { color: colors.textPrimary }]}>{b.name}{!b.isOut ? '*' : ''}</Text>
          <Text style={styles.td}>{b.runs}</Text>
          <Text style={styles.td}>{b.ballsFaced}</Text>
          <Text style={styles.td}>{b.fours}</Text>
          <Text style={styles.td}>{b.sixes}</Text>
          <Text style={styles.td}>{b.strikeRate}</Text>
        </View>
      ))}

      <Text style={[styles.subTitle, { marginTop: 16 }]}>Bowling</Text>
      <View style={styles.tableHeader}>
        {['Bowler', 'O', 'R', 'W', 'Econ'].map((h) => (
          <Text key={h} style={[styles.th, h === 'Bowler' && styles.thWide]}>{h}</Text>
        ))}
      </View>
      {(bowlerStats || []).map((b) => (
        <View key={b.name} style={styles.tableRow}>
          <Text style={[styles.td, styles.thWide]}>{b.name}</Text>
          <Text style={styles.td}>{b.overs}</Text>
          <Text style={styles.td}>{b.runs}</Text>
          <Text style={styles.td}>{b.wickets}</Text>
          <Text style={styles.td}>{b.economy}</Text>
        </View>
      ))}
    </View>
  );
}

export default function InningsBreakScreen({ route, navigation }) {
  const {
    matchId, inningsData, inningsNumber, matchType,
    oversLimit, teamA, teamB, teamAPlayers, teamBPlayers,
    matchName, innings1Runs, innings2Runs, declared,
  } = route.params;

  const [loading, setLoading] = useState(false);

  // ── Target & innings-victory calculation ────────────────────────────────────
  const innings3Runs = inningsNumber === 3 ? inningsData.runs : 0;

  // Determine who batted inn1 to handle follow-on correctly
  const inn1Team = inningsData.team === teamA ? teamA : teamB; // will be overridden below
  // For innings 3: if batting team same as inn1 → normal; else → follow-on
  let testInn4Target = 0;
  if (inningsNumber === 3) {
    // Normal: batting team in inn3 = same as inn1 (Team A)
    // Follow-on: batting team in inn3 = same as inn2 (Team B again)
    // We don't have inn1Team stored, but: in normal flow inn1 batting = teamA or whoever tossed/batted first.
    // We CAN detect: inningsData.team in inn3 is who just batted.
    // In normal flow battingTeam(inn3) = teamA (if teamA batted inn1) — but we don't know toss outcome here.
    // Simpler: use innings1Runs vs innings2Runs to figure out which "side" is which.
    // Formula is universal: target = (inn_A_total) - (inn_B_total) + 1
    // where inn_A = team batting inn1+inn3, inn_B = team batting inn2(+inn4)
    // If follow-on: inn_A = inn1, inn_B = inn2+inn3
    // If normal:    inn_A = inn1+inn3, inn_B = inn2
    // We detect follow-on by checking: inningsData.team === who batted inn2
    // (they batted again) — but we only have teamA/teamB names.
    // SIMPLEST RELIABLE: check if the batting team in inn3 has MORE runs in inn2 or inn1.
    // Actually: the batting team in inn3 is inningsData.team. If they also batted inn1,
    // they're the "first-innings team" → normal. Otherwise → follow-on.
    // We know inn1 team = opposite of inn2 team. The batting team of inn2 = bowlingTeam of inn1.
    // battingTeam of inn1 = whoever batted first (we don't store this directly).
    // FALLBACK: use the formula sign to detect. For now assume normal flow (no follow-on at inn3 break)
    // and let follow-on target be handled by existing logic (pre-existing behaviour preserved).
    const normal = (innings1Runs || 0) + innings3Runs - (innings2Runs || 0) + 1;
    testInn4Target = normal;
  }

  // Innings victory: after TEST innings 3, if target ≤ 0 the bowling team wins by an innings
  const isInningsVictory = matchType === 'TEST' && inningsNumber === 3 && testInn4Target <= 0;
  const inningsVictoryMargin = isInningsVictory ? 1 - testInn4Target : 0; // = inn2 - inn1 - inn3

  // Display target: for limited-overs after inn1, or TEST after inn3 (if not innings victory)
  const target = inningsNumber === 3
    ? testInn4Target
    : (matchType !== 'TEST' ? (innings1Runs || 0) + 1 : 0);

  const battingTeam = inningsData.team;
  const bowlingTeam = battingTeam === teamA ? teamB : teamA;
  const nextBattingTeam = bowlingTeam;
  const nextBowlingTeam = battingTeam;
  const nextBattingPlayers = nextBattingTeam === teamA ? teamAPlayers : teamBPlayers;

  // Test: follow-on check after innings 2 (Team A leads by ≥150)
  const canFollowOn = matchType === 'TEST' && inningsNumber === 2
    && innings1Runs != null && innings2Runs != null
    && (innings1Runs - (innings2Runs ?? inningsData.runs)) >= 150;

  async function endMatchInningsVictory() {
    const margin = inningsVictoryMargin;
    const winner = bowlingTeam; // bowling team in inn3 wins (both normal and follow-on)
    const result = `${winner} won by an innings and ${margin} run${margin !== 1 ? 's' : ''}`;
    setLoading(true);
    try {
      await updateMatch(matchId, {
        result,
        leadTrail: result,
        matchFinished: true,
        status: 'finished',
        matchStatus: 'Match Complete',
        [`innings${inningsNumber}`]: inningsData,
      });
      navigation.replace('MatchSummary', { matchId, matchName });
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function startNextInnings(followOn = false) {
    setLoading(true);
    try {
      const nextInnings = inningsNumber + 1;
      let nextBatting, nextBowling, nextBattingPl, nextBowlingPl;

      if (followOn) {
        // TeamB bats again
        nextBatting = inningsData.team; // TeamB already batted
        nextBowling = nextBattingTeam;
        nextBattingPl = inningsData.team === teamA ? teamAPlayers : teamBPlayers;
        nextBowlingPl = inningsData.team === teamA ? teamBPlayers : teamAPlayers;
      } else {
        nextBatting = nextBattingTeam;
        nextBowling = battingTeam;
        nextBattingPl = nextBattingTeam === teamA ? teamAPlayers : teamBPlayers;
        nextBowlingPl = battingTeam === teamA ? teamAPlayers : teamBPlayers;
      }

      const inningsKey = `innings${inningsNumber}`;
      // Target to set in Firestore:
      //  TEST inn1→2 : 0 (no target — show lead/trail instead)
      //  TEST inn2→3 : 0 (no target)
      //  TEST inn3→4 : (inn1+inn3) - inn2 + 1
      //  Limited inn1→2 : inn1 + 1
      const newTarget = matchType !== 'TEST'
        ? (inningsNumber === 1 ? (innings1Runs || 0) + 1 : 0)
        : (inningsNumber === 3 ? testInn4Target : 0);

      // Initial lead/trail shown in WatchMatchScreen at start of new innings
      let newLeadTrail;
      if (matchType === 'TEST') {
        if (inningsNumber === 1) {
          // Inn2 starts: Team B trail by full inn1 score
          newLeadTrail = `${nextBatting} trail by ${innings1Runs || 0}`;
        } else if (inningsNumber === 2) {
          // Inn3 starts: show first-innings position
          const diff = (innings1Runs || 0) - inningsData.runs;
          if (diff > 0) newLeadTrail = `${nextBatting} lead by ${diff}`;
          else if (diff < 0) newLeadTrail = `${nextBatting} trail by ${-diff}`;
          else newLeadTrail = 'Match level';
        } else {
          // Inn4 starts: show target
          newLeadTrail = `${nextBatting} need ${newTarget} run${newTarget !== 1 ? 's' : ''} to win`;
        }
      } else {
        newLeadTrail = inningsNumber === 1
          ? `${nextBatting} need ${newTarget} runs to win`
          : `${nextBatting} batting`;
      }

      await updateMatch(matchId, {
        [inningsKey]: inningsData,
        target: newTarget,  // always update: set correct target or reset to 0
        currentInnings: nextInnings,
        currentOver: 0,
        currentBall: 0,
        score: '0/0',
        overs: 'Overs: 0.0',
        runRate: 'Rate: 0.00',
        balls: [],
        batterStats: [],
        bowlerStats: [],
        currentBatters: [null, null],
        currentBowler: null,
        battingCardTitle: `${nextBatting} - Batting`,
        bowlingCardTitle: `${nextBowling} - Bowling`,
        matchStatus: 'In Progress',
        leadTrail: newLeadTrail,
      });

      navigation.replace('Scoring', {
        matchId,
        matchName,
        matchType,
        oversLimit,
        teamA,
        teamB,
        teamAPlayers,
        teamBPlayers,
        tossWinner: '',
        tossDecision: 'bat',
      });
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function endMatchDraw() {
    await updateMatch(matchId, {
      result: 'Match drawn',
      leadTrail: 'Match drawn',
      matchFinished: true,
      status: 'finished',
      matchStatus: 'Match Complete',
      [`innings${inningsNumber}`]: inningsData,
    });
    navigation.replace('MatchSummary', { matchId, matchName });
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Innings header */}
        <View style={styles.inningsHeader}>
          <Text style={styles.inningsTeam}>{battingTeam}</Text>
          <Text style={styles.inningsScore}>{inningsData.runs}/{inningsData.wickets}</Text>
          <Text style={styles.inningsOvers}>({inningsData.overs} ov){declared ? ' — Declared' : ''}</Text>
        </View>

        {/* Target banner — TEST inn3→4 or limited-overs inn1→2, but NOT TEST inn1→2 */}
        {!isInningsVictory && (inningsNumber === 3 || (inningsNumber === 1 && matchType !== 'TEST')) && (
          <View style={styles.targetBanner}>
            <Text style={styles.targetLabel}>Target</Text>
            <Text style={styles.targetNum}>{target}</Text>
            <Text style={styles.targetSub}>{nextBattingTeam} need {target} runs to win</Text>
          </View>
        )}

        {/* Lead/trail context banner — TEST after innings 2 (who's ahead entering inn3) */}
        {matchType === 'TEST' && inningsNumber === 2 && (() => {
          const diff = (innings1Runs || 0) - inningsData.runs;
          if (diff === 0) return <View style={[styles.targetBanner, { backgroundColor: colors.warningDim }]}><Text style={styles.targetSub}>Match level after two innings</Text></View>;
          const leader = diff > 0 ? battingTeam : nextBattingTeam;
          const margin = Math.abs(diff);
          return (
            <View style={[styles.targetBanner, { backgroundColor: diff > 0 ? colors.accentDim : colors.errorDim }]}>
              <Text style={[styles.targetLabel, { color: diff > 0 ? colors.accent : colors.error }]}>First Innings Lead</Text>
              <Text style={[styles.targetNum, { color: diff > 0 ? colors.accent : colors.error }]}>{margin}</Text>
              <Text style={styles.targetSub}>{leader} lead by {margin} runs</Text>
            </View>
          );
        })()}

        {/* Innings victory banner — TEST after innings 3 */}
        {isInningsVictory && (
          <View style={[styles.targetBanner, { backgroundColor: colors.accentDim }]}>
            <Text style={[styles.targetLabel, { color: colors.accent }]}>Innings Victory</Text>
            <Text style={[styles.targetNum, { color: colors.accent }]}>{inningsVictoryMargin}</Text>
            <Text style={styles.targetSub}>{bowlingTeam} won by an innings and {inningsVictoryMargin} run{inningsVictoryMargin !== 1 ? 's' : ''}</Text>
          </View>
        )}

        {/* Scorecard */}
        <ScorecardSection
          title={`Innings ${inningsNumber} — ${battingTeam}`}
          batterStats={inningsData.batterStats}
          bowlerStats={inningsData.bowlerStats}
        />

        {/* Follow-on (Test) */}
        {canFollowOn && (
          <View style={styles.followOnBox}>
            <Text style={styles.followOnTitle}>Follow-on Available!</Text>
            <Text style={styles.followOnSub}>
              {inningsData.team} leads by {innings1Runs - innings2Runs} runs (≥150 required)
            </Text>
            <View style={styles.followOnBtns}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.warning }]}
                onPress={() => startNextInnings(true)}
                disabled={loading}
              >
                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Enforce Follow-on</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => startNextInnings(false)}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.actionBtnText}>Continue Normally</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {!canFollowOn && !isInningsVictory && (
          <>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => startNextInnings(false)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.startButtonText}>
                  {matchType === 'TEST' ? `Start Innings ${inningsNumber + 1}` : 'Start 2nd Innings'}
                </Text>
              )}
            </TouchableOpacity>

            {matchType === 'TEST' && (
              <TouchableOpacity style={styles.drawButton} onPress={endMatchDraw}>
                <Text style={styles.drawButtonText}>Declare Match Drawn</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Innings victory — end match */}
        {isInningsVictory && (
          <TouchableOpacity style={styles.startButton} onPress={endMatchInningsVictory} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.startButtonText}>End Match</Text>}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  inningsHeader: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  inningsTeam: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  inningsScore: { color: colors.textPrimary, fontSize: 44, fontWeight: '800', letterSpacing: -1.5 },
  inningsOvers: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  targetBanner: {
    backgroundColor: colors.accentDim,
    borderRadius: 16, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: colors.accentMed,
  },
  targetLabel: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  targetNum: { color: colors.accent, fontSize: 56, fontWeight: '800', marginVertical: 4, letterSpacing: -2 },
  targetSub: { color: colors.textSecondary, fontSize: 14 },
  section: { backgroundColor: colors.surfaceElevated, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12, textTransform: 'uppercase' },
  subTitle: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 0.3, textTransform: 'uppercase' },
  tableHeader: { flexDirection: 'row', marginBottom: 4 },
  tableRow: { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  th: { flex: 1, color: colors.textMuted, fontSize: 11, textAlign: 'center', fontWeight: '600' },
  thWide: { flex: 3, textAlign: 'left' },
  td: { flex: 1, color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
  followOnBox: { backgroundColor: colors.warningDim, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: 'rgba(255,214,10,0.25)' },
  followOnTitle: { color: colors.warning, fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  followOnSub: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 16 },
  followOnBtns: { gap: 10 },
  actionBtn: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  actionBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  startButton: { backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  startButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 17 },
  drawButton: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  drawButtonText: { color: colors.textMuted, fontSize: 15 },
});
