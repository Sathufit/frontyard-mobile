import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
  const slideAnim = useRef(new Animated.Value(32)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;
  const bottomAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsub = subscribeToMatches((data) => {
      setLiveCount(data.filter((m) => !isFinished(m)).length);
    });
    return unsub;
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(btnAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(bottomAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Dark emerald hero section — top 65% */}
      <LinearGradient
        colors={['#002419', '#003527', '#064e3b']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroSection}
      >
        {/* Decorative orb */}
        <View style={styles.orbTopRight} />
        <View style={styles.orbBottomLeft} />

        <SafeAreaView style={styles.heroInner} edges={['top']}>
          <Animated.View style={[styles.heroContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.wordmark}>FRONTYARD</Text>
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
        </SafeAreaView>
      </LinearGradient>

      {/* Light bottom section — CTA */}
      <SafeAreaView style={styles.bottomSection} edges={['bottom']}>
        <Animated.View style={[styles.ctaCard, { opacity: btnAnim }]}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('MatchesTab')}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#003527', '#064e3b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>View Matches</Text>
              <Text style={styles.primaryBtnArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.footerHint}>Use the Admin tab to score a match</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroSection: {
    flex: 0.62,
    position: 'relative',
    overflow: 'hidden',
  },
  heroInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  heroContent: { alignItems: 'center', marginBottom: 32 },
  orbTopRight: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(176,240,214,0.08)',
  },
  orbBottomLeft: {
    position: 'absolute',
    bottom: -40,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(176,240,214,0.05)',
  },
  wordmark: {
    color: colors.primaryFixedDim,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 72,
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 78,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 16,
    marginTop: 12,
    letterSpacing: 0.3,
  },

  // ── Live badge ─────────────────────────────────────────────────────────────
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 100,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  pulseWrapper: { width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
  pulseBg: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#80ffcc',
  },
  pulseDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#80ffcc' },
  liveBadgeText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },

  // ── CTA / Bottom ──────────────────────────────────────────────────────────
  bottomSection: {
    flex: 0.38,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  ctaCard: { gap: 20 },
  primaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#003527',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  primaryBtnArrow: { color: colors.primaryFixedDim, fontSize: 18, fontWeight: '600' },
  footerHint: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});
