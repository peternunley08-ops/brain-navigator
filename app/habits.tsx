import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { RadialGauge } from '../components/ui/RadialGauge';
import { ScienceNote } from '../components/ui/ScienceNote';
import { colors, fonts, gaugeColor, radii, spacing } from '../core/theme';
import { useAdaptiveGradient } from '../core/adaptiveLight';
import { Habit, HabitFrequency, useHabitsStore } from '../core/habitsStore';
import { WELLNESS_DIMENSIONS, WellnessDimension, dimensionLabel } from '../core/wellness';

const FREQUENCIES: { key: HabitFrequency; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
];

function todayStatus(pct: number | null) {
  if (pct === null) return 'Nothing tracked yet';
  if (pct >= 100) return 'All done for today';
  if (pct > 0) return 'Making progress';
  return 'Nothing logged yet today';
}

export default function HabitsScreen() {
  const { gradient } = useAdaptiveGradient();
  const habits = useHabitsStore((s) => s.habits);
  const fetchHabits = useHabitsStore((s) => s.fetchHabits);
  const createHabit = useHabitsStore((s) => s.createHabit);
  const isLoggedToday = useHabitsStore((s) => s.isLoggedToday);
  const isLoading = useHabitsStore((s) => s.isLoading);
  const isSaving = useHabitsStore((s) => s.isSaving);
  const error = useHabitsStore((s) => s.error);

  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [category, setCategory] = useState<WellnessDimension>('physical');

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handleAdd = async () => {
    const ok = await createHabit(name, frequency, category);
    if (ok) {
      setName('');
      setFrequency('daily');
    }
  };

  // "Today" only makes sense as a cadence for daily habits — a weekly habit
  // that's perfectly on pace (say, 2 of 3 logs done earlier this week) but
  // untouched today would otherwise drag this ring down for no real reason.
  const dailyHabits = habits.filter((h) => h.frequency === 'daily');
  const doneToday = dailyHabits.filter((h) => isLoggedToday(h.id)).length;
  const todayPct = dailyHabits.length > 0 ? Math.round((doneToday / dailyHabits.length) * 100) : null;

  return (
    <View style={styles.outer}>
      <LinearGradient colors={gradient} style={styles.gradient}>
        <ScrollView style={styles.root} contentContainerStyle={styles.content}>
          <Button label="Back" variant="pill" onPress={() => router.back()} style={styles.back} />

          <Text style={styles.title}>Habits</Text>
          <Text style={styles.subtitle}>
            {isLoading ? 'Loading…' : habits.length === 0 ? 'Nothing tracked yet' : `${habits.length} tracked`}
          </Text>

          {dailyHabits.length > 0 ? (
            <Card style={styles.heroCard}>
              <RadialGauge
                value={todayPct ?? 0}
                label={`${doneToday}/${dailyHabits.length}`}
                caption="Today"
                color={todayPct !== null ? gaugeColor(todayPct) : colors.divider}
              />
              <View style={styles.heroInfo}>
                <Text style={styles.heroStatus}>{todayStatus(todayPct)}</Text>
                <Text style={styles.heroCaption}>Tap a habit's circle below to log it for today.</Text>
              </View>
            </Card>
          ) : null}

          <ScienceNote fact="Habits form through a cue → routine → reward loop, not willpower. Consistency wires it in — an occasional missed day doesn't erase the loop your brain has already built, so don't let one slip talk you into quitting the streak." />

          <Card style={styles.addCard}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Morning walk"
              placeholderTextColor={colors.hint}
              value={name}
              onChangeText={setName}
            />
            <View style={styles.frequencyRow}>
              {FREQUENCIES.map((f) => {
                const active = frequency === f.key;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setFrequency(f.key)}
                    style={[styles.frequencyChip, active && styles.frequencyChipActive]}
                  >
                    <Text style={[styles.frequencyChipText, active && styles.frequencyChipTextActive]}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.categoryRow}>
              {WELLNESS_DIMENSIONS.map((d) => {
                const active = category === d.key;
                return (
                  <Pressable
                    key={d.key}
                    onPress={() => setCategory(d.key)}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                  >
                    <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                      {d.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Button
              label={isSaving ? 'Adding…' : 'Add Habit'}
              onPress={handleAdd}
              disabled={isSaving || !name.trim()}
              style={styles.addButton}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </Card>

          {habits.length > 0 ? (
            <View style={styles.list}>
              {habits.map((h) => (
                <HabitRow key={h.id} habit={h} />
              ))}
            </View>
          ) : !isLoading ? (
            <Text style={styles.hint}>Add a habit above to start building a streak.</Text>
          ) : null}
        </ScrollView>

        <BottomNav />
      </LinearGradient>
    </View>
  );
}

function HabitRow({ habit }: { habit: Habit }) {
  const isLoggedToday = useHabitsStore((s) => s.isLoggedToday(habit.id));
  const streak = useHabitsStore((s) => s.currentStreak(habit.id));
  const weekProgress = useHabitsStore((s) => s.weekProgress(habit.id));
  const toggleLogToday = useHabitsStore((s) => s.toggleLogToday);
  const archiveHabit = useHabitsStore((s) => s.archiveHabit);

  const streakLabel =
    habit.frequency === 'daily'
      ? streak === 1
        ? '1 day streak'
        : `${streak} day streak`
      : streak === 1
        ? '1 week streak'
        : `${streak} week streak`;

  return (
    <Card style={styles.habitCard}>
      <View style={styles.habitInfo}>
        <Text style={styles.habitName}>{habit.name}</Text>
        <Text style={styles.habitMeta}>
          {habit.frequency === 'daily'
            ? `${dimensionLabel(habit.category)}, ${streakLabel}`
            : `${dimensionLabel(habit.category)}, ${streakLabel} (${weekProgress}/${habit.target_per_week} this week)`}
        </Text>
      </View>
      <View style={styles.habitActions}>
        <Pressable
          onPress={() => toggleLogToday(habit.id)}
          style={[styles.checkCircle, isLoggedToday && styles.checkCircleActive]}
        >
          {isLoggedToday ? <Text style={styles.checkMark}>✓</Text> : null}
        </Pressable>
        <Pressable onPress={() => archiveHabit(habit.id)} hitSlop={8}>
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      </View>
    </Card>
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
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  heroInfo: {
    flex: 1,
  },
  heroStatus: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  heroCaption: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkFaint,
  },
  addCard: {
    gap: spacing.sm,
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
    backgroundColor: colors.background,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  frequencyChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.background,
  },
  frequencyChipActive: {
    backgroundColor: colors.leather,
    borderColor: colors.leather,
  },
  frequencyChipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  frequencyChipTextActive: {
    color: colors.background,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.background,
  },
  categoryChipActive: {
    backgroundColor: colors.leatherDark,
    borderColor: colors.leatherDark,
  },
  categoryChipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  categoryChipTextActive: {
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
  list: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  habitInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  habitName: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  habitMeta: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkFaint,
  },
  habitActions: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  checkCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  checkCircleActive: {
    backgroundColor: colors.secured,
    borderColor: colors.secured,
  },
  checkMark: {
    fontFamily: fonts.mono,
    fontSize: 16,
    color: colors.background,
  },
  removeText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.danger,
  },
  hint: {
    marginTop: spacing.xl,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.hint,
  },
});
