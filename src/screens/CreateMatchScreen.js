import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, OVERS_OPTIONS } from '../utils/constants';

export default function CreateMatchScreen({ navigation }) {
  const [matchName, setMatchName] = useState('');
  const [matchType, setMatchType] = useState('LIMITED_OVERS');
  const [oversLimit, setOversLimit] = useState(20);
  const [customOvers, setCustomOvers] = useState('');
  const [isCustomOvers, setIsCustomOvers] = useState(false);
  const [teamA, setTeamA] = useState('Frontyard');
  const [teamB, setTeamB] = useState('');
  const [focusedField, setFocusedField] = useState(null);

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#002419', '#003527']} style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          <Text style={styles.headerLabel}>NEW MATCH</Text>
          <Text style={styles.headerTitle}>Setup</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Text style={styles.label}>Match Name</Text>
        <TextInput
          style={[styles.input, focusedField === 'name' && styles.inputFocused]}
          value={matchName}
          onChangeText={setMatchName}
          placeholder="e.g. Frontyard vs Rivals – Apr 30"
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocusedField('name')}
          onBlur={() => setFocusedField(null)}
        />

        <Text style={styles.label}>Match Type</Text>
        <View style={styles.toggleRow}>
          {['LIMITED_OVERS', 'TEST'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.toggleBtn, matchType === type && styles.toggleBtnActive]}
              onPress={() => setMatchType(type)}
            >
              {matchType === type ? (
                <LinearGradient colors={['#003527', '#064e3b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.toggleBtnGradient}>
                  <Text style={styles.toggleTextActive}>
                    {type === 'LIMITED_OVERS' ? 'Limited Overs' : 'Test Match'}
                  </Text>
                </LinearGradient>
              ) : (
                <Text style={styles.toggleText}>
                  {type === 'LIMITED_OVERS' ? 'Limited Overs' : 'Test Match'}
                </Text>
              )}
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
                style={[styles.input, focusedField === 'overs' && styles.inputFocused]}
                value={customOvers}
                onChangeText={setCustomOvers}
                placeholder="Enter number of overs"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                onFocus={() => setFocusedField('overs')}
                onBlur={() => setFocusedField(null)}
              />
            )}
          </>
        )}

        <Text style={styles.label}>Team A</Text>
        <TextInput
          style={[styles.input, focusedField === 'teamA' && styles.inputFocused]}
          value={teamA}
          onChangeText={setTeamA}
          placeholder="Team A name"
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocusedField('teamA')}
          onBlur={() => setFocusedField(null)}
        />

        <Text style={styles.label}>Team B</Text>
        <TextInput
          style={[styles.input, focusedField === 'teamB' && styles.inputFocused]}
          value={teamB}
          onChangeText={setTeamB}
          placeholder="Team B name"
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocusedField('teamB')}
          onBlur={() => setFocusedField(null)}
        />

        <TouchableOpacity style={styles.nextButtonOuter} onPress={handleNext} activeOpacity={0.88}>
          <LinearGradient
            colors={['#003527', '#064e3b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>Next →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingBottom: 24 },
  headerInner: { paddingHorizontal: 24, paddingTop: 4 },
  headerLabel: {
    color: colors.primaryFixedDim,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headerTitle: { color: '#ffffff', fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  content: { padding: 20, paddingBottom: 48 },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 15,
  },
  inputFocused: { borderColor: colors.primary, borderWidth: 2 },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 14,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    borderRadius: 11,
    overflow: 'hidden',
  },
  toggleBtnActive: {},
  toggleBtnGradient: {
    paddingVertical: 11,
    alignItems: 'center',
  },
  toggleText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 14,
    paddingVertical: 11,
    textAlign: 'center',
  },
  toggleTextActive: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  oversGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  oversBtn: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  oversBtnActive: { backgroundColor: colors.accentDim, borderColor: colors.primary },
  oversBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  oversBtnTextActive: { color: colors.primary, fontWeight: '700' },
  nextButtonOuter: {
    marginTop: 32,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#003527',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  nextButton: { paddingVertical: 18, alignItems: 'center' },
  nextButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 16, letterSpacing: 0.2 },
});

