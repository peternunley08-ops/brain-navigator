import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useBrainNavigatorStore } from '../core/store';
import { colors, fonts, radii, spacing } from '../core/theme';

interface NavItem {
  label: string;
  path: '/checkin' | '/topography' | '/open-loops' | '/trove';
}

const ITEMS: NavItem[] = [
  { label: 'Today', path: '/checkin' },
  { label: 'Map', path: '/topography' },
  { label: 'Loops', path: '/open-loops' },
  { label: 'Trove', path: '/trove' },
];

export function BottomNav() {
  const pathname = usePathname();
  const history = useBrainNavigatorStore((s) => s.history);
  const openCount = history.filter((e) => e.state === 'unlocked').length;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.bar}>
        <NavSegment item={ITEMS[0]} active={pathname === ITEMS[0].path} />
        <NavSegment item={ITEMS[1]} active={pathname === ITEMS[1].path} />
        <NavSegment
          item={ITEMS[2]}
          active={pathname === ITEMS[2].path}
          badge={openCount > 0 ? openCount : undefined}
        />
        <NavSegment item={ITEMS[3]} active={pathname === ITEMS[3].path} />

        <Pressable
          style={styles.centerButton}
          onPress={() => router.push('/new-entry')}
          accessibilityLabel="New Entry"
        >
          <Text style={styles.centerButtonText}>New</Text>
        </Pressable>
      </View>
    </View>
  );
}

function NavSegment({
  item,
  active,
  badge,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
}) {
  return (
    <Pressable style={styles.segment} onPress={() => router.push(item.path)}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
        {item.label}
      </Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const BAR_HEIGHT = 60;

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
    height: BAR_HEIGHT,
    width: 340,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.leatherDark,
    borderRadius: radii.pill,
    shadowColor: colors.leatherDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  segment: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  segmentText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.hint,
  },
  segmentTextActive: {
    color: colors.background,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: colors.unlocked,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.background,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginTop: -26,
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
  centerButtonText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.background,
  },
});
