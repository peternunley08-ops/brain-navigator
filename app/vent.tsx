import { LinearGradient } from 'expo-linear-gradient';
import { EmberReflect } from '../components/ember/EmberReflect';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { alpha, colors, fonts, radii } from '../core/theme';
import * as Haptics from '../core/haptics';
import { useLifeStore } from '../core/lifeStore';
import { isNight, minutesOf, nightNow, nightStart } from '../core/night';
import { offerUndo } from '../core/undoStore';
import { chatTitleFrom, entryKey, useVentStore } from '../core/ventStore';

type Mode = 'voice' | 'type';

const ORB = 150;
const EMBER_RED = '#F0845A';

export default function VentScreen() {
  const [mode, setMode] = useState<Mode>('voice');
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [typedText, setTypedText] = useState('');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [released, setReleased] = useState(false);
  // What was just let out, so Ember can answer it if they ask.
  const [lastVent, setLastVent] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  // One entry at a time opens to its full text.
  const [openEntry, setOpenEntry] = useState<string | null>(null);
  const chatTitles = useLifeStore((s) => s.chatTitles);
  const reduced = useReducedMotion();

  const history = useVentStore((s) => s.history);
  const isSaving = useVentStore((s) => s.isSaving);
  const saveError = useVentStore((s) => s.error);
  const fetchHistory = useVentStore((s) => s.fetchHistory);
  const saveEntry = useVentStore((s) => s.saveEntry);

  const lift = useSharedValue(0);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useSpeechRecognitionEvent('start', () => setRecognizing(true));
  useSpeechRecognitionEvent('end', () => setRecognizing(false));
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript;
    if (text !== undefined) setTranscript(text);
  });
  useSpeechRecognitionEvent('error', (event) => {
    setRecognizing(false);
    if (event.error === 'not-allowed') {
      setPermissionError('Microphone permission was denied.');
    } else {
      setPermissionError("Couldn't hear that — try again, or switch to typing.");
    }
  });

  const content = mode === 'voice' ? transcript : typedText;

  const handleValvePress = async () => {
    setPermissionError(null);
    if (recognizing) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    const result = await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();
    if (!result.granted) {
      setPermissionError('Microphone permission was denied.');
      return;
    }
    setTranscript('');
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: true,
      // This is a venting page — what you say here should never leave the
      // device. requiresOnDeviceRecognition also means iOS doesn't need the
      // separate (scarier, "sent to Apple") Speech Recognition permission.
      requiresOnDeviceRecognition: true,
    });
  };

  // The words rise and fade before they clear — letting go, made visible.
  const handleRelease = async () => {
    if (!content.trim() || isSaving) return;
    if (recognizing) ExpoSpeechRecognitionModule.stop();

    const ok = await saveEntry(content, mode);
    if (!ok) return;
    setLastVent(content);

    lift.value = withTiming(1, { duration: reduced ? 200 : 900, easing: Easing.in(Easing.quad) });
    setTimeout(() => {
      setTranscript('');
      setTypedText('');
      lift.value = 0;
      setReleased(true);
      emberSay('Released. It’s out of your head now.', 'happy');
      setTimeout(() => setReleased(false), 2600);
    }, reduced ? 220 : 920);
  };

  // Late at night, lead with putting it in the worry box instead.
  // Late means the same night the Desk keeps: from wind-down (an hour later for a night owl).
  const windDown = useLifeStore((s) => s.settings.windDown);
  const nightOwl = useLifeStore((s) => s.about.picks.time) === 'b';
  const late = isNight(minutesOf(nightNow()), nightStart(windDown, nightOwl));
  const handleKeep = () => {
    const t = content.trim();
    if (!t) return;
    if (recognizing) ExpoSpeechRecognitionModule.stop();
    const before = useLifeStore.getState().worries;
    useLifeStore.getState().addWorry(t);
    offerUndo('Added to the worry box', () => useLifeStore.getState().putBack({ worries: before }), 'trash');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    setTranscript('');
    setTypedText('');
    emberSay('It’s in the box. It’ll keep till morning.', 'sleepy');
  };

  const floatAway = useAnimatedStyle(() => ({
    opacity: 1 - lift.value,
    transform: [{ translateY: reduced ? 0 : -60 * lift.value }, { scale: 1 - 0.06 * lift.value }],
  }));

  return (
    <Screen title="Let it out" subtitle="Speak or type. Nothing here is graded." tone="ember" glowColor={EMBER_RED}>
      <Reveal index={0}>
        <ModeSwitch mode={mode} onChange={setMode} />
      </Reveal>

      <Reveal index={1}>
        <Animated.View style={floatAway}>
          {mode === 'voice' ? (
            <View style={styles.voiceArea}>
              <MicOrb listening={recognizing} onPress={handleValvePress} />
              <Text style={styles.valveLabel}>{recognizing ? 'Listening. Tap to stop.' : 'Tap to speak'}</Text>
              {permissionError ? <Text style={styles.errorText}>{permissionError}</Text> : null}
              {transcript ? (
                <Card style={styles.transcriptCard}>
                  <Text style={styles.transcript}>{transcript}</Text>
                </Card>
              ) : null}
            </View>
          ) : (
            <Field
              multiline
              placeholder="Let it out. All of it."
              value={typedText}
              onChangeText={setTypedText}
              style={styles.typeArea}
              containerStyle={styles.typeWrap}
            />
          )}

          {content.trim() ? (
            <Animated.View entering={FadeInDown.duration(260)}>
              {late ? <Button label="Keep it for tomorrow" icon="moon" onPress={handleKeep} style={styles.releaseButton} /> : null}
              <Button label="Let it go" icon="feather" variant={late ? 'secondary' : undefined} loading={isSaving} onPress={handleRelease} style={late ? styles.releaseButtonAfter : styles.releaseButton} />
            </Animated.View>
          ) : null}
        </Animated.View>

        {released ? (
          <Animated.Text entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={styles.releasedNote}>
            Released. It’s kept, not dwelt on.
          </Animated.Text>
        ) : null}
        {!released && saveError ? <Text style={styles.errorText}>Couldn’t save that. Check your connection and try again.</Text> : null}
        {lastVent && !content.trim() ? <EmberReflect key={lastVent} input={`Vent: ${lastVent}`} sends="Sends what you just let out to Claude. Only if you tap." color={EMBER_RED} /> : null}
      </Reveal>

      {history.length > 0 ? (
        <Reveal index={2}>
          <Section
            title="What you’ve let out"
            note={`${history.length} ${history.length === 1 ? 'entry' : 'entries'}`}
            action={{ label: historyOpen ? 'Hide' : 'Show', onPress: () => setHistoryOpen((v) => !v) }}
          >
            {historyOpen ? (
              <Animated.View entering={FadeInDown.duration(260)} style={styles.history}>
                {history.map((entry) => {
                  const chat = entry.input_mode === 'companion';
                  const open = openEntry === entry.id;
                  return (
                    <Pressy
                      key={entry.id}
                      depth={0.99}
                      haptic="none"
                      onPress={() => setOpenEntry(open ? null : entry.id)}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: open }}
                      accessibilityHint={open ? 'Shows less' : 'Shows all of it'}
                    >
                      <Card style={styles.historyCard}>
                        {chat ? <Text style={styles.historyTitle}>{chatTitles[entryKey(entry.content)] ?? chatTitleFrom(entry.content)}</Text> : null}
                        <View style={styles.historyHead}>
                          <Icon name={chat ? 'chat' : entry.input_mode === 'voice' ? 'mic' : 'pen'} size={14} color={colors.textFaint} />
                          <Text style={styles.historyDate}>
                            {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {chat ? ', with Ember' : ''}
                          </Text>
                        </View>
                        <Text style={styles.historyContent} numberOfLines={open ? undefined : 3}>
                          {entry.content}
                        </Text>
                      </Card>
                    </Pressy>
                  );
                })}
              </Animated.View>
            ) : null}
          </Section>
        </Reveal>
      ) : null}
    </Screen>
  );
}

