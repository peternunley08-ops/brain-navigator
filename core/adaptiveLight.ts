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
