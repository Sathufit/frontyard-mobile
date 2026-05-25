import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { serverTimestamp } from 'firebase/firestore';
import { createMatch } from '../services/matchService';
import { colors, PLAYERS } from '../utils/constants';

export default function SelectPlayersScreen({ route, navigation }) {
  const { matchName, matchType, oversLimit, teamA, teamB } = route.params;

  const [teamAPlayers, setTeamAPlayers] = useState([]);
  const [teamBPlayers, setTeamBPlayers] = useState([]);
  const [currentTeam, setCurrentTeam] = useState('A'); // 'A' or 'B'
  const [playerPool, setPlayerPool] = useState(PLAYERS);
  const [customPlayer, setCustomPlayer] = useState('');
  const [tossWinner, setTossWinner] = useState(null);
  const [tossDecision, setTossDecision] = useState('bat');
  const [step, setStep] = useState('selectA'); // selectA | selectB | toss
  const [loading, setLoading] = useState(false);

  const selectedPlayers = currentTeam === 'A' ? teamAPlayers : teamBPlayers;
  const setSelectedPlayers = currentTeam === 'A' ? setTeamAPlayers : setTeamBPlayers;

  function togglePlayer(name) {
    if (selectedPlayers.includes(name)) {
      setSelectedPlayers(selectedPlayers.filter((p) => p !== name));
    } else if (selectedPlayers.length < 11) {
      setSelectedPlayers([...selectedPlayers, name]);
    } else {
      Alert.alert('Max 11 players', 'Remove a player first.');
    }
  }

  function addCustomPlayer() {
    const name = customPlayer.trim();
    if (!name) return;
    if (!playerPool.includes(name)) setPlayerPool([...playerPool, name]);
    togglePlayer(name);
    setCustomPlayer('');
  }

  function movePlayer(index, dir) {
    const arr = [...selectedPlayers];
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= arr.length) return;
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    setSelectedPlayers(arr);
  }

  function handleNextStep() {
    if (step === 'selectA') {
      if (teamAPlayers.length < 2) { Alert.alert('Error', 'Select at least 2 players for ' + teamA); return; }
      setCurrentTeam('B');
      setStep('selectB');
    } else if (step === 'selectB') {
      if (teamBPlayers.length < 2) { Alert.alert('Error', 'Select at least 2 players for ' + teamB); return; }
      setTossWinner(teamA);
      setStep('toss');
    } else if (step === 'toss') {
      if (!tossWinner) { Alert.alert('Error', 'Select toss winner.'); return; }
      handleStartMatch();
    }
  }

  async function handleStartMatch() {
    setLoading(true);
    try {
      const battingFirst = tossDecision === 'bat' ? tossWinner : (tossWinner === teamA ? teamB : teamA);
      const bowlingFirst = battingFirst === teamA ? teamB : teamA;
      const battingFirstPlayers = battingFirst === teamA ? teamAPlayers : teamBPlayers;
      const bowlingFirstPlayers = battingFirst === teamA ? teamBPlayers : teamAPlayers;

      const matchId = await createMatch({
        title: matchName,
        matchType,
        oversLimit: matchType === 'LIMITED_OVERS' ? oversLimit : null,
        teamA,
        teamB,
        teamAPlayers,
        teamBPlayers,
        tossWinner,
        tossDecision,
        score: '0/0',
        overs: 'Overs: 0.0',
        runRate: 'Rate: 0.00',
        matchStatus: 'In Progress',
        leadTrail: `${battingFirst} batting`,
        result: '',
        matchFinished: false,
        status: 'live',
        battingCardTitle: `${battingFirst} - Batting`,
        bowlingCardTitle: `${bowlingFirst} - Bowling`,
        currentInnings: 1,
        currentOver: 0,
        currentBall: 0,
        currentBatters: [null, null],
        currentBowler: null,
        balls: [],
        batterStats: [],
        bowlerStats: [],
        innings1: null,
        innings2: null,
        innings3: null,
        innings4: null,
        target: 0,
      });

      navigation.replace('Scoring', {
        matchId,
        matchName,
        matchType,
        oversLimit: matchType === 'LIMITED_OVERS' ? oversLimit : null,
        teamA,
        teamB,
        teamAPlayers,
        teamBPlayers,
        tossWinner,
        tossDecision,
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to create match: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  if (step === 'toss') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#002419', '#003527']} style={styles.gradientHeader}>
          <SafeAreaView edges={['top']} style={styles.gradientHeaderInner}>
            <Text style={styles.gradientLabel}>TOSS</Text>
            <Text style={styles.gradientTitle}>Coin Toss</Text>
          </SafeAreaView>
        </LinearGradient>
        <ScrollView contentContainerStyle={styles.content}>

          <Text style={styles.label}>Toss Winner</Text>
          <View style={styles.toggleRow}>
            {[teamA, teamB].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.toggleBtn, tossWinner === t && styles.toggleBtnActive]}
                onPress={() => setTossWinner(t)}
              >
                {tossWinner === t ? (
                  <LinearGradient colors={['#003527', '#064e3b']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.toggleBtnGradient}>
                    <Text style={styles.toggleTextActive}>{t}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.toggleText}>{t}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Decision</Text>
          <View style={styles.toggleRow}>
            {['bat', 'bowl'].map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.toggleBtn, tossDecision === d && styles.toggleBtnActive]}
                onPress={() => setTossDecision(d)}
              >
                {tossDecision === d ? (
                  <LinearGradient colors={['#003527', '#064e3b']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.toggleBtnGradient}>
                    <Text style={styles.toggleTextActive}>{d.charAt(0).toUpperCase() + d.slice(1)} First</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.toggleText}>{d.charAt(0).toUpperCase() + d.slice(1)} First</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {tossWinner && (
            <Text style={styles.tossSummary}>
              {tossWinner} chose to {tossDecision} first
            </Text>
          )}

          <TouchableOpacity style={styles.nextButtonOuter} onPress={handleNextStep} disabled={loading} activeOpacity={0.88}>
            <LinearGradient colors={['#003527', '#064e3b']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.nextButton}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.nextButtonText}>Start Match</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const teamName = currentTeam === 'A' ? teamA : teamB;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#002419', '#003527']} style={styles.gradientHeader}>
        <SafeAreaView edges={['top']} style={styles.gradientHeaderInner}>
          <Text style={styles.gradientLabel}>{currentTeam === 'A' ? 'TEAM A' : 'TEAM B'}</Text>
          <Text style={styles.gradientTitle}>
            {teamName} — {selectedPlayers.length}/11
          </Text>
          <Text style={styles.gradientSub}>Select & order batting lineup</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Selected Players */}
        {selectedPlayers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Batting Order</Text>
            {selectedPlayers.map((p, i) => (
              <View key={p} style={styles.selectedRow}>
                <Text style={styles.orderNum}>{i + 1}</Text>
                <Text style={styles.playerNameSelected}>{p}</Text>
                <View style={styles.moveButtons}>
                  <TouchableOpacity onPress={() => movePlayer(i, -1)} style={styles.moveBtn}>
                    <Text style={styles.moveBtnText}>↑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => movePlayer(i, 1)} style={styles.moveBtn}>
                    <Text style={styles.moveBtnText}>↓</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => togglePlayer(p)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Player Pool */}
        <Text style={styles.label}>All Players</Text>
        {playerPool.map((p) => {
          const isSelected = selectedPlayers.includes(p);
          const isOtherTeam = (currentTeam === 'A' ? teamBPlayers : teamAPlayers).includes(p);
          return (
            <TouchableOpacity
              key={p}
              style={[styles.playerRow, isSelected && styles.playerRowSelected, isOtherTeam && styles.playerRowDisabled]}
              onPress={() => !isOtherTeam && togglePlayer(p)}
              disabled={isOtherTeam}
            >
              <Text style={[styles.playerName, isSelected && styles.playerNameActive, isOtherTeam && { color: colors.textMuted }]}>{p}</Text>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          );
        })}

        {/* Add Custom Player */}
        <Text style={[styles.label, { marginTop: 16 }]}>Add Custom Player</Text>
        <View style={styles.customRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={customPlayer}
            onChangeText={setCustomPlayer}
            placeholder="Player name"
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addCustomPlayer}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.nextButtonOuter} onPress={handleNextStep} activeOpacity={0.88}>
          <LinearGradient colors={['#003527', '#064e3b']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.nextButton}>
            <Text style={styles.nextButtonText}>
              {step === 'selectA' ? `Next: ${teamB} Players →` : 'Next: Toss →'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Gradient header (shared between select and toss screens)
  gradientHeader: { paddingBottom: 24 },
  gradientHeaderInner: { paddingHorizontal: 24, paddingTop: 4 },
  gradientLabel: {
    color: colors.primaryFixedDim,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  gradientTitle: { color: '#ffffff', fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  gradientSub: { color: 'rgba(255,255,255,0.60)', fontSize: 13, marginTop: 4 },

  content: { padding: 20, paddingBottom: 48 },
  section: { marginBottom: 8 },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 12,
  },

  // Batting order rows
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentDim,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 5,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  orderNum: {
    color: colors.primary,
    fontWeight: '800',
    width: 26,
    fontSize: 14,
  },
  playerNameSelected: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  moveButtons: { flexDirection: 'row', gap: 4, marginRight: 8 },
  moveBtn: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moveBtnText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  removeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  removeBtnText: { color: colors.error, fontSize: 15, fontWeight: '700' },

  // Pool rows
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerRowSelected: { borderColor: colors.primary, backgroundColor: colors.accentDim },
  playerRowDisabled: { opacity: 0.35 },
  playerName: { color: colors.textPrimary, fontSize: 14 },
  playerNameActive: { color: colors.primary, fontWeight: '700' },
  checkmark: { color: colors.primary, fontWeight: '700', fontSize: 16 },

  customRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  addBtnText: { color: colors.textPrimary, fontWeight: '700' },

  nextButtonOuter: {
    marginTop: 24,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#003527',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  nextButton: { paddingVertical: 18, alignItems: 'center' },
  nextButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },

  // Toss toggle
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 14,
    padding: 4,
    marginBottom: 8,
  },
  toggleBtn: { flex: 1, borderRadius: 11, overflow: 'hidden' },
  toggleBtnActive: {},
  toggleBtnGradient: { paddingVertical: 12, alignItems: 'center' },
  toggleText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 14,
    paddingVertical: 12,
    textAlign: 'center',
  },
  toggleTextActive: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  tossSummary: {
    color: colors.primary,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    marginVertical: 20,
    letterSpacing: 0.2,
  },
});
