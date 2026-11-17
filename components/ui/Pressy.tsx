import * as Haptics from '../../core/haptics';
import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { springs } from '../../core/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressyProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** How far it sinks under the finger. */
  depth?: number;
  haptic?: 'light' | 'selection' | 'none';
}

// Every tappable surface sinks a pixel under your finger and springs back.
// The sink is one pixel, so it does not take the finger's speed. A fast
// flick would throw the control off the page.
export function Pressy({
  style,
  children,
  depth = 0.965,
  haptic = 'selection',
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}: PressyProps) {
  const scale = useSharedValue(1);
  const sink = useSharedValue(0);
  const reduced = useReducedMotion();
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: sink.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole={onPress ? 'button' : undefined}
      {...rest}
      disabled={disabled}
      style={[style, anim]}
      onPressIn={(e) => {
        if (!disabled && !reduced) {
          scale.value = withSpring(depth, springs.press);
          sink.value = withSpring(1, springs.press);
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (reduced || disabled) {
          scale.value = 1;
          sink.value = 0;
        } else {
          scale.value = withSpring(1, springs.release);
          sink.value = withSpring(0, springs.release);
        }
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        else if (haptic === 'selection') Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
