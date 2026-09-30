import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useNavigation, usePathname } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBrainNavigatorStore } from '../core/store';
import { alpha, colors, fonts, gradients } from '../core/theme';
import { Icon, type IconName } from './ui/Icon';
import { Pressy } from './ui/Pressy';

type NavPath = '/' | '/open-loops' | '/topography' | '/steady';

interface NavItem {
  label: string;
  path: NavPath;
  icon: IconName;
}

const LEFT: NavItem[] = [
  { label: 'Desk', path: '/', icon: 'candle' },
  { label: 'Loops', path: '/open-loops', icon: 'loops' },
];
const RIGHT: NavItem[] = [
  { label: 'Map', path: '/topography', icon: 'map' },
  { label: 'Steady', path: '/steady', icon: 'steady' },
];

// Tabs must not stack. A plain push adds a new copy of the screen on every
// tap, so the history grows forever and every hidden Desk keeps burning its
// candles. If the tab is already open somewhere in the history, go back
// down to it; otherwise open it. (Moving an existing screen to the top
// instead — `dangerouslySingular` — reorders the native stack, which
// desyncs it: Back stops working. Popping never reorders.)
const ROUTE_NAME: Record<NavPath, string> = {
  '/': 'index',
  '/open-loops': 'open-loops',
  '/topography': 'topography',
  '/steady': 'steady',
};

export function BottomNav() {
  const pathname = usePathname();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const openCount = useBrainNavigatorStore((s) => s.openLoops.length);

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
            badge={item.path === '/open-loops' && openCount > 0 ? openCount : undefined}
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
              router.push('/new-entry');
            }}
            accessibilityRole="button"
            accessibilityLabel="Set something down"
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
    </View>
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
      <Text style={[styles.label, { color: tint }, active && styles.labelActive]}>{item.label}</Text>
    </Pressy>
  );
}

const styles = StyleSheet.create({
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
  centerFill: {
    flex: 1,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
