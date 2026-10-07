import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
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
import { HelpCard } from '../components/ember/HelpCard';
import { ReplyExtras } from '../components/ember/ReplyExtras';
import { RichText } from '../components/ember/RichText';
import { Sparks } from '../components/ember/Sparks';
import { useEmberRig } from '../components/ember/useEmberRig';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { Field } from '../components/ui/Field';
import { IconButton } from '../components/ui/IconButton';
import { Icon } from '../components/ui/Icon';
import { Pressy } from '../components/ui/Pressy';
import { Screen } from '../components/ui/Screen';
import { goBack } from '../core/chrome';
import { CLOSING_LINES, FOLLOW_UP_PROMPTS, OPENING_PROMPTS, randomFrom } from '../core/companionPrompts';
import { AI_DISCLOSURE, AI_REMINDER, reminderDue } from '../core/companionRules';
import { type AIFailure, askEmber, askJob, dueFollowUp, followUpTopic, type EmberReply, type EmberTurn, soundsLikeCrisis, whyOffline } from '../core/emberAI';
import { uid, useHubStore } from '../core/hubStore';
import { useLifeStore } from '../core/lifeStore';
import { offerUndo } from '../core/undoStore';
import { useWellnessStore } from '../core/wellnessStore';
import { alpha, colors, fonts, radii } from '../core/theme';
import { entryKey, useVentStore } from '../core/ventStore';
import { useClearOnSend } from '../core/hooks/useClearOnSend';

interface Line {
  from: 'ember' | 'you';
  text: string;
  /** An AI reply, with everything it suggested. */
  ai?: EmberReply;
  /** A note about Ember itself, not part of the conversation. */
  aside?: boolean;
}

// Failures worth trying again; the rest switch to Ember's own questions.
const RETRYABLE: AIFailure[] = ['busy', 'timeout', 'offline', 'unavailable'];

// Most conversations are a few turns; this keeps one from running on (and
// costing) forever.
const MAX_TURNS = 20;

