import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors } from '../../core/theme';

interface SparklineProps {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}

// A small trend line with a soft fill under it and a dot on the latest value.
export function Sparkline({ values, color = colors.flame, width = 100, height = 36 }: SparklineProps) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 4;
  const pts = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * (width - pad * 2),
    y: pad + (1 - (v - min) / span) * (height - pad * 2),
  }));
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${height} L${pts[0].x.toFixed(1)},${height} Z`;
  const last = pts[pts.length - 1];
  const id = `spark${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <Svg width={width} height={height} accessibilityLabel={`Trend from ${values[0].toFixed(0)} to ${values[values.length - 1].toFixed(0)}`}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.3} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={area} fill={`url(#${id})`} />
      <Path d={line} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={last.x} cy={last.y} r={3.2} fill={color} />
    </Svg>
  );
}
