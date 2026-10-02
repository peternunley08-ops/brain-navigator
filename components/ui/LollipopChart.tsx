import { StyleSheet, Text, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Rect } from 'react-native-svg';
import { useDrawIn } from '../../core/hooks/useDrawIn';
import { colors, fonts } from '../../core/theme';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface LollipopPoint {
  label: string;
  value: number | null;
}

interface LollipopChartProps {
  data: LollipopPoint[];
  maxValue: number;
  highlightIndex?: number;
  color?: string;
  width?: number;
  height?: number;
}

export function LollipopChart({
  data,
  maxValue,
  highlightIndex,
  color = colors.flame,
  width = 320,
  height = 120,
}: LollipopChartProps) {
  const padding = 16;
  const chartHeight = height - 28; // leaves room for day labels below
  const step = (width - padding * 2) / Math.max(data.length - 1, 1);
  // The stems grow up one after another the first time it shows.
  const p = useDrawIn(900);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {data.map((point, i) => {
          const x = padding + i * step;
          const ratio = point.value !== null ? Math.min(1, point.value / maxValue) : 0;
          const valueY = chartHeight - ratio * (chartHeight - 16);
          const active = i === highlightIndex;

          return (
            <G key={point.label}>
              {active ? (
                <Rect
                  x={x - 14}
                  y={4}
                  width={28}
                  height={chartHeight - 4}
                  rx={14}
                  fill={colors.glow}
                />
              ) : null}
              <Stem
                p={p}
                i={i}
                n={data.length}
                x={x}
                base={chartHeight}
                top={valueY}
                stroke={active ? color : colors.lineStrong}
                width={active ? 3 : 2}
                r={active ? 6 : 4}
                fill={active ? color : point.value === null ? colors.surface : colors.textFaint}
                ring={active ? colors.night : colors.lineStrong}
                ringWidth={active ? 3 : 1.5}
              />
            </G>
          );
        })}
      </Svg>
      <View style={styles.labelRow}>
        {data.map((point, i) => (
          <Text
            key={point.label}
            style={[styles.dayLabel, i === highlightIndex && styles.dayLabelActive, { width: step }]}
          >
            {point.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  dayLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textFaint,
    textAlign: 'center',
  },
  dayLabelActive: {
    color: colors.flame,
    fontFamily: fonts.bodySemi,
  },
});

function Stem({
  p,
  i,
  n,
  x,
  base,
  top,
  stroke,
  width,
  r,
  fill,
  ring,
  ringWidth,
}: {
  p: SharedValue<number>;
  i: number;
  n: number;
  x: number;
  base: number;
  top: number;
  stroke: string;
  width: number;
  r: number;
  fill: string;
  ring: string;
  ringWidth: number;
}) {
  const lineProps = useAnimatedProps(() => {
    const t = Math.min(1, Math.max(0, p.value * 1.5 - (i / Math.max(n, 1)) * 0.5));
    return { y2: base - (base - top) * t };
  });
  const dotProps = useAnimatedProps(() => {
    const t = Math.min(1, Math.max(0, p.value * 1.5 - (i / Math.max(n, 1)) * 0.5));
    return { cy: base - (base - top) * t };
  });
  return (
    <>
      <AnimatedLine x1={x} y1={base} x2={x} y2={top} stroke={stroke} strokeWidth={width} strokeLinecap="round" animatedProps={lineProps} />
      <AnimatedCircle cx={x} cy={top} r={r} fill={fill} stroke={ring} strokeWidth={ringWidth} animatedProps={dotProps} />
    </>
  );
}

