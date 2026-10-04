import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEmberStore } from '../core/emberStore';
import * as Haptics from '../core/haptics';
import { dismissTour, setTourStep, TOUR_PATHS, useShowMode, useTour } from '../core/showMode';
import { colors, fonts, layout, radii } from '../core/theme';
import { emberStepsAside } from './ember/EmberBuddy';
import { Pressy } from './ui/Pressy';

const LINES: { text: string; mood: 'happy' | 'curious' | 'idle' }[] = [
  { text: 'This is the Desk. Today Riley has a Gatsby reading and Problem set 4.2 due, and one thing to make it a good day.', mood: 'happy' },
  { text: 'School keeps AP Biology, Algebra II and the rest in one place. The Genetics unit test is four days out.', mood: 'idle' },
  { text: 'Focus is a study candle. Riley has been giving it 25 minutes at a time, most recently for the Genetics unit test.', mood: 'curious' },
  { text: 'Steady is the rest of being a student: sleep, a toolkit for hard moments, and a worry box for heavier evenings.', mood: 'idle' },
  { text: 'Your year adds up Riley’s weeks, gently. That is the tour, and nothing here was saved.', mood: 'happy' },
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
    // Asked for (they tapped Next), so it comes at once and stays whole.
    useEmberStore.getState().say(LINES[i].text, LINES[i].mood, true);
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
  // Ember steps aside on Focus (its own Ember is on stage), so the tour says that line itself.
  const ownLine = emberStepsAside(TOUR_PATHS[step]) ? LINES[step].text : null;
  return (
    <Animated.View entering={reduced ? undefined : FadeInDown.duration(260)} exiting={reduced ? undefined : FadeOutDown.duration(180)} style={[styles.wrap, { bottom }]} pointerEvents="box-none">
      {ownLine ? <Text style={styles.line}>{ownLine}</Text> : null}
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
  line: {
    maxWidth: 320,
    marginHorizontal: layout.gutter,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surfaceHigh,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },
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
