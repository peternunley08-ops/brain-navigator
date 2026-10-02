import { Easing, LinearTransition } from 'react-native-reanimated';

// How the app moves, in one place, so everything moves as one thing.
// Springs settle without bouncing; timings stay under 400 ms. Reanimated
// turns movement off on its own under Reduce Motion, and the frame swaps
// slides for fades there.
export const springs = {
  /** Sinking under a finger. */
  press: { damping: 18, stiffness: 420 },
  /** Coming back up after a press. */
  release: { damping: 12, stiffness: 260 },
  /** Tab pill, toggles, small things that change place. */
  snappy: { damping: 20, stiffness: 300, mass: 0.9 },
  /** Bars and sheets arriving and leaving. */
  gentle: { damping: 24, stiffness: 190 },
  /** The trailing edge of something that stretches as it moves (the tab pill). */
  trail: { damping: 22, stiffness: 150, mass: 1 },
  /** Something carried under a finger: it follows a beat behind, like it has weight. */
  carry: { damping: 26, stiffness: 520, mass: 0.6 },
} as const;

export const timings = {
  quick: { duration: 160, easing: Easing.out(Easing.quad) },
  base: { duration: 240, easing: Easing.out(Easing.cubic) },
  calm: { duration: 380, easing: Easing.out(Easing.cubic) },
  /** A slow breath in and a longer breath out (Hold the flame). */
  breathIn: { duration: 4000, easing: Easing.inOut(Easing.sin) },
  breathOut: { duration: 6000, easing: Easing.inOut(Easing.sin) },
} as const;

/** How long a number takes to count: the first time it shows, and when it changes. */
export const counts = { first: 650, change: 420 } as const;

/**
 * Rows that change place (Today to Done, a group closing up) glide there on
 * the gentle spring instead of jumping. Reanimated skips it under Reduce
 * Motion, so the row is simply in its new place.
 */
export const glide = LinearTransition.springify().damping(springs.gentle.damping).stiffness(springs.gentle.stiffness);
