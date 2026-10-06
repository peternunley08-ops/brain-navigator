import * as Haptics from '../../core/haptics';
import { router, usePathname } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Keyboard, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { adviseFor, type EmberAction } from '../../core/ember';
import { type EmberMood, inClassQuiet, lineMs, useEmberStore } from '../../core/emberStore';
import { emberHop, navTucked, pageDown, scrolling } from '../../core/chrome';
import { useHabitsStore } from '../../core/habitsStore';
import { useBrainNavigatorStore } from '../../core/store';
import { useTasksStore } from '../../core/tasksStore';
import { colors, fonts } from '../../core/theme';
import { dateKey } from '../../core/dates';
import { isShowing, useShowMode } from '../../core/showMode';
import { useWellnessStore } from '../../core/wellnessStore';
import { EmberBubble } from './EmberBubble';
import { autoAccessory } from '../../core/emberLook';
import { useLifeStore } from '../../core/lifeStore';
import { useSchoolStore } from '../../core/schoolStore';
import { EmberSprite } from './EmberSprite';
import { Confetti, Sparks } from './Sparks';
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
// Resting, Ember slides this far into its edge: about a third of the flame
// stays on screen, inside the page margin.
const PEEK = S * 0.6;

// Screens where Ember steps aside: the companion, welcome, and focus
// screens already have Ember on stage, and Breathe needs your whole
// attention.
const HIDDEN = new Set(['/companion', '/breathe', '/welcome', '/focus', '/scan']);

/** True on the pages where the floating Ember steps aside (its lines don't show there). */
export function emberStepsAside(path: string) {
  return HIDDEN.has(path);
}

const COMFORT = [
  'You’re doing better than you think.',
  'One thing at a time. That’s all anyone does.',
  'Whatever it is, you don’t have to carry it all at once.',
  'Hi. I’m glad you’re here.',
  'Slow breath in… and out. There.',
  'It’s okay to rest before it’s finished.',
];

const PETS = ['Hehe. That tickles.', 'Warm fuzzies.', 'Okay, I’m glowing now.', 'Again? Okay, again.'];

