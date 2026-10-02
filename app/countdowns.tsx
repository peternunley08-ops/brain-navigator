import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Field } from '../components/ui/Field';
import { Icon, type IconName } from '../components/ui/Icon';
import { IconButton } from '../components/ui/IconButton';
import { Pressy } from '../components/ui/Pressy';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { dateKey, daysUntil, dueLabel } from '../core/dates';
import { plural } from '../core/words';
import { type CountdownKind, useLifeStore } from '../core/lifeStore';
import { parseDue } from '../core/scanParser';
import { useSchoolStore } from '../core/schoolStore';
import { alpha, colors, fonts } from '../core/theme';
import { offerUndo } from '../core/undoStore';

const ICONS: IconName[] = ['sparkle', 'gift', 'sun', 'star', 'heart', 'trophy', 'cap', 'car', 'flag', 'moon', 'bolt', 'calendar'];
const countdownIcon = (c: { icon?: IconName; kind: CountdownKind }): IconName =>
  c.icon ?? (c.kind === 'birthday' ? 'gift' : c.kind === 'finals' ? 'grade' : c.kind === 'break' ? 'sun' : 'sparkle');

const KINDS: { key: CountdownKind; label: string; color: string }[] = [
  { key: 'event', label: 'Something fun', color: '#E89AB8' },
  { key: 'break', label: 'A break', color: '#8CC0A8' },
  { key: 'finals', label: 'Finals', color: '#F0845A' },
  { key: 'birthday', label: 'A birthday', color: '#F5B45C' },
];

