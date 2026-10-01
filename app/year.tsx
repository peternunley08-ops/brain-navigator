import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmberGlyph } from '../components/ember/EmberSprite';
import { Card } from '../components/ui/Card';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { Segmented } from '../components/ui/Segmented';
import { StatTile } from '../components/ui/StatTile';
import { daysShowedUp } from '../core/achievements';
import { dateKey } from '../core/dates';
import { useHubStore } from '../core/hubStore';
import { hoursTotal, useLifeStore } from '../core/lifeStore';
import { useSchoolStore } from '../core/schoolStore';
import { alpha, colors, fonts } from '../core/theme';

type Measure = 'done' | 'focus' | 'days';
const MEASURE: Record<Measure, { label: string; color: string; unit: string }> = {
  done: { label: 'Finished', color: colors.secured, unit: 'finished' },
  focus: { label: 'Focus', color: colors.flame, unit: 'hours of focus' },
  days: { label: 'Days', color: '#8FB4E8', unit: 'days showed up' },
};

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
      : `You showed up on ${showed} day${showed === 1 ? '' : 's'}. That’s the whole secret.`;

  let n = 0;
  return (
    <Screen title="Your year" subtitle="Everything you’ve done, added up.">
      <Reveal index={n++}>
        <Card tint={colors.flame} style={styles.hero}>
          <EmberGlyph size={44} />
          <Text style={styles.heroText}>{line}</Text>
        </Card>
      </Reveal>

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
        <Reveal index={n++}>
          <Section title="Latest wins">
            <Card>
              {life.wins.slice(0, 5).map((w) => (
                <Text key={w.id} style={styles.win}>
                  • {w.text}
                </Text>
              ))}
            </Card>
          </Section>
        </Reveal>
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
