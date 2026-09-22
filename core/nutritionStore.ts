import { create } from 'zustand';
import { supabase } from './supabase';

export interface FoodLog {
  id: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  logged_date: string;
  created_at: string;
}

export interface MacroGoals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

const DEFAULT_GOALS: MacroGoals = { calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 65 };

function todayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computeTotals(entries: FoodLog[]): MacroGoals {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein_g: acc.protein_g + e.protein_g,
      carbs_g: acc.carbs_g + e.carbs_g,
      fat_g: acc.fat_g + e.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
}

interface NutritionStore {
  entries: FoodLog[];
  goals: MacroGoals;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchToday: () => Promise<void>;
  addEntry: (entry: { name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }) => Promise<boolean>;
  deleteEntry: (id: string) => Promise<void>;
  setGoals: (goals: MacroGoals) => Promise<void>;
}

export const useNutritionStore = create<NutritionStore>((set, get) => ({
  entries: [],
  goals: DEFAULT_GOALS,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchToday: async () => {
    set({ isLoading: true, error: null });
    const today = todayDateString();

    const [entriesRes, goalsRes] = await Promise.all([
      supabase
        .from('food_logs')
        .select('*')
        .eq('logged_date', today)
        .order('created_at', { ascending: true }),
      supabase.from('macro_goals').select('*').eq('id', true).maybeSingle(),
    ]);

    if (entriesRes.error) {
      set({ isLoading: false, error: entriesRes.error.message });
      return;
    }

    set({
      isLoading: false,
      entries: (entriesRes.data as FoodLog[]) ?? [],
      goals: goalsRes.data
        ? {
            calories: goalsRes.data.calories,
            protein_g: goalsRes.data.protein_g,
            carbs_g: goalsRes.data.carbs_g,
            fat_g: goalsRes.data.fat_g,
          }
        : DEFAULT_GOALS,
    });
  },

  addEntry: async (entry) => {
    if (!entry.name.trim()) return false;
    set({ isSaving: true, error: null });

    const { error } = await supabase.from('food_logs').insert({
      name: entry.name.trim(),
      calories: entry.calories,
      protein_g: entry.protein_g,
      carbs_g: entry.carbs_g,
      fat_g: entry.fat_g,
      logged_date: todayDateString(),
    });

    if (error) {
      set({ isSaving: false, error: error.message });
      return false;
    }

    set({ isSaving: false });
    await get().fetchToday();
    return true;
  },

  deleteEntry: async (id) => {
    set({ error: null });
    const { error } = await supabase.from('food_logs').delete().eq('id', id);
    if (error) {
      set({ error: error.message });
      return;
    }
    await get().fetchToday();
  },

  setGoals: async (goals) => {
    set({ goals });
    const { error } = await supabase
      .from('macro_goals')
      .upsert({ id: true, ...goals, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (error) {
      set({ error: error.message });
    }
  },
}));
