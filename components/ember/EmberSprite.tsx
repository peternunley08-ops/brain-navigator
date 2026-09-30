import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import { flamePath } from '../../core/flame';
import type { EmberRig } from './useEmberRig';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Ember: a small living flame with a face. It's drawn in a 100 × 120 box —
// the belly (and the face on it) stays anchored at (50, 82) while the tip
// sways, leans, and stretches above it, so the face never swims.

const CX = 50;
const CY = 79;
const EYE_DX = 9.5;
const EYE_Y = 77;
const INK = '#3A1A08';

interface EmberSpriteProps {
  rig: EmberRig;
  /** Width in points; height is 1.2×. */
  size: number;
  seed?: number;
  /** Round study glasses, for Focus. */
  glasses?: boolean;
}

export const EmberSprite = memo(function EmberSprite({ rig, size, seed = 1.3, glasses = false }: EmberSpriteProps) {
  const { time, wob, blink, lookX, lookY, happy, sleepy, dizzy, mouth, smile, flare, lean, stretch, hop, squash } = rig;
  const unit = size / 100;

  const body = useAnimatedProps(() => {
    const f = flare.value;
    const s = stretch.value;
    return {
      d: flamePath(CX, CY, 34 * f / Math.sqrt(s), 50 * f * s, lean.value, time.value, wob.value, seed, 44),
    };
  });

  const core = useAnimatedProps(() => {
    const f = flare.value;
    const s = stretch.value;
    return {
      d: flamePath(CX, CY + 5, 21.5 * f / Math.sqrt(s), 28 * f * s, lean.value * 0.75, time.value * 1.13, wob.value, seed + 2.1, 36),
    };
  });

  const glow = useAnimatedProps(() => {
    const t = time.value;
    return {
      opacity: (0.5 + 0.12 * Math.sin(t * 0.0041) * wob.value) * (1 - 0.35 * sleepy.value),
      r: 42 + 6 * flare.value,
    };
  });

  // Eyes move a touch more than the rest of the face — cheap parallax that
  // reads as the head turning.
  const eyeOpen = (side: -1 | 1) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedProps(() => {
      const shown = (1 - happy.value) * (1 - sleepy.value) * (1 - dizzy.value);
      return {
        cx: CX + side * EYE_DX + lookX.value * 3.4,
        cy: EYE_Y + lookY.value * 2.6,
        ry: Math.max(0.3, 6 * blink.value),
        opacity: shown,
      };
    });
  const leftEye = eyeOpen(-1);
  const rightEye = eyeOpen(1);

  const shine = (side: -1 | 1) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedProps(() => {
      const shown = (1 - happy.value) * (1 - sleepy.value) * (1 - dizzy.value);
      return {
        cx: CX + side * EYE_DX + lookX.value * 3.4 + 1.5,
        cy: EYE_Y + lookY.value * 2.6 - 2.2,
        opacity: blink.value > 0.5 ? shown : 0,
      };
    });
  const leftShine = shine(-1);
  const rightShine = shine(1);

  // ^ ^ when happy, ‿ ‿ when asleep, spirals when dizzy.
  const arcs = (kind: 'happy' | 'sleepy') =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedProps(() => {
      const lx = lookX.value * 2.4;
      const ly = lookY.value * 1.8;
      const bend = kind === 'happy' ? -5 : 3.2;
      let d = '';
      for (const side of [-1, 1]) {
        const x = CX + side * EYE_DX + lx;
        const y = EYE_Y + ly + (kind === 'happy' ? 1.5 : 0);
        d += `M${x - 4.6},${y} Q${x},${y + bend} ${x + 4.6},${y} `;
      }
      const amount =
        kind === 'happy' ? happy.value * (1 - sleepy.value) * (1 - dizzy.value) : sleepy.value * (1 - dizzy.value);
      return { d, opacity: amount };
    });
  const happyEyes = arcs('happy');
  const sleepyEyes = arcs('sleepy');

  const spirals = useAnimatedProps(() => {
    const t = time.value * 0.012;
    let d = '';
    for (const side of [-1, 1]) {
      const x0 = CX + side * EYE_DX;
      for (let i = 0; i <= 14; i++) {
        const a = t * side + i * 0.75;
        const r = 0.4 + i * 0.36;
        const x = x0 + Math.cos(a) * r;
        const y = EYE_Y + Math.sin(a) * r;
        d += i === 0 ? `M${x.toFixed(2)},${y.toFixed(2)} ` : `L${x.toFixed(2)},${y.toFixed(2)} `;
      }
    }
    return { d, opacity: dizzy.value };
  });

  const mouthProps = useAnimatedProps(() => {
    const x = CX + lookX.value * 2.2;
    const y = 88 + lookY.value * 1.8;
    const open = mouth.value;
    const sm = smile.value;
    const w = 4.2 + 1.2 * Math.max(0, sm) - 0.6 * open;
    const top = y - sm * 0.6 - open * 1.2;
    const bottom = y + sm * 3.2 + open * 5.2;
    return {
      d: `M${x - w},${y} Q${x},${top} ${x + w},${y} Q${x},${bottom} ${x - w},${y} Z`,
    };
  });

  // Glasses sit on the face and turn with it, a little less than the eyes.
  const lens = (side: -1 | 1) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedProps(() => ({
      cx: CX + side * EYE_DX + lookX.value * 2.6,
      cy: EYE_Y + lookY.value * 2,
    }));
  const leftLens = lens(-1);
  const rightLens = lens(1);
  const bridge = useAnimatedProps(() => {
    const x = CX + lookX.value * 2.6;
    const y = EYE_Y - 1 + lookY.value * 2;
    return { d: `M${x - 3.2},${y} Q${x},${y - 2.2} ${x + 3.2},${y}` };
  });

  const cheek = (side: -1 | 1) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedProps(() => ({
      cx: CX + side * 17 + lookX.value * 2,
      cy: 85.5 + lookY.value * 1.6,
      opacity: 0.38 + 0.3 * happy.value,
    }));
  const leftCheek = cheek(-1);
  const rightCheek = cheek(1);

  const wrap = useAnimatedStyle(() => {
    const bob = Math.sin(time.value * 0.0023) * 2.2 * wob.value;
    return {
      transform: [
        { translateY: (bob + hop.value) * unit },
        { scaleX: 2 - squash.value },
        { scaleY: squash.value },
      ],
    };
  });

  return (
    <Animated.View style={[{ width: size, height: size * 1.2 }, wrap]} pointerEvents="none">
      <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
        <Defs>
          <RadialGradient id="emberGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFB75E" stopOpacity={0.55} />
            <Stop offset="0.5" stopColor="#FF9A45" stopOpacity={0.16} />
            <Stop offset="1" stopColor="#FF9A45" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="emberBody" cx="50%" cy="72%" r="62%">
            <Stop offset="0" stopColor="#FFE6AE" />
            <Stop offset="0.5" stopColor="#F9AE4E" />
            <Stop offset="1" stopColor="#E0612A" />
          </RadialGradient>
          <RadialGradient id="emberCore" cx="50%" cy="62%" r="60%">
            <Stop offset="0" stopColor="#FFFAEA" />
            <Stop offset="0.7" stopColor="#FFE7B4" />
            <Stop offset="1" stopColor="#FFD28A" stopOpacity={0.6} />
          </RadialGradient>
        </Defs>
        <AnimatedCircle cx={CX} cy={CY - 6} fill="url(#emberGlow)" animatedProps={glow} />
        <AnimatedPath fill="url(#emberBody)" animatedProps={body} />
        <AnimatedPath fill="url(#emberCore)" animatedProps={core} />

        <AnimatedEllipse cy={85.5} rx={4.8} ry={2.6} fill="#FF7A5C" animatedProps={leftCheek} />
        <AnimatedEllipse cy={85.5} rx={4.8} ry={2.6} fill="#FF7A5C" animatedProps={rightCheek} />

        <AnimatedEllipse rx={4.3} fill={INK} animatedProps={leftEye} />
        <AnimatedEllipse rx={4.3} fill={INK} animatedProps={rightEye} />
        <AnimatedCircle r={1.5} fill="#FFFFFF" animatedProps={leftShine} />
        <AnimatedCircle r={1.5} fill="#FFFFFF" animatedProps={rightShine} />
        <AnimatedPath stroke={INK} strokeWidth={2.4} strokeLinecap="round" fill="none" animatedProps={happyEyes} />
        <AnimatedPath stroke={INK} strokeWidth={2.2} strokeLinecap="round" fill="none" animatedProps={sleepyEyes} />
        <AnimatedPath stroke={INK} strokeWidth={1.5} strokeLinecap="round" fill="none" animatedProps={spirals} />

        <AnimatedPath fill={INK} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" animatedProps={mouthProps} />

        {glasses ? (
          <>
            <AnimatedCircle r={6.8} fill="rgba(255,255,255,0.14)" stroke={INK} strokeWidth={1.8} animatedProps={leftLens} />
            <AnimatedCircle r={6.8} fill="rgba(255,255,255,0.14)" stroke={INK} strokeWidth={1.8} animatedProps={rightLens} />
            <AnimatedPath stroke={INK} strokeWidth={1.8} strokeLinecap="round" fill="none" animatedProps={bridge} />
          </>
        ) : null}
      </Svg>
    </Animated.View>
  );
});