// Talking it through with Ember. Ember opens with a question from a fixed,
// caring pool; after that, when its AI brain is reachable (Claude, through
// the `ember` Edge Function — see core/emberAI.ts), Ember actually answers
// what you said and can offer one next step. If the AI can't answer, Ember
// says so plainly and falls back to the original two-question flow.
export default function CompanionScreen() {
  // If they mentioned something coming up last time and it's happened, Ember asks about it.
  const follow = useRef(dueFollowUp()).current;
  const opening = useRef(follow ? `Last time you mentioned ${followUpTopic(follow.followUp!)}. How did it go?` : randomFrom(OPENING_PROMPTS)).current;
  // The last conversation, if it was in the last three days, can be picked back up.
  const previous = useRef(useLifeStore.getState().lastEmberChat).current;
  const canResume = !!previous?.lines.length && Date.now() - new Date(previous.at).getTime() < 3 * 86400000 && !useLifeStore.getState().settings.memoryOff;
  const [memoryOffer, setMemoryOffer] = useState<'ask' | 'saving' | 'done' | null>(null);
  const followUp = useRef(randomFrom(FOLLOW_UP_PROMPTS)).current;
  const closingLine = useRef(randomFrom(CLOSING_LINES)).current;

  const rig = useEmberRig();
  const reduced = useReducedMotion();
  const scroll = useRef<ScrollView>(null);

  const [lines, setLines] = useState<Line[]>([]);
  // When Ember last said it's a computer program (the header says so on open).
  const disclosedAt = useRef(Date.now());
  // The conversation as of right now — state lags a render behind, and
  // finishing straight after an answer must include that answer.
  const linesRef = useRef<Line[]>([]);
  // The journal key of the saved chat, so a title can be added to it later.
  const savedKey = useRef<string | null>(null);
  const push = (add: Line) => {
    linesRef.current = [...linesRef.current, add];
    setLines(linesRef.current);
  };
  const [draft, setDraft] = useState('');
  const box = useClearOnSend(setDraft);

  // Talk instead of type. Speech becomes text on the phone (nothing goes to
  // Apple), and it's added to the box; it goes to Claude only when you tap
  // Tell Ember, like anything typed. Events are ignored unless this screen
  // started listening ("Let it out" uses the same recognizer).
  const [listening, setListening] = useState(false);
  const [micNote, setMicNote] = useState<string | null>(null);
  const mic = useRef<{ on: boolean; base: string }>({ on: false, base: '' });
  useSpeechRecognitionEvent('end', () => {
    if (!mic.current.on) return;
    mic.current.on = false;
    setListening(false);
  });
  useSpeechRecognitionEvent('result', (event) => {
    const heard = event.results[0]?.transcript;
    if (!mic.current.on || heard === undefined) return;
    const base = mic.current.base;
    setDraft(`${base}${base && heard ? ' ' : ''}${heard}`);
  });
  useSpeechRecognitionEvent('error', (event) => {
    if (!mic.current.on) return;
    mic.current.on = false;
    setListening(false);
    setMicNote(event.error === 'not-allowed' ? 'The microphone is off for this app. You can turn it on in Settings.' : 'Couldn’t catch that. Try again, or type it.');
  });
  const toggleMic = async () => {
    setMicNote(null);
    if (mic.current.on) return ExpoSpeechRecognitionModule.stop();
    const perm = await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();
    if (!perm.granted) return setMicNote('The microphone is off for this app. You can turn it on in Settings.');
    mic.current = { on: true, base: draft.trim() };
    setListening(true);
    ExpoSpeechRecognitionModule.start({ lang: 'en-US', interimResults: true, continuous: true, requiresOnDeviceRecognition: true });
  };
  const stopMic = () => {
    if (mic.current.on) ExpoSpeechRecognitionModule.stop();
  };
  useEffect(() => () => {
    if (mic.current.on) ExpoSpeechRecognitionModule.abort();
  }, []);
  const [mode, setMode] = useState<'ai' | 'scripted'>('ai');
  const [thinking, setThinking] = useState(false);
  const [finished, setFinished] = useState(false);
  const [burst, setBurst] = useState(0);
  const [limited, setLimited] = useState(false);
  // Words that sound like danger pin the help lines for the rest of the chat.
  const [crisis, setCrisis] = useState(false);
  const [failure, setFailure] = useState<AIFailure | null>(null);
  const [justListen, setJustListen] = useState(false);
  const [keepPrivate, setKeepPrivate] = useState(false);
  const [seeing, setSeeing] = useState<number | null>(null);
  const startedAt = useRef<number | null>(null);
  const nudged = useRef(false);
  const lowMood = (useWellnessStore.getState().todaysCheckin()?.mood ?? 5) <= 2;

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
    if (follow) useLifeStore.getState().updateMemory(follow.id, { followedUp: true });
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

  const send = async (chip?: string) => {
    const text = (chip ?? draft).trim();
    if (!text || thinking) return;
    stopMic();
    if (soundsLikeCrisis(text)) setCrisis(true);
    if (startedAt.current == null) startedAt.current = Date.now();
    // Three hours of talking since Ember last said what it is: say it again, with a break nudge.
    if (reminderDue(disclosedAt.current)) {
      disclosedAt.current = Date.now();
      say(AI_REMINDER, { aside: true });
    }
    push({ from: 'you', text });
    const next = linesRef.current;
    if (!chip) box.clear(text);
    const answers = next.filter((l) => l.from === 'you').length;

    if (mode === 'scripted') {
      rig.setMood('concerned');
      setTimeout(() => rig.setMood('idle'), 700);
      scriptedNext(answers);
      return;
    }
    await think(answers);
  };

  // Ask the AI about the conversation so far (also used by Try again).
  const think = async (answers: number) => {
    setFailure(null);
    setThinking(true);
    rig.setMood('curious');
    const turns: EmberTurn[] = linesRef.current
      .filter((l) => !l.aside)
      .map((l) => ({ role: l.from === 'ember' ? 'assistant' : 'user', content: l.text }));
    // The API wants the person to speak first; Ember's opening question
    // rides along as context instead.
    const firstUser = turns.findIndex((t) => t.role === 'user');
    const history = turns.slice(firstUser);
    history[0] = { role: 'user', content: `(You opened by asking: "${opening}")\n\n${history[0].content}` };

    const res = await askEmber(history, 'Talk it through with Ember', { justListen, private: keepPrivate });
    setThinking(false);

    if (res.ok) {
      const heavy = res.refused || res.actions.includes('help');
      if (heavy) setCrisis(true);
      // Never a happy face on a reply about getting help.
      rig.setMood(heavy || crisis ? 'concerned' : res.actions.length ? 'happy' : 'idle');
      say(res.reply, { ai: res });
      lateNudge();
      if (answers >= MAX_TURNS) setTimeout(() => finish(), 1500);
      return;
    }

    // A hiccup: offer to try again, without giving up on the AI.
    if (RETRYABLE.includes(res.reason)) {
      setFailure(res.reason);
      rig.setMood('concerned');
      setTimeout(() => rig.setMood('idle'), 900);
      return;
    }

    // The consent sheet just opened over the chat: wait for its answer.
    if (res.reason === 'consent') {
      awaitingOk.current = answers;
      rig.setMood('idle');
      return;
    }

    offline(res.reason, answers);
  };

  // No AI right now — say why, once, and carry on with the built-in flow.
  const offline = (reason: AIFailure, answers: number) => {
    if (reason === 'limit') setLimited(true);
    setMode('scripted');
    rig.setMood('concerned');
    say(whyOffline(reason), { aside: true });
    setTimeout(() => rig.setMood('idle'), 900);
    scriptedNext(answers);
  };

  // Back from the consent sheet: answer with the AI if they said yes,
  // otherwise nothing was sent and the built-in questions carry on.
  const awaitingOk = useRef<number | null>(null);
  const latest = useRef({ think, offline });
  latest.current = { think, offline };
  useFocusEffect(
    useCallback(() => {
      const answers = awaitingOk.current;
      if (answers == null) return;
      awaitingOk.current = null;
      if (useLifeStore.getState().settings.aiConsentAt) latest.current.think(answers);
      else latest.current.offline('consent', answers);
    }, []),
  );

  // Bring back the last conversation above this one, so Ember has it too.
  const resume = () => {
    if (!previous) return;
    const back: Line[] = [
      { from: 'ember', text: `Picking up from ${new Date(previous.at).toLocaleDateString('en-US', { weekday: 'long' })}:`, aside: true },
      ...previous.lines.map((l) => ({ from: l.from, text: l.text })),
    ];
    linesRef.current = [...back, ...linesRef.current.filter((l) => l.text !== opening)];
    setLines(linesRef.current);
    say('Where were we? Tell me what’s happened since.');
  };

  // Keep a one-line summary of this chat, only if they say yes.
  const rememberChat = async () => {
    setMemoryOffer('saving');
    const transcript = linesRef.current
      .filter((l) => !l.aside)
      .map((l) => `${l.from === 'ember' ? 'Ember' : 'Student'}: ${l.text}`)
      .join('\n');
    const res = await askJob<{ summary: string; followUp: string; followUpDate: string; title?: string }>('summary', transcript, { screen: 'Ember’s memory', who: 'memory' });
    // The same reply names the chat in your journal (older servers send no title).
    const title = res.ok ? res.data.title?.trim().replace(/^["“]|["”.]$/g, '') : '';
    if (title && savedKey.current) useLifeStore.getState().nameChat(savedKey.current, title.slice(0, 60));
    if (!res.ok || !res.data.summary) {
      setMemoryOffer(null);
      say('I couldn’t save that memory just now. That’s okay.', { aside: true });
      return;
    }
    const m = useLifeStore.getState().remember({
      kind: 'chat',
      text: res.data.summary,
      ...(res.data.followUp && res.data.followUpDate ? { followUp: res.data.followUp, followUpDate: res.data.followUpDate } : {}),
    });
    setMemoryOffer('done');
    say(`I’ll remember: “${m.text}”${m.followUp ? ` I’ll ask about ${m.followUp} after.` : ''}`, { aside: true });
  };

  const keepFact = (fact: string) => {
    const m = useLifeStore.getState().remember({ kind: 'fact', text: fact });
    offerUndo('Ember will remember that', () => useLifeStore.getState().forget(m.id), 'heart');
  };

  const useOwnQuestions = () => {
    setFailure(null);
    setMode('scripted');
    scriptedNext(linesRef.current.filter((l) => l.from === 'you').length);
  };

  // Twenty minutes into a chat past wind-down, Ember says it'll be here tomorrow. Once.
  const lateNudge = () => {
    if (nudged.current || startedAt.current == null) return;
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const windDown = useLifeStore.getState().settings.windDown;
    const late = mins >= windDown || mins < 4 * 60;
    if (late && Date.now() - startedAt.current > 20 * 60_000) {
      nudged.current = true;
      setTimeout(() => say('It’s getting late. I’ll be right here tomorrow, and sleep will make all of this smaller.', { aside: true }), 2500);
    }
  };

  // Rate a reply. Kept on this phone only; "off" keeps the chat up to it so
  // it can be looked over later (Settings → AI → Replies you rated).
  const rate = (i: number, verdict: 'good' | 'off') => {
    const l = linesRef.current[i];
    if (!l?.ai) return;
    const lines = verdict === 'off' ? linesRef.current.slice(0, i + 1).filter((x) => !x.aside).slice(-12).map((x) => ({ from: x.from, text: x.text })) : undefined;
    const r = useLifeStore.getState().rateReply({ verdict, who: 'ember', reply: l.text, lines, v: l.ai.v });
    offerUndo(verdict === 'good' ? 'Marked as a good reply' : 'Kept on this phone to look over', () => useLifeStore.getState().unrateReply(r.id), verdict === 'good' ? 'heart' : 'flag');
  };

  // Hold an Ember reply: keep it, share it, rate it, or see what the app sent along with it.
  const holdReply = (i: number) => {
    const l = linesRef.current[i];
    if (!l || l.from !== 'ember' || l.aside) return;
    Alert.alert('This reply', l.ai ? 'Ratings stay on your phone.' : undefined, [
      {
        text: 'Save to Notebook',
        onPress: () => {
          const first = l.text.split(/[.!?\n]/)[0].trim().slice(0, 40);
          const note = useHubStore.getState().createNote({ title: `Ember: ${first}`, icon: 'flame', blocks: [{ id: uid(), type: 'text', text: l.text }] });
          offerUndo('Saved to your Notebook', () => useHubStore.getState().deleteNote(note.id), 'book');
        },
      },
      { text: 'Copy or share', onPress: () => Share.share({ message: l.text }).catch(() => {}) },
      ...(l.ai
        ? [
            { text: 'Good reply', onPress: () => rate(i, 'good') },
            { text: 'This reply was off', onPress: () => rate(i, 'off') },
            { text: 'What did Ember see?', onPress: () => setSeeing(i) },
          ]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  // No connection: the message waits in the chat and goes on its own once
  // the phone is back online (tried every 15 seconds while this is open, and
  // when the app comes back to the front), for up to ten minutes.
  const offlineTries = useRef(0);
  useEffect(() => {
    if (failure !== 'offline' || finished) {
      if (!failure) offlineTries.current = 0;
      return;
    }
    const retry = () => {
      if (offlineTries.current >= 40) return;
      offlineTries.current += 1;
      think(yourTurns);
    };
    const timer = setInterval(retry, 15_000);
    const sub = AppState.addEventListener('change', (state) => state === 'active' && retry());
    return () => {
      clearInterval(timer);
      sub.remove();
    };
    // think and yourTurns are read fresh each time a failure is set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failure, finished]);

  // Hold your last message to fix it: it goes back in the box, and Ember's
  // answer to it is taken back too, so sending again gets a fresh reply.
  const holdYours = (i: number) => {
    const l = linesRef.current[i];
    if (!l || l.from !== 'you') return;
    Alert.alert('Your message', undefined, [
      {
        text: 'Edit and resend',
        onPress: () => {
          if (thinking) return;
          linesRef.current = linesRef.current.slice(0, i);
          setLines(linesRef.current);
          setSeeing(null);
          setFailure(null);
          setDraft(l.text);
        },
      },
      { text: 'Copy or share', onPress: () => Share.share({ message: l.text }).catch(() => {}) },
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  // Save the conversation, then close it warmly. Only once the save works —
  // a failed save must not say "thank you for telling me".
  const finish = async () => {
    stopMic();
    const said = linesRef.current.filter((l) => !l.aside);
    if (!said.some((l) => l.from === 'you')) {
      goBack();
      return;
    }
    const content = said.map((l) => `${l.from === 'ember' ? 'Ember' : 'You'}: ${l.text}`).join('\n\n');
    const saved = await saveEntry(content, 'companion');
    if (!saved) return;
    savedKey.current = entryKey(content);
    setFinished(true);
    const memoryOff = !!useLifeStore.getState().settings.memoryOff;
    if (!memoryOff) useLifeStore.getState().setLastEmberChat({ at: new Date().toISOString(), lines: said.slice(-24).map((l) => ({ from: l.from, text: l.text })) });
    if (!memoryOff && mode === 'ai' && said.some((l) => l.ai) && !crisis) setTimeout(() => setMemoryOffer('ask'), 1800);
    rig.setMood('cheer');
    rig.hopUp(18);
    setBurst((b) => b + 1);
    setTimeout(() => {
      say(closingLine);
      rig.setMood('happy');
    }, 600);
  };

  const lastAI = [...lines].reverse().find((l) => l.from === 'ember' && !l.aside);
  const lastYou = lines.map((l) => l.from).lastIndexOf('you');
  const chips = !finished && !thinking && lastAI?.ai ? lastAI.ai.chips : [];

  return (
    <Screen nav={false} tone="ember" motes scroll={false} contentStyle={styles.frame}>
      <View style={styles.stage}>
        <Sparks burst={burst} reach={80} />
        <EmberSprite rig={rig} size={104} seed={2.2} />
        <Text style={styles.name}>Ember</Text>
        <Text style={styles.tagline}>{mode === 'ai' ? 'Here to listen. Say as much or as little as you like.' : 'stopped by to ask how you’re doing.'}</Text>
        <Text style={styles.disclosure}>{AI_DISCLOSURE}</Text>
      </View>

      <ScrollView
        ref={scroll}
        style={styles.chat}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        {lines.map((l, i) => {
          const isLast = i === lines.length - 1;
          const editable = l.from === 'you' && i === lastYou && !finished && !thinking;
          return (
            <Animated.View key={i} entering={(l.from === 'ember' ? FadeInUp : FadeInDown).duration(360)}>
              <Pressy
                onLongPress={l.ai ? () => holdReply(i) : editable ? () => holdYours(i) : undefined}
                disabled={!l.ai && !editable}
                depth={0.98}
                accessibilityHint={l.ai ? 'Hold to save, share, rate, or see what Ember saw' : editable ? 'Hold to edit and resend' : undefined}
                style={[styles.bubble, l.from === 'ember' ? styles.fromEmber : styles.fromYou, l.aside && styles.aside]}
              >
                {l.from === 'ember' && !l.aside ? (
                  <RichText text={l.text} style={styles.emberText} reveal={!!l.ai && isLast} />
                ) : (
                  <Text style={l.from === 'ember' ? styles.asideText : styles.youText}>{l.text}</Text>
                )}
                {l.ai ? (
                  <View style={styles.mark} accessibilityLabel="Written by AI">
                    <Icon name="sparkle" size={10} color={colors.textFaint} />
                    <Text style={styles.markText}>Claude</Text>
                  </View>
                ) : null}
              </Pressy>
              {seeing === i && l.ai ? (
                <Pressy onPress={() => setSeeing(null)} depth={0.99} style={[styles.bubble, styles.aside, styles.seen]} accessibilityHint="Tap to close">
                  <Text style={styles.seenTitle}>What Ember saw with this message</Text>
                  <Text style={styles.asideText}>{l.ai.note}</Text>
                  <Text style={styles.seenFoot}>Plus the conversation above. About {l.ai.cents < 1 ? 'a penny' : `${Math.round(l.ai.cents)}¢`}, {Math.max(1, Math.round(l.ai.ms / 1000))} s to think.</Text>
                </Pressy>
              ) : null}
              {l.ai && !finished ? <ReplyExtras reply={l.ai} onRemember={useLifeStore.getState().settings.memoryOff ? undefined : keepFact} /> : null}
            </Animated.View>
          );
        })}

        {finished && (crisis || lowMood) ? <ReplyExtras reply={{ actions: ['ground', 'breathe'], todo: null, setdown: null, focus: null, helper: null, open: null, remember: null }} /> : null}

        {canResume && yourTurns === 0 && !finished && lines.length === 1 ? (
          <Animated.View entering={FadeInDown.delay(600).duration(300)}>
            <Chip label="Pick up where we left off" icon="repeat" onPress={resume} />
          </Animated.View>
        ) : null}

        {memoryOffer === 'ask' || memoryOffer === 'saving' ? (
          <Animated.View entering={FadeInDown.duration(300)} style={[styles.bubble, styles.fromEmber, styles.aside]}>
            <Text style={styles.asideText}>Want me to remember the gist of this for next time? I’d keep one line on your phone and bring it up only with me.</Text>
            <View style={[styles.row, styles.retryRow]}>
              <Button label={memoryOffer === 'saving' ? 'Remembering…' : 'Remember'} icon="heart" size="sm" onPress={rememberChat} disabled={memoryOffer === 'saving'} />
              <Button label="Not this one" variant="ghost" size="sm" onPress={() => setMemoryOffer(null)} />
            </View>
          </Animated.View>
        ) : null}

        {failure ? (
          <Animated.View entering={FadeInDown.duration(300)} style={[styles.bubble, styles.fromEmber, styles.aside]}>
            <Text style={styles.asideText}>
              {failure === 'offline' && offlineTries.current < 40 ? 'No connection right now. Your message is safe here and will send by itself when you’re back online.' : whyOffline(failure)}
            </Text>
            <View style={[styles.row, styles.retryRow]}>
              <Button label="Try again" icon="repeat" size="sm" onPress={() => think(yourTurns)} />
              <Button label="Use your questions" variant="ghost" size="sm" onPress={useOwnQuestions} />
            </View>
          </Animated.View>
        ) : null}

        {thinking ? <Thinking /> : null}

        {!finished && lines.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(300).duration(360)} style={styles.reply}>
            {/* Kept right by the box, so it never scrolls out of sight. */}
            {crisis ? <HelpCard /> : null}
            {chips.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
                {chips.map((c) => (
                  <Chip key={c} label={c} onPress={() => send(c)} />
                ))}
              </ScrollView>
            ) : null}
            <Field
              multiline
              placeholder={yourTurns === 0 ? 'Take your time.' : 'Say more, or tap Done when you’re ready.'}
              ref={box.input}
              value={draft}
              onChangeText={box.onChangeText}
              onFocus={() => rig.setMood('listening')}
              onBlur={() => rig.setMood('idle')}
              style={styles.input}
            />
            <View style={styles.row}>
              <IconButton
                icon={listening ? 'pause' : 'mic'}
                label={listening ? 'Stop listening' : 'Talk instead of typing'}
                tint={listening ? colors.flame : undefined}
                color={listening ? colors.flameInk : undefined}
                onPress={toggleMic}
                disabled={thinking || isSaving}
                size={50}
              />
              <Button
                label="Tell Ember"
                icon="chat"
                onPress={() => send()}
                disabled={thinking || isSaving || !draft.trim()}
                style={styles.flex}
              />
              {yourTurns > 0 ? (
                <Button label={mode === 'scripted' && yourTurns === 1 ? 'Leave it here' : 'Done'} variant="secondary" loading={isSaving} onPress={finish} disabled={thinking || isSaving} />
              ) : null}
            </View>
            {listening || micNote ? (
              <Animated.Text entering={FadeIn.duration(200)} style={styles.micNote}>
                {micNote ?? 'Listening. Your words stay on your phone until you tap Tell Ember.'}
              </Animated.Text>
            ) : null}
            {mode === 'ai' ? (
              <>
                <View style={styles.toggles}>
                  <Chip label="Just listen" icon="heart" selected={justListen} onPress={() => setJustListen((v) => !v)} />
                  <Chip label="Keep my Desk private" icon="pin" selected={keepPrivate} onPress={() => setKeepPrivate((v) => !v)} />
                </View>
                <Text style={styles.privacy}>
                  {justListen ? 'Ember will just listen: no advice. ' : ''}Ember’s replies are written by Claude. What you type is sent to Anthropic to answer
                  {keepPrivate ? ', without your Desk or check-in.' : ', with a short note about your day.'} Phone numbers, emails, and addresses are blanked first.
                </Text>
              </>
            ) : null}
            {limited ? <Button label="See Plus for more AI" icon="sparkle" variant="ghost" size="sm" onPress={() => router.push('/plus')} style={styles.plus} /> : null}
            {error ? <Text style={styles.errorText}>Couldn’t save that. Check your connection and try again.</Text> : null}
          </Animated.View>
        ) : null}

        {finished ? (
          <Animated.View entering={FadeInDown.delay(900).duration(360)} style={styles.reply}>
            {crisis ? <HelpCard /> : null}
            <Button label="Done" icon="check" variant="secondary" onPress={() => goBack()} />
          </Animated.View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

// Three embers pulsing while Ember thinks. Deep thinking can take a while,
// so after a few seconds it says so.
function Thinking() {
  const [long, setLong] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLong(true), 6000);
    return () => clearTimeout(t);
  }, []);
  return (
    <Animated.View entering={FadeInUp.duration(240)} exiting={FadeOut.duration(160)} style={[styles.bubble, styles.fromEmber, styles.thinking]} accessibilityLabel="Ember is thinking">
      {[0, 1, 2].map((i) => (
        <Dot key={i} i={i} />
      ))}
      {long ? (
        <Animated.Text entering={FadeInUp.duration(300)} style={styles.thinkingText}>
          thinking it through…
        </Animated.Text>
      ) : null}
    </Animated.View>
  );
}

function Dot({ i }: { i: number }) {
  const p = useSharedValue(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    p.value = withDelay(
      i * 160,
      withRepeat(withSequence(withTiming(1, { duration: 380, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 380 })), -1)
    );
  }, [p, i, reduced]);
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
    letterSpacing: -0.5,
    color: colors.text,
  },
  disclosure: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    color: colors.textFaint,
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
    borderRadius: radii.lg,
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
    borderRadius: radii.pill,
    backgroundColor: colors.flame,
  },
  suggestText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.flameInk,
  },
  thinking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  thinkingText: {
    marginLeft: 6,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  mark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
    opacity: 0.8,
  },
  markText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
  },
  seen: {
    marginTop: 8,
    maxWidth: '100%',
  },
  seenTitle: {
    marginBottom: 4,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.textMuted,
  },
  seenFoot: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  retryRow: {
    marginTop: 10,
    flexWrap: 'wrap',
  },
  micNote: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    color: colors.textFaint,
  },
  chips: {
    gap: 8,
  },
  toggles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
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
