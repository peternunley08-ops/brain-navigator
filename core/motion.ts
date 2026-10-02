import { Easing } from 'react-native-reanimated';

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
} as const;

export const timings = {
  quick: { duration: 160, easing: Easing.out(Easing.quad) },
  base: { duration: 240, easing: Easing.out(Easing.cubic) },
  calm: { duration: 380, easing: Easing.out(Easing.cubic) },
} as const;
