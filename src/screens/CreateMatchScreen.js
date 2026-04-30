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
  content: { padding: 20, gap: 8 },
  label: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginTop: 12, textTransform: 'uppercase' },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.textPrimary,
    fontSize: 15,
    marginTop: 6,
  },
  toggleRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  toggleBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  toggleBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  toggleText: { color: colors.textSecondary, fontWeight: '600' },
  toggleTextActive: { color: colors.background },
  oversGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  oversBtn: {
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 8, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  oversBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  oversBtnText: { color: colors.textSecondary, fontWeight: '600' },
  oversBtnTextActive: { color: colors.background },
  nextButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 24,
  },
  nextButtonText: { color: colors.background, fontWeight: 'bold', fontSize: 16 },
});
