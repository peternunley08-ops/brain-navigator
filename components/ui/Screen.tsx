import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useFocusEffect, usePathname } from 'expo-router';
import { type ReactNode, type RefObject, useCallback, useRef, useState } from 'react';
import { type LayoutChangeEvent, Pressable, RefreshControl, type ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearScrollToTop, firstOpen, goBack, goHome, navTucked, scrolling, setScrollToTop, wantNav } from '../../core/chrome';
import { timings } from '../../core/motion';
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
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [settle] = useState(() => firstOpen(pathname));
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
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

  const y = useSharedValue(0);
  const lastY = useSharedValue(0);
  // Where the big title ends, so the compact bar arrives as it leaves.
  const titleEnd = useSharedValue(title ? 140 : 70);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      const at = e.contentOffset.y;
      y.value = at;
      const dy = at - lastY.value;
      lastY.value = at;
      const room = e.contentSize.height - e.layoutMeasurement.height;
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
    onEndDrag: () => {
      scrolling.value = withDelay(700, withTiming(0, timings.calm));
    },
    onMomentumEnd: () => {
      scrolling.value = withDelay(350, withTiming(0, timings.calm));
    },
  });

  // The title is under the bar once its bottom passes the bar's bottom edge.
  // Pages that draw their own heading get the bar once the top row is gone.
  const cut = insets.top + BAR;
  const hasTitle = !!title;
  const [barOn, setBarOn] = useState(false);
  useAnimatedReaction(
    () => y.value > (hasTitle ? titleEnd.value - cut - 16 : 30),
    (on, was) => {
      if (on !== was) runOnJS(setBarOn)(on);
    },
  );
  const barText = useAnimatedStyle(() => {
    const from = hasTitle ? titleEnd.value - cut - 36 : 10;
    const to = hasTitle ? titleEnd.value - cut + 4 : 50;
    return {
      opacity: interpolate(y.value, [from, to], [0, 1], 'clamp'),
      transform: [{ translateY: interpolate(y.value, [from, to], [6, 0], 'clamp') }],
    };
  });
  const barFill = useAnimatedStyle(() => {
    const from = hasTitle ? titleEnd.value - cut - 36 : 10;
    const to = hasTitle ? titleEnd.value - cut + 4 : 50;
    return { opacity: interpolate(y.value, [from, to], [0, 1], 'clamp') };
  });
  // The big title eases up and fades as it slides under the bar.
  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [titleEnd.value - cut - 90, titleEnd.value - cut], [1, 0.1], 'clamp'),
    transform: [{ translateY: interpolate(y.value, [0, titleEnd.value], [0, titleEnd.value * 0.18], 'clamp') }],
  }));
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
      <View style={styles.root}>
        <Backdrop tone={tone} glowColor={glowColor} motes={motes} />
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
