import { router } from 'expo-router';
import { type ReactNode, type RefObject, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, layout } from '../../core/theme';
import { BottomNav } from '../BottomNav';
import { Backdrop } from './Backdrop';
import { IconButton } from './IconButton';

interface ScreenProps {
  title?: string;
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
// floating nav.
export function Screen({
  title,
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
  const onBack = typeof back === 'function' ? back : () => router.back();

  const header = (
    <>
      {back || right ? (
        <View style={styles.topRow}>
          {back ? (
            <IconButton icon={backIcon} label={backIcon === 'close' ? 'Close' : 'Back'} onPress={onBack} />
          ) : (
            <View />
          )}
          {right ?? <View />}
        </View>
      ) : null}
      {title ? (
        <Animated.View
          entering={FadeInDown.duration(480).easing(Easing.out(Easing.cubic)).withInitialValues({
            opacity: 0,
            transform: [{ translateY: 10 }],
          })}
          style={[styles.titleBlock, centered && styles.centered]}
        >
          {kicker ? <Text style={[styles.kicker, centered && styles.textCenter]}>{kicker}</Text> : null}
          <Text style={[styles.title, centered && styles.textCenter]} accessibilityRole="header" numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.7}>
            {title}
          </Text>
          {subtitle ? <Text style={[styles.subtitle, centered && styles.textCenter]}>{subtitle}</Text> : null}
        </Animated.View>
      ) : null}
    </>
  );

  const pad = {
    paddingTop: insets.top + 8,
    paddingBottom: nav ? layout.navClearance + insets.bottom * 0.3 : insets.bottom + 32,
  };

  return (
    <View style={styles.root}>
      <Backdrop tone={tone} glowColor={glowColor} motes={motes} />
      {scroll ? (
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[styles.content, pad, contentStyle]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.flame} /> : undefined}
        >
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.content, pad, contentStyle]}>
          {header}
          {children}
        </View>
      )}
      {overlay}
      {nav ? <BottomNav /> : null}
    </View>
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
});
