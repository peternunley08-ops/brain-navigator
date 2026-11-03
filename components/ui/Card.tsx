import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { alpha, colors, radii } from '../../core/theme';
import { Pressy } from './Pressy';

interface CardProps extends ViewProps {
  /** Tints the edge and wash — for a card that belongs to a state or tool. */
  tint?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

// A raised surface in the dark room: a hairline edge that catches a little
// more light along its top, like a lid under a lamp.
export function Card({ style, children, tint, onPress, onLongPress, padded = true, ...rest }: CardProps) {
  // A tinted card brightens under your finger, like leaning closer to the lamp.
  const [pressed, setPressed] = useState(false);
  const look = [
    styles.card,
    padded && styles.padded,
    tint ? { borderColor: alpha(tint, 0.3), borderTopColor: alpha(tint, 0.52) } : null,
    style,
  ];
  const wash = tint ? (
    <LinearGradient
      pointerEvents="none"
      colors={[alpha(tint, pressed ? 0.16 : 0.11), alpha(tint, pressed ? 0.05 : 0.02)]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.wash}
    />
  ) : null;

  if (onPress) {
    return (
      <Pressy
        style={look}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={tint ? () => setPressed(true) : undefined}
        onPressOut={tint ? () => setPressed(false) : undefined}
        accessibilityRole="button"
        {...rest}
      >
        {wash}
        {children}
      </Pressy>
    );
  }
  return (
    <View style={look} {...rest}>
      {wash}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.lineStrong,
    overflow: 'hidden',
  },
  padded: {
    padding: 18,
  },
  wash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
