import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { randomQuote } from '../core/quotes';
import { colors, fonts, spacing } from '../core/theme';
import { HoldToConfirm } from './ui/HoldToConfirm';

interface EntryThresholdProps {
  onEnter: () => void;
}

export function EntryThreshold({ onEnter }: EntryThresholdProps) {
  const quote = useMemo(() => randomQuote(), []);

  return (
    <View style={styles.root}>
      <View style={styles.quoteBlock}>
        <Text style={styles.quoteText}>&ldquo;{quote.text}&rdquo;</Text>
        <Text style={styles.author}>— {quote.author}</Text>
      </View>

      <HoldToConfirm label="Hold to Enter" holdingLabel="Hold…" onComplete={onEnter} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundDeep,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  quoteBlock: {
    maxWidth: 380,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  quoteText: {
    fontFamily: fonts.displaySoft,
    fontSize: 22,
    lineHeight: 30,
    color: colors.ink,
    textAlign: 'center',
  },
  author: {
    marginTop: spacing.md,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.inkFaint,
    textTransform: 'uppercase',
  },
});
