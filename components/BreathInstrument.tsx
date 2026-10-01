import * as Haptics from '../core/haptics';
import { memo, useEffect, useMemo, useRef } from 'react';
import { type AccessibilityActionEvent, StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { BREATH_PATTERNS, cycleLength } from '../core/breathPatterns';
import { FLAME_CORE, FLAME_MID, flamePath } from '../core/flame';
import { colors, fonts } from '../core/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export const STATUS = { idle: 0, running: 1, paused: 2, done: 3 } as const;

export interface BreathValues {
  time: SharedValue<number>;
  breath: SharedValue<number>;
  beadAngle: SharedValue<number>;
  trail: SharedValue<number>;
  ripple: SharedValue<number>;
  glow: SharedValue<number>;
  status: SharedValue<number>;
  phaseIdx: SharedValue<number>;
}

interface Props {
  size: number;
  patternIndex: number;
  reducedMotion: boolean;
  values: BreathValues;
  onPatternChange: (index: number) => void;
  onHoldComplete: () => void;
  onTogglePause: () => void;
}

const hapticTick = () => {
  Haptics.selectionAsync().catch(() => {});
};
const hapticSoft = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
};
const hapticRigid = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
};

interface Mote {
  a0: number;
  w: number;
  r: number;
  ra: number;
  rw: number;
  ph: number;
  tw: number;
  s: number;
  o: number;
  color: string;
}

function makeMotes(c: number, count: number): Mote[] {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: count }, () => {
    const pick = rand();
    return {
      a0: rand() * Math.PI * 2,
      w: (rand() < 0.5 ? -1 : 1) * (0.00006 + rand() * 0.00016),
      r: c * (0.36 + rand() * 0.3),
      ra: 3 + rand() * 7,
      rw: 0.0004 + rand() * 0.0009,
      ph: rand() * Math.PI * 2,
      tw: 0.0008 + rand() * 0.0022,
      s: 1.6 + rand() * 2.4,
      o: 0.35 + rand() * 0.5,
      color: pick < 0.7 ? colors.flame : pick < 0.9 ? colors.secured : colors.text,
    };
  });
}

// Dust in lantern light: drawn in toward the flame on the inhale, let back
// out on the exhale, and parted by a finger passing through.
const MoteDot = memo(function MoteDot({
  m,
  c,
  time,
  breath,
  touchX,
  touchY,
  touchStrength,
}: {
  m: Mote;
  c: number;
  time: SharedValue<number>;
  breath: SharedValue<number>;
  touchX: SharedValue<number>;
  touchY: SharedValue<number>;
  touchStrength: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const t = time.value;
    const ang = m.a0 + m.w * t;
    const r = m.r * (1.18 - 0.5 * breath.value) + Math.sin(t * m.rw + m.ph) * m.ra;
    let x = c + Math.cos(ang) * r;
    let y = c + Math.sin(ang) * r;
    const s = touchStrength.value;
    if (s > 0.001) {
      const dx = x - touchX.value;
      const dy = y - touchY.value;
      const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
      const reach = 74;
      if (d < reach) {
        const f = 1 - d / reach;
        const push = f * f * 44 * s;
        x += (dx / d) * push;
        y += (dy / d) * push;
      }
    }
    const twinkle = 0.55 + 0.45 * Math.sin(t * m.tw + m.ph);
    return {
      opacity: m.o * twinkle,
      transform: [{ translateX: x - m.s / 2 }, { translateY: y - m.s / 2 }],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.mote,
        { width: m.s, height: m.s, borderRadius: m.s / 2, backgroundColor: m.color },
        style,
      ]}
    />
  );
});

interface Segment {
  i: number;
  len: number;
  startDeg: number;
  visible: boolean;
}

const SEGMENT_COLORS = [colors.secured, colors.flame, colors.textMuted, colors.flame];

