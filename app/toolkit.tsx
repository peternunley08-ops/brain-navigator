import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { Field } from '../components/ui/Field';
import { Icon, type IconName } from '../components/ui/Icon';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { useLifeStore } from '../core/lifeStore';
import { alpha, colors, fonts } from '../core/theme';

type Tool = 'reset' | 'test' | 'pmr' | 'kind' | 'reframe';

const TOOLS: { key: Tool; title: string; body: string; icon: IconName; color: string }[] = [
  { key: 'reset', title: 'Five-minute reset', body: 'Water, move, breathe, look far, pick one thing.', icon: 'timer', color: '#9FD08A' },
  { key: 'test', title: 'Before a test', body: 'Nerves into fuel, in two minutes.', icon: 'flag', color: '#F0845A' },
  { key: 'pmr', title: 'Tense and release', body: 'Let your body unclench, muscle by muscle.', icon: 'wind', color: '#8FB4E8' },
  { key: 'kind', title: 'Be kind to yourself', body: 'Three steps for when you’re being hard on you.', icon: 'heart', color: '#E89AB8' },
  { key: 'reframe', title: 'Check the thought', body: 'Catch a thinking trap and rewrite it.', icon: 'sparkle', color: '#AFA2DE' },
];

// Small, proven tools for hard moments — each one short enough to use in
// a bathroom stall between classes.
export default function ToolkitScreen() {
  const [open, setOpen] = useState<Tool | null>(null);
  return (
    <Screen tone="dusk" title="Toolkit" subtitle="Short tools for hard moments.">
      {TOOLS.map((t, i) => {
        const isOpen = open === t.key;
        return (
          <Reveal key={t.key} index={i}>
            <Animated.View layout={LinearTransition.springify().damping(20)}>
              <Card tint={isOpen ? t.color : undefined} style={styles.card}>
                <Pressy onPress={() => setOpen(isOpen ? null : t.key)} style={styles.head} accessibilityRole="button" accessibilityState={{ expanded: isOpen }}>
                  <View style={[styles.icon, { backgroundColor: alpha(t.color, 0.15) }]}>
                    <Icon name={t.icon} size={20} color={t.color} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.title}>{t.title}</Text>
                    <Text style={styles.body}>{t.body}</Text>
                  </View>
                  <Icon name={isOpen ? 'minus' : 'plus'} size={16} color={colors.textFaint} />
                </Pressy>
                {isOpen ? (
                  <Animated.View entering={FadeInDown.duration(240)} style={styles.inner}>
                    {t.key === 'reset' ? <Reset color={t.color} /> : null}
                    {t.key === 'test' ? <TestNerves color={t.color} /> : null}
                    {t.key === 'pmr' ? <Pmr color={t.color} /> : null}
                    {t.key === 'kind' ? <Kindness color={t.color} /> : null}
                    {t.key === 'reframe' ? <Reframe color={t.color} /> : null}
                  </Animated.View>
                ) : null}
              </Card>
            </Animated.View>
          </Reveal>
        );
      })}
      <Reveal index={TOOLS.length}>
        <View style={styles.more}>
          <Button label="Worry box" icon="feather" variant="secondary" onPress={() => router.push('/worry')} style={styles.flex} />
          <Button label="Your people" icon="people" variant="secondary" onPress={() => router.push('/people')} style={styles.flex} />
        </View>
      </Reveal>
    </Screen>
  );
}

const PREP = ['Water and a snack', 'Two pencils or a charged device', 'Read every question before starting', 'Do the ones you know first', 'Circle back to the hard ones'];

