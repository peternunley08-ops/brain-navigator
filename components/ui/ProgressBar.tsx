import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { alpha, colors } from '../../core/theme';

interface ProgressBarProps {
  /** 0–1 */
  value: number;
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

// A sunk track that fills from the left, easing to its new value.
export function ProgressBar({ value, color = colors.flame, height = 8, style }: ProgressBarProps) {
  const reduced = useReducedMotion();
  const v = useSharedValue(0);
  useEffect(() => {
    const target = Math.max(0, Math.min(1, value));
    v.value = reduced ? target : withTiming(target, { duration: 700 });
  }, [value, reduced, v]);
  const fill = useAnimatedStyle(() => ({ width: `${v.value * 100}%` }));
  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: alpha(color, 0.12) }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
    >
      <Animated.View style={[styles.fill, { borderRadius: height / 2, backgroundColor: color }, fill]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
