import { router } from 'expo-router';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/ui/Button';
import { colors, fonts, radii, spacing } from '../core/theme';
import { useVentStore } from '../core/ventStore';

type Mode = 'voice' | 'type';

const GAUGE_SIZE = 132;
const GAUGE_RADIUS = GAUGE_SIZE / 2 - 6;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

export default function VentScreen() {
  const [mode, setMode] = useState<Mode>('voice');
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [typedText, setTypedText] = useState('');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [released, setReleased] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const history = useVentStore((s) => s.history);
  const isSaving = useVentStore((s) => s.isSaving);
  const fetchHistory = useVentStore((s) => s.fetchHistory);
  const saveEntry = useVentStore((s) => s.saveEntry);

  const pulse = useRef(new Animated.Value(0)).current;
  const releaseOpacity = useRef(new Animated.Value(1)).current;
  const releaseTranslate = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (!recognizing) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [recognizing, pulse]);

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

  const handleRelease = async () => {
    if (!content.trim() || isSaving) return;
    if (recognizing) ExpoSpeechRecognitionModule.stop();

    const ok = await saveEntry(content, mode);
    if (!ok) return;

    Animated.parallel([
      Animated.timing(releaseOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(releaseTranslate, {
        toValue: -24,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTranscript('');
      setTypedText('');
      releaseOpacity.setValue(1);
      releaseTranslate.setValue(0);
      setReleased(true);
      setTimeout(() => setReleased(false), 2200);
    });
  };

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={styles.outer}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <Button label="Back" variant="pill" onPress={() => router.back()} style={styles.back} />

        <Text style={styles.title}>Let It Out</Text>
        <Text style={styles.subtitle}>Speak or type. Nothing here is graded.</Text>

        <View style={styles.modeRow}>
          <ModeTab label="Speak" active={mode === 'voice'} onPress={() => setMode('voice')} />
          <ModeTab label="Type" active={mode === 'type'} onPress={() => setMode('type')} />
        </View>

        <Animated.View
          style={{ opacity: releaseOpacity, transform: [{ translateY: releaseTranslate }] }}
        >
          {mode === 'voice' ? (
            <View style={styles.voiceArea}>
              <View style={styles.gaugeWrap}>
                {recognizing ? (
                  <Animated.View
                    style={[
                      styles.ring,
                      { transform: [{ scale: ringScale }], opacity: ringOpacity },
                    ]}
                  />
                ) : null}
                <Pressable onPress={handleValvePress} hitSlop={12}>
                  <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
                    <Circle
                      cx={GAUGE_SIZE / 2}
                      cy={GAUGE_SIZE / 2}
                      r={GAUGE_RADIUS}
                      stroke={colors.divider}
                      strokeWidth={3}
                      fill="none"
                    />
                    <Circle
                      cx={GAUGE_SIZE / 2}
                      cy={GAUGE_SIZE / 2}
                      r={GAUGE_RADIUS}
                      stroke={recognizing ? colors.unlocked : colors.leather}
                      strokeWidth={3}
                      fill={recognizing ? 'rgba(156, 74, 49, 0.08)' : 'transparent'}
                      strokeDasharray={GAUGE_CIRCUMFERENCE}
                      strokeDashoffset={recognizing ? 0 : GAUGE_CIRCUMFERENCE * 0.18}
                      strokeLinecap="round"
                      rotation={-90}
                      origin={`${GAUGE_SIZE / 2}, ${GAUGE_SIZE / 2}`}
                    />
                  </Svg>
                </Pressable>
              </View>
              <Text style={styles.valveLabel}>{recognizing ? 'Listening — tap to stop' : 'Tap to speak'}</Text>
              {permissionError ? <Text style={styles.errorText}>{permissionError}</Text> : null}

              {transcript ? <Text style={styles.transcript}>{transcript}</Text> : null}
            </View>
          ) : (
            <TextInput
              style={styles.typeArea}
              multiline
              placeholder="Let it out."
              placeholderTextColor={colors.hint}
              value={typedText}
              onChangeText={setTypedText}
              textAlignVertical="top"
            />
          )}

          {content.trim() ? (
            <Button
              label={isSaving ? 'Releasing…' : 'Release'}
              onPress={handleRelease}
              disabled={isSaving}
              style={styles.releaseButton}
            />
          ) : null}
        </Animated.View>

        {released ? <Text style={styles.releasedNote}>Released. It's kept, not dwelt on.</Text> : null}

        {history.length > 0 ? (
          <Pressable onPress={() => setHistoryOpen((v) => !v)} style={styles.historyToggle}>
            <Text style={styles.historyToggleText}>
              {historyOpen ? 'Hide' : 'See'} past entries ({history.length})
            </Text>
          </Pressable>
        ) : null}

        {historyOpen
          ? history.map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <Text style={styles.historyDate}>
                  {new Date(entry.created_at).toLocaleDateString()}
                </Text>
                <Text style={styles.historyContent} numberOfLines={2}>
                  {entry.content}
                </Text>
              </View>
            ))
          : null}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

function ModeTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.modeTab, active && styles.modeTabActive]}>
      <Text style={[styles.modeTabText, active && styles.modeTabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: 120,
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.ink,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
  },
  modeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  modeTab: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  modeTabActive: {
    backgroundColor: colors.leather,
    borderColor: colors.leather,
  },
  modeTabText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  modeTabTextActive: {
    color: colors.background,
  },
  voiceArea: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  gaugeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
  },
  ring: {
    position: 'absolute',
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    borderRadius: GAUGE_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.unlocked,
  },
  valveLabel: {
    marginTop: spacing.md,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkFaint,
  },
  transcript: {
    marginTop: spacing.lg,
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 25,
    color: colors.ink,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  typeArea: {
    minHeight: 180,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.backgroundAlt,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 23,
    color: colors.ink,
  },
  releaseButton: {
    marginTop: spacing.lg,
    alignSelf: 'center',
  },
  releasedNote: {
    marginTop: spacing.lg,
    textAlign: 'center',
    fontFamily: fonts.displaySoft,
    fontSize: 15,
    color: colors.verdigris,
  },
  errorText: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.danger,
    textAlign: 'center',
  },
  historyToggle: {
    marginTop: spacing.xxl,
    alignSelf: 'center',
  },
  historyToggleText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkFaint,
  },
  historyRow: {
    marginTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  historyDate: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.hint,
  },
  historyContent: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
  },
});
