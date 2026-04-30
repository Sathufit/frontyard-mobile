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
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Admin Panel</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('CreateMatch')}
        >
          <Text style={styles.primaryButtonText}>+ New Match</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.secondaryButtonText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, gap: 16 },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryButtonText: { color: colors.background, fontWeight: 'bold', fontSize: 17 },
  secondaryButton: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: { color: colors.textPrimary, fontSize: 16 },
  logoutButton: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: colors.error, fontSize: 15, fontWeight: '600' },
});
