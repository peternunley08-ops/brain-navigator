import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
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
import { clock, useSchoolStore } from '../core/schoolStore';
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

/** Rough sunset (minutes after midnight) for the month, mid-US latitudes with daylight time. */
const SUNSET = [17 * 60 + 15, 17 * 60 + 50, 19 * 60 + 15, 19 * 60 + 45, 20 * 60 + 15, 20 * 60 + 35, 20 * 60 + 30, 20 * 60, 19 * 60 + 15, 18 * 60 + 30, 17 * 60, 16 * 60 + 50];
const isAfterDark = (at: number, day: string) => {
  const month = Number(day.slice(5, 7)) - 1;
  return at >= SUNSET[month] || at < 6 * 60;
};

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
  const nowMin = Math.min(23 * 60 + 45, Math.round((new Date().getHours() * 60 + new Date().getMinutes()) / 15) * 15);
  const [at, setAt] = useState(nowMin);
  const name = useSchoolStore((s) => s.profile.name);
  const monthStart = `${dateKey().slice(0, 7)}-01`;
  const workMonth = hours.filter((x) => x.kind === 'work' && x.date >= monthStart).reduce((s, x) => s + x.minutes, 0) / 60;
  // A log someone else can check and sign: dates, hours, and what it was.
  const shareLog = () => {
    const title = kind === 'service' ? 'Community service hours' : kind === 'driving' ? 'Supervised driving log' : 'Work hours';
    const lines = [...list]
      .reverse()
      .map((x) => `${x.date}: ${h(x.minutes / 60)} h${x.at != null ? ` from ${clock(x.at)}` : ''}${x.night ? ', night' : ''}${x.note ? `, ${x.note}` : ''}`);
    Share.share({
      message: [`${title}${name ? `, ${name}` : ''}`, '', ...lines, '', `Total: ${h(total)} hours`, '', 'Verified by: ____________________   Date: ________'].join('\n'),
    });
  };
  const pickAt = (m: number) => {
    setAt(m);
    if (kind === 'driving') setNight(isAfterDark(m, day));
  };

  const m = META[kind];
  const total = hoursTotal(hours, kind);
  const nightTotal = hoursTotal(hours, 'driving', true);
  const goal = kind === 'service' ? settings.serviceGoal : kind === 'driving' ? settings.drivingGoal : 0;
  const list = hours.filter((x) => x.kind === kind).sort((a, b) => b.date.localeCompare(a.date));
  const weekAgo = addDays(dateKey(), -6);
  const workWeek = hours.filter((x) => x.kind === 'work' && x.date >= weekAgo).reduce((s, x) => s + x.minutes, 0) / 60;

  const log = () => {
    const before = total;
    saveHours({ kind, date: day, minutes, note: note.trim(), at, ...(kind === 'driving' ? { night } : {}) });
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
          {kind === 'work' ? (
            <>
              <Text style={styles.sub}>{h(workWeek)} hours in the last 7 days. Keep school nights sane.</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Pay per hour</Text>
                <Field
                  value={settings.wage != null ? String(settings.wage) : ''}
                  onChangeText={(t) => {
                    const v = parseFloat(t.replace(/[^\d.]/g, ''));
                    useLifeStore.getState().setSettings({ wage: Number.isFinite(v) ? v : null });
                  }}
                  placeholder="$"
                  keyboardType="decimal-pad"
                  containerStyle={styles.wage}
                />
              </View>
              {settings.wage ? (
                <Text style={styles.sub}>
                  This month: {h(workMonth)} hours, about ${Math.round(workMonth * settings.wage)} before taxes.
                </Text>
              ) : null}
            </>
          ) : null}
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
            <ChipRow style={styles.gapSm}>
              {[...new Set([nowMin, 7 * 60, 12 * 60, 16 * 60, 19 * 60, 21 * 60])].sort((a, b) => a - b).map((m) => (
                <Chip key={m} label={m === nowMin && day === dateKey() ? `Now, ${clock(m)}` : clock(m)} selected={at === m} color={META[kind].color} onPress={() => pickAt(m)} />
              ))}
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
          <Section title="Logged" action={{ label: 'Share log', onPress: shareLog }}>
            <View style={styles.list}>
              {list.map((x) => (
                <Animated.View key={x.id} entering={FadeInDown.duration(200)} exiting={FadeOut.duration(150)} layout={LinearTransition}>
                  <Card style={styles.entry}>
                    <View style={styles.flex}>
                      <Text style={styles.entryTitle}>
                        {h(x.minutes / 60)} h{x.at != null ? ` from ${clock(x.at)}` : ''}
                        {x.night ? ', night' : ''}
                      </Text>
                      <Text style={styles.sub}>
                        {dueLabel(x.date)}
                        {x.note ? `, ${x.note}` : ''}
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
  wage: {
    width: 110,
  },
  top: {
    marginTop: 14,
    gap: 10,
  },
  big: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.text,
    fontVariant: ['tabular-nums'],
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
