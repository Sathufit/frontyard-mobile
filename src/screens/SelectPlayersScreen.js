import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Toss</Text>

          <Text style={styles.label}>Toss Winner</Text>
          <View style={styles.toggleRow}>
            {[teamA, teamB].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.toggleBtn, tossWinner === t && styles.toggleBtnActive]}
                onPress={() => setTossWinner(t)}
              >
                <Text style={[styles.toggleText, tossWinner === t && styles.toggleTextActive]}>{t}</Text>
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
                <Text style={[styles.toggleText, tossDecision === d && styles.toggleTextActive]}>
                  {d.charAt(0).toUpperCase() + d.slice(1)} First
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tossWinner && (
            <Text style={styles.tossSummary}>
              {tossWinner} chose to {tossDecision} first
            </Text>
          )}

          <TouchableOpacity style={styles.nextButton} onPress={handleNextStep} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.nextButtonText}>Start Match</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const teamName = currentTeam === 'A' ? teamA : teamB;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.heading}>
          {teamName} — {selectedPlayers.length}/11
        </Text>
        <Text style={styles.subheading}>Select & order batting lineup</Text>
      </View>

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

        <TouchableOpacity style={styles.nextButton} onPress={handleNextStep}>
          <Text style={styles.nextButtonText}>
            {step === 'selectA' ? `Next: ${teamB} Players →` : 'Next: Toss →'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  heading: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  subheading: { color: colors.textMuted, fontSize: 13, marginTop: 3 },
  content: { padding: 20, gap: 6, paddingBottom: 40 },
  section: { marginBottom: 8 },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  selectedRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.accentDim,
    borderRadius: 10, paddingVertical: 11, paddingHorizontal: 12, marginBottom: 4,
    borderWidth: 1, borderColor: colors.accentMed,
  },
  orderNum: { color: colors.accent, fontWeight: '700', width: 24, fontSize: 14 },
  playerNameSelected: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
  moveButtons: { flexDirection: 'row', gap: 4, marginRight: 8 },
  moveBtn: { paddingHorizontal: 8, paddingVertical: 5, backgroundColor: colors.surface, borderRadius: 6 },
  moveBtnText: { color: colors.textSecondary, fontSize: 13 },
  removeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  removeBtnText: { color: colors.error, fontSize: 15, fontWeight: '600' },
  playerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 16,
    borderRadius: 10, marginBottom: 4,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1, borderColor: colors.border,
  },
  playerRowSelected: { borderColor: colors.accentMed, backgroundColor: colors.accentDim },
  playerRowDisabled: { opacity: 0.35 },
  playerName: { color: colors.textPrimary, fontSize: 14 },
  playerNameActive: { color: colors.accent, fontWeight: '600' },
  checkmark: { color: colors.accent, fontWeight: '700', fontSize: 16 },
  customRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  input: {
    backgroundColor: colors.surfaceElevated, borderColor: colors.border,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: colors.textPrimary, fontSize: 14,
  },
  addBtn: {
    backgroundColor: colors.surfaceElevated, borderColor: colors.border,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center',
  },
  addBtnText: { color: colors.textPrimary, fontWeight: '600' },
  nextButton: {
    backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 18,
    alignItems: 'center', marginTop: 20,
  },
  nextButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  toggleRow: { flexDirection: 'row', gap: 8, backgroundColor: colors.surface, borderRadius: 12, padding: 3, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: colors.surfaceElevated },
  toggleText: { color: colors.textMuted, fontWeight: '600', fontSize: 14 },
  toggleTextActive: { color: colors.textPrimary, fontWeight: '700' },
  tossSummary: { color: colors.accent, textAlign: 'center', fontSize: 16, fontWeight: '600', marginVertical: 20, letterSpacing: 0.2 },
});
