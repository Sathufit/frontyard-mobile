import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { subscribeToMatch } from '../services/matchService';
import { colors } from '../utils/constants';

const TABS = ['Scorecard', 'Analytics', 'Bowling', 'Ball by Ball', 'Info'];

// ─── Analytics helpers ────────────────────────────────────────────────────────
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

function WinProbabilityCard({ battingTeam, bowlingTeam, probability }) {
  const probAnim = useRef(new Animated.Value(probability)).current;
  const prevProb = useRef(probability);
  useEffect(() => {
    Animated.timing(probAnim, {
      toValue: probability,
      duration: 700,
      useNativeDriver: false,
    }).start();
    prevProb.current = probability;
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

function AnalyticsTab({ match }) {
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
  const [wktsStr] = (match.score || '0/0').split('/').reverse();
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
              <View key={b.name} style={[aStyles.bowlerRow, i > 0 && { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }]}>
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

function BallCircle({ ball }) {
  let bg = colors.textMuted;
  let label = String(ball.runs);

  if (ball.isOut) { bg = colors.error; label = 'W'; }
  else if (ball.runs === 4) { bg = colors.success; label = '4'; }
  else if (ball.runs === 6) { bg = colors.warning; label = '6'; }
  else if (ball.isExtra) { bg = '#FF9800'; label = ball.extraType === 'wide' ? 'Wd' : ball.extraType === 'noBall' ? 'NB' : ball.extraType === 'bye' ? 'B' : 'LB'; }
  else if (ball.runs === 0) { bg = colors.textMuted; label = '•'; }

  return (
    <View style={[styles.ballCircle, { backgroundColor: bg }]}>
      <Text style={styles.ballLabel}>{label}</Text>
    </View>
  );
}

function BatterTable({ batterStats }) {
  return (
    <View>
      <View style={[styles.tableRow, styles.tableHeader]}>
        {['Batter', 'R', 'B', '4s', '6s', 'SR'].map((h) => (
          <Text key={h} style={[styles.tableCell, styles.tableHeaderText, h === 'Batter' && styles.tableCellWide]}>{h}</Text>
        ))}
      </View>
      {batterStats.map((b) => (
        <View key={b.name} style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.tableCellWide, { color: b.isOut ? colors.textMuted : colors.textPrimary }]}>
            {b.name}{!b.isOut ? '*' : ''}
            {b.isOut ? <Text style={styles.outLabel}> {b.outType}</Text> : null}
          </Text>
          <Text style={styles.tableCell}>{b.runs}</Text>
          <Text style={styles.tableCell}>{b.ballsFaced}</Text>
          <Text style={styles.tableCell}>{b.fours}</Text>
          <Text style={styles.tableCell}>{b.sixes}</Text>
          <Text style={styles.tableCell}>{b.strikeRate}</Text>
        </View>
      ))}
    </View>
  );
}

function BowlerTable({ bowlerStats }) {
  return (
    <View>
      <View style={[styles.tableRow, styles.tableHeader]}>
        {['Bowler', 'O', 'R', 'W', 'Econ'].map((h) => (
          <Text key={h} style={[styles.tableCell, styles.tableHeaderText, h === 'Bowler' && styles.tableCellWide]}>{h}</Text>
        ))}
      </View>
      {bowlerStats.map((b) => (
        <View key={b.name} style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.tableCellWide]}>{b.name}</Text>
          <Text style={styles.tableCell}>{b.overs}</Text>
          <Text style={styles.tableCell}>{b.runs}</Text>
          <Text style={styles.tableCell}>{b.wickets}</Text>
          <Text style={styles.tableCell}>{b.economy}</Text>
        </View>
      ))}
    </View>
  );
}

