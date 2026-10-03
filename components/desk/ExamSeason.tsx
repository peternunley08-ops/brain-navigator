import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui/Card';
import { IconButton } from '../ui/IconButton';
import { Pressy } from '../ui/Pressy';
import { Ring } from '../ui/Ring';
import { daysUntil } from '../../core/dates';
import { useClosedToday } from './DayCards';
import { useSchoolStore } from '../../core/schoolStore';
import { alpha, colors, fonts } from '../../core/theme';
import { plural } from '../../core/words';

const ID = 'ExamSeason';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function inWords(key: string) {
  const n = daysUntil(key);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  const [y, m, d] = key.split('-').map(Number);
  return `${DAYS[new Date(y, m - 1, d).getDay()]}, ${MONTHS[m - 1]} ${d}`;
}

// Three or more tests and exams in the next week: a calm card that leads the
// Desk. Quizzes are left out (KIND_LABEL keeps them separate); closes for today.
export function ExamSeason() {
  const assignments = useSchoolStore((s) => s.assignments);
  const classes = useSchoolStore((s) => s.classes);
  const [hidden, close] = useClosedToday(ID);
  const tests = useMemo(
    () =>
      assignments
        .filter((a) => !a.done && a.kind === 'test' && daysUntil(a.due) >= 0 && daysUntil(a.due) <= 7)
        .sort((a, b) => a.due.localeCompare(b.due)),
    [assignments],
  );
  if (hidden || tests.length < 3) return null;

  const first = tests[0];
  const step = first.subtasks?.find((t) => !t.done);
  const hint = step ? `Next step for ${first.title}: ${step.text}` : `Plan backward from ${first.title}`;

  return (
    <Card tint={colors.flame} style={styles.card}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <Text accessibilityRole="header" style={styles.title}>Exam season</Text>
          <Text style={styles.sub}>{plural(tests.length, 'test')} in the next week. One at a time.</Text>
        </View>
        <IconButton icon="close" label="Hide for today" size={30} onPress={close} />
      </View>
      {tests.map((a) => {
        const cls = classes.find((c) => c.id === a.classId);
        const subs = a.subtasks ?? [];
        const done = subs.filter((t) => t.done).length;
        const d = daysUntil(a.due);
        const progress = subs.length ? done / subs.length : (7 - d) / 7;
        const color = cls?.color ?? colors.flame;
        return (
          <Pressy key={a.id} onPress={() => router.push(`/assignment/${a.id}`)} accessibilityRole="button" accessibilityLabel={`${a.title}, ${inWords(a.due)}`}>
            <View style={styles.row}>
              <Ring
                progress={progress}
                size={44}
                stroke={5}
                color={color}
                value={subs.length ? `${done}/${subs.length}` : String(d)}
              />
              <View style={styles.flex}>
                <Text style={styles.name} numberOfLines={1}>{a.title}</Text>
                <Text style={styles.meta} numberOfLines={1}>{cls ? `${cls.name}. ` : ''}{inWords(a.due)}</Text>
              </View>
            </View>
          </Pressy>
        );
      })}
      <Pressy onPress={() => router.push(`/assignment/${first.id}`)} accessibilityRole="button">
        <Text style={styles.hint}>{hint}</Text>
      </Pressy>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, backgroundColor: alpha(colors.flame, 0.06) },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  name: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.text },
  meta: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, marginTop: 1 },
  hint: { fontFamily: fonts.displaySoft, fontSize: 15, lineHeight: 21, color: colors.textMuted },
});
