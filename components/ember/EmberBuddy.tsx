import * as Haptics from 'expo-haptics';
import { router, usePathname } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { adviseFor, type EmberAction } from '../../core/ember';
import { type EmberMood, useEmberStore } from '../../core/emberStore';
import { useHabitsStore } from '../../core/habitsStore';
import { useBrainNavigatorStore } from '../../core/store';
import { useTasksStore } from '../../core/tasksStore';
import { colors, fonts } from '../../core/theme';
import { useWellnessStore } from '../../core/wellnessStore';
import { EmberBubble } from './EmberBubble';
import { EmberSprite } from './EmberSprite';
import { Sparks } from './Sparks';
import { useEmberRig } from './useEmberRig';

// Ember lives on top of every screen. Drag it anywhere and it swings back
// to the nearest edge, its flame trailing behind the way a real flame does
// when you carry a candle. Tap it for help with whatever you're looking at.
// Hold it for a moment of company. Shake it and it gets dizzy. Tell it to
// nap and it curls into an ember at the edge until you wake it.

const S = 62; // sprite width
const H_BOX = S * 1.2;
const EDGE = 2;
const NAV_TOP = 86 + 8; // the floating nav's top edge, from the bottom
const NAP_SCALE = 0.5;

// Screens where Ember steps aside: the companion, welcome, and focus
// screens already have Ember on stage, and Breathe needs your whole
// attention.
const HIDDEN = new Set(['/companion', '/breathe', '/welcome', '/focus', '/scan']);

const COMFORT = [
  'You’re doing better than you think.',
  'One thing at a time. That’s all anyone does.',
  'Whatever it is, you don’t have to carry it all at once.',
  'Hi. I’m glad you’re here.',
  'Slow breath in… and out. There.',
  'It’s okay to rest before it’s finished.',
];

