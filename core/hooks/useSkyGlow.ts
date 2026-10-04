import { useSyncExternalStore } from 'react';
import { nightClockVersion, nightNow, subscribeNightClock } from '../night';
import { skyGlow } from '../theme';
import { useWeatherStore } from '../weatherStore';

// The light outside the room for any page: the real sunrise and sunset when
// the weather knows them, read on the night clock, so every page agrees
// with the Desk (and the dev clock moves them all).
export function useSkyGlow() {
  const sunrise = useWeatherStore((s) => s.sunrise);
  const sunset = useWeatherStore((s) => s.sunset);
  useSyncExternalStore(subscribeNightClock, nightClockVersion);
  return skyGlow(nightNow(), { sunrise, sunset });
}
