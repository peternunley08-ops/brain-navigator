import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { cheerLine } from '../../core/about';
import { clock } from '../../core/dates';
import { useLifeStore, weekOf } from '../../core/lifeStore';
import { dueOn, firstClassOn, lightsOutMinutes, minutesOf, morningKey, nightNow, pastLightsOut, tonightKey, tonightWeekday } from '../../core/night';
import { useSchoolStore } from '../../core/schoolStore';
import { alpha, colors, dimensionColor, fonts, radii } from '../../core/theme';
import { plural } from '../../core/words';
import { emberSay } from '../ember/EmberBuddy';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { Pressy } from '../ui/Pressy';
import { ProgressBar } from '../ui/ProgressBar';
import { Reveal } from '../ui/Reveal';
import { Section } from '../ui/Section';
import { WeekSentenceCard } from './AboutCards';

const MOON = dimensionColor.intellectual;
const MAX_DUE = 4;

// The Desk after the wind-down hour: a short stack instead of the whole
// day. When the day has been put down, only a quiet "Sleep well".
export function NightDesk({ onShowAll }: { onShowAll: () => void }) {
  const putDown = useLifeStore((s) => s.settings.putDown);
  return putDown === tonightKey() ? <PutDown onShowAll={onShowAll} /> : <Stack onShowAll={onShowAll} />;
}

function Stack({ onShowAll }: { onShowAll: () => void }) {
  // Sunday night (past midnight too), the week's sentence comes first.
  const sunday = tonightWeekday() === 0;
  return (
    <>
      {sunday ? (
        <Reveal index={0}>
          <WeekCard />
        </Reveal>
      ) : null}
      <Reveal index={1}>
        <TonightCard />
      </Reveal>
      <Reveal index={2}>
        <TomorrowCard />
      </Reveal>
      <Reveal index={3}>
        <PackCard />
      </Reveal>
      <Reveal index={4}>
        <Button label="Put the day down" icon="moon" onPress={() => router.push('/goodnight')} style={styles.primary} />
        <Pressy onPress={onShowAll} hitSlop={10} accessibilityRole="button" style={styles.link}>
          <Text style={styles.linkText}>Open the day desk</Text>
        </Pressy>
      </Reveal>
    </>
  );
}

// Sunday night: the week's own words from the review, else the week-in-a-sentence card.
// Night sections fold with the same deskFolded list as the Desk, and stay folded.
function useNightFold(key: string) {
  const deskFolded = useLifeStore((s) => s.settings.deskFolded) ?? [];
  const folded = deskFolded.includes(key);
  return {
    folded,
    onToggleFold: () => useLifeStore.getState().setSettings({ deskFolded: folded ? deskFolded.filter((k) => k !== key) : [...deskFolded, key] }),
  };
}

function WeekCard() {
  const reviews = useLifeStore((s) => s.reviews);
  const week = weekOf(tonightKey());
  const review = reviews.find((r) => r.weekOf === week);
  const line = (review?.well || review?.next || '').trim();
  // No review yet: the week-in-a-sentence card (About you) leads instead.
  if (!line) return <WeekSentenceCard />;
  return (
    <Card tint={MOON} onPress={() => router.push('/review')} style={styles.hero}>
      <Icon name="book" size={24} color={MOON} />
      <View style={styles.flex}>
        <Text style={styles.label}>Your week, in your words</Text>
        <Text style={styles.sub}>{`\u201c${line}\u201d`}</Text>
      </View>
      <Icon name="chevron" size={16} color={colors.textFaint} />
    </Card>
  );
}

function TonightCard() {
  const wake = useLifeStore((s) => s.settings.wake);
  const goal = useSchoolStore((s) => s.profile.sleepGoal);
  const list = useLifeStore((s) => s.windDownItems);
  const doneMap = useLifeStore((s) => s.windDownDone);
  const now = nightNow();
  const checked = doneMap[tonightKey(now)] ?? [];
  const count = list.filter((i) => checked.includes(i.id)).length;
  const out = lightsOutMinutes(wake, goal);
  const past = pastLightsOut(minutesOf(now), out);
  return (
    <Card tint={MOON} onPress={() => router.push('/sleep')} style={styles.hero}>
      <Icon name="bed" size={26} color={MOON} />
      <View style={styles.flex}>
        <Text style={styles.label}>{past ? 'Lights out was' : 'Lights out by'}</Text>
        <Text style={styles.time} maxFontSizeMultiplier={1.3}>
          {clock(out)}
        </Text>
        <Text style={styles.sub}>Wake at {clock(wake)}</Text>
        {list.length ? (
          <View style={styles.progress}>
            <ProgressBar value={count / list.length} color={MOON} height={5} />
            <Text style={styles.sub}>{count === list.length ? 'Wind-down done' : `Wind-down: ${count} of ${list.length} done`}</Text>
          </View>
        ) : null}
      </View>
      <Icon name="chevron" size={16} color={colors.textFaint} />
    </Card>
  );
}

