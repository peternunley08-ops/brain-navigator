import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../core/haptics';
import { dismissTour, setTourStep, TOUR_PATHS, useShowMode, useTour } from '../core/showMode';
import { colors, fonts } from '../core/theme';
import { emberSay } from './ember/EmberBuddy';
import { Pressy } from './ui/Pressy';

const LINES: { text: string; mood: 'happy' | 'curious' | 'idle' }[] = [
  { text: 'This is the Desk. Riley sees today at a glance: what is due, what is next, one thing to start with.', mood: 'happy' },
  { text: 'School keeps Riley’s classes and homework in one place, with the nearest deadline first.', mood: 'idle' },
  { text: 'Focus is a study candle. Riley picks a stretch of time and the candle burns down with it.', mood: 'curious' },
  { text: 'Steady is for the heavier evenings: breathing, a worry box, a way to wind down.', mood: 'idle' },
  { text: 'And Your year adds it all up, gently. That is the tour. Nothing here was saved.', mood: 'happy' },
];

// While showing Riley: offers a short tour of five pages, then a small
// floating Next / End tour control above the nav. Nothing saves.
export function ShowTour() {
  const on = useShowMode((s) => s.on);
  const step = useTour((s) => s.step);
  const dismissed = useTour((s) => s.dismissed);
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  const go = (i: number) => {
    setTourStep(i);
    router.navigate(TOUR_PATHS[i] as never);
    emberSay(LINES[i].text, LINES[i].mood);
  };

  // If show mode stops mid-tour, the store resets itself; nothing to do.
  useEffect(() => {
    if (!on && step !== -1) dismissTour();
  }, [on, step]);

  if (!on) return null;
  const bottom = insets.bottom + 96;

  if (step < 0) {
    if (dismissed) return null;
    return (
      <Animated.View entering={reduced ? undefined : FadeInDown.duration(260)} exiting={reduced ? undefined : FadeOutDown.duration(180)} style={[styles.wrap, { bottom }]} pointerEvents="box-none">
        <View style={styles.row}>
          <Pressy onPress={() => { Haptics.selectionAsync().catch(() => {}); go(0); }} style={styles.gold} accessibilityRole="button" accessibilityLabel="Take the tour of Riley's pages">
            <Text style={styles.goldText} maxFontSizeMultiplier={1.2}>Take the tour</Text>
          </Pressy>
          <Pressy onPress={dismissTour} hitSlop={10} style={styles.quiet} accessibilityRole="button" accessibilityLabel="Not now">
            <Text style={styles.quietText} maxFontSizeMultiplier={1.2}>Not now</Text>
          </Pressy>
        </View>
      </Animated.View>
    );
  }

  const last = step >= TOUR_PATHS.length - 1;
  return (
    <Animated.View entering={reduced ? undefined : FadeInDown.duration(260)} exiting={reduced ? undefined : FadeOutDown.duration(180)} style={[styles.wrap, { bottom }]} pointerEvents="box-none">
      <View style={styles.row}>
        <Pressy
          onPress={() => { Haptics.selectionAsync().catch(() => {}); if (last) dismissTour(); else go(step + 1); }}
          style={styles.gold}
          accessibilityRole="button"
          accessibilityLabel={last ? 'End the tour' : `Next page, ${step + 2} of ${TOUR_PATHS.length}`}
        >
          <Text style={styles.goldText} maxFontSizeMultiplier={1.2}>{last ? 'End tour' : 'Next'}</Text>
        </Pressy>
        {!last ? (
          <Pressy onPress={dismissTour} hitSlop={10} style={styles.quiet} accessibilityRole="button" accessibilityLabel="End the tour">
            <Text style={styles.quietText} maxFontSizeMultiplier={1.2}>End tour</Text>
          </Pressy>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gold: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: colors.flame,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  goldText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.flameInk },
  quiet: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quietText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted },
});
