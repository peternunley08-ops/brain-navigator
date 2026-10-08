import * as Haptics from '../core/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname, useRootNavigationState } from 'expo-router';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { type LayoutChangeEvent, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { navTucked, navWanted, scrollFocusedToTop } from '../core/chrome';
import { useLifeStore } from '../core/lifeStore';
import { springs, timings } from '../core/motion';
import { isNight, minutesOf, nightClockVersion, nightNow, nightStart, subscribeNightClock } from '../core/night';
import { addOrder } from '../core/quickAddOrder';
import { dateKey, useSchoolStore } from '../core/schoolStore';
import { alpha, colors, fonts, gradients, radii, textGrow } from '../core/theme';
import { GLASS, GLASS_TINT, GlassFill } from './ui/Glass';
import { Icon, type IconName } from './ui/Icon';
import { PlusArt, hasPlusArt } from './plus/PlusArt';
import { Pressy } from './ui/Pressy';
import { Sheet } from './ui/Sheet';

type NavPath = '/' | '/school' | '/helpers' | '/steady';

interface NavItem {
  label: string;
  path: NavPath;
  icon: IconName;
  /** Hold the tab for its shortcut. */
  hold: { href: string; label: string; params?: Record<string, string> };
}

const LEFT: NavItem[] = [
  { label: 'Desk', path: '/', icon: 'candle', hold: { href: '/search', label: 'Search everything' } },
  { label: 'School', path: '/school', icon: 'book', hold: { href: '/add-assignment', label: 'Add homework or a test' } },
];
const RIGHT: NavItem[] = [
  // Ember's crew. Each helper has a free mode, so the tab never pushes AI.
  { label: 'Helpers', path: '/helpers', icon: 'people', hold: { href: '/helper/[id]', label: 'Quiz me with Quizzo', params: { id: 'quizzo' } } },
  // Holding Steady always reaches real people, from anywhere.
  { label: 'Steady', path: '/steady', icon: 'steady', hold: { href: '/help', label: 'Need help now' } },
];

// Tabs must not stack. A plain push adds a new copy of the screen on every
// tap, so the history grows forever and every hidden Desk keeps burning its
// candles. If the tab is already open somewhere in the history, go back
// down to it; otherwise open it. (Moving an existing screen to the top
// instead — `dangerouslySingular` — reorders the native stack, which
// desyncs it: Back stops working. Popping never reorders.)
const ROUTE_NAME: Record<NavPath, string> = {
  '/': 'index',
  '/school': 'school',
  '/helpers': 'helpers',
  '/steady': 'steady',
};

/** Height of the bar plus the room under it, for sliding it out of sight. */
const AWAY = 120;
const PILL = 44;
// Longer than a pop's passing routes, shorter than a real visit to a page that isn't a tab.
const PASSING_MS = 600;

