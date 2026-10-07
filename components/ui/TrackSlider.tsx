import * as Haptics from '../../core/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { springs } from '../../core/motion';
import { scheduleOnRN } from 'react-native-worklets';
import { alpha, colors, fonts } from '../../core/theme';

interface TrackSliderProps {
  min: number;
  max: number;
  value: number | null;
  onChange: (value: number) => void;
  fillColor?: string;
  /** Words under each end of the track. */
  labels?: [string, string];
}

const THUMB = 30;

// Drag or tap anywhere on the track. The thumb follows your finger, snaps
// to whole steps when you let go, and ticks under your thumb at each one.
export function TrackSlider({ min, max, value, onChange, fillColor = colors.flame, labels }: TrackSliderProps) {
  const [width, setWidth] = useState(0);
  const span = max - min;
  const usable = Math.max(1, width - THUMB);

  const pos = useSharedValue(0); // thumb's left edge, in points
  const pressed = useSharedValue(0);
  const last = useSharedValue(value ?? -1);
  const geo = useSharedValue({ usable, min, span });

  useEffect(() => {
    geo.value = { usable, min, span };
    if (value != null) pos.value = withSpring(((value - min) / span) * usable, springs.snappy);
    else pos.value = usable / 2;
    last.value = value ?? -1;
  }, [value, usable, min, span, geo, pos, last]);

  const latest = useRef(onChange);
  latest.current = onChange;
  const emit = (n: number) => {
    Haptics.selectionAsync().catch(() => {});
    latest.current(n);
  };

  // Inside a scroll view, a vertical swipe that starts on the track must
  // still scroll the page: the slider only takes over once the finger moves
  // sideways, and a tap (no real movement) jumps straight to that step.
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const moved = useSharedValue(0);

  const setFromX = (x0: number) => {
    'worklet';
    const g = geo.value;
    const x = Math.max(0, Math.min(g.usable, x0 - THUMB / 2));
    pos.value = x;
    const n = Math.round(g.min + (x / g.usable) * g.span);
    if (n !== last.value) {
      last.value = n;
      scheduleOnRN(emit, n);
    }
  };

  const pan = usePanGesture({
    activeOffsetX: [-4, 4],
    failOffsetY: [-12, 12],
    onBegin: (e) => {
      'worklet';
      startX.value = e.x;
      startY.value = e.y;
      moved.value = 0;
      pressed.value = withSpring(1, springs.press);
    },
    onUpdate: (e) => {
      'worklet';
      moved.value = 1;
      setFromX(e.x);
    },
    onFinalize: (e) => {
      'worklet';
      pressed.value = withSpring(0, springs.release);
      if (!moved.value && Math.abs(e.x - startX.value) < 10 && Math.abs(e.y - startY.value) < 10) {
        setFromX(e.x);
      }
      const g = geo.value;
      if (last.value >= 0) pos.value = withSpring(((last.value - g.min) / g.span) * g.usable, springs.snappy);
    },
  });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pos.value }, { scale: 1 + 0.18 * pressed.value }],
  }));
  const fillStyle = useAnimatedStyle(() => ({ width: pos.value + THUMB / 2 }));

  const set = value != null;

  return (
    <View>
      <GestureDetector gesture={pan}>
        <View
          style={styles.hit}
          onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
          accessible
          accessibilityRole="adjustable"
          accessibilityValue={{ min, max, now: value ?? undefined, text: set ? `${value} of ${max}` : 'Not set' }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => {
            const cur = value ?? Math.round((min + max) / 2);
            if (e.nativeEvent.actionName === 'increment') onChange(Math.min(max, cur + 1));
            if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(min, cur - 1));
          }}
        >
          <View style={styles.track}>
            {Array.from({ length: span + 1 }, (_, i) => (
              <View key={i} style={[styles.tick, { left: THUMB / 2 + (i / span) * usable - 1.5 }]} />
            ))}
          </View>
          {set ? (
            <Animated.View style={[styles.fill, fillStyle]}>
              <LinearGradient
                colors={[alpha(fillColor, 0.35), fillColor]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          ) : null}
          <Animated.View
            style={[
              styles.thumb,
              set ? { backgroundColor: fillColor, shadowColor: fillColor } : styles.thumbUnset,
              thumbStyle,
            ]}
          >
            <Text style={[styles.thumbText, !set && styles.thumbTextUnset]}>{set ? value : '?'}</Text>
          </Animated.View>
        </View>
      </GestureDetector>
      {labels ? (
        <View style={styles.labels}>
          <Text style={styles.label}>{labels[0]}</Text>
          <Text style={styles.label}>{labels[1]}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hit: {
    height: 44,
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceSunk,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tick: {
    position: 'absolute',
    top: 2,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.lineStrong,
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.night,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  thumbUnset: {
    backgroundColor: colors.surfaceHigh,
    borderColor: colors.lineStrong,
    borderWidth: 1,
  },
  thumbText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.flameInk,
  },
  thumbTextUnset: {
    color: colors.textFaint,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
});
