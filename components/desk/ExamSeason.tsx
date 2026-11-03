import * as Haptics from '../../core/haptics';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';
import { Pressy } from '../ui/Pressy';
import { Ring } from '../ui/Ring';
import { addDays, dateKey, daysUntil } from '../../core/dates';
import { useClosedToday } from './DayCards';
import { useLifeStore } from '../../core/lifeStore';
import { useSchoolStore } from '../../core/schoolStore';
import { alpha, colors, fonts, radii, textGrow } from '../../core/theme';
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

type Assignments = ReturnType<typeof useSchoolStore.getState>['assignments'];

/** Tests in the next week, soonest first, when there are three or more (and it isn't closed today). */
export function whenExamSeason(assignments: Assignments, hidden: boolean) {
  if (hidden) return null;
  const tests = assignments
    .filter((a) => !a.done && a.kind === 'test' && daysUntil(a.due) >= 0 && daysUntil(a.due) <= 7)
    .sort((a, b) => a.due.localeCompare(b.due));
  return tests.length >= 3 ? tests : null;
}

// Three or more tests and exams in the next week: a calm card that leads the
// Desk. Quizzes are left out (KIND_LABEL keeps them separate); closes for today.
export function ExamSeason() {
  const assignments = useSchoolStore((s) => s.assignments);
  const classes = useSchoolStore((s) => s.classes);
  const examFocus = useLifeStore((s) => Boolean(s.settings.examFocus));
  const [hidden, close] = useClosedToday(ID);
  const found = useMemo(() => whenExamSeason(assignments, hidden), [assignments, hidden]);
  if (!found) return null;
  const tests = found;

  const first = tests[0];
  const step = first.subtasks?.find((t) => !t.done);
  const hint = step ? `Next step for ${first.title}: ${step.text}` : `Plan backward from ${first.title}`;
  const today = dateKey();

  const schedule = tests.map((a) => {
    const nextSub = a.subtasks?.find((t) => !t.done);
    const d = daysUntil(a.due);
    const studyDay = nextSub?.on && nextSub.on >= today ? nextSub.on : addDays(today, Math.max(0, Math.min(d - 1, 2)));
    const task = nextSub
      ? nextSub.text
      : d <= 0
        ? 'Quick final review'
        : d === 1
          ? 'Practice problems and weak spots'
          : d <= 3
            ? 'Quiz yourself from notes'
            : 'Read notes and pull key terms';
    return { id: a.id, title: a.title, dayLabel: inWords(studyDay), task };
  });

  const toggleFocus = () => {
    Haptics.selectionAsync().catch(() => {});
    useLifeStore.getState().setSettings({ examFocus: !examFocus });
  };

  return (
    <Card tint={colors.flame} style={styles.card}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <Text accessibilityRole="header" style={styles.title} maxFontSizeMultiplier={textGrow.heading}>Exam season</Text>
          <Text style={styles.sub} maxFontSizeMultiplier={2}>{plural(tests.length, 'test')} in the next week. One at a time.</Text>
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
                <Text style={styles.name} numberOfLines={1} maxFontSizeMultiplier={2}>{a.title}</Text>
                <Text style={styles.meta} numberOfLines={1} maxFontSizeMultiplier={2}>{cls ? `${cls.name}. ` : ''}{inWords(a.due)}</Text>
              </View>
            </View>
          </Pressy>
        );
      })}
      {examFocus ? (
        <View style={styles.planWrap}>
          <Text style={styles.planHead} maxFontSizeMultiplier={2}>This week’s study steps</Text>
          {schedule.map((s) => (
            <Pressy
              key={s.id}
              onPress={() => router.push({ pathname: '/focus', params: { assignment: s.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${s.dayLabel}: ${s.task} for ${s.title}. Light a candle.`}
              style={styles.planRow}
            >
              <View style={styles.flex}>
                <Text style={styles.planDay} maxFontSizeMultiplier={2}>{s.dayLabel} — {s.title}</Text>
                <Text style={styles.planTask} maxFontSizeMultiplier={2}>{s.task}</Text>
              </View>
              <View style={styles.studyPill}>
                <Icon name="candle" size={14} color={colors.flame} />
                <Text style={styles.studyText} maxFontSizeMultiplier={textGrow.control}>Study</Text>
              </View>
            </Pressy>
          ))}
        </View>
      ) : (
        <Pressy onPress={() => router.push(`/assignment/${first.id}`)} accessibilityRole="button">
          <Text style={styles.hint} maxFontSizeMultiplier={2}>{hint}</Text>
        </Pressy>
      )}
      <Button
        label={examFocus ? 'Show full desk' : 'Study plan for this week'}
        icon={examFocus ? 'sparkle' : 'calendar'}
        variant="secondary"
        size="sm"
        onPress={toggleFocus}
        style={styles.focusBtn}
      />
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
  planWrap: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    gap: 8,
  },
  planHead: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.textMuted,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  planDay: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.text,
  },
  planTask: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 1,
  },
  studyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: alpha(colors.flame, 0.14),
  },
  studyText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.flame,
  },
  focusBtn: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
});
