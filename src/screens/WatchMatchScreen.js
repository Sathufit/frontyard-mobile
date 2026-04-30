import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subscribeToMatch } from '../services/matchService';
import { colors } from '../utils/constants';

const TABS = ['Scorecard', 'Bowling', 'Ball by Ball', 'Info'];

function BallCircle({ ball }) {
  let bg = colors.textMuted;
  let label = String(ball.runs);

  if (ball.isOut) { bg = colors.error; label = 'W'; }
  else if (ball.runs === 4) { bg = colors.success; label = '4'; }
  else if (ball.runs === 6) { bg = colors.warning; label = '6'; }
  else if (ball.isExtra) { bg = '#FF9800'; label = ball.extraType === 'wide' ? 'Wd' : ball.extraType === 'noBall' ? 'NB' : ball.extraType === 'bye' ? 'B' : 'LB'; }
  else if (ball.runs === 0) { bg = colors.textMuted; label = '•'; }

  return (
    <View style={[styles.ballCircle, { backgroundColor: bg }]}>
      <Text style={styles.ballLabel}>{label}</Text>
    </View>
  );
}

function BatterTable({ batterStats }) {
  return (
    <View>
      <View style={[styles.tableRow, styles.tableHeader]}>
        {['Batter', 'R', 'B', '4s', '6s', 'SR'].map((h) => (
          <Text key={h} style={[styles.tableCell, styles.tableHeaderText, h === 'Batter' && styles.tableCellWide]}>{h}</Text>
        ))}
      </View>
      {batterStats.map((b) => (
        <View key={b.name} style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.tableCellWide, { color: b.isOut ? colors.textMuted : colors.textPrimary }]}>
            {b.name}{!b.isOut ? '*' : ''}
            {b.isOut ? <Text style={styles.outLabel}> {b.outType}</Text> : null}
          </Text>
          <Text style={styles.tableCell}>{b.runs}</Text>
          <Text style={styles.tableCell}>{b.ballsFaced}</Text>
          <Text style={styles.tableCell}>{b.fours}</Text>
          <Text style={styles.tableCell}>{b.sixes}</Text>
          <Text style={styles.tableCell}>{b.strikeRate}</Text>
        </View>
      ))}
    </View>
  );
}

function BowlerTable({ bowlerStats }) {
  return (
    <View>
      <View style={[styles.tableRow, styles.tableHeader]}>
        {['Bowler', 'O', 'R', 'W', 'Econ'].map((h) => (
          <Text key={h} style={[styles.tableCell, styles.tableHeaderText, h === 'Bowler' && styles.tableCellWide]}>{h}</Text>
        ))}
      </View>
      {bowlerStats.map((b) => (
        <View key={b.name} style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.tableCellWide]}>{b.name}</Text>
          <Text style={styles.tableCell}>{b.overs}</Text>
          <Text style={styles.tableCell}>{b.runs}</Text>
          <Text style={styles.tableCell}>{b.wickets}</Text>
          <Text style={styles.tableCell}>{b.economy}</Text>
        </View>
      ))}
    </View>
  );
}

export default function WatchMatchScreen({ route, navigation }) {
  const { matchId, title } = route.params;
  const [match, setMatch] = useState(null);
  const [activeTab, setActiveTab] = useState('Scorecard');

  useEffect(() => {
    navigation.setOptions({ title: title || 'Live Match' });
    const unsub = subscribeToMatch(matchId, setMatch);
    return unsub;
  }, [matchId]);

  if (!match) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const last12 = (match.balls || []).slice(-12);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Score Header */}
      <View style={styles.scoreHeader}>
        <Text style={styles.scoreTitle}>{match.battingCardTitle}</Text>
        <Text style={styles.scoreBig}>{match.score}</Text>
        <Text style={styles.scoreDetail}>{match.overs}  {match.runRate}</Text>
        {match.leadTrail ? <Text style={styles.leadTrail}>{match.leadTrail}</Text> : null}
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16 }}>
        {activeTab === 'Scorecard' && (
          <View>
            <Text style={styles.sectionTitle}>Batting — {match.battingCardTitle?.replace(' - Batting', '')}</Text>
            <BatterTable batterStats={match.batterStats || []} />
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Bowling — {match.bowlingCardTitle?.replace(' - Bowling', '')}</Text>
            <BowlerTable bowlerStats={match.bowlerStats || []} />
          </View>
        )}

        {activeTab === 'Bowling' && (
          <View>
            <Text style={styles.sectionTitle}>Bowling — {match.bowlingCardTitle?.replace(' - Bowling', '')}</Text>
            <BowlerTable bowlerStats={match.bowlerStats || []} />
          </View>
        )}

        {activeTab === 'Ball by Ball' && (
          <View>
            <Text style={styles.sectionTitle}>Last 12 Balls</Text>
            <View style={styles.ballRow}>
              {last12.map((ball, i) => <BallCircle key={i} ball={ball} />)}
            </View>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>All Balls</Text>
            {(match.balls || []).map((ball, i) => (
              <View key={i} style={styles.ballLogRow}>
                <BallCircle ball={ball} />
                <Text style={styles.ballLogText}>
                  {ball.batter} {ball.isOut ? `OUT (${ball.outType})` : `${ball.runs}${ball.isExtra ? ` + ${ball.extraType}` : ''}`} — {ball.bowler}
                </Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'Info' && (
          <View style={{ gap: 12 }}>
            <InfoRow label="Match Type" value={match.matchType === 'LIMITED_OVERS' ? `Limited Overs (${match.oversLimit})` : 'Test Match'} />
            <InfoRow label="Toss" value={`${match.tossWinner} won, chose to ${match.tossDecision}`} />
            <InfoRow label="Status" value={match.matchStatus} />
            <InfoRow label="Result" value={match.result || 'In Progress'} />
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>{match.teamA} Players</Text>
            {(match.teamAPlayers || []).map((p, i) => (
              <Text key={i} style={styles.playerItem}>{i + 1}. {p}</Text>
            ))}
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>{match.teamB} Players</Text>
            {(match.teamBPlayers || []).map((p, i) => (
              <Text key={i} style={styles.playerItem}>{i + 1}. {p}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  scoreHeader: {
    backgroundColor: colors.surfaceElevated,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scoreTitle: { color: colors.textSecondary, fontSize: 13 },
  scoreBig: { color: colors.textPrimary, fontSize: 32, fontWeight: 'bold', marginTop: 4 },
  scoreDetail: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  leadTrail: { color: colors.accent, fontSize: 13, marginTop: 4 },
  tabBar: { borderBottomWidth: 1, borderBottomColor: colors.border, flexGrow: 0 },
  tab: { paddingHorizontal: 16, paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.accent },
  tabText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: colors.accent },
  content: { flex: 1 },
  sectionTitle: { color: colors.accent, fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.surface },
  tableHeader: { borderBottomColor: colors.border },
  tableHeaderText: { color: colors.textMuted, fontWeight: '600', fontSize: 11 },
  tableCell: { flex: 1, color: colors.textPrimary, fontSize: 13, textAlign: 'center' },
  tableCellWide: { flex: 3, textAlign: 'left' },
  outLabel: { color: colors.textMuted, fontSize: 11 },
  ballRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ballCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  ballLabel: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  ballLogRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  ballLogText: { color: colors.textSecondary, fontSize: 13, flex: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.surface },
  infoLabel: { color: colors.textMuted, fontSize: 13 },
  infoValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  playerItem: { color: colors.textSecondary, fontSize: 13, paddingVertical: 2 },
});
