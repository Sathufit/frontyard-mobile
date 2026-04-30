import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/constants';

export default function SettingsScreen({ navigation }) {
  const auth = useAuth();
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [changing, setChanging] = useState(false);

  async function handleChangePassword() {
    if (!currentPass || !newPass || !confirmPass) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    if (newPass.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    setChanging(true);
    try {
      const success = await auth.changePassword(currentPass, newPass);
      if (success) {
        Alert.alert('Success', 'Password changed successfully.');
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        Alert.alert('Error', 'Current password is incorrect.');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setChanging(false);
    }
  }

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: () => auth.logout(),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Change Password */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>

          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={currentPass}
            onChangeText={setCurrentPass}
            secureTextEntry
            placeholder="Enter current password"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />

          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPass}
            onChangeText={setNewPass}
            secureTextEntry
            placeholder="Enter new password (min 6 chars)"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPass}
            onChangeText={setConfirmPass}
            secureTextEntry
            placeholder="Re-enter new password"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.saveBtn, changing && { opacity: 0.6 }]}
            onPress={handleChangePassword}
            disabled={changing}
          >
            <Text style={styles.saveBtnText}>{changing ? 'Saving…' : 'Change Password'}</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16 },
  section: { backgroundColor: colors.surfaceElevated, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 8 },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  label: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  input: {
    backgroundColor: colors.surface, color: colors.textPrimary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    borderWidth: 1, borderColor: colors.border,
  },
  saveBtn: { backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: colors.background, fontWeight: 'bold', fontSize: 15 },
  logoutBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.error, backgroundColor: 'rgba(255,82,82,0.06)' },
  logoutBtnText: { color: colors.error, fontWeight: '700', fontSize: 15 },
});
