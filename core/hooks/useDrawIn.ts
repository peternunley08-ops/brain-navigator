import { useContext, useEffect } from 'react';
import { Easing, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { RevealContext } from '../../components/ui/Reveal';

/**
 * 0 → 1 the first time a chart shows on a page's first open this session,
 * so it can draw itself in; already 1 otherwise and under Reduce Motion
 * (the same rule as Reveal).
 */
export function useDrawIn(ms = 800, delay = 150) {
  const settle = useContext(RevealContext);
  const reduced = useReducedMotion();
  const still = !settle || reduced;
  const p = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (!still) p.value = withDelay(delay, withTiming(1, { duration: ms, easing: Easing.out(Easing.cubic) }));
  }, [still, ms, delay, p]);
  return p;
}
