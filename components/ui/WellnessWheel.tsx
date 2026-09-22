import { View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../core/theme';
import { WELLNESS_DIMENSIONS, WellnessDimension } from '../../core/wellness';

interface WellnessWheelProps {
  scores: Record<WellnessDimension, number | null>;
  size?: number;
  showLabels?: boolean;
}

const RING_FRACTIONS = [0.33, 0.66, 1];

function axisPoint(index: number, count: number, radius: number, center: number) {
  const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  };
}

export function WellnessWheel({ scores, size = 280, showLabels = true }: WellnessWheelProps) {
  const center = size / 2;
  const maxRadius = size * 0.32;
  const count = WELLNESS_DIMENSIONS.length;

  // Missing dimensions fall back to the average of what IS known so the
  // shape doesn't collapse toward the center — a genuine "no data yet" is
  // marked separately (hollow vertex + dim label) rather than drawn as 0.
  const known = WELLNESS_DIMENSIONS.map((d) => scores[d.key]).filter(
    (v): v is number => v !== null
  );
  const fallback = known.length > 0 ? known.reduce((a, b) => a + b, 0) / known.length : 50;

  const points = WELLNESS_DIMENSIONS.map((d, i) => {
    const score = scores[d.key];
    const effective = score ?? fallback;
    const point = axisPoint(i, count, (effective / 100) * maxRadius, center);
    return { ...point, dimension: d, score };
  });

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {RING_FRACTIONS.map((fraction) => {
          const ringPoints = WELLNESS_DIMENSIONS.map((_, i) => {
            const p = axisPoint(i, count, fraction * maxRadius, center);
            return `${p.x},${p.y}`;
          }).join(' ');
          return (
            <Polygon
              key={fraction}
              points={ringPoints}
              fill="none"
              stroke={colors.divider}
              strokeWidth={1}
            />
          );
        })}

        {WELLNESS_DIMENSIONS.map((_, i) => {
          const edge = axisPoint(i, count, maxRadius, center);
          return (
            <Line
              key={i}
              x1={center}
              y1={center}
              x2={edge.x}
              y2={edge.y}
              stroke={colors.divider}
              strokeWidth={1}
            />
          );
        })}

        <Polygon
          points={polygonPoints}
          fill={colors.lantern}
          fillOpacity={0.35}
          stroke={colors.leather}
          strokeWidth={2}
        />

        {points.map((p) => (
          <Circle
            key={p.dimension.key}
            cx={p.x}
            cy={p.y}
            r={p.score === null ? 4 : 5}
            fill={p.score === null ? colors.background : colors.leather}
            stroke={colors.leather}
            strokeWidth={p.score === null ? 1.5 : 0}
          />
        ))}

        {showLabels
          ? WELLNESS_DIMENSIONS.map((d, i) => {
              const labelPoint = axisPoint(i, count, maxRadius + 22, center);
              const known = scores[d.key] !== null;
              return (
                <G key={d.key}>
                  <SvgText
                    x={labelPoint.x}
                    y={labelPoint.y}
                    fontSize={9}
                    fontFamily={fonts.mono}
                    fill={known ? colors.inkMuted : colors.hint}
                    textAnchor="middle"
                  >
                    {d.label.toUpperCase()}
                  </SvgText>
                </G>
              );
            })
          : null}
      </Svg>
    </View>
  );
}
