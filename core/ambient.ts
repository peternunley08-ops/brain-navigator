import { useEffect } from 'react';
import { type SharedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';

// Ambient motion (Ember's sway, candle flicker, motes, stars, rain) moves
// about 30 times a second, and every clock moves on the same frames. Any frame
// where something moves costs a layout commit on the UI thread, however many
// things move in it, so fewer shared frames is what keeps an idle page cheap
// on a 120 Hz phone (Round 7 G47). Taps, hops and transitions aren't ambient
// and still run at full rate.
export const AMBIENT_MS = 33;

/** True once per ambient beat: the same frames for every clock that asks. */
export function ambientBeat(timestamp: number, last: SharedValue<number>) {
  'worklet';
  const slot = Math.floor(timestamp / AMBIENT_MS);
  if (slot === last.value) return false;
  last.value = slot;
  return true;
}

/**
 * A UI-thread clock (ms, the frame timestamp) that ticks on the ambient beat.
 * Paused while `active` is false: no frames, no cost.
 */
export function useAmbientClock(active = true) {
  const time = useSharedValue(0);
  const last = useSharedValue(-1);
  const clock = useFrameCallback((frame) => {
    'worklet';
    if (ambientBeat(frame.timestamp, last)) time.value = frame.timestamp;
  }, false);
  useEffect(() => {
    clock.setActive(active);
    return () => clock.setActive(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  return time;
}
