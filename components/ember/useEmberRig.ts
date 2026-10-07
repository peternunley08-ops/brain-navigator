import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  cancelAnimation,
  Easing,
  type SharedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { EmberMood } from '../../core/emberStore';
import { ambientBeat } from '../../core/ambient';

// Everything that makes Ember move, as shared values the sprite reads on
// the UI thread. Screens hold a rig and pull its strings — set a mood, make
// it hop, make it talk — without re-rendering anything.

export interface EmberRig {
  time: SharedValue<number>;
  speed: SharedValue<number>;
  wob: SharedValue<number>;
  blink: SharedValue<number>;
  lookX: SharedValue<number>;
  lookY: SharedValue<number>;
  happy: SharedValue<number>;
  sleepy: SharedValue<number>;
  dizzy: SharedValue<number>;
  mouth: SharedValue<number>;
  smile: SharedValue<number>;
  flare: SharedValue<number>;
  lean: SharedValue<number>;
  stretch: SharedValue<number>;
  hop: SharedValue<number>;
  squash: SharedValue<number>;
  /** Freezes idle glances while something else is steering the eyes. */
  holdGaze: (on: boolean) => void;
  setMood: (mood: EmberMood) => void;
  hopUp: (height?: number) => void;
  wiggle: () => void;
  talk: (on: boolean) => void;
  yawn: () => void;
  look: (x: number, y: number) => void;
  setActive: (on: boolean) => void;
}

const MOODS: Record<EmberMood, { happy: number; sleepy: number; dizzy: number; smile: number; flare: number; speed: number }> = {
  idle: { happy: 0, sleepy: 0, dizzy: 0, smile: 0.45, flare: 1, speed: 1 },
  happy: { happy: 1, sleepy: 0, dizzy: 0, smile: 1, flare: 1.08, speed: 1.15 },
  cheer: { happy: 1, sleepy: 0, dizzy: 0, smile: 1, flare: 1.2, speed: 1.4 },
  curious: { happy: 0, sleepy: 0, dizzy: 0, smile: 0.2, flare: 1.04, speed: 1.1 },
  sleepy: { happy: 0, sleepy: 1, dizzy: 0, smile: 0.25, flare: 0.8, speed: 0.45 },
  concerned: { happy: 0, sleepy: 0, dizzy: 0, smile: -0.35, flare: 0.92, speed: 0.85 },
  listening: { happy: 0, sleepy: 0, dizzy: 0, smile: 0.3, flare: 0.98, speed: 0.9 },
  dizzy: { happy: 0, sleepy: 0, dizzy: 1, smile: 0, flare: 1, speed: 1.6 },
};

