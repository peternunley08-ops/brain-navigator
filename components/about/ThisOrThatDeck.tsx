import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { FadeIn, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { THIS_OR_THAT, type ThisOrThat } from '../../core/about';
import * as Haptics from '../../core/haptics';
import { useLifeStore } from '../../core/lifeStore';
import { springs, timings } from '../../core/motion';
import { alpha, colors, fonts, radii } from '../../core/theme';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Pressy } from '../ui/Pressy';

const A = '#8FB4E8';
const B = '#F0A35A';

// "This or that": swipe a card left for the left answer, right for the
// right one, or tap either side. It tilts as you drag and flies off; the
// next card is waiting underneath. Every answer lands in About you, where
// it can be changed.
// With `replay`, every card comes back once, answered or not.
export function ThisOrThatDeck({
  cards = THIS_OR_THAT,
  replay,
  onDone,
  doneText = 'That’s every card. Change any answer below.',
}: {
  cards?: ThisOrThat[];
  replay?: boolean;
  onDone?: () => void;
  doneText?: string;
}) {
  const picks = useLifeStore((s) => s.about.picks);
  const [passed, setPassed] = useState<string[]>([]);
  const queue = replay ? cards : cards.filter((c) => !picks[c.id]);
  const left = queue.filter((c) => !passed.includes(c.id));
  const card = left[0];
  const next = left[1];

  if (!card) {
    return (
      <Animated.View entering={FadeIn.duration(260)} style={styles.done}>
        <Icon name="sparkle" size={20} color={colors.flame} />
        <Text style={styles.doneText} maxFontSizeMultiplier={DECK_TEXT}>{doneText}</Text>
        {onDone ? <Button label="Done" size="sm" variant="secondary" onPress={onDone} /> : null}
      </Animated.View>
    );
  }

  const answer = (side: 'a' | 'b' | 'skip') => {
    setPassed((p) => [...p, card.id]);
    if (side !== 'skip') useLifeStore.getState().setAbout({ picks: { ...useLifeStore.getState().about.picks, [card.id]: side } });
  };

  return (
    <View>
      <View style={styles.stack}>
        {next ? <Face key={`under-${next.id}`} card={next} under /> : null}
        <SwipeCard key={card.id} card={card} onAnswer={answer} />
      </View>
      <Text style={styles.count} maxFontSizeMultiplier={DECK_TEXT}>
        {cards.length - left.length + 1} of {cards.length}
      </Text>
    </View>
  );
}

