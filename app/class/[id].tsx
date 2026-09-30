import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AssignmentRow } from '../../components/school/AssignmentRow';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Icon } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/IconButton';
import { Reveal } from '../../components/ui/Reveal';
import { Screen } from '../../components/ui/Screen';
import { Section } from '../../components/ui/Section';
import { Sparkline } from '../../components/ui/Sparkline';
import { useHubStore } from '../../core/hubStore';
import { deckStats, dueCards, useLifeStore } from '../../core/lifeStore';
import { classAverage, clock, letterFor, useSchoolStore } from '../../core/schoolStore';
import { alpha, colors, fonts } from '../../core/theme';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const LEVEL: Record<string, string> = { regular: '', honors: 'Honors', ap: 'AP / IB' };

// One class, everything about it: when and where, what's due, how it's
// going, and the notes and flashcards that belong to it.
export default function ClassScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cls = useSchoolStore((s) => s.classes.find((c) => c.id === id));
  const assignments = useSchoolStore((s) => s.assignments);
  const grades = useSchoolStore((s) => s.grades);
  const notes = useHubStore((s) => s.notes);
  const decks = useLifeStore((s) => s.decks);

  if (!cls) {
    return (
      <Screen>
        <EmptyState title="This class is gone." body="It may have been removed from your schedule." />
      </Screen>
    );
  }

  const open = assignments.filter((a) => a.classId === cls.id && !a.done).sort((a, b) => a.due.localeCompare(b.due));
  const doneCount = assignments.filter((a) => a.classId === cls.id && a.done).length;
  const mine = grades.filter((g) => g.classId === cls.id).sort((a, b) => a.date.localeCompare(b.date));
  const avg = classAverage(grades, cls);
  // Running average after each grade, for the trend line.
  const trend = mine.map((_, i) => classAverage(mine.slice(0, i + 1), cls) ?? 0);
  const myNotes = notes.filter((n) => n.classId === cls.id);
  const myDecks = decks.filter((d) => d.classId === cls.id);
  const dayText =
    cls.days.join() === '1,2,3,4,5' ? 'Weekdays' : cls.days.length === 7 ? 'Every day' : cls.days.map((d) => DAY_NAMES[d - 1]).join(', ');
  const when = cls.days.length ? `${dayText} · ${clock(cls.start)} – ${clock(cls.end)}` : 'No days or times yet';

  let n = 0;
  return (
    <Screen
      glowColor={cls.color}
      kicker={[LEVEL[cls.level ?? 'regular'], cls.kind === 'activity' ? 'Activity' : ''].filter(Boolean).join(' · ') || undefined}
      title={cls.name}
      subtitle={[cls.teacher, cls.room ? `Room ${cls.room}` : ''].filter(Boolean).join(' · ') || undefined}
      right={<IconButton icon="edit" label="Edit class" onPress={() => router.push({ pathname: '/class-edit', params: { id: cls.id } })} />}
    >
      <Reveal index={n++}>
        <Card tint={cls.color} style={styles.when}>
          <Icon name="clock" size={18} color={cls.color} />
          <Text style={styles.whenText}>{when}</Text>
        </Card>
      </Reveal>

      <Reveal index={n++}>
        <Section
          title="Due"
          note={open.length ? `${open.length} open, ${doneCount} done` : doneCount ? `All ${doneCount} done` : undefined}
          action={{ label: 'Add', onPress: () => router.push({ pathname: '/add-assignment', params: { classId: cls.id } }) }}
        >
          {open.length ? (
            <View style={styles.list}>
              {open.map((a, i) => (
                <AssignmentRow key={a.id} a={a} index={i} />
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>Nothing due for this class.</Text>
          )}
        </Section>
      </Reveal>

      {cls.kind === 'class' ? (
        <Reveal index={n++}>
          <Section title="Grade" action={{ label: mine.length ? 'All grades' : 'Log a grade', onPress: () => router.push({ pathname: '/grades', params: { classId: cls.id } }) }}>
            <Card onPress={() => router.push({ pathname: '/grades', params: { classId: cls.id } })}>
              {avg == null ? (
                <View style={styles.gradeEmpty}>
                  <Icon name="grade" size={22} color={colors.textFaint} />
                  <Text style={styles.empty}>No grades yet. Log one to see your average.</Text>
                </View>
              ) : (
                <View style={styles.gradeRow}>
                  <View style={[styles.letter, { backgroundColor: alpha(cls.color, 0.16), borderColor: alpha(cls.color, 0.5) }]}>
                    <Text style={[styles.letterText, { color: cls.color }]}>{letterFor(avg)}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.pct}>{avg.toFixed(1)}%</Text>
                    <Text style={styles.sub}>
                      {mine.length} grade{mine.length === 1 ? '' : 's'}
                      {Object.keys(cls.weights ?? {}).length ? ', weighted' : ''}
                    </Text>
                  </View>
                  {trend.length > 1 ? <Sparkline values={trend} color={cls.color} width={96} height={36} /> : null}
                </View>
              )}
            </Card>
          </Section>
        </Reveal>
      ) : null}

      <Reveal index={n++}>
        <Section title="Notes" action={{ label: 'New', onPress: () => router.push({ pathname: '/notes', params: { classId: cls.id } }) }}>
          {myNotes.length ? (
            <View style={styles.list}>
              {myNotes.map((note) => (
                <Card key={note.id} onPress={() => router.push(`/note/${note.id}`)} style={styles.row}>
                  <Icon name="pen" size={18} color={note.color} />
                  <Text style={styles.rowText} numberOfLines={1}>
                    {note.title || 'Untitled'}
                  </Text>
                  <Icon name="chevron" size={16} color={colors.textFaint} />
                </Card>
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>No notes for this class yet.</Text>
          )}
        </Section>
      </Reveal>

      <Reveal index={n++}>
        <Section title="Flashcards" action={{ label: 'New deck', onPress: () => router.push({ pathname: '/flashcards', params: { classId: cls.id, create: '1' } }) }}>
          {myDecks.length ? (
            <View style={styles.list}>
              {myDecks.map((d) => {
                const st = deckStats(d);
                const due = dueCards(d).length;
                return (
                  <Card key={d.id} onPress={() => router.push(`/deck/${d.id}`)} style={styles.row}>
                    <Icon name="cards" size={18} color={d.color} />
                    <View style={styles.flex}>
                      <Text style={styles.rowText} numberOfLines={1}>
                        {d.name}
                      </Text>
                      <Text style={styles.sub}>
                        {st.total} cards · {st.mastered} mastered{due ? ` · ${due} to study` : ''}
                      </Text>
                    </View>
                    <Icon name="chevron" size={16} color={colors.textFaint} />
                  </Card>
                );
              })}
            </View>
          ) : (
            <Text style={styles.empty}>No decks for this class yet.</Text>
          )}
        </Section>
      </Reveal>

      <Reveal index={n++}>
        <Button
          label="Focus on this class"
          icon="timer"
          variant="secondary"
          onPress={() => router.push({ pathname: '/focus', params: open[0] ? { assignment: open[0].id } : {} })}
          style={styles.focus}
        />
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  when: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  whenText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
  },
  list: {
    gap: 10,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textFaint,
  },
  gradeEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  letter: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    fontFamily: fonts.display,
    fontSize: 26,
  },
  pct: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.text,
  },
  sub: {
    marginTop: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  rowText: {
    flex: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  focus: {
    marginTop: 28,
  },
});
