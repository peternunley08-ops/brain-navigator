import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';
import { THIS_OR_THAT } from '../../core/about';
import { alpha, colors, radii } from '../../core/theme';
import { plural } from '../../core/words';

const H = 160;
const PAD = 18;

// Stable pseudo-random 0..1 pair from an id (deterministic, so a star never moves).
function place(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  const a = ((h >>> 0) % 1000) / 1000;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  const b = ((h >>> 0) % 1000) / 1000;
  return { a, b };
}

function Star({ x, y, i, still }: { x: number; y: number; i: number; still: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    p.value = withDelay(i * 650, withRepeat(withTiming(1, { duration: 3200 + (i % 4) * 700, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [p, i, still]);
  const style = useAnimatedStyle(() => ({ opacity: still ? 0.9 : 0.6 + 0.4 * p.value }));
  return (
    <Animated.View style={[styles.star, { left: x - 8, top: y - 8 }, style]}>
      <Svg width={16} height={16}>
        <Circle cx={8} cy={8} r={7} fill={alpha(colors.flameHot, 0.16)} />
        <Circle cx={8} cy={8} r={2.6} fill={colors.flameHot} />
      </Svg>
    </Animated.View>
  );
}

// The student's This-or-that picks as a small night sky: each answer lights a star.
export function Constellation({ picks }: { picks: Record<string, string | undefined> }) {
  const reduced = useReducedMotion();
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const pts = THIS_OR_THAT.map((c) => {
    const { a, b } = place(c.id);
    return { id: c.id, lit: !!picks[c.id], x: PAD + a * Math.max(0, w - PAD * 2), y: PAD + b * (H - PAD * 2) };
  });
  const lit = pts.filter((p) => p.lit);
  return (
    <View
      style={styles.box}
      onLayout={onLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Your constellation: ${lit.length} of ${plural(pts.length, 'star')} lit`}
    >
      {w > 0 ? (
        <>
          <Svg width={w} height={H} style={StyleSheet.absoluteFill}>
            {lit.slice(1).map((p, i) => (
              <Line key={p.id} x1={lit[i].x} y1={lit[i].y} x2={p.x} y2={p.y} stroke={alpha(colors.flame, 0.35)} strokeWidth={1} />
            ))}
            {pts.filter((p) => !p.lit).map((p) => (
              <Circle key={p.id} cx={p.x} cy={p.y} r={1.5} fill={alpha(colors.text, 0.18)} />
            ))}
          </Svg>
          {lit.map((p, i) => (
            <Star key={p.id} x={p.x} y={p.y} i={i} still={reduced} />
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { height: H, width: '100%', borderRadius: radii.lg, backgroundColor: alpha(colors.night, 0.4), borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, overflow: 'hidden', marginBottom: 12 },
  star: { position: 'absolute', width: 16, height: 16 },
});
