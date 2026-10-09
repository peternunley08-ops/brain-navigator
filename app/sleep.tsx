import * as Haptics from '../core/haptics';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { emberSay } from '../components/ember/EmberBuddy';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { IconButton } from '../components/ui/IconButton';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { ScienceNote } from '../components/ui/ScienceNote';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { MORNING_HOURS, TimeField } from '../components/ui/TimeField';
import { cheerLine } from '../core/about';
import { type ListItem, useLifeStore } from '../core/lifeStore';
import { FALL_ASLEEP, lightsOutMinutes, tonightKey, wrap } from '../core/night';
import { clock, useSchoolStore } from '../core/schoolStore';
import { colors, fonts } from '../core/theme';
import { isShowing } from '../core/showMode';

const MOON = '#8FB4E8';

// Tonight: when to be asleep, a short routine to get there, and tomorrow's
// bag packed so the morning isn't a scramble.
export default function SleepScreen() {
  const settings = useLifeStore((s) => s.settings);
  const setSettings = useLifeStore((s) => s.setSettings);
  const goal = useSchoolStore((s) => s.profile.sleepGoal);
  const earn = useLifeStore((s) => s.earn);

  useEffect(() => {
    if (earn('sleep_plan') && !isShowing()) emberSay('New badge: Bedtime math.', 'cheer');
  }, [earn]);

  const wake = settings.wake;
  // Sleep comes in ~90-minute cycles; waking between them feels easier.
  const options = [7, 6, 5].map((cycles) => {
    const minutes = Math.round(cycles * 90);
    return { hours: minutes / 60, lightsOut: wrap(wake - minutes - FALL_ASLEEP) };
  });
  const goalLightsOut = lightsOutMinutes(wake, goal);

  return (
    <Screen tone="dusk" glowColor={MOON} kicker="Tonight" title="Sleep" subtitle="Teens need 8–10 hours. Here’s how to get there.">
      <Reveal index={0}>
        <Card tint={MOON} style={styles.hero}>
          <Icon name="bed" size={26} color={MOON} />
          <View style={styles.flex}>
            <Text style={styles.heroLabel}>For {goal} hours, lights out by</Text>
            <Text style={styles.heroTime}>{clock(goalLightsOut)}</Text>
            <Text style={styles.sub}>Wake at {clock(wake)}, and give yourself 15 minutes to fall asleep.</Text>
          </View>
        </Card>
      </Reveal>

      <Reveal index={1}>
        <View style={styles.gap}>
          <TimeField label="I wake up at" value={wake} onChange={(v) => setSettings({ wake: v })} hours={MORNING_HOURS} />
        </View>
      </Reveal>

      <Reveal index={2}>
        <Section title="By sleep cycles" note="Waking at the end of a cycle feels less groggy.">
          <View style={styles.options}>
            {options.map((o) => {
              const enough = o.hours >= goal - 0.25;
              return (
                <Card key={o.hours} style={styles.option} tint={enough ? colors.secured : undefined}>
                  <Text style={[styles.optTime, enough && { color: colors.secured }]}>{clock(o.lightsOut)}</Text>
                  <Text style={styles.sub}>
                    {o.hours} h, {o.hours / 1.5} cycles
                  </Text>
                </Card>
              );
            })}
          </View>
        </Section>
      </Reveal>

      <Reveal index={3}>
        <Checklist
          title="Wind down"
          note={windDownNote(settings.windDown)}
          items="windDownItems"
          done="windDownDone"
          color={MOON}
          doneLine="Routine done. Phone down, lights low. Good night."
          countNights
        />
      </Reveal>

      <Reveal index={4}>
        <Checklist title="Tomorrow’s bag" note="Pack it tonight, walk out easy." items="pack" done="packDone" color={colors.flame} doneLine="Bag’s packed. Tomorrow-you says thanks." />
      </Reveal>

      <Reveal index={5}>
        <ScienceNote fact="During the teen years the body clock shifts later — melatonin arrives about two hours later than in kids or adults. That's biology, not laziness. Dim light and no screens in the last hour help the melatonin show up on time." />
      </Reveal>
    </Screen>
  );
}

