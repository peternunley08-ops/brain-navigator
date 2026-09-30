import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeOut, LinearTransition, useReducedMotion } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Button } from '../components/ui/Button';
import { Candle, candleRemaining, candleSeed } from '../components/ui/Candle';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { IconButton } from '../components/ui/IconButton';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Ring } from '../components/ui/Ring';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { useHabitsStore } from '../core/habitsStore';
import { useFlameClock } from '../core/hooks/useFlameClock';
import { useOpenLoops } from '../core/hooks/useOpenLoops';
import type { CognitiveStateEntry } from '../core/store';
import { useTasksStore } from '../core/tasksStore';
import { alpha, colors, fonts, layout, radii } from '../core/theme';
import { useWellnessStore } from '../core/wellnessStore';

const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
const MAX_ON_DESK = 9;
const DAY_MS = 24 * 60 * 60 * 1000;

function momentLabel(d = new Date()) {
  const day = d.toLocaleDateString('en-US', { weekday: 'long' });
  const h = d.getHours();
  const part = h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';
  return `${day} ${part}`;
}

function countLine(n: number) {
  if (n === 0) return 'Nothing’s burning. The desk is clear.';
  const word = n <= 10 ? NUMBER_WORDS[n] : String(n);
  return n === 1 ? 'One thing is still open.' : `${word} things are still open.`;
}

function ageLabel(createdAt: string) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / DAY_MS);
  if (days <= 0) return 'Since today';
  return days === 1 ? 'A day' : `${days} days`;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DeskScreen() {
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const time = useFlameClock();
  const openLoops = useOpenLoops();

  const fetchCheckins = useWellnessStore((s) => s.fetchCheckins);
  const todaysCheckin = useWellnessStore((s) => s.todaysCheckin());
  const tasks = useTasksStore((s) => s.tasks);
  const dailyCap = useTasksStore((s) => s.dailyCap);
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);

  useEffect(() => {
    fetchCheckins();
  }, [fetchCheckins]);

  // The plate and habits tiles (and Ember's advice) read these; refresh
  // them whenever the Desk comes back into view.
  useFocusEffect(
    useCallback(() => {
      useTasksStore.getState().fetchToday();
      useHabitsStore.getState().fetchHabits();
    }, [])
  );

  const onDesk = openLoops.slice(0, MAX_ON_DESK);
  const overflow = openLoops.length - onDesk.length;

  // Fewer candles each get more presence on the desk.
  const contentWidth = Math.min(width, layout.maxWidth) - layout.gutter * 2 - 24;
  const perRow = onDesk.length <= 2 ? Math.max(1, onDesk.length) : 3;
  const candleW = Math.min(onDesk.length <= 2 ? 140 : 100, (contentWidth - (perRow - 1) * 14) / perRow);

  const openTasks = tasks.filter((t) => !t.completed).length;
  const doneTasks = tasks.length - openTasks;
  const activeHabits = habits.filter((h) => !h.archived);
  const today = todayKey();
  const habitsDone = activeHabits.filter((h) => logs.some((l) => l.habit_id === h.id && l.log_date === today)).length;

  return (
    <Screen
      back={false}
      tone="ember"
      motes
      kicker={momentLabel()}
      title="The Desk"
      subtitle={countLine(openLoops.length)}
      right={<IconButton icon="drawer" label="Open the Drawer" onPress={() => router.push('/drawer')} />}
    >
      <Reveal index={0}>
        <View style={styles.desk}>
          <View style={styles.candles}>
            {onDesk.length === 0 ? (
              <View style={styles.emptyCandle}>
                <Candle width={112} time={time} intensity={0.4} remaining={0.55} seed={1.7} state="unlit" reducedMotion={reducedMotion} />
              </View>
            ) : (
              <View style={styles.grid}>
                {onDesk.map((entry, i) => (
                  <DeskCandle key={entry.id} entry={entry} index={i} width={candleW} time={time} reducedMotion={reducedMotion} />
                ))}
              </View>
            )}
          </View>
          <LinearGradient
            colors={[alpha('#F5B45C', 0), alpha('#F5B45C', 0.45), alpha('#F5B45C', 0)]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.deskEdge}
          />
          {/* The desk: light spilling across its surface from the candles,
              and a brass edge that fades out at both ends. */}
          <View style={styles.deskSurface} pointerEvents="none">
            <Svg width="100%" height={56}>
              <Defs>
                <RadialGradient id="deskSpill" cx="50%" cy="0%" r="70%" fx="50%" fy="0%">
                  <Stop offset="0" stopColor="#F5A04E" stopOpacity={openLoops.length ? 0.28 : 0.1} />
                  <Stop offset="1" stopColor="#F5A04E" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height={56} fill="url(#deskSpill)" />
            </Svg>
          </View>
          {overflow > 0 ? (
            <Pressy onPress={() => router.push('/open-loops')} hitSlop={8} style={styles.moreLink}>
              <Text style={styles.link}>And {overflow} more — see everything that’s open</Text>
            </Pressy>
          ) : null}
        </View>
      </Reveal>

      <Reveal index={1}>
        <Button label="Set something down" icon="plus" onPress={() => router.push('/new-entry')} style={styles.primary} />
        <Button
          label="Not sure what it is? Talk it through"
          variant="ghost"
          icon="chat"
          size="sm"
          onPress={() => router.push('/companion')}
          style={styles.ghost}
        />
      </Reveal>

      <Reveal index={2}>
        <Section
          title="Today"
          action={todaysCheckin ? { label: 'Edit', onPress: () => router.push('/checkin') } : undefined}
        >
          {todaysCheckin ? (
            <Card onPress={() => router.push('/checkin')}>
              <View style={styles.rings}>
                <Ring
                  progress={todaysCheckin.mood != null ? todaysCheckin.mood / 5 : null}
                  value={todaysCheckin.mood != null ? String(todaysCheckin.mood) : undefined}
                  unit="/5"
                  label="Mood"
                  color={colors.secured}
                />
                <Ring
                  progress={todaysCheckin.sleep_hours != null ? Math.min(1, todaysCheckin.sleep_hours / 8) : null}
                  value={todaysCheckin.sleep_hours != null ? String(todaysCheckin.sleep_hours) : undefined}
                  unit="h"
                  label="Sleep"
                  color="#8FB4E8"
                  delay={120}
                />
                <Ring
                  progress={todaysCheckin.stress_level != null ? 1 - (todaysCheckin.stress_level - 1) / 9 : null}
                  value={todaysCheckin.stress_level != null ? String(11 - todaysCheckin.stress_level) : undefined}
                  unit="/10"
                  label="Calm"
                  color={colors.flame}
                  delay={240}
                />
              </View>
            </Card>
          ) : (
            <Card tint={colors.flame} onPress={() => router.push('/checkin')}>
              <View style={styles.promptRow}>
                <View style={styles.promptIcon}>
                  <Icon name="sun" size={24} color={colors.flame} />
                </View>
                <View style={styles.promptText}>
                  <Text style={styles.promptTitle}>Check in for today</Text>
                  <Text style={styles.promptBody}>Mood, sleep, and stress. About a minute.</Text>
                </View>
                <Icon name="chevron" size={18} color={colors.textFaint} />
              </View>
            </Card>
          )}
        </Section>
      </Reveal>

      <Reveal index={3}>
        <View style={styles.tiles}>
          <Tile
            icon="plate"
            color="#E6C46A"
            title="Your plate"
            value={tasks.length === 0 ? 'Empty' : `${doneTasks} of ${tasks.length}`}
            note={tasks.length === 0 ? 'Nothing planned' : openTasks > dailyCap ? 'Over your cap' : `${openTasks} still open`}
            onPress={() => router.push('/tasks')}
          />
          <Tile
            icon="repeat"
            color={colors.secured}
            title="Habits"
            value={activeHabits.length === 0 ? 'None yet' : `${habitsDone} of ${activeHabits.length}`}
            note={activeHabits.length === 0 ? 'Start one' : habitsDone === activeHabits.length ? 'All done today' : 'Done today'}
            onPress={() => router.push('/habits')}
          />
        </View>
      </Reveal>
    </Screen>
  );
}

