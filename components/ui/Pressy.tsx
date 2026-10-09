import * as Haptics from '../../core/haptics';
import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { springs } from '../../core/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressyProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** How far it sinks under the finger. */
  depth?: number;
  haptic?: 'light' | 'selection' | 'none';
}

// Every tappable surface in the app sinks a little under your finger and
// springs back — the press is felt before anything else happens.
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
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole={onPress ? 'button' : undefined}
      {...rest}
      disabled={disabled}
      style={[style, anim]}
      onPressIn={(e) => {
        scale.value = withSpring(depth, springs.press);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, springs.release);
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
