import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Field } from '../components/ui/Field';
import { IconButton } from '../components/ui/IconButton';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { StatTile } from '../components/ui/StatTile';
import { daysUntil, dueLabel } from '../core/dates';
import { type Scholarship, useHubStore } from '../core/hubStore';
import { parseDue } from '../core/scanParser';
import { celebrate } from '../core/celebrateStore';
import { alpha, colors, fonts } from '../core/theme';
import { offerUndo } from '../core/undoStore';

const GOLD = '#E6C46A';
const STATUS: Record<Scholarship['status'], { label: string; color: string }> = {
  todo: { label: 'To apply', color: colors.flame },
  applied: { label: 'Applied', color: '#8FB4E8' },
  won: { label: 'Won', color: colors.secured },
  no: { label: 'Not this one', color: colors.textFaint },
};

function money(n: number) {
  return `$${n.toLocaleString('en-US')}`;
}

// Scholarships: small ones add up, and fewer people apply to them.
export default function ScholarshipsScreen() {
  const list = useHubStore((s) => s.scholarships);
  const save = useHubStore((s) => s.saveScholarship);
  const remove = useHubStore((s) => s.deleteScholarship);
  const [adding, setAdding] = useState(list.length === 0);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');

  const won = list.filter((x) => x.status === 'won').reduce((s, x) => s + (x.amount ?? 0), 0);
  const pending = list.filter((x) => x.status === 'applied').reduce((s, x) => s + (x.amount ?? 0), 0);
  // Most urgent first: open ones by deadline, then ones whose date passed, then applied, won, and not this time.
  const rank = (x: Scholarship) =>
    x.status === 'todo' ? (x.deadline && daysUntil(x.deadline) < 0 ? 1 : 0) : x.status === 'applied' ? 2 : x.status === 'won' ? 3 : 4;
  const sorted = [...list].sort((a, b) => rank(a) - rank(b) || (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999'));

  const add = () => {
    if (!name.trim()) return;
    const amt = parseInt(amount.replace(/[^\d]/g, ''), 10);
    save({ name: name.trim(), amount: Number.isNaN(amt) ? null : amt, deadline: parseDue(date), status: 'todo' });
    setName('');
    setAmount('');
    setDate('');
    setAdding(false);
  };

  return (
    <Screen
      glowColor={GOLD}
      title="Scholarships"
      subtitle="Local and small ones have the fewest applicants."
      right={<IconButton icon="plus" label="Add scholarship" onPress={() => setAdding((a) => !a)} />}
    >
      <Reveal index={0}>
        <View style={styles.stats}>
          <StatTile label="Won" value={money(won)} color={colors.secured} />
          <StatTile label="Waiting to hear" value={money(pending)} color="#8FB4E8" />
        </View>
      </Reveal>
      {adding ? (
        <Animated.View entering={FadeInDown.duration(240)}>
          <Card tint={GOLD} style={styles.gap}>
            <Field value={name} onChangeText={setName} placeholder="Scholarship name" autoCapitalize="words" />
            <View style={styles.row}>
              <Field value={amount} onChangeText={setAmount} placeholder="Amount, e.g. 1000" keyboardType="number-pad" containerStyle={styles.flex} />
              <Field value={date} onChangeText={setDate} placeholder="Due, e.g. 3/1" containerStyle={styles.flex} />
            </View>
            <Button label="Add" icon="plus" onPress={add} disabled={!name.trim()} style={styles.gap} />
          </Card>
        </Animated.View>
      ) : null}
      {list.length === 0 && !adding ? <EmptyState gear="cap" title="None yet." body="Ask your counselor for the local list. It’s usually the best one." /> : null}
      <View style={styles.list}>
        {sorted.map((x) => {
          const d = x.deadline ? daysUntil(x.deadline) : null;
          // Red inside three days, gold inside a week, while it's still open.
          const urgent = x.status === 'todo' && d != null && d >= 0 && d <= 7 ? (d <= 3 ? colors.unlocked : colors.flame) : undefined;
          return (
            <Animated.View key={x.id} entering={FadeInDown.duration(220)} exiting={FadeOut.duration(150)} layout={LinearTransition}>
              <Card tint={x.status === 'won' ? colors.secured : urgent} style={x.status === 'no' ? styles.faded : undefined}>
                <View style={styles.head}>
                  <View style={styles.flex}>
                    <Text style={styles.name}>{x.name}</Text>
                    <Text style={styles.meta}>
                      {x.amount ? money(x.amount) : 'Amount unknown'}
                      {x.deadline ? `, due ${dueLabel(x.deadline)}` : ''}
                    </Text>
                    {x.status === 'todo' && d != null && d <= 14 ? (
                      <Text style={[styles.when, { color: urgent ?? (d < 0 ? colors.textFaint : colors.textMuted) }]}>
                        {d < 0 ? 'Deadline passed. Check if it’s still open.' : d === 0 ? 'Due today' : d === 1 ? 'Due tomorrow' : `${d} days left`}
                      </Text>
                    ) : null}
                  </View>
                  <IconButton
                    icon="trash"
                    label={`Delete ${x.name}`}
                    size={34}
                    color={alpha(colors.danger, 0.7)}
                    onPress={() => {
                      remove(x.id);
                      offerUndo(`Deleted ${x.name}`, () => save(x));
                    }}
                  />
                </View>
                <ChipRow style={styles.gapSm}>
                  {(Object.keys(STATUS) as Scholarship['status'][]).map((k) => (
                    <Chip
                      key={k}
                      label={STATUS[k].label}
                      selected={x.status === k}
                      color={STATUS[k].color}
                      onPress={() => {
                        save({ ...x, status: k });
                        if (k === 'won')
                          celebrate(`You won ${x.amount ? money(x.amount) : x.name}`, 'Real money for school, because you applied.', colors.secured, {
                            key: `scholarship-${x.id}`,
                            win: `Won the ${x.name}`,
                          });
                      }}
                    />
                  ))}
                </ChipRow>
              </Card>
            </Animated.View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  gap: {
    marginTop: 12,
  },
  gapSm: {
    marginTop: 10,
  },
  faded: {
    opacity: 0.6,
  },
  when: {
    marginTop: 3,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  list: {
    gap: 10,
    marginTop: 16,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  meta: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
});
