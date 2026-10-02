import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useFocusEffect, usePathname } from 'expo-router';
import { type ReactNode, type RefObject, useCallback, useRef, useState } from 'react';
import { type LayoutChangeEvent, Pressable, RefreshControl, type ScrollView, StyleSheet, Text, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearScrollToTop, emberHop, firstOpen, goBack, goHome, keepScroll, keptScroll, navTucked, scrolling, setScrollToTop, wantNav } from '../../core/chrome';
import { timings } from '../../core/motion';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { colors, fonts, layout } from '../../core/theme';
import { Backdrop } from './Backdrop';
import { IconButton } from './IconButton';
import { RevealContext } from './Reveal';

const GLASS = isLiquidGlassAvailable();
/** Height of the compact bar under the status bar. */
const BAR = 50;

interface ScreenProps {
  title?: string;
  /** The compact bar's title, for pages that draw their own heading. */
  barTitle?: string;
  subtitle?: string;
  /** Show a back button (default) — or pass a handler to override it. */
  back?: boolean | (() => void);
  backIcon?: 'back' | 'close';
  /** Whatever sits at the top right (usually an IconButton). */
  right?: ReactNode;
  /** A line above the title, in Fraunces italic. */
  kicker?: string;
  tone?: 'room' | 'ember' | 'dusk';
  glowColor?: string;
  motes?: boolean;
  /** Whether the app's bottom nav shows on this page. */
  nav?: boolean;
  scroll?: boolean;
  children?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** Rendered over the scroll, outside it (sheets, toasts). */
  overlay?: ReactNode;
  scrollRef?: RefObject<ScrollView | null>;
  /** Center the title block (detail screens with a hero above). */
  centered?: boolean;
  /** Pull down to refresh. */
  onRefresh?: () => Promise<unknown> | void;
  /** Shown as an iOS sheet (quick-add pages): no status-bar gap when it is one. */
  sheet?: boolean;
}