function Tile({
  icon,
  color,
  title,
  value,
  note,
  onPress,
}: {
  icon: 'plate' | 'repeat';
  color: string;
  title: string;
  value: string;
  note: string;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: alpha(color, 0.14) }]}>
        <Icon name={icon} size={19} color={color} />
      </View>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileNote}>{note}</Text>
    </Card>
  );
}

function DeskCandle({
  entry,
  index,
  width,
  time,
  reducedMotion,
}: {
  entry: CognitiveStateEntry;
  index: number;
  width: number;
  time: ReturnType<typeof useFlameClock>;
  reducedMotion: boolean;
}) {
  const intensity = (entry.intensity ?? 5) / 10;

  return (
    <Animated.View layout={LinearTransition.springify().damping(18)} exiting={FadeOut.duration(260)} style={{ width }}>
      <Pressy
        onPress={() => router.push(`/entry/${entry.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${entry.mood || 'Untitled'}. Open for ${ageLabel(entry.created_at)}.`}
        style={styles.candleCell}
        depth={0.94}
      >
        <Candle
          width={width}
          time={time}
          intensity={intensity}
          remaining={candleRemaining(entry.created_at)}
          seed={candleSeed(entry.id)}
          state="lit"
          reducedMotion={reducedMotion}
          igniteDelay={reducedMotion ? 0 : 260 + index * 170}
        />
        <Text style={styles.candleLabel} numberOfLines={2}>
          {entry.mood || 'Untitled'}
        </Text>
        <Text style={styles.candleAge}>{ageLabel(entry.created_at)}</Text>
      </Pressy>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  desk: {
    marginTop: 12,
  },
  candles: {
    paddingHorizontal: 12,
    minHeight: 150,
    justifyContent: 'flex-end',
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 14,
    rowGap: 22,
  },
  emptyCandle: {
    alignItems: 'center',
  },
  deskSurface: {
    height: 56,
    marginHorizontal: -20,
    marginBottom: -56,
  },
  deskEdge: {
    height: 1,
    marginTop: -6,
  },
  candleCell: {
    alignItems: 'center',
  },
  candleLabel: {
    marginTop: 6,
    fontFamily: fonts.displaySoft,
    fontSize: 15,
    lineHeight: 19,
    color: colors.text,
    textAlign: 'center',
  },
  candleAge: {
    marginTop: 2,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
  },
  moreLink: {
    alignSelf: 'center',
    marginTop: 14,
  },
  link: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.flame,
    textAlign: 'center',
  },
  primary: {
    marginTop: 28,
  },
  ghost: {
    marginTop: 6,
    alignSelf: 'center',
  },
  rings: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  promptIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.flame, 0.14),
  },
  promptText: {
    flex: 1,
  },
  promptTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  promptBody: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
  },
  tiles: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  tile: {
    flex: 1,
    width: undefined,
    borderRadius: radii.lg,
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tileTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
  },
  tileValue: {
    marginTop: 2,
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
  },
  tileNote: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
});
