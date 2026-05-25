import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/constants';

export default function AdminHomeScreen({ navigation }) {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Dark emerald header */}
      <LinearGradient colors={['#002419', '#003527']} style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          <Text style={styles.headerLabel}>ADMIN PANEL</Text>
          <Text style={styles.headerTitle}>Frontyard Cricket</Text>
          <Text style={styles.headerSub}>Manage and score matches</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>🏏</Text>
            <Text style={styles.statLabel}>Score matches</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statLabel}>Track analytics</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={styles.statLabel}>Real-time data</Text>
          </View>
        </View>

        {/* Account section */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.75}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.accentDim }]}>
              <Text style={[styles.actionIconGlyph]}>⚙</Text>
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
              <Text style={styles.actionIconGlyph}>↩</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.error }]}>Sign Out</Text>
              <Text style={styles.actionSub}>Exit admin mode</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingBottom: 28 },
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
  headerSub: { color: 'rgba(255,255,255,0.60)', fontSize: 14, marginTop: 4 },

  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: -14,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', textAlign: 'center' },

  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginLeft: 4,
    marginBottom: 4,
  },
  actionsSection: {
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 14,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconGlyph: { fontSize: 18 },
  actionContent: { flex: 1 },
  actionTitle: { color: colors.textPrimary, fontWeight: '600', fontSize: 15 },
  actionSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  actionChevron: { color: colors.textMuted, fontSize: 22, fontWeight: '300' },
});
