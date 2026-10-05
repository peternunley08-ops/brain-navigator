import { router, usePathname } from 'expo-router';
import { useRef } from 'react';
import * as Haptics from '../core/haptics';
import { useShake } from '../core/hooks/useShake';
import { useLifeStore } from '../core/lifeStore';

// Pocket worry: a firm shake on any page opens the "Drop a worry" sheet.
// Quiet on pages that already use the shake or hold worries.
const QUIET_ON = new Set(['/pocket-worry', '/worry', '/welcome', '/wins']);

export function ShakeToWorry() {
  const off = useLifeStore((s) => !!s.settings.shakeWorryOff);
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  useShake(() => {
    if (QUIET_ON.has(pathRef.current)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push('/pocket-worry');
  }, !off);

  return null;
}
