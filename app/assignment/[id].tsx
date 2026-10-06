import * as Haptics from '../../core/haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { AIPicker } from '../../components/ember/AIPicker';
import { emberSay } from '../../components/ember/EmberBuddy';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip, ChipRow } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field } from '../../components/ui/Field';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/IconButton';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Pressy } from '../../components/ui/Pressy';
import { Reveal } from '../../components/ui/Reveal';
import { ScienceNote } from '../../components/ui/ScienceNote';
import { Screen } from '../../components/ui/Screen';
import { Section } from '../../components/ui/Section';
import { goBack } from '../../core/chrome';
import { cheerLine } from '../../core/about';
import { addDays, dateKey, daysUntil, dueLabel, dueWords, KIND_LABEL, planBackward, spreadSteps, type AssignmentKind, type Subtask, uid, useSchoolStore } from '../../core/schoolStore';
import { alpha, colors, fonts, radii } from '../../core/theme';
import { helperById, type HelperId } from '../../core/helpers';
import { useLifeStore } from '../../core/lifeStore';
import { celebrate } from '../../core/celebrateStore';
import { askJob } from '../../core/emberAI';
import { offerUndo } from '../../core/undoStore';
import { plural } from '../../core/words';

// The model sometimes labels steps with days ("Fri: Do 10 problems"); the app
// picks the days itself, so those labels come off.
const DAY_PREFIX = /^(?:(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?|today|tonight|tomorrow|day \d+)(?:\s+(?:morning|afternoon|evening|night))?\s*[:–—-]\s*/i;

// A polite, specific note to a teacher. The student reads it, edits it,
// and sends it themselves.
function extensionNote(title: string, teacher: string, due: string) {
  const who = teacher ? teacher : 'there';
  return `Hi ${who},

I wanted to reach out before ${title} is due (${due}). I’m behind on it and I want to turn in work I’m proud of rather than rush it. Would it be possible to have an extra day or two? I can show you what I have so far.

Thank you for understanding.`;
}

// Kinds that get handed in, so "done" and "turned in" can differ.
const TURN_IN = new Set<AssignmentKind>(['homework', 'project', 'essay']);

export default function AssignmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const a = useSchoolStore((s) => s.assignments.find((x) => x.id === id));
  const cls = useSchoolStore((s) => s.classes.find((c) => c.id === a?.classId));
  // Select the whole list and filter here — a filtered array is a new
  // object every time, which would make the store re-render forever.
  const allFocus = useSchoolStore((s) => s.focus);
  const focus = allFocus.filter((f) => f.assignmentId === id);
  const toggle = useSchoolStore((s) => s.toggleAssignment);
  const remove = useSchoolStore((s) => s.deleteAssignment);
  const update = useSchoolStore((s) => s.updateAssignment);
  const [step, setStep] = useState('');
  const lastHelperId = useLifeStore((s) => (id ? s.helperUse[id] : undefined));
  const lastHelper = helperById(lastHelperId);

  if (!a) {
    return (
      <Screen nav={false}>
        <EmptyState title="This one’s gone." body="It may have been deleted." />
      </Screen>
    );
  }

  const color = cls?.color ?? colors.flame;
  const n = daysUntil(a.due);
  const studied = focus.reduce((s, f) => s + f.minutes, 0);
  const isTest = a.kind === 'test' || a.kind === 'quiz';
  const [y, m, d] = a.due.split('-').map(Number);
  const dateText = new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const subtasks = a.subtasks ?? [];
  const stepsDone = subtasks.filter((t) => t.done).length;
  // AI study sessions for a test or quiz a few days off get a day each.
  const spreadOut = (a.kind === 'test' || a.kind === 'quiz') && daysUntil(a.due) >= 2;

  const setSubtasks = (next: Subtask[]) => update(a.id, { subtasks: next });
  const addStep = () => {
    const t = step.trim();
    if (!t) return;
    setSubtasks([...subtasks, { id: uid(), text: t, done: false }]);
    setStep('');
  };
  const toggleStep = (sid: string) => {
    const next = subtasks.map((t) => (t.id === sid ? { ...t, done: !t.done } : t));
    setSubtasks(next);
    const finishing = !subtasks.find((t) => t.id === sid)?.done;
    Haptics.impactAsync(finishing ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (finishing && next.length > 1 && next.every((t) => t.done)) {
      emberSay(cheerLine('Every step done. The big thing turned out to be a bunch of small things.'), 'cheer');
      if (next.length >= 3) celebrate('Every step, done', `${a.title}: ${next.length} small steps added up to the whole thing.`, undefined, { key: `steps-${a.id}`, win: `Finished every step of ${a.title}` });
    }
  };
  const planIt = () => {
    const plan = planBackward(a);
    setSubtasks([...subtasks.filter((t) => t.done), ...plan]);
    const numDays = new Set(plan.map((p) => p.on)).size;
    emberSay(`Spread across ${plural(numDays, 'day')}. Just today's step, today.`, 'happy');
  };
  const move = (to: string) => {
    update(a.id, { due: to });
    Haptics.selectionAsync().catch(() => {});
    emberSay(`Moved to ${dueLabel(to).toLowerCase() === 'tomorrow' ? 'tomorrow' : dueLabel(to)}. Make sure your teacher’s okay with it.`, 'happy');
  };

  return (
    <Screen
      nav={false}
      barTitle={a.title}
      glowColor={color}
      right={
        <View style={styles.headerBtns}>
          <IconButton
            icon="star"
            label={a.starred ? 'Unstar' : 'Star as a priority'}
            tint={a.starred ? colors.flame : undefined}
            onPress={() => {
              update(a.id, { starred: !a.starred });
              Haptics.selectionAsync().catch(() => {});
            }}
          />
          <IconButton icon="edit" label="Edit" onPress={() => router.push({ pathname: '/add-assignment', params: { id: a.id } })} />
        </View>
      }
    >
      <Reveal index={0}>
        <View style={styles.head}>
          <View style={[styles.kind, { backgroundColor: alpha(color, 0.16), borderColor: alpha(color, 0.4) }]}>
            <Text style={[styles.kindText, { color }]}>
              {KIND_LABEL[a.kind]}
              {cls ? `, ${cls.name}` : ''}
            </Text>
          </View>
          <Text style={[styles.title, a.done && styles.done]}>{a.title}</Text>
          <Text style={[styles.due, !a.done && n < 0 && { color: colors.danger }, !a.done && n <= 1 && n >= 0 && { color: colors.flame }]}>
            {a.done
              ? !TURN_IN.has(a.kind)
                ? 'Done'
                : a.turnedIn
                  ? 'Done and turned in'
                  : 'Done, not turned in yet'
              : n === 0 || n === 1
                ? `Due ${dueWords(a.due)}, ${dateText}`
                : n < 0
                  ? `Was due ${dateText} (${dueWords(a.due)})`
                  : `Due ${dateText}`}
          </Text>
        </View>
      </Reveal>

      <Reveal index={1} style={styles.stats}>
        <Card style={styles.stat}>
          <Icon name="clock" size={18} color={colors.textMuted} />
          <Text style={styles.statValue}>{a.minutes ? (a.minutes >= 60 ? `${+(a.minutes / 60).toFixed(1)} h` : `${a.minutes} min`) : '–'}</Text>
          <Text style={styles.statLabel}>Estimated</Text>
        </Card>
        <Card style={styles.stat}>
          <Icon name="timer" size={18} color={colors.textMuted} />
          <Text style={styles.statValue}>{studied ? `${studied} min` : '–'}</Text>
          <Text style={styles.statLabel}>Focused on it</Text>
        </Card>
      </Reveal>
      {a.minutes && studied && !a.done ? (
        <Reveal index={1}>
          <View style={styles.spent}>
            <ProgressBar value={Math.min(1, studied / a.minutes)} color={studied > a.minutes * 1.25 ? colors.unlocked : colors.secured} height={5} />
            <Text style={styles.spentText}>
              {studied >= a.minutes
                ? studied > a.minutes * 1.25
                  ? `${studied - a.minutes} minutes past the estimate. Next time, guess higher for this kind.`
                  : 'Right at your estimate. Nice read on it.'
                : `${a.minutes - studied} minutes left of your estimate.`}
            </Text>
          </View>
        </Reveal>
      ) : null}

      {a.notes ? (
        <Reveal index={1}>
          <Card style={styles.notes}>
            <Text style={styles.notesText}>{a.notes}</Text>
          </Card>
        </Reveal>
      ) : null}

      {/* Done with no steps: nothing to show or add, so no empty box. */}
      {!a.done || subtasks.length ? (
        <Reveal index={2}>
          <Section
            title="Steps"
            note={subtasks.length ? `${stepsDone} of ${subtasks.length} done` : 'Big things go better in small pieces.'}
            action={!a.done ? { label: subtasks.some((t) => t.on) ? 'Re-plan' : 'Plan it backward', onPress: planIt } : undefined}
          >
            <Card>
              {subtasks.length ? <ProgressBar value={stepsDone / subtasks.length} color={colors.secured} style={styles.stepBar} /> : null}
              {subtasks.map((t) => (
                <Animated.View key={t.id} entering={FadeInDown.duration(220)} exiting={FadeOut.duration(150)} layout={LinearTransition} style={styles.step}>
                  <Pressy
                    onPress={() => toggleStep(t.id)}
                    haptic="none"
                    depth={0.85}
                    hitSlop={6}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: t.done }}
                    accessibilityLabel={t.text}
                    style={[styles.stepCheck, t.done && { backgroundColor: colors.secured, borderColor: colors.secured }]}
                  >
                    {t.done ? <Icon name="check" size={13} color={colors.flameInk} strokeWidth={3} /> : null}
                  </Pressy>
                  <View style={styles.flex}>
                    <Text style={[styles.stepText, t.done && styles.done]}>{t.text}</Text>
                    {t.on ? (
                      <Text style={[styles.stepOn, !a.done && !t.done && t.on < dateKey() && { color: colors.danger }, !a.done && !t.done && t.on === dateKey() && { color: colors.flame }]}>
                        {dueLabel(t.on)}
                      </Text>
                    ) : null}
                  </View>
                  <Pressy onPress={() => setSubtasks(subtasks.filter((x) => x.id !== t.id))} hitSlop={10} accessibilityLabel={`Remove step ${t.text}`}>
                    <Icon name="close" size={15} color={colors.textFaint} />
                  </Pressy>
                </Animated.View>
              ))}
              {!a.done ? (
                <View style={styles.addStep}>
                  <Field value={step} onChangeText={setStep} placeholder="Add a step" returnKeyType="done" onSubmitEditing={addStep} containerStyle={styles.flex} />
                  <IconButton icon="plus" label="Add step" onPress={addStep} tint={colors.flame} />
                </View>
              ) : null}
              {!a.done ? (
                <AIPicker
                  label="Break it into steps"
                  sends="Sends this assignment’s title, class, due date, time estimate, and notes to Claude."
                  watch={[a.title, a.notes ?? '', ...subtasks.map((t) => t.text)].join('\n')}
                  color={color}
                  load={async () => {
                    const input = [
                      `${KIND_LABEL[a.kind]}: ${a.title}${cls ? ` (${cls.name})` : ''}, due ${dueLabel(a.due)} (${a.due})${a.minutes ? `, about ${a.minutes} minutes` : ''}`,
                      subtasks.length ? `Steps they already have: ${subtasks.map((t) => t.text).join('; ')}` : '',
                      a.notes ? `Their notes: ${a.notes.slice(0, 1500)}` : '',
                    ]
                      .filter(Boolean)
                      .join('\n');
                    const res = await askJob<{ steps: { title: string; minutes: number }[] }>('steps', input, { who: 'steps' });
                    if (!res.ok) return res;
                    return { ok: true, items: res.data.steps.map((st) => ({ title: st.title, detail: `About ${st.minutes} min` })) };
                  }}
                  addLabel={(k) => {
                    const days = spreadOut ? new Set(spreadSteps(Array<string>(k).fill(''), a.due).map((t) => t.on)).size : 1;
                    return `Add ${k === 1 ? '1 step' : `${k} steps`}${days > 1 ? ` over ${days} days` : ''}`;
                  }}
                  onAdd={(picked) => {
                    const before = subtasks;
                    const texts = picked.map((p) => `${p.title.replace(DAY_PREFIX, '')}${p.detail ? ` (${p.detail.replace('About ', '')})` : ''}`);
                    const added: Subtask[] = spreadOut ? spreadSteps(texts, a.due) : texts.map((text) => ({ id: uid(), text, done: false }));
                    setSubtasks([...subtasks, ...added]);
                    offerUndo(`Added ${picked.length} step${picked.length === 1 ? '' : 's'}`, () => update(a.id, { subtasks: before }), 'list');
                    if (spreadOut) emberSay(`Spread across ${new Set(added.map((t) => t.on)).size} days. Just today’s step, today.`, 'happy');
                  }}
                />
              ) : null}
            </Card>
          </Section>
        </Reveal>
      ) : null}

      {a.done && TURN_IN.has(a.kind) ? (
        <Reveal index={3}>
          <ChipRow style={styles.turnIn}>
            <Chip
              label={a.turnedIn ? 'Turned in' : 'Mark turned in'}
              icon="check"
              selected={!!a.turnedIn}
              onPress={() => update(a.id, { turnedIn: !a.turnedIn })}
            />
          </ChipRow>
        </Reveal>
      ) : null}

      {!a.done ? (
        <Reveal index={3}>
          <Section title="Move it">
            <ChipRow>
              <Chip label="Tomorrow" icon="arrow" onPress={() => move(addDays(dateKey(), 1))} />
              <Chip label="+1 day" onPress={() => move(addDays(a.due, 1))} />
              <Chip label="+1 week" onPress={() => move(addDays(a.due, 7))} />
              <Chip
                label={a.repeat === 'weekly' ? 'Repeats weekly' : 'Repeat weekly'}
                icon="repeat"
                selected={a.repeat === 'weekly'}
                onPress={() => update(a.id, { repeat: a.repeat === 'weekly' ? null : 'weekly' })}
              />
            </ChipRow>
            <Pressy onPress={() => Share.share({ message: extensionNote(a.title, cls?.teacher ?? '', dueLabel(a.due)) })} style={styles.ask} accessibilityRole="button">
              <Icon name="message" size={18} color={colors.flame} />
              <View style={styles.flex}>
                <Text style={styles.askTitle}>Ask for more time</Text>
                <Text style={styles.askBody}>Drafts a polite note to {cls?.teacher || 'your teacher'}. You read it and send it.</Text>
              </View>
              <Icon name="chevron" size={16} color={colors.textFaint} />
            </Pressy>
          </Section>
        </Reveal>
      ) : null}

      {!a.done ? (
        <Reveal index={3}>
          <Section
            title="Get a helper"
            note={lastHelper ? `Last time: ${lastHelper.name}.` : 'They already know what this is.'}
          >
            <View style={styles.helpers}>
              {(a.kind === 'test' || a.kind === 'quiz'
                ? (['quizzo', 'sage', 'pip', 'spark'] as HelperId[])
                : a.kind === 'essay'
                  ? (['quill', 'spark', 'pip', 'sage'] as HelperId[])
                  : (['pip', 'spark', 'sage', 'quizzo'] as HelperId[])
              ).map((hid) => {
                const h = helperById(hid)!;
                return (
                  <Pressy
                    key={hid}
                    onPress={() => router.push({ pathname: '/helper/[id]', params: { id: hid, about: a.id } })}
                    style={[styles.helper, { borderColor: alpha(h.color, 0.4), backgroundColor: alpha(h.color, 0.08) }]}
                    accessibilityRole="button"
                    accessibilityLabel={`${h.name}, ${h.role}`}
                  >
                    <Icon name={h.icon} size={18} color={h.color} />
                    <Text style={styles.helperName}>{h.name}</Text>
                    <Text style={styles.helperRole}>{h.role}</Text>
                  </Pressy>
                );
              })}
            </View>
          </Section>
        </Reveal>
      ) : null}

      {isTest && !a.done ? (
        <Reveal index={4}>
          <Card tint={color} style={styles.notes}>
            <Text style={styles.tipTitle}>How to study for this</Text>
            <Text style={styles.tip}>
              {n >= 3
                ? 'Spread it out: three short sessions on different days beat one long one the night before.'
                : n >= 1
                  ? 'Test yourself instead of rereading — flashcards, practice problems, explaining it out loud.'
                  : 'Sleep is part of studying. What you learned today gets locked in tonight.'}
            </Text>
            <ScienceNote fact="Spaced practice and retrieval practice (quizzing yourself) are two of the most reliably effective study techniques in learning research — they beat rereading and highlighting, even though rereading feels more productive." />
          </Card>
        </Reveal>
      ) : null}

      <Reveal index={5} style={styles.actions}>
        {!a.done ? (
          <Button
            label="Focus on this"
            icon="timer"
            onPress={() => router.push({ pathname: '/focus', params: { assignment: a.id } })}
          />
        ) : null}
        <Button
          label={a.done ? 'Mark not done' : 'Mark done'}
          icon={a.done ? 'repeat' : 'check'}
          variant="secondary"
          tint={a.done ? undefined : colors.secured}
          onPress={() => {
            const finishing = !a.done;
            toggle(a.id);
            if (finishing) {
              goBack();
              emberSay(cheerLine(isTest ? 'Test’s behind you. However it went, it’s done.' : 'Done. One less thing.'), 'cheer');
            }
          }}
        />
        <View style={styles.smallRow}>
          <Button
            label="Another like this"
            icon="plus"
            variant="ghost"
            size="sm"
            onPress={() => router.push({ pathname: '/add-assignment', params: { like: a.id } })}
          />
          <Button
            label="Duplicate"
            icon="layers"
            variant="ghost"
            size="sm"
            onPress={() => {
              const copy = useSchoolStore.getState().duplicateAssignment(a.id);
              if (copy) router.replace(`/assignment/${copy.id}`);
            }}
          />
          <Button
            label="Delete"
            icon="trash"
            variant="ghost"
            size="sm"
            tint={colors.danger}
            onPress={() => {
              const snapshot = a;
              remove(a.id);
              offerUndo(`Deleted “${snapshot.title}”`, () => useSchoolStore.getState().restoreAssignment(snapshot));
              goBack();
            }}
          />
        </View>
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  spent: {
    marginTop: 10,
    gap: 6,
  },
  spentText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  head: {
    marginTop: 14,
  },
  kind: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
  },
  kindText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
  },
  title: {
    marginTop: 12,
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    color: colors.text,
  },
  done: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
  due: {
    marginTop: 6,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textMuted,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  turnIn: {
    marginTop: 20,
  },
  stat: {
    flex: 1,
    width: undefined,
    gap: 4,
  },
  statValue: {
    marginTop: 4,
    fontFamily: fonts.display,
    fontVariant: ['tabular-nums'],
    fontSize: 20,
    color: colors.text,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  notes: {
    marginTop: 12,
  },
  notesText: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  tipTitle: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.text,
  },
  tip: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  actions: {
    marginTop: 24,
    gap: 10,
  },
  helpers: {
    flexDirection: 'row',
    gap: 8,
  },
  helper: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  helperName: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.text,
  },
  helperRole: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
  },
  smallRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  headerBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  flex: {
    flex: 1,
  },
  stepBar: {
    marginBottom: 10,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  stepCheck: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
  },
  stepOn: {
    marginTop: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  addStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  ask: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: alpha(colors.flame, 0.3),
    backgroundColor: alpha(colors.flame, 0.06),
  },
  askTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  askBody: {
    marginTop: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
});
