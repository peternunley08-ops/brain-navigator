import { useEffect, useState } from 'react';
import { gradients } from './theme';

export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';

// Mirrors sunrise → midday → sunset → night without needing a geo lookup:
// wide enough bands that they still feel right across seasons/latitudes.
export function dayPhaseFor(date: Date = new Date()): DayPhase {
  const hour = date.getHours();
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

export function gradientForPhase(phase: DayPhase) {
  if (phase === 'dawn') return gradients.dawn;
  if (phase === 'dusk') return gradients.dusk;
  if (phase === 'night') return gradients.night;
  return gradients.quiet;
}

const REFRESH_MS = 5 * 60 * 1000;

export function useAdaptiveGradient() {
  const [phase, setPhase] = useState(dayPhaseFor);

  useEffect(() => {
    const id = setInterval(() => setPhase(dayPhaseFor()), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return { phase, gradient: gradientForPhase(phase) };
}
