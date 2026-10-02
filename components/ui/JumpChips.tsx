import { type RefObject, useCallback, useRef } from 'react';
import { type LayoutChangeEvent, ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../core/theme';
import { Chip } from './Chip';
import type { IconName } from './Icon';

export interface Jump {
  key: string;
  label: string;
  icon?: IconName;
}

// Room left above a spot when the page glides to it: the compact bar (50)
// plus a little air, so the heading lands just under the bar.
const UNDER_BAR = 60;

/**
 * Jump chips for a long page: the chips sit at the top, and each one glides
 * the page to its part. Pass `scrollRef` to the page's `Screen`, and drop a
 * marker right before each part, as a direct child of `Screen` (not inside a
 * Reveal or Section, so its position is measured from the top of the page):
 *
 *   const jumps = useJumps();
 *   <Screen scrollRef={jumps.scrollRef}>
 *     <JumpChips items={PARTS} onJump={jumps.jump} />
 *     <View onLayout={jumps.mark('you')} />
 *     <Reveal>…</Reveal>
 */
export function useJumps(scrollRef?: RefObject<ScrollView | null>) {
  const own = useRef<ScrollView | null>(null);
  const list = scrollRef ?? own;
  const spots = useRef<Record<string, number>>({});
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const mark = useCallback(
    (key: string) => (e: LayoutChangeEvent) => {
      spots.current[key] = e.nativeEvent.layout.y;
    },
    [],
  );
  const jump = useCallback(
    (key: string) => {
      const y = spots.current[key];
      if (y != null) list.current?.scrollTo({ y: Math.max(0, y - insets.top - UNDER_BAR), animated: !reduced });
    },
    [list, insets.top, reduced],
  );
  return { scrollRef: list, mark, jump };
}

// The row itself: one line of chips that runs edge to edge and scrolls
// sideways when there are more than fit.
export function JumpChips({ items, onJump, style }: { items: Jump[]; onJump: (key: string) => void; style?: StyleProp<ViewStyle> }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.row, style]} contentContainerStyle={styles.chips}>
      {items.map((j) => (
        <Chip key={j.key} label={j.label} icon={j.icon} onPress={() => onJump(j.key)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    marginHorizontal: -layout.gutter,
    flexGrow: 0,
  },
  chips: {
    gap: 8,
    paddingTop: 4,
    paddingHorizontal: layout.gutter,
  },
});
