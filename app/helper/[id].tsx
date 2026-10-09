import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { springs } from '../../core/motion';
import { EmberSprite } from '../../components/ember/EmberSprite';
import { Sparks } from '../../components/ember/Sparks';
import { useEmberRig } from '../../components/ember/useEmberRig';
import { AIChat } from '../../components/helpers/AIChat';
import { Brainstorm } from '../../components/helpers/Brainstorm';
import { ExplainBack } from '../../components/helpers/ExplainBack';
import { QuizGame } from '../../components/helpers/QuizGame';
import { QuotaPill } from '../../components/helpers/Quota';
import { Starter } from '../../components/helpers/Starter';
import { TonightPlan } from '../../components/helpers/TonightPlan';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pressy } from '../../components/ui/Pressy';
import { Screen } from '../../components/ui/Screen';
import { Segmented } from '../../components/ui/Segmented';
import { aboutLine } from '../../core/helperOffline';
import { helperById } from '../../core/helpers';
import { useLifeStore } from '../../core/lifeStore';
import { useSchoolStore } from '../../core/schoolStore';
import { celebrate } from '../../core/celebrateStore';
import { dateKey } from '../../core/dates';
import { alpha, colors, fonts, radii } from '../../core/theme';

type Mode = 'phone' | 'ai';

// The study session combo: Pip plans the night, Quizzo warms you up, Spark gets you going.
const COMBO = [
  { id: 'pip', does: 'Pip plans tonight' },
  { id: 'quizzo', does: 'Quizzo warms you up' },
  { id: 'spark', does: 'Spark gets you started' },
] as const;

