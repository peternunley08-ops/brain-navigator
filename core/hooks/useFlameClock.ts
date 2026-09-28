import { useFrameCallback, useSharedValue } from 'react-native-reanimated';

// One UI-thread clock per screen, in milliseconds, that every flame on it
// reads — so a desk of candles costs one frame loop, not one per candle.
export function useFlameClock() {
  const time = useSharedValue(0);
  useFrameCallback((frame) => {
    'worklet';
    time.value += Math.min(frame.timeSincePreviousFrame ?? 16, 64);
  });
  return time;
}
