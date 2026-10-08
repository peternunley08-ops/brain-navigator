import { type ReactNode, useEffect } from 'react';
import { Modal, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { SlideInDown, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { project, rubberband, springs, sprung, timings } from '../../core/motion';
import { alpha, colors } from '../../core/theme';
import { GLASS, GlassFill } from './Glass';
import { Pressy } from './Pressy';

const SHEET_TINT = alpha(colors.night, 0.6);

// A sheet that rises from the bottom over the dimmed page (the + sheet, the
// Drawer). Drag it down to put it away: it follows the finger, gives a little
// if pulled up, and springs back if you don't pull far enough. Given a `head`,
// only the grabber and head drag, so a list in the body can scroll.
export function Sheet({
  open,
  onClose,
  head,
  children,
  style,
}: {
  open: boolean;
  onClose: () => void;
  head?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const drag = useSharedValue(0);
  const speed = useSharedValue(0);
  useEffect(() => {
    if (open) drag.value = 0;
  }, [open, drag]);
  const pan = usePanGesture({
    activeOffsetY: 8,
    failOffsetX: [-20, 20],
    onUpdate: (e) => {
      'worklet';
      const y = e.translationY;
      drag.value = y >= 0 ? y : -rubberband(-y, 400);
      speed.value = e.velocityY;
    },
    onFinalize: () => {
      'worklet';
      if (drag.value + project(speed.value) > 140) {
        drag.value = withTiming(800, timings.base);
        scheduleOnRN(onClose);
      } else {
        drag.value = withSpring(0, { ...springs.momentum, velocity: speed.value });
      }
    },
  });
  const follow = useAnimatedStyle(() => ({ transform: [{ translateY: drag.value }] }));
  const dim = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, Math.max(0, drag.value) / 400) }));
  const sheet = [styles.sheet, GLASS && styles.glass, { paddingBottom: insets.bottom + 16 }, follow, style];
  const lens = <GlassFill radius={28} style={styles.lens} tint={SHEET_TINT} />;
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      {/* VoiceOver's escape gesture (two-finger scrub) puts it away too. */}
      <GestureHandlerRootView style={styles.fill} onAccessibilityEscape={onClose}>
        <Animated.View style={[StyleSheet.absoluteFill, dim]}>
          <Pressy style={styles.scrim} onPress={onClose} depth={1} haptic="none" accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View entering={sprung(SlideInDown)} style={styles.slot}>
          {head ? (
            <Animated.View style={sheet}>
              {lens}
              <GestureDetector gesture={pan}>
                <View>
                  <View style={styles.grabber} />
                  {head}
                </View>
              </GestureDetector>
              {children}
            </Animated.View>
          ) : (
            <GestureDetector gesture={pan}>
              <Animated.View style={sheet}>
                {lens}
                <View style={styles.grabber} />
                {children}
              </Animated.View>
            </GestureDetector>
          )}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6, 4, 8, 0.6)',
  },
  slot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  glass: {
    backgroundColor: 'transparent',
  },
  lens: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.lineStrong,
    marginBottom: 14,
  },
});
