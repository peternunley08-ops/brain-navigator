import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConditionsCard } from '../components/ui/ConditionsCard';
import { RadialGauge } from '../components/ui/RadialGauge';
import { ScienceNote } from '../components/ui/ScienceNote';
import { TrackSlider } from '../components/ui/TrackSlider';
import { colors, fonts, gaugeColor, radii, spacing } from '../core/theme';
import { useAdaptiveGradient } from '../core/adaptiveLight';
import { useHealthStore } from '../core/healthStore';
import { useWellnessStore } from '../core/wellnessStore';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const DATE_LABEL = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export default function CheckinScreen() {
  const { gradient } = useAdaptiveGradient();
  const fetchCheckins = useWellnessStore((s) => s.fetchCheckins);
  const todaysCheckin = useWellnessStore((s) => s.todaysCheckin);
  const saveTodayCheckin = useWellnessStore((s) => s.saveTodayCheckin);
  const isSaving = useWellnessStore((s) => s.isSaving);
  const error = useWellnessStore((s) => s.error);

  const isHealthAuthorized = useHealthStore((s) => s.isAuthorized);
  const healthSleepHours = useHealthStore((s) => s.sleepHoursLastNight);

  const [mood, setMood] = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    let cancelled = false;
    // Await the fetch's own promise rather than watching isLoadingCheckins
    // from a second effect — that flag flips to true synchronously inside
    // fetchCheckins, but this effect's closure is created in the same
    // render pass and can't observe it until a later commit. On a cold
    // session (checkins still empty on the very first render), that race
    // let this hydrate-once-then-stop logic fire before the real fetch
    // landed: if today's check-in already existed, its values would never
    // populate the form, yet "Update Check-in" would still show over the
    // blank fields — saving would silently overwrite real data with nulls.
    fetchCheckins().then(() => {
      if (cancelled) return;
      const existing = todaysCheckin();
      if (existing) {
        setMood(existing.mood);
        setSleepHours(existing.sleep_hours != null ? String(existing.sleep_hours) : '');
        setSleepQuality(existing.sleep_quality);
        setStressLevel(existing.stress_level);
        setNotes(existing.notes ?? '');
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated, fetchCheckins, todaysCheckin]);

  const existing = todaysCheckin();
  const parsedSleepHours = sleepHours.trim() && Number.isFinite(Number(sleepHours)) ? Number(sleepHours) : null;

  const handleSave = async () => {
    const parsedHours = sleepHours.trim() ? Number(sleepHours) : null;
    const ok = await saveTodayCheckin({
      mood,
      sleepHours: Number.isFinite(parsedHours) ? parsedHours : null,
      sleepQuality,
      stressLevel,
      notes,
    });
    if (ok) {
      setSaved(true);
      setTimeout(() => router.back(), 700);
    }
  };

  return (
    <View style={styles.outer}>
      <LinearGradient colors={gradient} style={styles.gradient}>
        <ScrollView style={styles.root} contentContainerStyle={styles.content}>
          <View style={styles.topRow}>
            <Button label="Back" variant="pill" onPress={() => router.back()} style={styles.back} />
            <View style={styles.topRowActions}>
              <Button label="Tasks" variant="pill" onPress={() => router.push('/tasks')} />
              <Button label="Habits" variant="pill" onPress={() => router.push('/habits')} />
              <Button label="Trends" variant="pill" onPress={() => router.push('/trends')} />
              <Button label="Health" variant="pill" onPress={() => router.push('/health')} />
              <Button label="Nutrition" variant="pill" onPress={() => router.push('/nutrition')} />
              <Button label="Breathe" variant="pill" onPress={() => router.push('/breathe')} />
              <Button label="Let It Out" variant="pill" onPress={() => router.push('/vent')} />
              <Button
                label="Take It Off Your Shoulders"
                variant="pill"
                onPress={() => router.push('/companion')}
              />
            </View>
          </View>

          <Text style={styles.title}>{greeting()}</Text>
          <Text style={styles.subtitle}>
            {DATE_LABEL}. {existing ? "You can still edit today's check-in." : 'How are you doing right now?'}
          </Text>

          <Card style={styles.glanceCard}>
            <GlanceGauge label="Mood" value={mood !== null ? (mood / 5) * 100 : null} display={mood !== null ? `${mood}/5` : '—'} />
            <GlanceGauge
              label="Sleep"
              value={parsedSleepHours !== null ? Math.min(100, (parsedSleepHours / 8) * 100) : null}
              display={parsedSleepHours !== null ? `${parsedSleepHours}h` : '—'}
            />
            <GlanceGauge
              label="Calm"
              value={stressLevel !== null ? 100 - ((stressLevel - 1) / 9) * 100 : null}
              display={stressLevel !== null ? `${stressLevel}/10` : '—'}
            />
          </Card>

          <View style={styles.conditionsWrap}>
            <ConditionsCard />
          </View>

          <Card style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>Mood</Text>
            <ScienceNote fact="Morning sunlight exposure boosts serotonin and helps set your circadian clock — even 10 minutes outside can measurably lift mood within the hour." />
            <TrackSlider min={1} max={5} value={mood} onChange={setMood} fillColor={colors.secured} />
          </Card>

          <Card style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>Sleep (hours)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 7.5"
              placeholderTextColor={colors.hint}
              value={sleepHours}
              onChangeText={setSleepHours}
              keyboardType="decimal-pad"
            />
            {isHealthAuthorized && healthSleepHours !== null ? (
              <Pressable onPress={() => setSleepHours(String(healthSleepHours))} hitSlop={6}>
                <Text style={styles.importText}>Use {healthSleepHours}h from Health</Text>
              </Pressable>
            ) : null}

            <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Sleep Quality</Text>
            <ScienceNote fact="Your circadian rhythm is a roughly 24-hour clock run by a cluster of neurons in your hypothalamus. It's reset daily by light — a consistent wake time, even on weekends, is one of the strongest levers for better sleep quality." />
            <TrackSlider
              min={1}
              max={5}
              value={sleepQuality}
              onChange={setSleepQuality}
              fillColor={colors.leather}
            />
          </Card>

          <Card style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>Stress</Text>
            <ScienceNote fact="Caffeine doesn't create energy — it blocks adenosine, the molecule that builds up all day and makes you feel sleepy. That's the 'coffee crash': the adenosine was there the whole time, just muted, and it catches up with you at once." />
            <TrackSlider
              min={1}
              max={10}
              value={stressLevel}
              onChange={setStressLevel}
              fillColor={colors.unlocked}
            />
          </Card>

          <Card style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Anything worth remembering about today"
              placeholderTextColor={colors.hint}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </Card>

          <Button
            label={saved ? 'Saved' : isSaving ? 'Saving…' : existing ? 'Update Check-in' : 'Save Check-in'}
            onPress={handleSave}
            disabled={isSaving || saved}
            style={styles.saveButton}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        <BottomNav />
      </LinearGradient>
    </View>
  );
}

function GlanceGauge({ label, value, display }: { label: string; value: number | null; display: string }) {
  return (
    <View style={styles.glanceItem}>
      <RadialGauge
        size={68}
        strokeWidth={7}
        value={value ?? 0}
        label={display}
        color={value !== null ? gaugeColor(value) : colors.divider}
      />
      <Text style={styles.glanceLabel}>{label}</Text>
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
  topRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    rowGap: spacing.sm,
    marginBottom: spacing.lg,
  },
  topRowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  back: {},
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
  glanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  glanceItem: {
    alignItems: 'center',
  },
  conditionsWrap: {
    marginBottom: spacing.md,
  },
  glanceLabel: {
    marginTop: spacing.sm,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.inkFaint,
  },
  fieldCard: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  fieldLabelSpaced: {
    marginTop: spacing.lg,
  },
  input: {
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
    borderRadius: radii.lg,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.backgroundAlt,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  importText: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.leather,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
  errorText: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.danger,
  },
});
