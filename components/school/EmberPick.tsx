import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from '../../core/haptics';
import { aiFailLine, askJob, type NoteRef } from '../../core/emberAI';
import { alpha, colors, fonts, radii, textGrow } from '../../core/theme';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Pressy } from '../ui/Pressy';

// "What should I do first?" Ember weighs what's due, how big each thing is,
// and the time of day, and picks one, with a reason. Only on tap.
export function EmberPick() {
  const [state, setState] = useState<{ kind: 'idle' } | { kind: 'loading' } | { kind: 'pick'; ref: NoteRef; why: string } | { kind: 'error'; line: string }>({ kind: 'idle' });

  const ask = async () => {
    setState({ kind: 'loading' });
    Haptics.selectionAsync().catch(() => {});
    const res = await askJob<{ ref: string; why: string }>('pick', 'What should I start first?', { screen: 'School', who: 'pick', note: { private: true } });
    if (!res.ok) return setState({ kind: 'error', line: aiFailLine(res.reason) });
    const ref = res.refs[res.data.ref?.toLowerCase()];
    if (!ref || ref.kind !== 'assignment') return setState({ kind: 'error', line: 'Ember couldn’t pick one this time. The list below is sorted by what’s due first.' });
    setState({ kind: 'pick', ref, why: res.data.why });
  };

  if (state.kind === 'pick') {
    return (
      <Animated.View entering={FadeInDown.duration(280)} style={styles.card}>
        <View style={styles.head}>
          <Icon name="sparkle" size={13} color={colors.flame} />
          <Text style={styles.label} maxFontSizeMultiplier={2}>Ember’s pick</Text>
        </View>
        <Text style={styles.title} maxFontSizeMultiplier={textGrow.heading}>{state.ref.label}</Text>
        <Text style={styles.why} maxFontSizeMultiplier={2}>{state.why}</Text>
        <View style={styles.row}>
          <Button label="Start focus" icon="timer" size="sm" onPress={() => router.push({ pathname: '/focus', params: { assignment: state.ref.id } })} />
          <Button label="Open" variant="secondary" size="sm" onPress={() => router.push(`/assignment/${state.ref.id}`)} />
          <Button label="Hide" variant="ghost" size="sm" onPress={() => setState({ kind: 'idle' })} />
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Pressy onPress={ask} disabled={state.kind === 'loading'} depth={0.97} style={styles.link} accessibilityRole="button" accessibilityHint="Sends what’s due this week to Claude to pick one">
        <Icon name="sparkle" size={13} color={colors.flame} />
        <Text style={styles.linkText} maxFontSizeMultiplier={textGrow.control}>{state.kind === 'loading' ? 'Ember is weighing it up…' : 'Not sure? Let Ember pick what’s first'}</Text>
      </Pressy>
      {state.kind === 'error' ? (
        <Animated.Text entering={FadeIn} style={styles.error}>
          {state.line}
        </Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: 34,
  },
  linkText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.flame,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  card: {
    marginTop: 10,
    padding: 14,
    gap: 4,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: alpha(colors.flame, 0.35),
    backgroundColor: alpha(colors.flame, 0.08),
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.flame,
  },
  title: {
    marginTop: 2,
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
  },
  why: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
});
