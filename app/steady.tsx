import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition, useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { emberSay } from '../components/ember/EmberBuddy';
import { EmberGlyph } from '../components/ember/EmberSprite';
import { Button } from '../components/ui/Button';
import { Candle } from '../components/ui/Candle';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { useFlameClock } from '../core/hooks/useFlameClock';
import { alpha, colors, fonts, radii } from '../core/theme';

const ART = 72;
const BLUE = '#8FB4E8';

// 5-4-3-2-1: a grounding exercise that pulls attention out of a spiral and
// back into the room, one sense at a time.
const GROUNDING = [
  { n: 5, sense: 'see', prompt: 'Name five things you can see. Small ones count — a light switch, a shadow.' },
  { n: 4, sense: 'touch', prompt: 'Four things you can feel. The chair under you, your sleeve, the air.' },
  { n: 3, sense: 'hear', prompt: 'Three things you can hear. Near, far, and the quiet between.' },
  { n: 2, sense: 'smell', prompt: 'Two things you can smell. If nothing, two smells you like.' },
  { n: 1, sense: 'taste', prompt: 'One thing you can taste. Then one slow breath out.' },
];

export default function SteadyScreen() {
  const time = useFlameClock();
  const reducedMotion = useReducedMotion();

  return (
    <Screen back={false} tone="dusk" glowColor={BLUE} motes kicker="Take a breath." title="Steady" subtitle="For when it’s a lot, right now.">
      <View style={styles.list}>
        <Reveal index={0}>
          <Door
            title="Breathe"
            body="A guided breath you can feel. Box, 4-7-8, or even. Two minutes helps."
            tint={BLUE}
            onPress={() => router.push('/breathe')}
            art={
              <Candle width={ART / 1.42} time={time} intensity={0.55} remaining={0.8} seed={4.2} state="lit" reducedMotion={reducedMotion} igniteDelay={180} />
            }
          />
        </Reveal>
        <Reveal index={1}>
          <Door
            title="Let it out"
            body="Say it or type it, and let it go. Nothing here is graded."
            tint={colors.unlocked}
            onPress={() => router.push('/vent')}
            art={<VoiceArt />}
          />
        </Reveal>
        <Reveal index={2}>
          <Door
            title="Talk it through with Ember"
            body="A few gentle questions, for when you don’t know where to start."
            tint={colors.flame}
            onPress={() => router.push('/companion')}
            art={<EmberGlyph size={46} />}
          />
        </Reveal>
        <Reveal index={3}>
          <Grounding />
        </Reveal>
      </View>
    </Screen>
  );
}

function Door({
  title,
  body,
  art,
  tint,
  onPress,
}: {
  title: string;
  body: string;
  art: ReactNode;
  tint: string;
  onPress: () => void;
}) {
  return (
    <Card tint={tint} onPress={onPress} accessibilityLabel={title} accessibilityHint={body} style={styles.door}>
      <View style={[styles.art, { backgroundColor: alpha(tint, 0.1), borderColor: alpha(tint, 0.25) }]}>{art}</View>
      <View style={styles.doorText}>
        <Text style={styles.doorTitle}>{title}</Text>
        <Text style={styles.doorBody}>{body}</Text>
      </View>
      <Icon name="chevron" size={18} color={alpha(tint, 0.8)} />
    </Card>
  );
}

function VoiceArt() {
  const bars = [10, 22, 34, 22, 14, 28, 18];
  return (
    <Svg width={ART - 8} height={ART - 8} viewBox="0 0 64 64">
      <Circle cx={32} cy={32} r={27} stroke={alpha(colors.unlocked, 0.3)} strokeWidth={2} fill="none" />
      {bars.map((h, i) => (
        <Path
          key={i}
          d={`M${14 + i * 6},${32 - h / 2} L${14 + i * 6},${32 + h / 2}`}
          stroke={colors.unlocked}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.55 + (h / 34) * 0.45}
        />
      ))}
    </Svg>
  );
}

