import { memo, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { FLAME_CORE, FLAME_MID, flamePath } from '../../core/flame';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Wax in a dark room: lit from its own flame above, falling off into
// shadow on the far side. An unlit candle is the same wax with the lamp off.
const WAX = { lit: ['#FFF4DE', '#F2DFBE', '#B99C74'], unlit: ['#CFC4B0', '#AFA28B', '#6F6453'] };
const WAX_POOL = { lit: '#FFF8EA', unlit: '#D8CDB9' };
const OUTLINE = '#140D0A';
const WICK = '#241913';
const DISH = ['#DDAA5E', '#9A6B31', '#4E3518'];
const SMOKE = '#B9ADA3';
const SEAL = '#8CC0A8';
const SEAL_EDGE = '#43665A';
const WARM = '#F5A04E';

// Every candle is one thing still open. `lit` is the normal state;
// `snuffed` is resolved (the flame goes out, smoke curls up, a verdigris
// seal presses into the wax); `floated` is let go (the flame lifts off the
// wick and drifts away like a sky lantern).
export type CandleState = 'lit' | 'snuffed' | 'floated' | 'unlit';

const DAY_MS = 24 * 60 * 60 * 1000;

// The same entry must look like the same candle everywhere it appears —
// the drip position, flicker rhythm, and height all derive from these.
export function candleSeed(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100003;
  return (h % 1000) / 100;
}

/** How much wax is left: burns from full to a third over three weeks open. */
export function candleRemaining(createdAt: string) {
  const days = (Date.now() - new Date(createdAt).getTime()) / DAY_MS;
  return Math.max(0.32, Math.min(1, 1 - days / 21));
}

interface Props {
  width: number;
  time: SharedValue<number>;
  /** 0–1: how strongly this was felt. Bigger, brighter flame. */
  intensity: number;
  /** 0.3–1: how much wax is left. Open longer, burned lower. */
  remaining: number;
  seed: number;
  state: CandleState;
  reducedMotion: boolean;
  /** Stagger for the Desk's one-by-one lighting. */
  igniteDelay?: number;
  /** How far a released flame travels upward, in points. */
  riseDistance?: number;
}

function CandleBase({
  width: W,
  time,
  intensity,
  remaining,
  seed,
  state,
  reducedMotion,
  igniteDelay = 0,
  riseDistance,
}: Props) {
  const H = W * 1.42;
  const cx = W / 2;
  const bw = W * 0.34;
  const dishY = H - H * 0.045;
  const bodyBottom = dishY - 2;
  const bodyH = H * 0.5 * Math.max(0.3, Math.min(1, remaining));
  const top = bodyBottom - bodyH;
  const poolRy = bw * 0.15;
  const wickTop = top - W * 0.07;
  const rise = riseDistance ?? H * 3.2;

  const lit = useSharedValue(state === 'lit' ? 0 : state === 'floated' ? 1 : 0);
  const lift = useSharedValue(state === 'floated' ? 1 : 0);
  const smoke = useSharedValue(0);
  const sealed = useSharedValue(state === 'snuffed' ? 1 : 0);

  const first = useRef(true);
  useEffect(() => {
    const initial = first.current;
    first.current = false;

    if (state === 'lit') {
      lift.value = 0;
      sealed.value = 0;
      lit.value = withDelay(
        initial ? igniteDelay : 0,
        withSpring(1, { damping: 9, stiffness: 120, mass: 0.8 })
      );
      return;
    }
    if (state === 'unlit') {
      lit.value = withTiming(0, { duration: 400 });
      return;
    }
    // Something that was already closed when the screen opened just shows
    // its end state; the animation only plays when it closes in front of you.
    if (initial) return;

    // With Reduce Motion, both closings are a quiet fade in place: no smoke
    // rising, no seal spring, no flame travelling up the screen.
    if (reducedMotion) {
      lit.value = withTiming(0, { duration: 400 });
      if (state === 'snuffed') sealed.value = withDelay(200, withTiming(1, { duration: 300 }));
      return;
    }

    if (state === 'snuffed') {
      lit.value = withTiming(0, { duration: 620, easing: Easing.in(Easing.quad) });
      smoke.value = withDelay(260, withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }));
      sealed.value = withDelay(820, withSpring(1, { damping: 11, stiffness: 190 }));
    } else if (state === 'floated') {
      lift.value = withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.cubic) });
    }
  }, [state, igniteDelay, reducedMotion, lit, lift, smoke, sealed]);

  const wob = reducedMotion ? 0 : 1;
  const points = W > 120 ? 40 : 28;

  const flameProps = useAnimatedProps(() => {
    const l = lit.value;
    const half = W * (0.075 + 0.045 * intensity) * Math.max(0, l);
    const height = half * 2.2;
    const cy = wickTop - half * 0.55;
    return {
      d: half < 0.3 ? 'M0,0Z' : flamePath(cx, cy, half, height, 0, time.value, wob, seed, points),
      opacity: Math.min(1, l * 1.6),
    };
  });

  const coreProps = useAnimatedProps(() => {
    const l = lit.value;
    const half = W * (0.075 + 0.045 * intensity) * Math.max(0, l) * 0.46;
    const height = half * 1.7;
    const cy = wickTop - half * 0.3;
    return {
      d: half < 0.3 ? 'M0,0Z' : flamePath(cx, cy, half, height, 0, time.value, wob * 0.7, seed + 2.7, 24),
      opacity: Math.min(0.92, l * 1.4),
    };
  });

  const haloProps = useAnimatedProps(() => {
    const l = Math.max(0, lit.value);
    const breath = reducedMotion ? 1 : 1 + 0.04 * Math.sin(time.value * 0.0013 + seed);
    return {
      r: W * (0.33 + 0.145 * intensity) * l * breath,
      opacity: Math.min(1, l),
    };
  });

  // A released flame drifts up and a little side to side, shrinking and
  // fading as it goes, like a lantern catching the air.
  const flameLayerStyle = useAnimatedStyle(() => {
    const p = lift.value;
    return {
      opacity: p < 0.62 ? 1 : Math.max(0, 1 - (p - 0.62) / 0.38),
      transform: [
        { translateY: -rise * p * p },
        { translateX: Math.sin(p * Math.PI * 2.2 + seed) * 16 * p },
        { scale: 1 - 0.4 * p },
      ],
    };
  });

  const poolProps = useAnimatedProps(() => {
    const l = Math.max(0, Math.min(1, lit.value)) * (1 - lift.value);
    const breath = reducedMotion ? 1 : 1 + 0.05 * Math.sin(time.value * 0.0017 + seed * 2);
    return { opacity: l * (0.6 + 0.4 * intensity) * breath };
  });

  const wisps = [0, 1, 2];
  const sealR = Math.min(bw * 0.34, bodyH * 0.22);
  const sealY = top + Math.max(bodyH * 0.4, sealR + poolRy + 4);

  const sealProps = useAnimatedProps(() => {
    const s = sealed.value;
    return { r: sealR * (1 + (1 - s) * 0.7), opacity: Math.min(1, s * 1.8) };
  });
  const sealRingProps = useAnimatedProps(() => {
    const s = sealed.value;
    return { r: sealR * 0.62 * (1 + (1 - s) * 0.7), opacity: Math.min(0.7, s * 1.4) };
  });

  const dripX = cx - bw / 2 + bw * (0.52 + 0.18 * Math.sin(seed * 3.1));
  const dripW = bw * 0.17;
  const dripLen = Math.min(bodyH * 0.34, W * 0.2);
  const rt = bw * 0.1;
  const x0 = cx - bw / 2;
  const x1 = cx + bw / 2;

  const gid = `c${Math.round(seed * 1000)}`;
  const wax = state === 'unlit' ? WAX.unlit : WAX.lit;
  const pool = state === 'unlit' ? WAX_POOL.unlit : WAX_POOL.lit;

  return (
    <View style={{ width: W, height: H }} pointerEvents="none">
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`${gid}w`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={wax[0]} />
            <Stop offset="0.45" stopColor={wax[1]} />
            <Stop offset="1" stopColor={wax[2]} />
          </LinearGradient>
          <LinearGradient id={`${gid}s`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={OUTLINE} stopOpacity={0} />
            <Stop offset="0.6" stopColor={OUTLINE} stopOpacity={0.05} />
            <Stop offset="1" stopColor={OUTLINE} stopOpacity={0.4} />
          </LinearGradient>
          <LinearGradient id={`${gid}d`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={DISH[0]} />
            <Stop offset="0.5" stopColor={DISH[1]} />
            <Stop offset="1" stopColor={DISH[2]} />
          </LinearGradient>
          <RadialGradient id={`${gid}p`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={WARM} stopOpacity={0.42} />
            <Stop offset="0.55" stopColor={WARM} stopOpacity={0.1} />
            <Stop offset="1" stopColor={WARM} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* The pool of light the flame throws on the desk around its dish. */}
        <AnimatedEllipse cx={cx} cy={dishY} rx={W * 0.5} ry={H * 0.075} fill={`url(#${gid}p)`} animatedProps={poolProps} />

        <Ellipse cx={cx} cy={dishY + 1} rx={bw * 1.08} ry={H * 0.032} fill={`url(#${gid}d)`} />
        <Ellipse cx={cx} cy={dishY - 1.5} rx={bw * 0.9} ry={H * 0.018} fill={DISH[0]} opacity={0.5} />

        <Path
          d={`M${x0},${top + rt} Q${x0},${top} ${x0 + rt},${top} L${x1 - rt},${top} Q${x1},${top} ${x1},${top + rt} L${x1},${bodyBottom} L${x0},${bodyBottom} Z`}
          fill={`url(#${gid}w)`}
          stroke={OUTLINE}
          strokeOpacity={0.45}
          strokeWidth={0.8}
        />
        <Path
          d={`M${x0},${top + rt} Q${x0},${top} ${x0 + rt},${top} L${x1 - rt},${top} Q${x1},${top} ${x1},${top + rt} L${x1},${bodyBottom} L${x0},${bodyBottom} Z`}
          fill={`url(#${gid}s)`}
        />
        <Path
          d={`M${dripX},${top} L${dripX},${top + dripLen - dripW / 2} A${dripW / 2},${dripW / 2} 0 0 0 ${dripX + dripW},${top + dripLen - dripW / 2} L${dripX + dripW},${top} Z`}
          fill={pool}
          stroke={OUTLINE}
          strokeOpacity={0.2}
          strokeWidth={0.6}
        />
        <Ellipse cx={cx} cy={top} rx={bw / 2 - 0.5} ry={poolRy} fill={pool} stroke={OUTLINE} strokeOpacity={0.3} strokeWidth={0.6} />

        <Path
          d={`M${cx},${top - poolRy * 0.2} Q${cx - 1.5},${(top + wickTop) / 2} ${cx + 1},${wickTop}`}
          stroke={WICK}
          strokeWidth={Math.max(1.2, W * 0.012)}
          strokeLinecap="round"
          fill="none"
        />

        {wisps.map((i) => (
          <Wisp key={i} i={i} cx={cx} y0={wickTop} span={H * 0.5} smoke={smoke} />
        ))}

        <AnimatedCircle cx={cx} cy={sealY} fill={SEAL} stroke={SEAL_EDGE} strokeWidth={1} animatedProps={sealProps} />
        <AnimatedCircle cx={cx} cy={sealY} fill="none" stroke={FLAME_CORE} strokeWidth={0.9} animatedProps={sealRingProps} />
      </Svg>

      <Animated.View style={[StyleSheet.absoluteFill, flameLayerStyle]}>
        <Svg width={W} height={H}>
          <Defs>
            <RadialGradient id={`${gid}h`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={WARM} stopOpacity={0.5} />
              <Stop offset="0.45" stopColor={WARM} stopOpacity={0.14} />
              <Stop offset="1" stopColor={WARM} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id={`${gid}f`} cx="50%" cy="66%" r="64%">
              <Stop offset="0" stopColor={FLAME_CORE} />
              <Stop offset="0.5" stopColor={FLAME_MID} />
              <Stop offset="1" stopColor="#E0782E" />
            </RadialGradient>
          </Defs>
          <AnimatedCircle cx={cx} cy={wickTop - W * 0.1} fill={`url(#${gid}h)`} animatedProps={haloProps} />
          <AnimatedPath fill={`url(#${gid}f)`} animatedProps={flameProps} />
          <AnimatedPath fill={FLAME_CORE} animatedProps={coreProps} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// One curl of smoke off a snuffed wick: rises, widens, sways, thins out.
function Wisp({
  i,
  cx,
  y0,
  span,
  smoke,
}: {
  i: number;
  cx: number;
  y0: number;
  span: number;
  smoke: SharedValue<number>;
}) {
  const props = useAnimatedProps(() => {
    const p = Math.min(1, Math.max(0, smoke.value * 1.5 - i * 0.22));
    return {
      cx: cx + Math.sin(p * 5.5 + i * 1.9) * 9 * p,
      cy: y0 - p * span,
      r: 1.5 + p * (6 + i * 2),
      opacity: p > 0 && p < 1 ? (1 - p) * 0.32 : 0,
    };
  });
  return <AnimatedCircle fill={SMOKE} animatedProps={props} />;
}

export const Candle = memo(CandleBase);
