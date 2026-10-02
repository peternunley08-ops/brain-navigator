import { useContext, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { RevealContext } from '../../components/ui/Reveal';
import { counts } from '../motion';

/**
 * A number that counts up from zero the first time it shows ("12", "3.5",
 * "87%"), then counts from the old value to the new one whenever it changes.
 * Anything that isn't a number, Reduce Motion, and pages already opened this
 * session just show the value (the same rule as Reveal).
 */
export function useCountUp(value: string | undefined, ms: number = counts.first) {
  const settle = useContext(RevealContext);
  const motionOff = useReducedMotion();
  const reduced = !settle || motionOff;
  const m = value?.match(/^(\d{1,5})(\.\d+)?(.*)$/);
  const target = m ? Number(m[1] + (m[2] ?? '')) : null;
  const decimals = m?.[2] ? m[2].length - 1 : 0;
  // The number on screen right now (or null before the first count starts).
  const current = useRef<number | null>(null);
  const first = useRef(true);
  const [shown, setShown] = useState(() => (target != null && !reduced ? 0 : null));

  useEffect(() => {
    if (target == null || reduced) {
      current.current = target;
      first.current = false;
      setShown(null);
      return;
    }
    // A page already opened this session shows its first value as it is.
    const isFirst = first.current;
    first.current = false;
    const from = isFirst ? 0 : (current.current ?? target);
    if (from === target) {
      current.current = target;
      setShown(null);
      return;
    }
    const dur = isFirst ? ms : counts.change;
    const start = Date.now();
    let frame = 0;
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / dur);
      const v = from + (target - from) * (1 - Math.pow(1 - t, 3));
      current.current = v;
      setShown(v);
      if (t < 1) frame = requestAnimationFrame(step);
      else {
        current.current = target;
        setShown(null);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced, ms]);

  if (shown == null || !m) return value;
  return `${shown.toFixed(decimals)}${m[3]}`;
}
