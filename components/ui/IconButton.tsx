import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { alpha, colors } from '../../core/theme';
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
}

export function IconButton({ icon, onPress, label, size = 42, color, tint, style, disabled }: IconButtonProps) {
  return (
    <Pressy
      onPress={onPress}
      disabled={disabled}
      depth={0.9}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={6}
      style={[
        styles.btn,
        { width: size, height: size, borderRadius: size / 2 },
        tint ? { backgroundColor: alpha(tint, 0.16), borderColor: alpha(tint, 0.5) } : null,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Icon name={icon} size={Math.round(size * 0.5)} color={color ?? tint ?? colors.text} strokeWidth={2} />
    </Pressy>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.35,
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