// The app's one bottom nav, drawn above every page by the root layout, so
// it holds still while pages slide in and out under it. Pages say whether
// they want it (see Screen); it tucks away while you read down a long page.
export function BottomNav() {
  const pathname = usePathname();
  const rootState = useRootNavigationState();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  // School's badge: things overdue or due today and not done.
  const assignments = useSchoolStore((s) => s.assignments);
  const today = dateKey();
  const dueCount = assignments.filter((a) => !a.done && a.due <= today).length;
  const [adding, setAdding] = useState(false);

  const goTab = (path: NavPath) => {
    const open = rootState?.routes?.some((r) => r.name === ROUTE_NAME[path]);
    if (open) {
      router.dismissTo(path);
    } else {
      router.push(path);
    }
  };

  // Shown when the page wants it and you're not reading down a long page.
  const shown = useAnimatedStyle(() => {
    const v = navWanted.value * (1 - navTucked.value);
    return reduced ? { opacity: v, transform: [{ translateY: v < 0.05 ? AWAY : 0 }] } : { transform: [{ translateY: (1 - v) * AWAY }] };
  });

  // One pill that glides to the tab you're on.
  const [spots, setSpots] = useState<Partial<Record<NavPath, number>>>({});
  const place = (path: NavPath) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    const at = x + (width - PILL) / 2;
    setSpots((p) => (p[path] === at ? p : { ...p, [path]: at }));
  };
  const active = ([...LEFT, ...RIGHT].find((i) => i.path === pathname)?.path ?? null) as NavPath | null;
  const pillX = useSharedValue(-100);
  const pillOn = useSharedValue(0);
  const pillTo = useSharedValue(0);
  // When the pill last lost its tab: a pop back to the Desk passes through
  // pages that aren't tabs for a moment, and that's still between tabs.
  const awaySince = useRef<number | null>(null);
  useEffect(() => {
    const at = active ? spots[active] : undefined;
    if (at == null) {
      awaySince.current ??= Date.now();
      pillOn.value = withTiming(0, timings.quick);
      return;
    }
    const away = awaySince.current != null && Date.now() - awaySince.current > PASSING_MS;
    awaySince.current = null;
    // From nowhere (a page that isn't a tab), appear in place; between tabs, glide.
    if (away || pillX.value < 0) {
      pillTo.value = at;
      pillX.value = at;
    }
    else {
      pillTo.value = at;
      pillX.value = withSpring(at, springs.snappy);
    }
    pillOn.value = withTiming(1, timings.base);
  }, [active, spots, pillX, pillOn, pillTo]);
  // While it travels the pill stretches toward where it's going, then settles.
  const pillStyle = useAnimatedStyle(() => {
    if (reduced) return { opacity: pillOn.value, transform: [{ translateX: pillX.value }] };
    const gap = pillTo.value - pillX.value;
    const stretch = 1 + Math.min(0.3, Math.abs(gap) / 500);
    const lead = Math.sign(gap) * ((stretch - 1) * PILL) / 2;
    return { opacity: pillOn.value, transform: [{ translateX: pillX.value + lead }, { scaleX: stretch }] };
  });

  // The + turns toward an × while its sheet is open.
  const turn = useSharedValue(0);
  useEffect(() => {
    turn.value = withSpring(adding ? 1 : 0, springs.snappy);
  }, [adding, turn]);
  const plusStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 45}deg` }] }));
  // After wind-down the room's light should be the candle, not the chrome:
  // the bar steps back a little (still readable, still tappable).
  const windDown = useLifeStore((s) => s.settings.windDown);
  const nightOwl = useLifeStore((s) => s.about.picks.time === 'b');
  useSyncExternalStore(subscribeNightClock, nightClockVersion);
  const late = isNight(minutesOf(nightNow()), nightStart(windDown, nightOwl));

  return (
    <Animated.View style={[styles.wrap, { paddingBottom: Math.max(16, insets.bottom - 8) }, shown]} pointerEvents="box-none">
      <View style={[styles.bar, GLASS ? styles.barGlass : late && styles.barLate]}>
        <GlassFill radius={34} tint={late ? NIGHT_TINT : GLASS_TINT} />
        <Animated.View style={[styles.pill, pillStyle]} pointerEvents="none" />
        {LEFT.map((item) => (
          <NavSegment
            key={item.path}
            item={item}
            active={active === item.path}
            badge={item.path === '/school' && dueCount > 0 ? dueCount : undefined}
            onGo={goTab}
            onLayout={place(item.path)}
            edge={item.path === '/' ? 'start' : undefined}
          />
        ))}

        <View style={styles.centerSlot}>
          <Pressy
            style={styles.centerButton}
            depth={0.9}
            haptic="none"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              setAdding(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Add something"
          >
            <LinearGradient colors={gradients.flame} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.centerFill}>
              <Animated.View style={plusStyle}>
                <Icon name="plus" size={28} color={colors.flameInk} strokeWidth={2.6} />
              </Animated.View>
            </LinearGradient>
          </Pressy>
        </View>

        {RIGHT.map((item) => (
          <NavSegment key={item.path} item={item} active={active === item.path} onGo={goTab} onLayout={place(item.path)} edge={item.path === '/steady' ? 'end' : undefined} />
        ))}
      </View>
      <QuickAdd open={adding} onClose={() => setAdding(false)} />
    </Animated.View>
  );
}

const ADD_OPTIONS: { title: string; body: string; icon: IconName; color: string; href: string }[] = [
  { title: 'Homework or a test', body: 'Something due for a class', icon: 'book', color: '#8FB4E8', href: '/add-assignment' },
  { title: 'Something on my mind', body: 'Set it down as a candle', icon: 'candle', color: '#F0845A', href: '/new-entry' },
  { title: 'A focus session', body: 'Light the study candle', icon: 'timer', color: '#F5B45C', href: '/focus' },
  { title: 'Scan a screenshot', body: 'Import from Classroom or Canvas', icon: 'image', color: '#AFA2DE', href: '/scan' },
];

const MORE_OPTIONS: { title: string; icon: IconName; color: string; href: string }[] = [
  { title: 'A helper', icon: 'people', color: '#B79AF0', href: '/helpers' },
  { title: 'A grade', icon: 'grade', color: '#9FD08A', href: '/grades' },
  { title: 'Flashcards', icon: 'cards', color: '#E89AB8', href: '/flashcards' },
  { title: 'A win', icon: 'jar', color: '#E6C46A', href: '/wins' },
  { title: 'Hours', icon: 'hands', color: '#8CC0A8', href: '/hours' },
];

// The + button's sheet: every way to add something, one tap each. Drag it
// down to put it away; it follows the finger and springs back if you don't
// pull far enough.
// Options in the given href order; anything not named keeps its place at the end.
function byHref<T extends { href: string }>(options: T[], hrefs: string[]) {
  const rank = (o: T) => {
    const i = hrefs.indexOf(o.href);
    return i < 0 ? hrefs.length : i;
  };
  return [...options].sort((a, b) => rank(a) - rank(b));
}

function QuickAdd({ open, onClose }: { open: boolean; onClose: () => void }) {
  const windDown = useLifeStore((s) => s.settings.windDown);
  const nightOwl = useLifeStore((s) => s.about.picks.time === 'b');
  // Re-ordered each time the sheet opens, by the (dev-adjustable) clock.
  const order = useMemo(() => addOrder(nightNow(), windDown, nightOwl), [open, windDown, nightOwl]); // eslint-disable-line react-hooks/exhaustive-deps
  const { height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // At the largest text sizes the options outgrow the screen: the title
  // becomes the drag handle and the options scroll underneath it.
  const tall = fontScale > 1.5;
  const title = <Text style={styles.sheetTitle} maxFontSizeMultiplier={textGrow.display}>Put something down</Text>;
  const body = (
    <>
      {byHref(ADD_OPTIONS, order.main).map((o) => (
        <Pressy
          key={o.href}
          style={styles.option}
          onPress={() => {
            onClose();
            router.push(o.href as never);
          }}
          accessibilityRole="button"
          accessibilityLabel={o.title}
          accessibilityHint={o.body}
        >
          <View style={[styles.optionIcon, { backgroundColor: alpha(o.color, 0.16), borderColor: alpha(o.color, 0.35) }]}>
            {hasPlusArt(o.href) ? <PlusArt href={o.href} size={34} /> : <Icon name={o.icon} size={22} color={o.color} />}
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle} maxFontSizeMultiplier={2}>{o.title}</Text>
            <Text style={styles.optionBody} maxFontSizeMultiplier={2}>{o.body}</Text>
          </View>
          <Icon name="chevron" size={18} color={colors.textFaint} />
        </Pressy>
      ))}
      <View style={styles.moreRow}>
        {byHref(MORE_OPTIONS, order.more).map((o) => (
          <Pressy
            key={o.href}
            style={styles.more}
            onPress={() => {
              onClose();
              router.push(o.href as never);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Add ${o.title.toLowerCase()}`}
          >
            <View style={[styles.moreIcon, { backgroundColor: alpha(o.color, 0.16), borderColor: alpha(o.color, 0.35) }]}>
              <Icon name={o.icon} size={20} color={o.color} />
            </View>
            <Text style={styles.moreText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} maxFontSizeMultiplier={textGrow.bar}>{o.title}</Text>
          </Pressy>
        ))}
      </View>
    </>
  );
  return (
    <Sheet open={open} onClose={onClose} head={tall ? title : undefined} style={tall && { maxHeight: height - insets.top - 8 }}>
      {tall ? (
        <ScrollView style={styles.sheetScroll} alwaysBounceVertical={false} showsVerticalScrollIndicator={false}>
          {body}
        </ScrollView>
      ) : (
        <>
          {title}
          {body}
        </>
      )}
    </Sheet>
  );
}

