// Guided breathing patterns. Every pattern is four phase slots — in, hold
// full, out, hold empty — so the UI-thread math never branches on shape; a
// pattern without a hold just gives that slot 0 ms.

export type Durations = readonly [number, number, number, number];

export interface BreathPattern {
  key: 'box' | 'relax' | 'even';
  name: string;
  description: string;
  durations: Durations;
  cycles: number;
}

export const BREATH_PATTERNS: readonly BreathPattern[] = [
  {
    key: 'box',
    name: 'Box',
    description: 'Box breathing. Four counts in, hold, out, hold.',
    durations: [4000, 4000, 4000, 4000],
    cycles: 6,
  },
  {
    key: 'relax',
    name: '4-7-8',
    description: 'In for four, hold for seven, out for eight.',
    durations: [4000, 7000, 8000, 0],
    cycles: 4,
  },
  {
    key: 'even',
    name: 'Even',
    description: 'Even breathing. Five and a half seconds in, the same out.',
    durations: [5500, 0, 5500, 0],
    cycles: 8,
  },
];

export const PHASE_WORDS = ['Breathe in', 'Hold', 'Breathe out', 'Hold'] as const;

export function cycleLength(d: readonly number[]) {
  'worklet';
  return d[0] + d[1] + d[2] + d[3];
}

export interface PhaseState {
  cycleIndex: number;
  idx: number;
  breath: number;
  cycleProgress: number;
  secondsLeft: number;
}

// Where a session is at `elapsed` ms: which cycle and phase, how full the
// breath is (0 empty, 1 full, eased so inhale/exhale start and land softly),
// and how far through the current cycle — the orbiting bead's position.
export function phaseAt(elapsed: number, d: readonly number[]): PhaseState {
  'worklet';
  const cycle = d[0] + d[1] + d[2] + d[3];
  const cycleIndex = Math.floor(elapsed / cycle);
  const intoCycle = elapsed - cycleIndex * cycle;

  let t = intoCycle;
  let idx = 0;
  for (let i = 0; i < 4; i++) {
    if (d[i] === 0) continue;
    idx = i;
    if (t < d[i]) break;
    t -= d[i];
  }

  const dur = d[idx];
  const p = Math.min(1, t / dur);
  const eased = 0.5 - 0.5 * Math.cos(Math.PI * p);
  const breath = idx === 0 ? eased : idx === 1 ? 1 : idx === 2 ? 1 - eased : 0;

  return {
    cycleIndex,
    idx,
    breath,
    cycleProgress: intoCycle / cycle,
    secondsLeft: Math.max(1, Math.ceil((dur - t) / 1000)),
  };
}
