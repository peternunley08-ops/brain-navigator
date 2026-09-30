import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { emberSay } from '../../components/ember/EmberBuddy';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/IconButton';
import { Reveal } from '../../components/ui/Reveal';
import { ScienceNote } from '../../components/ui/ScienceNote';
import { Screen } from '../../components/ui/Screen';
import { daysUntil, dueLabel, KIND_LABEL, useSchoolStore } from '../../core/schoolStore';
import { alpha, colors, fonts } from '../../core/theme';

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

  return (
    <Screen
      nav={false}
      glowColor={color}
      right={<IconButton icon="edit" label="Edit" onPress={() => router.push({ pathname: '/add-assignment', params: { id: a.id } })} />}
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
            {a.done ? 'Done' : `Due ${dueLabel(a.due).toLowerCase() === 'today' || dueLabel(a.due).toLowerCase() === 'tomorrow' ? dueLabel(a.due).toLowerCase() : dueLabel(a.due)}`}
            {!a.done ? `, ${dateText}` : ''}
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

      {a.notes ? (
        <Reveal index={2}>
          <Card style={styles.notes}>
            <Text style={styles.notesText}>{a.notes}</Text>
          </Card>
        </Reveal>
      ) : null}

      {isTest && !a.done ? (
        <Reveal index={3}>
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

      <Reveal index={4} style={styles.actions}>
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
              router.back();
              emberSay(isTest ? 'Test’s behind you. However it went, it’s done.' : 'Done. One less thing.', 'cheer');
            }
          }}
        />
        <Button
          label="Delete"
          icon="trash"
          variant="ghost"
          size="sm"
          tint={colors.danger}
          onPress={() => {
            remove(a.id);
            router.back();
          }}
          style={styles.delete}
        />
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  stat: {
    flex: 1,
    width: undefined,
    gap: 4,
  },
  statValue: {
    marginTop: 4,
    fontFamily: fonts.display,
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
  delete: {
    alignSelf: 'center',
  },
});