function NavSegment({
  item,
  active,
  badge,
  onGo,
  onLayout,
  edge,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
  onGo: (path: NavPath) => void;
  onLayout: (e: LayoutChangeEvent) => void;
  /** The first and last tabs keep their hold hint on screen. */
  edge?: 'start' | 'end';
}) {
  const tint = active ? colors.flame : colors.textFaint;
  // The chosen tab's icon lifts a little.
  const lift = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    lift.value = withSpring(active ? 1 : 0, springs.snappy);
  }, [active, lift]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -2 * lift.value }, { scale: 1 + 0.06 * lift.value }] }));
  // The badge pops when its number changes.
  const pop = useSharedValue(1);
  useEffect(() => {
    if (badge) pop.value = withSequence(withTiming(1.35, { duration: 120 }), withSpring(1, springs.snappy));
  }, [badge, pop]);
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  // Holding a tab says what the hold will do, a beat before it does it.
  const [hint, setHint] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endHint = () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = null;
    setHint(false);
  };
  return (
    <Pressy
      style={styles.segment}
      depth={0.9}
      onLayout={onLayout}
      onPressIn={() => {
        hintTimer.current = setTimeout(() => setHint(true), 180);
      }}
      onPressOut={endHint}
      // On the tab already: back to the top of it, the way iOS tabs work.
      onPress={() => (active ? scrollFocusedToTop() : onGo(item.path))}
      onLongPress={() => {
        endHint();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        router.push({ pathname: item.hold.href as never, params: item.hold.params ?? {} });
      }}
      delayLongPress={450}
      accessibilityActions={[{ name: 'longpress', label: item.hold.label }]}
      onAccessibilityAction={(e) => e.nativeEvent.actionName === 'longpress' && router.push({ pathname: item.hold.href as never, params: item.hold.params ?? {} })}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={badge ? `${item.label}, ${badge} open` : item.label}
      accessibilityHint={active ? 'Goes to the top' : undefined}
    >
      {hint ? (
        <View style={[styles.hintSlot, edge === 'start' ? styles.hintStart : edge === 'end' ? styles.hintEnd : null]} pointerEvents="none">
          <Animated.View entering={FadeInDown.duration(160)} exiting={FadeOut.duration(120)} style={styles.hint}>
            <Text style={styles.hintText} numberOfLines={1} maxFontSizeMultiplier={1.3}>
              {item.hold.label}
            </Text>
          </Animated.View>
        </View>
      ) : null}
      <Animated.View style={[styles.iconWrap, iconStyle]}>
        <Icon name={item.icon} size={22} color={tint} strokeWidth={active ? 2.1 : 1.8} />
        {badge ? (
          <Animated.View style={[styles.badge, badgeStyle]}>
            <Text style={styles.badgeText} maxFontSizeMultiplier={1}>
              {badge}
            </Text>
          </Animated.View>
        ) : null}
      </Animated.View>
      <Text style={[styles.label, { color: tint }, active && styles.labelActive]} maxFontSizeMultiplier={1.2} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
        {item.label}
      </Text>
    </Pressy>
  );
}

