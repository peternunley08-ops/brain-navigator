import { useEffect, useState } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors, radii } from '../../core/theme';

// A soft, breathing placeholder while something loads from the network —
// the shape of what's coming, instead of a spinner or a blank gap.
export function Skeleton({ height = 16, width = '100%', radius = radii.sm, style }: { height?: number; width?: DimensionValue; radius?: number; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (!reduced) p.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [p, reduced]);
  const pulse = useAnimatedStyle(() => ({ opacity: 0.45 + 0.35 * p.value }));
  return <Animated.View style={[styles.block, { height, width, borderRadius: radius }, pulse, style]} />;
}

/** A card-shaped stack of skeleton lines. */
export function SkeletonCard({ lines = 2, style }: { lines?: number; style?: StyleProp<ViewStyle> }) {
  // Only if loading takes a moment: a fast load never flashes a placeholder.
  const [late, setLate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLate(true), 300);
    return () => clearTimeout(t);
  }, []);
  if (!late) return <View style={[styles.card, styles.hidden, style]} />;
  return (
    <View style={[styles.card, style]} accessibilityLabel="Loading" accessibilityRole="progressbar">
      <Skeleton height={18} width="55%" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? '70%' : '100%'} style={styles.gap} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: {
    opacity: 0,
  },
  block: {
    backgroundColor: colors.surfaceHigh,
  },
  card: {
    padding: 18,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  gap: {
    marginTop: 10,
  },
});