function TestNerves({ color }: { color: string }) {
  const [done, setDone] = useState<number[]>([]);
  return (
    <>
      <Text style={styles.step}>1. Don’t try to calm down. Say, out loud or in your head:</Text>
      <View style={[styles.quote, { borderColor: alpha(color, 0.5) }]}>
        <Text style={styles.quoteText}>“I’m excited.”</Text>
      </View>
      <Text style={styles.small}>
        Nerves and excitement feel the same in the body — racing heart, alert. Calling it excitement works better than trying to force calm (Brooks, 2014).
      </Text>
      <Text style={styles.step}>2. One slow breath: in for 4, hold 7, out for 8.</Text>
      <Button label="Breathe with me" icon="wind" variant="secondary" size="sm" onPress={() => router.push('/breathe')} style={styles.inline} />
      <Text style={styles.step}>3. The plan:</Text>
      {PREP.map((p, i) => {
        const on = done.includes(i);
        return (
          <Pressy key={p} onPress={() => setDone((d) => (on ? d.filter((x) => x !== i) : [...d, i]))} style={styles.check} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
            <Icon name={on ? 'check' : 'plus'} size={15} color={on ? colors.secured : colors.textFaint} />
            <Text style={[styles.checkText, on && styles.checkDone]}>{p}</Text>
          </Pressy>
        );
      })}
      <Text style={styles.small}>A blank-out mid-test is normal. Put the pencil down, breathe out slowly, move to a question you know.</Text>
    </>
  );
}

const MUSCLES = [
  'Hands: make tight fists.',
  'Arms: pull your elbows in tight to your sides.',
  'Shoulders: shrug them up to your ears.',
  'Face: scrunch everything toward your nose.',
  'Stomach: tighten like you’re bracing.',
  'Legs: press your feet into the floor.',
  'Toes: curl them down.',
];

