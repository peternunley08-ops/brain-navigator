import * as Haptics from '../../core/haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { alpha, colors, fonts } from '../../core/theme';
import { Icon, type IconName } from './Icon';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface HoldToConfirmProps {
  label: string;
  holdingLabel?: string;
  onComplete: () => void;
  fillColor?: string;
  /** Legacy — the ring now takes its color from fillColor. */
  borderColor?: string;
  size?: number;
  duration?: number;
  disabled?: boolean;
  icon?: IconName;
}

// A deliberate action you have to mean: hold, and a ring of light closes
// around the button. Let go early and it drains back.
export function HoldToConfirm({
  label,
  holdingLabel,
  onComplete,
  fillColor = colors.flame,
  size = 96,
  duration = 1400,
  disabled = false,
  icon,
}: HoldToConfirmProps) {
  const [holding, setHolding] = useState(false);
  const progress = useSharedValue(0);
  const stroke = 4;
  const r = size / 2 - stroke;
  const circ = 2 * Math.PI * r;

  const done = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setHolding(false);
    onComplete();
  };

  const pressIn = () => {
    if (disabled) return;
    setHolding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    cancelAnimation(progress);
    progress.value = withTiming(1, { duration: duration * (1 - progress.value), easing: Easing.inOut(Easing.quad) }, (finished) => {
      'worklet';
      if (finished) scheduleOnRN(done);
    });
  };

  const pressOut = () => {
    setHolding(false);
    if (progress.value >= 1) return;
    cancelAnimation(progress);
    progress.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.quad) });
  };

  const ring = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - progress.value) }));
  const core = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - 0.08 * Math.sin(progress.value * Math.PI) }],
    backgroundColor: alpha(fillColor, 0.1 + 0.3 * progress.value),
  }));

  return (
    <View style={[styles.wrap, disabled && styles.disabled]}>
      <Pressable
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Press and hold to confirm"
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={() => !disabled && done()}
        style={{ width: size, height: size }}
      >
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={alpha(fillColor, 0.25)} strokeWidth={stroke} fill="none" />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={fillColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circ} ${circ}`}
            animatedProps={ring}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <Animated.View
          style={[
            styles.core,
            { top: stroke * 2.5, left: stroke * 2.5, right: stroke * 2.5, bottom: stroke * 2.5, borderRadius: size },
            core,
          ]}
        >
          {icon ? <Icon name={icon} size={size * 0.34} color={fillColor} strokeWidth={1.8} /> : null}
        </Animated.View>
      </Pressable>
      <Text style={[styles.caption, holding && { color: fillColor }]}>{holding ? (holdingLabel ?? 'Keep holding…') : label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  core: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    marginTop: 12,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
