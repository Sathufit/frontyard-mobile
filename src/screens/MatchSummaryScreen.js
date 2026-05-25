import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Result Banner — dark emerald gradient */}
        <LinearGradient colors={['#002419', '#003527', '#064e3b']} style={styles.resultBanner}>
          <SafeAreaView edges={['top']} style={styles.resultBannerInner}>
            <Text style={styles.resultLabel}>Match Result</Text>
            <Text style={styles.resultText}>{match.result || 'Match Complete'}</Text>
            <Text style={styles.matchTitle}>{match.title}</Text>
          </SafeAreaView>
        </LinearGradient>

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
          style={styles.newMatchButtonOuter}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'CreateMatch' }] })}
          activeOpacity={0.88}
        >
          <LinearGradient colors={['#003527', '#064e3b']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.newMatchButton}>
            <Text style={styles.newMatchButtonText}>Start New Match</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Admin', { screen: 'AdminHome' })}
        >
          <Text style={styles.homeButtonText}>Back to Admin Home</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
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
  content: { gap: 16, paddingBottom: 40 },

  // Result gradient banner
  resultBanner: {},
  resultBannerInner: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 32,
    alignItems: 'center',
  },
  resultLabel: { color: colors.primaryFixedDim, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' },
  resultText: { color: '#ffffff', fontSize: 26, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5, lineHeight: 32 },
  matchTitle: { color: 'rgba(255,255,255,0.60)', fontSize: 14, marginTop: 10, textAlign: 'center' },

  // Innings cards
  inningsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  cardScore: { color: colors.textPrimary, fontSize: 30, fontWeight: '800', letterSpacing: -0.8, marginBottom: 14 },
  subTitle: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  tableHeader: { flexDirection: 'row', marginBottom: 4 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  th: { flex: 1, color: colors.textMuted, fontSize: 11, textAlign: 'center', fontWeight: '700' },
  thWide: { flex: 3, textAlign: 'left' },
  td: { flex: 1, color: colors.textSecondary, fontSize: 12, textAlign: 'center' },

  // Info card
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { color: colors.textMuted, fontSize: 13 },
  infoValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  playerItem: { color: colors.textSecondary, fontSize: 13, paddingVertical: 3 },

  // Buttons
  newMatchButtonOuter: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#003527',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  newMatchButton: { paddingVertical: 18, alignItems: 'center' },
  newMatchButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  homeButton: {
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  homeButtonText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
});
