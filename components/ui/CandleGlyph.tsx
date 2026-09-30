import { memo } from 'react';
import Svg, { Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { flamePath } from '../../core/flame';

interface CandleGlyphProps {
  size?: number;
  /** 0–1: flame size. */
  intensity?: number;
  /** 0.3–1: wax left. */
  remaining?: number;
  state?: 'lit' | 'resolved' | 'letgo';
}

// A still, small candle for lists: the same candle as on the Desk, drawn
// once instead of animated. Resolved shows a sage seal and no flame; let go
// shows an empty wick with a lavender wisp where the flame lifted off.
export const CandleGlyph = memo(function CandleGlyph({
  size = 40,
  intensity = 0.5,
  remaining = 1,
  state = 'lit',
}: CandleGlyphProps) {
  const W = 40;
  const H = 56;
  const bw = 14;
  const cx = W / 2;
  const bottom = 51;
  const bodyH = 26 * Math.max(0.35, Math.min(1, remaining));
  const top = bottom - bodyH;
  const half = 4.2 + 3.4 * intensity;
  const flame = flamePath(cx, top - 4 - half * 0.5, half, half * 2.2, 0, 0, 0, 1, 24);
  const core = flamePath(cx, top - 3.5 - half * 0.3, half * 0.46, half * 0.8, 0, 0, 0, 2, 16);
  const id = `g${state}${Math.round(intensity * 10)}`;

  return (
    <Svg width={size} height={(size * H) / W} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <LinearGradient id={`${id}w`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFF4DE" />
          <Stop offset="0.5" stopColor="#EBD6B0" />
          <Stop offset="1" stopColor="#A78B64" />
        </LinearGradient>
        <RadialGradient id={`${id}f`} cx="50%" cy="66%" r="64%">
          <Stop offset="0" stopColor="#FFF3D6" />
          <Stop offset="0.5" stopColor="#F5B45C" />
          <Stop offset="1" stopColor="#E0782E" />
        </RadialGradient>
        <RadialGradient id={`${id}h`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#F5A04E" stopOpacity={0.45} />
          <Stop offset="1" stopColor="#F5A04E" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {state === 'lit' ? <Ellipse cx={cx} cy={top - 6} rx={16} ry={16} fill={`url(#${id}h)`} /> : null}
      <Ellipse cx={cx} cy={bottom + 1} rx={bw * 0.85} ry={2.4} fill="#9A6B31" />
      <Rect x={cx - bw / 2} y={top} width={bw} height={bodyH} rx={2} fill={`url(#${id}w)`} />
      <Ellipse cx={cx} cy={top} rx={bw / 2} ry={1.6} fill="#FFF8EA" />
      <Path d={`M${cx},${top} L${cx + 0.4},${top - 3.2}`} stroke="#241913" strokeWidth={1.3} strokeLinecap="round" />
      {state === 'lit' ? (
        <>
          <Path d={flame} fill={`url(#${id}f)`} />
          <Path d={core} fill="#FFF3D6" opacity={0.9} />
        </>
      ) : null}
      {state === 'resolved' ? (
        <Ellipse cx={cx} cy={top + bodyH * 0.45} rx={3.6} ry={3.6} fill="#8CC0A8" stroke="#43665A" strokeWidth={0.8} />
      ) : null}
      {state === 'letgo' ? (
        <Path
          d={`M${cx},${top - 4} C${cx - 4},${top - 9} ${cx + 4},${top - 13} ${cx},${top - 18}`}
          stroke="#AFA2DE"
          strokeWidth={1.4}
          strokeLinecap="round"
          fill="none"
          opacity={0.8}
        />
      ) : null}
    </Svg>
  );
});
