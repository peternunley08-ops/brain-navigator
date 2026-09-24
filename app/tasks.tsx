import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LollipopChart } from '../components/ui/LollipopChart';
import { PlateMeter } from '../components/ui/PlateMeter';
import { ScienceNote } from '../components/ui/ScienceNote';
import { TaskTimer } from '../components/ui/TaskTimer';
import { colors, fonts, radii, spacing } from '../core/theme';
import { useAdaptiveGradient } from '../core/adaptiveLight';
import { Task, TaskCategory, useTasksStore } from '../core/tasksStore';
import { WELLNESS_DIMENSIONS } from '../core/wellness';

const CATEGORIES = WELLNESS_DIMENSIONS;

type FilterCategory = TaskCategory | 'all';

export default function TasksScreen() {
  const { gradient } = useAdaptiveGradient();
  const tasks = useTasksStore((s) => s.tasks);
  const dailyCap = useTasksStore((s) => s.dailyCap);
  const isLoading = useTasksStore((s) => s.isLoading);
  const isSaving = useTasksStore((s) => s.isSaving);
  const error = useTasksStore((s) => s.error);
  const fetchToday = useTasksStore((s) => s.fetchToday);
  const addTask = useTasksStore((s) => s.addTask);
  const setDailyCap = useTasksStore((s) => s.setDailyCap);
  const openCount = useTasksStore((s) => s.openCount());
  const weekCompletions = useTasksStore((s) => s.weekCompletions);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('emotional');
  const [timeBudget, setTimeBudget] = useState('');
  const [filter, setFilter] = useState<FilterCategory>('all');

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const handleAdd = async () => {
    const budget = timeBudget.trim() ? Number(timeBudget) : null;
    const ok = await addTask(title, category, Number.isFinite(budget) ? budget : null);
    if (ok) {
      setTitle('');
      setTimeBudget('');
    }
  };

  const filtered = useMemo(
    () => (filter === 'all' ? tasks : tasks.filter((t) => t.category === filter)),
    [tasks, filter]
  );

  return (
    <View style={styles.outer}>
      <LinearGradient colors={gradient} style={styles.gradient}>
        <ScrollView style={styles.root} contentContainerStyle={styles.content}>
          <View style={styles.topRow}>
            <Button label="Back" variant="pill" onPress={() => router.back()} style={styles.back} />
            <Button label="Calendar" variant="pill" onPress={() => router.push('/calendar')} />
          </View>

          <Text style={styles.title}>Today's Plate</Text>
          <Text style={styles.subtitle}>{isLoading ? 'Loading…' : 'How much are you carrying today?'}</Text>

          <Card style={styles.meterCard}>
            <PlateMeter openCount={openCount} cap={dailyCap} />
            <View style={styles.capRow}>
              <Text style={styles.capLabel}>Daily cap</Text>
              <View style={styles.capStepper}>
                <Pressable
                  onPress={() => setDailyCap(dailyCap - 1)}
                  style={styles.capButton}
                  accessibilityLabel="Decrease daily cap"
                >
                  <Text style={styles.capButtonText}>−</Text>
                </Pressable>
                <Text style={styles.capValue}>{dailyCap}</Text>
                <Pressable
                  onPress={() => setDailyCap(dailyCap + 1)}
                  style={styles.capButton}
                  accessibilityLabel="Increase daily cap"
                >
                  <Text style={styles.capButtonText}>+</Text>
                </Pressable>
              </View>
            </View>
          </Card>

          {weekCompletions.some((d) => (d.value ?? 0) > 0) ? (
            <Card style={styles.weekCard}>
              <Text style={styles.weekLabel}>Completed this week</Text>
              <LollipopChart
                data={weekCompletions}
                maxValue={Math.max(1, ...weekCompletions.map((d) => d.value ?? 0))}
                highlightIndex={weekCompletions.length - 1}
                color={colors.secured}
                width={300}
                height={100}
              />
            </Card>
          ) : null}

          <Card style={styles.addCard}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Reply to landlord"
              placeholderTextColor={colors.hint}
              value={title}
              onChangeText={setTitle}
            />
            <ScienceNote fact="Parkinson's Law: work expands to fill the time allotted for it. A vague afternoon becomes a vague afternoon of work — but a task boxed at 20 minutes tends to actually take about 20 minutes. Giving something less time rarely makes it worse; it mostly just cuts the padding." />
            <TextInput
              style={[styles.input, styles.timeBudgetInput]}
              placeholder="Time box in minutes (optional)"
              placeholderTextColor={colors.hint}
              value={timeBudget}
              onChangeText={setTimeBudget}
              keyboardType="number-pad"
            />
            <View style={styles.categoryRow}>
              {CATEGORIES.map((c) => {
                const active = category === c.key;
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => setCategory(c.key)}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                  >
                    <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Button
              label={isSaving ? 'Adding…' : 'Add Task'}
              onPress={handleAdd}
              disabled={isSaving || !title.trim()}
              style={styles.addButton}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </Card>

          <View style={styles.filterRow}>
            <FilterChip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
            {CATEGORIES.map((c) => (
              <FilterChip
                key={c.key}
                label={c.label}
                active={filter === c.key}
                onPress={() => setFilter(c.key)}
              />
            ))}
          </View>

          {filtered.length > 0 ? (
            <View style={styles.list}>
              {filtered.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </View>
          ) : !isLoading ? (
            <Text style={styles.hint}>
              {tasks.length === 0 ? 'Nothing on the plate yet — add something above.' : 'Nothing in this category today.'}
            </Text>
          ) : null}
        </ScrollView>

        <BottomNav />
      </LinearGradient>
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filterChip, active && styles.filterChipActive]}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function TaskRow({ task }: { task: Task }) {
  const toggleComplete = useTasksStore((s) => s.toggleComplete);
  const deleteTask = useTasksStore((s) => s.deleteTask);
  const categoryLabel = CATEGORIES.find((c) => c.key === task.category)?.label ?? task.category;

  return (
    <Card style={styles.taskCard}>
      <Pressable
        onPress={() => toggleComplete(task.id)}
        style={[styles.checkCircle, task.completed && styles.checkCircleActive]}
      >
        {task.completed ? <Text style={styles.checkMark}>✓</Text> : null}
      </Pressable>
      <View style={styles.taskInfo}>
        <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>{task.title}</Text>
        <Text style={styles.taskCategory}>{categoryLabel}</Text>
      </View>
      <View style={styles.taskActions}>
        {task.time_budget_minutes ? <TaskTimer budgetMinutes={task.time_budget_minutes} /> : null}
        <Pressable onPress={() => deleteTask(task.id)} hitSlop={8}>
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      </View>
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
  topRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    rowGap: spacing.sm,
    marginBottom: spacing.lg,
  },
  back: {},
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.ink,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
  },
  meterCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  capRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.md,
  },
  capLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
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
  capValue: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.ink,
    minWidth: 20,
    textAlign: 'center',
  },
  weekCard: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  weekLabel: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.ink,
  },
  addCard: {
    marginTop: spacing.lg,
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
  timeBudgetInput: {
    fontSize: 13,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.background,
  },
  categoryChipActive: {
    backgroundColor: colors.leather,
    borderColor: colors.leather,
  },
  categoryChipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  categoryChipTextActive: {
    color: colors.background,
  },
  addButton: {
    marginTop: spacing.xs,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.danger,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.backgroundAlt,
  },
  filterChipActive: {
    backgroundColor: colors.leather,
    borderColor: colors.leather,
  },
  filterChipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  filterChipTextActive: {
    color: colors.background,
  },
  list: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    marginRight: spacing.md,
  },
  checkCircleActive: {
    backgroundColor: colors.secured,
    borderColor: colors.secured,
  },
  checkMark: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.background,
  },
  taskInfo: {
    flex: 1,
  },
  taskActions: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  taskTitle: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  taskTitleDone: {
    color: colors.hint,
    textDecorationLine: 'line-through',
  },
  taskCategory: {
    marginTop: 2,
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.inkFaint,
  },
  removeText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.danger,
  },
  hint: {
    marginTop: spacing.xl,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.hint,
  },
});
