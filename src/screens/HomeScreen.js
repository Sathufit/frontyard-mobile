import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subscribeToMatches } from '../services/matchService';
import { colors } from '../utils/constants';

function isFinished(m) {
  return (
    (m.result && m.result.trim() !== '') ||
    m.matchFinished === true ||
    m.status === 'finished' ||
    (m.leadTrail && m.leadTrail.toLowerCase().includes('won'))
  );
}

function MatchCard({ match, onPress }) {
  const finished = isFinished(match);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={styles.matchTitle} numberOfLines={1}>{match.title}</Text>
        <View style={[styles.badge, finished ? styles.badgeFinished : styles.badgeLive]}>
          <Text style={[styles.badgeText, finished ? styles.badgeTextFinished : styles.badgeTextLive]}>
            {finished ? 'FINISHED' : 'LIVE'}
          </Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <View style={styles.teamBlock}>
          <Text style={styles.teamName}>{match.teamA}</Text>
        </View>
        <Text style={styles.vsText}>vs</Text>
        <View style={[styles.teamBlock, { alignItems: 'flex-end' }]}>
          <Text style={styles.teamName}>{match.teamB}</Text>
        </View>
      </View>

      {match.score ? (
        <Text style={styles.score}>{match.score}</Text>
      ) : null}

      {match.overs ? (
        <Text style={styles.detail}>{match.overs}  {match.runRate}</Text>
      ) : null}

      {match.leadTrail ? (
        <Text style={styles.leadTrail} numberOfLines={2}>{match.leadTrail}</Text>
      ) : null}

      {finished && match.result ? (
        <Text style={styles.result}>{match.result}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('LIVE');

  useEffect(() => {
    const unsub = subscribeToMatches((data) => {
      setMatches(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const liveMatches = matches.filter((m) => !isFinished(m));
  const completedMatches = matches.filter((m) => isFinished(m));
  const displayed = activeTab === 'LIVE' ? liveMatches : completedMatches;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.tabs}>
        {['LIVE', 'COMPLETED'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : displayed.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No {activeTab.toLowerCase()} matches</Text>
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MatchCard
              match={item}
              onPress={() => navigation.navigate('WatchMatch', { matchId: item.id, title: item.title })}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.accent },
  tabText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13, letterSpacing: 0.5 },
  tabTextActive: { color: colors.accent },
  list: { padding: 16, gap: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 16 },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchTitle: { color: colors.textPrimary, fontWeight: '600', fontSize: 14, flex: 1, marginRight: 8 },
  badge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  badgeLive: { backgroundColor: 'rgba(200,255,58,0.15)', borderWidth: 1, borderColor: colors.accent },
  badgeFinished: { backgroundColor: 'rgba(153,153,153,0.1)', borderWidth: 1, borderColor: colors.textMuted },
  badgeText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  badgeTextLive: { color: colors.accent },
  badgeTextFinished: { color: colors.textMuted },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  teamBlock: { flex: 1 },
  teamName: { color: colors.textSecondary, fontSize: 13 },
  vsText: { color: colors.textMuted, fontSize: 12, marginHorizontal: 8 },
  score: { color: colors.textPrimary, fontSize: 22, fontWeight: 'bold' },
  detail: { color: colors.textSecondary, fontSize: 12 },
  leadTrail: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  result: { color: colors.accent, fontSize: 13, fontWeight: '600', marginTop: 2 },
});