// The frame every screen in the app is built in: the night room, a round
// back button, a big serif title, and scrolling content that clears the
// floating nav. The nav itself is drawn once for the whole app (in the root
// layout); each page only says whether it wants it. Once the big title
// scrolls away, a compact bar fades in with Back and the title, so leaving
// is always one tap away.
export function Screen({
  title,
  barTitle,
  subtitle,
  back = true,
  backIcon = 'back',
  right,
  kicker,
  tone = 'room',
  glowColor,
  motes,
  nav = true,
  scroll = true,
  children,
  contentStyle,
  overlay,
  scrollRef,
  centered,
  onRefresh,
  sheet,
}: ScreenProps) {
  const safe = useSafeAreaInsets();
  // A sheet starts below the status bar, so its top inset is zero. Opened
  // straight from a link, the same page is full screen and keeps it.
  // (In a sheet the page is shorter than the window; that's how it knows.)
  const [inSheet, setInSheet] = useState(false);
  const { height: winH } = useWindowDimensions();
  const onRootLayout = (e: LayoutChangeEvent) => {
    if (sheet) setInSheet(e.nativeEvent.layout.height < winH - 20);
  };
  const insets = inSheet ? { ...safe, top: 10 } : safe;
  const pathname = usePathname();
  const [settle] = useState(() => firstOpen(pathname));
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    emberHop.value += 1;
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };
  const onBack = typeof back === 'function' ? back : goBack;
  const label = title ?? barTitle;

  // ---- Scrolling ------------------------------------------------------------
  const list = useRef<ScrollView | null>(null);
  const setList = useCallback(
    (r: ScrollView | null) => {
      list.current = r;
      if (scrollRef) scrollRef.current = r;
    },
    [scrollRef],
  );
  const toTop = useCallback(() => list.current?.scrollTo({ y: 0, animated: true }), []);

  // In front: say whether the nav belongs here, and take "tap the tab to go up".
  useFocusEffect(
    useCallback(() => {
      wantNav(nav);
      setScrollToTop(toTop);
      return () => clearScrollToTop(toTop);
    }, [nav, toTop]),
  );

  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  const lastY = useSharedValue(0);
  // How far the page can scroll, and how tall the window is, for the
  // reading line on long pages.
  const roomV = useSharedValue(0);
  const view = useSharedValue(1);
  const { width: winW } = useWindowDimensions();
  const [restoreY] = useState(() => keptScroll(pathname));
  const restored = useRef(restoreY === 0);
  const keep = useCallback((at: number) => keepScroll(pathname, at), [pathname]);
  // Where the big title ends, so the compact bar arrives as it leaves.
  const titleEnd = useSharedValue(title ? 140 : 70);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      const at = e.contentOffset.y;
      y.value = at;
      const dy = at - lastY.value;
      lastY.value = at;
      const room = e.contentSize.height - e.layoutMeasurement.height;
      roomV.value = room;
      view.value = e.layoutMeasurement.height;
      // Reading down a long page tucks the nav away; any move up, the top,
      // or the very end brings it back.
      if (room < 160 || at < 80 || at > room - 24) {
        if (navTucked.value !== 0) navTucked.value = withTiming(0, timings.base);
      } else if (dy > 6 && navTucked.value === 0) {
        navTucked.value = withTiming(1, timings.base);
      } else if (dy < -6 && navTucked.value === 1) {
        navTucked.value = withTiming(0, timings.base);
      }
    },
    onBeginDrag: () => {
      scrolling.value = withTiming(1, timings.quick);
    },
    onMomentumBegin: () => {
      scrolling.value = withTiming(1, timings.quick);
    },
    onEndDrag: (e) => {
      scrolling.value = withDelay(700, withTiming(0, timings.calm));
      runOnJS(keep)(e.contentOffset.y);
    },
    onMomentumEnd: (e) => {
      scrolling.value = withDelay(350, withTiming(0, timings.calm));
      runOnJS(keep)(e.contentOffset.y);
    },
  });

  // The title is under the bar once its bottom passes the bar's bottom edge.
  // Pages that draw their own heading get the bar once the top row is gone.
  const cut = insets.top + BAR;
  const hasTitle = !!title;
  const [barOn, setBarOn] = useState(false);
  useAnimatedReaction(
    () => y.value > (hasTitle ? Math.max(titleEnd.value - cut - 16, 30) : 30),
    (on, was) => {
      if (on !== was) runOnJS(setBarOn)(on);
    },
  );
  const barText = useAnimatedStyle(() => {
    const to = hasTitle ? Math.max(titleEnd.value - cut + 4, 50) : 50;
    const from = hasTitle ? Math.max(10, to - 40) : 10;
    return {
      opacity: interpolate(y.value, [from, to], [0, 1], 'clamp'),
      transform: [{ translateY: interpolate(y.value, [from, to], [6, 0], 'clamp') }],
    };
  });
  const barFill = useAnimatedStyle(() => {
    const to = hasTitle ? Math.max(titleEnd.value - cut + 4, 50) : 50;
    const from = hasTitle ? Math.max(10, to - 40) : 10;
    return { opacity: interpolate(y.value, [from, to], [0, 1], 'clamp') };
  });
  // The big title eases up and fades as it slides under the bar.
  // (Never before the page moves: a title near the top still starts at full strength.)
  const titleStyle = useAnimatedStyle(() => {
    const end = Math.max(titleEnd.value - cut, 60);
    const start = Math.max(4, end - 90);
    return {
      opacity: interpolate(y.value, [start, end], [1, 0.1], 'clamp'),
      transform: [{ translateY: interpolate(y.value, [0, titleEnd.value], [0, titleEnd.value * 0.18], 'clamp') }],
    };
  });
  // Pulling past the top brightens the candlelight instead of a dead edge.
  const pullGlow = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [-140, 0], [1, 0], 'clamp'),
    transform: [{ scale: reduced ? 1 : interpolate(y.value, [-140, 0], [1.15, 0.9], 'clamp') }],
  }));
  // The room's light drifts slower than the page, for a little depth.
  const depth = useAnimatedStyle(() => ({
    transform: [{ translateY: reduced ? 0 : interpolate(y.value, [0, 900], [0, -60], 'clamp') }],
  }));
  // A thin line under the bar on long pages: how far through you are.
  const reading = useAnimatedStyle(() => {
    const long = roomV.value > view.value * 1.5;
    const p = roomV.value > 0 ? Math.min(1, Math.max(0, y.value / roomV.value)) : 0;
    return { opacity: long ? interpolate(y.value, [40, 140], [0, 1], 'clamp') : 0, width: p * winW };
  });
  // Back on a tab after a little while: land where you were.
  const onContentSize = (_w: number, h: number) => {
    if (restored.current || h < restoreY + 200) return;
    restored.current = true;
    list.current?.scrollTo({ y: restoreY, animated: false });
  };

  const onTitleLayout = (e: LayoutChangeEvent) => {
    const { y: top, height } = e.nativeEvent.layout;
    titleEnd.value = top + height;
  };

  const header = (
    <>
      {back || right ? (
        <View style={styles.topRow}>
          {back ? <IconButton icon={backIcon} label={backIcon === 'close' ? 'Close' : 'Back'} onPress={onBack} onLongPress={goHome} accessibilityHint="Hold to go to the Desk" /> : <View />}
          {right ?? <View />}
        </View>
      ) : null}
      {title ? (
        <Animated.View
          entering={settle ? FadeInDown.duration(400).easing(Easing.out(Easing.cubic)).withInitialValues({ opacity: 0, transform: [{ translateY: 10 }] }) : undefined}
          style={[styles.titleBlock, centered && styles.centered]}
          onLayout={onTitleLayout}
        >
          <Animated.View style={[centered && styles.centered, scroll && titleStyle]}>
            {kicker ? <Text style={[styles.kicker, centered && styles.textCenter]}>{kicker}</Text> : null}
            <Text style={[styles.title, centered && styles.textCenter]} accessibilityRole="header" numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.7}>
              {title}
            </Text>
            {subtitle ? <Text style={[styles.subtitle, centered && styles.textCenter]}>{subtitle}</Text> : null}
          </Animated.View>
        </Animated.View>
      ) : null}
    </>
  );

  const pad = {
    paddingTop: insets.top + 8,
    paddingBottom: nav ? layout.navClearance + insets.bottom * 0.3 : insets.bottom + 32,
  };

  return (
    <RevealContext.Provider value={settle}>
      <View style={styles.root} onLayout={onRootLayout} collapsable={false}>
        <Animated.View style={[styles.backdrop, depth]} pointerEvents="none">
          <Backdrop tone={tone} glowColor={glowColor} motes={motes} />
        </Animated.View>
        {scroll ? (
          <Animated.View style={[styles.pullGlow, pullGlow]} pointerEvents="none">
            <Svg width={winW} height={320}>
              <Defs>
                <RadialGradient id="pull" cx="50%" cy="0%" rx="70%" ry="100%">
                  <Stop offset="0" stopColor={glowColor ?? colors.flame} stopOpacity={0.32} />
                  <Stop offset="1" stopColor={glowColor ?? colors.flame} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Ellipse cx={winW / 2} cy={0} rx={winW * 0.8} ry={320} fill="url(#pull)" />
            </Svg>
          </Animated.View>
        ) : null}
        {scroll ? (
          <Animated.ScrollView
            ref={setList}
            style={styles.flex}
            contentContainerStyle={[styles.content, pad, contentStyle]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            onContentSizeChange={onContentSize}
            scrollEventThrottle={16}
            refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.flame} /> : undefined}
          >
            {header}
            {children}
          </Animated.ScrollView>
        ) : (
          <View style={[styles.flex, styles.content, pad, contentStyle]}>
            {header}
            {children}
          </View>
        )}
        {scroll && (back || title || barTitle) ? (
          <View style={[styles.bar, { height: insets.top + BAR }]} pointerEvents={barOn ? 'box-none' : 'none'}>
            {GLASS ? (
              <GlassView
                style={StyleSheet.absoluteFill}
                glassEffectStyle={{ style: barOn ? 'regular' : 'none', animate: true, animationDuration: 0.25 }}
                colorScheme="dark"
                tintColor="rgba(22, 16, 24, 0.45)"
              />
            ) : (
              <Animated.View style={[StyleSheet.absoluteFill, styles.barFallback, barFill]} />
            )}
            <Animated.View style={[styles.barRow, { marginTop: insets.top }, barText]}>
              {back ? <IconButton icon={backIcon} label={backIcon === 'close' ? 'Close' : 'Back'} onPress={onBack} onLongPress={goHome} accessibilityHint="Hold to go to the Desk" size={36} /> : <View style={styles.barSide} />}
              <Pressable onPress={toTop} style={styles.barTitleWrap} accessibilityRole="button" accessibilityLabel={label ? `${label}, back to top` : 'Back to top'}>
                {label ? (
                  <Text style={styles.barTitle} numberOfLines={1}>
                    {label}
                  </Text>
                ) : null}
              </Pressable>
              <View style={styles.barSide} />
            </Animated.View>
            <Animated.View style={[styles.reading, reading]} />
          </View>
        ) : null}
        {overlay}
      </View>
    </RevealContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.night,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: -60,
  },
  pullGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  reading: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.flame,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.gutter,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  titleBlock: {
    marginTop: 18,
    marginBottom: 8,
  },
  centered: {
    alignItems: 'center',
  },
  textCenter: {
    textAlign: 'center',
  },
  kicker: {
    marginBottom: 4,
    fontFamily: fonts.displaySoft,
    fontSize: 16,
    color: colors.flame,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 40,
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textMuted,
  },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  barFallback: {
    backgroundColor: 'rgba(20, 15, 22, 0.94)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  barRow: {
    height: BAR,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  barSide: {
    width: 36,
  },
  barTitleWrap: {
    flex: 1,
    height: BAR,
    justifyContent: 'center',
  },
  barTitle: {
    textAlign: 'center',
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
});
