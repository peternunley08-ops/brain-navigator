import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from '../../core/haptics';
import { EMBER_ACTIONS, type EmberReply } from '../../core/emberAI';
import { helperById } from '../../core/helpers';
import { useBrainNavigatorStore } from '../../core/store';
import { useTasksStore } from '../../core/tasksStore';
import { alpha, colors, fonts, radii } from '../../core/theme';
import { offerUndo } from '../../core/undoStore';
import { Icon, type IconName } from '../ui/Icon';
import { Pressy } from '../ui/Pressy';

type Extras = Pick<EmberReply, 'actions' | 'todo' | 'setdown' | 'focus' | 'helper' | 'open' | 'remember'>;

interface Offer {
  key: string;
  icon: IconName;
  text: string;
  button: string;
  done: string;
  run: () => Promise<boolean> | boolean;
}

// Everything an AI reply suggests, as buttons. Nothing happens until the
// student taps, and anything added can be undone from the toast.
export function ReplyExtras({ reply, color = colors.flame, onRemember }: { reply: Extras; color?: string; onRemember?: (fact: string) => void }) {
  const [taken, setTaken] = useState<Record<string, boolean>>({});

  const offers: Offer[] = [];
  if (reply.todo) {
    const title = reply.todo;
    offers.push({
      key: 'todo',
      icon: 'plate',
      text: title,
      button: 'Add to-do',
      done: 'On your plate',
      run: async () => {
        const ok = await useTasksStore.getState().addTask(title, 'occupational');
        if (ok) {
          offerUndo('Added to your plate', () => {
            const t = [...useTasksStore.getState().tasks].reverse().find((x) => x.title === title);
            if (t) useTasksStore.getState().deleteTask(t.id);
          }, 'plate');
        }
        return ok;
      },
    });
  }
  if (reply.setdown) {
    const { title, weight } = reply.setdown;
    offers.push({
      key: 'setdown',
      icon: 'candle',
      text: `${title} (weight ${weight})`,
      button: 'Set it down',
      done: 'Opened',
      run: () => {
        const s = useBrainNavigatorStore.getState();
        s.setDraftMood(title);
        s.setDraftIntensity(weight);
        router.push('/new-entry');
        return true;
      },
    });
  }
  if (reply.focus) {
    const { minutes, what } = reply.focus;
    offers.push({
      key: 'focus',
      icon: 'timer',
      text: `${minutes} minutes${what ? ` on ${what}` : ''}`,
      button: 'Start focus',
      done: 'Started',
      run: () => {
        // Ten minutes or less starts right away (Spark's quick start); longer ones are set up, ready to start.
        router.push({ pathname: '/focus', params: { ...(minutes <= 10 ? { quick: String(minutes) } : { mins: String(minutes) }), ...(what ? { topic: what } : {}) } });
        return true;
      },
    });
  }
  if (reply.open) {
    const ref = reply.open;
    offers.push({
      key: 'open',
      icon: ref.kind === 'assignment' ? 'book' : 'candle',
      text: ref.label,
      button: 'Open',
      done: 'Opened',
      run: () => {
        router.push(ref.kind === 'assignment' ? `/assignment/${ref.id}` : `/entry/${ref.id}`);
        return true;
      },
    });
  }
  const helper = helperById(reply.helper ?? undefined);
  if (helper) {
    offers.push({
      key: 'helper',
      icon: helper.icon,
      text: `${helper.name} is good at this: ${helper.tagline.toLowerCase()}`,
      button: `Ask ${helper.name}`,
      done: 'Opened',
      run: () => {
        router.push({ pathname: '/helper/[id]', params: { id: helper.id } });
        return true;
      },
    });
  }
  if (reply.remember && onRemember) {
    const fact = reply.remember;
    offers.push({
      key: 'remember',
      icon: 'heart',
      text: `Remember: “${fact}”`,
      button: 'Remember',
      done: 'Remembered',
      run: () => {
        onRemember(fact);
        return true;
      },
    });
  }

  if (!reply.actions.length && !offers.length) return null;

  const take = async (o: Offer) => {
    if (taken[o.key]) return;
    Haptics.selectionAsync().catch(() => {});
    const ok = await o.run();
    if (ok) setTaken((t) => ({ ...t, [o.key]: true }));
  };

  return (
    <Animated.View entering={FadeInDown.delay(250).duration(300)} style={styles.wrap}>
      {reply.actions.length ? (
        <View style={styles.actions}>
          {reply.actions.map((a, i) => (
            <Pressy
              key={a}
              style={[styles.action, i === 0 ? { backgroundColor: color } : { borderWidth: 1, borderColor: alpha(color, 0.5) }]}
              depth={0.94}
              onPress={() => router.push(EMBER_ACTIONS[a].href as never)}
              accessibilityRole="button"
            >
              <Icon name={EMBER_ACTIONS[a].icon} size={15} color={i === 0 ? colors.flameInk : color} strokeWidth={2.1} />
              <Text style={[styles.actionText, { color: i === 0 ? colors.flameInk : color }]}>{EMBER_ACTIONS[a].label}</Text>
            </Pressy>
          ))}
        </View>
      ) : null}
      {offers.map((o) => (
        <View key={o.key} style={[styles.offer, { borderColor: alpha(color, 0.3) }]}>
          <Icon name={o.icon} size={16} color={color} />
          <Text style={styles.offerText} numberOfLines={2}>
            {o.text}
          </Text>
          {taken[o.key] ? (
            <Animated.View entering={FadeIn} style={styles.doneRow}>
              <Icon name="check" size={14} color={colors.secured} strokeWidth={2.6} />
              <Text style={styles.doneText}>{o.done}</Text>
            </Animated.View>
          ) : (
            <Pressy style={[styles.offerBtn, { backgroundColor: alpha(color, 0.18) }]} depth={0.94} onPress={() => take(o)} accessibilityRole="button" accessibilityLabel={`${o.button}: ${o.text}`}>
              <Text style={[styles.offerBtnText, { color }]}>{o.button}</Text>
            </Pressy>
          )}
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
  },
  actionText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
  },
  offer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  offerText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
  },
  offerBtn: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    justifyContent: 'center',
  },
  offerBtnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  doneText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.secured,
  },
});
