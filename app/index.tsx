import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Fragment, type ReactNode, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeOut, LinearTransition, useReducedMotion } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { CountdownChips } from '../components/desk/CountdownChips';
import { PinnedNotes } from '../components/desk/PinnedNotes';
import { ExamSeason } from '../components/desk/ExamSeason';
import { FirstLight } from '../components/desk/FirstLight';
import { NightDesk } from '../components/desk/NightDesk';
import { SparkFlight } from '../components/ember/Sparks';
import { weatherKind } from '../components/ui/Backdrop';
import { useWeatherStore } from '../core/weatherStore';
import { StreakOfLight } from '../components/desk/StreakOfLight';
import { DayBrief } from '../components/desk/DayCards';
import { EmberNote } from '../components/desk/EmberNote';
import { LitCard, useLitKind } from '../components/desk/LitCard';
import { TodayRows } from '../components/desk/TodayRows';
import { checkAchievements } from '../core/achievements';
import { QuickCapture } from '../components/desk/QuickCapture';
import { OneThing } from '../components/desk/OneThing';
import { emberSay } from '../components/ember/EmberBuddy';
import { Sparks } from '../components/ember/Sparks';
import { AssignmentRow } from '../components/school/AssignmentRow';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SkeletonCard } from '../components/ui/Skeleton';
import { syncCanvas } from '../core/canvas';
import { lineForToday } from '../core/dayLines';
import { useHubStore } from '../core/hubStore';
import { useBrainNavigatorStore } from '../core/store';
import { DESK_ORDER, useLifeStore, weekOf } from '../core/lifeStore';
import { NowCard } from '../components/school/NowCard';
import { Button } from '../components/ui/Button';
import { Candle, candleRemaining, candleSeed } from '../components/ui/Candle';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { Icon, type IconName } from '../components/ui/Icon';
import { IconButton } from '../components/ui/IconButton';
import { MoodPicker } from '../components/ui/MoodPicker';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Ring } from '../components/ui/Ring';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { useHabitsStore } from '../core/habitsStore';
import { useFlameClock } from '../core/hooks/useFlameClock';
import { useOpenLoops } from '../core/hooks/useOpenLoops';
import type { CognitiveStateEntry } from '../core/store';
import { beforeNight, isNight, minutesOf, minutesToNight, NIGHT_END, nightClockOverride, nightClockVersion, nightNow, nightStart, parseNightParam, setNightClock, subscribeNightClock, tonightKey } from '../core/night';
import { clock, dateKey, daysUntil, focusMinutesOn, isoDay, nowState, tonightsLoad, useSchoolStore, type SchoolClass } from '../core/schoolStore';
import { useTasksStore } from '../core/tasksStore';
import { plural } from '../core/words';
import { offerUndo } from '../core/undoStore';
import { selectionAsync } from '../core/haptics';
import { alpha, colors, fonts, layout, radii, skyGlow, textGrow } from '../core/theme';
import { useWellnessStore } from '../core/wellnessStore';
import { isShowing } from '../core/showMode';

const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
const MAX_ON_DESK = 9;
const MOOD_WORDS = ['Rough', 'Low', 'Okay', 'Good', 'Great'];
const DAY_MS = 24 * 60 * 60 * 1000;

// "Night" only once the Desk itself has turned to night, so the kicker and
// the line under the greeting agree; past midnight it's still the night before.
function momentLabel(d: Date, night: boolean) {
  const h = d.getHours();
  const back = night && h < 5 ? 1 : 0;
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate() - back).toLocaleDateString('en-US', { weekday: 'long' });
  const part = night ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  return `${day} ${part}`;
}

function countLine(n: number) {
  if (n === 0) return 'Nothing’s burning. The desk is clear.';
  const word = n <= 10 ? NUMBER_WORDS[n] : String(n);
  return n === 1 ? 'One thing is still open.' : `${word} things are still open.`;
}

// Uses what Ember calls them (About you) and, late or early, whether
// they said they're a night owl or a morning person.
function greetingFor(name: string, time?: string, d = new Date()) {
  const h = d.getHours();
  const late = h >= 22 || h < 5;
  const part =
    late && time === 'b' ? 'Night owl hours' : h < 5 ? 'Up late' : h < 9 && time === 'a' ? 'Early start' : h < 12 ? 'Morning' : h < 17 ? 'Hey' : 'Evening';
  return name ? `${part}, ${name}` : 'The Desk';
}