/** "Starts at 9:30 PM, in 40 minutes." before it begins; "Started at 9:30 PM." after. */
function windDownNote(at: number) {
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  const until = at - now;
  if (until > 0 && until <= 180) {
    const h = Math.floor(until / 60);
    const m = until % 60;
    return `Starts at ${clock(at)}, in ${h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} minutes`}.`;
  }
  if (until <= 0 && until > -180) return `Started at ${clock(at)}. Phone down soon.`;
  return `Starts at ${clock(at)}. Change it in Settings.`;
}

function Checklist({
  title,
  note,
  items,
  done,
  color,
  doneLine,
  countNights,
}: {
  title: string;
  note: string;
  items: 'pack' | 'windDownItems';
  done: 'packDone' | 'windDownDone';
  color: string;
  doneLine: string;
  /** Show how many of the last two weeks' nights had most of the list done. */
  countNights?: boolean;
}) {
  const list = useLifeStore((s) => s[items]);
  const doneMap = useLifeStore((s) => s[done]);
  const setList = useLifeStore((s) => s.setList);
  const toggle = useLifeStore((s) => s.toggleListItem);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');

  const key = tonightKey();
  const checked = doneMap[key] ?? [];
  const count = list.filter((i) => checked.includes(i.id)).length;
  // A count, not a streak: a missed night doesn't reset anything.
  const nights = countNights
    ? Object.values(doneMap).filter((ids) => list.length && list.filter((i) => ids.includes(i.id)).length >= Math.ceil(list.length / 2)).length
    : 0;

  const tap = (item: ListItem) => {
    const finishing = !checked.includes(item.id);
    toggle(done, key, item.id);
    Haptics.impactAsync(finishing ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    if (finishing && count + 1 === list.length) emberSay(cheerLine(doneLine), 'cheer');
  };

  const add = () => {
    const t = text.trim();
    if (!t) return;
    setList(items, [...list, { id: `${Date.now().toString(36)}`, text: t }]);
    setText('');
  };

  return (
    <Section title={title} note={note} action={{ label: editing ? 'Done' : 'Edit', onPress: () => setEditing((e) => !e) }}>
      <Card>
        <ProgressBar value={list.length ? count / list.length : 0} color={color} height={6} />
        {nights ? (
          <Text style={styles.nights}>
            You wound down {nights} of the last 14 nights{nights >= 10 ? '. That’s a real habit.' : '.'}
          </Text>
        ) : null}
        {list.map((item) => {
          const on = checked.includes(item.id);
          return (
            <Animated.View key={item.id} entering={FadeInDown.duration(200)} exiting={FadeOut.duration(150)} layout={LinearTransition}>
              <Pressy
                onPress={() => (editing ? null : tap(item))}
                haptic="none"
                style={styles.item}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={item.text}
              >
                <View style={[styles.box, { borderColor: on ? color : colors.lineStrong }, on && { backgroundColor: color }]}>
                  {on ? <Icon name="check" size={13} color={colors.flameInk} strokeWidth={3} /> : null}
                </View>
                <Text style={[styles.itemText, on && styles.itemDone]}>{item.text}</Text>
                {editing ? (
                  <Pressy onPress={() => setList(items, list.filter((x) => x.id !== item.id))} hitSlop={10} accessibilityLabel={`Remove ${item.text}`}>
                    <Icon name="close" size={15} color={colors.textFaint} />
                  </Pressy>
                ) : null}
              </Pressy>
            </Animated.View>
          );
        })}
        {editing ? (
          <View style={styles.addRow}>
            <Field value={text} onChangeText={setText} placeholder="Add an item" returnKeyType="done" onSubmitEditing={add} containerStyle={styles.flex} />
            <IconButton icon="plus" label="Add" onPress={add} tint={color} />
          </View>
        ) : null}
      </Card>
    </Section>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  nights: {
    marginTop: 10,
    fontFamily: fonts.displaySoft,
    fontSize: 14,
    color: colors.textMuted,
  },
  gap: {
    marginTop: 12,
  },
  hero: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 14,
  },
  heroLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  heroTime: {
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
    fontSize: 12,
    lineHeight: 17,
    color: colors.textFaint,
  },
  options: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    flex: 1,
    width: undefined,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  optTime: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
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
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
});
