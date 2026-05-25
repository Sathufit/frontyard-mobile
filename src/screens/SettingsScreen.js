import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../utils/constants';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#002419', '#003527']} style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          <Text style={styles.headerLabel}>SETTINGS</Text>
          <Text style={styles.headerTitle}>App Info</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.section}>
          <InfoRow label="App" value="Frontyard Cricket" last={false} />
          <InfoRow label="Club" value="Frontyard" last={false} />
          <InfoRow label="Version" value="1.0.0" last />
        </View>

        <Text style={styles.sectionLabel}>Platform</Text>
        <View style={styles.section}>
          <InfoRow label="Framework" value="React Native + Expo" last={false} />
          <InfoRow label="Database" value="Firebase Firestore" last />
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
  content: { padding: 20, gap: 8, paddingBottom: 40 },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginLeft: 4,
    marginTop: 12,
    marginBottom: 6,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { color: colors.textSecondary, fontSize: 15 },
  infoValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
});

