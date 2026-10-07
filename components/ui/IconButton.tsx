import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { alpha, colors } from '../../core/theme';
import { GLASS, GlassFill } from './Glass';
import { Icon, type IconName } from './Icon';
import { Pressy } from './Pressy';

interface IconButtonProps {
  icon: IconName;
  onPress?: () => void;
  label: string;
  size?: number;
  color?: string;
  /** Filled with the tint instead of the plain surface. */
  tint?: string;
  style?: StyleProp<ViewStyle>;
  /** Dimmed and inert, e.g. "move up" on the first row. */
  disabled?: boolean;
  onLongPress?: () => void;
  accessibilityHint?: string;
  /** Liquid Glass, for buttons that float over the page. */
  glass?: boolean;
}

export function IconButton({ icon, onPress, onLongPress, accessibilityHint, label, size = 42, color, tint, style, disabled, glass }: IconButtonProps) {
  const lens = glass && GLASS && !tint;
  return (
    <Pressy
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      depth={0.9}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={6}
      style={[
        styles.btn,
        { width: size, height: size, borderRadius: size / 2 },
        tint ? { backgroundColor: alpha(tint, 0.16), borderColor: alpha(tint, 0.5) } : null,
        lens && styles.lens,
        disabled && styles.disabled,
        style,
      ]}
    >
      {lens ? <GlassFill radius={size / 2} /> : null}
      <Icon name={icon} size={Math.round(size * 0.5)} color={color ?? tint ?? colors.text} strokeWidth={2} />
    </Pressy>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.35,
  },
  lens: {
    backgroundColor: 'transparent',
    borderColor: colors.line,
  },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.lineStrong,
  },
});
