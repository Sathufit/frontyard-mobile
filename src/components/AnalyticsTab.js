import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { colors } from '../utils/constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeOverRuns(balls) {
  if (!balls.length) return [];
  const overData = [];
  let overRuns = 0;
  let legalInOver = 0;
  for (const ball of balls) {
    const isWide = ball.isExtra && ball.extraType === 'wide';
    const isNoBall = ball.isExtra && ball.extraType === 'noBall';
    overRuns += ball.runs + (ball.extraRuns || 0);
    if (!isWide && !isNoBall) {
      legalInOver++;
      if (legalInOver === 6) {
        overData.push(overRuns);
        overRuns = 0;
        legalInOver = 0;
      }
    }
  }
  if (legalInOver > 0 || overRuns > 0) overData.push(overRuns);
  return overData.map((runs, i) => ({ over: i + 1, runs }));
}

function computeWinProbability(match, teamSize) {
  const currentInnings = match.currentInnings || 1;
  const matchType = match.matchType;
  const isFinalChasing = currentInnings > 1 && (matchType !== 'TEST' || currentInnings === 4);
  if (!isFinalChasing || !match.target) return null;
  const [runsStr, wktsStr] = (match.score || '0/0').split('/');
  const currentRuns = parseInt(runsStr) || 0;
  const currentWickets = parseInt(wktsStr) || 0;
  const runsNeeded = match.target - currentRuns;
  const wicketsRemaining = Math.max(0, (teamSize - 1) - currentWickets);
  const oversStr = (match.overs || 'Overs: 0.0').replace('Overs: ', '');
  const [ov, bl] = oversStr.split('.').map(Number);
  const legalBalls = (ov || 0) * 6 + (bl || 0);
  const ballsRemaining = match.oversLimit ? match.oversLimit * 6 - legalBalls : null;
  if (runsNeeded <= 0) return 100;
  if (wicketsRemaining <= 0) return 2;
  if (ballsRemaining !== null && ballsRemaining <= 0) return 2;
  const rrr = ballsRemaining ? (runsNeeded / ballsRemaining) * 6 : 999;
  const wicketWeight = wicketsRemaining / Math.max(teamSize - 1, 1);
  let rrrProb;
  if (rrr <= 4) rrrProb = 0.88;
  else if (rrr <= 6) rrrProb = 0.68;
  else if (rrr <= 7.5) rrrProb = 0.52;
  else if (rrr <= 9) rrrProb = 0.36;
  else if (rrr <= 11) rrrProb = 0.20;
  else if (rrr <= 13) rrrProb = 0.10;
  else rrrProb = 0.04;
  return Math.round(Math.min(Math.max(rrrProb * wicketWeight * 100, 3), 97));
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function WinProbabilityCard({ battingTeam, bowlingTeam, probability }) {
  const probAnim = useRef(new Animated.Value(probability)).current;
  useEffect(() => {
    Animated.timing(probAnim, {
      toValue: probability,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [probability]);
  const fillWidth = probAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const probColor = probability >= 60 ? colors.success : probability >= 40 ? colors.warning : colors.error;
  return (
    <View style={aStyles.card}>
      <Text style={aStyles.cardTitle}>Win Probability</Text>
      <Text style={aStyles.cardSubtitle}>Based on run rate & wickets remaining</Text>
      <View style={aStyles.winProbTeams}>
        <Text style={[aStyles.winTeam, { color: colors.accent }]} numberOfLines={1}>{battingTeam}</Text>
        <View style={aStyles.winProbPctBox}>
          <Text style={[aStyles.winPct, { color: probColor }]}>{probability}%</Text>
        </View>
        <Text style={[aStyles.winTeam, { textAlign: 'right', color: colors.textSecondary }]} numberOfLines={1}>{bowlingTeam}</Text>
      </View>
      <View style={aStyles.winBar}>
        <Animated.View style={[aStyles.winBarFill, { width: fillWidth, backgroundColor: probColor }]} />
        <View style={[aStyles.winBarRight, { backgroundColor: colors.border }]} />
      </View>
      <View style={aStyles.winBarLabels}>
        <Text style={[aStyles.winBarPct, { color: probColor }]}>{probability}%</Text>
        <Text style={[aStyles.winBarPct, { color: colors.textMuted }]}>{100 - probability}%</Text>
      </View>
    </View>
  );
}

function OverRunsChart({ overRuns }) {
  const MAX_H = 90;
  const maxRuns = Math.max(...overRuns.map((o) => o.runs), 1);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={aStyles.chartScroll}>
      {overRuns.map((ov, i) => {
        const h = Math.max((ov.runs / maxRuns) * MAX_H, 4);
        const bg = ov.runs >= 15 ? colors.error
          : ov.runs >= 10 ? colors.warning
          : ov.runs >= 6 ? colors.success
          : colors.accent;
        return (
          <View key={i} style={aStyles.barCol}>
            <Text style={aStyles.barRunVal}>{ov.runs}</Text>
            <View style={[aStyles.barBlock, { height: h, backgroundColor: bg }]} />
            <Text style={aStyles.barOverLbl}>O{ov.over}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function BatterBar({ batter, maxRuns }) {
  const pct = maxRuns > 0 ? (batter.runs / maxRuns) * 100 : 0;
  const srNum = parseFloat(batter.strikeRate) || 0;
  const srColor = srNum >= 150 ? colors.success : srNum >= 100 ? colors.accent : srNum >= 60 ? colors.warning : colors.error;
  return (
    <View style={aStyles.batterBar}>
      <View style={aStyles.batterBarHeader}>
        <Text style={aStyles.batterBarName}>{batter.name}{!batter.isOut ? ' *' : ''}</Text>
        <Text style={[aStyles.batterBarSR, { color: srColor }]}>SR {batter.strikeRate}</Text>
      </View>
      <View style={aStyles.batterBarTrack}>
        <View style={[aStyles.batterBarFill, { width: `${pct}%`, backgroundColor: batter.isOut ? colors.textMuted : colors.accent }]} />
      </View>
      <View style={aStyles.batterBarFooter}>
        <Text style={aStyles.batterBarRuns}>{batter.runs} runs</Text>
        <Text style={aStyles.batterBarDetail}>{batter.ballsFaced}b · {batter.fours}×4 · {batter.sixes}×6</Text>
      </View>
    </View>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function AnalyticsTab({ match }) {
  const balls = match.balls || [];
  const overRuns = computeOverRuns(balls);
  const batterStats = match.batterStats || [];
  const bowlerStats = match.bowlerStats || [];
  const teamSize = Math.max((match.teamAPlayers || []).length, (match.teamBPlayers || []).length, 2);
  const winProb = computeWinProbability(match, teamSize);
  const battingTeam = (match.battingCardTitle || '').replace(' - Batting', '');
  const bowlingTeam = (match.bowlingCardTitle || '').replace(' - Bowling', '');
  const [runsStr] = (match.score || '0/0').split('/');
  const currentRuns = parseInt(runsStr) || 0;
  const oversStr = (match.overs || 'Overs: 0.0').replace('Overs: ', '');
  const [ov, bl] = oversStr.split('.').map(Number);
  const legalBalls = (ov || 0) * 6 + (bl || 0);
  const crr = legalBalls > 0 ? ((currentRuns / legalBalls) * 6).toFixed(2) : '0.00';
  const [, wktsStr] = (match.score || '0/0').split('/');
  const currentWickets = parseInt(wktsStr) || 0;
  let rrr = null;
  if (winProb !== null && match.target && match.oversLimit) {
    const runsNeeded = match.target - currentRuns;
    const ballsRem = match.oversLimit * 6 - legalBalls;
    rrr = ballsRem > 0 ? ((runsNeeded / ballsRem) * 6).toFixed(2) : null;
  }
  const topBatter = [...batterStats].sort((a, b) => b.runs - a.runs)[0] || null;
  const topBowler = [...bowlerStats].sort((a, b) => b.wickets - a.wickets || parseFloat(a.economy) - parseFloat(b.economy))[0] || null;
  const maxBatterRuns = Math.max(...batterStats.map((b) => b.runs), 1);

  return (
    <View style={{ gap: 14 }}>
      {winProb !== null && (
        <WinProbabilityCard battingTeam={battingTeam} bowlingTeam={bowlingTeam} probability={winProb} />
      )}
      <View style={aStyles.statsRow}>
        <View style={aStyles.statBox}>
          <Text style={aStyles.statVal}>{crr}</Text>
          <Text style={aStyles.statLbl}>Curr RR</Text>
        </View>
        {rrr !== null && (
          <View style={[aStyles.statBox, { borderColor: parseFloat(rrr) > 10 ? colors.error : parseFloat(rrr) > 7 ? colors.warning : colors.success }]}>
            <Text style={[aStyles.statVal, { color: parseFloat(rrr) > 10 ? colors.error : parseFloat(rrr) > 7 ? colors.warning : colors.success }]}>{rrr}</Text>
            <Text style={aStyles.statLbl}>Req RR</Text>
          </View>
        )}
        {match.target && winProb !== null && (
          <View style={aStyles.statBox}>
            <Text style={aStyles.statVal}>{Math.max(0, match.target - currentRuns)}</Text>
            <Text style={aStyles.statLbl}>Need</Text>
          </View>
        )}
        <View style={aStyles.statBox}>
          <Text style={aStyles.statVal}>{Math.max(0, teamSize - 1 - currentWickets)}</Text>
          <Text style={aStyles.statLbl}>Wkts Left</Text>
        </View>
      </View>

      {overRuns.length > 0 && (
        <View style={aStyles.card}>
          <Text style={aStyles.cardTitle}>Runs Per Over</Text>
          <View style={aStyles.chartLegend}>
            {[['≥15', colors.error], ['10–14', colors.warning], ['6–9', colors.success], ['<6', colors.accent]].map(([l, c]) => (
              <View key={l} style={aStyles.legendItem}>
                <View style={[aStyles.legendDot, { backgroundColor: c }]} />
                <Text style={aStyles.legendText}>{l}</Text>
              </View>
            ))}
          </View>
          <OverRunsChart overRuns={overRuns} />
        </View>
      )}

      {(topBatter || topBowler) && (
        <View style={aStyles.card}>
          <Text style={aStyles.cardTitle}>Top Performers</Text>
          {topBatter && (
            <View style={aStyles.performerRow}>
              <View style={[aStyles.performerBadge, { backgroundColor: colors.accentDim }]}>
                <Text style={aStyles.performerIcon}>🏏</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={aStyles.performerName}>{topBatter.name}</Text>
                <Text style={aStyles.performerRole}>Top Scorer</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={aStyles.performerStat}>{topBatter.runs}<Text style={aStyles.performerUnit}> runs</Text></Text>
                <Text style={aStyles.performerMeta}>SR {topBatter.strikeRate} · {topBatter.ballsFaced}b</Text>
              </View>
            </View>
          )}
          {topBatter && topBowler && <View style={aStyles.divider} />}
          {topBowler && (
            <View style={aStyles.performerRow}>
              <View style={[aStyles.performerBadge, { backgroundColor: colors.warningDim }]}>
                <Text style={aStyles.performerIcon}>⚡</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={aStyles.performerName}>{topBowler.name}</Text>
                <Text style={aStyles.performerRole}>Best Bowler</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={aStyles.performerStat}>{topBowler.wickets}<Text style={aStyles.performerUnit}> wkts</Text></Text>
                <Text style={aStyles.performerMeta}>Econ {topBowler.economy} · {topBowler.overs}ov</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {batterStats.length > 0 && (
        <View style={aStyles.card}>
          <Text style={aStyles.cardTitle}>Batting Breakdown</Text>
          {batterStats.map((b, i) => (
            <View key={b.name} style={i > 0 ? { marginTop: 14 } : undefined}>
              <BatterBar batter={b} maxRuns={maxBatterRuns} />
            </View>
          ))}
        </View>
      )}

      {bowlerStats.length > 0 && (
        <View style={aStyles.card}>
          <Text style={aStyles.cardTitle}>Bowling Breakdown</Text>
          {bowlerStats.map((b, i) => {
            const econNum = parseFloat(b.economy) || 0;
            const econColor = econNum <= 5 ? colors.success : econNum <= 8 ? colors.warning : colors.error;
            return (
              <View
                key={b.name}
                style={[aStyles.bowlerRow, i > 0 && { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }]}
              >
                <Text style={aStyles.bowlerName}>{b.name}</Text>
                <View style={aStyles.bowlerStats}>
                  <View style={aStyles.bowlerStat}><Text style={aStyles.bowlerStatVal}>{b.overs}</Text><Text style={aStyles.bowlerStatLbl}>Overs</Text></View>
                  <View style={aStyles.bowlerStat}><Text style={aStyles.bowlerStatVal}>{b.runs}</Text><Text style={aStyles.bowlerStatLbl}>Runs</Text></View>
                  <View style={aStyles.bowlerStat}><Text style={[aStyles.bowlerStatVal, { color: b.wickets > 0 ? colors.success : colors.textPrimary }]}>{b.wickets}</Text><Text style={aStyles.bowlerStatLbl}>Wkts</Text></View>
                  <View style={aStyles.bowlerStat}><Text style={[aStyles.bowlerStatVal, { color: econColor }]}>{b.economy}</Text><Text style={aStyles.bowlerStatLbl}>Econ</Text></View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const aStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  cardSubtitle: { color: colors.textMuted, fontSize: 12, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statVal: { color: colors.textPrimary, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  statLbl: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: 2, letterSpacing: 0.3 },
  winProbTeams: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  winTeam: { flex: 1, fontSize: 13, fontWeight: '700' },
  winProbPctBox: { alignItems: 'center' },
  winPct: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  winBar: { height: 12, borderRadius: 8, backgroundColor: colors.surfaceContainer, overflow: 'hidden', flexDirection: 'row' },
  winBarFill: { height: 12, borderRadius: 8 },
  winBarRight: { flex: 1, height: 12 },
  winBarLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  winBarPct: { fontSize: 12, fontWeight: '600' },
  chartScroll: { paddingBottom: 4, gap: 6, alignItems: 'flex-end', minHeight: 120 },
  barCol: { alignItems: 'center', width: 40 },
  barRunVal: { color: colors.textMuted, fontSize: 10, fontWeight: '600', marginBottom: 4 },
  barBlock: { width: 24, borderRadius: 6 },
  barOverLbl: { color: colors.textMuted, fontSize: 10, marginTop: 4, fontWeight: '600' },
  chartLegend: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: colors.textMuted, fontSize: 11 },
  performerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  performerBadge: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  performerIcon: { fontSize: 20 },
  performerName: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  performerRole: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  performerStat: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  performerUnit: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  performerMeta: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  batterBar: { gap: 4 },
  batterBarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  batterBarName: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  batterBarSR: { fontSize: 12, fontWeight: '600' },
  batterBarTrack: { height: 8, backgroundColor: colors.surfaceContainer, borderRadius: 4, overflow: 'hidden' },
  batterBarFill: { height: 8, borderRadius: 4 },
  batterBarFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  batterBarRuns: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  batterBarDetail: { color: colors.textMuted, fontSize: 12 },
  bowlerRow: { gap: 6 },
  bowlerName: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  bowlerStats: { flexDirection: 'row', gap: 8 },
  bowlerStat: { flex: 1, alignItems: 'center', backgroundColor: colors.surfaceContainerLow, borderRadius: 10, paddingVertical: 8 },
  bowlerStatVal: { color: colors.textPrimary, fontSize: 17, fontWeight: '800' },
  bowlerStatLbl: { color: colors.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
});
