import { create } from 'zustand';
import { supabase } from './supabase';
import { WellnessDimension } from './wellness';

export type HabitFrequency = 'daily' | 'weekly';

export interface Habit {
  id: string;
  name: string;
  frequency: HabitFrequency;
  category: WellnessDimension;
  target_per_week: number | null;
  archived: boolean;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  log_date: string;
}

function todayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(dateStr: string, delta: number) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + delta);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

// Monday of the week containing dateStr, as a YYYY-MM-DD key.
function weekKey(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const isoDay = (date.getDay() + 6) % 7; // 0 = Monday
  return addDays(dateStr, -isoDay);
}

interface HabitsStore {
  habits: Habit[];
  logs: HabitLog[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchHabits: () => Promise<void>;
  createHabit: (name: string, frequency: HabitFrequency, category: WellnessDimension) => Promise<boolean>;
  archiveHabit: (habitId: string) => Promise<void>;
  toggleLogToday: (habitId: string) => Promise<void>;
  isLoggedToday: (habitId: string) => boolean;
  currentStreak: (habitId: string) => number;
  weekProgress: (habitId: string) => number;
}

export const useHabitsStore = create<HabitsStore>((set, get) => ({
  habits: [],
  logs: [],
  isLoading: false,
  isSaving: false,
  error: null,

  fetchHabits: async () => {
    set({ isLoading: true, error: null });

    const [habitsRes, logsRes] = await Promise.all([
      supabase
        .from('habits')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: true }),
      supabase
        .from('habit_logs')
        .select('id, habit_id, log_date')
        .order('log_date', { ascending: false })
        .limit(500),
    ]);

    if (habitsRes.error) {
      set({ isLoading: false, error: habitsRes.error.message });
      return;
    }
    if (logsRes.error) {
      set({ isLoading: false, error: logsRes.error.message });
      return;
    }

    set({
      isLoading: false,
      habits: (habitsRes.data as Habit[]) ?? [],
      logs: (logsRes.data as HabitLog[]) ?? [],
    });
  },

  createHabit: async (name, frequency, category) => {
    if (!name.trim()) return false;
    set({ isSaving: true, error: null });

    const { error } = await supabase.from('habits').insert({
      name: name.trim(),
      frequency,
      category,
      target_per_week: frequency === 'weekly' ? 3 : null,
    });

    if (error) {
      set({ isSaving: false, error: error.message });
      return false;
    }

    set({ isSaving: false });
    await get().fetchHabits();
    return true;
  },

  archiveHabit: async (habitId) => {
    set({ error: null });

    const { error } = await supabase.from('habits').update({ archived: true }).eq('id', habitId);

    if (error) {
      set({ error: error.message });
      return;
    }

    await get().fetchHabits();
  },

  toggleLogToday: async (habitId) => {
    const today = todayDateString();
    const alreadyLogged = get().isLoggedToday(habitId);

    if (alreadyLogged) {
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', habitId)
        .eq('log_date', today);
      if (error) {
        set({ error: error.message });
        return;
      }
    } else {
      const { error } = await supabase
        .from('habit_logs')
        .insert({ habit_id: habitId, log_date: today });
      if (error) {
        set({ error: error.message });
        return;
      }
    }

    await get().fetchHabits();
  },

  isLoggedToday: (habitId) => {
    const today = todayDateString();
    return get().logs.some((l) => l.habit_id === habitId && l.log_date === today);
  },

  currentStreak: (habitId) => {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return 0;
    const logDates = new Set(get().logs.filter((l) => l.habit_id === habitId).map((l) => l.log_date));

    if (habit.frequency === 'daily') {
      const today = todayDateString();
      let cursor = logDates.has(today) ? today : addDays(today, -1);
      let streak = 0;
      while (logDates.has(cursor)) {
        streak += 1;
        cursor = addDays(cursor, -1);
      }
      return streak;
    }

    // Weekly: count consecutive weeks (ending this week) meeting the target.
    const target = habit.target_per_week ?? 1;
    const weekCounts = new Map<string, number>();
    for (const date of logDates) {
      const key = weekKey(date);
      weekCounts.set(key, (weekCounts.get(key) ?? 0) + 1);
    }
    let cursor = weekKey(todayDateString());
    let streak = 0;
    while ((weekCounts.get(cursor) ?? 0) >= target) {
      streak += 1;
      cursor = addDays(cursor, -7);
    }
    return streak;
  },

  weekProgress: (habitId) => {
    const logDates = get().logs.filter((l) => l.habit_id === habitId).map((l) => l.log_date);
    const thisWeek = weekKey(todayDateString());
    return logDates.filter((d) => weekKey(d) === thisWeek).length;
  },
}));
