import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { springs, sprung } from '../core/motion';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { IconButton } from '../components/ui/IconButton';
import { LollipopChart } from '../components/ui/LollipopChart';
import { PlateMeter } from '../components/ui/PlateMeter';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { ScienceNote } from '../components/ui/ScienceNote';
import { SkeletonCard } from '../components/ui/Skeleton';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { Stepper } from '../components/ui/Stepper';
import { TaskTimer } from '../components/ui/TaskTimer';
import { cheerLine } from '../core/about';
import { Task, TaskCategory, useTasksStore } from '../core/tasksStore';
import { alpha, colors, dimensionColor, fonts, layout } from '../core/theme';
import { WELLNESS_DIMENSIONS } from '../core/wellness';

const CATEGORIES = WELLNESS_DIMENSIONS;
const TIME_BOXES = [null, 15, 25, 45, 60] as const;

type FilterCategory = TaskCategory | 'all';

export default function TasksScreen() {
  const { width } = useWindowDimensions();
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
  const [category, setCategory] = useState<TaskCategory>('occupational');
  const [timeBudget, setTimeBudget] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterCategory>('all');

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const handleAdd = async () => {
    const ok = await addTask(title, category, timeBudget);
    if (ok) {
      setTitle('');
      setTimeBudget(null);
      if (openCount + 1 > dailyCap) {
        emberSay('That’s past the cap you set. Is there something that could wait?', 'concerned');
      }
    }
  };

  // Only offer filters for the areas that actually have something today.
  const present = useMemo(() => CATEGORIES.filter((c) => tasks.some((t) => t.category === c.key)), [tasks]);
  const filtered = useMemo(() => (filter === 'all' ? tasks : tasks.filter((t) => t.category === filter)), [tasks, filter]);
  const chartWidth = Math.min(width, layout.maxWidth) - layout.gutter * 2 - 36;

  return (
    <Screen
      title="To-dos"
      subtitle={isLoading && tasks.length === 0 ? 'Loading…' : 'Everything that isn’t school. Keep the plate light.'}
      right={<IconButton icon="calendar" label="Calendar" onPress={() => router.push('/calendar')} />}
    >
      <Reveal index={0}>
        <Card style={styles.plateCard}>
          <PlateMeter openCount={openCount} cap={dailyCap} />
          <View style={styles.capRow}>
            <View>
              <Text style={styles.capLabel}>Daily cap</Text>
              <Text style={styles.capHint}>How much you want on the plate</Text>
            </View>
            <Stepper value={dailyCap} onDecrement={() => setDailyCap(dailyCap - 1)} onIncrement={() => setDailyCap(dailyCap + 1)} label="daily cap" />
          </View>
        </Card>
      </Reveal>

      <Reveal index={1}>
        <Section title="Add to the plate">
          <Card>
            <Field placeholder="What needs doing?" value={title} onChangeText={setTitle} returnKeyType="done" onSubmitEditing={handleAdd} />
            <Text style={styles.fieldLabel}>Time box</Text>
            <ChipRow>
              {TIME_BOXES.map((m) => (
                <Chip key={String(m)} label={m == null ? 'None' : `${m} min`} selected={timeBudget === m} onPress={() => setTimeBudget(m)} icon={m == null ? undefined : 'clock'} />
              ))}
            </ChipRow>
            <ScienceNote fact="Parkinson's Law: work expands to fill the time allotted for it. A vague afternoon becomes a vague afternoon of work — but a task boxed at 20 minutes tends to actually take about 20 minutes. Giving something less time rarely makes it worse; it mostly just cuts the padding." />
            <Text style={styles.fieldLabel}>Part of life</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dimRow}>
              {CATEGORIES.map((c) => (
                <Chip key={c.key} label={c.label} dot color={dimensionColor[c.key]} selected={category === c.key} onPress={() => setCategory(c.key)} />
              ))}
            </ScrollView>
            <Button label="Add to plate" icon="plus" loading={isSaving} onPress={handleAdd} disabled={isSaving || !title.trim()} style={styles.addButton} />
            {error ? <Text style={styles.errorText}>Couldn’t save that. Check your connection and try again.</Text> : null}
          </Card>
        </Section>
      </Reveal>

      <Reveal index={2}>
        <Section title="Today" note={tasks.length ? `${tasks.length - openCount} of ${tasks.length} done` : undefined}>
          {present.length > 1 ? (
            <ChipRow style={styles.filters}>
              <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
              {present.map((c) => (
                <Chip key={c.key} label={c.label} dot color={dimensionColor[c.key]} selected={filter === c.key} onPress={() => setFilter(c.key)} />
              ))}
            </ChipRow>
          ) : null}
          {filtered.length > 0 ? (
            <View style={styles.list}>
              {filtered.map((t, i) => (
                <TaskRow key={t.id} task={t} index={i} />
              ))}
            </View>
          ) : isLoading ? (
            <View style={styles.list}>
              <SkeletonCard lines={1} />
              <SkeletonCard lines={1} />
            </View>
          ) : !isLoading ? (
            <EmptyState
              title={tasks.length === 0 ? 'The plate’s empty.' : 'Nothing in this area today.'}
              body={tasks.length === 0 ? 'Add the one thing that matters most today.' : undefined}
            />
          ) : null}
        </Section>
      </Reveal>

      {weekCompletions.some((d) => (d.value ?? 0) > 0) ? (
        <Reveal index={3}>
          <Section title="Done this week">
            <Card>
              <LollipopChart
                data={weekCompletions}
                maxValue={Math.max(1, ...weekCompletions.map((d) => d.value ?? 0))}
                highlightIndex={weekCompletions.length - 1}
                color={colors.secured}
                width={chartWidth}
                height={104}
              />
            </Card>
          </Section>
        </Reveal>
      ) : null}
    </Screen>
  );
}

