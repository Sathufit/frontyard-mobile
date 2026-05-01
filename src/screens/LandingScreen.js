import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subscribeToMatches } from '../services/matchService';
import { colors } from '../utils/constants';

function isFinished(m) {
  return (
    (m.result && m.result.trim() !== '') ||
    m.matchFinished === true ||
    m.status === 'finished' ||
    (m.leadTrail && m.leadTrail.toLowerCase().includes('won'))
  );
}

function LivePulse() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.pulseWrapper}>
      <Animated.View style={[styles.pulseBg, { transform: [{ scale: pulse }], opacity: pulse.interpolate({ inputRange: [1, 1.5], outputRange: [0.4, 0] }) }]} />
      <View style={styles.pulseDot} />
    </View>
  );
}

export default function LandingScreen({ navigation }) {
  const [liveCount, setLiveCount] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsub = subscribeToMatches((data) => {
      setLiveCount(data.filter((m) => !isFinished(m)).length);
    });
    return unsub;
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(btnAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Background accent orb */}
      <View style={styles.orb} />

      {/* Hero content */}
      <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.wordmarkRow}>
          <Text style={styles.wordmark}>FRONTYARD</Text>
        </View>
        <Text style={styles.heroTitle}>Cricket</Text>
        <Text style={styles.heroSub}>Live scores & match tracking</Text>
      </Animated.View>

      {/* Live badge */}
      {liveCount > 0 && (
        <Animated.View style={[styles.liveBadge, { opacity: fadeAnim }]}>
          <LivePulse />
          <Text style={styles.liveBadgeText}>
            {liveCount} match{liveCount !== 1 ? 'es' : ''} live right now
          </Text>
        </Animated.View>
      )}

      {/* CTA */}
      <Animated.View style={[styles.ctaArea, { opacity: btnAnim }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('MatchesTab')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>View Matches</Text>
          <Text style={styles.primaryBtnArrow}>→</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.footerHint}>Use the Admin tab to score a match</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  orb: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.accentDim,
    opacity: 0.5,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 48,
  },
  wordmarkRow: {
    marginBottom: 4,
  },
  wordmark: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 70,
  },
  heroSub: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 10,
    letterSpacing: 0.2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.errorDim,
    borderWidth: 1,
    borderColor: 'rgba(217,48,37,0.25)',
    borderRadius: 100,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginBottom: 40,
  },
  pulseWrapper: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseBg: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  liveBadgeText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  ctaArea: {
    width: '100%',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 18,
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  primaryBtnArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  footerHint: {
    position: 'absolute',
    bottom: 32,
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});
