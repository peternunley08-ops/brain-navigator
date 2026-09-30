import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { alpha, colors, radii } from '../../core/theme';
import { Pressy } from './Pressy';

interface CardProps extends ViewProps {
  /** Tints the edge and wash — for a card that belongs to a state or tool. */
  tint?: string;
  onPress?: () => void;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

// A raised surface in the dark room: a hairline edge that catches a little
// more light along its top, like a lid under a lamp.
export function Card({ style, children, tint, onPress, padded = true, ...rest }: CardProps) {
  const look = [
    styles.card,
    padded && styles.padded,
    tint ? { borderColor: alpha(tint, 0.3), borderTopColor: alpha(tint, 0.45) } : null,
    style,
  ];
  const wash = tint ? (
    <View pointerEvents="none" style={[styles.wash, { backgroundColor: alpha(tint, 0.07) }]} />
  ) : null;

  if (onPress) {
    return (
      <Pressy style={look} onPress={onPress} accessibilityRole="button" {...rest}>
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
