import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { EmberGlyph } from '../components/ember/EmberSprite';
import { Card } from '../components/ui/Card';
import { CandleGlyph } from '../components/ui/CandleGlyph';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { type Jump, JumpChips, useJumps } from '../components/ui/JumpChips';
import { Section } from '../components/ui/Section';
import { Segmented } from '../components/ui/Segmented';
import { StatTile } from '../components/ui/StatTile';
import { journalWeeks } from '../core/journal';
import { useWellnessStore } from '../core/wellnessStore';
import { daysShowedUp } from '../core/achievements';
import { plural } from '../core/words';
import { addDays, dateKey } from '../core/dates';
import { useHubStore } from '../core/hubStore';
import { hoursTotal, useLifeStore, isSealed } from '../core/lifeStore';
import { useSchoolStore } from '../core/schoolStore';
import { alpha, colors, fonts } from '../core/theme';

type Measure = 'done' | 'focus' | 'days';
const MEASURE: Record<Measure, { label: string; color: string; unit: string }> = {
  done: { label: 'Finished', color: colors.secured, unit: 'finished' },
  focus: { label: 'Focus', color: colors.flame, unit: 'hours of focus' },
  days: { label: 'Days', color: '#8FB4E8', unit: 'days showed up' },
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function dayWords(key: string) {
  const [, m, d] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}
function weekWords(start: string, end: string) {
  return `${dayWords(start)} to ${dayWords(end)}`;
}

// One tappable candle; the picked one lifts and glows.
function WeekCandle({ selected, dim, label, onPress, children }: { selected: boolean; dim: boolean; label: string; onPress: () => void; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const sel = useSharedValue(0);
  sel.value = withTiming(selected ? 1 : 0, { duration: reduce ? 0 : 220 });
  const lift = useAnimatedStyle(() => ({
    transform: [{ translateY: reduce ? 0 : -3 * sel.value }],
    shadowOpacity: 0.7 * sel.value,
  }));
  return (
    <Pressy
      onPress={onPress}
      style={[styles.shelfCell, dim && !selected && { opacity: 0.35 }]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      accessibilityHint="Shows what happened that week"
    >
      <Animated.View style={[styles.glow, lift]}>{children}</Animated.View>
    </Pressy>
  );
}

// Everything you've done, added up. Counts, never streaks.
export default function YearScreen() {
  const assignments = useSchoolStore((s) => s.assignments);
  const focus = useSchoolStore((s) => s.focus);
  const grades = useSchoolStore((s) => s.grades);
  const notes = useHubStore((s) => s.notes);
  const colleges = useHubStore((s) => s.colleges);
  const life = useLifeStore();

  const done = assignments.filter((a) => a.done).length;
  const focusHours = Math.round((focus.reduce((s, f) => s + f.minutes, 0) / 60) * 10) / 10;
  const cards = life.decks.reduce((s, d) => s + d.cards.reduce((t, c) => t + c.seen, 0), 0);
  const gratitudeDays = Object.values(life.gratitude).filter((v) => v.some((x) => x.trim())).length;
  const showed = daysShowedUp();
  const service = Math.round(hoursTotal(life.hours, 'service') * 10) / 10;
  const driving = Math.round(hoursTotal(life.hours, 'driving') * 10) / 10;
  const badges = Object.keys(life.achievements).length;
  const [measure, setMeasure] = useState<Measure>('done');
  const [picked, setPicked] = useState(11);

  // The last twelve months, oldest first, for the chart.
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('en-US', { month: 'narrow' }), name: d.toLocaleDateString('en-US', { month: 'long' }) };
  });
  const monthOf = (iso: string) => dateKey(new Date(iso)).slice(0, 7);
  const showedDays = new Set<string>();
  for (const a of assignments) if (a.doneAt) showedDays.add(dateKey(new Date(a.doneAt)));
  for (const f of focus) showedDays.add(dateKey(new Date(f.at)));
  for (const w of life.wins) showedDays.add(dateKey(new Date(w.at)));
  for (const [k, v] of Object.entries(life.gratitude)) if (v.some((x) => x.trim())) showedDays.add(k);
  const values = months.map((m) =>
    measure === 'done'
      ? assignments.filter((a) => a.doneAt && monthOf(a.doneAt) === m.key).length
      : measure === 'focus'
        ? Math.round((focus.filter((f) => monthOf(f.at) === m.key).reduce((s, f) => s + f.minutes, 0) / 60) * 10) / 10
        : [...showedDays].filter((k) => k.startsWith(m.key)).length
  );
  // A candle for each of the last twelve weeks (Monday to Sunday), sized by what got finished.
  const monday = dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7)));
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const start = addDays(monday, (i - 11) * 7);
    const end = addDays(start, 6);
    const inWeek = (iso: string) => {
      const k = dateKey(new Date(iso));
      return k >= start && k <= end;
    };
    const finished = assignments.filter((a) => a.doneAt && inWeek(a.doneAt));
    const mins = focus.filter((f) => inWeek(f.at)).reduce((t, f) => t + f.minutes, 0);
    const win = life.wins.find((x) => inWeek(x.at) && !isSealed(x));
    const biggest = finished.reduce<(typeof finished)[number] | null>((b, a) => (!b || (a.minutes ?? 0) > (b.minutes ?? 0) ? a : b), null);
    const bestMoment = win ? win.text : biggest ? biggest.title : null;
    return { start, end, count: finished.length, mins, bestMoment };
  });
  const checkins = useWellnessStore((s) => s.checkins);
  const journal = useMemo(() => journalWeeks(8), [assignments, focus, checkins]);
  const [openWeek, setOpenWeek] = useState<string | null>(null);
  const openW = weeks.find((w) => w.start === openWeek) ?? null;
  const weekPeak = Math.max(1, ...weeks.map((w) => w.count));
  const peak = Math.max(...values);
  const best = peak > 0 ? months[values.indexOf(peak)] : null;
  // The picked month in words, next to the one before it.
  const cur = values[picked];
  const prev = picked > 0 ? values[picked - 1] : null;
  const unit = MEASURE[measure].unit;
  const pickedLine =
    cur === 0 && !prev
      ? `${months[picked].name}: nothing logged.`
      : prev == null
      ? `${months[picked].name}: ${cur} ${unit}.`
      : `${months[picked].name}: ${cur} ${unit}, ${cur > prev ? 'up from' : cur < prev ? 'down from' : 'same as'} ${prev} in ${months[picked - 1].name}.`;

  const line =
    showed === 0
      ? 'It all starts with one day. This page fills in as you go.'
      : `You showed up on ${plural(showed, 'day')}. That’s the whole secret.`;

  let n = 0;
  const jumps = useJumps();
  const parts: Jump[] = [
    { key: 'school', label: 'School' },
    { key: 'months', label: 'Month by month' },
    { key: 'you', label: 'You' },
    ...(life.wins.length ? [{ key: 'wins', label: 'Latest wins' }] : []),
  ];
  return (
    <Screen title="Your year" subtitle="Everything you’ve done, added up." scrollRef={jumps.scrollRef}>
      <JumpChips items={parts} onJump={jumps.jump} />
      <Reveal index={n++}>
        <Card tint={colors.flame} style={styles.hero}>
          <EmberGlyph size={44} />
          <Text style={styles.heroText}>{line}</Text>
        </Card>
      </Reveal>

      <View onLayout={jumps.mark('school')} />
      <Reveal index={n++}>
        <Section title="School">
          <View style={styles.row}>
            <StatTile label="Finished" value={String(done)} color={colors.secured} />
            <StatTile label="Focus" value={String(focusHours)} unit="h" color={colors.flame} />
            <StatTile label="Grades logged" value={String(grades.length)} />
          </View>
          <View style={[styles.row, styles.gap]}>
            <StatTile label="Cards flipped" value={String(cards)} color="#E89AB8" />
            <StatTile label="Notes" value={String(notes.length)} />
            <StatTile label="Colleges" value={String(colleges.length)} color="#8FB4E8" />
          </View>
        </Section>
      </Reveal>

      <View onLayout={jumps.mark('months')} />
      <Reveal index={n++}>
        <Section title="Month by month" note={best ? `Your biggest month: ${best.name}, ${peak} ${MEASURE[measure].unit}.` : 'Fills in as the months go by.'}>
          <Segmented<Measure>
            options={(Object.keys(MEASURE) as Measure[]).map((k) => ({ key: k, label: MEASURE[k].label }))}
            value={measure}
            onChange={setMeasure}
          />
          <Card style={styles.chart}>
            {months.map((m, i) => (
              <Pressy
                key={m.key}
                onPress={() => setPicked(i)}
                depth={0.92}
                style={styles.barCol}
                accessibilityRole="button"
                accessibilityState={{ selected: picked === i }}
                accessibilityLabel={`${m.name}: ${values[i]} ${MEASURE[measure].unit}`}
              >
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${peak ? Math.max(values[i] ? 6 : 0, (values[i] / peak) * 100) : 0}%`,
                        backgroundColor: i === picked ? MEASURE[measure].color : alpha(MEASURE[measure].color, 0.5),
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, i === picked && { color: MEASURE[measure].color }]}>{m.label}</Text>
              </Pressy>
            ))}
          </Card>
          <Text style={styles.picked}>{pickedLine}</Text>
        </Section>
      </Reveal>

      <View onLayout={jumps.mark('you')} />
      <Reveal index={n++}>
        <Section title="Candle of the week" note="One candle for each week. The more you finished, the taller and brighter it burns.">
          <Card style={styles.shelf}>
            <View style={styles.shelfRow}>
              {weeks.map((w) => (
                <WeekCandle
                  key={w.start}
                  selected={openWeek === w.start}
                  dim={w.count === 0}
                  label={`Week of ${weekWords(w.start, w.end)}: ${plural(w.count, 'thing')} finished`}
                  onPress={() => setOpenWeek(openWeek === w.start ? null : w.start)}
                >
                  <CandleGlyph
                    size={20}
                    intensity={0.2 + 0.8 * (w.count / weekPeak)}
                    remaining={0.35 + 0.65 * (w.count / weekPeak)}
                  />
                </WeekCandle>
              ))}
            </View>
            <View style={styles.shelfBoard} />
          </Card>
          {openW ? (
            <Pressy onPress={() => setOpenWeek(null)} accessibilityRole="button" accessibilityLabel="Close week details" accessibilityHint="Closes this card">
              <Card style={styles.weekCard}>
                <Text style={styles.weekDates}>{weekWords(openW.start, openW.end)}</Text>
                <Text style={styles.weekLine}>
                  {openW.count === 0 && openW.mins === 0
                    ? 'A quiet week. Rest counts too.'
                    : `You finished ${plural(openW.count, 'thing')} and focused for ${plural(openW.mins, 'minute')}.`}
                </Text>
                {openW.bestMoment ? <Text style={styles.weekBest}>Best moment: {openW.bestMoment}</Text> : null}
              </Card>
            </Pressy>
          ) : null}
        </Section>
      </Reveal>

      {journal.length ? (
        <Reveal index={n++}>
          <Section title="Ember’s journal">
            {journal.map((j) => (
              <View key={j.weekStart} style={styles.journalRow}>
                <Text style={styles.journalDate}>Week of {dayWords(j.weekStart)}</Text>
                <Text style={styles.journalLine}>{j.line}</Text>
              </View>
            ))}
          </Section>
        </Reveal>
      ) : null}

      <Reveal index={n++}>
        <Section title="You">
          <View style={styles.row}>
            <StatTile label="Wins" value={String(life.wins.length)} color="#E6C46A" />
            <StatTile label="Grateful days" value={String(gratitudeDays)} color="#F08A8A" />
            <StatTile label="Badges" value={String(badges)} color={colors.flame} />
          </View>
          <View style={[styles.row, styles.gap]}>
            <StatTile label="Service" value={String(service)} unit="h" color="#9FD08A" />
            <StatTile label="Driving" value={String(driving)} unit="h" color="#8FB4E8" />
            <StatTile label="Reviews" value={String(life.reviews.length)} />
          </View>
        </Section>
      </Reveal>

      {life.wins.length ? (
        <>
        <View onLayout={jumps.mark('wins')} />
        <Reveal index={n++}>
          <Section title="Latest wins">
            <Card>
              {life.wins.filter((w) => !isSealed(w)).slice(0, 5).map((w) => (
                <Text key={w.id} style={styles.win}>
                  • {w.text}
                </Text>
              ))}
            </Card>
          </Section>
        </Reveal>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroText: {
    flex: 1,
    fontFamily: fonts.displaySoft,
    fontSize: 17,
    lineHeight: 23,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  gap: {
    marginTop: 10,
  },
  chart: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  shelf: { paddingTop: 14, paddingBottom: 0, overflow: 'hidden' },
  shelfRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  shelfCell: { alignItems: 'center' },
  glow: { shadowColor: colors.flame, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0 },
  weekCard: { marginTop: 10 },
  weekDates: { fontFamily: fonts.display, fontSize: 16, color: colors.text },
  weekLine: { marginTop: 4, fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textMuted },
  journalRow: { marginBottom: 12 },
  journalDate: { fontFamily: fonts.body, fontSize: 12, color: colors.textFaint },
  journalLine: { marginTop: 2, fontFamily: fonts.displaySoft, fontSize: 16, lineHeight: 23, color: colors.text },
  weekBest: { marginTop: 6, fontFamily: fonts.displaySoft, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  shelfBoard: { height: 6, marginTop: 2, marginHorizontal: -16, backgroundColor: alpha(colors.flame, 0.22) },
  barTrack: {
    height: 110,
    width: '100%',
    justifyContent: 'flex-end',
    borderRadius: 5,
    backgroundColor: colors.surfaceSunk,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 5,
  },
  picked: {
    marginTop: 10,
    fontFamily: fonts.displaySoft,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
  },
  barLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textFaint,
  },
  win: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textMuted,
  },
});
