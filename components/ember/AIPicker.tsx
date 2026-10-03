import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from '../../core/haptics';
import { type AIFailure, aiFailLine, soundsLikeCrisis } from '../../core/emberAI';
import { HelpCard } from './HelpCard';
import { alpha, colors, fonts, radii } from '../../core/theme';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Pressy } from '../ui/Pressy';

export interface PickItem {
  title: string;
  detail?: string;
}

export type PickLoad = () => Promise<{ ok: true; items: PickItem[] } | { ok: false; reason: AIFailure }>;

interface Props {
  /** The sparkle button, e.g. "Break it into steps". */
  label: string;
  /** Exactly what tapping sends, shown under the button. */
  sends: string;
  load: PickLoad;
  /** "Add 5 steps" */
  addLabel: (n: number) => string;
  onAdd: (picked: PickItem[]) => void;
  color?: string;
  /** Nothing to suggest yet (e.g. an empty note). */
  disabled?: boolean;
  /** Everything typed that this button would send. If it sounds like danger, the help lines show first. */
  watch?: string;
}

// An AI suggestion you look over before anything changes: tap the sparkle
// button, see the list with every item checked, untick what you don't want,
// then add the rest. Tapping the button is the consent to send; the line
// under it says exactly what goes.
export function AIPicker({ label, sends, load, addLabel, onAdd, color = colors.flame, disabled, watch }: Props) {
  const [state, setState] = useState<{ kind: 'idle' } | { kind: 'loading' } | { kind: 'preview'; items: PickItem[]; on: boolean[] } | { kind: 'error'; reason: AIFailure }>({ kind: 'idle' });

  const run = async () => {
    setState({ kind: 'loading' });
    Haptics.selectionAsync().catch(() => {});
    const res = await load();
    if (!res.ok) return setState({ kind: 'error', reason: res.reason });
    if (!res.items.length) return setState({ kind: 'error', reason: 'unavailable' });
    setState({ kind: 'preview', items: res.items, on: res.items.map(() => true) });
  };

  if (state.kind === 'preview') {
    const picked = state.items.filter((_, i) => state.on[i]);
    return (
      <Animated.View entering={FadeInDown.duration(260)} style={[styles.box, { borderColor: alpha(color, 0.35) }]}>
        <View style={styles.head}>
          <Icon name="sparkle" size={13} color={color} />
          <Text style={[styles.headText, { color }]}>Suggested by Claude. Untick anything you don’t want.</Text>
        </View>
        {state.items.map((it, i) => (
          <Pressy
            key={i}
            depth={0.98}
            haptic="none"
            onPress={() => setState({ ...state, on: state.on.map((v, j) => (j === i ? !v : v)) })}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: state.on[i] }}
            accessibilityLabel={it.detail ? `${it.title}. ${it.detail}` : it.title}
            style={styles.row}
          >
            <View style={[styles.check, state.on[i] && { backgroundColor: color, borderColor: color }]}>{state.on[i] ? <Icon name="check" size={12} color={colors.flameInk} strokeWidth={3} /> : null}</View>
            <View style={styles.flex}>
              <Text style={[styles.title, !state.on[i] && styles.off]}>{it.title}</Text>
              {it.detail ? <Text style={styles.detail}>{it.detail}</Text> : null}
            </View>
          </Pressy>
        ))}
        <View style={styles.actions}>
          <Button
            label={addLabel(picked.length)}
            icon="check"
            size="sm"
            disabled={!picked.length}
            onPress={() => {
              onAdd(picked);
              setState({ kind: 'idle' });
            }}
          />
          <Button label="Never mind" variant="ghost" size="sm" onPress={() => setState({ kind: 'idle' })} />
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={styles.wrap}>
      {watch && soundsLikeCrisis(watch) ? <HelpCard /> : null}
      <Button
        label={state.kind === 'loading' ? 'Thinking…' : label}
        icon="sparkle"
        variant="secondary"
        size="sm"
        onPress={run}
        disabled={disabled || state.kind === 'loading'}
        style={styles.btn}
      />
      {state.kind === 'error' ? (
        <Animated.Text entering={FadeIn} style={styles.error}>
          {aiFailLine(state.reason)}
        </Animated.Text>
      ) : (
        <Text style={styles.sends}>{sends}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    gap: 6,
  },
  btn: {
    alignSelf: 'flex-start',
  },
  sends: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textFaint,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  box: {
    marginTop: 12,
    padding: 12,
    gap: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    backgroundColor: colors.surfaceSunk,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  check: {
    width: 20,
    height: 20,
    marginTop: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
  },
  off: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
  detail: {
    marginTop: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
});