export default function WatchMatchScreen({ route, navigation }) {
  const { matchId, title } = route.params;
  const [match, setMatch] = useState(null);
  const [activeTab, setActiveTab] = useState('Scorecard');

  useEffect(() => {
    navigation.setOptions({ title: title || 'Live Match' });
    const unsub = subscribeToMatch(matchId, setMatch);
    return unsub;
  }, [matchId]);

  if (!match) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const last12 = (match.balls || []).slice(-12);
  const isLive = !match.matchFinished && match.status !== 'finished';

  function handleResumeScoring() {
    navigation.navigate('NewMatch', {
      screen: 'Scoring',
      params: {
        matchId: match.id,
        matchName: match.title,
        matchType: match.matchType,
        oversLimit: match.oversLimit,
        teamA: match.teamA,
        teamB: match.teamB,
        teamAPlayers: match.teamAPlayers || [],
        teamBPlayers: match.teamBPlayers || [],
        tossWinner: match.tossWinner || '',
        tossDecision: match.tossDecision || 'bat',
      },
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Score Header */}
      <View style={styles.scoreHeader}>
        <Text style={styles.scoreTitle}>{match.battingCardTitle}</Text>
        <Text style={styles.scoreBig}>{match.score}</Text>
        <Text style={styles.scoreDetail}>{match.overs}  {match.runRate}</Text>
        {match.leadTrail ? <Text style={styles.leadTrail}>{match.leadTrail}</Text> : null}
      </View>

      {/* Resume Scoring — shown when match is still live */}
      {isLive && (
        <TouchableOpacity style={styles.resumeBtn} onPress={handleResumeScoring} activeOpacity={0.8}>
          <Text style={styles.resumeBtnText}>Resume Scoring</Text>
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16 }}>
        {activeTab === 'Scorecard' && (
          <View>
            {/* For completed matches: show all archived innings */}
            {[
              { key: 'innings1', label: '1st Innings' },
              { key: 'innings2', label: '2nd Innings' },
              { key: 'innings3', label: '3rd Innings' },
              { key: 'innings4', label: '4th Innings' },
            ]
              .filter(({ key }) => match[key])
              .map(({ key, label }, i) => {
                const inn = match[key];
                return (
                  <View key={key} style={i > 0 ? { marginTop: 24 } : undefined}>
                    <Text style={styles.inningsLabel}>{label} — {inn.team}  <Text style={styles.inningsScore}>{inn.runs}/{inn.wickets} ({inn.overs} ov)</Text></Text>
                    <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Batting</Text>
                    <BatterTable batterStats={inn.batterStats || []} />
                    <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Bowling</Text>
                    <BowlerTable bowlerStats={inn.bowlerStats || []} />
                  </View>
                );
              })}

            {/* Fallback for live in-progress (no archived innings yet) */}
            {!match.innings1 && (
              <View>
                <Text style={styles.sectionTitle}>Batting — {match.battingCardTitle?.replace(' - Batting', '')}</Text>
                <BatterTable batterStats={match.batterStats || []} />
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Bowling — {match.bowlingCardTitle?.replace(' - Bowling', '')}</Text>
                <BowlerTable bowlerStats={match.bowlerStats || []} />
              </View>
            )}

            {/* Current live innings (when previous innings are already archived) */}
            {match.innings1 && isLive && (
              <View style={{ marginTop: 24 }}>
                <Text style={styles.inningsLabel}>Current Innings — {match.battingCardTitle?.replace(' - Batting', '')}</Text>
                <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Batting</Text>
                <BatterTable batterStats={match.batterStats || []} />
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Bowling</Text>
                <BowlerTable bowlerStats={match.bowlerStats || []} />
              </View>
            )}
          </View>
        )}

        {activeTab === 'Analytics' && <AnalyticsTab match={match} />}

        {activeTab === 'Bowling' && (
          <View>
            <Text style={styles.sectionTitle}>Bowling — {match.bowlingCardTitle?.replace(' - Bowling', '')}</Text>
            <BowlerTable bowlerStats={match.bowlerStats || []} />
          </View>
        )}

        {activeTab === 'Ball by Ball' && (
          <View>
            <Text style={styles.sectionTitle}>Last 12 Balls</Text>
            <View style={styles.ballRow}>
              {last12.map((ball, i) => <BallCircle key={i} ball={ball} />)}
            </View>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>All Balls</Text>
            {(match.balls || []).map((ball, i) => (
              <View key={i} style={styles.ballLogRow}>
                <BallCircle ball={ball} />
                <Text style={styles.ballLogText}>
                  {ball.batter} {ball.isOut ? `OUT (${ball.outType})` : `${ball.runs}${ball.isExtra ? ` + ${ball.extraType}` : ''}`} — {ball.bowler}
                </Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'Info' && (
          <View style={{ gap: 12 }}>
            <InfoRow label="Match Type" value={match.matchType === 'LIMITED_OVERS' ? `Limited Overs (${match.oversLimit})` : 'Test Match'} />
            <InfoRow label="Toss" value={`${match.tossWinner} won, chose to ${match.tossDecision}`} />
            <InfoRow label="Status" value={match.matchStatus} />
            <InfoRow label="Result" value={match.result || 'In Progress'} />
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>{match.teamA} Players</Text>
            {(match.teamAPlayers || []).map((p, i) => (
              <Text key={i} style={styles.playerItem}>{i + 1}. {p}</Text>
            ))}
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>{match.teamB} Players</Text>
            {(match.teamBPlayers || []).map((p, i) => (
              <Text key={i} style={styles.playerItem}>{i + 1}. {p}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  scoreHeader: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scoreTitle: { color: colors.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 4 },
  scoreBig: { color: colors.textPrimary, fontSize: 38, fontWeight: '800', letterSpacing: -1, marginTop: 2 },
  scoreDetail: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  leadTrail: { color: colors.accent, fontSize: 14, marginTop: 6, fontWeight: '500' },
  tabBar: { borderBottomWidth: 1, borderBottomColor: colors.border, flexGrow: 0, backgroundColor: colors.surfaceElevated },
  tab: { paddingHorizontal: 18, paddingVertical: 13 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.accent },
  tabText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: colors.accent },
  content: { flex: 1 },
  sectionTitle: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12, textTransform: 'uppercase' },
  inningsLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  inningsScore: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  tableRow: { flexDirection: 'row', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  tableHeader: { borderBottomColor: colors.borderStrong },
  tableHeaderText: { color: colors.textMuted, fontWeight: '600', fontSize: 11 },
  tableCell: { flex: 1, color: colors.textPrimary, fontSize: 13, textAlign: 'center' },
  tableCellWide: { flex: 3, textAlign: 'left' },
  outLabel: { color: colors.textMuted, fontSize: 11 },
  ballRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ballCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  ballLabel: { color: '#fff', fontWeight: '700', fontSize: 11 },
  ballLogRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  ballLogText: { color: colors.textSecondary, fontSize: 13, flex: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { color: colors.textMuted, fontSize: 13 },
  infoValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  playerItem: { color: colors.textSecondary, fontSize: 13, paddingVertical: 3 },
  resumeBtn: {
    marginHorizontal: 16, marginVertical: 10, backgroundColor: colors.accent,
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
  },
  resumeBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});

const aStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: colors.border,
  },
  cardTitle: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  cardSubtitle: { color: colors.textMuted, fontSize: 12, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: 12,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  statVal: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLbl: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: 2, letterSpacing: 0.3 },
  winProbTeams: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  winTeam: { flex: 1, fontSize: 13, fontWeight: '700' },
  winProbPctBox: { alignItems: 'center' },
  winPct: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  winBar: { height: 10, borderRadius: 6, backgroundColor: colors.background, overflow: 'hidden', flexDirection: 'row' },
  winBarFill: { height: 10, borderRadius: 6 },
  winBarRight: { flex: 1, height: 10 },
  winBarLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  winBarPct: { fontSize: 12, fontWeight: '600' },
  chartScroll: { paddingBottom: 4, gap: 6, alignItems: 'flex-end', minHeight: 120 },
  barCol: { alignItems: 'center', width: 38 },
  barRunVal: { color: colors.textMuted, fontSize: 10, fontWeight: '600', marginBottom: 4 },
  barBlock: { width: 22, borderRadius: 4 },
  barOverLbl: { color: colors.textMuted, fontSize: 10, marginTop: 4, fontWeight: '600' },
  chartLegend: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: colors.textMuted, fontSize: 11 },
  performerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  performerBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  performerIcon: { fontSize: 20 },
  performerName: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  performerRole: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  performerStat: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  performerUnit: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  performerMeta: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  batterBar: { gap: 4 },
  batterBarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  batterBarName: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
  batterBarSR: { fontSize: 12, fontWeight: '600' },
  batterBarTrack: { height: 8, backgroundColor: colors.background, borderRadius: 4, overflow: 'hidden' },
  batterBarFill: { height: 8, borderRadius: 4 },
  batterBarFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  batterBarRuns: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  batterBarDetail: { color: colors.textMuted, fontSize: 12 },
  bowlerRow: { gap: 6 },
  bowlerName: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  bowlerStats: { flexDirection: 'row', gap: 8 },
  bowlerStat: { flex: 1, alignItems: 'center', backgroundColor: colors.background, borderRadius: 8, paddingVertical: 8 },
  bowlerStatVal: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  bowlerStatLbl: { color: colors.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
});
