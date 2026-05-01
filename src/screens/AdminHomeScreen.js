import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/constants';

export default function AdminHomeScreen({ navigation }) {
  const { logout } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeLabel}>ADMIN PANEL</Text>
          <Text style={styles.welcomeTitle}>Frontyard Cricket</Text>
          <Text style={styles.welcomeSub}>Manage and score matches</Text>
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionLabel}>Account</Text>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.75}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.accentDim }]}>
              <Text style={[styles.actionIconText, { color: colors.accent }]}>S</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Settings</Text>
              <Text style={styles.actionSub}>App info and preferences</Text>
            </View>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { borderBottomWidth: 0 }]}
            onPress={logout}
            activeOpacity={0.75}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.errorDim }]}>
              <Text style={[styles.actionIconText, { color: colors.error }]}>X</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.error }]}>Sign Out</Text>
              <Text style={styles.actionSub}>Exit admin mode</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 20 },
  welcomeCard: {
    backgroundColor: colors.accentDim,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.accentMed,
  },
  welcomeLabel: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  welcomeTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  welcomeSub: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  actionsSection: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 14,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconText: { fontWeight: '700', fontSize: 15 },
  actionContent: { flex: 1 },
  actionTitle: { color: colors.textPrimary, fontWeight: '600', fontSize: 15 },
  actionSub: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  actionChevron: { color: colors.textMuted, fontSize: 20, fontWeight: '300' },
});
