import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Animated,
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

function LiveDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.8, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.liveDotWrapper}>
      <Animated.View style={[styles.liveDotBg, { transform: [{ scale: pulse }], opacity: pulse.interpolate({ inputRange: [1, 1.8], outputRange: [0.5, 0] }) }]} />
      <View style={styles.liveDot} />
    </View>
  );
}

function MatchCard({ match, onPress, index }) {
  const finished = isFinished(match);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
        {/* Title row */}
        <View style={styles.cardTop}>
          <Text style={styles.matchTitle} numberOfLines={1}>{match.title}</Text>
          <View style={[styles.badge, finished ? styles.badgeFinished : styles.badgeLive]}>
            {!finished && <LiveDot />}
            <Text style={[styles.badgeText, finished ? styles.badgeTextFinished : styles.badgeTextLive]}>
              {finished ? 'FT' : 'LIVE'}
            </Text>
          </View>
        </View>

        {/* Teams */}
        <View style={styles.teamsRow}>
          <Text style={styles.teamName} numberOfLines={1}>{match.teamA}</Text>
          <Text style={styles.vsText}>vs</Text>
          <Text style={[styles.teamName, styles.teamRight]} numberOfLines={1}>{match.teamB}</Text>
        </View>

        {/* Score / details */}
        {match.score ? (
          <Text style={styles.scoreText}>{match.score}</Text>
        ) : null}
        {match.overs || match.runRate ? (
          <Text style={styles.detailText}>{match.overs}{'  '}{match.runRate}</Text>
        ) : null}

        {/* Lead trail */}
        {match.leadTrail ? (
          <View style={styles.leadRow}>
            <Text style={[styles.leadTrail, finished && styles.leadTrailFinished]} numberOfLines={2}>
              {match.leadTrail}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
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
      {/* Segmented tabs */}
      <View style={styles.segmentWrapper}>
        <View style={styles.segment}>
          {['LIVE', 'COMPLETED'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.segTab, activeTab === tab && styles.segTabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.segTabText, activeTab === tab && styles.segTabTextActive]}>
                {tab === 'LIVE' ? `Live${liveMatches.length > 0 ? ` (${liveMatches.length})` : ''}` : 'Completed'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : displayed.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>{activeTab === 'LIVE' ? '○' : '—'}</Text>
          </View>
          <Text style={styles.emptyTitle}>No {activeTab === 'LIVE' ? 'live' : 'completed'} matches</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'LIVE' ? 'Start a match from the + Match tab' : 'Finished matches appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <MatchCard
              match={item}
              index={index}
              onPress={() => navigation.navigate('WatchMatch', { matchId: item.id, title: item.title })}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  segmentWrapper: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  segment: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 3 },
  segTab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  segTabActive: { backgroundColor: colors.surfaceElevated },
  segTabText: { color: colors.textMuted, fontWeight: '600', fontSize: 13, letterSpacing: 0.3 },
  segTabTextActive: { color: colors.textPrimary },

  list: { padding: 16, gap: 10, paddingBottom: 32 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyIconText: { color: colors.textMuted, fontSize: 22, fontWeight: '600' },
  emptyTitle: { color: colors.textSecondary, fontSize: 16, fontWeight: '600', marginBottom: 6, textAlign: 'center' },
  emptySubtitle: { color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 19 },

  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchTitle: { color: colors.textSecondary, fontWeight: '500', fontSize: 13, flex: 1, marginRight: 10 },

  badge: { flexDirection: 'row', alignItems: 'center', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, gap: 5 },
  badgeLive: { backgroundColor: colors.errorDim, borderWidth: 1, borderColor: 'rgba(217,48,37,0.25)' },
  badgeFinished: { backgroundColor: colors.surface },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  badgeTextLive: { color: colors.error },
  badgeTextFinished: { color: colors.textMuted },
  liveDotWrapper: { width: 8, height: 8, alignItems: 'center', justifyContent: 'center' },
  liveDotBg: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.error },

  teamsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamName: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', flex: 1 },
  teamRight: { textAlign: 'right' },
  vsText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },

  scoreText: { color: colors.textPrimary, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  detailText: { color: colors.textSecondary, fontSize: 13 },

  leadRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 2 },
  leadTrail: { color: colors.accent, fontSize: 13, fontWeight: '500' },
  leadTrailFinished: { color: colors.success },
});