function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const [w, setW] = useState(0);
  const knob = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(mode === 'voice' ? 0 : w / 2, { duration: 240, easing: Easing.out(Easing.cubic) }) }],
  }));
  return (
    <View style={styles.switch} onLayout={(e) => setW(e.nativeEvent.layout.width - 8)} accessibilityRole="tablist">
      {w > 0 ? <Animated.View style={[styles.knob, { width: w / 2 }, knob]} /> : null}
      {(['voice', 'type'] as const).map((m) => (
        <Pressy
          key={m}
          onPress={() => onChange(m)}
          style={styles.switchItem}
          depth={0.97}
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === m }}
        >
          <Icon name={m === 'voice' ? 'mic' : 'pen'} size={16} color={mode === m ? colors.flameInk : colors.textMuted} strokeWidth={2} />
          <Text style={[styles.switchText, mode === m && styles.switchTextOn]}>{m === 'voice' ? 'Speak' : 'Type'}</Text>
        </Pressy>
      ))}
    </View>
  );
}

// A glowing orb; while it listens, rings ripple outward from it.
function MicOrb({ listening, onPress }: { listening: boolean; onPress: () => void }) {
  const breathe = useSharedValue(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    breathe.value = listening && !reduced
      ? withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0, { duration: 900 })), -1)
      : withTiming(0, { duration: 300 });
  }, [listening, breathe, reduced]);
  const orb = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.05 * breathe.value }] }));

  return (
    <View style={styles.orbWrap}>
      {listening ? [0, 1, 2].map((i) => <Ripple key={i} delay={i * 600} />) : null}
      <Pressy onPress={onPress} depth={0.93} haptic="light" accessibilityRole="button" accessibilityLabel={listening ? 'Stop listening' : 'Start speaking'}>
        <Animated.View style={[styles.orb, orb, listening && styles.orbOn]}>
          <LinearGradient
            colors={listening ? ['#FFB38A', EMBER_RED, '#C4502B'] : ['#3A2A33', '#2B2230', '#211A25']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.orbFill}
          >
            <Icon name={listening ? 'pause' : 'mic'} size={44} color={listening ? colors.flameInk : EMBER_RED} strokeWidth={2} />
          </LinearGradient>
        </Animated.View>
      </Pressy>
    </View>
  );
}

