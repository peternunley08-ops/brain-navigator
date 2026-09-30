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

const styles = StyleSheet.create({
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