// One arc of the phase ring, its length proportional to that phase's share
// of the cycle. The phase being breathed right now is the one at full ink.
const ArcSegment = memo(function ArcSegment({
  seg,
  c,
  radius,
  phaseIdx,
  reveal,
  status,
}: {
  seg: Segment;
  c: number;
  radius: number;
  phaseIdx: SharedValue<number>;
  reveal: SharedValue<number>;
  status: SharedValue<number>;
}) {
  const C = 2 * Math.PI * radius;
  const emphasis = useSharedValue(0.8);
  useAnimatedReaction(
    () => {
      const s = status.value;
      const inSession = s === STATUS.running || s === STATUS.paused;
      return !inSession ? 0.8 : phaseIdx.value === seg.i ? 1 : 0.26;
    },
    (target) => {
      emphasis.value = withTiming(target, { duration: 420, easing: Easing.out(Easing.quad) });
    }
  );
  const props = useAnimatedProps(() => {
    const revealed = Math.min(1, Math.max(0, reveal.value * 4 - seg.i));
    return { opacity: revealed * emphasis.value };
  });
  if (!seg.visible) return null;
  return (
    <AnimatedCircle
      cx={c}
      cy={c}
      r={radius}
      fill="none"
      stroke={SEGMENT_COLORS[seg.i]}
      strokeWidth={4.5}
      strokeDasharray={[seg.len, C]}
      rotation={-90 + seg.startDeg}
      origin={`${c}, ${c}`}
      animatedProps={props}
    />
  );
});

