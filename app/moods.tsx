import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { IconButton } from '../components/ui/IconButton';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { addDays, dateKey } from '../core/dates';
import { useSchoolStore } from '../core/schoolStore';
import { colors, fonts, radii } from '../core/theme';
import { useWellnessStore } from '../core/wellnessStore';

// 1 (rough) → 5 (great), the same scale as the check-in.
const MOOD_COLORS = ['#F07060', '#F0845A', '#F5B45C', '#9FD08A', '#8CC0A8'];
const MOOD_WORDS = ['Rough', 'Low', 'Okay', 'Good', 'Great'];
const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// A month of moods as dots, what's been weighing on you, and what your own
// numbers say about sleep and mood.
export default function MoodsScreen() {
  const checkins = useWellnessStore((s) => s.checkins);
  const fetchCheckins = useWellnessStore((s) => s.fetchCheckins);
  const stressTags = useSchoolStore((s) => s.stressTags);
  const sleepGoal = useSchoolStore((s) => s.profile.sleepGoal);
  const [offset, setOffset] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    fetchCheckins();
  }, [fetchCheckins]);

  const byDate = useMemo(() => Object.fromEntries(checkins.map((c) => [c.checkin_date, c])), [checkins]);

  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = (month.getDay() + 6) % 7;
  const cells = [...Array.from({ length: lead }, () => null), ...Array.from({ length: daysIn }, (_, i) => dateKey(new Date(month.getFullYear(), month.getMonth(), i + 1)))];
  const logged = cells.filter((k) => k && byDate[k]?.mood != null).length;

  // What's been heavy, last 30 days.
  const since = addDays(dateKey(), -30);
  const tagCounts: Record<string, number> = {};
  for (const [k, tags] of Object.entries(stressTags)) {
    if (k < since) continue;
    for (const t of tags) tagCounts[t] = (tagCounts[t] ?? 0) + 1;
  }
  const tags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const tagMax = tags[0]?.[1] ?? 1;

  // Your own evidence: mood after nights at goal vs short nights.
  const withBoth = checkins.filter((c) => c.mood != null && c.sleep_hours != null);
  const rested = withBoth.filter((c) => (c.sleep_hours ?? 0) >= sleepGoal - 0.5);
  const short = withBoth.filter((c) => (c.sleep_hours ?? 0) < sleepGoal - 0.5);
  const avg = (xs: typeof withBoth) => xs.reduce((s, c) => s + (c.mood ?? 0), 0) / Math.max(1, xs.length);
  const sleepLine =
    rested.length >= 2 && short.length >= 2
      ? avg(rested) > avg(short) + 0.2
        ? `On nights you got close to ${sleepGoal} hours, your mood averaged ${avg(rested).toFixed(1)}. On short nights, ${avg(short).toFixed(1)}. Your own numbers say sleep matters for you.`
        : `Your mood has been about the same on short and long nights so far (${avg(rested).toFixed(1)} vs ${avg(short).toFixed(1)}). Keep checking in and this gets clearer.`
      : 'After a few more check-ins with sleep, this will show how sleep and mood move together for you.';

  const p = picked ? byDate[picked] : null;

  return (
    <Screen title="Mood map" subtitle="Patterns show up when you can see a whole month.">
      <Reveal index={0}>
        <Card style={styles.cal}>
          <View style={styles.calHead}>
            <IconButton icon="back" label="Previous month" size={34} onPress={() => setOffset((o) => o - 1)} />
            <View style={styles.calTitle}>
              <Text style={styles.month}>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
              <Text style={styles.sub}>{logged} day{logged === 1 ? '' : 's'} checked in</Text>
            </View>
            <IconButton icon="chevron" label="Next month" size={34} onPress={() => setOffset((o) => Math.min(0, o + 1))} />
          </View>
          <View style={styles.grid}>
            {WEEK.map((d, i) => (
              <Text key={i} style={styles.weekday}>
                {d}
              </Text>
            ))}
            {cells.map((k, i) => {
              if (!k) return <View key={`e${i}`} style={styles.cell} />;
              const c = byDate[k];
              const mood = c?.mood;
              const future = k > dateKey();
              const color = mood != null ? MOOD_COLORS[Math.max(0, Math.min(4, Math.round(mood) - 1))] : null;
              return (
                <Pressy
                  key={k}
                  onPress={() => setPicked(picked === k ? null : k)}
                  depth={0.88}
                  style={styles.cell}
                  accessibilityLabel={`${k}${mood != null ? `, mood ${MOOD_WORDS[Math.round(mood) - 1]}` : ', no check-in'}`}
                >
                  <View
                    style={[
                      styles.dot,
                      color ? { backgroundColor: color } : { borderWidth: 1, borderColor: future ? 'transparent' : colors.line },
                      k === dateKey() && styles.today,
                      picked === k && styles.picked,
                    ]}
                  >
                    <Text style={[styles.dayNum, color ? { color: colors.flameInk } : future && { color: colors.hint }]}>{Number(k.slice(8))}</Text>
                  </View>
                </Pressy>
              );
            })}
          </View>
          <View style={styles.legend}>
            {MOOD_WORDS.map((w, i) => (
              <View key={w} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: MOOD_COLORS[i] }]} />
                <Text style={styles.legendText}>{w}</Text>
              </View>
            ))}
          </View>
          {p ? (
            <View style={styles.detail}>
              <Text style={styles.detailTitle}>
                {new Date(`${picked}T12:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>
              <Text style={styles.sub}>
                {[
                  p.mood != null ? `Mood ${MOOD_WORDS[Math.round(p.mood) - 1].toLowerCase()}` : null,
                  p.sleep_hours != null ? `${p.sleep_hours}h sleep` : null,
                  p.stress_level != null ? `stress ${p.stress_level}/10` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              {picked && stressTags[picked]?.length ? <Text style={styles.sub}>Weighing on you: {stressTags[picked].join(', ')}</Text> : null}
              {p.notes ? <Text style={styles.note}>“{p.notes}”</Text> : null}
            </View>
          ) : picked ? (
            <Text style={[styles.sub, styles.detail]}>No check-in that day.</Text>
          ) : null}
        </Card>
      </Reveal>

      <Reveal index={1}>
        <Section title="What’s been heavy" note="From your check-ins, the last 30 days.">
          {tags.length ? (
            <Card>
              {tags.map(([t, n]) => (
                <View key={t} style={styles.tagRow}>
                  <Text style={styles.tag}>{t}</Text>
                  <ProgressBar value={n / tagMax} color={colors.unlocked} height={6} style={styles.flex} />
                  <Text style={styles.tagN}>{n}</Text>
                </View>
              ))}
              <Text style={[styles.sub, styles.tagHint]}>
                {tags[0][0] === 'Sleep'
                  ? 'Sleep keeps coming up. The Sleep page has a plan for tonight.'
                  : tags[0][0] === 'Tests' || tags[0][0] === 'Homework'
                    ? 'School stress is at the top. Planning big things backward spreads it out.'
                    : 'Naming what’s heavy is the first step to setting it down.'}
              </Text>
            </Card>
          ) : (
            <Card>
              <Text style={styles.sub}>When you check in, pick what’s weighing on you — it shows up here.</Text>
              <Button label="Check in now" icon="sun" variant="secondary" size="sm" onPress={() => router.push('/checkin')} style={styles.btn} />
            </Card>
          )}
        </Section>
      </Reveal>

      <Reveal index={2}>
        <Section title="Sleep and you">
          <Card tint="#8FB4E8">
            <Text style={styles.body}>{sleepLine}</Text>
          </Card>
        </Section>
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  cal: {
    marginTop: 16,
  },
  calHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  calTitle: {
    flex: 1,
    alignItems: 'center',
  },
  month: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.text,
  },
  sub: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textFaint,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.textFaint,
    marginBottom: 6,
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: '78%',
    aspectRatio: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    borderWidth: 2,
    borderColor: colors.flame,
  },
  picked: {
    transform: [{ scale: 1.12 }],
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  dayNum: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.textMuted,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textFaint,
  },
  detail: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  detailTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  note: {
    marginTop: 6,
    fontFamily: fonts.displaySoft,
    fontSize: 14,
    color: colors.textMuted,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  tag: {
    width: 92,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  tagN: {
    width: 22,
    textAlign: 'right',
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.textMuted,
  },
  tagHint: {
    marginTop: 8,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  btn: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
});
