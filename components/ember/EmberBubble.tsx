import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import type { EmberAction } from '../../core/ember';
import { alpha, colors, fonts } from '../../core/theme';
import { Icon, type IconName } from '../ui/Icon';
import { Pressy } from '../ui/Pressy';

// Ember's speech bubble. The words type themselves out while Ember's mouth
// moves; tap the words to skip ahead.

interface BubbleProps {
  line: string;
  title?: string;
  actions?: EmberAction[];
  footer?: { label: string; icon: IconName; onPress: () => void }[];
  onAction?: (a: EmberAction) => void;
  /** Where the bubble hangs from, relative to Ember. */
  placement: { side: 'left' | 'right'; above: boolean; tailX: number };
  width: number;
  onTalk?: (talking: boolean) => void;
  compact?: boolean;
}

export function EmberBubble({ line, title, actions, footer, onAction, placement, width, onTalk, compact }: BubbleProps) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? line.length : 0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const talkRef = useRef(onTalk);
  talkRef.current = onTalk;

  useEffect(() => {
    if (reduced) {
      setShown(line.length);
      return;
    }
    setShown(0);
    talkRef.current?.(true);
    let n = 0;
    timer.current = setInterval(() => {
      n += 2;
      if (n >= line.length) {
        n = line.length;
        if (timer.current) clearInterval(timer.current);
        talkRef.current?.(false);
      }
      setShown(n);
    }, 22);
    return () => {
      if (timer.current) clearInterval(timer.current);
      talkRef.current?.(false);
    };
  }, [line, reduced]);

  const skip = () => {
    if (timer.current) clearInterval(timer.current);
    talkRef.current?.(false);
    setShown(line.length);
  };

  const pop = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    pop.value = reduced ? withTiming(1, { duration: 150 }) : withSpring(1, { mass: 1, damping: 15, stiffness: 220 });
  }, [pop, reduced]);
  const popStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, pop.value * 1.6),
    transform: [
      { translateY: (1 - pop.value) * (placement.above ? 14 : -14) },
      { scale: 0.86 + 0.14 * pop.value },
    ],
  }));

  const typed = line.slice(0, shown);
  const done = shown >= line.length;

  return (
    <Animated.View
      style={[
        styles.bubble,
        { width, transformOrigin: `${placement.side === 'right' ? '90%' : '10%'} ${placement.above ? '100%' : '0%'}` },
        popStyle,
      ]}
    >
      <View
        style={[
          styles.tail,
          placement.above ? styles.tailBelow : styles.tailAbove,
          { left: Math.max(18, Math.min(width - 32, placement.tailX)) },
        ]}
      />
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Pressable onPress={skip} accessibilityRole="text" accessibilityLabel={line}>
        {/* The full line is laid out invisibly underneath so the bubble
            doesn't grow line by line while it types. */}
        <Text style={[styles.line, compact && styles.lineCompact, styles.ghost]}>{line}</Text>
        <Text style={[styles.line, compact && styles.lineCompact, styles.typed]}>{typed}</Text>
      </Pressable>

      {actions && actions.length > 0 ? (
        <Animated.View style={[styles.actions, { opacity: done ? 1 : 0.35 }]}>
          {actions.map((a) => (
            <Pressy key={a.href + a.label} style={styles.action} depth={0.93} onPress={() => onAction?.(a)}>
              {a.icon ? <Icon name={a.icon} size={16} color={colors.flameInk} strokeWidth={2.1} /> : null}
              <Text style={styles.actionText}>{a.label}</Text>
            </Pressy>
          ))}
        </Animated.View>
      ) : null}

      {footer && footer.length > 0 ? (
        <View style={styles.footer}>
          {footer.map((f) => (
            <Pressy key={f.label} onPress={f.onPress} style={styles.footBtn} depth={0.92} hitSlop={6}>
              <Icon name={f.icon} size={15} color={colors.textMuted} strokeWidth={2} />
              <Text style={styles.footText}>{f.label}</Text>
            </Pressy>
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderRadius: 24,
    backgroundColor: '#2A2130',
    borderWidth: 1,
    borderColor: alpha('#F5B45C', 0.28),
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  tail: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: '#2A2130',
    borderColor: alpha('#F5B45C', 0.28),
    transform: [{ rotate: '45deg' }],
  },
  tailBelow: {
    bottom: -8.5,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  tailAbove: {
    top: -8.5,
    borderLeftWidth: 1,
    borderTopWidth: 1,
  },
  title: {
    marginBottom: 6,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.flame,
  },
  line: {
    fontFamily: fonts.displaySoft,
    fontSize: 18,
    lineHeight: 25,
    color: colors.text,
  },
  lineCompact: {
    fontSize: 16,
    lineHeight: 22,
  },
  ghost: {
    opacity: 0,
  },
  typed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    backgroundColor: colors.flame,
  },
  actionText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.flameInk,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  footBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  footText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
  },
});