// After lights-out the bar sinks back into the dark, and the sheet is a
// little more solid than the bar so its rows read easily.
const NIGHT_TINT = alpha(colors.night, 0.7);

const styles = StyleSheet.create({
  hintSlot: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 14,
    left: -90,
    right: -90,
    alignItems: 'center',
  },
  hintStart: {
    left: -6,
    right: 'auto',
    alignItems: 'flex-start',
  },
  hintEnd: {
    left: 'auto',
    right: -6,
    alignItems: 'flex-end',
  },
  hint: {
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  hintText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.text,
  },
  moreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  more: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  moreIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
  },
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 68,
    width: 372,
    maxWidth: '94%',
    paddingHorizontal: 6,
    backgroundColor: 'rgba(30, 24, 34, 0.97)',
    borderRadius: 34,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.lineStrong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 10,
  },
  barLate: {
    opacity: 0.75,
  },
  barGlass: {
    backgroundColor: 'transparent',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
  },
  iconWrap: {
    width: 44,
    height: 30,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    position: 'absolute',
    left: 0,
    top: 11,
    width: PILL,
    height: 30,
    borderRadius: radii.pill,
    backgroundColor: alpha(colors.flame, 0.14),
  },
  label: {
    marginTop: 2,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
  labelActive: {
    fontFamily: fonts.bodySemi,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: 2,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.unlocked,
    borderWidth: 2,
    borderColor: '#1E1822',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontVariant: ['tabular-nums'],
    fontSize: 9,
    color: colors.flameInk,
  },
  centerSlot: {
    width: 70,
    alignItems: 'center',
  },
  centerButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    marginTop: -30,
    borderWidth: 5,
    borderColor: colors.night,
    shadowColor: colors.flame,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  // Hugs its content and only scrolls once the sheet hits its height limit.
  sheetScroll: {
    flexGrow: 0,
  },
  sheetTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  optionBody: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textFaint,
  },
  centerFill: {
    flex: 1,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
