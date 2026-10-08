import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { goHome } from '../core/chrome';
import { endShow } from '../core/show';
import { useShowMode } from '../core/showMode';
import { colors, fonts } from '../core/theme';
import { emberSay } from './ember/EmberBuddy';
import { Icon } from './ui/Icon';
import { Pressy } from './ui/Pressy';

// While showing someone the app: a small pill under the status bar saying
// so, and the way back. Always on top, so it's never in doubt whose app
// this is right now.
export function ShowBanner() {
  const on = useShowMode((s) => s.on);
  const insets = useSafeAreaInsets();
  const [leaving, setLeaving] = useState(false);
  if (!on) return null;

  const leave = async () => {
    setLeaving(true);
    // Home first, then your own data: if the welcome isn't finished (a first
    // run that peeked at Riley), the Desk opens it again once it's back.
    goHome();
    await endShow();
    setLeaving(false);
    emberSay('Back to your own app. Everything is just as you left it.', 'happy');
  };

  return (
    <Animated.View entering={FadeInUp.duration(260)} exiting={FadeOutUp.duration(200)} style={[styles.wrap, { top: Math.max(insets.top - 14, 40) }]} pointerEvents="box-none">
      <Pressy onPress={leave} hitSlop={10} style={styles.pill} accessibilityRole="button" accessibilityLabel="Showing Riley, a sample student. Tap to go back to your own app." disabled={leaving}>
        <Icon name="sparkle" size={11} color={colors.flameInk} />
        <Text style={styles.text} maxFontSizeMultiplier={1}>Showing Riley</Text>
        <View style={styles.sep} />
        {leaving ? <ActivityIndicator size="small" color={colors.flameInk} /> : <Text style={styles.done} maxFontSizeMultiplier={1}>Done</Text>}
      </Pressy>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 22,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.flame,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  text: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.flameInk,
  },
  sep: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(40, 24, 10, 0.3)',
  },
  done: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.flameInk,
  },
});