// Things to look forward to (and a few to prepare for). A break countdown
// also shows how much of the stretch before it is already behind you.
export default function CountdownsScreen() {
  const countdowns = useLifeStore((s) => s.countdowns);
  const save = useLifeStore((s) => s.saveCountdown);
  const remove = useLifeStore((s) => s.deleteCountdown);
  const assignments = useSchoolStore((s) => s.assignments);
  const [adding, setAdding] = useState(countdowns.length === 0);
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState('');
  const [kind, setKind] = useState<CountdownKind>('event');
  const [icon, setIcon] = useState<IconName | null>(null);

  // Something to look forward to is never in the past: a date that's gone means next year's.
  const raw = parseDue(when);
  const parsed = raw && daysUntil(raw) < 0 ? dateKey(new Date(Number(raw.slice(0, 4)) + 1, Number(raw.slice(5, 7)) - 1, Number(raw.slice(8)))) : raw;
  const upcoming = [...countdowns].filter((c) => daysUntil(c.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
  const past = countdowns.filter((c) => daysUntil(c.date) < 0);

  const add = () => {
    if (!title.trim() || !parsed) return;
    save({ title: title.trim(), date: parsed, kind, color: KINDS.find((k) => k.key === kind)!.color, ...(icon ? { icon } : {}) });
    emberSay(kind === 'finals' ? 'Finals are on the calendar. We’ll plan backward from there.' : 'Something to look forward to. Good.', 'happy');
    setTitle('');
    setWhen('');
    setIcon(null);
    setAdding(false);
  };

  return (
    <Screen title="Countdowns" subtitle="Something to look forward to." right={<IconButton icon="plus" label="Add a countdown" onPress={() => setAdding((a) => !a)} />}>
      {adding ? (
        <Animated.View entering={FadeInDown.duration(240)}>
          <Card style={styles.gap}>
            <Field value={title} onChangeText={setTitle} placeholder="Prom, winter break, Maya’s birthday…" />
            <Field value={when} onChangeText={setWhen} placeholder="When? e.g. Dec 20 or 5/14" containerStyle={styles.gapSm} hint={parsed ? `${dueLabel(parsed)}, ${daysUntil(parsed)} days` : undefined} />
            <ChipRow style={styles.gapSm}>
              {KINDS.map((k) => (
                <Chip key={k.key} label={k.label} dot color={k.color} selected={kind === k.key} onPress={() => setKind(k.key)} />
              ))}
            </ChipRow>
            <View style={styles.icons}>
              {ICONS.map((n) => {
                const on = (icon ?? countdownIcon({ kind })) === n;
                const color = KINDS.find((k) => k.key === kind)!.color;
                return (
                  <Pressy
                    key={n}
                    onPress={() => setIcon(n)}
                    depth={0.9}
                    accessibilityRole="button"
                    accessibilityLabel={`Icon: ${n}`}
                    accessibilityState={{ selected: on }}
                    style={[styles.iconPick, on && { borderColor: color, backgroundColor: alpha(color, 0.16) }]}
                  >
                    <Icon name={n} size={17} color={on ? color : colors.textMuted} />
                  </Pressy>
                );
              })}
            </View>
            <Button label="Start counting" icon="gift" onPress={add} disabled={!title.trim() || !parsed} style={styles.gap} />
          </Card>
        </Animated.View>
      ) : null}

      {upcoming.length === 0 && !adding ? <EmptyState title="Nothing to count down to." body="Add a break, a trip, a concert, a birthday." /> : null}

      <View style={styles.list}>
        {upcoming.map((c, i) => {
          const d = daysUntil(c.date);
          // Progress through the wait: from when it was set to the day itself.
          const since = c.createdAt ? -daysUntil(dateKey(new Date(c.createdAt))) : 0;
          const span = Math.max(1, d + since);
          const finalsTests = c.kind === 'finals' ? assignments.filter((a) => !a.done && (a.kind === 'test' || a.kind === 'project') && a.due <= c.date && daysUntil(a.due) >= 0) : [];
          return (
            <Reveal key={c.id} index={i}>
              <Animated.View exiting={FadeOut.duration(150)} layout={LinearTransition}>
                <Card tint={c.color} onLongPress={() => {
                  const snap = c;
                  remove(c.id);
                  offerUndo(`Removed ${snap.title}`, () => save(snap));
                }}>
                  <View style={styles.row}>
                    <View style={[styles.days, { backgroundColor: alpha(c.color, 0.14), borderColor: alpha(c.color, 0.5) }]}>
                      <Text style={[styles.daysNum, { color: c.color }]}>{d}</Text>
                      <Text style={styles.daysLabel}>{d === 1 ? 'day' : 'days'}</Text>
                    </View>
                    <View style={styles.flex}>
                      <View style={styles.titleRow}>
                        <Icon name={countdownIcon(c)} size={16} color={c.color} />
                        <Text style={[styles.title, styles.flex]}>{d === 0 ? `${c.title} is today!` : c.title}</Text>
                      </View>
                      <Text style={styles.sub}>{new Date(`${c.date}T12:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                    </View>
                  </View>
                  {c.kind === 'break' ? <ProgressBar value={since / span} color={c.color} height={6} style={styles.gap} /> : null}
                  {c.kind === 'finals' ? (
                    <View style={styles.finals}>
                      <Text style={styles.sub}>
                        {finalsTests.length
                          ? `${plural(finalsTests.length, 'test')} and ${plural(finalsTests.length, 'project')} before then. Plan each one backward. A little every day beats a week of cramming.`
                          : 'Add each final as a test so they can be planned backward.'}
                      </Text>
                      <Button label={finalsTests.length ? 'See them' : 'Add a final'} size="sm" variant="secondary" onPress={() => router.push(finalsTests.length ? '/school' : '/add-assignment')} style={styles.gapSm} />
                    </View>
                  ) : null}
                </Card>
              </Animated.View>
            </Reveal>
          );
        })}
      </View>
      {upcoming.length ? <Text style={styles.hint}>Hold a countdown to remove it.</Text> : null}
      {past.length ? (
        <Button
          label={`Clear ${past.length} that already happened`}
          variant="ghost"
          size="sm"
          onPress={() => past.forEach((c) => remove(c.id))}
          style={styles.clear}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  icons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  iconPick: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flex: {
    flex: 1,
  },
  gap: {
    marginTop: 14,
  },
  gapSm: {
    marginTop: 10,
  },
  list: {
    gap: 10,
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  days: {
    width: 70,
    height: 70,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysNum: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 32,
    fontVariant: ['tabular-nums'],
  },
  daysLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textMuted,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.text,
  },
  sub: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  finals: {
    marginTop: 12,
  },
  hint: {
    marginTop: 12,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
  },
  clear: {
    alignSelf: 'center',
    marginTop: 8,
  },
});
