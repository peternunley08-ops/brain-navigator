import * as Location from 'expo-location';
import { create } from 'zustand';
import { isShowing } from './showMode';

interface WeatherStore {
  isAuthorized: boolean;
  isLoading: boolean;
  error: string | null;

  locationLabel: string | null;

  temperatureF: number | null;
  weatherCode: number | null;
  windMph: number | null;
  humidityPct: number | null;

  hasMarineData: boolean;
  waveHeightFt: number | null;
  wavePeriodS: number | null;
  waveDirectionDeg: number | null;
  swellHeightFt: number | null;
  swellPeriodS: number | null;

  connect: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useWeatherStore = create<WeatherStore>((set, get) => ({
  isAuthorized: false,
  isLoading: false,
  error: null,

  locationLabel: null,

  temperatureF: null,
  weatherCode: null,
  windMph: null,
  humidityPct: null,

  hasMarineData: false,
  waveHeightFt: null,
  wavePeriodS: null,
  waveDirectionDeg: null,
  swellHeightFt: null,
  swellPeriodS: null,

  connect: async () => {
    if (isShowing()) return; // showing someone the app: sample data only
    set({ isLoading: true, error: null });

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      set({ isLoading: false, isAuthorized: false, error: 'Location permission denied.' });
      return;
    }

    set({ isAuthorized: true });
    await get().refresh();
  },

  refresh: async () => {
    if (isShowing()) return; // showing someone the app: sample data only
    set({ isLoading: true, error: null });

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;

      const [places, weatherRes, marineRes] = await Promise.all([
        Location.reverseGeocodeAsync({ latitude, longitude }).catch(() => []),
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`
        ),
        fetch(
          `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&current=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period&length_unit=imperial&timezone=auto`
        ).catch(() => null),
      ]);

      const place = places[0];
      const locationLabel = place ? [place.city, place.region].filter(Boolean).join(', ') : null;

      if (!weatherRes.ok) throw new Error('Weather lookup failed.');
      const weatherJson = await weatherRes.json();
      const current = weatherJson.current ?? {};

      let hasMarineData = false;
      let waveHeightFt: number | null = null;
      let wavePeriodS: number | null = null;
      let waveDirectionDeg: number | null = null;
      let swellHeightFt: number | null = null;
      let swellPeriodS: number | null = null;

      if (marineRes && marineRes.ok) {
        const marineJson = await marineRes.json();
        const marineCurrent = marineJson.current ?? {};
        if (marineCurrent.wave_height != null) {
          hasMarineData = true;
          waveHeightFt = marineCurrent.wave_height;
          wavePeriodS = marineCurrent.wave_period;
          waveDirectionDeg = marineCurrent.wave_direction;
          swellHeightFt = marineCurrent.swell_wave_height;
          swellPeriodS = marineCurrent.swell_wave_period;
        }
      }

      set({
        isLoading: false,
        locationLabel,
        temperatureF: current.temperature_2m ?? null,
        weatherCode: current.weather_code ?? null,
        windMph: current.wind_speed_10m ?? null,
        humidityPct: current.relative_humidity_2m ?? null,
        hasMarineData,
        waveHeightFt,
        wavePeriodS,
        waveDirectionDeg,
        swellHeightFt,
        swellPeriodS,
      });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Could not load conditions.' });
    }
  },
}));
