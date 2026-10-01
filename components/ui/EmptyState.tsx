import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts } from '../../core/theme';
import { EmberGlyph } from '../ember/EmberSprite';

interface EmptyStateProps {
  title: string;
  body?: string;
  /** Replaces the little Ember at the top. */
  art?: ReactNode;
  /** Ember dresses for the screen: glasses for study, a cap for college. */
  gear?: 'glasses' | 'cap';
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

// When a list has nothing in it yet: Ember, one warm line, and what to do.
export function EmptyState({ title, body, art, gear, children, style }: EmptyStateProps) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.art}>{art ?? <EmberGlyph size={44} gear={gear} />}</View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 12,
  },
  art: {
    marginBottom: 14,
  },
  title: {
    fontFamily: fonts.displaySoft,
    fontSize: 20,
    lineHeight: 27,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 300,
  },
  actions: {
    marginTop: 20,
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 8,
  },
});