function Ripple({ delay }: { delay: number }) {
  const p = useSharedValue(1);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    p.value = 0;
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false));
  }, [p, delay, reduced]);
  const style = useAnimatedStyle(() => ({ opacity: 0.55 * (1 - p.value), transform: [{ scale: 1 + p.value * 0.7 }] }));
  return <Animated.View style={[styles.ripple, style]} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  switch: {
    flexDirection: 'row',
    marginTop: 18,
    padding: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSunk,
    borderWidth: 1,
    borderColor: colors.line,
  },
  knob: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.flame,
  },
  switchItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
  },
  switchText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.textMuted,
  },
  switchTextOn: {
    color: colors.flameInk,
  },
  voiceArea: {
    alignItems: 'center',
    paddingTop: 36,
  },
  orbWrap: {
    width: ORB + 60,
    height: ORB + 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
    borderWidth: 1,
    borderColor: alpha(EMBER_RED, 0.4),
    overflow: 'hidden',
  },
  orbOn: {
    shadowColor: EMBER_RED,
    shadowOpacity: 0.8,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  orbFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
    borderWidth: 2,
    borderColor: EMBER_RED,
  },
  valveLabel: {
    marginTop: 6,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textMuted,
  },
  transcriptCard: {
    marginTop: 24,
  },
  transcript: {
    fontFamily: fonts.displaySoft,
    fontSize: 18,
    lineHeight: 26,
    color: colors.text,
  },
  typeWrap: {
    marginTop: 18,
  },
  typeArea: {
    minHeight: 220,
    fontSize: 17,
    lineHeight: 25,
  },
  releaseButton: {
    marginTop: 22,
  },
  releaseButtonAfter: {
    marginTop: 12,
  },
  releasedNote: {
    marginTop: 22,
    textAlign: 'center',
    fontFamily: fonts.displaySoft,
    fontSize: 17,
    color: colors.secured,
  },
  errorText: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },
  history: {
    gap: 10,
  },
  historyCard: {
    paddingVertical: 14,
  },
  historyTitle: {
    marginBottom: 4,
    fontFamily: fonts.displaySoft,
    fontSize: 17,
    color: colors.text,
  },
  historyHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyDate: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textFaint,
  },
  historyContent: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
  },
});
