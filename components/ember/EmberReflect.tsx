import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from '../../core/haptics';
import { aiFailLine, askJob, soundsLikeCrisis } from '../../core/emberAI';
import { useLifeStore } from '../../core/lifeStore';
import { alpha, colors, fonts, radii } from '../../core/theme';
import { Icon } from '../ui/Icon';
import { Pressy } from '../ui/Pressy';
import { HelpCard } from './HelpCard';
import { RichText } from './RichText';

// "Hear from Ember": after a vent, a check-in, or a worry, the student can
// ask for one line back — that Ember heard the specific thing — and one
// gentle question. Off unless tapped, and the line under it says what goes.
export function EmberReflect({ input, label = 'Hear from Ember', sends, color = colors.flame }: { input: string; label?: string; sends: string; color?: string }) {
  const aiOff = useLifeStore((s) => !!s.settings.aiOff);
  const [state, setState] = useState<{ kind: 'idle' } | { kind: 'loading' } | { kind: 'said'; text: string } | { kind: 'error'; line: string }>({ kind: 'idle' });
  const crisis = soundsLikeCrisis(input);

  if (aiOff || !input.trim()) return crisis ? <HelpCard /> : null;

  const ask = async () => {
    setState({ kind: 'loading' });
    Haptics.selectionAsync().catch(() => {});
    const res = await askJob<{ reply: string }>('reflect', input.slice(0, 3800), { who: 'reflect' });
    if (!res.ok) return setState({ kind: 'error', line: aiFailLine(res.reason) });
    setState({ kind: 'said', text: res.data.reply });
  };

  return (
    <View style={styles.wrap}>
      {crisis ? <HelpCard /> : null}
      {state.kind === 'said' ? (
        <Animated.View entering={FadeInDown.duration(300)} style={[styles.bubble, { borderColor: alpha(color, 0.35), backgroundColor: alpha(color, 0.08) }]}>
          <RichText text={state.text} style={styles.text} reveal />
          <View style={styles.mark}>
            <Icon name="sparkle" size={10} color={colors.textFaint} />
            <Text style={styles.markText}>Claude</Text>
          </View>
        </Animated.View>
      ) : (
        <>
          <Pressy onPress={ask} disabled={state.kind === 'loading'} depth={0.97} style={styles.link} accessibilityRole="button">
            <Icon name="sparkle" size={13} color={color} />
            <Text style={[styles.linkText, { color }]}>{state.kind === 'loading' ? 'Ember is reading it…' : label}</Text>
          </Pressy>
          {state.kind === 'error' ? (
            <Animated.Text entering={FadeIn} style={styles.note}>
              {state.line}
            </Animated.Text>
          ) : (
            <Text style={styles.note}>{sends}</Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    gap: 6,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: 34,
  },
  linkText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
  },
  note: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textFaint,
  },
  bubble: {
    padding: 14,
    borderRadius: radii.lg,
    borderTopLeftRadius: 6,
    borderWidth: 1,
  },
  text: {
    fontFamily: fonts.displaySoft,
    fontSize: 17,
    lineHeight: 24,
    color: colors.text,
  },
  mark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
  },
  markText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textFaint,
  },
});
