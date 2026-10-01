import * as Haptics from '../core/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useNavigation, usePathname } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dateKey, useSchoolStore } from '../core/schoolStore';
import { alpha, colors, fonts, gradients } from '../core/theme';
import { Icon, type IconName } from './ui/Icon';
import { Pressy } from './ui/Pressy';

type NavPath = '/' | '/school' | '/focus' | '/steady';

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
  { label: 'Focus', path: '/focus', icon: 'timer', hold: { href: '/focus', label: 'Start five minutes', params: { quick: '5' } } },
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
  '/focus': 'focus',
  '/steady': 'steady',
};

export function BottomNav() {
  const pathname = usePathname();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  // School's badge: things overdue or due today and not done.
  const assignments = useSchoolStore((s) => s.assignments);
  const today = dateKey();
  const dueCount = assignments.filter((a) => !a.done && a.due <= today).length;
  const [adding, setAdding] = useState(false);

  const goTab = (path: NavPath) => {
    const open = navigation.getState()?.routes.some((r) => r.name === ROUTE_NAME[path]);
    if (open) {
      router.dismissTo(path);
    } else {
      router.push(path);
    }
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(16, insets.bottom - 8) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {LEFT.map((item) => (
          <NavSegment
            key={item.path}
            item={item}
            active={pathname === item.path}
            badge={item.path === '/school' && dueCount > 0 ? dueCount : undefined}
            onGo={goTab}
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
              <Icon name="plus" size={28} color={colors.flameInk} strokeWidth={2.6} />
            </LinearGradient>
          </Pressy>
        </View>

        {RIGHT.map((item) => (
          <NavSegment key={item.path} item={item} active={pathname === item.path} onGo={goTab} />
        ))}
      </View>
      <QuickAdd open={adding} onClose={() => setAdding(false)} />
    </View>
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

// The + button's sheet: every way to add something, one tap each.
function QuickAdd({ open, onClose }: { open: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
      <Animated.View entering={SlideInDown.springify().damping(18)} style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grabber} />
        <Text style={styles.sheetTitle}>Add something</Text>
        {ADD_OPTIONS.map((o) => (
          <Pressy
            key={o.href}
            style={styles.option}
            onPress={() => {
              onClose();
              router.push(o.href as never);
            }}
            accessibilityRole="button"
            accessibilityLabel={o.title}
          >
            <View style={[styles.optionIcon, { backgroundColor: alpha(o.color, 0.16), borderColor: alpha(o.color, 0.35) }]}>
              <Icon name={o.icon} size={22} color={o.color} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{o.title}</Text>
              <Text style={styles.optionBody}>{o.body}</Text>
            </View>
            <Icon name="chevron" size={18} color={colors.textFaint} />
          </Pressy>
        ))}
        <View style={styles.moreRow}>
          {MORE_OPTIONS.map((o) => (
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
              <Text style={styles.moreText}>{o.title}</Text>
            </Pressy>
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
}

function NavSegment({
  item,
  active,
  badge,
  onGo,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
  onGo: (path: NavPath) => void;
}) {
  const tint = active ? colors.flame : colors.textFaint;
  return (
    <Pressy
      style={styles.segment}
      depth={0.9}
      onPress={() => (active ? undefined : onGo(item.path))}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        router.push({ pathname: item.hold.href as never, params: item.hold.params ?? {} });
      }}
      delayLongPress={450}
      accessibilityActions={[{ name: 'longpress', label: item.hold.label }]}
      onAccessibilityAction={(e) => e.nativeEvent.actionName === 'longpress' && router.push({ pathname: item.hold.href as never, params: item.hold.params ?? {} })}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={badge ? `${item.label}, ${badge} open` : item.label}
    >
      <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
        <Icon name={item.icon} size={22} color={tint} strokeWidth={active ? 2.1 : 1.8} />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.label, { color: tint }, active && styles.labelActive]} maxFontSizeMultiplier={1.3}>
        {item.label}
      </Text>
    </Pressy>
  );
}

const styles = StyleSheet.create({
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
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
  },
  iconWrap: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
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
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6, 4, 8, 0.6)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#211A25',
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.lineStrong,
    marginBottom: 14,
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
