import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/constants';

export default function LoginScreen({ navigation, isEmbedded = false }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter username and password.');
      return;
    }
    setLoading(true);
    const success = await login(username.trim(), password);
    setLoading(false);
    if (!success) {
      Alert.alert('Login Failed', 'Invalid username or password.');
    }
  }

  return (
    <View style={styles.safeArea}>
      {/* Dark emerald header */}
      <LinearGradient
        colors={['#002419', '#003527']}
        style={styles.header}
      >
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          <Text style={styles.wordmark}>FRONTYARD</Text>
          <Text style={styles.brandTitle}>{isEmbedded ? 'Sign In' : 'Admin'}</Text>
          <Text style={styles.brandSub}>
            {isEmbedded ? 'Sign in to start or manage matches' : 'Access the admin dashboard'}
          </Text>
        </SafeAreaView>
      </LinearGradient>

      {/* Form area */}
      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Username</Text>
            <TextInput
              style={[styles.input, focusedField === 'user' && styles.inputFocused]}
              placeholder="Enter username"
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocusedField('user')}
              onBlur={() => setFocusedField(null)}
            />

            <Text style={[styles.formLabel, { marginTop: 16 }]}>Password</Text>
            <TextInput
              style={[styles.input, focusedField === 'pass' && styles.inputFocused]}
              placeholder="Enter password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onFocus={() => setFocusedField('pass')}
              onBlur={() => setFocusedField(null)}
            />

            <TouchableOpacity style={styles.buttonOuter} onPress={handleLogin} disabled={loading} activeOpacity={0.88}>
              <LinearGradient
                colors={['#003527', '#064e3b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  // Header
  header: { paddingBottom: 32 },
  headerInner: { paddingHorizontal: 28, paddingTop: 8, alignItems: 'center' },
  wordmark: {
    color: colors.primaryFixedDim,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
  },
  brandSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },

  // Form
  formWrapper: { flex: 1, justifyContent: 'center' },
  inner: { paddingHorizontal: 24 },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    marginTop: -24,
  },
  formLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.surface,
  },
  buttonOuter: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#003527',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  button: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
});