function TaskRow({ task, index }: { task: Task; index: number }) {
  const toggleComplete = useTasksStore((s) => s.toggleComplete);
  const deleteTask = useTasksStore((s) => s.deleteTask);
  const dim = CATEGORIES.find((c) => c.key === task.category);
  const color = dimensionColor[task.category] ?? colors.flame;

  const toggle = async () => {
    const finishing = !task.completed;
    await toggleComplete(task.id);
    if (finishing) {
      const { tasks } = useTasksStore.getState();
      if (tasks.length > 0 && tasks.every((t) => t.completed)) {
        emberSay(cheerLine('Plate cleared. Every last thing. Go enjoy that.'), 'cheer');
      }
    }
  };

  const check = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(task.completed ? 1 : 0, springs.pop) }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(360)} exiting={FadeOut.duration(180)} layout={sprung(LinearTransition)}>
      <Card style={styles.taskCard}>
        <Pressy
          onPress={toggle}
          depth={0.86}
          haptic="light"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: task.completed }}
          accessibilityLabel={task.title}
          style={[styles.check, task.completed && { backgroundColor: colors.secured, borderColor: colors.secured }]}
        >
          <Animated.View style={check}>
            <Icon name="check" size={18} color={colors.flameInk} strokeWidth={2.6} />
          </Animated.View>
        </Pressy>
        <View style={styles.taskInfo}>
          <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>{task.title}</Text>
          <View style={styles.tagRow}>
            <View style={[styles.tagDot, { backgroundColor: color }]} />
            <Text style={styles.taskCategory}>{dim?.label ?? task.category}</Text>
          </View>
        </View>
        {task.time_budget_minutes && !task.completed ? <TaskTimer budgetMinutes={task.time_budget_minutes} /> : null}
        <Pressy onPress={() => deleteTask(task.id)} hitSlop={10} depth={0.85} accessibilityLabel={`Remove ${task.title}`} style={styles.trash}>
          <Icon name="trash" size={17} color={alpha(colors.danger, 0.8)} />
        </Pressy>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  plateCard: {
    marginTop: 16,
  },
  capRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  capLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  capHint: {
    marginTop: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  fieldLabel: {
    marginTop: 16,
    marginBottom: 8,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  dimRow: {
    gap: 8,
    paddingRight: 8,
  },
  addButton: {
    marginTop: 18,
  },
  errorText: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },
  filters: {
    marginBottom: 12,
  },
  list: {
    gap: 10,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  check: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.text,
  },
  taskTitleDone: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  tagDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  taskCategory: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  trash: {
    padding: 4,
  },
});
