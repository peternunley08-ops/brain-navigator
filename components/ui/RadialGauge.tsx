import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts } from '../../core/theme';

interface RadialGaugeProps {
  value: number; // 0–100
  size?: number;
  strokeWidth?: number;
  color?: string;
  label: string; // center text, e.g. "87%" or "05:30"
  caption?: string; // small text under the center label
}

export function RadialGauge({
  value,
  size = 88,
  strokeWidth = 8,
  color = colors.leather,
  label,
  caption,
}: RadialGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.background}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          // Start the arc at 12 o'clock instead of SVG's default 3 o'clock.
          rotation={-90}
          originX={center}
          originY={center}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.centerContent]}>
        <Text style={[styles.label, { fontSize: size * 0.22 }]}>{label}</Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.display,
    color: colors.ink,
  },
  caption: {
    marginTop: 2,
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.inkFaint,
  },
});
