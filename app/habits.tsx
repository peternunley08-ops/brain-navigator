import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Field } from '../components/ui/Field';
import { SkeletonCard } from '../components/ui/Skeleton';
import { Icon } from '../components/ui/Icon';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Ring } from '../components/ui/Ring';
import { ScienceNote } from '../components/ui/ScienceNote';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { cheerLine } from '../core/about';
import { Habit, HabitFrequency, useHabitsStore } from '../core/habitsStore';
import { addDays, dateKey } from '../core/dates';
import { plural } from '../core/words';
import { alpha, colors, dimensionColor, fonts } from '../core/theme';
import { WELLNESS_DIMENSIONS, WellnessDimension, dimensionLabel } from '../core/wellness';

// The window habits are counted over: long enough to show a rhythm, short enough to forgive.
const KEPT_WINDOW = 14;

const FREQUENCIES: { key: HabitFrequency; label: string }[] = [
  { key: 'daily', label: 'Every day' },
  { key: 'weekly', label: 'Weekly' },
];

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function lastSevenDays() {
  const out: { key: string; letter: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({ key: dayKey(d), letter: d.toLocaleDateString('en-US', { weekday: 'narrow' }) });
  }
  return out;
}

function todayStatus(pct: number | null) {
  if (pct === null) return 'Nothing daily yet';
  if (pct >= 100) return 'All done for today';
  if (pct > 0) return 'Making progress';
  return 'Nothing logged yet today';
}

// Small, specific habits that make a real difference for high schoolers.
const STUDENT_IDEAS: { name: string; category: WellnessDimension }[] = [
  { name: 'Phone out of the bedroom', category: 'physical' },
  { name: 'Read 20 minutes for fun', category: 'intellectual' },
  { name: 'Drink a full water bottle', category: 'physical' },
  { name: 'Pack my bag the night before', category: 'occupational' },
  { name: 'Move for 30 minutes', category: 'physical' },
  { name: 'Text a friend back', category: 'social' },
  { name: 'Check the planner after school', category: 'occupational' },
  { name: 'Outside for 10 minutes', category: 'environmental' },
  { name: 'Three good things', category: 'emotional' },
  { name: 'Lights out on time', category: 'physical' },
];

export default function HabitsScreen() {
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
    <Screen
      title="Habits"
      subtitle={isLoading && habits.length === 0 ? 'Loading…' : habits.length === 0 ? 'Small things, kept up.' : `${habits.length} you’re keeping up.`}
    >
      {dailyHabits.length > 0 ? (
        <Reveal index={0}>
          <Card style={styles.hero}>
            <Ring
              progress={todayPct != null ? todayPct / 100 : null}
              value={`${doneToday}`}
              unit={`/${dailyHabits.length}`}
              label="Today"
              color={colors.secured}
              size={84}
            />
            <View style={styles.heroInfo}>
              <Text style={styles.heroStatus}>{todayStatus(todayPct)}</Text>
              <Text style={styles.heroCaption}>{todayPct != null && todayPct >= 100 ? 'Nothing left to tap today.' : 'Tap a habit’s circle when you’ve done it today.'}</Text>
            </View>
          </Card>
        </Reveal>
      ) : null}

      <Reveal index={1}>
        <Section title="Your habits">
          {habits.length > 0 ? (
            <View style={styles.list}>
              {habits.map((h, i) => (
                <HabitRow key={h.id} habit={h} index={i} />
              ))}
            </View>
          ) : isLoading ? (
            <View style={styles.skeletons}>
              <SkeletonCard />
              <SkeletonCard lines={1} />
            </View>
          ) : !isLoading ? (
            <EmptyState title="No habits yet." body="Start with something small enough to do on a bad day." />
          ) : null}
        </Section>
      </Reveal>

      <Reveal index={2}>
        <Section title="Start a new one">
          <Card>
            <Text style={[styles.fieldLabel, styles.ideasLabel]}>Ideas that help students</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dimRow}>
              {STUDENT_IDEAS.filter((i) => !habits.some((h) => h.name === i.name)).map((i) => (
                <Chip
                  key={i.name}
                  label={i.name}
                  dot
                  color={dimensionColor[i.category]}
                  onPress={() => {
                    setName(i.name);
                    setCategory(i.category);
                  }}
                />
              ))}
            </ScrollView>
            <Field placeholder="e.g. A ten-minute walk" value={name} onChangeText={setName} returnKeyType="done" onSubmitEditing={handleAdd} containerStyle={styles.ideaField} />
            <Text style={styles.fieldLabel}>How often</Text>
            <ChipRow>
              {FREQUENCIES.map((f) => (
                <Chip key={f.key} label={f.label} selected={frequency === f.key} onPress={() => setFrequency(f.key)} />
              ))}
            </ChipRow>
            <Text style={styles.fieldLabel}>Part of life</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dimRow}>
              {WELLNESS_DIMENSIONS.map((d) => (
                <Chip key={d.key} label={d.label} dot color={dimensionColor[d.key]} selected={category === d.key} onPress={() => setCategory(d.key)} />
              ))}
            </ScrollView>
            <Button label="Add habit" icon="plus" loading={isSaving} onPress={handleAdd} disabled={isSaving || !name.trim()} style={styles.addButton} />
            {error ? <Text style={styles.errorText}>Couldn’t save that. Check your connection and try again.</Text> : null}
          </Card>
          <ScienceNote fact="Habits form through a cue → routine → reward loop, not willpower. Consistency wires it in — an occasional missed day doesn't erase the loop your brain has already built, so don't let one slip talk you into quitting the streak." />
        </Section>
      </Reveal>
    </Screen>
  );
}

