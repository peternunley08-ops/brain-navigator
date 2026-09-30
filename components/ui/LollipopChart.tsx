import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Rect } from 'react-native-svg';
import { colors, fonts } from '../../core/theme';

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
              <Line
                x1={x}
                y1={chartHeight}
                x2={x}
                y2={valueY}
                stroke={active ? color : colors.lineStrong}
                strokeWidth={active ? 3 : 2}
                strokeLinecap="round"
              />
              <Circle
                cx={x}
                cy={valueY}
                r={active ? 6 : 4}
                fill={active ? color : point.value === null ? colors.surface : colors.textFaint}
                stroke={active ? colors.night : colors.lineStrong}
                strokeWidth={active ? 3 : 1.5}
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
