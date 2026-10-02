import { checkAchievements } from './achievements';
import { useGoogleCalendarStore } from './googleCalendarStore';
import { useHabitsStore } from './habitsStore';
import { useHealthStore } from './healthStore';
import { EMPTY_HUB, useHubStore } from './hubStore';
import { EMPTY_LIFE, useLifeStore } from './lifeStore';
import { useNutritionStore } from './nutritionStore';
import { clearSampleDb, fillSampleDb } from './sampleDb';
import { sampleEvents, sampleHub, sampleLife, sampleSchool, sampleTables } from './sampleData';
import { EMPTY_SCHOOL, useSchoolStore } from './schoolStore';
import { isShowing, setShowing } from './showMode';
import { useSleepAmbientStore } from './sleepAmbientStore';
import { useBrainNavigatorStore } from './store';
import { useTasksStore } from './tasksStore';
import { useVentStore } from './ventStore';
import { useWeatherStore } from './weatherStore';
import { useWellnessStore } from './wellnessStore';
import { useWellnessWheelStore } from './wellnessWheelStore';

// "Show someone the app": swap in Riley, a made-up student, so the app can
// be shown without showing anything of yours. Your files stay on disk
// untouched (nothing saves while showing), the online database is replaced
// by an in-memory stand-in (core/sampleDb.ts), and AI, Notion, Calendar,
// Health, and weather are cut off. Ending reads everything back from disk
// and the real database.

type Snap = {
  calendar: Partial<ReturnType<typeof useGoogleCalendarStore.getState>>;
  health: Partial<ReturnType<typeof useHealthStore.getState>>;
  weather: Partial<ReturnType<typeof useWeatherStore.getState>>;
};
let snap: Snap | null = null;

function refetchOnline() {
  return Promise.allSettled([
    useBrainNavigatorStore.getState().fetchOpenLoops(),
    useBrainNavigatorStore.getState().fetchHistory(),
    useWellnessStore.getState().fetchCheckins(),
    useTasksStore.getState().fetchToday(),
    useHabitsStore.getState().fetchHabits(),
    useNutritionStore.getState().fetchToday(),
    useVentStore.getState().fetchHistory(),
    useWellnessWheelStore.getState().fetchScores(),
    useSleepAmbientStore.getState().fetchHistory(),
  ]);
}

export async function startShow() {
  if (isShowing()) return;
  const cal = useGoogleCalendarStore.getState();
  const health = useHealthStore.getState();
  const weather = useWeatherStore.getState();
  snap = {
    calendar: { signedIn: cal.signedIn, events: cal.events, error: cal.error },
    health: {
      isAvailable: health.isAvailable,
      isAuthorized: health.isAuthorized,
      stepsToday: health.stepsToday,
      restingHeartRate: health.restingHeartRate,
      sleepHoursLastNight: health.sleepHoursLastNight,
      sleepStages: health.sleepStages,
      stepsWeek: health.stepsWeek,
    },
    weather: {
      isAuthorized: weather.isAuthorized,
      locationLabel: weather.locationLabel,
      temperatureF: weather.temperatureF,
      weatherCode: weather.weatherCode,
      windMph: weather.windMph,
      humidityPct: weather.humidityPct,
      hasMarineData: weather.hasMarineData,
    },
  };

  // The flag goes up first, so nothing below can be saved.
  setShowing(true);
  fillSampleDb(sampleTables());
  const settings = useLifeStore.getState().settings;
  useSchoolStore.setState({ ...sampleSchool(), loaded: true });
  useHubStore.setState({ ...sampleHub(), loaded: true });
  useLifeStore.setState({ ...sampleLife(settings), loaded: true });
  useGoogleCalendarStore.setState({ signedIn: true, events: sampleEvents(), error: null, isLoading: false });
  const week = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => ({ label, value: [7200, 9100, 5400, 10200, 8300, 4100, 6240][i] }));
  useHealthStore.setState({
    isAvailable: true,
    isAuthorized: true,
    stepsToday: 6240,
    restingHeartRate: 58,
    sleepHoursLastNight: 7.6,
    sleepStages: { core: 250, deep: 70, rem: 95, unspecified: 0 },
    stepsWeek: week,
    isLoading: false,
  });
  useWeatherStore.setState({ isAuthorized: true, locationLabel: 'Riverside', temperatureF: 64, weatherCode: 2, windMph: 6, humidityPct: 58, hasMarineData: false, isLoading: false, error: null });
  await refetchOnline();
  // The sample student's badges, quietly (nothing saves).
  checkAchievements();
}

export async function endShow() {
  if (!isShowing()) return;
  // Empty and "not loaded" first: a store that isn't loaded never saves,
  // so the sample can't leak into your files on the way out.
  useSchoolStore.setState({ ...EMPTY_SCHOOL, loaded: false });
  useHubStore.setState({ ...EMPTY_HUB, loaded: false });
  useLifeStore.setState({ ...EMPTY_LIFE, loaded: false });
  setShowing(false);
  clearSampleDb();
  await Promise.all([useSchoolStore.getState().load(), useHubStore.getState().load(), useLifeStore.getState().load()]);
  if (snap) {
    useGoogleCalendarStore.setState(snap.calendar);
    useHealthStore.setState(snap.health);
    useWeatherStore.setState(snap.weather);
  }
  snap = null;
  await refetchOnline();
  if (useGoogleCalendarStore.getState().signedIn) useGoogleCalendarStore.getState().fetchTodayEvents();
  if (useHealthStore.getState().isAuthorized) useHealthStore.getState().fetchToday();
}
