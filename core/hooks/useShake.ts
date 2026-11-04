import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef } from 'react';

// A firm shake: three hard jolts (over 2.45 g, gravity included, at least
// 110 ms apart so one desk bounce never counts twice) inside 0.85 s, so
// walking, running or setting the phone down doesn't count. Listens only
// while enabled and the app is open (iOS pauses sensors in the background).
const THRESHOLD_G = 2.45;
const JOLTS = 3;
const MIN_JOLT_GAP_MS = 110;
const WINDOW_MS = 850;
const COOLDOWN_MS = 4000;

export function useShake(onShake: () => void, enabled = true) {
  const handler = useRef(onShake);
  handler.current = onShake;

  useEffect(() => {
    if (!enabled) return;
    let jolts: number[] = [];
    let lastFired = 0;
    let sub: { remove: () => void } | null = null;
    let cancelled = false;

    Accelerometer.isAvailableAsync()
      .then((ok) => {
        if (!ok || cancelled) return;
        Accelerometer.setUpdateInterval(50);
        sub = Accelerometer.addListener(({ x, y, z }) => {
          const now = Date.now();
          if (Math.sqrt(x * x + y * y + z * z) < THRESHOLD_G) return;
          if (jolts.length && now - jolts[jolts.length - 1] < MIN_JOLT_GAP_MS) return;
          jolts = jolts.filter((t) => now - t < WINDOW_MS);
          jolts.push(now);
          if (jolts.length < JOLTS || now - lastFired < COOLDOWN_MS) return;
          jolts = [];
          lastFired = now;
          handler.current();
        });
      })
      .catch(() => {
        // No accelerometer: whatever the shake opens is still a tap away.
      });

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [enabled]);
}
