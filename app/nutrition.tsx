import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { RadialGauge } from '../components/ui/RadialGauge';
import { SegmentedBar } from '../components/ui/SegmentedBar';
import { colors, fonts, gaugeColor, radii, spacing } from '../core/theme';
import { useAdaptiveGradient } from '../core/adaptiveLight';
import { computeTotals, FoodLog, MacroGoals, useNutritionStore } from '../core/nutritionStore';

const GOAL_STEPS: { key: keyof MacroGoals; label: string; step: number; unit: string }[] = [
  { key: 'calories', label: 'Calories', step: 50, unit: '' },
  { key: 'protein_g', label: 'Protein', step: 5, unit: 'g' },
  { key: 'carbs_g', label: 'Carbs', step: 5, unit: 'g' },
  { key: 'fat_g', label: 'Fat', step: 5, unit: 'g' },
];

export default function NutritionScreen() {
  const { gradient } = useAdaptiveGradient();
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

  const caloriePct = goals.calories > 0 ? Math.round((totals.calories / goals.calories) * 100) : 0;

  return (
    <View style={styles.outer}>
      <LinearGradient colors={gradient} style={styles.gradient}>
        <ScrollView style={styles.root} contentContainerStyle={styles.content}>
          <Button label="Back" variant="pill" onPress={() => router.back()} style={styles.back} />

          <Text style={styles.title}>Nutrition</Text>
          <Text style={styles.subtitle}>
            {isLoading ? 'Loading…' : `${entries.length} logged today`}
          </Text>

          <Card style={styles.glanceCard}>
            <View style={styles.glanceTop}>
              <RadialGauge
                size={96}
                strokeWidth={9}
                value={Math.min(100, caloriePct)}
                label={`${Math.round(totals.calories)}`}
                caption={`of ${goals.calories} cal`}
                color={gaugeColor(100 - Math.abs(100 - caloriePct))}
              />
              <View style={styles.macroStats}>
                <MacroStat label="Protein" value={totals.protein_g} goal={goals.protein_g} />
                <MacroStat label="Carbs" value={totals.carbs_g} goal={goals.carbs_g} />
                <MacroStat label="Fat" value={totals.fat_g} goal={goals.fat_g} />
              </View>
            </View>

            <SegmentedBar
              segments={[
                { label: 'Protein', value: totals.protein_g * 4, color: colors.secured },
                { label: 'Carbs', value: totals.carbs_g * 4, color: colors.leather },
                { label: 'Fat', value: totals.fat_g * 9, color: colors.lantern },
              ]}
            />
          </Card>

          <Card style={styles.goalsCard}>
            <Text style={styles.sectionLabel}>Daily Goals</Text>
            {GOAL_STEPS.map((g) => (
              <View key={g.key} style={styles.goalRow}>
                <Text style={styles.goalLabel}>{g.label}</Text>
                <View style={styles.capStepper}>
                  <Pressable
                    onPress={() => setGoals({ ...goals, [g.key]: Math.max(0, goals[g.key] - g.step) })}
                    style={styles.capButton}
                  >
                    <Text style={styles.capButtonText}>−</Text>
                  </Pressable>
                  <Text style={styles.goalValue}>
                    {goals[g.key]}
                    {g.unit}
                  </Text>
                  <Pressable
                    onPress={() => setGoals({ ...goals, [g.key]: goals[g.key] + g.step })}
                    style={styles.capButton}
                  >
                    <Text style={styles.capButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </Card>

          <Card style={styles.addCard}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Grilled chicken bowl"
              placeholderTextColor={colors.hint}
              value={name}
              onChangeText={setName}
            />
            <View style={styles.macroInputRow}>
              <TextInput
                style={[styles.input, styles.macroInput]}
                placeholder="Cal"
                placeholderTextColor={colors.hint}
                value={calories}
                onChangeText={setCalories}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, styles.macroInput]}
                placeholder="Protein g"
                placeholderTextColor={colors.hint}
                value={protein}
                onChangeText={setProtein}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.macroInputRow}>
              <TextInput
                style={[styles.input, styles.macroInput]}
                placeholder="Carbs g"
                placeholderTextColor={colors.hint}
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, styles.macroInput]}
                placeholder="Fat g"
                placeholderTextColor={colors.hint}
                value={fat}
                onChangeText={setFat}
                keyboardType="decimal-pad"
              />
            </View>
            <Button
              label={isSaving ? 'Adding…' : 'Add Food'}
              onPress={handleAdd}
              disabled={isSaving || !name.trim()}
              style={styles.addButton}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </Card>

          {entries.length > 0 ? (
            <View style={styles.list}>
              {entries.map((e) => (
                <FoodRow key={e.id} entry={e} />
              ))}
            </View>
          ) : !isLoading ? (
            <Text style={styles.hint}>Log a meal above to start tracking today's macros.</Text>
          ) : null}
        </ScrollView>

        <BottomNav />
      </LinearGradient>
    </View>
  );
}

function MacroStat({ label, value, goal }: { label: string; value: number; goal: number }) {
  return (
    <View style={styles.macroStatRow}>
      <Text style={styles.macroStatLabel}>{label}</Text>
      <Text style={styles.macroStatValue}>
        {Math.round(value)}
        <Text style={styles.macroStatGoal}>/{goal}g</Text>
      </Text>
    </View>
  );
}

function FoodRow({ entry }: { entry: FoodLog }) {
  const deleteEntry = useNutritionStore((s) => s.deleteEntry);
  return (
    <Card style={styles.foodCard}>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{entry.name}</Text>
        <Text style={styles.foodMeta}>
          {Math.round(entry.calories)} cal · P{Math.round(entry.protein_g)} C{Math.round(entry.carbs_g)} F
          {Math.round(entry.fat_g)}
        </Text>
      </View>
      <Pressable onPress={() => deleteEntry(entry.id)} hitSlop={8}>
        <Text style={styles.removeText}>Remove</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradient: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: 100,
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.ink,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.inkFaint,
  },
  glanceCard: {
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  glanceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  macroStats: {
    flex: 1,
    marginLeft: spacing.lg,
    gap: spacing.xs,
  },
  macroStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroStatLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.inkFaint,
  },
  macroStatValue: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.ink,
  },
  macroStatGoal: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkFaint,
  },
  goalsCard: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.inkFaint,
    marginBottom: spacing.xs,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalLabel: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
  },
  capStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  capButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  capButtonText: {
    fontFamily: fonts.mono,
    fontSize: 15,
    color: colors.ink,
  },
  goalValue: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.ink,
    minWidth: 44,
    textAlign: 'center',
  },
  addCard: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  input: {
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
    borderRadius: radii.lg,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.background,
  },
  macroInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  macroInput: {
    flex: 1,
  },
  addButton: {
    marginTop: spacing.xs,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.danger,
  },
  list: {
    gap: spacing.sm,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  foodInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  foodName: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  foodMeta: {
    marginTop: 2,
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkFaint,
  },
  removeText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.danger,
  },
  hint: {
    marginTop: spacing.xl,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.hint,
  },
});