export function EmberBuddy() {
  const pathname = usePathname();
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const rig = useEmberRig();

  const loaded = useEmberStore((s) => s.loaded);
  const side = useEmberStore((s) => s.side);
  const yFrac = useEmberStore((s) => s.y);
  const napping = useEmberStore((s) => s.napping);
  const bubbleOpen = useEmberStore((s) => s.bubbleOpen);
  const toast = useEmberStore((s) => s.toast);
  const seen = useEmberStore((s) => s.seen);

  // Re-evaluate advice whenever the data Ember reads from changes.
  const openCount = useBrainNavigatorStore((s) => s.openLoops.length);
  const checkins = useWellnessStore((s) => s.checkins);
  const tasks = useTasksStore((s) => s.tasks);
  const logs = useHabitsStore((s) => s.logs);

  const [keyboardUp, setKeyboardUp] = useState(false);
  const [burst, setBurst] = useState(0);
  const [mode, setMode] = useState<'tips' | 'about'>('tips');
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    useEmberStore.getState().load();
  }, []);

  useEffect(() => {
    const a = Keyboard.addListener('keyboardWillShow', () => setKeyboardUp(true));
    const b = Keyboard.addListener('keyboardWillHide', () => setKeyboardUp(false));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);

  const hidden = HIDDEN.has(pathname) || keyboardUp;

  // ---- Geometry ----------------------------------------------------------

  const minY = insets.top + 64;
  const maxY = H - NAV_TOP - H_BOX;
  const leftX = EDGE;
  const rightX = W - S - EDGE;
  const restX = side === 'left' ? leftX : rightX;
  const restY = minY + (maxY - minY) * yFrac;

  const x = useSharedValue(rightX);
  const y = useSharedValue(maxY);
  const press = useSharedValue(0);
  const nap = useSharedValue(napping ? 1 : 0);
  const show = useSharedValue(0);

  // Settle onto the saved perch once it's loaded, and after the screen
  // changes size. (Not on every perch change — a drop already springs
  // Ember there, carrying the fling's velocity.)
  const perch = useRef({ restX, restY });
  perch.current = { restX, restY };
  useEffect(() => {
    if (!loaded) return;
    x.value = withSpring(perch.current.restX, { damping: 18, stiffness: 160 });
    y.value = withSpring(perch.current.restY, { damping: 18, stiffness: 160 });
  }, [loaded, W, H, insets.top, x, y]);

  useEffect(() => {
    show.value = withTiming(hidden || !loaded ? 0 : 1, { duration: hidden ? 180 : 360, easing: Easing.out(Easing.cubic) });
    if (hidden) useEmberStore.getState().setBubbleOpen(false);
  }, [hidden, loaded, show]);

  useEffect(() => {
    nap.value = withSpring(napping ? 1 : 0, { damping: 15, stiffness: 120 });
    rig.setMood(napping ? 'sleepy' : 'idle');
    rig.setActive(true);
  }, [napping, nap, rig]);

  // ---- Advice ------------------------------------------------------------

  const advice = useMemo(
    () => adviseFor(pathname),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname, openCount, checkins, tasks, logs, bubbleOpen]
  );
  const top = advice.tips[0];
  const hasNudge = !!top && top.priority >= 2 && !seen.includes(top.id) && !napping;
  const tip = advice.tips[tipIndex % advice.tips.length];

  // A new screen: glance toward it, and start the tips from the top.
  useEffect(() => {
    setTipIndex(0);
    setMode('tips');
    if (!napping) rig.look(side === 'right' ? -0.8 : 0.8, -0.2);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // When there's something worth saying, Ember looks right at you and
  // brightens a little until you tap it.
  useEffect(() => {
    if (hasNudge) {
      rig.setMood('curious');
    } else if (!napping && !bubbleOpen) {
      rig.setMood('idle');
    }
  }, [hasNudge, napping, bubbleOpen, rig]);

  // ---- Reactions -----------------------------------------------------------

  const openBubble = useCallback(() => {
    const store = useEmberStore.getState();
    if (store.napping) {
      store.setNapping(false);
      rig.yawn();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
      setTimeout(() => {
        rig.setMood('happy');
        rig.hopUp(10);
      }, 900);
      return;
    }
    if (store.bubbleOpen) {
      store.setBubbleOpen(false);
      rig.setMood('idle');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    rig.hopUp(12);
    rig.setMood(tip?.mood === 'concerned' || tip?.mood === 'sleepy' ? 'listening' : 'happy');
    setBurst((b) => b + 1);
    setMode('tips');
    if (top) store.markSeen(top.id);
    store.setBubbleOpen(true);
  }, [rig, tip, top]);

  const closeBubble = useCallback(() => {
    useEmberStore.getState().setBubbleOpen(false);
    rig.setMood('idle');
  }, [rig]);

  const runAction = useCallback(
    (a: EmberAction) => {
      closeBubble();
      rig.hopUp(8);
      if (a.href !== pathname) router.push(a.href as never);
    },
    [closeBubble, pathname, rig]
  );

  const comfort = useCallback(() => {
    if (useEmberStore.getState().napping) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    rig.setMood('happy');
    rig.wiggle();
    setBurst((b) => b + 1);
    useEmberStore.getState().setBubbleOpen(false);
    useEmberStore.getState().say(COMFORT[Math.floor(Math.random() * COMFORT.length)], 'happy');
  }, [rig]);

  const dizzy = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    rig.setMood('dizzy');
    setTimeout(() => {
      rig.setMood('idle');
      useEmberStore.getState().say('Whoa. The room’s spinning a bit.', 'happy');
    }, 1700);
  }, [rig]);

  const dragStart = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    rig.holdGaze(true);
    useEmberStore.getState().setBubbleOpen(false);
    if (!useEmberStore.getState().napping) rig.setMood('curious');
  }, [rig]);

  const dropped = useCallback(
    (toSide: 'left' | 'right', frac: number) => {
      rig.holdGaze(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      useEmberStore.getState().setPerch(toSide, frac);
      if (!useEmberStore.getState().napping) {
        rig.setMood('happy');
        rig.look(toSide === 'right' ? -0.7 : 0.7, 0);
        setTimeout(() => rig.setMood('idle'), 900);
      }
    },
    [rig]
  );

  // Holding still on Ember for a moment = comfort.
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startHold = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      comfort();
    }, 560);
  }, [comfort]);
  const cancelHold = useCallback((): boolean => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
      return true; // hold hadn't fired yet
    }
    return false;
  }, []);
  const tapOrHoldEnd = useCallback(() => {
    // If the hold already fired, releasing is the end of it, not a tap.
    if (cancelHold()) openBubble();
  }, [cancelHold, openBubble]);

  // Something happened elsewhere in the app — react to it.
  useEffect(() => {
    if (!toast) return;
    if (!useEmberStore.getState().napping) {
      rig.setMood(toast.mood);
      if (toast.mood === 'cheer' || toast.mood === 'happy') {
        rig.hopUp(toast.mood === 'cheer' ? 18 : 10);
        setBurst((b) => b + 1);
      }
    }
    const id = toast.id;
    const t = setTimeout(() => {
      useEmberStore.getState().clearToast(id);
      if (!useEmberStore.getState().napping) rig.setMood('idle');
    }, 3600);
    return () => clearTimeout(t);
  }, [toast, rig]);

  // Every so often, when nothing else is going on, Ember does something
  // small on its own — stretches, looks around, a little hop.
  useEffect(() => {
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const next = () => {
      t = setTimeout(() => {
        if (!alive) return;
        const s = useEmberStore.getState();
        if (!s.napping && !s.bubbleOpen && !s.toast) {
          const r = Math.random();
          if (r < 0.35) rig.wiggle();
          else if (r < 0.6) rig.hopUp(6);
          else if (r < 0.75 && new Date().getHours() >= 22) rig.yawn();
        }
        next();
      }, 26000 + Math.random() * 30000);
    };
    next();
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [rig]);

  // ---- Gesture ---------------------------------------------------------------

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const dragging = useSharedValue(0);
  const lastVx = useSharedValue(0);
  const lastVy = useSharedValue(0);
  const flips = useSharedValue(0);
  const dizzied = useSharedValue(0);
  const geo = useSharedValue({ minY, maxY, leftX, rightX, W });
  useEffect(() => {
    geo.value = { minY, maxY, leftX, rightX, W };
  }, [minY, maxY, leftX, rightX, W, geo]);

  const { lean, stretch, lookX, lookY } = rig;

  const pan = usePanGesture({
    minDistance: 0,
    enabled: !hidden,
    onBegin: () => {
      'worklet';
      press.value = withSpring(1, { damping: 16, stiffness: 400 });
      startX.value = x.value;
      startY.value = y.value;
      dragging.value = 0;
      flips.value = 0;
      dizzied.value = 0;
      lastVx.value = 0;
      lastVy.value = 0;
      scheduleOnRN(startHold);
    },
    onUpdate: (e) => {
      'worklet';
      const tx = e.translationX;
      const ty = e.translationY;
      if (!dragging.value) {
        if (tx * tx + ty * ty < 81) return;
        dragging.value = 1;
        scheduleOnRN(cancelHold);
        scheduleOnRN(dragStart);
      }
      const g = geo.value;
      x.value = startX.value + tx;
      // Rubber-band past the top and bottom limits.
      const ny = startY.value + ty;
      y.value = ny < g.minY ? g.minY - (g.minY - ny) * 0.35 : ny > g.maxY ? g.maxY + (ny - g.maxY) * 0.35 : ny;

      // A carried flame trails behind the way you move it, and stretches
      // when you move it fast.
      const vx = e.velocityX;
      const vy = e.velocityY;
      const speed = Math.sqrt(vx * vx + vy * vy);
      const targetLean = Math.max(-0.75, Math.min(0.75, -vx / 1900));
      lean.value += (targetLean - lean.value) * 0.28;
      stretch.value += (1 + Math.min(0.28, speed / 5200) - stretch.value) * 0.25;
      lookX.value += (Math.max(-1, Math.min(1, vx / 1200)) - lookX.value) * 0.3;
      lookY.value += (Math.max(-1, Math.min(1, vy / 1200)) - lookY.value) * 0.3;

      // Shake it back and forth and it gets dizzy.
      if (Math.abs(vx) > 650 && Math.sign(vx) !== Math.sign(lastVx.value) && lastVx.value !== 0) {
        flips.value += 1;
        if (flips.value >= 5 && !dizzied.value) {
          dizzied.value = 1;
          scheduleOnRN(dizzy);
        }
      }
      if (Math.abs(vx) > 150) lastVx.value = vx;
      lastVy.value = vy;
    },
    onFinalize: () => {
      'worklet';
      press.value = withSpring(0, { damping: 12, stiffness: 300 });
      if (!dragging.value) {
        // A pan that never moved ends as "failed", so `canceled` is set on
        // an ordinary tap too — any touch that didn't travel is a tap.
        scheduleOnRN(tapOrHoldEnd);
        return;
      }
      const g = geo.value;
      const projected = x.value + lastVx.value * 0.18;
      const toRight = projected + S / 2 > g.W / 2;
      const tx = toRight ? g.rightX : g.leftX;
      const ty = Math.max(g.minY, Math.min(g.maxY, y.value + lastVy.value * 0.08));
      x.value = withSpring(tx, { velocity: lastVx.value, damping: 14, stiffness: 170, mass: 0.9 });
      y.value = withSpring(ty, { velocity: lastVy.value, damping: 16, stiffness: 170 });
      // Swing back upright past center and settle, like a pendulum.
      lean.value = withSpring(0, { velocity: -lastVx.value / 900, damping: 5, stiffness: 120 });
      stretch.value = withSpring(1, { damping: 7, stiffness: 180 });
      scheduleOnRN(dropped, toRight ? 'right' : 'left', (ty - g.minY) / Math.max(1, g.maxY - g.minY));
    },
  });

  // ---- Styles ---------------------------------------------------------------

  const bodyStyle = useAnimatedStyle(() => {
    const n = nap.value;
    const g = geo.value;
    // Napping Ember tucks into the edge it's on.
    const tuck = x.value > g.W / 2 ? 1 : -1;
    return {
      opacity: show.value,
      transform: [
        { translateX: x.value + tuck * n * S * 0.2 },
        { translateY: y.value + n * H_BOX * 0.25 },
        { scale: (1 - 0.1 * press.value) * (1 - (1 - NAP_SCALE) * n) * (0.6 + 0.4 * show.value) },
      ],
    };
  });

  const napGlow = useAnimatedStyle(() => ({ opacity: nap.value * show.value }));

  // ---- Bubble placement ---------------------------------------------------

  const bubbleW = Math.min(W - 32, 340);
  const emberTop = restY;
  const above = emberTop > H * 0.4;
  const tailX = side === 'right' ? bubbleW - (W - (rightX + S / 2)) + 16 : leftX + S / 2 - 16;

  const bubblePos = {
    [side === 'right' ? 'right' : 'left']: 16,
    ...(above ? { bottom: H - emberTop + 2 } : { top: emberTop + H_BOX + 2 }),
  };

  const footer = [
    mode === 'tips'
      ? { label: 'This screen', icon: 'help' as const, onPress: () => setMode('about') }
      : { label: 'Back', icon: 'back' as const, onPress: () => setMode('tips') },
    ...(mode === 'tips' && advice.tips.length > 1
      ? [{ label: 'Something else', icon: 'sparkle' as const, onPress: () => setTipIndex((i) => i + 1) }]
      : []),
    {
      label: 'Nap',
      icon: 'nap' as const,
      onPress: () => {
        closeBubble();
        useEmberStore.getState().setNapping(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
      },
    },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {bubbleOpen && !hidden ? (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={StyleSheet.absoluteFill}>
          <Pressable style={styles.scrim} onPress={closeBubble} accessibilityLabel="Close Ember" />
        </Animated.View>
      ) : null}

      {bubbleOpen && !hidden && tip ? (
        <View style={[styles.bubbleWrap, bubblePos]} pointerEvents="box-none">
          <EmberBubble
            key={mode === 'about' ? 'about' : tip.id + tipIndex}
            width={bubbleW}
            placement={{ side, above, tailX }}
            title={mode === 'about' ? advice.about.title : undefined}
            line={mode === 'about' ? advice.about.line : tip.line}
            actions={mode === 'about' ? advice.about.actions : withTalk(tip.actions)}
            footer={footer}
            onAction={runAction}
            onTalk={rig.talk}
          />
        </View>
      ) : null}

      {toast && !hidden && !bubbleOpen && !napping ? (
        <View style={[styles.bubbleWrap, bubblePos]} pointerEvents="none">
          <EmberBubble
            key={toast.id}
            compact
            width={Math.min(bubbleW, 280)}
            placement={{ side, above, tailX: side === 'right' ? Math.min(bubbleW, 280) - (W - (rightX + S / 2)) + 16 : tailX }}
            line={toast.text}
            onTalk={rig.talk}
          />
        </View>
      ) : null}

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[styles.body, bodyStyle]}
          pointerEvents={hidden ? 'none' : 'auto'}
          hitSlop={10}
          accessible
          accessibilityRole="button"
          accessibilityLabel={napping ? 'Ember, napping' : 'Ember, your helper'}
          accessibilityHint={napping ? 'Wakes Ember up' : 'Opens tips for this screen'}
          accessibilityActions={[{ name: 'activate' }, { name: 'longpress', label: 'Say something kind' }]}
          onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'longpress' ? comfort() : openBubble())}
        >
          <Animated.View style={[styles.napGlow, napGlow]} pointerEvents="none">
            <Svg width={S * 1.5} height={S * 1.5}>
              <Defs>
                <RadialGradient id="napGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#F59646" stopOpacity={0.45} />
                  <Stop offset="1" stopColor="#F59646" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={S * 0.75} cy={S * 0.75} r={S * 0.75} fill="url(#napGlow)" />
            </Svg>
          </Animated.View>
          <Sparks burst={burst} reach={52} />
          <EmberSprite rig={rig} size={S} />
          {hasNudge && !bubbleOpen ? <NudgeDot /> : null}
          {napping ? <Zzz side={side} /> : null}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// Every tip ends with a way to just talk to Ember (the AI conversation).
