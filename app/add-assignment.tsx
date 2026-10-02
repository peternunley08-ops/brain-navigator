import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Chip, ChipRow } from '../components/ui/Chip';
import { Field } from '../components/ui/Field';
import type { IconName } from '../components/ui/Icon';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { goBack } from '../core/chrome';
import { addDays, type AssignmentKind, dateKey, daysUntil, dueLabel, KIND_LABEL, useSchoolStore } from '../core/schoolStore';
import { alpha, colors, fonts, radii } from '../core/theme';

const KINDS: { key: AssignmentKind; icon: IconName }[] = [
  { key: 'homework', icon: 'pen' },
  { key: 'test', icon: 'flag' },
  { key: 'quiz', icon: 'help' },
  { key: 'project', icon: 'sparkle' },
  { key: 'essay', icon: 'feather' },
  { key: 'reading', icon: 'book' },
];

const DURATIONS = [15, 30, 45, 60, 90, 120];

export default function AddAssignmentScreen() {
  const { id, classId: classParam, like } = useLocalSearchParams<{ id?: string; classId?: string; like?: string }>();
  const classes = useSchoolStore((s) => s.classes);
  const assignments = useSchoolStore((s) => s.assignments);
  const addAssignment = useSchoolStore((s) => s.addAssignment);
  const updateAssignment = useSchoolStore((s) => s.updateAssignment);
  const existing = assignments.find((a) => a.id === id);
  // "Another like this": same class, kind, and length; a fresh title and date.
  const template = like ? assignments.find((a) => a.id === like) : undefined;
  const focus = useSchoolStore((s) => s.focus);

  const today = dateKey();
  const [title, setTitle] = useState(existing?.title ?? '');
  const [kind, setKind] = useState<AssignmentKind>(existing?.kind ?? template?.kind ?? 'homework');
  const [classId, setClassId] = useState<string | null>(existing?.classId ?? template?.classId ?? classParam ?? null);
  const [due, setDue] = useState(existing?.due ?? (template ? addDays(template.due, 7) : addDays(today, 1)));
  const [minutes, setMinutes] = useState<number | null>(existing?.minutes ?? template?.minutes ?? 30);

  // How long this kind of thing actually takes you, from finished work you
  // focused on (needs at least two to say anything).
  const learned = useMemo(() => {
    const samples = assignments
      .filter((a) => a.done && a.kind === kind && (!classId || a.classId === classId))
      .map((a) => focus.filter((f) => f.assignmentId === a.id).reduce((s, f) => s + f.minutes, 0))
      .filter((m) => m >= 5);
    if (samples.length < 2) return null;
    return Math.round(samples.reduce((s, m) => s + m, 0) / samples.length / 5) * 5;
  }, [assignments, focus, kind, classId]);

  // What else is due each day, so a pile-up is visible before adding to it.
  const dueCount = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of assignments) if (!a.done && a.id !== existing?.id) m[a.due] = (m[a.due] ?? 0) + 1;
    return m;
  }, [assignments, existing?.id]);
  const pile = dueCount[due] ?? 0;
  const [notes, setNotes] = useState(existing?.notes ?? '');

  // Two weeks of days to pick from, starting today.
  const days = useMemo(
    () =>
      Array.from({ length: 21 }, (_, i) => {
        const key = addDays(today, i);
        const [y, m, d] = key.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return {
          key,
          top: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : date.toLocaleDateString('en-US', { weekday: 'short' }),
          num: d,
          weekend: date.getDay() === 0 || date.getDay() === 6,
        };
      }),
    [today]
  );

  const cls = classes.find((c) => c.id === classId);
  const accent = cls?.color ?? colors.flame;

  const save = () => {
    const t = title.trim();
    if (!t) return;
    if (existing) {
      updateAssignment(existing.id, { title: t, kind, classId, due, minutes, notes: notes.trim() });
      goBack();
      return;
    }
    addAssignment({ title: t, kind, classId, due, minutes, notes: notes.trim() });
    goBack();
    const n = daysUntil(due);
    if ((kind === 'test' || kind === 'quiz') && n >= 1 && n <= 4) {
      emberSay(`A ${KIND_LABEL[kind].toLowerCase()} ${dueLabel(due).toLowerCase() === 'tomorrow' ? 'tomorrow' : `on ${dueLabel(due)}`}. Short study sessions between now and then beat one long cram.`, 'curious');
    } else {
      emberSay(`Got it, due ${dueLabel(due).toLowerCase() === 'today' || dueLabel(due).toLowerCase() === 'tomorrow' ? dueLabel(due).toLowerCase() : dueLabel(due)}.`, 'happy');
    }
  };

  return (
    <Screen
      nav={false}
      backIcon="close"
      glowColor={accent}
      title={existing ? 'Edit' : 'What’s due?'}
      subtitle={existing ? undefined : 'Homework, a test, a project. Get it out of your head.'}
    >
      <Reveal index={0}>
        <Field big containerStyle={styles.block} placeholder="e.g. Chapter 6 problems" value={title} onChangeText={setTitle} />
      </Reveal>

      <Reveal index={1}>
        <Section title="What kind">
          <ChipRow>
            {KINDS.map((k) => (
              <Chip key={k.key} label={KIND_LABEL[k.key]} icon={k.icon} selected={kind === k.key} color={accent} onPress={() => setKind(k.key)} />
            ))}
          </ChipRow>
        </Section>
      </Reveal>

      <Reveal index={2}>
        <Section
          title="For which class"
          action={{ label: classes.length ? 'Edit classes' : 'Add classes', onPress: () => router.push(classes.length ? '/classes' : '/class-edit') }}
        >
          {classes.length ? (
            <ChipRow>
              {classes
                .filter((c) => c.kind === 'class')
                .map((c) => (
                  <Chip key={c.id} label={c.name} dot color={c.color} selected={classId === c.id} onPress={() => setClassId(c.id)} />
                ))}
              <Chip label="Other" selected={classId === null} onPress={() => setClassId(null)} />
            </ChipRow>
          ) : (
            <Text style={styles.hint}>No classes yet — it’ll go under “Other.”</Text>
          )}
        </Section>
      </Reveal>

      <Reveal index={3}>
        <Section title="Due" note={dueLabel(due) === 'Today' || dueLabel(due) === 'Tomorrow' ? dueLabel(due) : `${dueLabel(due)}, in ${daysUntil(due)} days`}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
            {days.map((d) => {
              const on = d.key === due;
              return (
                <Pressy
                  key={d.key}
                  onPress={() => setDue(d.key)}
                  depth={0.9}
                  style={[styles.day, on && { backgroundColor: accent, borderColor: accent }, d.weekend && !on && styles.weekend]}
                  accessibilityLabel={dueLabel(d.key)}
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.dayTop, on && styles.dayOn]}>{d.top}</Text>
                  <Text style={[styles.dayNum, on && styles.dayOn]}>{d.num}</Text>
                  <View style={styles.dayDots}>
                    {Array.from({ length: Math.min(3, dueCount[d.key] ?? 0) }, (_, i) => (
                      <View key={i} style={[styles.dayDot, { backgroundColor: on ? colors.flameInk : (dueCount[d.key] ?? 0) >= 3 ? colors.unlocked : colors.textFaint }]} />
                    ))}
                  </View>
                </Pressy>
              );
            })}
          </ScrollView>
          {pile >= 2 ? (
            <Text style={styles.pile}>
              {pile} other things are already due {dueLabel(due) === 'Today' || dueLabel(due) === 'Tomorrow' ? dueLabel(due).toLowerCase() : `on ${dueLabel(due)}`}. Could any of it start earlier?
            </Text>
          ) : null}
        </Section>
      </Reveal>

      <Reveal index={4}>
        <Section
          title="How long will it take?"
          note={learned ? `Your ${KIND_LABEL[kind].toLowerCase()}s${cls ? ` for ${cls.name}` : ''} usually take about ${learned} min.` : 'A rough guess is fine. It’s how Ember knows when a night is too full.'}
          action={learned && minutes !== learned ? { label: `Use ${learned} min`, onPress: () => setMinutes(learned) } : undefined}
        >
          <ChipRow>
            {DURATIONS.map((m) => (
              <Chip key={m} label={m >= 60 ? `${m / 60} h` : `${m} min`} icon="clock" selected={minutes === m} color={accent} onPress={() => setMinutes(m)} />
            ))}
          </ChipRow>
        </Section>
      </Reveal>

      <Reveal index={5}>
        <View style={styles.block}>
          <Field label="Notes" placeholder="Pages, rubric, who to ask… (optional)" value={notes} onChangeText={setNotes} multiline />
        </View>
        <Button label={existing ? 'Save' : 'Add it'} icon="check" onPress={save} disabled={!title.trim()} style={styles.save} />
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: 16,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textFaint,
  },
  days: {
    gap: 8,
    paddingRight: 8,
  },
  day: {
    width: 56,
    height: 64,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  weekend: {
    backgroundColor: alpha(colors.surface, 0.5),
  },
  dayTop: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textFaint,
  },
  dayNum: {
    marginTop: 2,
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.text,
  },
  dayOn: {
    color: colors.flameInk,
  },
  dayDots: {
    flexDirection: 'row',
    gap: 2,
    height: 5,
    marginTop: 3,
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  pile: {
    marginTop: 10,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.unlocked,
  },
  save: {
    marginTop: 24,
  },
});
