import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { AssignmentRow } from '../components/school/AssignmentRow';
import { Chip } from '../components/ui/Chip';
import { NowCard } from '../components/school/NowCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon, type IconName } from '../components/ui/Icon';
import { IconButton } from '../components/ui/IconButton';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { addDays, type Assignment, dateKey, daysUntil, tonightsLoad, useSchoolStore } from '../core/schoolStore';
import { syncCanvas } from '../core/canvas';
import { smallestStart } from '../core/helperOffline';
import { useHubStore } from '../core/hubStore';
import { alpha, colors, fonts, radii, skyGlow } from '../core/theme';
import { emberSay } from '../components/ember/EmberBuddy';

function hm(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const TOOLS: { label: string; icon: IconName; color: string; path: string }[] = [
  { label: 'Week', icon: 'calendar', color: '#8FB4E8', path: '/week' },
  { label: 'Grades', icon: 'grade', color: '#9FD08A', path: '/grades' },
  { label: 'Cards', icon: 'cards', color: '#E89AB8', path: '/flashcards' },
  { label: 'Study tips', icon: 'flask', color: '#AFA2DE', path: '/techniques' },
  { label: 'I was out', icon: 'message', color: '#D99A6C', path: '/absent' },
];

export default function SchoolScreen() {
  const classes = useSchoolStore((s) => s.classes);
  const assignments = useSchoolStore((s) => s.assignments);
  const cap = useSchoolStore((s) => s.profile.nightlyCap);
  const [day, setDay] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [onlyClass, setOnlyClass] = useState<string | null>(null);

  const today = dateKey();
  const week = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const key = addDays(today, i);
        const [y, m, d] = key.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        const items = assignments.filter((a) => !a.done && a.due === key);
        return { key, letter: i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }), num: d, items };
      }),
    [assignments, today]
  );

  // Soonest first; within a day, starred ones lead.
  const open = assignments
    .filter((a) => !a.done)
    .filter((a) => !onlyClass || a.classId === onlyClass)
    .sort((a, b) => a.due.localeCompare(b.due) || Number(!!b.starred) - Number(!!a.starred));
  const done = assignments.filter((a) => a.done).sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? ''));
  const shown = day ? open.filter((a) => a.due === day) : open;
  const weekAgo = addDays(today, -6);
  const doneThisWeek = done.filter((a) => a.doneAt && dateKey(new Date(a.doneAt)) >= weekAgo).length;

  const groups: { title: string; items: Assignment[]; tint?: string }[] = day
    ? [{ title: 'Due that day', items: shown }]
    : [
        { title: 'Overdue', items: open.filter((a) => daysUntil(a.due) < 0), tint: colors.danger },
        { title: 'Today', items: open.filter((a) => daysUntil(a.due) === 0) },
        { title: 'Tomorrow', items: open.filter((a) => daysUntil(a.due) === 1) },
        { title: 'This week', items: open.filter((a) => daysUntil(a.due) >= 2 && daysUntil(a.due) <= 6) },
        { title: 'Coming up', items: open.filter((a) => daysUntil(a.due) >= 7) },
      ].filter((g) => g.items.length > 0);

  const load = tonightsLoad(assignments);
  // The best next thing: overdue or soonest, starred first, shortest breaks ties.
  const next = smallestStart(assignments);
  const over = load.minutes > cap;
  const fill = useAnimatedStyle(() => ({
    transform: [{ scaleX: withTiming(Math.min(1, load.minutes / Math.max(1, cap)), { duration: 700 }) }],
  }));

  let n = 0;

  return (
    <Screen
      back={false}
      glowColor={skyGlow()}
      onRefresh={async () => {
        if (!useHubStore.getState().canvas.token) return;
        const r = await syncCanvas();
        emberSay(r.ok ? 'Synced with Canvas.' : r.message, r.ok ? 'happy' : 'concerned');
      }}
      title="School"
      subtitle={open.length === 0 ? 'Nothing due. Nice.' : `${open.length} thing${open.length === 1 ? '' : 's'} to do.`}
      right={
        <View style={styles.headerBtns}>
          <IconButton icon="search" label="Search" onPress={() => router.push('/search')} />
          <IconButton icon="image" label="Scan a screenshot" onPress={() => router.push('/scan')} />
          <IconButton icon="book" label="Your schedule" onPress={() => router.push('/classes')} />
        </View>
      }
    >
      <Reveal index={n++}>
        <NowCard />
        {next ? (
          <Card onPress={() => router.push({ pathname: '/focus', params: { assignment: next.id } })} style={styles.next}>
            <Icon name="bolt" size={18} color={colors.flame} />
            <Text style={styles.nextText} numberOfLines={2}>
              <Text style={styles.nextLabel}>Do this now: </Text>
              {next.title}
              {next.minutes ? `, about ${next.minutes} min` : ''}
            </Text>
            <Icon name="timer" size={18} color={colors.textFaint} />
          </Card>
        ) : null}
      </Reveal>

      {load.items.length > 0 ? (
        <Reveal index={n++}>
          <Card tint={over ? colors.unlocked : undefined} style={styles.load}>
            <View style={styles.loadHead}>
              <Text style={styles.loadTitle}>Tonight’s load</Text>
              <Text style={[styles.loadValue, over && { color: colors.unlocked }]}>
                {hm(load.minutes)} <Text style={styles.loadOf}>of {hm(cap)}</Text>
              </Text>
            </View>
            <View style={styles.track}>
              <Animated.View style={[styles.fill, { backgroundColor: over ? colors.unlocked : colors.secured }, fill]} />
            </View>
            <Text style={styles.loadNote}>
              {over
                ? 'More than one night holds. Start the biggest thing first, and see if anything can move.'
                : `${load.items.length} thing${load.items.length === 1 ? '' : 's'} due by tomorrow. It fits.`}
            </Text>
          </Card>
        </Reveal>
      ) : null}

      <Reveal index={n++}>
        <View style={styles.week}>
          {week.map((d) => {
            const on = day === d.key;
            return (
              <Pressy
                key={d.key}
                onPress={() => setDay(on ? null : d.key)}
                depth={0.9}
                style={[styles.weekDay, on && styles.weekDayOn]}
                accessibilityLabel={`${d.letter} ${d.num}, ${d.items.length} due`}
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.weekLetter, on && styles.weekTextOn]}>{d.letter}</Text>
                <Text style={[styles.weekNum, on && styles.weekTextOn]}>{d.num}</Text>
                <View style={styles.weekDots}>
                  {d.items.slice(0, 3).map((a) => (
                    <View key={a.id} style={[styles.weekDot, { backgroundColor: classes.find((c) => c.id === a.classId)?.color ?? colors.flame }]} />
                  ))}
                </View>
              </Pressy>
            );
          })}
        </View>
      </Reveal>

      <Reveal index={n++}>
        <Button label="Add homework or a test" icon="plus" onPress={() => router.push('/add-assignment')} style={styles.add} />
      </Reveal>

      <Reveal index={n++}>
        <View style={styles.tools}>
          {TOOLS.map((t) => (
            <Pressy key={t.path} onPress={() => router.push(t.path as never)} style={styles.tool} accessibilityRole="button" accessibilityLabel={t.label}>
              <View style={[styles.toolIcon, { backgroundColor: alpha(t.color, 0.14) }]}>
                <Icon name={t.icon} size={19} color={t.color} />
              </View>
              <Text style={styles.toolLabel} numberOfLines={1}>
                {t.label}
              </Text>
            </Pressy>
          ))}
        </View>
      </Reveal>

      {open.length === 0 && !day ? (
        <EmptyState
          title={assignments.length ? 'All caught up.' : 'Nothing here yet.'}
          body={
            classes.length
              ? 'Add what’s due, or scan a screenshot of your Classroom to-do list.'
              : 'Start with your classes — type them in, or scan a screenshot of your Google Classroom.'
          }
        >
          {!classes.length ? (
            <View style={styles.emptyActions}>
              <Button label="Scan a screenshot" icon="image" variant="secondary" onPress={() => router.push('/scan')} />
              <Button label="Add classes by hand" icon="book" variant="ghost" size="sm" onPress={() => router.push('/classes')} />
            </View>
          ) : null}
        </EmptyState>
      ) : (
        <>
          {classes.filter((c) => c.kind === 'class' && assignments.some((a) => !a.done && a.classId === c.id)).length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classChips} style={styles.classScroll}>
              <Chip label="All classes" selected={!onlyClass} onPress={() => setOnlyClass(null)} />
              {classes
                .filter((c) => c.kind === 'class' && assignments.some((a) => !a.done && a.classId === c.id))
                .map((c) => (
                  <Chip key={c.id} label={c.name} dot color={c.color} selected={onlyClass === c.id} onPress={() => setOnlyClass(onlyClass === c.id ? null : c.id)} />
                ))}
            </ScrollView>
          ) : null}
          {onlyClass && !groups.length ? <Text style={styles.noneFor}>Nothing open for this class.</Text> : null}
          {groups.map((g) => (
          <Reveal key={g.title} index={n++}>
            <Section
              title={g.title}
              note={g.tint ? 'Finish it, or move the date.' : undefined}
              action={g.tint ? { label: 'Sort these out', onPress: () => router.push('/triage') } : undefined}
            >
              <View style={styles.list}>
                {g.items.map((a, i) => (
                  <AssignmentRow key={a.id} a={a} index={i} />
                ))}
              </View>
            </Section>
          </Reveal>
        ))}
        </>
      )}
      {day && shown.length === 0 ? (
        <Animated.Text entering={FadeIn} style={styles.hint}>
          Nothing due that day.
        </Animated.Text>
      ) : null}

      {done.length > 0 ? (
        <Reveal index={n++}>
          <Section title="Done" note={`${doneThisWeek} this week, ${done.length} in all`} action={{ label: showDone ? 'Hide' : 'Show', onPress: () => setShowDone((v) => !v) }}>
            {showDone ? (
              <View style={styles.list}>
                {done.slice(0, 20).map((a) => (
                  <AssignmentRow key={a.id} a={a} compact />
                ))}
              </View>
            ) : null}
          </Section>
        </Reveal>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  classScroll: {
    marginTop: 14,
    marginHorizontal: -20,
  },
  classChips: {
    gap: 8,
    paddingHorizontal: 20,
  },
  noneFor: {
    marginTop: 18,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textFaint,
    textAlign: 'center',
  },
  headerBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  load: {
    marginTop: 12,
  },
  loadHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  loadTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
  },
  loadValue: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  loadOf: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textFaint,
  },
  track: {
    marginTop: 10,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceSunk,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    transformOrigin: 'left',
  },
  loadNote: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  week: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  weekDayOn: {
    backgroundColor: alpha(colors.flame, 0.16),
    borderColor: alpha(colors.flame, 0.6),
  },
  weekLetter: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.textFaint,
  },
  weekNum: {
    marginTop: 2,
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.text,
  },
  weekTextOn: {
    color: colors.flame,
  },
  weekDots: {
    flexDirection: 'row',
    gap: 3,
    height: 6,
    marginTop: 5,
  },
  weekDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  add: {
    marginTop: 16,
  },
  next: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  nextText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
  },
  nextLabel: {
    fontFamily: fonts.bodySemi,
    color: colors.flame,
  },
  tools: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  tool: {
    alignItems: 'center',
    gap: 6,
    width: 62,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  toolLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textMuted,
  },
  emptyActions: {
    gap: 6,
    alignItems: 'center',
  },
  list: {
    gap: 10,
  },
  hint: {
    marginTop: 20,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
