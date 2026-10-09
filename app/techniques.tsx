import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { sprung } from '../core/motion';
import * as Haptics from '../core/haptics';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Chip, ChipRow } from '../components/ui/Chip';
import { Card } from '../components/ui/Card';
import { Icon, type IconName } from '../components/ui/Icon';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { dateKey } from '../core/dates';
import { uid, useSchoolStore } from '../core/schoolStore';
import { alpha, colors, fonts } from '../core/theme';

interface Technique {
  key: string;
  name: string;
  line: string;
  icon: IconName;
  color: string;
  steps: string[];
  why: string;
  action?: { label: string; href: string };
  /** A step small enough to add to tonight's homework. */
  tonight: string;
}

// The study methods that actually hold up in research, written the way
// you'd explain them to a friend — each with a way to try it right now.
const TECHNIQUES: Technique[] = [
  {
    key: 'recall',
    tonight: 'Close the book, write what you remember',
    name: 'Active recall',
    line: 'Close the book and pull it out of your head.',
    icon: 'bolt',
    color: '#F5B45C',
    steps: ['Read a section once.', 'Close it. Write or say everything you remember.', 'Open it and check what you missed.', 'Repeat on the misses only.'],
    why: 'Retrieving a memory strengthens it far more than seeing it again. It feels harder than rereading — that’s the point.',
    action: { label: 'Make flashcards', href: '/flashcards' },
  },
  {
    key: 'spaced',
    tonight: 'Ten-minute review of yesterday’s material',
    name: 'Spaced repetition',
    line: 'A little, over several days, beats a lot the night before.',
    icon: 'calendar',
    color: '#8FB4E8',
    steps: ['Start studying a few days before the test.', 'Review the same material on day 1, day 2, day 4.', 'Spend more time on what you keep forgetting.'],
    why: 'Memories fade on a curve; each review flattens it. Cramming works for tomorrow and is gone by next week.',
    action: { label: 'Plan a test backward', href: '/school' },
  },
  {
    key: 'feynman',
    tonight: 'Explain it out loud like to a 7th grader',
    name: 'The Feynman technique',
    line: 'Explain it like you’re teaching a 7th grader.',
    icon: 'chat',
    color: '#9FD08A',
    steps: ['Pick one idea.', 'Explain it simply, out loud or on paper, no jargon.', 'Where you get stuck or vague — that’s the gap.', 'Go back to the source for just that part, then explain it again.'],
    why: 'You can’t fake simple. Explaining exposes what you only thought you understood.',
    action: { label: 'Talk it through with Ember', href: '/companion' },
  },
  {
    key: 'blurt',
    tonight: 'Ten-minute blurt on a blank page',
    name: 'Blurting',
    line: 'Dump everything you know on a blank page.',
    icon: 'pen',
    color: '#E89AB8',
    steps: ['Set a timer for 10 minutes.', 'Write everything you remember about the topic — no notes.', 'Check against your notes in a different color.', 'The different-color parts are what to study.'],
    why: 'A fast, honest map of what you know and don’t. Great the week before a test.',
    action: { label: 'Open a blank note', href: '/notes' },
  },
  {
    key: 'practice',
    tonight: 'Timed practice problems, no notes',
    name: 'Practice testing',
    line: 'Do the kind of problems the test will have.',
    icon: 'grade',
    color: '#F0845A',
    steps: ['Find old tests, textbook problems, or make your own questions.', 'Do them under test conditions — timed, no notes.', 'Grade yourself and redo what you missed.'],
    why: 'The closer practice is to the real test, the better it transfers. Especially for math and science.',
  },
  {
    key: 'interleave',
    tonight: 'Mixed set: three problem types, shuffled',
    name: 'Interleaving',
    line: 'Mix problem types instead of doing ten of the same.',
    icon: 'repeat',
    color: '#AFA2DE',
    steps: ['Instead of 10 of type A then 10 of type B…', '…mix them: A, C, B, A, C, B.', 'Before each one, name which method it needs.'],
    why: 'Tests don’t tell you which method to use. Mixing trains you to recognize the problem, not just solve it.',
  },
  {
    key: 'pomodoro',
    tonight: 'Two 25-minute rounds, phone in another room',
    name: 'Pomodoro',
    line: '25 minutes on, 5 off. Repeat.',
    icon: 'timer',
    color: '#D99A6C',
    steps: ['Pick one task.', 'Work for 25 minutes. Phone in another room.', 'Take a real 5-minute break — stand up, water.', 'After four rounds, take a longer break.'],
    why: 'Starting is the hardest part; a short clock makes starting small. Breaks keep attention from draining.',
    action: { label: 'Start a focus session', href: '/focus' },
  },
  {
    key: 'elaborate',
    tonight: 'Ask “why?” for each key fact',
    name: 'Elaboration',
    line: 'Ask “why?” and “how does this connect?”',
    icon: 'map',
    color: '#8CC0A8',
    steps: ['For each fact, ask why it’s true.', 'Connect it to something you already know.', 'Compare it with something similar — how is it different?'],
    why: 'Facts with connections are easier to find later. Isolated facts get lost.',
  },
  {
    key: 'sleep',
    tonight: 'Hard stuff before 9, quick review in the morning',
    name: 'Sleep on it',
    line: 'Sleep is when learning gets saved.',
    icon: 'moon',
    color: '#8FB4E8',
    steps: ['Study the hard stuff in the evening, not at 2 AM.', 'Get your full night before a test.', 'A quick review in the morning locks it in.'],
    why: 'During deep sleep the brain replays and stores what you learned. An all-nighter skips the saving step.',
    action: { label: 'Sleep calculator', href: '/sleep' },
  },
];

