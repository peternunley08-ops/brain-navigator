import { useEffect, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { Icon } from '../components/ui/Icon';
import { IconButton } from '../components/ui/IconButton';
import { LollipopChart } from '../components/ui/LollipopChart';
import { Reveal } from '../components/ui/Reveal';
import { Ring } from '../components/ui/Ring';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { SleepQualityCard } from '../components/ui/SleepQualityCard';
import { StatTile } from '../components/ui/StatTile';
import { useHealthStore } from '../core/healthStore';
import { alpha, colors, fonts, layout } from '../core/theme';

const DURATIONS = [3, 5, 10];
const SLEEP_GOAL_HOURS = 8;
const STEP_GOAL = 10000;
const HEART = '#F08A8A';
const BLUE = '#8FB4E8';

export default function HealthScreen() {
  const { width } = useWindowDimensions();
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
      emberSay(`${duration} mindful minutes, saved to Health.`, 'happy');
      setTimeout(() => setLogged(false), 2000);
    }
  };

  // A rough "sleep quality" proxy: the share of total sleep spent in deep +
  // REM, the stages associated with restorative sleep, rather than light/core.
  const sleepQualityPct = sleepStages
    ? Math.round(
        ((sleepStages.deep + sleepStages.rem) /
          Math.max(1, sleepStages.core + sleepStages.deep + sleepStages.rem + sleepStages.unspecified)) *
          100
      )
    : null;

  const stepsWeekMax = Math.max(STEP_GOAL, ...stepsWeek.map((d) => d.value ?? 0));
  const chartWidth = Math.min(width, layout.maxWidth) - layout.gutter * 2 - 36;

  return (
    <Screen
      title="Health"
      subtitle={isAuthorized ? 'Today, from Apple Health.' : 'Bring in your sleep, heart, and steps.'}
      right={isAuthorized ? <IconButton icon="repeat" label="Refresh" onPress={fetchToday} /> : undefined}
    >
      {!isAuthorized ? (
        <Reveal index={0}>
          <Card tint={HEART} style={styles.connect}>
            <View style={[styles.connectIcon, { backgroundColor: alpha(HEART, 0.14) }]}>
              <Icon name="heart" size={28} color={HEART} />
            </View>
            <Text style={styles.connectTitle}>Connect Apple Health</Text>
            <Text style={styles.connectText}>
              Brain Navigator reads your sleep, resting heart rate, and steps, and logs mindful minutes back to Health
              when you use Breathe.
            </Text>
            <Button label="Connect" icon="heart" onPress={connect} style={styles.connectButton} />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </Card>
        </Reveal>
      ) : (
        <>
          <Reveal index={0}>
            <Card style={styles.rings}>
              <Ring
                progress={sleepHoursLastNight != null ? Math.min(1, sleepHoursLastNight / SLEEP_GOAL_HOURS) : null}
                value={sleepHoursLastNight != null ? String(sleepHoursLastNight) : undefined}
                unit="h"
                label="Sleep"
                color={BLUE}
                size={80}
              />
              <Ring
                progress={sleepQualityPct != null ? sleepQualityPct / 100 : null}
                value={sleepQualityPct != null ? String(sleepQualityPct) : undefined}
                unit="%"
                label="Deep + REM"
                color="#AFA2DE"
                size={80}
                delay={120}
              />
              <Ring
                progress={stepsToday != null ? Math.min(1, stepsToday / STEP_GOAL) : null}
                value={stepsToday != null ? (stepsToday >= 1000 ? `${(stepsToday / 1000).toFixed(1)}k` : String(Math.round(stepsToday))) : undefined}
                label="Steps"
                color={colors.flame}
                size={80}
                delay={240}
              />
            </Card>
          </Reveal>

          <Reveal index={1} style={styles.tiles}>
            <StatTile label="Resting heart rate" value={restingHeartRate != null ? String(Math.round(restingHeartRate)) : '–'} unit="bpm" color={HEART} />
            <StatTile label="Steps today" value={stepsToday != null ? Math.round(stepsToday).toLocaleString() : '–'} color={colors.flame} />
          </Reveal>
          {isLoading ? <Text style={styles.hint}>Reading from Health…</Text> : null}

          <Reveal index={2} style={styles.block}>
            <SleepQualityCard
              qualityPct={sleepQualityPct}
              deepMinutes={sleepStages ? sleepStages.deep : null}
              remMinutes={sleepStages ? sleepStages.rem : null}
              lightMinutes={sleepStages ? sleepStages.core + sleepStages.unspecified : null}
            />
          </Reveal>

          {stepsWeek.length > 0 ? (
            <Reveal index={3}>
              <Section title="Steps this week" note={`The goal line is ${STEP_GOAL.toLocaleString()}.`}>
                <Card>
                  <LollipopChart data={stepsWeek} maxValue={stepsWeekMax} highlightIndex={stepsWeek.length - 1} color={colors.flame} width={chartWidth} />
                </Card>
              </Section>
            </Reveal>
          ) : null}

          <Reveal index={4}>
            <Section title="Log mindful minutes" note="For a session you did away from the app. Breathe logs its own.">
              <Card>
                <ChipRow>
                  {DURATIONS.map((d) => (
                    <Chip key={d} label={`${d} min`} selected={duration === d} onPress={() => setDuration(d)} color={colors.secured} />
                  ))}
                </ChipRow>
                <Button
                  label={logged ? 'Saved to Health' : 'Log it, ending now'}
                  icon={logged ? 'check' : 'clock'}
                  variant="secondary"
                  tint={colors.secured}
                  loading={isSaving}
                  onPress={handleLog}
                  style={styles.logButton}
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </Card>
            </Section>
          </Reveal>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  connect: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 28,
  },
  connectIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectTitle: {
    marginTop: 14,
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
  },
  connectText: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
  },
  connectButton: {
    marginTop: 20,
    alignSelf: 'stretch',
  },
  rings: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  tiles: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  block: {
    marginTop: 12,
  },
  hint: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textFaint,
  },
  logButton: {
    marginTop: 14,
  },
  errorText: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },
});