function BreathInstrumentBase({
  size,
  patternIndex,
  reducedMotion,
  values,
  onPatternChange,
  onHoldComplete,
  onTogglePause,
}: Props) {
  const { time, breath, beadAngle, trail, ripple, glow, status, phaseIdx } = values;
  const c = size / 2;

  const g = useMemo(
    () => ({
      bezel: c * 0.985,
      dialOut: c * 0.955,
      dialIn: c * 0.78,
      label: c * 0.868,
      arc: c * 0.69,
      trail: c * 0.645,
      inner: c * 0.52,
      holdRing: c * 0.43,
      flameMin: c * 0.09,
      flameMax: c * 0.19,
      haloMin: c * 0.3,
      haloMax: c * 0.66,
    }),
    [c]
  );

  const pattern = BREATH_PATTERNS[patternIndex];
  const motes = useMemo(() => makeMotes(c, 26), [c]);

  // --- gesture state (UI thread) -----------------------------------------
  const touchX = useSharedValue(c);
  const touchY = useSharedValue(c);
  const touchStrength = useSharedValue(0);
  const mode = useSharedValue(0); // 0 none, 1 dial, 2 field
  const lastAngle = useSharedValue(0);
  const angVel = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const travel = useSharedValue(0);
  const beganAt = useSharedValue(0);
  const onFlame = useSharedValue(0);
  const dialAngle = useSharedValue(-patternIndex * 120);
  const dialAnchor = useSharedValue(0);
  const dialLocked = useSharedValue(0);
  const tickAcc = useSharedValue(0);
  const hold = useSharedValue(0);

  // --- presentation state ------------------------------------------------
  const reveal = useSharedValue(0);
  const ringSpin = useSharedValue(0);
  const dim = useSharedValue(0);

  const trailOpacity = useSharedValue(0);

  useAnimatedReaction(
    () => status.value,
    (s) => {
      dim.value = withTiming(s === STATUS.paused ? 1 : 0, { duration: 320 });
      const inSession = s === STATUS.running || s === STATUS.paused;
      trailOpacity.value = withTiming(inSession ? 0.55 : 0, { duration: 400 });
    }
  );

  const firstPattern = useRef(true);
  useEffect(() => {
    reveal.value = 0;
    reveal.value = withTiming(1, { duration: 820, easing: Easing.out(Easing.cubic) });
    if (firstPattern.current) {
      firstPattern.current = false;
      return;
    }
    ringSpin.value = -38;
    ringSpin.value = withSpring(0, { damping: 13, stiffness: 120 });
  }, [patternIndex, reveal, ringSpin]);

  // Props can change every render; the worklets below only ever call these
  // stable wrappers, so the gesture never has to be rebuilt.
  const latest = useRef({ onPatternChange, onHoldComplete, onTogglePause, patternIndex });
  latest.current = { onPatternChange, onHoldComplete, onTogglePause, patternIndex };
  const bridge = useMemo(
    () => ({
      pattern: (i: number) => {
        if (i === latest.current.patternIndex) return;
        hapticSoft();
        latest.current.onPatternChange(i);
      },
      holdComplete: () => latest.current.onHoldComplete(),
      togglePause: () => latest.current.onTogglePause(),
    }),
    []
  );

  const pan = usePanGesture({
    minDistance: 0,
    onBegin: (e) => {
      'worklet';
      const dx = e.x - c;
      const dy = e.y - c;
      const r = Math.sqrt(dx * dx + dy * dy);
      startX.value = e.x;
      startY.value = e.y;
      travel.value = 0;
      angVel.value = 0;
      beganAt.value = time.value;

      if (r > g.bezel + 12) {
        mode.value = 0;
        return;
      }

      if (r >= g.dialIn - 14) {
        mode.value = 1;
        lastAngle.value = (Math.atan2(dy, dx) * 180) / Math.PI;
        cancelAnimation(dialAngle);
        const s = status.value;
        dialLocked.value = s === STATUS.running || s === STATUS.paused ? 1 : 0;
        dialAnchor.value = Math.round(dialAngle.value / 120) * 120;
        tickAcc.value = 0;
        if (dialLocked.value) scheduleOnRN(hapticRigid);
        return;
      }

      mode.value = 2;
      touchX.value = e.x;
      touchY.value = e.y;
      touchStrength.value = withSpring(1, { damping: 20, stiffness: 170 });
      onFlame.value = r <= g.flameMax * 2.2 + 18 ? 1 : 0;

      const s = status.value;
      if (onFlame.value && (s === STATUS.idle || s === STATUS.done)) {
        scheduleOnRN(hapticTick);
        hold.value = withTiming(
          1,
          { duration: 760, easing: Easing.inOut(Easing.quad) },
          (finished) => {
            'worklet';
            if (finished) {
              scheduleOnRN(bridge.holdComplete);
              hold.value = withTiming(0, { duration: 520, easing: Easing.out(Easing.quad) });
            }
          }
        );
      }
    },
    onUpdate: (e) => {
      'worklet';
      const ddx = e.x - startX.value;
      const ddy = e.y - startY.value;
      travel.value = Math.max(travel.value, Math.sqrt(ddx * ddx + ddy * ddy));

      if (mode.value === 1) {
        const px = e.x - c;
        const py = e.y - c;
        const a = (Math.atan2(py, px) * 180) / Math.PI;
        let delta = a - lastAngle.value;
        if (delta > 180) delta -= 360;
        else if (delta < -180) delta += 360;
        lastAngle.value = a;

        if (dialLocked.value) {
          dialAngle.value += delta * 0.12;
          return;
        }
        dialAngle.value += delta;

        const r2 = px * px + py * py + 1;
        const w = (((px * e.velocityY - py * e.velocityX) / r2) * 180) / Math.PI;
        angVel.value = Math.max(-1400, Math.min(1400, w));

        tickAcc.value += delta;
        if (Math.abs(tickAcc.value) >= 12) {
          tickAcc.value = 0;
          scheduleOnRN(hapticTick);
        }
      } else if (mode.value === 2) {
        touchX.value = e.x;
        touchY.value = e.y;
        if (hold.value > 0 && hold.value < 1 && travel.value > 18) {
          hold.value = withSpring(0, { damping: 18, stiffness: 160 });
        }
      }
    },
    onFinalize: () => {
      'worklet';
      if (mode.value === 1) {
        if (dialLocked.value) {
          dialAngle.value = withSpring(dialAnchor.value, { damping: 11, stiffness: 240 });
        } else {
          const projected = dialAngle.value + angVel.value * 0.18;
          const target = Math.round(projected / 120) * 120;
          dialAngle.value = withSpring(target, {
            velocity: angVel.value,
            damping: 16,
            stiffness: 120,
          });
          const idx = ((Math.round(-target / 120) % 3) + 3) % 3;
          scheduleOnRN(bridge.pattern, idx);
        }
      } else if (mode.value === 2) {
        touchStrength.value = withSpring(0, { damping: 18, stiffness: 80 });
        if (hold.value > 0 && hold.value < 1) {
          hold.value = withSpring(0, { damping: 18, stiffness: 160 });
        }
        const s = status.value;
        const quick = time.value - beganAt.value < 700;
        if (
          onFlame.value &&
          quick &&
          travel.value < 12 &&
          (s === STATUS.running || s === STATUS.paused)
        ) {
          scheduleOnRN(bridge.togglePause);
        }
      }
      mode.value = 0;
    },
  });

  // --- animated layers ---------------------------------------------------
  const haloProps = useAnimatedProps(() => {
    const b = breath.value;
    return {
      r: g.haloMin + (g.haloMax - g.haloMin) * b + glow.value * c * 0.2,
      opacity: Math.min(1, (0.5 + 0.5 * b) * (1 - 0.45 * dim.value) + glow.value * 0.35),
    };
  });

  const innerRingStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${reducedMotion ? 0 : time.value * 0.003}deg` },
      { scale: 1 + 0.08 * breath.value },
    ],
  }));

  // The flame leans toward a finger resting in the lantern and stretches a
  // little toward it, the way a real flame follows a draught.
  const lean = useDerivedValue(() => {
    const s = touchStrength.value;
    if (s < 0.001) return { axis: 0, pull: 0 };
    const dx = touchX.value - c;
    const dy = touchY.value - c;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const reach = Math.min(1, dist / (c * 0.55));
    return {
      axis: Math.max(-0.75, Math.min(0.75, Math.atan2(dx, -dy))) * reach * s,
      pull: reach * s,
    };
  });

  const flameProps = useAnimatedProps(() => {
    const b = breath.value;
    const half = g.flameMin + (g.flameMax - g.flameMin) * b + hold.value * 3 + glow.value * 5;
    const { axis, pull } = lean.value;
    const height = half * (2.05 + 0.5 * pull + 0.25 * glow.value);
    const wob = reducedMotion ? 0 : 1 + pull * 0.8;
    // Seat the flame so its visual middle, not its wick, sits at the centre.
    const wickY = c + (height - half * 0.92) * 0.42;
    return {
      d: flamePath(c, wickY, half, height, axis, time.value, wob, 0),
      opacity: 1 - 0.42 * dim.value,
    };
  });

  const coreProps = useAnimatedProps(() => {
    const b = breath.value;
    const outer = g.flameMin + (g.flameMax - g.flameMin) * b;
    const half = outer * 0.46;
    const height = half * 1.7;
    const { axis } = lean.value;
    const outerHeight = outer * 2.05;
    const wickY = c + (outerHeight - outer * 0.92) * 0.42 - outer * 0.08;
    const wob = reducedMotion ? 0 : 0.7;
    return {
      d: flamePath(c, wickY, half, height, axis * 0.6, time.value, wob, 2.7),
      opacity: 0.92 * (1 - 0.5 * dim.value),
    };
  });

  const rippleProps = useAnimatedProps(() => {
    const p = ripple.value;
    const from = g.flameMax * 1.6;
    return {
      r: from + (g.arc - from) * p,
      opacity: p > 0 && p < 1 ? (1 - p) * 0.55 : 0,
      strokeWidth: 0.5 + 1.4 * (1 - p),
    };
  });

  const holdC = 2 * Math.PI * g.holdRing;
  const holdProps = useAnimatedProps(() => ({
    strokeDashoffset: holdC * (1 - hold.value),
    opacity: hold.value > 0.001 ? 1 : 0,
  }));

  const trailC = 2 * Math.PI * g.trail;
  const trailProps = useAnimatedProps(() => ({
    strokeDashoffset: trailC * (1 - trail.value),
    opacity: trailOpacity.value,
  }));

  const phaseRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringSpin.value}deg` }, { scale: 1 + 0.015 * breath.value }],
  }));

  const beadStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${beadAngle.value}deg` }],
  }));

  const dialStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${dialAngle.value}deg` }],
  }));

  // --- static engraving --------------------------------------------------
  const dialTicks = useMemo(() => {
    let d = '';
    for (let i = 0; i < 120; i++) {
      const deg = i * 3;
      const nearLabel = [0, 120, 240, 360].some((l) => Math.abs(deg - l) < 13);
      if (nearLabel) continue;
      const len = i % 10 === 0 ? 9 : i % 5 === 0 ? 5.5 : 3;
      const a = (deg * Math.PI) / 180;
      const r1 = g.dialIn + 2;
      const r2 = r1 + len;
      d += `M${(c + r1 * Math.sin(a)).toFixed(2)},${(c - r1 * Math.cos(a)).toFixed(2)}`;
      d += `L${(c + r2 * Math.sin(a)).toFixed(2)},${(c - r2 * Math.cos(a)).toFixed(2)}`;
    }
    return d;
  }, [c, g]);

  const innerDots = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      out.push({ x: c + (g.inner - 3) * Math.sin(a), y: c - (g.inner - 3) * Math.cos(a) });
    }
    return out;
  }, [c, g]);

  const segments = useMemo<Segment[]>(() => {
    const d = pattern.durations;
    const total = cycleLength(d);
    const C = 2 * Math.PI * g.arc;
    const gapDeg = 2.4;
    let start = 0;
    const out: Segment[] = [];
    for (let i = 0; i < 4; i++) {
      const frac = d[i] / total;
      out.push({
        i,
        len: Math.max(0, frac * C - (gapDeg / 360) * C),
        startDeg: start * 360 + gapDeg / 2,
        visible: d[i] > 0,
      });
      start += frac;
    }
    return out;
  }, [pattern, g]);

  const onAccessibilityAction = (e: AccessibilityActionEvent) => {
    const s = status.value;
    const idle = s === STATUS.idle || s === STATUS.done;
    if (e.nativeEvent.actionName === 'activate') {
      if (idle) onHoldComplete();
      else onTogglePause();
      return;
    }
    if (!idle) return;
    const step = e.nativeEvent.actionName === 'increment' ? -120 : 120;
    const target = Math.round(dialAngle.value / 120) * 120 + step;
    dialAngle.value = withSpring(target, { damping: 16, stiffness: 120 });
    bridge.pattern(((Math.round(-target / 120) % 3) + 3) % 3);
  };

  return (
    <GestureDetector gesture={pan}>
      <View
        style={{ width: size, height: size }}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Breathing instrument"
        accessibilityValue={{ text: pattern.name }}
        accessibilityHint="Activate to begin or pause. Swipe up or down to change the pattern."
        accessibilityActions={[
          { name: 'activate', label: 'Begin or pause' },
          { name: 'increment', label: 'Next pattern' },
          { name: 'decrement', label: 'Previous pattern' },
        ]}
        onAccessibilityAction={onAccessibilityAction}
      >
        {/* Lantern glow — the only soft light in the scene; its size is how full the breath is. */}
        <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={FLAME_MID} stopOpacity={0.62} />
              <Stop offset="0.45" stopColor={colors.flame} stopOpacity={0.2} />
              <Stop offset="1" stopColor={colors.flame} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <AnimatedCircle cx={c} cy={c} fill="url(#halo)" animatedProps={haloProps} />
        </Svg>

        <Animated.View style={[StyleSheet.absoluteFill, innerRingStyle]} pointerEvents="none">
          <Svg width={size} height={size}>
            <Circle cx={c} cy={c} r={g.inner} fill="none" stroke={colors.text} strokeOpacity={0.32} strokeWidth={0.8} />
            <Circle cx={c} cy={c} r={g.inner - 6} fill="none" stroke={colors.text} strokeOpacity={0.14} strokeWidth={0.5} />
            {innerDots.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={i % 6 === 0 ? 1.6 : 0.9} fill={colors.text} fillOpacity={0.4} />
            ))}
          </Svg>
        </Animated.View>

        {!reducedMotion
          ? motes.map((m, i) => (
              <MoteDot
                key={i}
                m={m}
                c={c}
                time={time}
                breath={breath}
                touchX={touchX}
                touchY={touchY}
                touchStrength={touchStrength}
              />
            ))
          : null}

        <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <RadialGradient id="flame" cx="50%" cy="62%" r="62%">
              <Stop offset="0" stopColor={FLAME_CORE} stopOpacity={1} />
              <Stop offset="0.5" stopColor={FLAME_MID} stopOpacity={1} />
              <Stop offset="1" stopColor={colors.flame} stopOpacity={1} />
            </RadialGradient>
          </Defs>
          <AnimatedCircle cx={c} cy={c} fill="none" stroke={colors.flame} animatedProps={rippleProps} />
          <AnimatedCircle
            cx={c}
            cy={c}
            r={g.holdRing}
            fill="none"
            stroke={colors.secured}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={[holdC, holdC]}
            rotation={-90}
            origin={`${c}, ${c}`}
            animatedProps={holdProps}
          />
          <AnimatedPath
            fill="url(#flame)"
            stroke={colors.surfaceHigh}
            strokeOpacity={0.45}
            strokeWidth={0.6}
            animatedProps={flameProps}
          />
          <AnimatedPath fill={FLAME_CORE} animatedProps={coreProps} />
        </Svg>

        {/* Phase ring: arcs sized to each phase's real share of the cycle. */}
        <Animated.View style={[StyleSheet.absoluteFill, phaseRingStyle]} pointerEvents="none">
          <Svg width={size} height={size}>
            <Circle cx={c} cy={c} r={g.arc} fill="none" stroke={colors.lineStrong} strokeOpacity={0.7} strokeWidth={4.5} />
            {segments.map((seg) => (
              <ArcSegment
                key={`${pattern.key}-${seg.i}`}
                seg={seg}
                c={c}
                radius={g.arc}
                phaseIdx={phaseIdx}
                reveal={reveal}
                status={status}
              />
            ))}
            <AnimatedCircle
              cx={c}
              cy={c}
              r={g.trail}
              fill="none"
              stroke={colors.text}
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeDasharray={[trailC, trailC]}
              rotation={-90}
              origin={`${c}, ${c}`}
              animatedProps={trailProps}
            />
          </Svg>
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFill, beadStyle]} pointerEvents="none">
          <View style={[styles.bead, { left: c - 7, top: c - g.arc - 7 }]}>
            <View style={styles.beadGlint} />
          </View>
        </Animated.View>

        {/* The bezel: drag it to choose a pattern. */}
        <Animated.View style={[StyleSheet.absoluteFill, dialStyle]} pointerEvents="none">
          <Svg width={size} height={size}>
            <Circle
              cx={c}
              cy={c}
              r={(g.dialOut + g.dialIn) / 2}
              fill="none"
              stroke={colors.surface}
              strokeWidth={g.dialOut - g.dialIn}
            />
            <Circle cx={c} cy={c} r={g.bezel} fill="none" stroke={colors.text} strokeOpacity={0.45} strokeWidth={0.6} />
            <Circle cx={c} cy={c} r={g.dialOut} fill="none" stroke={colors.text} strokeOpacity={0.85} strokeWidth={1} />
            <Circle cx={c} cy={c} r={g.dialIn} fill="none" stroke={colors.text} strokeOpacity={0.7} strokeWidth={0.8} />
            <Path d={dialTicks} stroke={colors.text} strokeOpacity={0.5} strokeWidth={0.8} />
            {[60, 180, 300].map((deg) => {
              const a = (deg * Math.PI) / 180;
              return (
                <Circle
                  key={deg}
                  cx={c + g.label * Math.sin(a)}
                  cy={c - g.label * Math.cos(a)}
                  r={2.2}
                  fill={colors.flame}
                />
              );
            })}
            {BREATH_PATTERNS.map((p, i) => {
              const deg = i * 120;
              const a = (deg * Math.PI) / 180;
              const x = c + g.label * Math.sin(a);
              const y = c - g.label * Math.cos(a);
              return (
                <SvgText
                  key={p.key}
                  x={x}
                  y={y}
                  dy={5}
                  fontSize={15}
                  fontFamily={fonts.displaySoft}
                  fill={i === patternIndex ? colors.text : colors.textFaint}
                  textAnchor="middle"
                  transform={`rotate(${deg} ${x} ${y})`}
                >
                  {p.name}
                </SvgText>
              );
            })}
          </Svg>
        </Animated.View>

        {/* Lubber mark: the fixed pointer the chosen pattern turns under. */}
        <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Path
            d={`M${c - 7},${c - g.bezel - 2} L${c + 7},${c - g.bezel - 2} L${c},${c - g.dialOut + 5} Z`}
            fill={colors.flame}
            stroke={colors.surfaceHigh}
            strokeWidth={0.8}
          />
        </Svg>
      </View>
    </GestureDetector>
  );
}

export const BreathInstrument = memo(BreathInstrumentBase);

const styles = StyleSheet.create({
  mote: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  bead: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.flame,
    borderWidth: 1,
    borderColor: colors.surfaceHigh,
  },
  beadGlint: {
    position: 'absolute',
    left: 2.5,
    top: 2.5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: FLAME_CORE,
  },
});
