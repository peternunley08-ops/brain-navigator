import { useFocusEffect } from 'expo-router';
import { memo, type RefObject, useCallback, useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { takeSparks } from '../../core/sparks';
import { alpha, colors } from '../../core/theme';

// A burst of little sparks thrown off a flame — Ember's delight, and the
// flourish when a candle is resolved. Bump `burst` to fire it.

const COUNT = 9;

interface SparksProps {
  burst: number;
  /** Distance the sparks travel, in points. */
  reach?: number;
  color?: string;
}

export const Sparks = memo(function Sparks({ burst, reach = 46, color = '#FFD08A' }: SparksProps) {
  const p = useSharedValue(1);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (burst === 0 || reduced) return;
    p.value = 0;
    p.value = withTiming(1, { duration: 760, easing: Easing.out(Easing.cubic) });
  }, [burst, reduced, p]);

  return (
    <View style={styles.center} pointerEvents="none">
      {Array.from({ length: COUNT }, (_, i) => (
        <Spark key={i} i={i} p={p} reach={reach} color={color} />
      ))}
    </View>
  );
});

function Spark({ i, p, reach, color }: { i: number; p: SharedValue<number>; reach: number; color: string }) {
  // Spread upward mostly — sparks rise.
  const angle = -Math.PI / 2 + ((i / (COUNT - 1)) - 0.5) * Math.PI * 1.5;
  const dist = reach * (0.7 + ((i * 37) % 10) / 22);
  const size = 3 + (i % 3);
  const style = useAnimatedStyle(() => {
    const v = p.value;
    return {
      opacity: v >= 1 ? 0 : (1 - v) * Math.min(1, v * 8),
      transform: [
        { translateX: Math.cos(angle) * dist * v },
        { translateY: Math.sin(angle) * dist * v + 18 * v * v },
        { rotate: '45deg' },
        { scale: 1 - v * 0.6 },
      ],
    };
  });
  return (
    <Animated.View
      style={[styles.spark, { width: size, height: size, backgroundColor: color, shadowColor: color }, style]}
    />
  );
}

// Birthday confetti: a few slow pieces drifting down across the room, once.
const PIECES = 16;

export const Confetti = memo(function Confetti({ run, width, height, colors }: { run: number; width: number; height: number; colors: string[] }) {
  const p = useSharedValue(1);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (run === 0 || reduced) return;
    p.value = 0;
    p.value = withTiming(1, { duration: 5200, easing: Easing.linear });
  }, [run, reduced, p]);
  if (run === 0 || reduced) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: PIECES }, (_, i) => (
        <Piece key={i} i={i} p={p} width={width} height={height} color={colors[i % colors.length]} />
      ))}
    </View>
  );
});

function Piece({ i, p, width, height, color }: { i: number; p: SharedValue<number>; width: number; height: number; color: string }) {
  const x0 = ((i * 53) % 100) / 100 * width;
  const delay = ((i * 29) % 10) / 24;
  const sway = 12 + (i % 4) * 5;
  const w = 5 + (i % 3) * 2;
  const style = useAnimatedStyle(() => {
    const v = Math.max(0, Math.min(1, (p.value - delay) / (1 - delay)));
    return {
      opacity: v <= 0 || v >= 1 ? 0 : Math.min(1, v * 6) * Math.min(1, (1 - v) * 5),
      transform: [
        { translateX: x0 + Math.sin(v * 9 + i) * sway },
        { translateY: -20 + v * (height * 0.7) },
        { rotate: `${v * 360 + i * 40}deg` },
      ],
    };
  });
  return <Animated.View style={[styles.piece, { width: w, height: w * 0.55, backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  glow: { position: 'absolute', height: 140, borderRadius: 70, backgroundColor: alpha(colors.flameHot, 0.22) },
  rise: { position: 'absolute', left: 0, top: 0, width: 5, height: 5, backgroundColor: '#FFD08A' },
  piece: { position: 'absolute', top: 0, left: 0, borderRadius: 1 },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spark: {
    position: 'absolute',
    borderRadius: 1,
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
});

// Sparks earned elsewhere rise from the bottom of the screen into the candle
// row, then the candles glow briefly. Mount once on the Desk (Screen overlay).
const MAX_FLIGHT = 8;

// `target` is the candle row: measured when the Desk comes into view, so the
// sparks land on the candles. With the candles off screen they just rise
// and fade, and nothing glows where the candles aren't.
export const SparkFlight = memo(function SparkFlight({ target }: { target?: RefObject<View | null> }) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const [flight, setFlight] = useState<{ n: number; key: number; y: number | null }>({ n: 0, key: 0, y: null });
  const glow = useSharedValue(0);
  const ty = flight.y ?? height * 0.42;

  useFocusEffect(
    useCallback(() => {
      const n = takeSparks();
      if (n <= 0) return;
      const start = (y: number | null) => setFlight((f) => ({ n: Math.min(MAX_FLIGHT, n), key: f.key + 1, y }));
      const row = target?.current;
      if (!row) {
        start(null);
        return;
      }
      row.measureInWindow((_x, y, _w, h) => {
        const mid = y + h / 2;
        start(h > 0 && mid > height * 0.12 && mid < height * 0.85 ? mid : null);
      });
    }, [target, height])
  );

  useEffect(() => {
    if (flight.n === 0 || flight.y == null) return;
    glow.value = reduced
      ? withSequence(withTiming(0.6, { duration: 500 }), withTiming(0, { duration: 900 }))
      : withDelay(900, withSequence(withTiming(1, { duration: 300 }), withTiming(0, { duration: 900 })));
  }, [flight, reduced, glow]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value * 0.5 }));

  if (flight.n === 0) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {flight.y != null ? <Animated.View style={[styles.glow, { top: ty - 70, width: width * 0.9, left: width * 0.05 }, glowStyle]} /> : null}
      {reduced ? null : Array.from({ length: flight.n }, (_, i) => (
        <Rising key={`${flight.key}-${i}`} i={i} n={flight.n} width={width} height={height} ty={ty} />
      ))}
    </View>
  );
});

function Rising({ i, n, width, height, ty }: { i: number; n: number; width: number; height: number; ty: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(i * 90, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [i, p]);
  const x0 = width * (0.2 + 0.6 * ((i * 5) % n) / Math.max(1, n));
  const x1 = width * (0.3 + 0.4 * ((i * 3) % n) / Math.max(1, n));
  const style = useAnimatedStyle(() => {
    const v = p.value;
    return {
      opacity: v <= 0 ? 0 : v >= 1 ? 0 : Math.min(1, v * 6) * (1 - v * v),
      transform: [
        { translateX: x0 + (x1 - x0) * v + Math.sin(v * 9 + i) * 8 },
        { translateY: height + (ty - height) * v },
        { rotate: '45deg' },
        { scale: 1 - v * 0.4 },
      ],
    };
  });
  return <Animated.View style={[styles.rise, style]} />;
}