// One line about the day: what's due, and what's weighing on you.
function summaryLine(dueToday: number, dueTomorrow: number, open: number, late = 0) {
  const parts: string[] = [];
  // Late things are named as late, so "due today" means today (it matches School).
  if (late && dueToday) parts.push(`${dueToday} due today, ${late} late`);
  else if (late) parts.push(`${late} late`);
  else if (dueToday) parts.push(`${dueToday} due today`);
  else if (dueTomorrow) parts.push(`${dueTomorrow} due tomorrow`);
  if (open) parts.push(`${open} thing${open === 1 ? '' : 's'} on your mind`);
  if (!parts.length) return 'Nothing due, nothing burning. A good day to breathe.';
  const s = parts.join(', ');
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}.`;
}

// At night the same facts, said gently: what is left for tonight, and lateness can wait.
function nightSummaryLine(dueToday: number, dueTomorrow: number, open: number, late = 0, afterMidnight = false) {
  // After midnight "due today" means the coming morning, so there is nothing left for tonight.
  if (afterMidnight) return 'It’s past midnight. Everything else can wait for morning.';
  const rest = late || dueTomorrow || open;
  if (!dueToday) return rest ? 'Nothing left for tonight. The rest can wait for morning.' : 'Nothing left for tonight. Rest well.';
  const left = dueToday === 1 ? 'One thing' : plural(dueToday, 'thing');
  return rest ? `${left} left for tonight. The rest can wait for morning.` : `${left} left for tonight.`;
}

// The Desk follows the school day: the line under the greeting changes with where
// the student is (before school, in class, between classes, after school, evening).
// Night is handled separately. Uses the class schedule; no schedule, the plain summary.
function dayPartLine(classes: SchoolClass[], d: Date, plain: string) {
  const st = nowState(classes, d);
  const mins = d.getHours() * 60 + d.getMinutes();
  if (st.kind === 'in') {
    const left = plural(st.minsLeft, 'minute');
    return `In ${st.cls.name}, ${left} left.${st.next ? ` Then ${st.next.name}.` : ''}`;
  }
  if (st.kind === 'next') {
    const first = classes.filter((c) => c.days.includes(isoDay(d))).sort((a, b) => a.start - b.start)[0];
    if (first && st.cls.id === first.id) return `Before school. ${st.cls.name} at ${clock(st.cls.start)}. ${plain}`;
    return `Next up: ${st.cls.name} in ${plural(st.minsUntil, 'minute')}.`;
  }
  if (st.kind === 'done') return d.getHours() >= 17 ? `Evening. ${plain}` : `School’s done for today. ${plain}`;
  if (st.kind === 'free' && d.getHours() >= 17) return `Evening. ${plain}`;
  return plain;
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
  const quickMood = useWellnessStore((s) => s.quickMood);
  const logMood = async (v: number) => {
    selectionAsync();
    const undo = await quickMood(v);
    if (undo) offerUndo(`Logged today as ${MOOD_WORDS[v - 1].toLowerCase()}`, () => void undo(), 'check');
  };
  const loadingCheckins = useWellnessStore((s) => s.isLoadingCheckins && s.checkins.length === 0);
  const habits = useHabitsStore((s) => s.habits);
  const logs = useHabitsStore((s) => s.logs);
  const assignments = useSchoolStore((s) => s.assignments);
  const focus = useSchoolStore((s) => s.focus);
  const classes = useSchoolStore((s) => s.classes);
  const profile = useSchoolStore((s) => s.profile);
  const nickname = useLifeStore((s) => s.about.nickname.trim());
  const timePick = useLifeStore((s) => s.about.picks.time);
  const putDown = useLifeStore((s) => s.settings.putDown);
  // Where sparks earned elsewhere land (SparkFlight measures it on the way in).
  const candleRow = useRef<View>(null);
  // A night owl's evening (or a morning person's morning) starts with the brief.
  const hourNow = nightNow().getHours();
  const briefFirst = (timePick === 'b' && hourNow >= 17) || (timePick === 'a' && hourNow >= 5 && hourNow < 11);
  const schoolLoaded = useSchoolStore((s) => s.loaded);

  // Night runs from the wind-down hour (an hour later for a night owl) to 4:30 AM,
  // and the Desk shrinks to a short stack. In development only,
  // brainnavigator://?night=23:30 pretends it is that time and ?night=off stops.
  const { night: nightParam } = useLocalSearchParams<{ night?: string }>();
  useSyncExternalStore(subscribeNightClock, nightClockVersion);
  useEffect(() => {
    const m = parseNightParam(nightParam);
    if (__DEV__ && m !== undefined) setNightClock(m);
  }, [nightParam]);
  const [, setMinute] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setMinute((m) => m + 1), 60000);
    return () => clearInterval(iv);
  }, []);
  const windDown = useLifeStore((s) => s.settings.windDown);
  const firstLightSeen = useLifeStore((s) => s.settings.firstLightSeen);
  const weatherCode = useWeatherStore((s) => s.weatherCode);
  const sunrise = useWeatherStore((s) => s.sunrise);
  const sunset = useWeatherStore((s) => s.sunset);
  const nowMin = minutesOf(nightNow());
  const startMin = nightStart(windDown, timePick === 'b');
  const night = isNight(nowMin, startMin);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    if (!night) setShowAll(false);
  }, [night]);

  // First time here: Ember says hello and helps set things up.
  useEffect(() => {
    if (schoolLoaded && !profile.onboarded) router.push('/welcome');
  }, [schoolLoaded, profile.onboarded]);

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

  const dueSoon = assignments
    .filter((a) => !a.done)
    .sort((a, b) => a.due.localeCompare(b.due) || Number(!!b.starred) - Number(!!a.starred))
    .slice(0, 3);
  const dueToday = assignments.filter((a) => !a.done && daysUntil(a.due) === 0).length;
  const lateCount = assignments.filter((a) => !a.done && daysUntil(a.due) < 0).length;
  const dueTomorrow = assignments.filter((a) => !a.done && daysUntil(a.due) === 1).length;
  const focusToday = focusMinutesOn(focus, dateKey());
  const activeHabits = habits.filter((h) => !h.archived);
  const today = todayKey();
  const load = tonightsLoad(assignments);
  const cap = profile.nightlyCap;
  const doneToday = assignments.filter((a) => a.doneAt && dateKey(new Date(a.doneAt)) === today).length;
  // The Desk candles burn brighter as the day's done count rises against what was due.
  const dayLift = doneToday / Math.max(1, doneToday + dueToday + lateCount);
  const allClear = dueToday === 0 && lateCount === 0 && dueTomorrow === 0 && doneToday > 0;
  const reviews = useLifeStore((s) => s.reviews);
  // Sections the student chose to hide (Settings, "Your Desk").
  const deskHidden = useLifeStore((s) => s.settings.deskHidden);
  const show = (key: string) => !deskHidden.includes(key);
  // Desk sections fold with a tap on their heading, and stay folded.
  const deskFolded = useLifeStore((s) => s.settings.deskFolded) ?? [];
  const fold = (key: string) => ({
    folded: deskFolded.includes(key),
    onToggleFold: () => useLifeStore.getState().setSettings({ deskFolded: deskFolded.includes(key) ? deskFolded.filter((k) => k !== key) : [...deskFolded, key] }),
  });
  const deskOrder = useLifeStore((s) => s.settings.deskOrder) ?? DESK_ORDER;
  const now = nightNow();
  const dow = now.getDay();
  const reviewDue = (dow === 0 || dow === 6 || (dow === 5 && now.getHours() >= 15)) && !reviews.some((r) => r.weekOf === weekOf());
  const earn = useLifeStore((s) => s.earn);
  useEffect(() => {
    // Celebrations stay quiet while showing Riley (the badge is hers, in memory only).
    if (allClear && earn('all_clear') && !isShowing()) emberSay('New badge: All clear. Nothing due by tomorrow.', 'cheer');
  }, [allClear, earn]);
  const habitsDone = activeHabits.filter((h) => logs.some((l) => l.habit_id === h.id && l.log_date === today)).length;

  // Lit (default) or the classic long page (Settings → Your Desk).
  const lit = useLifeStore((s) => s.settings.deskLayout) !== 'classic';
  const windSoon = beforeNight(nowMin, startMin);
  const litKind = useLitKind({ allClear, windDownSoon: windSoon, deskHidden });
  // "More on your desk" starts folded; 'more' in deskFolded means it was opened.
  const moreOpen = deskFolded.includes('more');
  const toggleMore = () => useLifeStore.getState().setSettings({ deskFolded: moreOpen ? deskFolded.filter((k) => k !== 'more') : [...deskFolded, 'more'] });
  const windChip = (
    <ChipRow style={styles.windChip}>
      <Chip
        label={`Wind-down in ${plural(minutesToNight(nowMin, startMin), 'minute')}`}
        icon="moon"
        onPress={() => router.push('/sleep')}
        accessibilityLabel={`Wind-down at ${clock(startMin)}. Open sleep.`}
      />
    </ChipRow>
  );
  const reviewCard = (
    <Card onPress={() => router.push('/review')} style={styles.clear}>
      <Icon name="star" size={22} color={colors.flame} />
      <View style={styles.promptText}>
        <Text style={styles.promptTitle}>Look back at your week</Text>
        <Text style={styles.promptBody}>Five minutes: what went well, what was hard, one thing for next week.</Text>
      </View>
      <Icon name="chevron" size={18} color={colors.textFaint} />
    </Card>
  );
  const mindButtons = (
    <>
      <Button label="Set something down" icon="candle" variant="secondary" onPress={() => router.push('/new-entry')} style={styles.primary} />
      <Button
        label="Not sure what it is? Talk it through"
        variant="ghost"
        icon="chat"
        size="sm"
        onPress={() => router.push('/companion')}
        style={styles.ghost}
      />
    </>
  );

  // The lower Desk sections, in the order chosen in Settings.
  const deskSections: Record<string, ReactNode> = {
    due: (
show('due') ? (
      <Reveal index={1}>
        <Section
          {...fold('due')}
          title="Due soon"
          note={load.items.length ? `Tonight: ${load.minutes} of ${cap} minutes${load.minutes > cap ? ', over your cap' : ''}` : undefined}
          action={{ label: assignments.some((a) => !a.done) ? 'All' : 'Add', onPress: () => router.push(assignments.some((a) => !a.done) ? '/school' : '/add-assignment') }}>
          {load.items.length ? <ProgressBar value={load.minutes / Math.max(1, cap)} color={load.minutes > cap ? colors.unlocked : colors.secured} height={5} style={styles.loadBar} /> : null}
          {dueSoon.length ? (
            <View style={styles.list}>
              {dueSoon.map((a, i) => (
                <AssignmentRow key={a.id} a={a} index={i} compact />
              ))}
            </View>
          ) : (
            <Card onPress={() => router.push('/add-assignment')}>
              <View style={styles.promptRow}>
                <View style={[styles.promptIcon, { backgroundColor: alpha('#8FB4E8', 0.14) }]}>
                  <Icon name="book" size={22} color="#8FB4E8" />
                </View>
                <View style={styles.promptText}>
                  <Text style={styles.promptTitle}>Nothing due</Text>
                  <Text style={styles.promptBody}>Add homework or a test, or scan your Classroom to-do list.</Text>
                </View>
                <Icon name="plus" size={18} color={colors.textFaint} />
              </View>
            </Card>
          )}
        </Section>
      </Reveal>
      ) : null
    ),
    mind: (
      <>
        {show('mind') ? (
      <Reveal index={2}>
        <Section {...fold('mind')} title="On your mind" note={countLine(openLoops.length)}>
        <View style={styles.desk}>
          <View ref={candleRow} style={styles.candles}>
            {onDesk.length === 0 ? (
              <View style={styles.emptyCandle}>
                <Candle width={112} time={time} intensity={0.35 + 0.25 * dayLift} remaining={0.55} seed={1.7} state="unlit" reducedMotion={reducedMotion} />
              </View>
            ) : (
              <View style={styles.grid}>
                {onDesk.map((entry, i) => (
                  <DeskCandle key={entry.id} entry={entry} index={i} dayLift={dayLift} width={candleW} time={time} reducedMotion={reducedMotion} />
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
        </Section>
      </Reveal>
      ) : null}
      <Reveal index={3}>{mindButtons}</Reveal>
      </>
    ),
    checkin: (
show('checkin') ? (
      <Reveal index={4}>
        <Section
          {...fold('checkin')}
          title="How you’re doing"
          action={todaysCheckin ? { label: 'Edit', onPress: () => router.push('/checkin') } : undefined}
        >
          {loadingCheckins ? (
            <SkeletonCard lines={1} />
          ) : todaysCheckin?.mood != null ? (
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
                  progress={todaysCheckin.sleep_hours != null ? Math.min(1, todaysCheckin.sleep_hours / profile.sleepGoal) : null}
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
            <Card tint={colors.flame}>
              <Text style={styles.promptTitle} accessibilityRole="header">How’s today feeling?</Text>
              <Text style={styles.promptBody}>Tap a face. Hold one for the full check-in.</Text>
              <View style={styles.moodRow}>
                <MoodPicker value={null} onChange={logMood} onLongPress={() => router.push('/checkin')} />
              </View>
            </Card>
          )}
        </Section>
      </Reveal>
      ) : null
    ),
    tiles: (
show('tiles') ? (
      <Reveal index={5}>
        <View style={styles.tiles}>
          <Tile
            icon="timer"
            color="#F5B45C"
            title="Focus today"
            value={focusToday ? `${focusToday} min` : 'None yet'}
            note={focusToday ? 'Keep the candle going' : 'Light a study candle'}
            onPress={() => router.push('/focus')}
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
      ) : null
    ),
    line: (
show('line') ? (
      <Reveal index={6}>
        <Text style={styles.dayLine}>{lineForToday()}</Text>
      </Reveal>
      ) : null
    ),
  };

  return (
    <Screen
      back={false}
      tone="ember"
      glowColor={skyGlow(nightNow(), { sunrise, sunset })}
      onRefresh={() =>
        Promise.all([
          fetchCheckins(),
          useBrainNavigatorStore.getState().fetchOpenLoops(),
          useTasksStore.getState().fetchToday(),
          useHabitsStore.getState().fetchHabits(),
          useHubStore.getState().canvas.token ? syncCanvas().catch(() => null) : null,
        ]).then(() => {
          const earned = checkAchievements();
          if (earned.length) emberSay(`New badge: ${earned[earned.length - 1].title}.`, 'cheer');
        })
      }
      motes
      weather={weatherKind(weatherCode)}
      overlay={<SparkFlight target={candleRow} />}
      kicker={momentLabel(nightNow(), night)}
      title={greetingFor(nickname || profile.name, timePick, nightNow())}
      subtitle={
        night
          ? putDown === tonightKey()
            ? 'The day is put down. The rest can wait for morning.'
            : nightSummaryLine(dueToday, dueTomorrow, openLoops.length, lateCount, nowMin < NIGHT_END)
          : dayPartLine(classes, nightNow(), summaryLine(dueToday, dueTomorrow, openLoops.length, lateCount))
      }
      right={
        <View style={styles.headerBtns}>
          <IconButton icon="search" label="Search everything" onPress={() => router.push('/search')} />
          <IconButton icon="drawer" label="Open the Drawer" onPress={() => router.push('/drawer')} />
        </View>
      }
    >
      {__DEV__ && nightClockOverride() != null ? (
        <ChipRow style={styles.windChip}>
          <Chip label={`Pretend time ${clock(nightClockOverride() ?? 0)}`} icon="clock" onPress={() => setNightClock(null)} accessibilityLabel="Pretend time is on. Tap to use the real clock." />
        </ChipRow>
      ) : null}
      {night && !showAll ? (
        <NightDesk onShowAll={() => setShowAll(true)} />
      ) : lit ? (
        // The lit Desk: one lit card, Ember's note, Today in three rows, and
        // everything else one tap away under "More on your desk".
        <>
          <FirstLight seen={firstLightSeen} onSeen={(k) => useLifeStore.getState().setSettings({ firstLightSeen: k })} />
          <Reveal index={0}>
            {windSoon && litKind !== 'windDown' ? windChip : null}
            <LitCard kind={litKind} doneToday={doneToday} />
            <EmberNote deskHidden={deskHidden} />
          </Reveal>
          <Reveal index={1}>
            <TodayRows open={openLoops.length} show={show} onMood={logMood} candleRow={candleRow} />
          </Reveal>
          <Reveal index={2}>
            <Section title="More on your desk" folded={!moreOpen} onToggleFold={toggleMore}>
              {reviewDue ? reviewCard : null}
              {litKind !== 'oneThing' && show('onething') ? <OneThing /> : null}
              {litKind !== 'class' && litKind !== 'nextClass' ? <NowCard /> : null}
              {litKind !== 'brief' && show('brief') ? <DayBrief /> : null}
              {litKind !== 'exams' ? <View style={styles.foldGap}><ExamSeason /></View> : null}
              {show('countdowns') ? <CountdownChips /> : null}
              {show('capture') ? <QuickCapture /> : null}
              {show('pinned') ? <PinnedNotes /> : null}
              <View style={styles.foldGap}>
                <StreakOfLight />
              </View>
              {show('mind') ? mindButtons : null}
              {deskSections.tiles}
              {deskSections.line}
            </Section>
          </Reveal>
        </>
      ) : (
        <>
          <View style={styles.streak}>
            <StreakOfLight />
          </View>
          <ExamSeason />
          <FirstLight seen={firstLightSeen} onSeen={(k) => useLifeStore.getState().setSettings({ firstLightSeen: k })} />
          <Reveal index={0}>
            {windSoon ? windChip : null}
            {/* Ember's note: one day card at a time, the rest a tap away. */}
            <EmberNote deskHidden={deskHidden} />
          {show('countdowns') ? <CountdownChips /> : null}
            {briefFirst && show('brief') ? <DayBrief /> : null}
            {show('onething') ? <OneThing /> : null}
            <NowCard />
            {show('capture') ? <QuickCapture /> : null}
            {show('pinned') ? <PinnedNotes /> : null}
            {!briefFirst && show('brief') ? <DayBrief /> : null}
          </Reveal>

          {allClear ? (
            <Reveal index={0}>
              <Card tint={colors.secured} style={styles.clear}>
                <Sparks burst={1} reach={60} />
                <Icon name="sparkle" size={22} color={colors.secured} />
                <View style={styles.promptText}>
                  <Text style={styles.promptTitle}>All clear.</Text>
                  <Text style={styles.promptBody}>
                    {doneToday} thing{doneToday === 1 ? '' : 's'} done today, nothing due by tomorrow. The rest of the day is yours.
                  </Text>
                </View>
              </Card>
            </Reveal>
          ) : null}

          {reviewDue ? <Reveal index={0}>{reviewCard}</Reveal> : null}

          {deskOrder.map((k) => (
            <Fragment key={k}>{deskSections[k]}</Fragment>
          ))}
        </>
      )}
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
  icon: IconName;
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
      <Text style={styles.tileTitle} maxFontSizeMultiplier={textGrow.control}>{title}</Text>
      <Text style={styles.tileValue} maxFontSizeMultiplier={textGrow.display}>{value}</Text>
      <Text style={styles.tileNote}>{note}</Text>
    </Card>
  );
}

function DeskCandle({
  entry,
  index,
  dayLift,
  width,
  time,
  reducedMotion,
}: {
  entry: CognitiveStateEntry;
  index: number;
  dayLift: number;
  width: number;
  time: ReturnType<typeof useFlameClock>;
  reducedMotion: boolean;
}) {
  const intensity = Math.min(1, ((entry.intensity ?? 5) / 10) * (0.8 + 0.35 * dayLift));

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
  streak: { marginBottom: 14 },
  foldGap: { marginTop: 12 },
  headerBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  windChip: {
    marginTop: 12,
  },
  clear: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  loadBar: {
    marginBottom: 12,
  },
  dayLine: {
    marginTop: 32,
    paddingHorizontal: 12,
    fontFamily: fonts.displaySoft,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textMuted,
    textAlign: 'center',
  },
  desk: {
    marginTop: 4,
  },
  list: {
    gap: 10,
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
  moodRow: {
    marginTop: 12,
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
