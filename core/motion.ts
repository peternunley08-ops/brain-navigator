import { Easing, LinearTransition } from 'react-native-reanimated';

// How the app moves, in one place, so everything moves as one thing.
// Springs are set the way Apple sets them (Designing Fluid Interfaces):
// `response` is about how long the move takes, in seconds, and the damping
// ratio is how much it overshoots: 1 settles without bouncing, 0.8 swings a
// little. Things you tap settle without bouncing; only a flick you let go of,
// or a small "done" moment, gets a little swing. Timings stay under 400 ms.
// Reanimated turns movement off on its own under Reduce Motion, and the frame
// swaps slides for fades there.

/** A spring from Apple's two numbers: response (s) and damping ratio. */
export function spring(response: number, dampingRatio = 1) {
  'worklet';
  const stiffness = ((2 * Math.PI) / response) ** 2;
  return { mass: 1, stiffness, damping: dampingRatio * 2 * Math.sqrt(stiffness) };
}

export const springs = {
  /** Sinking under a finger: right away, no wobble. */
  press: spring(0.15),
  /** Coming back up after a press. */
  release: spring(0.3),
  /** Tab pill, toggles, small things that change place. */
  snappy: spring(0.3),
  /** Bars and sheets arriving and leaving. */
  gentle: spring(0.4),
  /** The trailing edge of something that stretches as it moves (the tab pill). */
  trail: spring(0.45),
  /** Something carried under a finger: it follows a beat behind, like it has weight. */
  carry: spring(0.12),
  /** Slow, breathing things: the breath dial and bead, rings settling. */
  calm: spring(0.6),
  /** Let go after a drag or flick: keeps the finger's speed and swings a touch (Apple's sheet spring). */
  momentum: spring(0.3, 0.8),
  /** A small "done" moment: a check, a badge, a seal. The one place a tap gets a swing. */
  pop: spring(0.35, 0.65),
} as const;

/**
 * Where a flick would come to rest, like a scroll slowing down (Apple's
 * projection). Decide a swipe from here, not from where the finger let go,
 * so a quick short flick counts. 0.99 is the snappier rate Apple suggests
 * for decisions; 0.998 is a scroll.
 */
/**
 * A layout animation (`entering=`) on one of our springs. Reanimated fills any
 * spring value you leave out from its own defaults (mass 4, stiffness 900), so
 * setting only damping makes it wobble hard; this always sets all three.
 */
type Springy = { mass(v: number): Springy; stiffness(v: number): Springy; damping(v: number): Springy };
export function sprung<B extends Springy>(builder: { springify(): B }, s: { mass: number; stiffness: number; damping: number } = springs.gentle): B {
  return builder.springify().mass(s.mass).stiffness(s.stiffness).damping(s.damping) as B;
}

export function project(velocity: number, rate = 0.99) {
  'worklet';
  return ((velocity / 1000) * rate) / (1 - rate);
}

/** Past an edge, follow less and less instead of stopping dead. */
export function rubberband(over: number, size: number, c = 0.55) {
  'worklet';
  return (over * size * c) / (size + c * Math.abs(over));
}

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
