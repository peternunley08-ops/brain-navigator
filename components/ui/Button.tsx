import { Pressable, PressableProps, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fonts, radii, spacing } from '../../core/theme';

type ButtonVariant = 'primary' | 'pill';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, variant = 'primary', style, disabled, ...rest }: ButtonProps) {
  return (
    <Pressable
      style={[
        styles.base,
        variant === 'pill' ? styles.pill : styles.primary,
        disabled ? styles.disabled : null,
        style,
      ]}
      disabled={disabled}
      {...rest}
    >
      <Text style={[styles.text, variant === 'pill' ? styles.pillText : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.leather,
    borderRadius: radii.md,
  },
  pill: {
    minWidth: 52,
    height: 36,
    paddingHorizontal: spacing.md - 4,
    borderRadius: radii.pill,
    backgroundColor: colors.leatherDark,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontFamily: fonts.mono,
    color: colors.background,
    fontSize: 13,
    letterSpacing: 1,
  },
  pillText: {
    fontSize: 11,
  },
});
