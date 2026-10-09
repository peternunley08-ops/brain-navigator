import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { springs } from '../../core/motion';
import { colors, fonts, textGrow } from '../../core/theme';
import { Icon, type IconName } from './Icon';
import { Pressy } from './Pressy';

interface SectionProps {
  title: string;
  /** A short muted line under the heading. */
  note?: string;
  action?: { label: string; onPress: () => void };
  /** A small glyph before the heading. */
  icon?: IconName;
  iconColor?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Foldable: tap the heading to tuck the content away (and back). */
  folded?: boolean;
  onToggleFold?: () => void;
}

// A serif heading in sentence case, then its content. Never an uppercase
// eyebrow (see "Design system" in CLAUDE.md).
export function Section({ title, note, action, icon, iconColor = colors.flame, children, style, folded, onToggleFold }: SectionProps) {
  // Points down while open, right while folded.
  const turn = useAnimatedStyle(() => ({ transform: [{ rotate: withSpring(folded ? '0deg' : '90deg', springs.snappy) }] }));
  const heading = (
    <View style={styles.headText}>
      <View style={styles.titleRow}>
        {icon ? <Icon name={icon} size={17} color={iconColor} /> : null}
        <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={textGrow.heading}>{title}</Text>
        {onToggleFold ? (
          <Animated.View style={turn}>
            <Icon name="chevron" size={14} color={colors.textFaint} />
          </Animated.View>
        ) : null}
      </View>
      {note ? <Text style={styles.note} maxFontSizeMultiplier={2}>{note}</Text> : null}
    </View>
  );
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.head}>
        {onToggleFold ? (
          <Pressy
            onPress={onToggleFold}
            style={styles.headText}
            depth={0.98}
            accessibilityRole="button"
            accessibilityState={{ expanded: !folded }}
            accessibilityHint={folded ? 'Shows this section' : 'Tucks this section away'}
          >
            {heading}
          </Pressy>
        ) : (
          heading
        )}
        {action ? (
          <Pressy onPress={action.onPress} hitSlop={10} accessibilityRole="button">
            <Text style={styles.action} maxFontSizeMultiplier={textGrow.control}>{action.label}</Text>
          </Pressy>
        ) : null}
      </View>
      {folded ? null : onToggleFold ? <Animated.View entering={FadeIn.duration(220)}>{children}</Animated.View> : children}
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
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 12,
  },
  // The heading keeps most of the row; at the largest text sizes the action
  // drops to its own line instead of squeezing the heading to a letter wide.
  headText: {
    flex: 1,
    minWidth: '60%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