function Grounding() {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(-1);
  const [count, setCount] = useState(0);
  const cur = GROUNDING[step];

  const start = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setStep(0);
    setCount(0);
  };

  // Each tap is one thing noticed; when the number's reached, move on.
  const tick = () => {
    if (!cur) return;
    const next = count + 1;
    if (next < cur.n) {
      Haptics.selectionAsync().catch(() => {});
      setCount(next);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (step + 1 < GROUNDING.length) {
      setStep(step + 1);
      setCount(0);
    } else {
      setStep(GROUNDING.length);
      emberSay('You’re here. Back in the room. That was well done.', 'happy');
    }
  };

  const done = step >= GROUNDING.length;

  return (
    <Animated.View layout={LinearTransition.springify().damping(18)}>
      <Card tint={colors.secured} style={styles.groundCard}>
        {step < 0 ? (
          <Pressy onPress={start} style={styles.groundIntro} accessibilityRole="button" accessibilityLabel="Start grounding, five four three two one">
            <View style={[styles.art, { backgroundColor: alpha(colors.secured, 0.1), borderColor: alpha(colors.secured, 0.25) }]}>
              <Text style={styles.groundBig}>5</Text>
            </View>
            <View style={styles.doorText}>
              <Text style={styles.doorTitle}>Ground yourself</Text>
              <Text style={styles.doorBody}>5, 4, 3, 2, 1 — back into the room one sense at a time. Right here, no new screen.</Text>
            </View>
            <Icon name="play" size={18} color={colors.secured} />
          </Pressy>
        ) : done ? (
          <Animated.View entering={FadeIn.duration(300)} style={styles.groundDone}>
            <Text style={styles.groundDoneTitle}>You’re here.</Text>
            <Text style={styles.doorBody}>Notice your feet on the floor. Nothing else has to happen right now.</Text>
            <View style={styles.groundActions}>
              <Button label="Again" variant="secondary" size="sm" icon="repeat" onPress={start} />
              <Button label="Breathe next" variant="secondary" size="sm" icon="wind" tint={BLUE} onPress={() => router.push('/breathe')} />
            </View>
          </Animated.View>
        ) : (
          <Animated.View key={step} entering={reduced ? FadeIn : FadeInDown.duration(320)} exiting={FadeOut.duration(120)}>
            <View style={styles.groundHead}>
              <Text style={styles.groundBig}>{cur.n}</Text>
              <Text style={styles.groundSense}>things you can {cur.sense}</Text>
            </View>
            <Text style={styles.groundPrompt}>{cur.prompt}</Text>
            <View style={styles.dots}>
              {Array.from({ length: cur.n }, (_, i) => (
                <View key={i} style={[styles.dot, i < count && styles.dotOn]} />
              ))}
            </View>
            <Pressy onPress={tick} style={styles.tapZone} depth={0.97} accessibilityRole="button" accessibilityLabel={`Noticed one. ${count} of ${cur.n}.`}>
              <Text style={styles.tapText}>{count === 0 ? 'Tap for each one you notice' : `${count} of ${cur.n} — keep going`}</Text>
            </Pressy>
          </Animated.View>
        )}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: 18,
    gap: 12,
  },
  door: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  art: {
    width: ART,
    height: ART,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  doorText: {
    flex: 1,
  },
  doorTitle: {
    fontFamily: fonts.display,
    fontSize: 19,
    lineHeight: 24,
    color: colors.text,
  },
  doorBody: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textMuted,
  },
  groundCard: {
    paddingVertical: 18,
  },
  groundIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  groundBig: {
    fontFamily: fonts.display,
    fontSize: 38,
    color: colors.secured,
  },
  groundHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  groundSense: {
    fontFamily: fonts.displaySoft,
    fontSize: 20,
    color: colors.text,
  },
  groundPrompt: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: alpha(colors.secured, 0.5),
  },
  dotOn: {
    backgroundColor: colors.secured,
    borderColor: colors.secured,
  },
  tapZone: {
    marginTop: 16,
    height: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.secured, 0.12),
    borderWidth: 1,
    borderColor: alpha(colors.secured, 0.35),
  },
  tapText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.secured,
  },
  groundDone: {
    gap: 2,
  },
  groundDoneTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.secured,
  },
  groundActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
});
