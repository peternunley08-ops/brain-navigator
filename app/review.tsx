import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { Field } from '../components/ui/Field';
import { Icon, type IconName } from '../components/ui/Icon';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { StatTile } from '../components/ui/StatTile';
import { addDays, dateKey } from '../core/dates';
import { useLifeStore, weekOf } from '../core/lifeStore';
import { useSchoolStore } from '../core/schoolStore';
import { colors, fonts } from '../core/theme';
import { useWellnessStore } from '../core/wellnessStore';

// Five minutes at the end of the week: what the numbers say, what went
// well, what was hard, and one thing to do differently.
export default function ReviewScreen() {
  const week = weekOf();
  const end = addDays(week, 6);
  const reviews = useLifeStore((s) => s.reviews);
  const saveReview = useLifeStore((s) => s.saveReview);
  const wins = useLifeStore((s) => s.wins);
  const assignments = useSchoolStore((s) => s.assignments);
  const focus = useSchoolStore((s) => s.focus);
  const checkins = useWellnessStore((s) => s.checkins);
  const existing = reviews.find((r) => r.weekOf === week);

  const [well, setWell] = useState(existing?.well ?? '');
  const [hard, setHard] = useState(existing?.hard ?? '');
  const [next, setNext] = useState(existing?.next ?? '');
  const lastWeek = reviews.find((r) => r.weekOf === addDays(week, -7));

  useEffect(() => {
    useWellnessStore.getState().fetchCheckins();
  }, []);

  const inWeek = (iso: string | null | undefined) => {
    if (!iso) return false;
    const k = dateKey(new Date(iso));
    return k >= week && k <= end;
  };
  const done = assignments.filter((a) => inWeek(a.doneAt)).length;
  const focusMin = focus.filter((f) => inWeek(f.at)).reduce((s, f) => s + f.minutes, 0);
  const winCount = wins.filter((w) => inWeek(w.at)).length;
  const checkinCount = checkins.filter((c) => c.checkin_date >= week && c.checkin_date <= end).length;
  const classes = useSchoolStore((s) => s.classes);

  // Highlights the week already holds, so the review starts with something true.
  const dayName = (k: string) => new Date(`${k}T12:00`).toLocaleDateString('en-US', { weekday: 'long' });
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i)).map((k) => {
    const on = (iso: string | null | undefined) => !!iso && dateKey(new Date(iso)) === k;
    const fin = assignments.filter((a) => on(a.doneAt)).length;
    const mins = focus.filter((f) => on(f.at)).reduce((s, f) => s + f.minutes, 0);
    return { k, fin, mins, score: fin * 30 + mins + wins.filter((w) => on(w.at)).length * 15 };
  });
  const bestDay = [...days].sort((a, b) => b.score - a.score)[0];
  const bestBits = bestDay ? [bestDay.fin ? `${bestDay.fin} finished` : '', bestDay.mins ? `${bestDay.mins} minutes of focus` : ''].filter(Boolean) : [];
  const byClass: Record<string, number> = {};
  for (const f of focus.filter((x) => inWeek(x.at))) {
    const cls = assignments.find((a) => a.id === f.assignmentId)?.classId;
    if (cls) byClass[cls] = (byClass[cls] ?? 0) + f.minutes;
  }
  const topClass = Object.entries(byClass).sort((a, b) => b[1] - a[1])[0];
  const topClassName = topClass ? classes.find((c) => c.id === topClass[0])?.name : undefined;
  const moodDay = checkins
    .filter((c) => c.checkin_date >= week && c.checkin_date <= end && c.mood != null)
    .sort((a, b) => (b.mood ?? 0) - (a.mood ?? 0))[0];
  // Short versions of the highlights, to drop into "What went well".
  const wentWell = [
    bestDay && bestDay.score > 0 ? { label: `${dayName(bestDay.k)} went well`, text: `${dayName(bestDay.k)} was a good day${bestBits.length ? `: ${bestBits.join(', ')}` : ''}.` } : null,
    topClassName ? { label: `Focus on ${topClassName}`, text: `I put real focus into ${topClassName}.` } : null,
    winCount ? { label: `${winCount} win${winCount === 1 ? '' : 's'}`, text: `${winCount} win${winCount === 1 ? '' : 's'} in the jar.` } : null,
    done ? { label: `${done} finished`, text: `Finished ${done} thing${done === 1 ? '' : 's'}.` } : null,
  ].filter((x): x is { label: string; text: string } => !!x);
  const highlights: { icon: IconName; color: string; text: string }[] = [
    bestDay && bestDay.score > 0
      ? {
          icon: 'star',
          color: colors.flame,
          text: `${dayName(bestDay.k)} was your biggest day${bestBits.length ? `: ${bestBits.join(', ')}` : ''}.`,
        }
      : null,
    topClassName ? { icon: 'book', color: '#8FB4E8', text: `Most of your focus went to ${topClassName} (${topClass![1]} minutes).` } : null,
    moodDay && (moodDay.mood ?? 0) >= 4 ? { icon: 'sun', color: colors.secured, text: `You felt best on ${dayName(moodDay.checkin_date)}. What was different that day?` } : null,
  ].filter((x): x is { icon: IconName; color: string; text: string } => !!x);

  const save = () => {
    saveReview({ weekOf: week, well: well.trim(), hard: hard.trim(), next: next.trim() });
    emberSay(next.trim() ? `Next week: “${next.trim().slice(0, 40)}”. I’ll remember.` : 'Week reviewed. That’s how weeks get better.', 'cheer');
    router.back();
  };

  const range = `${new Date(`${week}T12:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(`${end}T12:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  return (
    <Screen kicker={range} title="Your week" subtitle="Look back for five minutes. Then let it go.">
      <Reveal index={0}>
        <View style={styles.stats}>
          <StatTile label="Finished" value={String(done)} color={colors.secured} />
          <StatTile label="Focus" value={focusMin >= 60 ? `${Math.round((focusMin / 60) * 10) / 10}` : String(focusMin)} unit={focusMin >= 60 ? 'h' : 'm'} color={colors.flame} />
          <StatTile label="Wins" value={String(winCount)} color="#E6C46A" />
          <StatTile label="Check-ins" value={String(checkinCount)} color="#8FB4E8" />
        </View>
      </Reveal>

      {highlights.length ? (
        <Reveal index={1}>
          <Card style={styles.gap}>
            {highlights.map((h, i) => (
              <View key={i} style={[styles.highlight, i > 0 && styles.highlightGap]}>
                <Icon name={h.icon} size={17} color={h.color} />
                <Text style={styles.highlightText}>{h.text}</Text>
              </View>
            ))}
          </Card>
        </Reveal>
      ) : null}

      {lastWeek?.next ? (
        <Reveal index={1}>
          <Card tint={colors.flame} style={styles.gap}>
            <Text style={styles.label}>Last week you said you’d try</Text>
            <Text style={styles.quote}>“{lastWeek.next}”</Text>
            <Text style={styles.hint}>How did it go? Mention it below.</Text>
          </Card>
        </Reveal>
      ) : null}

      <Reveal index={2}>
        <Section title="What went well?">
          <Field value={well} onChangeText={setWell} placeholder="Even small things. Especially small things." multiline />
          {wentWell.length ? (
            <ChipRow style={styles.chips}>
              {wentWell
                .filter((w) => !well.includes(w.text))
                .map((w) => (
                  <Chip key={w.label} label={w.label} icon="plus" onPress={() => setWell((v) => (v.trim() ? `${v.trim()} ${w.text}` : w.text))} />
                ))}
            </ChipRow>
          ) : null}
        </Section>
      </Reveal>
      <Reveal index={3}>
        <Section title="What was hard?">
          <Field value={hard} onChangeText={setHard} placeholder="No fixing yet. Just name it." multiline />
        </Section>
      </Reveal>
      <Reveal index={4}>
        <Section title="One thing for next week">
          <Field value={next} onChangeText={setNext} placeholder="One. Specific. e.g. “Start the essay Tuesday, not Thursday.”" />
        </Section>
      </Reveal>
      <Reveal index={5}>
        <Button label={existing ? 'Update this week' : 'Done for the week'} icon="check" onPress={save} disabled={!well.trim() && !hard.trim() && !next.trim()} style={styles.save} />
      </Reveal>

      {reviews.filter((r) => r.weekOf !== week).length ? (
        <Reveal index={6}>
          <Section title="Earlier weeks">
            {reviews
              .filter((r) => r.weekOf !== week)
              .slice(0, 6)
              .map((r) => (
                <Card key={r.weekOf} style={styles.past}>
                  <Text style={styles.label}>Week of {new Date(`${r.weekOf}T12:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                  {r.well ? <Text style={styles.body}>+ {r.well}</Text> : null}
                  {r.hard ? <Text style={styles.body}>– {r.hard}</Text> : null}
                  {r.next ? <Text style={styles.body}>→ {r.next}</Text> : null}
                </Card>
              ))}
          </Section>
        </Reveal>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    marginTop: 10,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  highlightGap: {
    marginTop: 10,
  },
  highlightText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  gap: {
    marginTop: 14,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.textMuted,
  },
  quote: {
    marginTop: 4,
    fontFamily: fonts.displaySoft,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
  },
  hint: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  save: {
    marginTop: 24,
  },
  past: {
    marginBottom: 10,
  },
  body: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
});
