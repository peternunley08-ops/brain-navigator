import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { Segmented } from '../components/ui/Segmented';
import { Stepper } from '../components/ui/Stepper';
import { addDays, dateKey, dueLabel } from '../core/dates';
import { type HoursEntry, hoursTotal, useLifeStore } from '../core/lifeStore';
import { colors, fonts } from '../core/theme';
import { offerUndo } from '../core/undoStore';

type Kind = HoursEntry['kind'];
const META: Record<Kind, { color: string; noun: string; placeholder: string }> = {
  service: { color: '#9FD08A', noun: 'service', placeholder: 'Where? e.g. Food bank' },
  driving: { color: '#8FB4E8', noun: 'driving', placeholder: 'Route or who drove with you' },
  work: { color: '#D99A6C', noun: 'work', placeholder: 'Where? e.g. Café shift' },
};

function h(n: number) {
  return Math.round(n * 10) / 10;
}

// Hours that count: community service toward a requirement, supervised
// driving toward a license, and shifts at a job.
export default function HoursScreen() {
  const hours = useLifeStore((s) => s.hours);
  const settings = useLifeStore((s) => s.settings);
  const saveHours = useLifeStore((s) => s.saveHours);
  const deleteHours = useLifeStore((s) => s.deleteHours);
  const [kind, setKind] = useState<Kind>('service');
  const [minutes, setMinutes] = useState(60);
  const [note, setNote] = useState('');
  const [night, setNight] = useState(false);
  const [day, setDay] = useState(dateKey());

  const m = META[kind];
  const total = hoursTotal(hours, kind);
  const nightTotal = hoursTotal(hours, 'driving', true);
  const goal = kind === 'service' ? settings.serviceGoal : kind === 'driving' ? settings.drivingGoal : 0;
  const list = hours.filter((x) => x.kind === kind).sort((a, b) => b.date.localeCompare(a.date));
  const weekAgo = addDays(dateKey(), -6);
  const workWeek = hours.filter((x) => x.kind === 'work' && x.date >= weekAgo).reduce((s, x) => s + x.minutes, 0) / 60;

  const log = () => {
    const before = total;
    saveHours({ kind, date: day, minutes, note: note.trim(), ...(kind === 'driving' ? { night } : {}) });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const after = before + minutes / 60;
    if (goal && before < goal && after >= goal) emberSay(`${goal} hours of ${m.noun}. Goal reached!`, 'cheer');
    else emberSay(`${h(minutes / 60)} hour${minutes === 60 ? '' : 's'} logged.`, 'happy');
    setNote('');
  };

  return (
    <Screen glowColor={m.color} title="Hours" subtitle="Service, driving practice, and work — logged as you go.">
      <Reveal index={0}>
        <Segmented<Kind>
          options={[
            { key: 'service', label: 'Service' },
            { key: 'driving', label: 'Driving' },
            { key: 'work', label: 'Work' },
          ]}
          value={kind}
          onChange={setKind}
          style={styles.seg}
        />
      </Reveal>

      <Reveal index={1}>
        <Card tint={m.color} style={styles.top}>
          <Text style={styles.big}>
            {h(total)}
            <Text style={styles.unit}> {goal ? `of ${goal} hours` : 'hours total'}</Text>
          </Text>
          {goal ? <ProgressBar value={total / goal} color={m.color} /> : null}
          {kind === 'driving' ? (
            <>
              <Text style={styles.sub}>
                Night: {h(nightTotal)} of {settings.drivingNightGoal} hours
              </Text>
              <ProgressBar value={nightTotal / settings.drivingNightGoal} color="#AFA2DE" height={6} />
            </>
          ) : null}
          {kind === 'work' ? <Text style={styles.sub}>{h(workWeek)} hours in the last 7 days. Keep school nights sane.</Text> : null}
        </Card>
      </Reveal>

      <Reveal index={2}>
        <Section title="Log hours">
          <Card>
            <View style={styles.row}>
              <Text style={styles.label}>How long</Text>
              <Stepper value={`${h(minutes / 60)}h`} onDecrement={() => setMinutes(Math.max(15, minutes - 15))} onIncrement={() => setMinutes(minutes + 15)} label="hours" minWidth={52} />
            </View>
            <ChipRow style={styles.gapSm}>
              <Chip label="Today" selected={day === dateKey()} onPress={() => setDay(dateKey())} />
              <Chip label="Yesterday" selected={day === addDays(dateKey(), -1)} onPress={() => setDay(addDays(dateKey(), -1))} />
              <Chip label="2 days ago" selected={day === addDays(dateKey(), -2)} onPress={() => setDay(addDays(dateKey(), -2))} />
            </ChipRow>
            {kind === 'driving' ? (
              <Pressy onPress={() => setNight((v) => !v)} style={styles.night} accessibilityRole="checkbox" accessibilityState={{ checked: night }}>
                <Icon name={night ? 'check' : 'moon'} size={17} color={night ? colors.secured : colors.textMuted} />
                <Text style={styles.nightText}>After dark</Text>
              </Pressy>
            ) : null}
            <Field value={note} onChangeText={setNote} placeholder={m.placeholder} containerStyle={styles.gap} />
            <Button label="Log it" icon="plus" onPress={log} style={styles.gap} />
          </Card>
        </Section>
      </Reveal>

      {list.length ? (
        <Reveal index={3}>
          <Section title="Logged">
            <View style={styles.list}>
              {list.map((x) => (
                <Animated.View key={x.id} entering={FadeInDown.duration(200)} exiting={FadeOut.duration(150)} layout={LinearTransition}>
                  <Card style={styles.entry}>
                    <View style={styles.flex}>
                      <Text style={styles.entryTitle}>
                        {h(x.minutes / 60)} h{x.night ? ' · night' : ''}
                      </Text>
                      <Text style={styles.sub}>
                        {dueLabel(x.date)}
                        {x.note ? ` · ${x.note}` : ''}
                      </Text>
                    </View>
                    <Pressy
                      onPress={() => {
                        deleteHours(x.id);
                        offerUndo('Removed an entry', () => saveHours(x));
                      }}
                      hitSlop={10}
                      accessibilityLabel="Remove entry"
                    >
                      <Icon name="close" size={15} color={colors.textFaint} />
                    </Pressy>
                  </Card>
                </Animated.View>
              ))}
            </View>
          </Section>
        </Reveal>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  seg: {
    marginTop: 14,
  },
  gap: {
    marginTop: 12,
  },
  gapSm: {
    marginTop: 10,
  },
  top: {
    marginTop: 14,
    gap: 10,
  },
  big: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.text,
  },
  unit: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textMuted,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textFaint,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  night: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  nightText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
  },
  list: {
    gap: 8,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  entryTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
});
