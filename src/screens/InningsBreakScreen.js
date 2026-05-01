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

  const target = (innings1Runs || 0) + 1;
  const battingTeam = inningsData.team;
  const bowlingTeam = battingTeam === teamA ? teamB : teamA;
  const nextBattingTeam = bowlingTeam; // for 2nd innings
  const nextBowlingTeam = battingTeam;
  const nextBattingPlayers = nextBattingTeam === teamA ? teamAPlayers : teamBPlayers;

  // Test: follow-on check after innings 2
  const canFollowOn = matchType === 'TEST' && inningsNumber === 2
    && innings1Runs != null && innings2Runs != null
    && (innings1Runs - innings2Runs) >= 150;

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
      const newTarget = inningsNumber === 1 ? innings1Runs + 1 : 0;

      await updateMatch(matchId, {
        [inningsKey]: inningsData,
        ...(inningsNumber === 1 ? { target: newTarget } : {}),
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
        leadTrail: inningsNumber === 1 ? `${nextBatting} need ${newTarget} runs` : `${nextBatting} batting`,
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

        {/* Target banner (after innings 1) */}
        {inningsNumber === 1 && (
          <View style={styles.targetBanner}>
            <Text style={styles.targetLabel}>Target</Text>
            <Text style={styles.targetNum}>{target}</Text>
            <Text style={styles.targetSub}>{nextBattingTeam} need {target} runs to win</Text>
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
        {!canFollowOn && (
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