// A still Ember for places that shouldn't animate (list icons, the nav).
export function EmberGlyph({ size = 28 }: { size?: number }) {
  const d = flamePath(CX, CY, 34, 50, 0, 0, 0, 0, 36);
  const c = flamePath(CX, CY + 5, 21.5, 28, 0, 0, 0, 2, 28);
  return (
    <View style={styles.glyph}>
      <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
        <Defs>
          <RadialGradient id="gBody" cx="50%" cy="72%" r="62%">
            <Stop offset="0" stopColor="#FFE6AE" />
            <Stop offset="0.5" stopColor="#F9AE4E" />
            <Stop offset="1" stopColor="#E0612A" />
          </RadialGradient>
        </Defs>
        <Path d={d} fill="url(#gBody)" />
        <Path d={c} fill="#FFF3D6" />
        <Path d={`M${CX - 14},${EYE_Y + 1} Q${CX - 9.5},${EYE_Y - 4} ${CX - 5},${EYE_Y + 1}`} stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none" />
        <Path d={`M${CX + 5},${EYE_Y + 1} Q${CX + 9.5},${EYE_Y - 4} ${CX + 14},${EYE_Y + 1}`} stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none" />
        <Path d={`M${CX - 5},88 Q${CX},93 ${CX + 5},88 Z`} fill={INK} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  glyph: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
