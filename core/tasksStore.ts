import { create } from 'zustand';
import { archiveNotionPage, createNotionPage, NOTION_DB, notionProp, updateNotionPage } from './notion';
import { supabase } from './supabase';
import { WellnessDimension } from './wellness';

export type TaskCategory = WellnessDimension;

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  planned_date: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  notion_page_id: string | null;
  time_budget_minutes: number | null;
}

const DEFAULT_DAILY_CAP = 6;
const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export interface DayCompletion {
  label: string;
  value: number | null;
}

function todayDateString(offsetDays = 0) {
  const now = new Date();
  now.setDate(now.getDate() + offsetDays);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface TasksStore {
  tasks: Task[];
  dailyCap: number;
  weekCompletions: DayCompletion[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchToday: () => Promise<void>;
  addTask: (title: string, category: TaskCategory, timeBudgetMinutes?: number | null) => Promise<boolean>;
  toggleComplete: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  setDailyCap: (cap: number) => Promise<void>;
  openCount: () => number;
}

export const useTasksStore = create<TasksStore>((set, get) => ({
  tasks: [],
  dailyCap: DEFAULT_DAILY_CAP,
  weekCompletions: [],
  isLoading: false,
  isSaving: false,
  error: null,

  fetchToday: async () => {
    set({ isLoading: true, error: null });
    const today = todayDateString();
    const weekStart = todayDateString(-6);

    const [tasksRes, capRes, weekRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('planned_date', today)
        .order('created_at', { ascending: true }),
      supabase.from('plate_settings').select('daily_cap').eq('id', true).maybeSingle(),
      supabase
        .from('tasks')
        .select('planned_date, completed')
        .gte('planned_date', weekStart)
        .lte('planned_date', today),
    ]);

    if (tasksRes.error) {
      set({ isLoading: false, error: tasksRes.error.message });
      return;
    }

    const weekRows = (weekRes.data as { planned_date: string; completed: boolean }[]) ?? [];
    const weekCompletions: DayCompletion[] = Array.from({ length: 7 }, (_, i) => {
      const date = todayDateString(-6 + i);
      const count = weekRows.filter((r) => r.planned_date === date && r.completed).length;
      const dayIndex = new Date(`${date}T00:00:00`).getDay();
      return { label: DAY_LABELS[dayIndex], value: count };
    });

    set({
      isLoading: false,
      tasks: (tasksRes.data as Task[]) ?? [],
      dailyCap: capRes.data?.daily_cap ?? DEFAULT_DAILY_CAP,
      weekCompletions,
    });
  },

  addTask: async (title, category, timeBudgetMinutes) => {
    if (!title.trim()) return false;
    set({ isSaving: true, error: null });

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: title.trim(),
        category,
        planned_date: todayDateString(),
        time_budget_minutes: timeBudgetMinutes ?? null,
      })
      .select()
      .single();

    if (error) {
      set({ isSaving: false, error: error.message });
      return false;
    }

    set({ isSaving: false });
    await get().fetchToday();

    const pageId = await createNotionPage(NOTION_DB.tasks, {
      Name: notionProp.title(data.title),
      Category: notionProp.select(data.category),
      Completed: notionProp.checkbox(false),
      'Planned Date': notionProp.date(data.planned_date),
    });
    if (pageId) {
      await supabase.from('tasks').update({ notion_page_id: pageId }).eq('id', data.id);
      await get().fetchToday();
    }

    return true;
  },

  toggleComplete: async (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const completed = !task.completed;

    const { error } = await supabase
      .from('tasks')
      .update({ completed, completed_at: completed ? new Date().toISOString() : null })
      .eq('id', taskId);

    if (error) {
      set({ error: error.message });
      return;
    }

    await get().fetchToday();

    if (task.notion_page_id) {
      await updateNotionPage(task.notion_page_id, { Completed: notionProp.checkbox(completed) });
    }
  },

  deleteTask: async (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    set({ error: null });

    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) {
      set({ error: error.message });
      return;
    }

    await get().fetchToday();

    if (task.notion_page_id) {
      await archiveNotionPage(task.notion_page_id);
    }
  },

  setDailyCap: async (cap) => {
    const clamped = Math.max(1, Math.min(20, cap));
    set({ dailyCap: clamped });

    const { error } = await supabase
      .from('plate_settings')
      .upsert({ id: true, daily_cap: clamped, updated_at: new Date().toISOString() }, { onConflict: 'id' });

    if (error) {
      set({ error: error.message });
    }
  },

  openCount: () => get().tasks.filter((t) => !t.completed).length,
}));
