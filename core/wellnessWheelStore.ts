import { create } from 'zustand';
import { supabase } from './supabase';
import { WELLNESS_DIMENSIONS, WellnessDimension } from './wellness';

const TASK_HABIT_WINDOW_DAYS = 30;
const CHECKIN_WINDOW_DAYS = 14;

interface RawTask {
  category: WellnessDimension;
  completed: boolean;
}

interface RawHabit {
  id: string;
  category: WellnessDimension;
  frequency: 'daily' | 'weekly';
  target_per_week: number | null;
}

interface RawLog {
  habit_id: string;
  log_date: string;
}

interface RawCheckin {
  mood: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
}

interface RawEntry {
  state: 'secured' | 'shelved' | 'unlocked';
}

// Local YYYY-MM-DD, built from local date fields rather than
// toISOString() — toISOString() converts to UTC first, which silently
// shifts the date by one day for any timezone ahead of UTC (e.g. this
// would undercount the window by a day in Tokyo or Auckland).
function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// A single habit's 0–1 consistency over the trailing window: daily habits
// look at fraction of days logged; weekly habits look at logs against the
// target the user set, prorated for the window.
function habitConsistency(habit: RawHabit, logs: RawLog[]): number {
  const habitLogs = logs.filter((l) => l.habit_id === habit.id);
  if (habit.frequency === 'daily') {
    return Math.min(1, habitLogs.length / TASK_HABIT_WINDOW_DAYS);
  }
  const target = habit.target_per_week ?? 1;
  const expectedLogs = target * (TASK_HABIT_WINDOW_DAYS / 7);
  return Math.min(1, habitLogs.length / expectedLogs);
}

// Blends task completion rate and habit consistency for a dimension —
// equal weight if both exist, whichever is present if only one does, and
// null (not a fabricated 0) if neither has any data at all.
function taskHabitScore(
  dimension: WellnessDimension,
  tasks: RawTask[],
  habits: RawHabit[],
  logs: RawLog[]
): number | null {
  const dimTasks = tasks.filter((t) => t.category === dimension);
  const dimHabits = habits.filter((h) => h.category === dimension);

  const taskScore =
    dimTasks.length > 0
      ? (dimTasks.filter((t) => t.completed).length / dimTasks.length) * 100
      : null;

  const habitScore =
    dimHabits.length > 0
      ? (average(dimHabits.map((h) => habitConsistency(h, logs))) ?? 0) * 100
      : null;

  const parts = [taskScore, habitScore].filter((v): v is number => v !== null);
  return parts.length > 0 ? average(parts) : null;
}

function emotionalExtra(checkins: RawCheckin[], entries: RawEntry[]): number | null {
  const moods = checkins.map((c) => c.mood).filter((m): m is number => m !== null);
  const moodScore = moods.length > 0 ? (average(moods)! - 1) / 4 * 100 : null;

  const resolutionScore =
    entries.length > 0 ? (entries.filter((e) => e.state === 'secured').length / entries.length) * 100 : null;

  const parts = [moodScore, resolutionScore].filter((v): v is number => v !== null);
  return parts.length > 0 ? average(parts) : null;
}

function physicalExtra(checkins: RawCheckin[]): number | null {
  const hours = checkins.map((c) => c.sleep_hours).filter((h): h is number => h !== null);
  // Scored against 8h as the ideal, tapering off the further the average drifts.
  const hoursScore = hours.length > 0 ? Math.max(0, 100 - Math.abs(average(hours)! - 8) * 15) : null;

  const quality = checkins.map((c) => c.sleep_quality).filter((q): q is number => q !== null);
  const qualityScore = quality.length > 0 ? (average(quality)! - 1) / 4 * 100 : null;

  const parts = [hoursScore, qualityScore].filter((v): v is number => v !== null);
  return parts.length > 0 ? average(parts) : null;
}

interface WellnessWheelStore {
  scores: Record<WellnessDimension, number | null>;
  isLoading: boolean;
  error: string | null;
  fetchScores: () => Promise<void>;
  overallScore: () => number | null;
}

const emptyScores = Object.fromEntries(
  WELLNESS_DIMENSIONS.map((d) => [d.key, null])
) as Record<WellnessDimension, number | null>;

export const useWellnessWheelStore = create<WellnessWheelStore>((set, get) => ({
  scores: emptyScores,
  isLoading: false,
  error: null,

  fetchScores: async () => {
    set({ isLoading: true, error: null });

    const taskWindowStart = daysAgoISO(TASK_HABIT_WINDOW_DAYS);
    const checkinWindowStart = daysAgoISO(CHECKIN_WINDOW_DAYS);

    const [tasksRes, habitsRes, logsRes, checkinsRes, entriesRes] = await Promise.all([
      supabase.from('tasks').select('category, completed').gte('planned_date', taskWindowStart),
      supabase.from('habits').select('id, category, frequency, target_per_week').eq('archived', false),
      supabase.from('habit_logs').select('habit_id, log_date').gte('log_date', taskWindowStart),
      supabase
        .from('daily_checkins')
        .select('mood, sleep_hours, sleep_quality')
        .gte('checkin_date', checkinWindowStart),
      supabase.from('cognitive_state').select('state').gte('created_at', taskWindowStart),
    ]);

    const firstError = [tasksRes, habitsRes, logsRes, checkinsRes, entriesRes].find((r) => r.error);
    if (firstError?.error) {
      set({ isLoading: false, error: firstError.error.message });
      return;
    }

    const tasks = (tasksRes.data as RawTask[]) ?? [];
    const habits = (habitsRes.data as RawHabit[]) ?? [];
    const logs = (logsRes.data as RawLog[]) ?? [];
    const checkins = (checkinsRes.data as RawCheckin[]) ?? [];
    const entries = (entriesRes.data as RawEntry[]) ?? [];

    const scores = Object.fromEntries(
      WELLNESS_DIMENSIONS.map((d) => {
        const base = taskHabitScore(d.key, tasks, habits, logs);
        const extra =
          d.key === 'emotional'
            ? emotionalExtra(checkins, entries)
            : d.key === 'physical'
              ? physicalExtra(checkins)
              : null;

        const parts = [base, extra].filter((v): v is number => v !== null);
        const score = parts.length > 0 ? Math.round(average(parts)!) : null;
        return [d.key, score];
      })
    ) as Record<WellnessDimension, number | null>;

    set({ isLoading: false, scores });
  },

  overallScore: () => {
    const values = Object.values(get().scores).filter((v): v is number => v !== null);
    return values.length > 0 ? Math.round(average(values)!) : null;
  },
}));
