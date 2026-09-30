import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts } from '../../core/theme';
import { Pressy } from './Pressy';

interface SectionProps {
  title: string;
  /** A short muted line under the heading. */
  note?: string;
  action?: { label: string; onPress: () => void };
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

// A serif heading in sentence case, then its content. Never an uppercase
// eyebrow (see "Design system" in CLAUDE.md).
export function Section({ title, note, action, children, style }: SectionProps) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.title}>{title}</Text>
          {note ? <Text style={styles.note}>{note}</Text> : null}
        </View>
        {action ? (
          <Pressy onPress={action.onPress} hitSlop={10} accessibilityRole="button">
            <Text style={styles.action}>{action.label}</Text>
          </Pressy>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    marginTop: 28,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 12,
  },
  headText: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  note: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textFaint,
  },
  action: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.flame,
  },
});
