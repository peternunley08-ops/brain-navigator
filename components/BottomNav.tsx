import * as Haptics from 'expo-haptics';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { FLAME_CORE, FLAME_MID, flamePath } from '../core/flame';
import { useBrainNavigatorStore } from '../core/store';
import { colors, fonts, radii, spacing } from '../core/theme';

type NavPath = '/' | '/open-loops' | '/topography' | '/steady';

interface NavItem {
  label: string;
  path: NavPath;
}

const LEFT: NavItem[] = [
  { label: 'Desk', path: '/' },
  { label: 'Loops', path: '/open-loops' },
];
const RIGHT: NavItem[] = [
  { label: 'Map', path: '/topography' },
  { label: 'Steady', path: '/steady' },
];

// A still flame, drawn once — the nav's centre action is "set something
// down", which is how a new candle arrives on the desk.
const ICON = 30;
const ICON_FLAME = flamePath(ICON / 2, ICON * 0.66, ICON * 0.2, ICON * 0.44, 0, 0, 0, 0, 28);
const ICON_CORE = flamePath(ICON / 2, ICON * 0.7, ICON * 0.09, ICON * 0.16, 0, 0, 0, 1, 20);

function go(path: string) {
  Haptics.selectionAsync().catch(() => {});
  router.push(path as never);
}

export function BottomNav() {
  const pathname = usePathname();
  const openCount = useBrainNavigatorStore((s) => s.openLoops.length);

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.bar}>
        {LEFT.map((item) => (
          <NavSegment
            key={item.path}
            item={item}
            active={pathname === item.path}
            badge={item.path === '/open-loops' && openCount > 0 ? openCount : undefined}
          />
        ))}

        <Pressable
          style={({ pressed }) => [styles.centerButton, pressed && styles.centerPressed]}
          onPress={() => go('/new-entry')}
          accessibilityRole="button"
          accessibilityLabel="Set something down"
        >
          <Svg width={ICON} height={ICON}>
            <Defs>
              <RadialGradient id="navFlame" cx="50%" cy="66%" r="64%">
                <Stop offset="0" stopColor={FLAME_CORE} />
                <Stop offset="0.55" stopColor={FLAME_MID} />
                <Stop offset="1" stopColor={colors.leather} />
              </RadialGradient>
            </Defs>
            <Path d={ICON_FLAME} fill="url(#navFlame)" />
            <Path d={ICON_CORE} fill={FLAME_CORE} />
          </Svg>
        </Pressable>

        {RIGHT.map((item) => (
          <NavSegment key={item.path} item={item} active={pathname === item.path} />
        ))}
      </View>
    </View>
  );
}

function NavSegment({ item, active, badge }: { item: NavItem; active: boolean; badge?: number }) {
  return (
    <Pressable
      style={styles.segment}
      onPress={() => (active ? undefined : go(item.path))}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={badge ? `${item.label}, ${badge} open` : item.label}
    >
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{item.label}</Text>
      <View style={[styles.activeMark, active && styles.activeMarkOn]} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
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
    justifyContent: 'space-evenly',
    height: 62,
    width: 352,
    maxWidth: '92%',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.leatherDark,
    borderRadius: radii.pill,
    shadowColor: colors.leatherDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  segment: {
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  segmentText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.hint,
  },
  segmentTextActive: {
    fontFamily: fonts.bodyMedium,
    color: colors.background,
  },
  activeMark: {
    marginTop: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  activeMarkOn: {
    backgroundColor: '#D8B36A',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: colors.unlocked,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.background,
  },
  centerButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    marginTop: -28,
    backgroundColor: colors.leatherDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.background,
    shadowColor: colors.leatherDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centerPressed: {
    transform: [{ scale: 0.94 }],
  },
});
