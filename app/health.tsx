import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LollipopChart } from '../components/ui/LollipopChart';
import { RadialGauge } from '../components/ui/RadialGauge';
import { SleepQualityCard } from '../components/ui/SleepQualityCard';
import { colors, fonts, radii, spacing } from '../core/theme';
import { useAdaptiveGradient } from '../core/adaptiveLight';
import { useHealthStore } from '../core/healthStore';

const DURATIONS = [3, 5, 10];
const SLEEP_GOAL_HOURS = 8;
const STEP_GOAL = 10000;

export default function HealthScreen() {
  const { gradient } = useAdaptiveGradient();
  const isAuthorized = useHealthStore((s) => s.isAuthorized);
  const isLoading = useHealthStore((s) => s.isLoading);
  const isSaving = useHealthStore((s) => s.isSaving);
  const error = useHealthStore((s) => s.error);
  const stepsToday = useHealthStore((s) => s.stepsToday);
  const restingHeartRate = useHealthStore((s) => s.restingHeartRate);
  const sleepHoursLastNight = useHealthStore((s) => s.sleepHoursLastNight);
  const sleepStages = useHealthStore((s) => s.sleepStages);
  const stepsWeek = useHealthStore((s) => s.stepsWeek);
  const connect = useHealthStore((s) => s.connect);
  const fetchToday = useHealthStore((s) => s.fetchToday);
  const logMindfulMinutes = useHealthStore((s) => s.logMindfulMinutes);

  const [duration, setDuration] = useState(5);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    if (isAuthorized) fetchToday();
  }, [isAuthorized, fetchToday]);

  const handleLog = async () => {
    const ok = await logMindfulMinutes(duration);
    if (ok) {
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    }
  };

  const sleepGoalPct =
    sleepHoursLastNight !== null ? Math.round((sleepHoursLastNight / SLEEP_GOAL_HOURS) * 100) : 0;

  // A rough "sleep quality" proxy: the share of total sleep spent in deep +
  // REM, the stages associated with restorative sleep, rather than light/core.
  const sleepQualityPct = sleepStages
    ? Math.round(
        ((sleepStages.deep + sleepStages.rem) /
          (sleepStages.core + sleepStages.deep + sleepStages.rem + sleepStages.unspecified)) *
          100
      )
    : null;

  const stepsWeekMax = Math.max(STEP_GOAL, ...stepsWeek.map((d) => d.value ?? 0));

  return (
    <View style={styles.outer}>
      <LinearGradient colors={gradient} style={styles.gradient}>
        <ScrollView style={styles.root} contentContainerStyle={styles.content}>
          <Button label="Back" variant="pill" onPress={() => router.back()} style={styles.back} />

          <Text style={styles.title}>Health</Text>
          <Text style={styles.subtitle}>
            {isAuthorized ? "Today's readings" : 'Connect Apple Health'}
          </Text>

          {!isAuthorized ? (
            <Card style={styles.connectCard}>
              <Text style={styles.connectText}>
                Read your sleep, resting heart rate, and steps into Brain Navigator, and log
                mindful minutes back to Health when you use the app.
              </Text>
              <Button label="Connect Apple Health" onPress={connect} style={styles.connectButton} />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </Card>
          ) : (
            <>
              <Card style={styles.glanceCard}>
                <View style={styles.gaugeRow}>
                  <View style={styles.gaugeItem}>
                    <RadialGauge
                      value={sleepGoalPct}
                      label={sleepHoursLastNight !== null ? `${sleepHoursLastNight}h` : '—'}
                      caption="Sleep"
                      color={colors.leather}
                    />
                  </View>
                  <View style={styles.gaugeItem}>
                    <RadialGauge
                      value={sleepQualityPct ?? 0}
                      label={sleepQualityPct !== null ? `${sleepQualityPct}%` : '—'}
                      caption="Quality"
                      color={colors.secured}
                    />
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <StatCard
                    label="Resting HR"
                    value={restingHeartRate !== null ? `${Math.round(restingHeartRate)}` : '—'}
                  />
                  <StatCard
                    label="Steps Today"
                    value={stepsToday !== null ? `${Math.round(stepsToday)}` : '—'}
                  />
                </View>
              </Card>
              {isLoading ? <Text style={styles.hint}>Loading…</Text> : null}

              <View style={styles.sectionCard}>
                <SleepQualityCard
                  qualityPct={sleepQualityPct}
                  deepMinutes={sleepStages ? sleepStages.deep : null}
                  remMinutes={sleepStages ? sleepStages.rem : null}
                  lightMinutes={sleepStages ? sleepStages.core + sleepStages.unspecified : null}
                />
              </View>

              {stepsWeek.length > 0 ? (
                <Card style={styles.sectionCard}>
                  <Text style={styles.cardHeading}>Steps this week</Text>
                  <LollipopChart
                    data={stepsWeek}
                    maxValue={stepsWeekMax}
                    highlightIndex={stepsWeek.length - 1}
                    color={colors.leather}
                    width={300}
                  />
                </Card>
              ) : null}

              <Card style={styles.addCard}>
                <Text style={styles.cardHeading}>Log mindful minutes</Text>
                <View style={styles.durationRow}>
                  {DURATIONS.map((d) => {
                    const active = duration === d;
                    return (
                      <Pressable
                        key={d}
                        onPress={() => setDuration(d)}
                        style={[styles.durationChip, active && styles.durationChipActive]}
                      >
                        <Text style={[styles.durationChipText, active && styles.durationChipTextActive]}>
                          {d} min
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Button
                  label={logged ? 'Saved to Health' : isSaving ? 'Saving…' : 'Log Session (just now)'}
                  onPress={handleLog}
                  disabled={isSaving}
                  style={styles.addButton}
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </Card>

              <Button label="Refresh" variant="pill" onPress={fetchToday} style={styles.refreshButton} />
            </>
          )}
        </ScrollView>

        <BottomNav />
      </LinearGradient>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradient: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: 100,
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.ink,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
  },
  connectCard: {
    padding: spacing.lg,
  },
  connectText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkMuted,
    marginBottom: spacing.md,
  },
  connectButton: {},
  glanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  gaugeRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: spacing.sm,
  },
  gaugeItem: {
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
  },
  statLabel: {
    marginTop: 2,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.inkFaint,
  },
  hint: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.hint,
  },
  sectionCard: {
    marginTop: spacing.lg,
  },
  cardHeading: {
    marginBottom: spacing.md,
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.ink,
  },
  addCard: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  durationRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  durationChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.background,
  },
  durationChipActive: {
    backgroundColor: colors.leather,
    borderColor: colors.leather,
  },
  durationChipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  durationChipTextActive: {
    color: colors.background,
  },
  addButton: {
    marginTop: spacing.xs,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.danger,
  },
  refreshButton: {
    marginTop: spacing.xl,
    alignSelf: 'center',
  },
});
