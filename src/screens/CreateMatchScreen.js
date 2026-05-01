import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, OVERS_OPTIONS } from '../utils/constants';

export default function CreateMatchScreen({ navigation }) {
  const [matchName, setMatchName] = useState('');
  const [matchType, setMatchType] = useState('LIMITED_OVERS');
  const [oversLimit, setOversLimit] = useState(20);
  const [customOvers, setCustomOvers] = useState('');
  const [isCustomOvers, setIsCustomOvers] = useState(false);
  const [teamA, setTeamA] = useState('Frontyard');
  const [teamB, setTeamB] = useState('');

  function handleNext() {
    if (!matchName.trim()) { Alert.alert('Error', 'Please enter a match name.'); return; }
    if (!teamB.trim()) { Alert.alert('Error', 'Please enter Team B name.'); return; }

    let finalOvers = oversLimit;
    if (matchType === 'LIMITED_OVERS') {
      if (isCustomOvers) {
        const n = parseInt(customOvers, 10);
        if (isNaN(n) || n < 1) { Alert.alert('Error', 'Enter a valid number of overs.'); return; }
        finalOvers = n;
      }
    }

    navigation.navigate('SelectPlayers', {
      matchName: matchName.trim(),
      matchType,
      oversLimit: matchType === 'LIMITED_OVERS' ? finalOvers : null,
      teamA: teamA.trim(),
      teamB: teamB.trim(),
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Text style={styles.label}>Match Name</Text>
        <TextInput
          style={styles.input}
          value={matchName}
          onChangeText={setMatchName}
          placeholder="e.g. Frontyard vs Rivals - 2026-04-30"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Match Type</Text>
        <View style={styles.toggleRow}>
          {['LIMITED_OVERS', 'TEST'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.toggleBtn, matchType === type && styles.toggleBtnActive]}
              onPress={() => setMatchType(type)}
            >
              <Text style={[styles.toggleText, matchType === type && styles.toggleTextActive]}>
                {type === 'LIMITED_OVERS' ? 'Limited Overs' : 'Test Match'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {matchType === 'LIMITED_OVERS' && (
          <>
            <Text style={styles.label}>Overs</Text>
            <View style={styles.oversGrid}>
              {OVERS_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o}
                  style={[styles.oversBtn, !isCustomOvers && oversLimit === o && styles.oversBtnActive]}
                  onPress={() => { setOversLimit(o); setIsCustomOvers(false); }}
                >
                  <Text style={[styles.oversBtnText, !isCustomOvers && oversLimit === o && styles.oversBtnTextActive]}>
                    {o}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.oversBtn, isCustomOvers && styles.oversBtnActive]}
                onPress={() => setIsCustomOvers(true)}
              >
                <Text style={[styles.oversBtnText, isCustomOvers && styles.oversBtnTextActive]}>Custom</Text>
              </TouchableOpacity>
            </View>
            {isCustomOvers && (
              <TextInput
                style={styles.input}
                value={customOvers}
                onChangeText={setCustomOvers}
                placeholder="Enter number of overs"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
            )}
          </>
        )}

        <Text style={styles.label}>Team A</Text>
        <TextInput
          style={styles.input}
          value={teamA}
          onChangeText={setTeamA}
          placeholder="Team A name"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Team B</Text>
        <TextInput
          style={styles.input}
          value={teamB}
          onChangeText={setTeamB}
          placeholder="Team B name"
          placeholderTextColor={colors.textMuted}
        />

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 8, paddingBottom: 40 },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 15,
  },
  toggleRow: { flexDirection: 'row', gap: 8, backgroundColor: colors.surface, borderRadius: 12, padding: 3 },
  toggleBtn: {
    flex: 1, paddingVertical: 11, alignItems: 'center',
    borderRadius: 10,
  },
  toggleBtnActive: { backgroundColor: colors.surfaceElevated },
  toggleText: { color: colors.textMuted, fontWeight: '600', fontSize: 14 },
  toggleTextActive: { color: colors.textPrimary },
  oversGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  oversBtn: {
    paddingHorizontal: 20, paddingVertical: 11,
    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  oversBtnActive: { backgroundColor: colors.accentDim, borderColor: colors.accentMed },
  oversBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  oversBtnTextActive: { color: colors.accent, fontWeight: '700' },
  nextButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 28,
  },
  nextButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, letterSpacing: 0.2 },
});