function TomorrowCard() {
  const fold = useNightFold('night-tomorrow');
  const classes = useSchoolStore((s) => s.classes);
  const assignments = useSchoolStore((s) => s.assignments);
  const key = morningKey();
  const first = firstClassOn(classes, key);
  const due = dueOn(assignments, key);
  const shown = due.slice(0, MAX_DUE);
  const className = (id: string | null) => classes.find((c) => c.id === id)?.name;
  return (
    <Section title="Tomorrow" {...fold}>
      <Card style={styles.rows}>
        {first ? (
          <Pressy onPress={() => router.push(`/class/${first.id}`)} style={styles.row} accessibilityRole="button">
            <View style={[styles.dot, { backgroundColor: first.color }]} />
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{first.name}</Text>
              <Text style={styles.sub}>First class at {clock(first.start)}</Text>
            </View>
          </Pressy>
        ) : classes.length ? (
          <Text style={styles.plain}>No classes tomorrow.</Text>
        ) : null}
        {shown.length ? (
          shown.map((a) => (
            <Pressy key={a.id} onPress={() => router.push(`/assignment/${a.id}`)} style={styles.row} accessibilityRole="button">
              <View style={[styles.dot, { backgroundColor: colors.textFaint }]} />
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{a.title}</Text>
                {className(a.classId) ? <Text style={styles.sub}>Due tomorrow, {className(a.classId)}</Text> : <Text style={styles.sub}>Due tomorrow</Text>}
              </View>
            </Pressy>
          ))
        ) : (
          <Text style={styles.plain}>Nothing due tomorrow.</Text>
        )}
        {due.length > shown.length ? (
          <Pressy onPress={() => router.push('/school')} hitSlop={8} accessibilityRole="button">
            <Text style={styles.sub}>And {plural(due.length - shown.length, 'more thing')} due</Text>
          </Pressy>
        ) : null}
      </Card>
    </Section>
  );
}

function PackCard() {
  const fold = useNightFold('night-pack');
  const pack = useLifeStore((s) => s.pack);
  const packDone = useLifeStore((s) => s.packDone);
  const toggle = useLifeStore((s) => s.toggleListItem);
  const key = tonightKey();
  const checked = packDone[key] ?? [];
  if (!pack.length) return null;
  const count = pack.filter((i) => checked.includes(i.id)).length;
  const tap = (id: string) => {
    toggle('packDone', key, id);
    if (!checked.includes(id) && count + 1 === pack.length) emberSay(cheerLine('Bag’s packed. Tomorrow-you says thanks.'), 'cheer');
  };
  return (
    <Section title="Pack for tomorrow" note={count === pack.length ? 'All packed' : `${count} of ${pack.length} packed`} {...fold}>
      <Card>
        {pack.map((item) => {
          const on = checked.includes(item.id);
          return (
            <Pressy
              key={item.id}
              onPress={() => tap(item.id)}
              style={styles.item}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={item.text}
            >
              <View style={[styles.box, { borderColor: on ? colors.flame : colors.lineStrong }, on && { backgroundColor: colors.flame }]}>
                {on ? <Icon name="check" size={13} color={colors.flameInk} strokeWidth={3} /> : null}
              </View>
              <Text style={[styles.itemText, on && styles.itemDone]}>{item.text}</Text>
            </Pressy>
          );
        })}
      </Card>
    </Section>
  );
}

// The day was put down: nothing else on the Desk until morning.
function PutDown({ onShowAll }: { onShowAll: () => void }) {
  const classes = useSchoolStore((s) => s.classes);
  const first = firstClassOn(classes, morningKey());
  return (
    <Reveal index={0}>
      <View style={styles.quiet}>
        <Icon name="moon" size={28} color={MOON} />
        <Text style={styles.sleepWell} accessibilityRole="header">
          Sleep well
        </Text>
        {first ? (
          <Text style={[styles.plain, styles.centered]}>
            Your first class tomorrow is {first.name} at {clock(first.start)}.
          </Text>
        ) : classes.length ? (
          <Text style={[styles.plain, styles.centered]}>No classes tomorrow.</Text>
        ) : null}
        <Pressy onPress={onShowAll} hitSlop={10} accessibilityRole="button" style={styles.link}>
          <Text style={styles.linkText}>Open the Desk anyway</Text>
        </Pressy>
      </View>
    </Reveal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  hero: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  time: {
    marginTop: 2,
    fontFamily: fonts.display,
    fontSize: 38,
    letterSpacing: -0.8,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  sub: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textFaint,
  },
  progress: {
    marginTop: 12,
    gap: 6,
  },
  rows: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  plain: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
  },
  itemDone: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
  primary: {
    marginTop: 28,
  },
  link: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },
  linkText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  quiet: {
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 12,
    paddingVertical: 24,
    borderRadius: radii.lg,
    backgroundColor: alpha(MOON, 0.05),
  },
  centered: {
    textAlign: 'center',
  },
  sleepWell: {
    fontFamily: fonts.display,
    fontSize: 32,
    letterSpacing: -0.6,
    color: colors.text,
    textAlign: 'center',
  },
});
