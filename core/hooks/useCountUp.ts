import { useContext, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { RevealContext } from '../../components/ui/Reveal';

/**
 * A number that counts up from zero the first time it shows ("12", "3.5",
 * "87%"), then follows changes without the show. Anything that isn't a
 * number, Reduce Motion, and pages already opened this session just show
 * the value (the same rule as Reveal).
 */
export function useCountUp(value: string | undefined, ms = 650) {
  const settle = useContext(RevealContext);
  const motionOff = useReducedMotion();
  const reduced = !settle || motionOff;
  const m = value?.match(/^(\d{1,5})(\.\d+)?(.*)$/);
  const target = m ? Number(m[1] + (m[2] ?? '')) : null;
  const decimals = m?.[2] ? m[2].length - 1 : 0;
  const played = useRef(false);
  const [shown, setShown] = useState(() => (target != null && !reduced ? 0 : null));

  useEffect(() => {
    if (target == null || reduced || played.current) {
      setShown(null);
      return;
    }
    played.current = true;
    const start = Date.now();
    let frame = 0;
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / ms);
      setShown(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(step);
      else setShown(null);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced, ms]);

  if (shown == null || !m) return value;
  return `${shown.toFixed(decimals)}${m[3]}`;
}
