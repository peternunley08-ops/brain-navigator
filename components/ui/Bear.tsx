import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { colors } from '../../core/theme';

interface BearProps {
  size?: number;
}

// A small bear, the companion's visual identity — warm and cozy rather than
// nocturnal. A slow breathing scale is the screen's one deliberate motion
// moment, everything else on the screen stays still.
export function Bear({ size = 120 }: BearProps) {
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });

  const cx = size / 2;
  const cy = size / 2;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* ears */}
        <Circle cx={cx - size * 0.27} cy={cy - size * 0.26} r={size * 0.13} fill={colors.leather} />
        <Circle cx={cx + size * 0.27} cy={cy - size * 0.26} r={size * 0.13} fill={colors.leather} />
        <Circle cx={cx - size * 0.27} cy={cy - size * 0.26} r={size * 0.06} fill={colors.backgroundDeep} />
        <Circle cx={cx + size * 0.27} cy={cy - size * 0.26} r={size * 0.06} fill={colors.backgroundDeep} />

        {/* head */}
        <Circle cx={cx} cy={cy} r={size * 0.34} fill={colors.leather} />

        {/* muzzle */}
        <Ellipse cx={cx} cy={cy + size * 0.1} rx={size * 0.17} ry={size * 0.14} fill={colors.backgroundDeep} />
        <Ellipse cx={cx} cy={cy + size * 0.07} rx={size * 0.035} ry={size * 0.025} fill={colors.leatherDark} />

        {/* content, closed eyes */}
        <Path
          d={`M ${cx - size * 0.17} ${cy - size * 0.02} Q ${cx - size * 0.11} ${cy - size * 0.07} ${cx - size * 0.05} ${cy - size * 0.02}`}
          stroke={colors.leatherDark}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={`M ${cx + size * 0.05} ${cy - size * 0.02} Q ${cx + size * 0.11} ${cy - size * 0.07} ${cx + size * 0.17} ${cy - size * 0.02}`}
          stroke={colors.leatherDark}
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />

        {/* a small warm cheek blush, verdigris kept for the muzzle shadow only */}
        <Ellipse cx={cx} cy={cy + size * 0.16} rx={size * 0.05} ry={size * 0.02} fill={colors.verdigris} opacity={0.25} />
      </Svg>
    </Animated.View>
  );
}
