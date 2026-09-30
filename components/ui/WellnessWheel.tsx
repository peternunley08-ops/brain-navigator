import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Line, Polygon, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { colors, dimensionColor, fonts } from '../../core/theme';
import { WELLNESS_DIMENSIONS, WellnessDimension } from '../../core/wellness';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

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

// The balance shape grows out from the middle when it appears.
export function WellnessWheel({ scores, size = 280, showLabels = true }: WellnessWheelProps) {
  const center = size / 2;
  const maxRadius = size * 0.32;
  const count = WELLNESS_DIMENSIONS.length;

  // Missing dimensions fall back to the average of what IS known so the
  // shape doesn't collapse toward the center — a genuine "no data yet" is
  // marked separately (hollow vertex + dim label) rather than drawn as 0.
  const known = WELLNESS_DIMENSIONS.map((d) => scores[d.key]).filter((v): v is number => v !== null);
  const fallback = known.length > 0 ? known.reduce((a, b) => a + b, 0) / known.length : 50;

  const radii = WELLNESS_DIMENSIONS.map((d) => ((scores[d.key] ?? fallback) / 100) * maxRadius);
  const points = WELLNESS_DIMENSIONS.map((d, i) => ({ ...axisPoint(i, count, radii[i], center), dimension: d, score: scores[d.key] }));

  const grow = useSharedValue(0);
  const key = radii.map((r) => r.toFixed(1)).join(',');
  useEffect(() => {
    grow.value = 0;
    grow.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.3)) });
  }, [key, grow]);

  const shape = useAnimatedProps(() => {
    let pts = '';
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
      const r = radii[i] * grow.value;
      pts += `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)} `;
    }
    return { points: pts };
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="wheelFill" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#F5B45C" stopOpacity={0.5} />
            <Stop offset="1" stopColor="#AFA2DE" stopOpacity={0.3} />
          </RadialGradient>
        </Defs>

        {RING_FRACTIONS.map((fraction) => {
          const ringPoints = WELLNESS_DIMENSIONS.map((_, i) => {
            const p = axisPoint(i, count, fraction * maxRadius, center);
            return `${p.x},${p.y}`;
          }).join(' ');
          return <Polygon key={fraction} points={ringPoints} fill="none" stroke={colors.line} strokeWidth={1} />;
        })}

        {WELLNESS_DIMENSIONS.map((_, i) => {
          const edge = axisPoint(i, count, maxRadius, center);
          return <Line key={i} x1={center} y1={center} x2={edge.x} y2={edge.y} stroke={colors.line} strokeWidth={1} />;
        })}

        <AnimatedPolygon fill="url(#wheelFill)" stroke="#F5B45C" strokeOpacity={0.8} strokeWidth={1.8} strokeLinejoin="round" animatedProps={shape} />

        {points.map((p) => {
          const c = dimensionColor[p.dimension.key] ?? colors.flame;
          return (
            <Circle
              key={p.dimension.key}
              cx={p.x}
              cy={p.y}
              r={p.score === null ? 4 : 5.5}
              fill={p.score === null ? colors.night : c}
              stroke={c}
              strokeWidth={p.score === null ? 1.5 : 2}
              strokeOpacity={p.score === null ? 0.6 : 0.4}
            />
          );
        })}

        {showLabels
          ? WELLNESS_DIMENSIONS.map((d, i) => {
              const labelPoint = axisPoint(i, count, maxRadius + 24, center);
              const has = scores[d.key] !== null;
              return (
                <G key={d.key}>
                  <SvgText
                    x={labelPoint.x}
                    y={labelPoint.y + 4}
                    fontSize={11}
                    fontFamily={fonts.bodyMedium}
                    fill={has ? dimensionColor[d.key] : colors.hint}
                    textAnchor="middle"
                  >
                    {d.label}
                  </SvgText>
                </G>
              );
            })
          : null}
      </Svg>
    </View>
  );
}
