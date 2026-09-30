import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Ring } from '../components/ui/Ring';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { Stepper } from '../components/ui/Stepper';
import { computeTotals, FoodLog, MacroGoals, useNutritionStore } from '../core/nutritionStore';
import { alpha, colors, fonts } from '../core/theme';

const GOAL_STEPS: { key: keyof MacroGoals; label: string; step: number; unit: string }[] = [
  { key: 'calories', label: 'Calories', step: 50, unit: '' },
  { key: 'protein_g', label: 'Protein', step: 5, unit: 'g' },
  { key: 'carbs_g', label: 'Carbs', step: 5, unit: 'g' },
  { key: 'fat_g', label: 'Fat', step: 5, unit: 'g' },
];

const MACRO_COLOR = { protein: '#8CC0A8', carbs: '#E6C46A', fat: '#D99A6C' };

export default function NutritionScreen() {
  const entries = useNutritionStore((s) => s.entries);
  const goals = useNutritionStore((s) => s.goals);
  const isLoading = useNutritionStore((s) => s.isLoading);
  const isSaving = useNutritionStore((s) => s.isSaving);
  const error = useNutritionStore((s) => s.error);
  const fetchToday = useNutritionStore((s) => s.fetchToday);
  const addEntry = useNutritionStore((s) => s.addEntry);
  const setGoals = useNutritionStore((s) => s.setGoals);
  const totals = useMemo(() => computeTotals(entries), [entries]);

  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [editingGoals, setEditingGoals] = useState(false);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const handleAdd = async () => {
    const ok = await addEntry({
      name,
      calories: Number(calories) || 0,
      protein_g: Number(protein) || 0,
      carbs_g: Number(carbs) || 0,
      fat_g: Number(fat) || 0,
    });
    if (ok) {
      setName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
    }
  };

  const caloriePct = goals.calories > 0 ? totals.calories / goals.calories : 0;
  const left = Math.round(goals.calories - totals.calories);

  return (
    <Screen
      title="Food"
      subtitle={isLoading && entries.length === 0 ? 'Loading…' : entries.length === 0 ? 'Nothing logged today.' : `${entries.length} logged today.`}
    >
      <Reveal index={0}>
        <Card style={styles.hero}>
          <Ring
            progress={Math.min(1, caloriePct)}
            value={Math.round(totals.calories).toLocaleString()}
            label={left >= 0 ? `${left.toLocaleString()} left` : `${Math.abs(left).toLocaleString()} over`}
            color={caloriePct > 1.1 ? colors.unlocked : colors.flame}
            size={118}
            stroke={9}
          />
          <View style={styles.macros}>
            <MacroBar label="Protein" value={totals.protein_g} goal={goals.protein_g} color={MACRO_COLOR.protein} />
            <MacroBar label="Carbs" value={totals.carbs_g} goal={goals.carbs_g} color={MACRO_COLOR.carbs} />
            <MacroBar label="Fat" value={totals.fat_g} goal={goals.fat_g} color={MACRO_COLOR.fat} />
          </View>
        </Card>
      </Reveal>

      <Reveal index={1}>
        <Section title="Log a meal" note="Whatever numbers you know. Blanks count as zero.">
          <Card>
            <Field placeholder="What did you eat?" value={name} onChangeText={setName} />
            <View style={styles.grid}>
              <Field containerStyle={styles.cell} label="Calories" placeholder="0" value={calories} onChangeText={setCalories} keyboardType="decimal-pad" />
              <Field containerStyle={styles.cell} label="Protein (g)" placeholder="0" value={protein} onChangeText={setProtein} keyboardType="decimal-pad" />
              <Field containerStyle={styles.cell} label="Carbs (g)" placeholder="0" value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" />
              <Field containerStyle={styles.cell} label="Fat (g)" placeholder="0" value={fat} onChangeText={setFat} keyboardType="decimal-pad" />
            </View>
            <Button label="Log it" icon="plus" loading={isSaving} onPress={handleAdd} disabled={isSaving || !name.trim()} style={styles.addButton} />
            {error ? <Text style={styles.errorText}>Couldn’t save that. Check your connection and try again.</Text> : null}
          </Card>
        </Section>
      </Reveal>

      <Reveal index={2}>
        <Section title="Today">
          {entries.length > 0 ? (
            <View style={styles.list}>
              {entries.map((e, i) => (
                <FoodRow key={e.id} entry={e} index={i} />
              ))}
            </View>
          ) : !isLoading ? (
            <EmptyState title="Nothing logged yet." body="Log a meal above and today’s ring starts to fill." />
          ) : null}
        </Section>
      </Reveal>

      <Reveal index={3}>
        <Section
          title="Daily goals"
          note={`${goals.calories.toLocaleString()} cal, ${goals.protein_g}g protein, ${goals.carbs_g}g carbs, ${goals.fat_g}g fat`}
          action={{ label: editingGoals ? 'Done' : 'Change', onPress: () => setEditingGoals((v) => !v) }}
        >
          {editingGoals ? (
            <Animated.View entering={FadeInDown.duration(260)} exiting={FadeOut.duration(140)}>
              <Card padded={false}>
                {GOAL_STEPS.map((g, i) => (
                  <View key={g.key} style={[styles.goalRow, i > 0 && styles.goalBorder]}>
                    <Text style={styles.goalLabel}>{g.label}</Text>
                    <Stepper
                      value={`${goals[g.key]}${g.unit}`}
                      onDecrement={() => setGoals({ ...goals, [g.key]: Math.max(0, goals[g.key] - g.step) })}
                      onIncrement={() => setGoals({ ...goals, [g.key]: goals[g.key] + g.step })}
                      label={g.label.toLowerCase()}
                      minWidth={64}
                    />
                  </View>
                ))}
              </Card>
            </Animated.View>
          ) : null}
        </Section>
      </Reveal>
    </Screen>
  );
}

