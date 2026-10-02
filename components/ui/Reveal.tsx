import { createContext, type ReactNode, useContext } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

/** False when the page has been opened before this session: it's simply there. */
export const RevealContext = createContext(true);

// Content arrives in order, a beat apart, rising a few points as it fades
// in — the screen settles rather than snapping on. Only the first time a
// page opens in a session, and quickly, so pages never feel slow to use.
// Reanimated drops the movement on its own under Reduce Motion.
export function Reveal({
  index = 0,
  children,
  style,
}: {
  index?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const animate = useContext(RevealContext);
  return (
    <Animated.View
      style={style}
      entering={
        animate
          ? FadeInDown.duration(400)
              .delay(40 + Math.min(index, 6) * 45)
              .easing(Easing.out(Easing.cubic))
              .withInitialValues({ opacity: 0, transform: [{ translateY: 12 }] })
          : undefined
      }
    >
      {children}
    </Animated.View>
  );
}
