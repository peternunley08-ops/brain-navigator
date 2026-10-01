import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { EmberSprite } from '../components/ember/EmberSprite';
import { Sparks } from '../components/ember/Sparks';
import { useEmberRig } from '../components/ember/useEmberRig';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { Pressy } from '../components/ui/Pressy';
import { Screen } from '../components/ui/Screen';
import { CLOSING_LINES, FOLLOW_UP_PROMPTS, OPENING_PROMPTS, randomFrom } from '../core/companionPrompts';
import { askEmber, EMBER_ACTIONS, type EmberActionKey, type EmberTurn, whyOffline } from '../core/emberAI';
import { alpha, colors, fonts, radii } from '../core/theme';
import { useVentStore } from '../core/ventStore';

interface Line {
  from: 'ember' | 'you';
  text: string;
  action?: EmberActionKey | null;
  /** A note about Ember itself, not part of the conversation. */
  aside?: boolean;
}

// Most conversations are a few turns; this keeps one from running on (and
// costing) forever.
const MAX_TURNS = 20;

// Talking it through with Ember. Ember opens with a question from a fixed,
// caring pool; after that, when its AI brain is reachable (Claude, through
// the `ember` Edge Function — see core/emberAI.ts), Ember actually answers
// what you said and can offer one next step. If the AI can't answer, Ember
// says so plainly and falls back to the original two-question flow.
export default function CompanionScreen() {
  const opening = useRef(randomFrom(OPENING_PROMPTS)).current;
  const followUp = useRef(randomFrom(FOLLOW_UP_PROMPTS)).current;
  const closingLine = useRef(randomFrom(CLOSING_LINES)).current;

  const rig = useEmberRig();
  const reduced = useReducedMotion();
  const scroll = useRef<ScrollView>(null);

  const [lines, setLines] = useState<Line[]>([]);
  // The conversation as of right now — state lags a render behind, and
  // finishing straight after an answer must include that answer.
  const linesRef = useRef<Line[]>([]);
  const push = (add: Line) => {
    linesRef.current = [...linesRef.current, add];
    setLines(linesRef.current);
  };
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState<'ai' | 'scripted'>('ai');
  const [thinking, setThinking] = useState(false);
  const [finished, setFinished] = useState(false);
  const [burst, setBurst] = useState(0);
  const [limited, setLimited] = useState(false);

  const isSaving = useVentStore((s) => s.isSaving);
  const error = useVentStore((s) => s.error);
  const saveEntry = useVentStore((s) => s.saveEntry);

  const yourTurns = lines.filter((l) => l.from === 'you').length;

  // Ember "says" a line: it appears in the conversation and Ember's mouth
  // moves for about as long as it would take to say it.
  const say = (text: string, extra?: Partial<Line>) => {
    push({ from: 'ember', text, ...extra });
    if (reduced) return;
    rig.talk(true);
    setTimeout(() => rig.talk(false), Math.min(2800, 500 + text.length * 36));
  };

  useEffect(() => {
    rig.setMood('happy');
    rig.hopUp(10);
    const t = setTimeout(() => {
      rig.setMood('idle');
      say(opening);
    }, 500);
    return () => clearTimeout(t);
    // Runs once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [lines.length, thinking, finished]);

  // The scripted flow Ember falls back to without its AI: one follow-up
  // question, then it wraps up.
  const scriptedNext = (answers: number) => {
    if (answers <= 1) {
      setTimeout(() => say(followUp), 500);
    } else {
      finish();
    }
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || thinking) return;
    push({ from: 'you', text });
    const next = linesRef.current;
    setDraft('');
    const answers = next.filter((l) => l.from === 'you').length;

    if (mode === 'scripted') {
      rig.setMood('concerned');
      setTimeout(() => rig.setMood('idle'), 700);
      scriptedNext(answers);
      return;
    }

    setThinking(true);
    rig.setMood('curious');
    const turns: EmberTurn[] = next
      .filter((l) => !l.aside)
      .map((l) => ({ role: l.from === 'ember' ? 'assistant' : 'user', content: l.text }));
    // The API wants the person to speak first; Ember's opening question
    // rides along as context instead.
    const firstUser = turns.findIndex((t) => t.role === 'user');
    const history = turns.slice(firstUser);
    history[0] = { role: 'user', content: `(You opened by asking: "${opening}")\n\n${history[0].content}` };

    const res = await askEmber(history, 'Talk it through with Ember');
    setThinking(false);

    if (res.ok) {
      rig.setMood(res.action ? 'happy' : 'idle');
      say(res.reply, { action: res.action });
      if (answers >= MAX_TURNS) setTimeout(() => finish(), 1500);
      return;
    }

    // No AI right now — say why, once, and carry on with the built-in flow.
    if (res.reason === 'limit') setLimited(true);
    setMode('scripted');
    rig.setMood('concerned');
    say(whyOffline(res.reason), { aside: true });
    setTimeout(() => rig.setMood('idle'), 900);
    scriptedNext(answers);
  };

  // Save the conversation, then close it warmly. Only once the save works —
  // a failed save must not say "thank you for telling me".
  const finish = async () => {
    const said = linesRef.current.filter((l) => !l.aside);
    if (!said.some((l) => l.from === 'you')) {
      router.back();
      return;
    }
    const content = said.map((l) => `${l.from === 'ember' ? 'Ember' : 'You'}: ${l.text}`).join('\n\n');
    const saved = await saveEntry(content, 'companion');
    if (!saved) return;
    setFinished(true);
    rig.setMood('cheer');
    rig.hopUp(18);
    setBurst((b) => b + 1);
    setTimeout(() => {
      say(closingLine);
      rig.setMood('happy');
    }, 600);
  };

  return (
    <Screen nav={false} tone="ember" motes scroll={false} contentStyle={styles.frame}>
      <View style={styles.stage}>
        <Sparks burst={burst} reach={80} />
        <EmberSprite rig={rig} size={104} seed={2.2} />
        <Text style={styles.name}>Ember</Text>
        <Text style={styles.tagline}>{mode === 'ai' ? 'Here to listen. Say as much or as little as you like.' : 'stopped by to ask how you’re doing.'}</Text>
      </View>

      <ScrollView
        ref={scroll}
        style={styles.chat}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        {lines.map((l, i) => (
          <Animated.View key={i} entering={(l.from === 'ember' ? FadeInUp : FadeInDown).duration(360)}>
            <View
              style={[
                styles.bubble,
                l.from === 'ember' ? styles.fromEmber : styles.fromYou,
                l.aside && styles.aside,
              ]}
            >
              <Text style={l.from === 'ember' ? (l.aside ? styles.asideText : styles.emberText) : styles.youText}>{l.text}</Text>
            </View>
            {l.action && !finished ? (
              <Pressy
                style={styles.suggest}
                depth={0.94}
                onPress={() => router.push(EMBER_ACTIONS[l.action!].href as never)}
                accessibilityRole="button"
              >
                <Icon name={EMBER_ACTIONS[l.action].icon} size={15} color={colors.flameInk} strokeWidth={2.1} />
                <Text style={styles.suggestText}>{EMBER_ACTIONS[l.action].label}</Text>
              </Pressy>
            ) : null}
          </Animated.View>
        ))}

        {thinking ? <Thinking /> : null}

        {!finished && lines.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(300).duration(360)} style={styles.reply}>
            <Field
              multiline
              placeholder={yourTurns === 0 ? 'Take your time.' : 'Say more, or tap Done when you’re ready.'}
              value={draft}
              onChangeText={setDraft}
              onFocus={() => rig.setMood('listening')}
              onBlur={() => rig.setMood('idle')}
              style={styles.input}
            />
            <View style={styles.row}>
              <Button
                label="Tell Ember"
                icon="chat"
                onPress={send}
                disabled={thinking || isSaving || !draft.trim()}
                style={styles.flex}
              />
              {yourTurns > 0 ? (
                <Button label={mode === 'scripted' && yourTurns === 1 ? 'Leave it here' : 'Done'} variant="secondary" loading={isSaving} onPress={finish} disabled={thinking || isSaving} />
              ) : null}
            </View>
            {mode === 'ai' ? (
              <Text style={styles.privacy}>Ember’s replies are written by Claude. What you type here is sent to Anthropic to answer.</Text>
            ) : null}
            {limited ? <Button label="See Plus for more AI" icon="sparkle" variant="ghost" size="sm" onPress={() => router.push('/plus')} style={styles.plus} /> : null}
            {error ? <Text style={styles.errorText}>Couldn’t save that. Check your connection and try again.</Text> : null}
          </Animated.View>
        ) : null}

        {finished ? (
          <Animated.View entering={FadeInDown.delay(900).duration(360)} style={styles.reply}>
            <Button label="Done" icon="check" variant="secondary" onPress={() => router.back()} />
          </Animated.View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

// Three embers pulsing while Ember thinks.
function Thinking() {
  return (
    <Animated.View entering={FadeInUp.duration(240)} exiting={FadeOut.duration(160)} style={[styles.bubble, styles.fromEmber, styles.thinking]}>
      {[0, 1, 2].map((i) => (
        <Dot key={i} i={i} />
      ))}
    </Animated.View>
  );
}

function Dot({ i }: { i: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(
      i * 160,
      withRepeat(withSequence(withTiming(1, { duration: 380, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 380 })), -1)
    );
  }, [p, i]);
  const style = useAnimatedStyle(() => ({ opacity: 0.35 + 0.65 * p.value, transform: [{ translateY: -3 * p.value }] }));
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  plus: {
    alignSelf: 'center',
    marginTop: 4,
  },
  frame: {
    paddingBottom: 12,
  },
  stage: {
    alignItems: 'center',
    marginTop: 0,
  },
  name: {
    marginTop: 4,
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.text,
  },
  tagline: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  chat: {
    flex: 1,
    marginTop: 14,
  },
  chatContent: {
    paddingBottom: 24,
    gap: 10,
  },
  bubble: {
    maxWidth: '86%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  fromEmber: {
    alignSelf: 'flex-start',
    borderTopLeftRadius: 6,
    backgroundColor: alpha(colors.flame, 0.1),
    borderWidth: 1,
    borderColor: alpha(colors.flame, 0.28),
  },
  fromYou: {
    alignSelf: 'flex-end',
    borderTopRightRadius: 6,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.line,
  },
  aside: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderColor: colors.lineStrong,
  },
  emberText: {
    fontFamily: fonts.displaySoft,
    fontSize: 19,
    lineHeight: 26,
    color: colors.text,
  },
  asideText: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  youText: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  suggest: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 8,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.flame,
  },
  suggestText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.flameInk,
  },
  thinking: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.flame,
  },
  reply: {
    marginTop: 8,
    gap: 12,
  },
  input: {
    minHeight: 90,
    borderRadius: radii.lg,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flex: {
    flex: 1,
  },
  privacy: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textFaint,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },
});
