import * as Haptics from '../core/haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutLeft, LinearTransition } from 'react-native-reanimated';
import { sprung } from '../core/motion';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { goBack } from '../core/chrome';
import { openSafe } from '../core/links';
import { plural } from '../core/words';
import { cheerLine } from '../core/about';
import { addDays, type Assignment, dateKey, daysUntil, KIND_LABEL, useSchoolStore } from '../core/schoolStore';
import { alpha, colors, fonts } from '../core/theme';
import { offerUndo } from '../core/undoStore';

function inTwoDays() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

// Overdue work, one decision at a time. Every late thing gets one of four
// answers — tonight, later, drop it, or talk to the teacher — so it stops
// sitting there making everything else feel heavier.
export default function TriageScreen() {
  const assignments = useSchoolStore((s) => s.assignments);
  const classes = useSchoolStore((s) => s.classes);
  const update = useSchoolStore((s) => s.updateAssignment);
  const toggle = useSchoolStore((s) => s.toggleAssignment);
  const remove = useSchoolStore((s) => s.deleteAssignment);

  const today = dateKey();
  // Quick ones (10 minutes or less) first: a couple of fast wins make the rest lighter.
  const quick = (a: Assignment) => a.minutes != null && a.minutes <= 10;
  const late = assignments
    .filter((a) => !a.done && a.due < today)
    .sort((a, b) => Number(quick(b)) - Number(quick(a)) || a.due.localeCompare(b.due));

  const settle = (msg?: string) => {
    Haptics.selectionAsync().catch(() => {});
    const left = useSchoolStore.getState().assignments.filter((a) => !a.done && a.due < today).length;
    if (left === 0) emberSay(cheerLine('Nothing overdue anymore. That weight’s off.'), 'cheer');
    else if (msg) emberSay(msg, 'happy');
  };

  // The polite line for a teacher, ready to copy or send.
  const [asking, setAsking] = useState<string | null>(null);
  const noteFor = (a: Assignment) => {
    const cls = classes.find((c) => c.id === a.classId);
    const who = cls?.teacher || 'there';
    const days = -daysUntil(a.due);
    return `Hi ${who},\n\nI’m behind on ${a.title} (it was due ${plural(days, 'day')} ago). Is it still possible to turn it in? I can have it to you by ${inTwoDays()}.\n\nThank you.`;
  };

  return (
    <Screen
      title="Sort out what’s late"
      subtitle={late.length ? `${plural(late.length, 'thing')}. One decision each.` : undefined}
      right={
        late.length > 1 ? (
          <Button
            label="All to tomorrow"
            size="sm"
            variant="secondary"
            onPress={() => {
              const before = late.map((a) => ({ id: a.id, due: a.due }));
              const tmr = addDays(today, 1);
              for (const a of late) update(a.id, { due: tmr });
              offerUndo(`Moved ${before.length} to tomorrow`, () => before.forEach((b) => useSchoolStore.getState().updateAssignment(b.id, { due: b.due })), 'arrow');
              emberSay('All moved to tomorrow. Pick the most important one first.', 'happy');
            }}
          />
        ) : undefined
      }
    >
      {late.length === 0 ? (
        <EmptyState title="Nothing’s late." body="If something slips later, this is where you sort it out.">
          <Button label="Back to School" variant="secondary" onPress={() => goBack()} />
        </EmptyState>
      ) : (
        <Reveal index={0}>
          <Text style={styles.intro}>
            Late work gets heavier the longer it sits. You don’t have to do it all tonight — you just have to decide.
          </Text>
        </Reveal>
      )}
      {late.map((a, i) => {
        const cls = classes.find((c) => c.id === a.classId);
        const color = cls?.color ?? colors.flame;
        const ago = -daysUntil(a.due);
        return (
          <Animated.View key={a.id} entering={FadeInDown.delay(i * 60).duration(300)} exiting={FadeOutLeft.duration(220)} layout={sprung(LinearTransition)}>
            <Card tint={colors.danger} style={styles.card}>
              <View style={styles.head}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <Text style={styles.meta}>
                  {KIND_LABEL[a.kind]}
                  {cls ? `, ${cls.name}` : ''}
                </Text>
                {quick(a) ? <Text style={styles.quick}>Quick, {a.minutes} min</Text> : null}
                <Text style={styles.ago}>{ago === 1 ? 'a day late' : `${ago} days late`}</Text>
              </View>
              <Text style={styles.title} onPress={() => router.push(`/assignment/${a.id}`)}>
                {a.title}
              </Text>
              <ChipRow style={styles.chips}>
                <Chip
                  label="Tonight"
                  icon="moon"
                  color={colors.flame}
                  onPress={() => {
                    update(a.id, { due: today, starred: true });
                    settle('Starred for tonight.');
                  }}
                />
                <Chip
                  label="Tomorrow"
                  onPress={() => {
                    update(a.id, { due: addDays(today, 1) });
                    settle();
                  }}
                />
                <Chip
                  label="This weekend"
                  onPress={() => {
                    const d = new Date();
                    const toSat = (6 - d.getDay() + 7) % 7 || 7;
                    update(a.id, { due: addDays(today, toSat) });
                    settle();
                  }}
                />
                <Chip
                  label="Already did it"
                  icon="check"
                  color={colors.secured}
                  onPress={() => {
                    toggle(a.id);
                    settle();
                  }}
                />
                <Chip label="Ask the teacher" icon="message" selected={asking === a.id} onPress={() => setAsking(asking === a.id ? null : a.id)} />
                <Chip
                  label="Let it go"
                  icon="trash"
                  color={colors.danger}
                  onPress={() => {
                    const snap = a;
                    remove(a.id);
                    offerUndo(`Let go of “${snap.title}”`, () => useSchoolStore.getState().restoreAssignment(snap));
                    settle('Sometimes a zero on one thing buys sleep for everything else.');
                  }}
                />
              </ChipRow>
              {asking === a.id ? (
                <Animated.View entering={FadeInDown.duration(240)} style={styles.note}>
                  <Text style={styles.noteText} selectable accessibilityLabel={`Note for the teacher: ${noteFor(a)}`}>
                    {noteFor(a)}
                  </Text>
                  <View style={styles.noteBtns}>
                    <Button label="Copy or share" size="sm" variant="secondary" onPress={() => Share.share({ message: noteFor(a) }).catch(() => {})} />
                    <Button
                      label="Open email"
                      size="sm"
                      onPress={() => openSafe(`mailto:?subject=${encodeURIComponent(`About ${a.title}`)}&body=${encodeURIComponent(noteFor(a))}`)}
                    />
                  </View>
                </Animated.View>
              ) : null}
            </Card>
          </Animated.View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  quick: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.secured,
    marginRight: 8,
  },
  intro: {
    marginTop: 12,
    marginBottom: 6,
    fontFamily: fonts.displaySoft,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textMuted,
  },
  card: {
    marginTop: 12,
    backgroundColor: alpha(colors.danger, 0.03),
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  meta: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
  },
  ago: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.danger,
  },
  title: {
    marginTop: 6,
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  chips: {
    marginTop: 14,
  },
  note: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: alpha(colors.text, 0.05),
  },
  noteText: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  noteBtns: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
});
