import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { dateKey } from '../../core/dates';
import { closedToday } from '../../core/deskNotes';
import { dueLine, pickLit, urgentTonight, type LitKind } from '../../core/litCard';
import { useLifeStore } from '../../core/lifeStore';
import { minutesOf, minutesToNight, nightNow, nightStart } from '../../core/night';
import { nowState, useSchoolStore } from '../../core/schoolStore';
import { alpha, colors, fonts, textGrow } from '../../core/theme';
import { plural } from '../../core/words';
import { Sparks } from '../ember/Sparks';
import { NowCard } from '../school/NowCard';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { DayBrief, whenDayBrief } from './DayCards';
import { ExamSeason, whenExamSeason } from './ExamSeason';
import { OneThing } from './OneThing';

/**
 * Which card the Desk lights right now (see LIT_ORDER in core/litCard.ts).
 * `allClear` and `windDownSoon` come from the Desk, which already works them out.
 */
export function useLitKind({ allClear, windDownSoon, deskHidden }: { allClear: boolean; windDownSoon: boolean; deskHidden: string[] }): LitKind | null {
  const classes = useSchoolStore((s) => s.classes);
  const assignments = useSchoolStore((s) => s.assignments);
  const oneThing = useLifeStore((s) => s.oneThing);
  const oneThingDone = useLifeStore((s) => s.oneThingDone);
  const closed = useLifeStore((s) => s.settings.deskClosed);
  const show = (key: string) => !deskHidden.includes(key);
  const today = dateKey();
  const st = nowState(classes, nightNow());
  return pickLit({
    allClear,
    class: st.kind === 'in',
    windDown: windDownSoon,
    oneThing: show('onething') && !!oneThing[today]?.trim() && !oneThingDone[today],
    due: show('due') && urgentTonight(assignments, today),
    exams: whenExamSeason(assignments, closedToday(closed, 'ExamSeason', today)),
    brief: show('brief') && whenDayBrief(classes, assignments),
    firstHomework: assignments.length === 0,
    nextClass: st.kind === 'next',
  });
}

// The one lit thing on the Desk by day. Nothing here moves on its own, so
// Reduce Motion needs nothing different; the cards inside keep their own paths.
export function LitCard({ kind, doneToday }: { kind: LitKind | null; doneToday: number }) {
  if (!kind) return null;
  return (
    // Cards brought in from elsewhere carry their own top margin; Exam season and the ones below don't.
    <View style={kind === 'exams' ? styles.gap : undefined}>
      <Body kind={kind} doneToday={doneToday} />
    </View>
  );
}

function Body({ kind, doneToday }: { kind: LitKind; doneToday: number }) {
  switch (kind) {
    case 'allClear':
      return <AllClear doneToday={doneToday} />;
    case 'class':
    case 'nextClass':
      return <NowCard />;
    case 'windDown':
      return <WindDown />;
    case 'oneThing':
      return <OneThing />;
    case 'due':
      return <DueTonight />;
    case 'exams':
      return <ExamSeason />;
    case 'brief':
      return <DayBrief />;
    case 'firstHomework':
      return <FirstHomework />;
  }
}

/** The peak: everything due is done. */
export function AllClear({ doneToday }: { doneToday: number }) {
  return (
    <Card tint={colors.secured} style={[styles.row, styles.gap]}>
      <Sparks burst={1} reach={60} />
      <Icon name="sparkle" size={22} color={colors.secured} />
      <View style={styles.flex}>
        <Text style={styles.title} maxFontSizeMultiplier={2}>All clear.</Text>
        <Text style={styles.body} maxFontSizeMultiplier={2}>{plural(doneToday, 'thing')} done today, nothing due by tomorrow. The rest of the day is yours.</Text>
      </View>
    </Card>
  );
}

function DueTonight() {
  const assignments = useSchoolStore((s) => s.assignments);
  const today = dateKey();
  const a = urgentTonight(assignments, today);
  if (!a) return null;
  return (
    <Card tint={colors.flame} onPress={() => router.push(`/assignment/${a.id}`)} accessibilityHint="Opens it" style={styles.gap}>
      <Text style={styles.big} numberOfLines={3} maxFontSizeMultiplier={textGrow.heading}>
        {a.title}
      </Text>
      <Text style={styles.body} maxFontSizeMultiplier={2}>{dueLine(a.minutes, a.due, today)}</Text>
      <Button label="Light the candle" icon="candle" size="sm" onPress={() => router.push({ pathname: '/focus', params: { assignment: a.id } })} style={styles.action} />
    </Card>
  );
}

// The evening brief's blue, so wind-down reads as the same evening.
const MOON = '#8FB4E8';

function WindDown() {
  const windDown = useLifeStore((s) => s.settings.windDown);
  const owl = useLifeStore((s) => s.about.picks.time === 'b');
  const start = nightStart(windDown, owl);
  const left = minutesToNight(minutesOf(nightNow()), start);
  return (
    <Card tint={MOON} style={styles.gap}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: alpha(MOON, 0.16) }]}>
          <Icon name="moon" size={20} color={MOON} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title} maxFontSizeMultiplier={2}>Wind-down in {plural(left, 'minute')}</Text>
          <Text style={styles.body} maxFontSizeMultiplier={2}>Tonight’s plan and bedtime are ready when you are.</Text>
        </View>
      </View>
      <Button label="Start winding down" icon="moon" variant="secondary" size="sm" onPress={() => router.push('/sleep')} style={styles.action} />
    </Card>
  );
}

function FirstHomework() {
  return (
    <Card tint={colors.flame} style={styles.gap}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: alpha(colors.flame, 0.14) }]}>
          <Icon name="book" size={20} color={colors.flame} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title} maxFontSizeMultiplier={2}>Add your first homework</Text>
          <Text style={styles.body} maxFontSizeMultiplier={2}>Type it in or scan your Classroom to-do list. Then this card knows what’s next.</Text>
        </View>
      </View>
      <Button label="Add homework" icon="plus" size="sm" onPress={() => router.push('/add-assignment')} style={styles.action} />
    </Card>
  );
}

const styles = StyleSheet.create({
  gap: {
    marginTop: 12,
  },
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  big: {
    fontFamily: fonts.display,
    fontSize: 21,
    lineHeight: 27,
    color: colors.text,
  },
  title: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  body: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textMuted,
  },
  action: {
    marginTop: 14,
    alignSelf: 'flex-start',
  },
});
