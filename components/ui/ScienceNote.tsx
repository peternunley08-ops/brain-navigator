import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '../../core/theme';

interface ScienceNoteProps {
  fact: string;
}

export function ScienceNote({ fact }: ScienceNoteProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => setOpen((o) => !o)} hitSlop={6}>
        <Text style={styles.toggle}>{open ? 'HIDE THE SCIENCE ▲' : 'WHY? ▾'}</Text>
      </Pressable>
      {open ? <Text style={styles.fact}>{fact}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.xs,
  },
  toggle: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.leather,
  },
  fact: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.lanternGlow,
    fontFamily: fonts.displaySoft,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
  },
});
