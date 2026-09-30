import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { clock, isoDay, nowState, type SchoolClass, useSchoolStore } from '../core/schoolStore';
import { alpha, colors, fonts } from '../core/theme';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function ClassesScreen() {
  const classes = useSchoolStore((s) => s.classes);
  const assignments = useSchoolStore((s) => s.assignments);
  const now = nowState(classes);
  const currentId = now.kind === 'in' ? now.cls.id : now.kind === 'next' ? now.cls.id : null;

  // Classes without times yet (e.g. from a screenshot) go last.
  const sorted = [...classes].sort((a, b) => (a.days.length ? a.start : 9999) - (b.days.length ? b.start : 9999));
  const school = sorted.filter((c) => c.kind === 'class');
  const activities = sorted.filter((c) => c.kind === 'activity');

  const row = (c: SchoolClass, i: number) => {
    const open = assignments.filter((a) => a.classId === c.id && !a.done).length;
    const today = c.days.includes(isoDay());
    return (
      <Animated.View key={c.id} entering={FadeInDown.delay(i * 45).duration(340)}>
        <Card onPress={() => router.push({ pathname: '/class-edit', params: { id: c.id } })} style={styles.card} tint={c.id === currentId ? c.color : undefined}>
          <View style={[styles.bar, { backgroundColor: c.color }]} />
          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={1}>
                {c.name}
              </Text>
              {c.id === currentId ? (
                <View style={[styles.nowPill, { backgroundColor: alpha(c.color, 0.2) }]}>
                  <Text style={[styles.nowText, { color: c.color }]}>{now.kind === 'in' ? 'Now' : 'Next'}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.meta, c.days.length === 0 && { color: colors.flame }]}>
              {c.days.length === 0 ? 'Tap to add days and times' : `${clock(c.start)} – ${clock(c.end)}`}
              {c.room ? `, room ${c.room}` : ''}
              {c.teacher ? `, ${c.teacher}` : ''}
            </Text>
            <View style={styles.days}>
              {DAY_LETTERS.map((l, d) => {
                const on = c.days.includes(d + 1);
                return (
                  <View key={d} style={[styles.day, on && { backgroundColor: alpha(c.color, today && d + 1 === isoDay() ? 0.5 : 0.2) }]}>
                    <Text style={[styles.dayText, on && { color: colors.text }]}>{l}</Text>
                  </View>
                );
              })}
              {open > 0 ? <Text style={styles.open}>{open} due</Text> : null}
            </View>
          </View>
          <Icon name="chevron" size={18} color={colors.textFaint} />
        </Card>
      </Animated.View>
    );
  };

  return (
    <Screen title="Your schedule" subtitle="Classes and activities, in the order of your day.">
      {classes.length === 0 ? (
        <EmptyState title="No classes yet." body="Add them once, and Ember can tell you what’s next and sort homework by class.">
          <Button label="Add my first class" icon="plus" onPress={() => router.push('/class-edit')} />
        </EmptyState>
      ) : (
        <>
          <Reveal index={0}>
            <Section title="Classes" action={{ label: 'Add', onPress: () => router.push('/class-edit') }}>
              {school.length ? <View style={styles.list}>{school.map(row)}</View> : <Text style={styles.hint}>No classes yet.</Text>}
            </Section>
          </Reveal>
          <Reveal index={1}>
            <Section title="Activities" note="Practice, clubs, a job, lessons.">
              {activities.length ? <View style={styles.list}>{activities.map(row)}</View> : null}
              <Button
                label="Add an activity"
                icon="flag"
                variant="secondary"
                size="sm"
                onPress={() => router.push({ pathname: '/class-edit', params: { kind: 'activity' } })}
                style={styles.addActivity}
              />
            </Section>
          </Reveal>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bar: {
    width: 5,
    alignSelf: 'stretch',
    borderRadius: 3,
  },
  body: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  nowPill: {
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
  },
  nowText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
  },
  meta: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  days: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  day: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.hint,
  },
  open: {
    marginLeft: 8,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.flame,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textFaint,
  },
  addActivity: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
});
