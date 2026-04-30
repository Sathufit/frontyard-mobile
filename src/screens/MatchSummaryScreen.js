import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subscribeToMatch } from '../services/matchService';
import { colors } from '../utils/constants';

function InningsCard({ innings, label }) {
  if (!innings) return null;
  return (
    <View style={styles.inningsCard}>
      <Text style={styles.cardTitle}>{label} — {innings.team}</Text>
      <Text style={styles.cardScore}>{innings.runs}/{innings.wickets} ({innings.overs} ov)</Text>

      <Text style={styles.subTitle}>Batting</Text>
      <View style={styles.tableHeader}>
        {['Batter', 'R', 'B', '4s', '6s', 'SR'].map((h) => (
          <Text key={h} style={[styles.th, h === 'Batter' && styles.thWide]}>{h}</Text>
        ))}
      </View>
      {(innings.batterStats || []).map((b) => (
        <View key={b.name} style={styles.tableRow}>
          <Text style={[styles.td, styles.thWide]}>{b.name}{!b.isOut ? '*' : ''}</Text>
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
      {(innings.bowlerStats || []).map((b) => (
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

export default function MatchSummaryScreen({ route, navigation }) {
  const { matchId, matchName } = route.params;
  const [match, setMatch] = useState(null);

  useEffect(() => {
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Result Banner */}
        <View style={styles.resultBanner}>
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.resultText}>{match.result || 'Match Complete'}</Text>
          <Text style={styles.matchTitle}>{match.title}</Text>
        </View>

        {/* Innings scorecards */}
        <InningsCard innings={match.innings1} label="1st Innings" />
        <InningsCard innings={match.innings2} label="2nd Innings" />
        <InningsCard innings={match.innings3} label="3rd Innings" />
        <InningsCard innings={match.innings4} label="4th Innings" />

        {/* Match Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Match Info</Text>
          <InfoRow label="Match Type" value={match.matchType === 'LIMITED_OVERS' ? `Limited Overs (${match.oversLimit})` : 'Test Match'} />
          <InfoRow label="Toss" value={`${match.tossWinner} won, chose to ${match.tossDecision}`} />
          <InfoRow label="Status" value={match.matchStatus} />
          <Text style={styles.subTitle}>{match.teamA} Players</Text>
          {(match.teamAPlayers || []).map((p, i) => (
            <Text key={i} style={styles.playerItem}>{i + 1}. {p}</Text>
          ))}
          <Text style={[styles.subTitle, { marginTop: 12 }]}>{match.teamB} Players</Text>
          {(match.teamBPlayers || []).map((p, i) => (
            <Text key={i} style={styles.playerItem}>{i + 1}. {p}</Text>
          ))}
        </View>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('AdminHome')}
        >
          <Text style={styles.homeButtonText}>Back to Admin Home</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
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
  content: { padding: 20, gap: 16 },
  resultBanner: {
    backgroundColor: 'rgba(200,255,58,0.08)',
    borderRadius: 16, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(200,255,58,0.3)',
  },
  trophy: { fontSize: 48, marginBottom: 8 },
  resultText: { color: colors.accent, fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  matchTitle: { color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' },

  inningsCard: {
    backgroundColor: colors.surfaceElevated, borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: colors.border,
  },
  cardTitle: { color: colors.accent, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  cardScore: { color: colors.textPrimary, fontSize: 26, fontWeight: 'bold', marginBottom: 12 },
  subTitle: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.3, marginBottom: 6, textTransform: 'uppercase' },
  tableHeader: { flexDirection: 'row', marginBottom: 4 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.surface },
  th: { flex: 1, color: colors.textMuted, fontSize: 11, textAlign: 'center', fontWeight: '600' },
  thWide: { flex: 3, textAlign: 'left' },
  td: { flex: 1, color: colors.textSecondary, fontSize: 12, textAlign: 'center' },

  infoCard: { backgroundColor: colors.surfaceElevated, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.surface },
  infoLabel: { color: colors.textMuted, fontSize: 13 },
  infoValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  playerItem: { color: colors.textSecondary, fontSize: 13, paddingVertical: 2 },

  homeButton: {
    backgroundColor: colors.surfaceElevated, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  homeButtonText: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
});