const TALK: EmberAction = { label: 'Talk to me', href: '/companion', icon: 'chat' };
function withTalk(actions?: EmberAction[]) {
  const list = actions ?? [];
  if (list.some((a) => a.href === TALK.href)) return list;
  return [...list.slice(0, 2), TALK];
}

// A small glowing dot by Ember's head: "I've got something for you."
function NudgeDot() {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [p]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 0.85 + 0.3 * p.value }], opacity: 0.75 + 0.25 * p.value }));
  return <Animated.View style={[styles.nudge, style]} pointerEvents="none" />;
}

// The z's drift in toward the middle of the screen so the edge never
// clips them.
function Zzz({ side }: { side: 'left' | 'right' }) {
  return (
    <View style={[styles.zzzWrap, side === 'right' ? styles.zzzRight : styles.zzzLeft]} pointerEvents="none">
      {[0, 1, 2].map((i) => (
        <Z key={i} i={i} dir={side === 'right' ? -1 : 1} />
      ))}
    </View>
  );
}

function Z({ i, dir }: { i: number; dir: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(i * 900, withRepeat(withTiming(1, { duration: 2700, easing: Easing.out(Easing.quad) }), -1, false));
  }, [p, i]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.sin(p.value * Math.PI),
    transform: [
      { translateY: -p.value * 34 },
      { translateX: dir * p.value * 22 + Math.sin(p.value * 5) * 4 },
      { scale: 0.7 + p.value * 0.6 },
    ],
  }));
  return <Animated.Text style={[styles.z, style]}>z</Animated.Text>;
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(8, 6, 10, 0.45)',
  },
  bubbleWrap: {
    position: 'absolute',
  },
  body: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: S,
    height: H_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  napGlow: {
    position: 'absolute',
    width: S * 1.5,
    height: S * 1.5,
  },
  nudge: {
    position: 'absolute',
    top: 12,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.flameHot,
    borderWidth: 2,
    borderColor: colors.night,
    shadowColor: colors.flame,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  zzzWrap: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 20,
  },
  zzzRight: {
    left: 2,
  },
  zzzLeft: {
    right: 2,
  },
  z: {
    position: 'absolute',
    left: 0,
    top: 0,
    fontFamily: fonts.displaySoft,
    fontSize: 22,
    color: colors.flameHot,
  },
});

// Ember says something from anywhere in the app: `emberSay('Nice.', 'cheer')`.
export function emberSay(text: string, mood: EmberMood = 'happy') {
  useEmberStore.getState().say(text, mood);
}
