import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { alpha, colors, fonts, radii } from '../../core/theme';
import { Icon } from './Icon';
import { Pressy } from './Pressy';

interface ScienceNoteProps {
  fact: string;
}

// A small "why?" that opens a short, true reason behind a measure.
export function ScienceNote({ fact }: ScienceNoteProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Pressy onPress={() => setOpen((o) => !o)} hitSlop={8} style={styles.toggleRow} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <Icon name="flask" size={14} color={colors.flame} strokeWidth={2} />
        <Text style={styles.toggle}>{open ? 'Hide the science' : 'Why this matters'}</Text>
      </Pressy>
      {open ? (
        <Animated.View entering={FadeInDown.duration(240)} exiting={FadeOut.duration(140)}>
          <Text style={styles.fact}>{fact}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
    marginBottom: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },
  toggle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.flame,
  },
  fact: {
    marginTop: 8,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: alpha(colors.flame, 0.08),
    borderWidth: 1,
    borderColor: alpha(colors.flame, 0.18),
    fontFamily: fonts.displaySoft,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
});
