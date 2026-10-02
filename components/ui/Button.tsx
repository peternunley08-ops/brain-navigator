import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, type PressableProps, type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { alpha, colors, fonts, gradients, radii } from '../../core/theme';
import { Icon, type IconName } from './Icon';
import { Pressy } from './Pressy';

// primary   — candle-gold fill; the one main action on a screen.
// secondary — a quiet raised surface; everything else.
// ghost     — text only, for links and tertiary actions.
// pill      — legacy name for a small secondary.
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'pill';

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  icon?: IconName;
  /** Recolors a secondary/ghost button (e.g. sage for resolve). */
  tint?: string;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  variant = 'primary',
  size,
  icon,
  tint,
  loading,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const v = variant === 'pill' ? 'secondary' : variant;
  const s = size ?? (variant === 'pill' ? 'sm' : 'md');
  const small = s === 'sm';
  const fg =
    v === 'primary' ? colors.flameInk : tint ?? (v === 'ghost' ? colors.flame : colors.text);

  const content = (
    <View style={[styles.row, small && styles.rowSmall]}>
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : icon ? (
        <Icon name={icon} size={small ? 16 : 19} color={fg} strokeWidth={2} />
      ) : null}
      <Text style={[styles.text, small && styles.textSmall, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );

  return (
    <Pressy
      {...rest}
      disabled={disabled || loading}
      haptic={v === 'primary' ? 'light' : 'selection'}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading) }}
      style={[
        styles.base,
        small ? styles.small : styles.medium,
        v === 'secondary' && [
          styles.secondary,
          tint ? { borderColor: alpha(tint, 0.45), backgroundColor: alpha(tint, 0.1) } : null,
        ],
        v === 'ghost' && styles.ghost,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {v === 'primary' ? (
        <LinearGradient
          colors={gradients.flame}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.fill, small ? styles.small : styles.medium]}
        >
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressy>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  medium: {
    minHeight: 54,
    borderRadius: radii.pill,
  },
  small: {
    minHeight: 38,
    borderRadius: radii.pill,
  },
  fill: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.flame,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  rowSmall: {
    gap: 6,
    paddingHorizontal: 16,
  },
  secondary: {
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.42,
  },
  text: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    letterSpacing: 0.1,
  },
  textSmall: {
    fontSize: 14,
  },
});
