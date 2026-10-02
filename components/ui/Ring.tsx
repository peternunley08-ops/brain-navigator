import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useCountUp } from '../../core/hooks/useCountUp';
import { alpha, colors, fonts } from '../../core/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RingProps {
  /** 0–1, or null for "no reading yet". */
  progress: number | null;
  size?: number;
  stroke?: number;
  color?: string;
  value?: string;
  unit?: string;
  label?: string;
  delay?: number;
}

// A progress ring that fills when it appears. The number in the middle is
// the reading; the label under it says what it measures.
export function Ring({
  progress,
  size = 76,
  stroke = 6,
  color = colors.flame,
  value,
  unit,
  label,
  delay = 0,
}: RingProps) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = useSharedValue(0);
  // The number counts up alongside the arc the first time it shows.
  const shownValue = useCountUp(value, 900);

  useEffect(() => {
    p.value = withDelay(delay, withTiming(Math.max(0, Math.min(1, progress ?? 0)), { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [progress, delay, p]);

  const arc = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - p.value) }));

  return (
    <View style={styles.wrap}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={alpha(color, 0.16)} strokeWidth={stroke} fill="none" />
          {progress != null ? (
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${circ} ${circ}`}
              animatedProps={arc}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          ) : null}
        </Svg>
        <View style={styles.center}>
          <Text style={[styles.value, { fontSize: size * 0.27 }]} numberOfLines={1}>
            {shownValue ?? '–'}
            {unit ? <Text style={[styles.unit, { fontSize: size * 0.15 }]}>{unit}</Text> : null}
          </Text>
        </View>
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: fonts.bodySemi,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontFamily: fonts.bodyMedium,
    color: colors.textFaint,
  },
  label: {
    marginTop: 8,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
  },
});
