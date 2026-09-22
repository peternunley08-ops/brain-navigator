import {
  CategoryValueNotApplicable,
  CategoryValueSleepAnalysis,
  getMostRecentQuantitySample,
  isHealthDataAvailableAsync,
  queryCategorySamples,
  queryStatisticsCollectionForQuantity,
  queryStatisticsForQuantity,
  requestAuthorization,
  saveCategorySample,
} from '@kingstinct/react-native-healthkit';
import { create } from 'zustand';

const READ_TYPES = [
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKCategoryTypeIdentifierSleepAnalysis',
] as const;

const SHARE_TYPES = ['HKCategoryTypeIdentifierMindfulSession'] as const;

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export interface SleepStageMinutes {
  core: number;
  deep: number;
  rem: number;
  unspecified: number;
}

export interface DayValue {
  label: string;
  value: number | null;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function eighteenHoursAgo() {
  return new Date(Date.now() - 18 * 60 * 60 * 1000);
}

function sevenDaysAgo() {
  const d = startOfToday();
  d.setDate(d.getDate() - 6);
  return d;
}

interface HealthStore {
  isAvailable: boolean | null;
  isAuthorized: boolean;
  stepsToday: number | null;
  restingHeartRate: number | null;
  sleepHoursLastNight: number | null;
  sleepStages: SleepStageMinutes | null;
  stepsWeek: DayValue[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  connect: () => Promise<void>;
  fetchToday: () => Promise<void>;
  logMindfulMinutes: (minutes: number) => Promise<boolean>;
}

export const useHealthStore = create<HealthStore>((set, get) => ({
  isAvailable: null,
  isAuthorized: false,
  stepsToday: null,
  restingHeartRate: null,
  sleepHoursLastNight: null,
  sleepStages: null,
  stepsWeek: [],
  isLoading: false,
  isSaving: false,
  error: null,

  connect: async () => {
    set({ error: null });

    try {
      const available = await isHealthDataAvailableAsync();
      set({ isAvailable: available });
      if (!available) {
        set({ error: 'Health data is not available on this device.' });
        return;
      }

      await requestAuthorization({ toRead: [...READ_TYPES], toShare: [...SHARE_TYPES] });
      set({ isAuthorized: true });
      await get().fetchToday();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Could not connect to Health' });
    }
  },

  fetchToday: async () => {
    set({ isLoading: true, error: null });

    try {
      const [stepsRes, heartRateSample, sleepSamples, stepsWeekRes] = await Promise.all([
        queryStatisticsForQuantity('HKQuantityTypeIdentifierStepCount', ['cumulativeSum'], {
          filter: { date: { startDate: startOfToday(), endDate: new Date() } },
        }),
        getMostRecentQuantitySample('HKQuantityTypeIdentifierRestingHeartRate'),
        queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', {
          filter: { date: { startDate: eighteenHoursAgo(), endDate: new Date() } },
          limit: 0,
          ascending: true,
        }),
        queryStatisticsCollectionForQuantity(
          'HKQuantityTypeIdentifierStepCount',
          ['cumulativeSum'],
          startOfToday(),
          { day: 1 },
          { filter: { date: { startDate: sevenDaysAgo(), endDate: new Date() } } }
        ),
      ]);

      const stageMinutes = (values: number[]) =>
        sleepSamples
          .filter((s) => values.includes(s.value))
          .reduce((total, s) => total + (s.endDate.getTime() - s.startDate.getTime()) / 60000, 0);

      const sleepStages: SleepStageMinutes = {
        core: stageMinutes([CategoryValueSleepAnalysis.asleepCore]),
        deep: stageMinutes([CategoryValueSleepAnalysis.asleepDeep]),
        rem: stageMinutes([CategoryValueSleepAnalysis.asleepREM]),
        unspecified: stageMinutes([CategoryValueSleepAnalysis.asleepUnspecified]),
      };
      const totalSleepMinutes =
        sleepStages.core + sleepStages.deep + sleepStages.rem + sleepStages.unspecified;

      const stepsWeek: DayValue[] = stepsWeekRes.map((day, i) => {
        const d = new Date(sevenDaysAgo());
        d.setDate(d.getDate() + i);
        return { label: DAY_LABELS[d.getDay()], value: day.sumQuantity?.quantity ?? null };
      });

      set({
        isLoading: false,
        stepsToday: stepsRes.sumQuantity?.quantity ?? null,
        restingHeartRate: heartRateSample?.quantity ?? null,
        sleepHoursLastNight:
          totalSleepMinutes > 0 ? Math.round((totalSleepMinutes / 60) * 10) / 10 : null,
        sleepStages: totalSleepMinutes > 0 ? sleepStages : null,
        stepsWeek,
      });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Could not load Health data' });
    }
  },

  logMindfulMinutes: async (minutes) => {
    set({ isSaving: true, error: null });

    try {
      const end = new Date();
      const start = new Date(end.getTime() - minutes * 60 * 1000);
      await saveCategorySample(
        'HKCategoryTypeIdentifierMindfulSession',
        CategoryValueNotApplicable.notApplicable,
        start,
        end
      );
      set({ isSaving: false });
      return true;
    } catch (err) {
      set({ isSaving: false, error: err instanceof Error ? err.message : 'Could not save to Health' });
      return false;
    }
  },
}));
