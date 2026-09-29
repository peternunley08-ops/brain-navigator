import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeOut, LinearTransition, useReducedMotion } from 'react-native-reanimated';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/ui/Button';
import { Candle, candleRemaining, candleSeed } from '../components/ui/Candle';
import { useFlameClock } from '../core/hooks/useFlameClock';
import { useOpenLoops } from '../core/hooks/useOpenLoops';
import type { CognitiveStateEntry } from '../core/store';
import { colors, fonts, radii, spacing } from '../core/theme';
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
  if (n === 0) return "Nothing's open. The desk is clear.";
  const word = n <= 10 ? NUMBER_WORDS[n] : String(n);
  return n === 1 ? 'One thing is still open.' : `${word} things are still open.`;
}

function ageLabel(createdAt: string) {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / DAY_MS);
  if (days <= 0) return 'Open since today';
  return days === 1 ? 'Open for a day' : `Open for ${days} days`;
}

export default function DeskScreen() {
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const time = useFlameClock();
  const openLoops = useOpenLoops();

  const fetchCheckins = useWellnessStore((s) => s.fetchCheckins);
  const todaysCheckin = useWellnessStore((s) => s.todaysCheckin());

  useEffect(() => {
    fetchCheckins();
  }, [fetchCheckins]);

  const onDesk = openLoops.slice(0, MAX_ON_DESK);
  const overflow = openLoops.length - onDesk.length;

  // Fewer candles each get more presence on the desk.
  const contentWidth = Math.min(width, 480) - spacing.lg * 2;
  const perRow = onDesk.length <= 2 ? Math.max(1, onDesk.length) : 3;
  const candleW = Math.min(onDesk.length <= 2 ? 150 : 108, (contentWidth - (perRow - 1) * spacing.md) / perRow);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.moment}>{momentLabel()}</Text>
          <Button label="Drawer" variant="pill" onPress={() => router.push('/drawer')} />
        </View>

        <Text style={styles.title}>The Desk</Text>
        <Text style={styles.subtitle}>{countLine(openLoops.length)}</Text>

        <View style={styles.desk}>
          {onDesk.length === 0 ? (
            <View style={styles.emptyCandle}>
              <Candle
                width={120}
                time={time}
                intensity={0.4}
                remaining={0.55}
                seed={1.7}
                state="unlit"
                reducedMotion={reducedMotion}
              />
            </View>
          ) : (
            <View style={styles.grid}>
              {onDesk.map((entry, i) => (
                <DeskCandle
                  key={entry.id}
                  entry={entry}
                  index={i}
                  width={candleW}
                  time={time}
                  reducedMotion={reducedMotion}
                />
              ))}
            </View>
          )}
          <View style={styles.deskEdge} />
          {overflow > 0 ? (
            <Pressable onPress={() => router.push('/open-loops')} hitSlop={8}>
              <Text style={styles.link}>
                And {overflow} more. See everything that's open.
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Button
          label="Set something down"
          onPress={() => router.push('/new-entry')}
          style={styles.primary}
        />
        <Pressable onPress={() => router.push('/companion')} hitSlop={8} style={styles.emberLink}>
          <Text style={styles.link}>Not sure what it is? Talk it through with Ember.</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Today</Text>
        <View style={styles.todayCard}>
          {todaysCheckin ? (
            <>
              <Text style={styles.todayText}>
                Mood {todaysCheckin.mood ?? '–'} of 5, stress {todaysCheckin.stress_level ?? '–'} of 10
                {todaysCheckin.sleep_hours != null ? `, slept ${todaysCheckin.sleep_hours} hours` : ''}.
              </Text>
              <Button label="Edit check-in" variant="pill" onPress={() => router.push('/checkin')} />
            </>
          ) : (
            <>
              <Text style={styles.todayText}>
                No check-in yet. It takes a minute and gives the rest of the app its context.
              </Text>
              <Button label="Check in" variant="pill" onPress={() => router.push('/checkin')} />
            </>
          )}
        </View>
      </ScrollView>

      <BottomNav />
    </View>
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
    <Animated.View
      layout={LinearTransition.springify().damping(18)}
      exiting={FadeOut.duration(260)}
      style={{ width }}
    >
      <Pressable
        onPress={() => router.push(`/entry/${entry.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${entry.mood || 'Untitled'}. ${ageLabel(entry.created_at)}.`}
        style={({ pressed }) => [styles.candleCell, pressed && styles.pressed]}
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
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: 130,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moment: {
    fontFamily: fonts.displaySoft,
    fontSize: 16,
    color: colors.inkMuted,
  },
  title: {
    marginTop: spacing.md,
    fontFamily: fonts.display,
    fontSize: 38,
    color: colors.ink,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.inkMuted,
  },
  desk: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: spacing.md,
    rowGap: spacing.lg,
  },
  emptyCandle: {
    alignItems: 'center',
    opacity: 0.8,
  },
  deskEdge: {
    alignSelf: 'stretch',
    height: 1,
    marginTop: spacing.md,
    backgroundColor: colors.divider,
  },
  candleCell: {
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  candleLabel: {
    marginTop: spacing.sm,
    fontFamily: fonts.displaySoft,
    fontSize: 15,
    lineHeight: 19,
    color: colors.ink,
    textAlign: 'center',
  },
  candleAge: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkFaint,
    textAlign: 'center',
  },
  link: {
    marginTop: spacing.md,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.leather,
    textAlign: 'center',
  },
  primary: {
    marginTop: spacing.xl,
  },
  emberLink: {
    alignSelf: 'center',
  },
  sectionTitle: {
    marginTop: spacing.xxl,
    fontFamily: fonts.displaySoft,
    fontSize: 22,
    color: colors.ink,
  },
  todayCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    gap: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.backgroundAlt,
    alignItems: 'flex-start',
  },
  todayText: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.inkMuted,
  },
});
