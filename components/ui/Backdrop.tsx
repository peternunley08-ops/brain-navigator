import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useSyncExternalStore } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, Line, RadialGradient, Stop } from 'react-native-svg';
import { useLifeStore } from '../../core/lifeStore';
import { hoursIntoNight, isNight, minutesOf, nightClockVersion, nightNow, nightStart, subscribeNightClock } from '../../core/night';
import { colors, gradients } from '../../core/theme';

type Tone = keyof Pick<typeof gradients, 'room' | 'ember' | 'dusk'>;

interface BackdropProps {
  tone?: Tone;
  /** Where the warm pool of light sits, 0 (top) – 1 (bottom). */
  glowAt?: number;
  glowColor?: string;
  /** A few slow specks of dust drifting through the light. */
  motes?: boolean;
  /** Faint weather in the window. */
  weather?: WeatherKind;
}

export type WeatherKind = 'rain' | 'snow' | 'clear' | null;

/** Open-Meteo WMO code to a Backdrop weather kind. */
export function weatherKind(code: number | null | undefined): WeatherKind {
  if (code == null) return null;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  return code <= 3 ? 'clear' : null;
}

// The room behind every screen: a night gradient, a pool of candlelight
// falling from above, and (on the calmer screens) dust turning in it.
// Late in the evening the room dims a little more with each hour, and a
// few stars come out.
export const Backdrop = memo(function Backdrop({
  tone = 'room',
  glowAt = 0.08,
  glowColor = '#F5B45C',
  motes = false,
  weather = null,
}: BackdropProps) {
  const { width, height } = useWindowDimensions();
  const windDown = useLifeStore((s) => s.settings.windDown);
  const nightOwl = useLifeStore((s) => s.about.picks.time === 'b');
  useSyncExternalStore(subscribeNightClock, nightClockVersion);
  const now = minutesOf(nightNow());
  const start = nightStart(windDown, nightOwl);
  const night = isNight(now, start);
  const veil = Math.min(0.18, 0.04 * hoursIntoNight(now, start));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={gradients[tone]} style={StyleSheet.absoluteFill} />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="pool" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={glowColor} stopOpacity={0.2} />
            <Stop offset="0.45" stopColor={glowColor} stopOpacity={0.07} />
            <Stop offset="1" stopColor={glowColor} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={width / 2} cy={height * glowAt} rx={width * 0.95} ry={height * 0.38} fill="url(#pool)" />
      </Svg>
      {veil > 0 ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.night, opacity: veil }]} /> : null}
      {motes ? <Motes width={width} height={height} /> : null}
      {weather === 'rain' || weather === 'snow' ? <Weather kind={weather} width={width} height={height} /> : null}
      {night ? <Stars width={width} height={height} /> : null}
    </View>
  );
});

const MOTES = [
  { x: 0.18, y: 0.22, r: 1.6, d: 9000, delay: 0 },
  { x: 0.72, y: 0.14, r: 1.2, d: 11000, delay: 1200 },
  { x: 0.46, y: 0.36, r: 1.1, d: 13000, delay: 2600 },
  { x: 0.86, y: 0.42, r: 1.5, d: 10000, delay: 600 },
  { x: 0.3, y: 0.55, r: 1.0, d: 12000, delay: 3400 },
  { x: 0.62, y: 0.62, r: 1.3, d: 14000, delay: 1800 },
  { x: 0.1, y: 0.7, r: 1.2, d: 10500, delay: 4200 },
];

export type Season = 'autumn' | 'winter' | 'spring' | 'summer';

/** Northern-hemisphere season by date: autumn Sep 22, winter Dec 21, spring Mar 20, summer Jun 21. */
export function seasonOf(date: Date = new Date()): Season {
  const md = (date.getMonth() + 1) * 100 + date.getDate();
  if (md >= 1221 || md < 320) return 'winter';
  if (md < 621) return 'spring';
  if (md < 922) return 'summer';
  return 'autumn';
}

// Colour, shape (w/h scale of the mote's radius), sideways drift and pace per season.
const SEASON_LOOK: Record<Season, { color: string; w: number; h: number; drift: number; slow: number; tilt: string }> = {
  summer: { color: '#FFE2B0', w: 1, h: 1, drift: 13, slow: 1, tilt: '0deg' },
  autumn: { color: '#E2994F', w: 1.7, h: 0.9, drift: 30, slow: 1, tilt: '28deg' },
  winter: { color: '#E8F0FA', w: 1, h: 1, drift: 8, slow: 1.5, tilt: '0deg' },
  spring: { color: '#F2B8C6', w: 1.5, h: 0.9, drift: 16, slow: 1.1, tilt: '-20deg' },
};

function Motes({ width, height }: { width: number; height: number }) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  const look = SEASON_LOOK[seasonOf()];
  return (
    <>
      {MOTES.map((m, i) => (
        <Mote key={i} {...m} look={look} width={width} height={height} />
      ))}
    </>
  );
}