function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: withTiming(pct, { duration: 700 }) }] }));
  return (
    <View style={styles.macro}>
      <View style={styles.macroHead}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>
          {Math.round(value)}
          <Text style={styles.macroGoal}>/{goal}g</Text>
        </Text>
      </View>
      <View style={styles.macroTrack}>
        <Animated.View style={[styles.macroFill, { backgroundColor: color }, fill]} />
      </View>
    </View>
  );
}

function FoodRow({ entry, index }: { entry: FoodLog; index: number }) {
  const deleteEntry = useNutritionStore((s) => s.deleteEntry);
  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(340)} exiting={FadeOut.duration(160)} layout={LinearTransition.springify().damping(18)}>
      <Card style={styles.foodCard}>
        <View style={[styles.foodIcon, { backgroundColor: alpha(colors.flame, 0.12) }]}>
          <Icon name="bowl" size={20} color={colors.flame} />
        </View>
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{entry.name}</Text>
          <Text style={styles.foodMeta}>
            {Math.round(entry.calories)} cal, {Math.round(entry.protein_g)}g protein, {Math.round(entry.carbs_g)}g carbs, {Math.round(entry.fat_g)}g fat
          </Text>
        </View>
        <Pressy onPress={() => deleteEntry(entry.id)} hitSlop={10} depth={0.85} accessibilityLabel={`Remove ${entry.name}`} style={styles.trash}>
          <Icon name="trash" size={17} color={alpha(colors.danger, 0.75)} />
        </Pressy>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  macros: {
    flex: 1,
    gap: 12,
  },
  macro: {
    gap: 5,
  },
  macroHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  macroLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
  },
  macroValue: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  macroGoal: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  macroTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.surfaceSunk,
    overflow: 'hidden',
  },
  macroFill: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    transformOrigin: 'left',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  cell: {
    width: '47%',
    flexGrow: 1,
  },
  addButton: {
    marginTop: 16,
  },
  errorText: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },
  list: {
    gap: 10,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  foodIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  foodMeta: {
    marginTop: 3,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textFaint,
  },
  trash: {
    padding: 4,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  goalBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  goalLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
  },
});
