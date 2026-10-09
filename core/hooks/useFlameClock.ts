import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { ambientBeat } from '../ambient';

// One UI-thread clock per screen, in milliseconds, that every flame on it
// reads — so a desk of candles costs one frame loop, not one per candle.
// Paused whenever the screen isn't the one in front: screens stay mounted
// underneath the ones pushed over them, and a hidden desk of flickering
// candles would otherwise keep costing battery.
export function useFlameClock() {
  const time = useSharedValue(0);
  const owed = useSharedValue(0);
  const beat = useSharedValue(-1);
  // Flickers on the ambient beat (core/ambient.ts), with Ember and the room.
  const clock = useFrameCallback((frame) => {
    'worklet';
    owed.value += Math.min(frame.timeSincePreviousFrame ?? 16, 64);
    if (!ambientBeat(frame.timestamp, beat)) return;
    time.value += owed.value;
    owed.value = 0;
  }, false);

  useFocusEffect(
    useCallback(() => {
      clock.setActive(true);
      return () => clock.setActive(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  return time;
}
