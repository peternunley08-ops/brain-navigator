import * as Haptics from '../core/haptics';
import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { alpha, colors, fonts, radii, textGrow } from '../core/theme';
import { useUndoStore } from '../core/undoStore';
import { Icon } from './ui/Icon';
import { Pressy } from './ui/Pressy';

// "Deleted. Undo" — sits just above the nav for five seconds.
export function UndoBar() {
  const item = useUndoStore((s) => s.item);
  const clear = useUndoStore((s) => s.clear);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!item) return;
    const id = item.id;
    let t: ReturnType<typeof setTimeout> | undefined;
    let gone = false;
    // Long enough to notice and reach for it. With VoiceOver on, say what
    // happened and leave more time to swipe over to the button.
    AccessibilityInfo.isScreenReaderEnabled()
      .catch(() => false)
      .then((reader) => {
        if (gone) return;
        if (reader) AccessibilityInfo.announceForAccessibility(`${item.label}. Undo available.`);
        t = setTimeout(() => clear(id), reader ? 20000 : 6500);
      });
    return () => {
      gone = true;
      if (t) clearTimeout(t);
    };
  }, [item, clear]);

  if (!item) return null;
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: insets.bottom + 96 }]}>
      <Animated.View key={item.id} entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(180)} style={styles.bar}>
        <Icon name={item.icon} size={16} color={colors.textMuted} />
        <Text style={styles.label} numberOfLines={1} maxFontSizeMultiplier={2}>
          {item.label}
        </Text>
        <Pressy
          onPress={() => {
            item.undo();
            clear(item.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Undo"
          style={styles.btn}
        >
          <Text style={styles.btnText} maxFontSizeMultiplier={textGrow.control}>Undo</Text>
        </Pressy>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 480,
    width: '100%',
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  label: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: alpha(colors.flame, 0.16),
  },
  btnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.flame,
  },
});