function Pmr({ color }: { color: string }) {
  // One state value, so each tick moves the whole thing forward exactly once.
  const [st, setSt] = useState<{ i: number; phase: 'tense' | 'release'; left: number }>({ i: -1, phase: 'tense', left: 5 });
  const { i, phase, left } = st;

  useEffect(() => {
    if (i < 0 || i >= MUSCLES.length) return;
    const t = setTimeout(() => {
      setSt((s) => {
        if (s.left > 1) return { ...s, left: s.left - 1 };
        if (s.phase === 'tense') return { ...s, phase: 'release', left: 10 };
        return { i: s.i + 1, phase: 'tense', left: 5 };
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [st, i]);

  useEffect(() => {
    if (i < 0) return;
    if (i === MUSCLES.length) emberSay('All the way down to your toes. Notice how different that feels.', 'happy');
    else Haptics.impactAsync(phase === 'tense' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
  }, [i, phase]);

  const begin = () => setSt({ i: 0, phase: 'tense', left: 5 });

  if (i < 0) {
    return (
      <>
        <Text style={styles.small}>Tense each muscle group for 5 seconds, then let go for 10. About two minutes. Good before sleep or a test.</Text>
        <Button label="Start" icon="play" variant="secondary" size="sm" tint={color} onPress={begin} style={styles.inline} />
      </>
    );
  }
  if (i >= MUSCLES.length) {
    return (
      <Animated.View entering={FadeIn}>
        <Text style={styles.step}>Done. Stay loose for a few breaths.</Text>
        <Button label="Again" icon="repeat" variant="ghost" size="sm" onPress={begin} />
      </Animated.View>
    );
  }
  return (
    <Animated.View key={`${i}-${phase}`} entering={FadeIn.duration(260)}>
      <ProgressBar value={(i + (phase === 'release' ? 0.5 : 0)) / MUSCLES.length} color={color} height={5} />
      <Text style={[styles.phase, { color: phase === 'tense' ? colors.unlocked : colors.secured }]}>{phase === 'tense' ? 'Tense' : 'Let go'}</Text>
      <Text style={styles.muscle}>{phase === 'tense' ? MUSCLES[i] : 'Release. Feel the difference.'}</Text>
      <Text style={styles.count}>{left}</Text>
    </Animated.View>
  );
}

// Five one-minute steps that reset a body that's been sitting and stressing.
const RESET = [
  { title: 'Water', line: 'Get a glass of water and drink it slowly.' },
  { title: 'Move', line: 'Stand up. Roll your shoulders, reach your arms overhead, shake out your hands.' },
  { title: 'Breathe', line: 'Slow breaths: in for four, out for six. Let the out-breath be the long one.' },
  { title: 'Look far', line: 'Find something far away, out a window or across the room. Let your eyes rest on it.' },
  { title: 'One thing', line: 'Pick the one next thing. Just one. Say it out loud.' },
];

function Reset({ color }: { color: string }) {
  const [st, setSt] = useState<{ i: number; left: number }>({ i: -1, left: 60 });
  const { i, left } = st;

  useEffect(() => {
    if (i < 0 || i >= RESET.length) return;
    const t = setTimeout(() => setSt((s) => (s.left > 1 ? { ...s, left: s.left - 1 } : { i: s.i + 1, left: 60 })), 1000);
    return () => clearTimeout(t);
  }, [st, i]);

  useEffect(() => {
    if (i < 0) return;
    if (i === RESET.length) emberSay('Five minutes, and you’re back. Now the one thing.', 'cheer');
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [i]);

  const begin = () => setSt({ i: 0, left: 60 });
  const skip = () => setSt((s) => ({ i: s.i + 1, left: 60 }));

  if (i < 0) {
    return (
      <>
        <Text style={styles.small}>Five steps, a minute each. For when you’ve been sitting too long and your head is full. Skip any step you want.</Text>
        <Button label="Start" icon="play" variant="secondary" size="sm" tint={color} onPress={begin} style={styles.inline} />
      </>
    );
  }
  if (i >= RESET.length) {
    return (
      <Animated.View entering={FadeIn}>
        <Text style={styles.step}>Reset. Go do the one thing.</Text>
        <Button label="Again" icon="repeat" variant="ghost" size="sm" onPress={begin} />
      </Animated.View>
    );
  }
  return (
    <Animated.View key={i} entering={FadeIn.duration(260)}>
      <ProgressBar value={(i + (60 - left) / 60) / RESET.length} color={color} height={5} />
      <Text style={[styles.phase, { color }]}>
        {i + 1} of {RESET.length}: {RESET[i].title}
      </Text>
      <Text style={styles.muscle}>{RESET[i].line}</Text>
      <Text style={styles.count}>{left}</Text>
      <Button label={i + 1 < RESET.length ? 'Next step' : 'Finish'} icon="arrow" variant="ghost" size="sm" onPress={skip} />
    </Animated.View>
  );
}

const KIND = [
  { say: 'This is really hard right now.', why: 'Name it. You’re not overreacting by noticing it hurts.' },
  { say: 'Other people feel this too.', why: 'Struggling doesn’t mean something’s wrong with you. It means you’re a person.' },
  { say: 'What would I say to a friend feeling this?', why: 'Say that to yourself. Same words, same tone.' },
];

function Kindness({ color }: { color: string }) {
  const [step, setStep] = useState(0);
  const cur = KIND[step];
  return (
    <>
      {cur ? (
        <Animated.View key={step} entering={FadeInDown.duration(240)}>
          <Text style={styles.stepNum}>
            {step + 1} of {KIND.length}
          </Text>
          <View style={[styles.quote, { borderColor: alpha(color, 0.5) }]}>
            <Text style={styles.quoteText}>“{cur.say}”</Text>
          </View>
          <Text style={styles.small}>{cur.why}</Text>
          <Button
            label={step === KIND.length - 1 ? 'I said it' : 'Next'}
            variant="secondary"
            size="sm"
            tint={color}
            onPress={() => {
              if (step === KIND.length - 1) emberSay('You deserve the kindness you give everyone else.', 'happy');
              setStep((s) => s + 1);
            }}
            style={styles.inline}
          />
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn}>
          <Text style={styles.step}>Put a hand on your chest for a few breaths if it helps. That’s it.</Text>
          <Button label="Start over" icon="repeat" variant="ghost" size="sm" onPress={() => setStep(0)} />
        </Animated.View>
      )}
      <Text style={styles.small}>From Kristin Neff’s self-compassion research: kindness toward yourself lowers stress more than criticism raises motivation.</Text>
    </>
  );
}

const TRAPS = [
  { key: 'Catastrophizing', ask: 'What’s the most likely outcome — not the worst one?' },
  { key: 'All-or-nothing', ask: 'Is there a middle ground between perfect and failure?' },
  { key: 'Mind reading', ask: 'Do I actually know what they’re thinking?' },
  { key: 'Fortune telling', ask: 'What’s my evidence it’ll go badly?' },
  { key: 'Should statements', ask: 'Who says I should? What would I tell a friend?' },
  { key: 'Labeling', ask: 'Did I do one thing badly, or am I bad? Those are different.' },
  { key: 'Discounting the good', ask: 'What went right that I’m skipping over?' },
];

function Reframe({ color }: { color: string }) {
  const [thought, setThought] = useState('');
  const [trap, setTrap] = useState<string | null>(null);
  const [kinder, setKinder] = useState('');
  const [kept, setKept] = useState(false);
  const addWin = useLifeStore((s) => s.addWin);
  const t = TRAPS.find((x) => x.key === trap);
  return (
    <>
      <Field value={thought} onChangeText={setThought} placeholder="The thought, word for word. e.g. “I’m going to fail this class.”" multiline />
      {thought.trim() ? (
        <Animated.View entering={FadeInDown.duration(220)}>
          <Text style={styles.step}>Which trap is it?</Text>
          <ChipRow>
            {TRAPS.map((x) => (
              <Chip key={x.key} label={x.key} selected={trap === x.key} color={color} onPress={() => setTrap(x.key)} />
            ))}
          </ChipRow>
        </Animated.View>
      ) : null}
      {t ? (
        <Animated.View entering={FadeInDown.duration(220)}>
          <View style={[styles.quote, { borderColor: alpha(color, 0.5) }]}>
            <Text style={styles.quoteText}>{t.ask}</Text>
          </View>
          <Field value={kinder} onChangeText={setKinder} placeholder="A truer, kinder version of the thought" multiline containerStyle={styles.inline} />
          {kinder.trim() && !kept ? (
            <Button
              label="Keep this one"
              icon="jar"
              variant="secondary"
              size="sm"
              tint={color}
              onPress={() => {
                addWin(`Reframed: ${kinder.trim()}`);
                setKept(true);
                emberSay('Kept in your wins. That was real work.', 'cheer');
              }}
              style={styles.inline}
            />
          ) : null}
        </Animated.View>
      ) : null}
      <Text style={styles.small}>This is the core move of CBT, one of the best-studied tools for anxiety and low mood.</Text>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    marginTop: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  body: {
    marginTop: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  inner: {
    marginTop: 14,
  },
  step: {
    marginTop: 12,
    marginBottom: 8,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },
  stepNum: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.textFaint,
  },
  quote: {
    marginVertical: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderLeftWidth: 3,
    borderRadius: 8,
    backgroundColor: colors.surfaceSunk,
  },
  quoteText: {
    fontFamily: fonts.displaySoft,
    fontSize: 20,
    lineHeight: 27,
    color: colors.text,
  },
  small: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textFaint,
  },
  inline: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
  },
  checkText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
  },
  checkDone: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
  phase: {
    marginTop: 14,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    textAlign: 'center',
  },
  muscle: {
    marginTop: 6,
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 27,
    color: colors.text,
    textAlign: 'center',
  },
  count: {
    marginTop: 8,
    fontFamily: fonts.display,
    fontSize: 44,
    color: colors.textMuted,
    textAlign: 'center',
  },
  more: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
});
