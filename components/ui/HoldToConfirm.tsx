import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../../core/theme';

interface HoldToConfirmProps {
  label: string;
  holdingLabel?: string;
  onComplete: () => void;
  fillColor?: string;
  borderColor?: string;
  size?: number;
  duration?: number;
  disabled?: boolean;
}

export function HoldToConfirm({
  label,
  holdingLabel,
  onComplete,
  fillColor = colors.leather,
  borderColor = colors.leather,
  size = 96,
  duration = 1600,
  disabled = false,
}: HoldToConfirmProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const [holding, setHolding] = useState(false);

  const safeHaptic = (fn: () => Promise<void>) => {
    fn().catch(() => {});
  };

  const handlePressIn = () => {
    if (disabled) return;
    setHolding(true);
    safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    });
    animationRef.current = anim;
    anim.start(({ finished }) => {
      if (finished) {
        safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
        onComplete();
      }
    });
  };

  const handlePressOut = () => {
    setHolding(false);
    animationRef.current?.stop();
    Animated.timing(progress, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const fillSize = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, size],
  });

  return (
    <View style={styles.wrap}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.outer,
          { width: size, height: size, borderRadius: size / 2, borderColor },
          disabled && styles.outerDisabled,
        ]}
        accessibilityLabel={label}
      >
        <Animated.View
          style={{
            width: fillSize,
            height: fillSize,
            borderRadius: Animated.divide(fillSize, 2),
            backgroundColor: fillColor,
          }}
        />
      </Pressable>
      <Text style={styles.caption}>{holding ? (holdingLabel ?? 'Hold…') : label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  outer: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  outerDisabled: {
    opacity: 0.4,
  },
  caption: {
    marginTop: spacing.md,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.inkFaint,
    textTransform: 'uppercase',
  },
});
