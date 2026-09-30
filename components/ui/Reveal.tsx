import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

// Content arrives in order, a beat apart, rising a few points as it fades
// in — the screen settles rather than snapping on. Reanimated drops the
// movement on its own under Reduce Motion.
export function Reveal({
  index = 0,
  children,
  style,
}: {
  index?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View
      style={style}
      entering={FadeInDown.duration(520)
        .delay(70 + index * 60)
        .easing(Easing.out(Easing.cubic))
        .withInitialValues({ opacity: 0, transform: [{ translateY: 14 }] })}
    >
      {children}
    </Animated.View>
  );
}
