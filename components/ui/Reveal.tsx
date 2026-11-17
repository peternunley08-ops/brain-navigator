import { createContext, type ReactNode, useContext } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { sprung } from '../../core/motion';

/** False when the page has been opened before this session: it's simply there. */
export const RevealContext = createContext(true);

// Content arrives in order, a beat apart, rising a few points as it settles
// on the gentle spring. Only the first time a page opens in a session.
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
          ? sprung(
              FadeInDown.delay(40 + Math.min(index, 6) * 45).withInitialValues({
                opacity: 0,
                transform: [{ translateY: 8 }],
              }),
            )
          : undefined
      }
    >
      {children}
    </Animated.View>
  );
}
