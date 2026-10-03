import { useContext, useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { RevealContext } from '../../components/ui/Reveal';
import { counts } from '../motion';

/**
 * A number that counts up from zero the first time it shows ("12", "3.5",
 * "87%"), then counts from the old value to the new one whenever it changes.
 * Anything that isn't a number and Reduce Motion just show the value; a page
 * already opened this session shows its first value as it is (the same rule
 * as Reveal) but still counts when the number changes.
 */
export function useCountUp(value: string | undefined, ms: number = counts.first) {
  const settle = useContext(RevealContext);
  const motionOff = useReducedMotion();
  const m = value?.match(/^(\d{1,5})(\.\d+)?(.*)$/);
  const target = m ? Number(m[1] + (m[2] ?? '')) : null;
  const decimals = m?.[2] ? m[2].length - 1 : 0;
  // The number on screen right now (or null before the first count starts).
  const current = useRef<number | null>(null);
  const first = useRef(true);
  const [shown, setShown] = useState(() => (target != null && !motionOff && settle ? 0 : null));

  // Before paint, so a change shows the old number while the count starts
  // instead of flashing the new one for a frame.
  useLayoutEffect(() => {
    if (target == null || motionOff) {
      current.current = target;
      first.current = false;
      setShown(null);
      return;
    }
    const isFirst = first.current;
    first.current = false;
    const from = isFirst ? (settle ? 0 : target) : (current.current ?? target);
    if (from === target) {
      current.current = target;
      setShown(null);
      return;
    }
    const dur = isFirst ? ms : counts.change;
    const start = Date.now();
    let frame = 0;
    setShown(from);
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
  }, [target, motionOff, settle, ms]);

  if (shown == null || !m) return value;
  return `${shown.toFixed(decimals)}${m[3]}`;
}
