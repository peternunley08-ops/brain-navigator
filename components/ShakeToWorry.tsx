import { Accelerometer } from 'expo-sensors';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import * as Haptics from '../core/haptics';
import { useLifeStore } from '../core/lifeStore';

// Pocket worry: a firm shake on any page opens the "Drop a worry" sheet.
// A shake is three hard jolts (over 2.3 g, gravity included) inside 0.8 s,
// so walking, running or setting the phone down doesn't count. It listens
// only while the app is open (iOS pauses sensors in the background).
const THRESHOLD_G = 2.3;
const JOLTS = 3;
const WINDOW_MS = 800;
const COOLDOWN_MS = 4000;
const QUIET_ON = new Set(['/pocket-worry', '/worry', '/welcome']);

export function ShakeToWorry() {
  const off = useLifeStore((s) => !!s.settings.shakeWorryOff);
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  useEffect(() => {
    if (off) return;
    let jolts: number[] = [];
    let lastFired = 0;
    let sub: { remove: () => void } | null = null;
    let cancelled = false;

    Accelerometer.isAvailableAsync()
      .then((ok) => {
        if (!ok || cancelled) return;
        Accelerometer.setUpdateInterval(60);
        sub = Accelerometer.addListener(({ x, y, z }) => {
          const now = Date.now();
          if (Math.sqrt(x * x + y * y + z * z) < THRESHOLD_G) return;
          jolts = jolts.filter((t) => now - t < WINDOW_MS);
          jolts.push(now);
          if (jolts.length < JOLTS || now - lastFired < COOLDOWN_MS) return;
          jolts = [];
          lastFired = now;
          if (QUIET_ON.has(pathRef.current)) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          router.push('/pocket-worry');
        });
      })
      .catch(() => {
        // No accelerometer: the worry box is still a tap away.
      });

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [off]);

  return null;
}