/** "earlier today", "yesterday", "on Tuesday", "on Sep 12". */
function whenAgo(iso: string) {
  const d = new Date(iso);
  const key = dateKey(d);
  const today = dateKey();
  const days = Math.round((new Date(today).getTime() - new Date(key).getTime()) / 86400000);
  if (days <= 0) return 'Earlier today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `On ${d.toLocaleDateString('en-US', { weekday: 'long' })}`;
  return `On ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

// One helper, called over. It pops out in a burst of sparks, then offers
// two ways to help: its on-phone mode (free, always works) and an AI chat.
export default function HelperScreen() {
  // `ask`: a first message written for them (from a note, the final-grade math,
  // or the college list). It waits in the box; nothing goes until they send it.
  const { id, about, combo, ask } = useLocalSearchParams<{ id: string; about?: string; combo?: string; ask?: string }>();
  const step = combo != null ? COMBO.findIndex((c) => c.id === id) : -1;
  // Remember the step, so the Helpers screen can offer to pick the session back up.
  useEffect(() => {
    if (step >= 0) useLifeStore.getState().setSettings({ combo: { day: dateKey(), step } });
  }, [step]);
  const last = useLifeStore((s) => (id ? s.helperLast[id] : undefined));
  const helper = helperById(id);
  const rig = useEmberRig();
  const reduced = useReducedMotion();
  const assignments = useSchoolStore((s) => s.assignments);
  const classes = useSchoolStore((s) => s.classes);
  const decks = useLifeStore((s) => s.decks);
  const [mode, setMode] = useState<Mode>('phone');
  const [starter, setStarter] = useState<string | undefined>(undefined);
  const [burst, setBurst] = useState(0);
  // While a game or a chat is going, the stage shrinks so the action fits on screen.
  const [playing, setPlaying] = useState(false);
  const [replay, setReplay] = useState(0);
  const compact = playing || mode === 'ai';

  const a = about ? assignments.find((x) => x.id === about) : undefined;
  useEffect(() => {
    if (about && helper) useLifeStore.getState().noteHelperUse(about, helper.id);
  }, [about, helper]);
  const extra = aboutLine(a, classes);
  const deckForClass = a?.classId ? decks.find((d) => d.classId === a.classId)?.id : undefined;

  // The spawn: shrink to nothing, then spring out with a burst.
  const pop = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced) pop.value = withDelay(120, withSequence(withSpring(1.15, springs.pop), withTiming(1, { duration: 180 })));
    const t = setTimeout(() => {
      setBurst((b) => b + 1);
      rig.setMood('cheer');
      rig.hopUp(18);
    }, 200);
    const t2 = setTimeout(() => rig.setMood('happy'), 1400);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [pop, reduced, rig]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  if (!helper) {
    return (
      <Screen>
        <EmptyState title="That helper wandered off." />
      </Screen>
    );
  }

  // All three steps: planned, warmed up, started.
  const finishCombo = () => {
    useLifeStore.getState().setSettings({ combo: null });
    celebrate('Study session, set', 'Planned, warmed up, and started. Now the candle.', helper.color, {
      key: `combo-${dateKey()}`,
      win: 'Did a full study session warm-up',
    });
    router.replace('/focus');
  };

  const askAI = (text?: string) => {
    setStarter(text);
    setMode('ai');
  };
  useEffect(() => {
    if (ask) askAI(ask);
    // Only when the screen opens with a message.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ask]);

  return (
    <Screen glowColor={helper.color} barTitle={helper.name} right={<QuotaPill />}>
      <View style={styles.stage}>
        <Sparks burst={burst} reach={90} />
        <View style={compact ? styles.compactRow : styles.center}>
          <Animated.View style={popStyle}>
            <EmberSprite rig={rig} size={compact ? 56 : 110} theme={helper.theme} accessory={helper.accessory} seed={helper.id.length * 1.7} />
          </Animated.View>
          <View style={compact ? styles.compactText : styles.center}>
            <Text style={[styles.name, compact && styles.nameCompact]}>{helper.name}</Text>
            {!compact ? (
              <View style={[styles.role, { backgroundColor: alpha(helper.color, 0.14), borderColor: alpha(helper.color, 0.45) }]}>
                <Text style={[styles.roleText, { color: helper.color }]}>{helper.role}</Text>
              </View>
            ) : (
              <Text style={[styles.roleText, { color: helper.color }]}>{helper.role}</Text>
            )}
          </View>
        </View>
        {!compact ? <Text style={styles.tagline}>{helper.tagline}</Text> : null}
        {a && !compact ? <Text style={styles.about}>Called about “{a.title}”</Text> : null}
        {last && !compact && !a ? (
          helper.id === 'quizzo' ? (
            <Pressy onPress={() => setReplay((r) => r + 1)} accessibilityRole="button" accessibilityHint="Starts a new game">
              <Text style={[styles.about, { color: helper.color }]}>
                {whenAgo(last.at)}, {last.line}. Play again?
              </Text>
            </Pressy>
          ) : (
            <Text style={styles.about}>
              {whenAgo(last.at)}, {last.line}.
            </Text>
          )
        ) : null}
      </View>

      {step >= 0 ? (
        <View style={[styles.combo, { borderColor: alpha(helper.color, 0.35) }]}>
          <View style={styles.comboDots}>
            {COMBO.map((c, k) => (
              <View key={c.id} style={[styles.comboDot, { backgroundColor: k <= step ? helper.color : colors.lineStrong }]} />
            ))}
          </View>
          <Text style={styles.comboText} numberOfLines={2}>
            Study session, step {step + 1} of {COMBO.length}: {COMBO[step].does}
          </Text>
          <Button
            label={step + 1 < COMBO.length ? 'Next' : 'Focus'}
            icon="arrow"
            size="sm"
            variant="secondary"
            tint={helper.color}
            onPress={() =>
              step + 1 < COMBO.length
                ? router.replace({ pathname: '/helper/[id]', params: { id: COMBO[step + 1].id, combo: '1', ...(about ? { about } : {}) } })
                : finishCombo()
            }
          />
        </View>
      ) : null}

      <Segmented<Mode>
        options={[
          { key: 'phone', label: helper.offlineLabel },
          { key: 'ai', label: 'AI chat' },
        ]}
        value={mode}
        onChange={setMode}
        style={styles.seg}
      />
      {mode === 'phone' ? (
        <Text style={styles.free}>Free and unlimited. Runs right on your phone.</Text>
      ) : (
        <Text style={styles.free}>Each AI reply uses one from your allowance.</Text>
      )}

      {mode === 'ai' ? (
        <AIChat helper={helper} rig={rig} extra={extra} starter={starter} onUseOffline={() => setMode('phone')} />
      ) : helper.id === 'quizzo' ? (
        <QuizGame rig={rig} deckId={deckForClass} autoStart={replay} onPlaying={setPlaying} onAskAI={() => askAI(a ? `Quiz me for "${a.title}".` : undefined)} />
      ) : helper.id === 'pip' ? (
        <TonightPlan rig={rig} />
      ) : helper.id === 'quill' ? (
        <Brainstorm rig={rig} topic={a?.title} />
      ) : helper.id === 'sage' ? (
        <ExplainBack rig={rig} topic={a?.title} onAskAI={askAI} />
      ) : (
        <Starter rig={rig} assignmentId={a?.id} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    marginTop: 4,
  },
  center: {
    alignItems: 'center',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'stretch',
  },
  compactText: {
    flex: 1,
  },
  nameCompact: {
    marginTop: 0,
    fontSize: 24,
  },
  name: {
    marginTop: 6,
    fontFamily: fonts.display,
    fontSize: 32,
    letterSpacing: -0.6,
    color: colors.text,
  },
  role: {
    marginTop: 6,
    paddingHorizontal: 12,
    height: 26,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
  },
  roleText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
  },
  tagline: {
    marginTop: 8,
    fontFamily: fonts.displaySoft,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  about: {
    marginTop: 4,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textFaint,
  },
  seg: {
    marginTop: 18,
  },
  combo: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  comboDots: {
    gap: 4,
  },
  comboDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  comboText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  free: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
