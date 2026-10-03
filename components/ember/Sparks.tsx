import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// A burst of little sparks thrown off a flame — Ember's delight, and the
// flourish when a candle is resolved. Bump `burst` to fire it.

const COUNT = 9;

interface SparksProps {
  burst: number;
  /** Distance the sparks travel, in points. */
  reach?: number;
  color?: string;
}

export const Sparks = memo(function Sparks({ burst, reach = 46, color = '#FFD08A' }: SparksProps) {
  const p = useSharedValue(1);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (burst === 0 || reduced) return;
    p.value = 0;
    p.value = withTiming(1, { duration: 760, easing: Easing.out(Easing.cubic) });
  }, [burst, reduced, p]);

  return (
    <View style={styles.center} pointerEvents="none">
      {Array.from({ length: COUNT }, (_, i) => (
        <Spark key={i} i={i} p={p} reach={reach} color={color} />
      ))}
    </View>
  );
});

function Spark({ i, p, reach, color }: { i: number; p: SharedValue<number>; reach: number; color: string }) {
  // Spread upward mostly — sparks rise.
  const angle = -Math.PI / 2 + ((i / (COUNT - 1)) - 0.5) * Math.PI * 1.5;
  const dist = reach * (0.7 + ((i * 37) % 10) / 22);
  const size = 3 + (i % 3);
  const style = useAnimatedStyle(() => {
    const v = p.value;
    return {
      opacity: v >= 1 ? 0 : (1 - v) * Math.min(1, v * 8),
      transform: [
        { translateX: Math.cos(angle) * dist * v },
        { translateY: Math.sin(angle) * dist * v + 18 * v * v },
        { rotate: '45deg' },
        { scale: 1 - v * 0.6 },
      ],
    };
  });
  return (
    <Animated.View
      style={[styles.spark, { width: size, height: size, backgroundColor: color, shadowColor: color }, style]}
    />
  );
}

// Birthday confetti: a few slow pieces drifting down across the room, once.
const PIECES = 16;

export const Confetti = memo(function Confetti({ run, width, height, colors }: { run: number; width: number; height: number; colors: string[] }) {
  const p = useSharedValue(1);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (run === 0 || reduced) return;
    p.value = 0;
    p.value = withTiming(1, { duration: 5200, easing: Easing.linear });
  }, [run, reduced, p]);
  if (run === 0 || reduced) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: PIECES }, (_, i) => (
        <Piece key={i} i={i} p={p} width={width} height={height} color={colors[i % colors.length]} />
      ))}
    </View>
  );
});

function Piece({ i, p, width, height, color }: { i: number; p: SharedValue<number>; width: number; height: number; color: string }) {
  const x0 = ((i * 53) % 100) / 100 * width;
  const delay = ((i * 29) % 10) / 24;
  const sway = 12 + (i % 4) * 5;
  const w = 5 + (i % 3) * 2;
  const style = useAnimatedStyle(() => {
    const v = Math.max(0, Math.min(1, (p.value - delay) / (1 - delay)));
    return {
      opacity: v <= 0 || v >= 1 ? 0 : Math.min(1, v * 6) * Math.min(1, (1 - v) * 5),
      transform: [
        { translateX: x0 + Math.sin(v * 9 + i) * sway },
        { translateY: -20 + v * (height * 0.7) },
        { rotate: `${v * 360 + i * 40}deg` },
      ],
    };
  });
  return <Animated.View style={[styles.piece, { width: w, height: w * 0.55, backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0, left: 0, borderRadius: 1 },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spark: {
    position: 'absolute',
    borderRadius: 1,
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
});