function Mote({
  x,
  y,
  r,
  d,
  delay,
  look,
  width,
  height,
}: (typeof MOTES)[number] & { look: (typeof SEASON_LOOK)[Season]; width: number; height: number }) {
  const p = useSharedValue(0);
  const dur = d * look.slow;
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration: dur, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [p, dur, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.15 + 0.5 * Math.sin(p.value * Math.PI),
    transform: [{ translateX: (p.value * 2 - 1) * look.drift }, { translateY: -p.value * 60 }, { rotate: look.tilt }],
  }));
  return (
    <Animated.View
      style={[
        styles.mote,
        { left: x * width, top: y * height, width: r * 2 * look.w, height: r * 2 * look.h, borderRadius: r, backgroundColor: look.color },
        style,
      ]}
    />
  );
}

// Faint rain streaks or snow dots drifting down the window. Few, slow, UI-thread.
const DROPS = [0.06, 0.17, 0.28, 0.4, 0.5, 0.61, 0.72, 0.83, 0.93, 0.34, 0.77, 0.12].map((x, i) => ({
  x,
  d: 5200 + (i % 5) * 900,
  delay: (i * 530) % 3600,
  y: (i * 0.17) % 0.6,
}));

function Weather({ kind, width, height }: { kind: 'rain' | 'snow'; width: number; height: number }) {
  const reduced = useReducedMotion();
  return (
    <>
      {DROPS.map((dr, i) => (
        <Drop key={i} {...dr} kind={kind} width={width} height={height} still={reduced} />
      ))}
    </>
  );
}

function Drop({
  x, y, d, delay, kind, width, height, still,
}: (typeof DROPS)[number] & { kind: 'rain' | 'snow'; width: number; height: number; still: boolean }) {
  const p = useSharedValue(0);
  const rain = kind === 'rain';
  const travel = height * 0.5;
  useEffect(() => {
    if (still) return;
    const dur = rain ? d * 0.45 : d;
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration: dur, easing: Easing.linear }), -1, false));
  }, [p, d, delay, still, rain]);
  const style = useAnimatedStyle(() => ({
    opacity: still ? 0.06 : 0.12 * Math.sin(p.value * Math.PI),
    transform: [
      { translateY: still ? 0 : p.value * travel },
      { translateX: still ? 0 : (rain ? p.value * -travel * 0.2 : Math.sin(p.value * 6.28) * 10) },
    ],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left: x * width, top: y * height }, style]}>
      <Svg width={14} height={22}>
        {rain ? (
          <Line x1={10} y1={1} x2={4} y2={21} stroke="#BFD4F0" strokeWidth={1} strokeLinecap="round" />
        ) : (
          <Ellipse cx={7} cy={11} rx={2.2} ry={2.2} fill="#EAF1FB" />
        )}
      </Svg>
    </Animated.View>
  );
}

// A few stars in the top of the room, in fixed places so they never jump.
const STARS = [
  { x: 0.08, y: 0.06, r: 1.2, d: 4200, delay: 0 },
  { x: 0.21, y: 0.17, r: 1.0, d: 5600, delay: 900 },
  { x: 0.33, y: 0.05, r: 1.5, d: 4800, delay: 2100 },
  { x: 0.47, y: 0.22, r: 1.0, d: 6200, delay: 400 },
  { x: 0.58, y: 0.09, r: 1.3, d: 5000, delay: 3000 },
  { x: 0.69, y: 0.28, r: 1.0, d: 5800, delay: 1500 },
  { x: 0.79, y: 0.13, r: 1.5, d: 4400, delay: 2600 },
  { x: 0.9, y: 0.04, r: 1.1, d: 6000, delay: 700 },
  { x: 0.94, y: 0.31, r: 1.2, d: 5200, delay: 3400 },
  { x: 0.15, y: 0.36, r: 1.1, d: 6400, delay: 1800 },
  { x: 0.4, y: 0.38, r: 1.0, d: 5400, delay: 2400 },
  { x: 0.84, y: 0.37, r: 1.3, d: 4600, delay: 1200 },
];

function Stars({ width, height }: { width: number; height: number }) {
  const reduced = useReducedMotion();
  return (
    <>
      {STARS.map((st, i) => (
        <Star key={i} {...st} width={width} height={height} still={reduced} />
      ))}
    </>
  );
}

// Brightens and fades slowly on the UI thread; held still under Reduce Motion.
function Star({
  x,
  y,
  r,
  d,
  delay,
  width,
  height,
  still,
}: (typeof STARS)[number] & { width: number; height: number; still: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration: d, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [p, d, delay, still]);
  const style = useAnimatedStyle(() => ({
    opacity: still ? 0.3 : 0.12 + 0.38 * p.value,
  }));
  return (
    <Animated.View
      style={[styles.star, { left: x * width, top: y * height, width: r * 2, height: r * 2, borderRadius: r }, style]}
    />
  );
}

const styles = StyleSheet.create({
  mote: {
    position: 'absolute',
    backgroundColor: '#FFE2B0',
  },
  star: {
    position: 'absolute',
    backgroundColor: colors.flameHot,
  },
});