export default function TechniquesScreen() {
  const [open, setOpen] = useState<string | null>('recall');
  const assignments = useSchoolStore((s) => s.assignments);
  const classes = useSchoolStore((s) => s.classes);
  // The next few open things, soonest first: where a technique could go tonight.
  const upcoming = assignments.filter((a) => !a.done).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 3);
  const tryOn = (t: Technique, id: string) => {
    const a = useSchoolStore.getState().assignments.find((x) => x.id === id);
    if (!a) return;
    const text = `${t.tonight} (${t.name.toLowerCase()})`;
    if (a.subtasks?.some((s) => s.text === text)) return;
    useSchoolStore.getState().updateAssignment(a.id, { subtasks: [...(a.subtasks ?? []), { id: uid(), text, done: false, on: dateKey() }] });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    emberSay(`Added to ${a.title}: ${t.tonight.charAt(0).toLowerCase()}${t.tonight.slice(1)}.`, 'happy');
  };
  return (
    <Screen title="How to study" subtitle="The methods that actually work, and how to try each one tonight.">
      {TECHNIQUES.map((t, i) => {
        const isOpen = open === t.key;
        return (
          <Reveal key={t.key} index={i}>
            <Animated.View layout={sprung(LinearTransition)}>
              <Card
                tint={isOpen ? t.color : undefined}
                onPress={() => setOpen(isOpen ? null : t.key)}
                style={styles.card}
                accessibilityState={{ expanded: isOpen }}
              >
                <View style={styles.head}>
                  <View style={[styles.icon, { backgroundColor: alpha(t.color, 0.15) }]}>
                    <Icon name={t.icon} size={20} color={t.color} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.name}>{t.name}</Text>
                    <Text style={styles.line}>{t.line}</Text>
                  </View>
                  <Icon name={isOpen ? 'minus' : 'plus'} size={16} color={colors.textFaint} />
                </View>
                {isOpen ? (
                  <Animated.View entering={FadeInDown.duration(240)}>
                    {t.steps.map((s, j) => (
                      <View key={j} style={styles.step}>
                        <Text style={[styles.num, { color: t.color }]}>{j + 1}</Text>
                        <Text style={styles.stepText}>{s}</Text>
                      </View>
                    ))}
                    <Text style={styles.why}>{t.why}</Text>
                    {upcoming.length ? (
                      <View style={styles.tonight}>
                        <Text style={styles.tonightLabel}>Try it tonight on</Text>
                        <ChipRow>
                          {upcoming.map((a) => {
                            const added = a.subtasks?.some((s) => s.text.endsWith(`(${t.name.toLowerCase()})`));
                            return (
                              <Chip
                                key={a.id}
                                label={a.title}
                                dot
                                color={classes.find((c) => c.id === a.classId)?.color ?? t.color}
                                icon={added ? 'check' : undefined}
                                selected={added}
                                onPress={() => tryOn(t, a.id)}
                              />
                            );
                          })}
                        </ChipRow>
                      </View>
                    ) : null}
                    {t.action ? (
                      <Button label={t.action.label} variant="secondary" size="sm" icon="arrow" tint={t.color} onPress={() => router.push(t.action!.href as never)} style={styles.action} />
                    ) : null}
                  </Animated.View>
                ) : null}
              </Card>
            </Animated.View>
          </Reveal>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  line: {
    marginTop: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  step: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  num: {
    width: 16,
    fontFamily: fonts.display,
    fontVariant: ['tabular-nums'],
    fontSize: 16,
  },
  stepText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },
  why: {
    marginTop: 14,
    fontFamily: fonts.displaySoft,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  tonight: {
    marginTop: 14,
    gap: 8,
  },
  tonightLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.textMuted,
  },
  action: {
    marginTop: 14,
    alignSelf: 'flex-start',
  },
});
