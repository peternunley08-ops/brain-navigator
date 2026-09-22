import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts, spacing } from '../../core/theme';

const METER_OPTIONS = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

// Metering is reported in dB, roughly -160 (silence) to 0 (loudest the scale
// goes). -50dB is a fairly quiet room — used as the practical floor so a
// normal room doesn't just read as a flat zero.
function normalizeLevel(db: number | undefined) {
  if (db === undefined) return 0;
  return Math.max(0, Math.min(1, (db + 50) / 50));
}

interface AmbientMicMeterProps {
  onComplete: (result: { peakLevel: number; averageLevel: number; durationSeconds: number }) => void;
}

// A manual, on-demand ambient noise check — not background or overnight
// monitoring. There's no capability in this app to record while you sleep;
// this just samples the room right now, for however long you leave it running.
export function AmbientMicMeter({ onComplete }: AmbientMicMeterProps) {
  const recorder = useAudioRecorder(METER_OPTIONS);
  const state = useAudioRecorderState(recorder, 150);
  const [error, setError] = useState<string | null>(null);
  const samplesRef = useRef<number[]>([]);
  const startedAtRef = useRef(0);

  useEffect(() => {
    if (state.isRecording && state.metering !== undefined) {
      samplesRef.current.push(normalizeLevel(state.metering));
    }
  }, [state.isRecording, state.metering]);

  const handleStart = async () => {
    setError(null);
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setError('Microphone permission denied.');
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    samplesRef.current = [];
    startedAtRef.current = Date.now();
    recorder.record();
  };

  const handleStop = async () => {
    await recorder.stop();
    const samples = samplesRef.current;
    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
    const peakLevel = samples.length > 0 ? Math.max(...samples) : 0;
    const averageLevel = samples.length > 0 ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;
    onComplete({ peakLevel, averageLevel, durationSeconds });
  };

  const level = normalizeLevel(state.metering);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Svg width={12} height={12}>
          <Circle cx={6} cy={6} r={5} fill={state.isRecording ? colors.lantern : colors.divider} />
        </Svg>
        <View style={styles.levelTrack}>
          <View style={[styles.levelFill, { width: `${Math.round(level * 100)}%` }]} />
        </View>
        <Pressable onPress={state.isRecording ? handleStop : handleStart} hitSlop={8}>
          <Text style={styles.actionText}>{state.isRecording ? 'Stop' : 'Check Ambient Noise'}</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  levelTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    overflow: 'hidden',
  },
  levelFill: {
    height: '100%',
    backgroundColor: colors.lantern,
  },
  actionText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.leather,
  },
  errorText: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.danger,
  },
});