// `asleep` starts the eyes already closed (the wake screen), so the first
// frame isn't a wide-eyed Ember that then dozes off.
export function useEmberRig({ glance = true, asleep = false }: { glance?: boolean; asleep?: boolean } = {}): EmberRig {
  const reduced = useReducedMotion();

  const time = useSharedValue(Math.random() * 10000);
  const speed = useSharedValue(1);
  const wob = useSharedValue(reduced ? 0.15 : 1);
  const blink = useSharedValue(1);
  const lookX = useSharedValue(0);
  const lookY = useSharedValue(0);
  const happy = useSharedValue(0);
  const sleepy = useSharedValue(asleep ? 1 : 0);
  const dizzy = useSharedValue(0);
  const mouth = useSharedValue(0);
  const smile = useSharedValue(0.45);
  const flare = useSharedValue(1);
  const lean = useSharedValue(0);
  const stretch = useSharedValue(1);
  const hop = useSharedValue(0);
  const squash = useSharedValue(1);

  // Ember's sway and flicker read `time`, and every write redraws the whole
  // drawing. Written every display frame, that was up to 120 redraws a second
  // on a ProMotion phone, on every page, all day (Round 7 G47). It now moves on
  // the ambient beat (core/ambient.ts); hops, talking and blinks run on their
  // own values at full rate.
  const owed = useSharedValue(0);
  const beat = useSharedValue(-1);
  const clock = useFrameCallback((frame) => {
    'worklet';
    owed.value += Math.min(frame.timeSincePreviousFrame ?? 16, 64) * speed.value;
    if (!ambientBeat(frame.timestamp, beat)) return;
    time.value += owed.value;
    owed.value = 0;
  }, true);

  const gazeHeld = useRef(false);
  const moodRef = useRef<EmberMood>('idle');

  // Blinks: every few seconds, sometimes twice. Never while asleep.
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      timer = setTimeout(() => {
        if (!alive) return;
        if (moodRef.current !== 'sleepy') {
          const twice = Math.random() < 0.22;
          const one = [withTiming(0.05, { duration: 70 }), withTiming(1, { duration: 120 })];
          blink.value = twice
            ? withSequence(...one, withTiming(1, { duration: 90 }), withTiming(0.05, { duration: 70 }), withTiming(1, { duration: 120 }))
            : withSequence(...one);
        }
        next();
      }, 2200 + Math.random() * 3600);
    };
    next();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [blink]);

  // Idle glances: looks around the room, comes back to you.
  useEffect(() => {
    if (!glance) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const next = () => {
      timer = setTimeout(() => {
        if (!alive) return;
        if (!gazeHeld.current && moodRef.current !== 'sleepy' && moodRef.current !== 'dizzy') {
          const center = Math.random() < 0.4;
          const x = center ? 0 : Math.random() * 1.6 - 0.8;
          const y = center ? 0 : Math.random() * 0.9 - 0.5;
          const cfg = { duration: 240, easing: Easing.out(Easing.quad) };
          lookX.value = withTiming(x, cfg);
          lookY.value = withTiming(y, cfg);
        }
        next();
      }, 2600 + Math.random() * 3400);
    };
    next();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [glance, lookX, lookY]);

  const setMood = useCallback(
    (m: EmberMood) => {
      moodRef.current = m;
      const target = MOODS[m];
      const cfg = { duration: 280, easing: Easing.out(Easing.cubic) };
      happy.value = withTiming(target.happy, cfg);
      sleepy.value = withTiming(target.sleepy, { duration: 520 });
      dizzy.value = withTiming(target.dizzy, cfg);
      smile.value = withTiming(target.smile, cfg);
      flare.value = withSpring(target.flare, { damping: 11, stiffness: 140 });
      speed.value = withTiming(target.speed, { duration: 400 });
      if (m === 'listening') {
        lookY.value = withTiming(0.55, cfg);
        lookX.value = withTiming(0, cfg);
      }
      if (m === 'curious') {
        lookY.value = withTiming(-0.4, cfg);
      }
    },
    [happy, sleepy, dizzy, smile, flare, speed, lookX, lookY]
  );

  const hopUp = useCallback(
    (height = 12) => {
      if (reduced) {
        flare.value = withSequence(withTiming(flare.value * 1.12, { duration: 140 }), withSpring(flare.value));
        return;
      }
      squash.value = withSequence(
        withTiming(0.86, { duration: 90 }),
        withTiming(1.1, { duration: 150 }),
        withSpring(1, { damping: 8, stiffness: 220 })
      );
      hop.value = withSequence(
        withTiming(0, { duration: 90 }),
        withTiming(-height, { duration: 170, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 9, stiffness: 190 })
      );
    },
    [reduced, flare, squash, hop]
  );

  const wiggle = useCallback(() => {
    if (reduced) return;
    lean.value = withSequence(
      withTiming(0.28, { duration: 90 }),
      withTiming(-0.28, { duration: 140 }),
      withTiming(0.18, { duration: 130 }),
      withSpring(0, { damping: 6, stiffness: 160 })
    );
  }, [reduced, lean]);

  const talk = useCallback(
    (on: boolean) => {
      cancelAnimation(mouth);
      if (!on) {
        mouth.value = withTiming(0, { duration: 120 });
        return;
      }
      mouth.value = withRepeat(
        withSequence(
          withTiming(0.75, { duration: 100 }),
          withTiming(0.2, { duration: 110 }),
          withTiming(0.55, { duration: 90 }),
          withTiming(0.05, { duration: 130 }),
          withTiming(0.85, { duration: 110 }),
          withTiming(0.15, { duration: 120 })
        ),
        -1
      );
    },
    [mouth]
  );

  const yawn = useCallback(() => {
    cancelAnimation(mouth);
    mouth.value = withSequence(withTiming(1, { duration: 380 }), withTiming(1, { duration: 420 }), withTiming(0, { duration: 260 }));
    stretch.value = withSequence(withTiming(1.14, { duration: 380 }), withTiming(1.14, { duration: 420 }), withSpring(1));
  }, [mouth, stretch]);

  const look = useCallback(
    (x: number, y: number) => {
      const cfg = { duration: 200, easing: Easing.out(Easing.quad) };
      lookX.value = withTiming(Math.max(-1, Math.min(1, x)), cfg);
      lookY.value = withTiming(Math.max(-1, Math.min(1, y)), cfg);
    },
    [lookX, lookY]
  );

  const holdGaze = useCallback((on: boolean) => {
    gazeHeld.current = on;
  }, []);

  const setActive = useCallback((on: boolean) => clock.setActive(on), [clock]);

  return useMemo(
    () => ({
      time,
      speed,
      wob,
      blink,
      lookX,
      lookY,
      happy,
      sleepy,
      dizzy,
      mouth,
      smile,
      flare,
      lean,
      stretch,
      hop,
      squash,
      holdGaze,
      setMood,
      hopUp,
      wiggle,
      talk,
      yawn,
      look,
      setActive,
    }),
    // Shared values and callbacks are all stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
}