export function EmberBuddy() {
  const pathname = usePathname();
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const rig = useEmberRig();
  const reducedMotion = useReducedMotion();

  const loaded = useEmberStore((s) => s.loaded);
  const side = useEmberStore((s) => s.side);
  const yFrac = useEmberStore((s) => s.y);
  const napping = useEmberStore((s) => s.napping);
  const bubbleOpen = useEmberStore((s) => s.bubbleOpen);
  const toast = useEmberStore((s) => s.toast);
  const seen = useEmberStore((s) => s.seen);
  const accessoryPref = useLifeStore((s) => s.settings.emberAccessory);
  const worn = accessoryPref === 'auto' ? autoAccessory(pathname) : accessoryPref;

  // Re-evaluate advice whenever the data Ember reads from changes.
  const openCount = useBrainNavigatorStore((s) => s.openLoops.length);
  const checkins = useWellnessStore((s) => s.checkins);
  const tasks = useTasksStore((s) => s.tasks);
  const logs = useHabitsStore((s) => s.logs);
  const assignments = useSchoolStore((s) => s.assignments);
  const grades = useSchoolStore((s) => s.grades);
  const decks = useLifeStore((s) => s.decks);

  const [keyboardUp, setKeyboardUp] = useState(false);
  const [burst, setBurst] = useState(0);
  const [confetti, setConfetti] = useState(0);

  // Birthday: a party hat all day, and confetti the first time the app opens that day.
  // Halloween: a tiny pumpkin hat all day, and one line the first time (birthday wins).
  useEffect(() => {
    const check = () => {
      const life = useLifeStore.getState();
      const today = dateKey();
      const birthday = life.settings.birthday;
      const on = !!birthday && today.slice(5) === birthday && !isShowing();
      const halloween = today.slice(5) === '10-31';
      useEmberStore.getState().setHat(on ? 'party' : halloween ? 'pumpkin' : false);
      if (!on && halloween && !isShowing()) {
        const key = `halloween-${today.slice(0, 4)}`;
        const done = life.settings.celebrated ?? [];
        if (!done.includes(key)) {
          life.setSettings({ celebrated: [...done, key].slice(-200) });
          useEmberStore.getState().say('Happy Halloween. I found a pumpkin that fits.', 'happy');
        }
      }
      if (!on) return;
      const key = `birthday-sparks-${today.slice(0, 4)}`;
      const done = life.settings.celebrated ?? [];
      if (done.includes(key) || reducedMotion) return;
      life.setSettings({ celebrated: [...done, key].slice(-200) });
      setConfetti((c) => c + 1);
    };
    check();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') check();
    });
    // Riley has no birthday: the hat comes off while showing and back after.
    const unsubscribeShow = useShowMode.subscribe(check);
    return () => {
      sub.remove();
      unsubscribeShow();
    };
  }, [reducedMotion]);
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

  // Helpers and the Plus screen have their own flames on stage.
  const hidden = HIDDEN.has(pathname) || pathname.startsWith('/helper/') || pathname === '/plus' || keyboardUp;

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
    [pathname, openCount, checkins, tasks, logs, bubbleOpen, assignments, grades, decks]
  );
  const top = advice.tips[0];
  const quiet = useLifeStore((s) => !!s.settings.emberQuiet);
  const hasNudge = !!top && top.priority >= (quiet ? 3 : 2) && !seen.includes(top.id) && !napping && !inClassQuiet();
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
    useEmberStore.getState().say(COMFORT[Math.floor(Math.random() * COMFORT.length)], 'happy', true);
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

  // Holding on Ember for a moment = three calm breaths together.
  const swell = useSharedValue(0);
  const breathTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const breathing = useRef(false);
  const stopBreath = useCallback(
    (closing: boolean) => {
      if (!breathing.current) return;
      breathing.current = false;
      breathTimers.current.forEach(clearTimeout);
      breathTimers.current = [];
      swell.value = withTiming(0, { duration: reducedMotion ? 0 : 900 });
      rig.setMood('idle');
      if (closing) useEmberStore.getState().say('That was a good one. Thank you for breathing with me.', 'happy', true);
    },
    [rig, reducedMotion, swell]
  );
  const startBreath = useCallback(() => {
    const st = useEmberStore.getState();
    if (st.napping || breathing.current) return;
    breathing.current = true;
    st.setBubbleOpen(false);
    rig.setMood('happy');
    const at = (ms: number, fn: () => void) => breathTimers.current.push(setTimeout(fn, ms));
    const turn = (text: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
      useEmberStore.getState().say(text, 'happy', true);
    };
    for (let i = 0; i < 3; i++) {
      at(i * 10000, () => turn('Breathe in with me.'));
      at(i * 10000 + 4000, () => turn('And out.'));
    }
    at(30000, () => stopBreath(true));
    if (!reducedMotion) {
      swell.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 6000, easing: Easing.inOut(Easing.sin) })
        ),
        3,
        false
      );
    }
  }, [rig, reducedMotion, swell, stopBreath]);
  useEffect(() => () => breathTimers.current.forEach(clearTimeout), []);

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // This press started the calm, so letting go is the end of the hold, not a tap.
  const holdStartedBreath = useRef(false);
  const startHold = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdStartedBreath.current = false;
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      holdStartedBreath.current = !breathing.current;
      startBreath();
    }, 800);
  }, [startBreath]);
  const cancelHold = useCallback((): boolean => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
      return true; // hold hadn't fired yet
    }
    return false;
  }, []);
  // Two quick taps = a pet. Ember wiggles and glows.
  const pet = useCallback(() => {
    if (useEmberStore.getState().napping) return;
    useEmberStore.getState().setBubbleOpen(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {}), 120);
    rig.setMood('happy');
    rig.wiggle();
    rig.hopUp(6);
    setBurst((b) => b + 1);
    if (Math.random() < 0.5) useEmberStore.getState().say(PETS[Math.floor(Math.random() * PETS.length)], 'happy');
  }, [rig]);

  const lastTap = useRef(0);
  const tapOrHoldEnd = useCallback(() => {
    // Letting go of the hold that started the calm keeps it going (three breaths, about 30 s).
    if (holdStartedBreath.current) {
      holdStartedBreath.current = false;
      return;
    }
    // A tap while breathing ends the calm.
    if (breathing.current) {
      cancelHold();
      stopBreath(true);
      return;
    }
    // If the hold already fired, releasing is the end of it, not a tap.
    if (!cancelHold()) return;
    const now = Date.now();
    if (now - lastTap.current < 340) {
      lastTap.current = 0;
      pet();
      return;
    }
    lastTap.current = now;
    openBubble();
  }, [cancelHold, openBubble, pet, stopBreath]);

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
    }, lineMs(toast.text));
    return () => clearTimeout(t);
  }, [toast, rig]);

  // Ember's eyes follow the page: down while you read down, up when you
  // scroll back, back to you when the page stops.
  const followScroll = (dir: number) => {
    if (useEmberStore.getState().napping || reducedMotion) return;
    if (dir === 0) {
      rig.holdGaze(false);
      rig.look(0, 0);
      return;
    }
    rig.holdGaze(true);
    rig.look(0, dir > 0 ? 0.6 : -0.45);
  };
  // A pull to refresh gets a little hop.
  const hop = () => {
    if (!useEmberStore.getState().napping && !reducedMotion) rig.hopUp(14);
  };
  useAnimatedReaction(
    () => emberHop.value,
    (n, was) => {
      if (was !== null && n !== was) scheduleOnRN(hop);
    },
  );
  useAnimatedReaction(
    () => (scrolling.value > 0.5 ? (navTucked.value > 0.5 ? 1 : -1) : 0),
    (dir, was) => {
      if (dir !== was && was !== null) scheduleOnRN(followScroll, dir);
    },
  );

  // Every so often, when nothing else is going on, Ember does something
  // small on its own — stretches, looks around, a little hop. Not under
  // Reduce Motion: unprompted movement is exactly what that setting is for.
  useEffect(() => {
    if (reducedMotion) return;
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    // Late at night, the first thing Ember does is a sleepy yawn.
    const h = new Date().getHours();
    const sleepyHour = h >= 23 || h < 4;
    const first = setTimeout(() => {
      const s = useEmberStore.getState();
      if (alive && sleepyHour && !s.napping && !s.bubbleOpen && !s.toast) rig.yawn();
    }, 4500);
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
      clearTimeout(first);
    };
  }, [rig, reducedMotion]);

  // ---- Gesture ---------------------------------------------------------------

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const dragging = useSharedValue(0);
  const lastVx = useSharedValue(0);
  const lastVy = useSharedValue(0);
  const flips = useSharedValue(0);
  const dizzied = useSharedValue(0);
  // Drag weight: the shown spot trails the finger a few frames, and a tiny tilt leans with the motion.
  const offX = useSharedValue(0);
  // Resting Ember peeks from its edge so it never sits on words or buttons.
  // It comes all the way out by the title at the top of a page (the title
  // leaves it room), while it talks, and while you touch it.
  const awake = bubbleOpen || !!toast;
  const byTitle = !napping && yFrac <= 0.22;
  const peek = useSharedValue(0);
  useAnimatedReaction(
    () => (awake ? 0 : byTitle ? pageDown.value : 1),
    (to, was) => {
      if (to !== was) peek.value = withSpring(to, { damping: 18, stiffness: 160 });
    },
  );
  const offY = useSharedValue(0);
  const tilt = useSharedValue(0);
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
      const px = x.value;
      const py = y.value;
      x.value = startX.value + tx;
      // Rubber-band past the top and bottom limits.
      const ny = startY.value + ty;
      y.value = ny < g.minY ? g.minY - (g.minY - ny) * 0.35 : ny > g.maxY ? g.maxY + (ny - g.maxY) * 0.35 : ny;
      if (!reducedMotion) {
        // Restart the follow from where the shown spot is now, behind the finger.
        offX.value = offX.value - (x.value - px);
        offY.value = offY.value - (y.value - py);
        offX.value = withSpring(0, { damping: 18, stiffness: 260 });
        offY.value = withSpring(0, { damping: 18, stiffness: 260 });
        tilt.value += (Math.max(-6, Math.min(6, e.velocityX / 350)) - tilt.value) * 0.25;
      }

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
      tilt.value = withSpring(0, { damping: 12, stiffness: 140 });
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
    // While a page scrolls, Ember steps toward its edge and dims, then comes back.
    const away = scrolling.value * (1 - n);
    const out = Math.max(away * S * 0.32, peek.value * (1 - n) * (1 - press.value) * PEEK);
    return {
      opacity: show.value * (1 - 0.55 * away),
      transform: [
        { translateX: x.value + offX.value + tuck * n * S * 0.3 + tuck * out },
        { translateY: y.value + offY.value + n * H_BOX * 0.25 },
        { rotate: `${tilt.value}deg` },
        { scale: (1 - 0.1 * press.value) * (1 - (1 - NAP_SCALE) * n) * (0.6 + 0.4 * show.value) },
      ],
    };
  });

  const breathGlow = useAnimatedStyle(() => ({ opacity: swell.value * 0.9, transform: [{ scale: 0.8 + 0.6 * swell.value }] }));
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
      <Confetti run={confetti} width={W} height={H} colors={[colors.flame, colors.flameHot, '#E89AB8', colors.text]} />
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
          accessibilityActions={[
            { name: 'activate' },
            { name: 'longpress', label: 'Say something kind' },
            { name: 'magicTap', label: 'Pet Ember' },
          ]}
          onAccessibilityAction={(e) =>
            e.nativeEvent.actionName === 'longpress' ? comfort() : e.nativeEvent.actionName === 'magicTap' ? pet() : openBubble()
          }
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
          <Animated.View style={[styles.napGlow, breathGlow]} pointerEvents="none">
            <Svg width={S * 1.5} height={S * 1.5}>
              <Defs>
                <RadialGradient id="breathGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={colors.flame} stopOpacity={0.55} />
                  <Stop offset="1" stopColor={colors.flame} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={S * 0.75} cy={S * 0.75} r={S * 0.75} fill="url(#breathGlow)" />
            </Svg>
          </Animated.View>
          <Sparks burst={burst} reach={52} />
          <EmberSprite rig={rig} size={S} accessory={worn} />
          {hasNudge && !bubbleOpen ? <NudgeDot /> : null}
          {napping ? <Zzz side={side} /> : null}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// Every tip ends with a way to just talk to Ember (the AI conversation).
const TALK: EmberAction = { label: 'Talk to me', href: '/companion', icon: 'chat' };
const CREW: EmberAction = { label: 'Call a helper', href: '/helpers', icon: 'people' };

function withTalk(actions?: EmberAction[]) {
  const list = actions ?? [];
  if (list.some((a) => a.href === TALK.href)) return list;
  return [...list.slice(0, 2), TALK, ...(list.length < 2 ? [CREW] : [])];
}

// A small glowing dot by Ember's head: "I've got something for you."
function NudgeDot() {
  const p = useSharedValue(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    p.value = reduced ? 1 : withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [p, reduced]);
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
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    p.value = withDelay(i * 900, withRepeat(withTiming(1, { duration: 2700, easing: Easing.out(Easing.quad) }), -1, false));
  }, [p, i, reduced]);
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