function SwipeCard({ card, onAnswer }: { card: ThisOrThat; onAnswer: (side: 'a' | 'b' | 'skip') => void }) {
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const armed = useSharedValue(0);
  const gone = useSharedValue(0);
  const edge = Math.min(120, width * 0.28);
  const tick = () => Haptics.selectionAsync().catch(() => {});
  const land = (side: 'a' | 'b') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onAnswer(side);
  };

  const fly = (side: 'a' | 'b') => {
    'worklet';
    gone.value = 1;
    tx.value = withTiming((side === 'a' ? -1 : 1) * width * 1.2, timings.base, (ok) => {
      if (ok) scheduleOnRN(land, side);
    });
  };

  const pan = usePanGesture({
    activeOffsetX: [-10, 10],
    onUpdate: (e) => {
      'worklet';
      if (gone.value) return;
      tx.value = e.translationX;
      ty.value = e.translationY * 0.2;
      const over = e.translationX > edge ? 1 : e.translationX < -edge ? -1 : 0;
      if (over !== armed.value) {
        armed.value = over;
        if (over) scheduleOnRN(tick);
      }
    },
    onFinalize: () => {
      'worklet';
      if (gone.value) return;
      if (tx.value > edge) fly('b');
      else if (tx.value < -edge) fly('a');
      else {
        tx.value = withSpring(0, springs.gentle);
        ty.value = withSpring(0, springs.gentle);
      }
      armed.value = 0;
    },
  });

  const style = useAnimatedStyle(() => ({
    opacity: reduced ? 1 - gone.value * 0.9 : 1,
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { rotate: `${interpolate(tx.value, [-width, width], [-14, 14])}deg` }],
  }));
  const leanA = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [-edge, -20, 0], [1, 0.25, 0], 'clamp') }));
  const leanB = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [0, 20, edge], [0, 0.25, 1], 'clamp') }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, style]}>
        <Animated.View pointerEvents="none" style={[styles.glow, { backgroundColor: alpha(A, 0.18), borderColor: A }, leanA]} />
        <Animated.View pointerEvents="none" style={[styles.glow, { backgroundColor: alpha(B, 0.18), borderColor: B }, leanB]} />
        <Text style={styles.ask} maxFontSizeMultiplier={DECK_TEXT}>This or that?</Text>
        <View style={styles.sides}>
          <Pressy
            style={[styles.side, { borderColor: alpha(A, 0.45), backgroundColor: alpha(A, 0.1) }]}
            onPress={() => fly('a')}
            accessibilityRole="button"
            accessibilityLabel={card.a.label}
          >
            <Icon name={card.a.icon} size={30} color={A} />
            <Text style={styles.sideText} maxFontSizeMultiplier={DECK_TEXT}>{card.a.label}</Text>
          </Pressy>
          <Text style={styles.or} maxFontSizeMultiplier={DECK_TEXT}>or</Text>
          <Pressy
            style={[styles.side, { borderColor: alpha(B, 0.45), backgroundColor: alpha(B, 0.1) }]}
            onPress={() => fly('b')}
            accessibilityRole="button"
            accessibilityLabel={card.b.label}
          >
            <Icon name={card.b.icon} size={30} color={B} />
            <Text style={styles.sideText} maxFontSizeMultiplier={DECK_TEXT}>{card.b.label}</Text>
          </Pressy>
        </View>
        <Pressy onPress={() => onAnswer('skip')} style={styles.skip} haptic="none" accessibilityRole="button">
          <Text style={styles.skipText} maxFontSizeMultiplier={DECK_TEXT}>Both, or neither</Text>
        </Pressy>
      </Animated.View>
    </GestureDetector>
  );
}

// The next card, waiting under the top one.
function Face({ card, under }: { card: ThisOrThat; under?: boolean }) {
  return (
    <View style={[styles.card, under && styles.under]} pointerEvents="none">
      <Text style={styles.ask} maxFontSizeMultiplier={DECK_TEXT}>This or that?</Text>
      <View style={styles.sides}>
        <View style={[styles.side, { borderColor: alpha(A, 0.3) }]}>
          <Icon name={card.a.icon} size={30} color={alpha(A, 0.6)} />
          <Text style={[styles.sideText, styles.dim]} maxFontSizeMultiplier={DECK_TEXT}>{card.a.label}</Text>
        </View>
        <Text style={styles.or} maxFontSizeMultiplier={DECK_TEXT}>or</Text>
        <View style={[styles.side, { borderColor: alpha(B, 0.3) }]}>
          <Icon name={card.b.icon} size={30} color={alpha(B, 0.6)} />
          <Text style={[styles.sideText, styles.dim]} maxFontSizeMultiplier={DECK_TEXT}>{card.b.label}</Text>
        </View>
      </View>
    </View>
  );
}

// The cards are fixed-size (they stack and swipe), so their text grows only
// a little with the phone's text size, or the two sides would overlap.
const DECK_TEXT = 1.3;

const styles = StyleSheet.create({
  stack: {
    height: 250,
  },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 236,
    padding: 18,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  under: {
    top: 10,
    transform: [{ scale: 0.95 }],
    opacity: 0.55,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radii.lg,
    borderWidth: 2,
  },
  ask: {
    fontFamily: fonts.displaySoft,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  sides: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  side: {
    flex: 1,
    height: 128,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  sideText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    lineHeight: 19,
    color: colors.text,
    textAlign: 'center',
  },
  dim: {
    color: colors.textFaint,
  },
  or: {
    fontFamily: fonts.displaySoft,
    fontSize: 15,
    color: colors.textFaint,
  },
  skip: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textFaint,
  },
  count: {
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  done: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  doneText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
