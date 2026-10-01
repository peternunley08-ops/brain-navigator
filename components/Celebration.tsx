import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { useCelebrateStore } from '../core/celebrateStore';
import { alpha, colors, fonts } from '../core/theme';
import { Sparks } from './ember/Sparks';
import { Pressy } from './ui/Pressy';

const HOLD = 3200;
// Where the bursts go off, as fractions of the screen, a little after each other.
const SPOTS = [
  { x: 0.5, y: 0.42, delay: 0 },
  { x: 0.22, y: 0.3, delay: 180 },
  { x: 0.78, y: 0.32, delay: 320 },
  { x: 0.3, y: 0.58, delay: 460 },
  { x: 0.72, y: 0.6, delay: 600 },
];

// A whole-screen moment for real milestones. Tap anywhere to close; it goes
// on its own after a few seconds.
export function Celebration() {
  const moment = useCelebrateStore((s) => s.moment);
  const clear = useCelebrateStore((s) => s.clear);
  const [bursts, setBursts] = useState<number[]>(SPOTS.map(() => 0));

  useEffect(() => {
    if (!moment) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const timers = SPOTS.map((s, i) => setTimeout(() => setBursts((b) => b.map((v, j) => (j === i ? v + 1 : v))), s.delay));
    const done = setTimeout(() => clear(moment.id), HOLD);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, [moment, clear]);

  if (!moment) return null;
  const color = moment.color ?? colors.flame;
  return (
    <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(260)} style={[StyleSheet.absoluteFill, styles.wrap]}>
      <Pressy onPress={() => clear(moment.id)} haptic="none" depth={1} style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={`${moment.title}. Tap to close.`}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: alpha(colors.night, 0.92) }]} />
        {SPOTS.map((s, i) => (
          <View key={i} style={[styles.spot, { left: `${s.x * 100}%`, top: `${s.y * 100}%` }]} pointerEvents="none">
            <Sparks burst={bursts[i]} reach={110} color={i % 2 ? '#FFE3A8' : color} />
          </View>
        ))}
        <View style={styles.center} pointerEvents="none">
          <Animated.Text entering={ZoomIn.springify().damping(12)} style={[styles.title, { color }]}>
            {moment.title}
          </Animated.Text>
          {moment.body ? (
            <Animated.Text entering={FadeIn.delay(260).duration(300)} style={styles.body}>
              {moment.body}
            </Animated.Text>
          ) : null}
          <Text style={styles.hint}>Tap anywhere</Text>
        </View>
      </Pressy>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    zIndex: 50,
  },
  spot: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 40,
    textAlign: 'center',
  },
  body: {
    marginTop: 10,
    fontFamily: fonts.displaySoft,
    fontSize: 17,
    lineHeight: 24,
    color: colors.text,
    textAlign: 'center',
    maxWidth: 320,
  },
  hint: {
    marginTop: 28,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
});