function HabitRow({ habit, index }: { habit: Habit; index: number }) {
  const isLoggedToday = useHabitsStore((s) => s.isLoggedToday(habit.id));
  const weekProgress = useHabitsStore((s) => s.weekProgress(habit.id));
  const logs = useHabitsStore((s) => s.logs);
  const toggleLogToday = useHabitsStore((s) => s.toggleLogToday);
  const archiveHabit = useHabitsStore((s) => s.archiveHabit);
  const color = dimensionColor[habit.category] ?? colors.secured;

  const days = lastSevenDays();
  const logged = new Set(logs.filter((l) => l.habit_id === habit.id).map((l) => l.log_date));

  // A gentle count of the last two weeks, not a streak: a missed day never
  // resets anything or turns red (no streak pressure, see docs/design/DIRECTION.md).
  const since = addDays(dateKey(), -(KEPT_WINDOW - 1));
  const kept = [...logged].filter((d) => d >= since).length;

  const scale = useSharedValue(1);
  const toggle = async () => {
    const logging = !isLoggedToday;
    if (logging) scale.value = withSequence(withTiming(1.2, { duration: 120 }), withSpring(1, { damping: 8, stiffness: 260 }));
    await toggleLogToday(habit.id);
    if (logging) {
      const s = useHabitsStore.getState();
      const daily = s.habits.filter((h) => !h.archived && h.frequency === 'daily');
      if (daily.length > 0 && daily.every((h) => s.isLoggedToday(h.id))) {
        emberSay(cheerLine('Every habit, done today. Small things, kept, add up.'), 'cheer');
      }
    }
  };

  const pop = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(360)} exiting={FadeOut.duration(180)} layout={LinearTransition.springify().damping(18)}>
      <Card style={styles.habitCard}>
        <Pressy
          onPress={toggle}
          depth={0.86}
          haptic="light"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isLoggedToday }}
          accessibilityLabel={`${habit.name}, ${isLoggedToday ? 'done today' : 'not done yet today'}`}
        >
          <Animated.View
            style={[
              styles.logCircle,
              { borderColor: isLoggedToday ? color : alpha(color, 0.45) },
              isLoggedToday && { backgroundColor: color, shadowColor: color, shadowOpacity: 0.6, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
              pop,
            ]}
          >
            {isLoggedToday ? <Icon name="check" size={22} color={colors.flameInk} strokeWidth={2.6} /> : null}
          </Animated.View>
        </Pressy>

        <View style={styles.habitInfo}>
          <Text style={styles.habitName}>{habit.name}</Text>
          <View style={styles.metaRow}>
            <Icon name="flame" size={14} color={kept > 0 ? colors.flame : colors.textFaint} strokeWidth={2} />
            <Text style={styles.habitMeta}>
              {habit.frequency === 'daily' ? `Kept ${kept} of the last ${plural(KEPT_WINDOW, 'day')}` : `${plural(kept, 'time')} in two weeks`}, {dimensionLabel(habit.category)}
              {habit.frequency === 'weekly' ? `, ${weekProgress} of ${habit.target_per_week} this week` : ''}
            </Text>
          </View>
          <View style={styles.week}>
            {days.map((d) => {
              const on = logged.has(d.key);
              return (
                <View key={d.key} style={styles.dayCol}>
                  <View style={[styles.dayDot, on && { backgroundColor: color, borderColor: color }]} />
                  <Text style={styles.dayLetter}>{d.letter}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Pressy onPress={() => archiveHabit(habit.id)} hitSlop={10} depth={0.85} accessibilityLabel={`Remove ${habit.name}`} style={styles.trash}>
          <Icon name="trash" size={17} color={alpha(colors.danger, 0.75)} />
        </Pressy>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  skeletons: {
    gap: 10,
  },
  ideasLabel: {
    marginTop: 0,
  },
  ideaField: {
    marginTop: 14,
  },
  hero: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  heroInfo: {
    flex: 1,
  },
  heroStatus: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.text,
  },
  heroCaption: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textMuted,
  },
  list: {
    gap: 10,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  habitMeta: {
    flexShrink: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  week: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  dayCol: {
    alignItems: 'center',
    gap: 3,
  },
  dayDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
  },
  dayLetter: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9,
    color: colors.textFaint,
  },
  trash: {
    padding: 4,
    alignSelf: 'flex-start',
  },
  fieldLabel: {
    marginTop: 16,
    marginBottom: 8,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  dimRow: {
    gap: 8,
    paddingRight: 8,
  },
  addButton: {
    marginTop: 18,
  },
  errorText: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },
});
