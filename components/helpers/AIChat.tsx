import * as Haptics from '../../core/haptics';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { type AIFailure, askHelper, askJob, type EmberReply, soundsLikeCrisis, whyOffline } from '../../core/emberAI';
import { useClearOnSend } from '../../core/hooks/useClearOnSend';
import { useTasksStore } from '../../core/tasksStore';
import type { Helper } from '../../core/helpers';
import { type NoteBlock, uid, useHubStore } from '../../core/hubStore';
import { type HelperTurn, useLifeStore } from '../../core/lifeStore';
import { offerUndo } from '../../core/undoStore';
import { alpha, colors, fonts, radii } from '../../core/theme';
import { AIPicker } from '../ember/AIPicker';
import { HelpCard } from '../ember/HelpCard';
import { ReplyExtras } from '../ember/ReplyExtras';
import { RichText } from '../ember/RichText';
import type { EmberRig } from '../ember/useEmberRig';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Field } from '../ui/Field';
import { IconButton } from '../ui/IconButton';
import { Pressy } from '../ui/Pressy';
import { LimitCard } from './Quota';

// Sage's explanation levels: the same idea, pitched where you are.
const LEVELS = [
  { key: '5', label: 'Like I’m 5', line: 'Explain it like I am five: tiny words and one everyday comparison.' },
  { key: '12', label: 'Like I’m 12', line: 'Explain it for a 12-year-old: simple words and one example.' },
  { key: 'hs', label: 'High school', line: 'Explain it at a high school level.' },
  { key: 'deep', label: 'Go deeper', line: 'Go deeper, like an intro college course, using the correct terms.' },
] as const;

interface AIChatProps {
  helper: Helper;
  rig: EmberRig;
  /** What the helper was called about, for its context. */
  extra?: string;
  /** Something to pre-fill the box with. */
  starter?: string;
  onUseOffline: () => void;
}

// A chat with one helper. The conversation is kept per helper, so coming
// back picks up where you left off. Every AI reply counts toward the
// allowance; when it can't answer, it says why and points to the free mode.
export function AIChat({ helper, rig, extra, starter, onUseOffline }: AIChatProps) {
  const saved = useLifeStore((s) => s.helperChats[helper.id]);
  const setChat = useLifeStore((s) => s.setHelperChat);
  const [turns, setTurns] = useState<HelperTurn[]>(saved?.length ? saved : [{ role: 'assistant', content: helper.hello }]);
  const [draft, setDraft] = useState(starter ?? '');
  const box = useClearOnSend(setDraft);
  const [thinking, setThinking] = useState(false);
  const [failure, setFailure] = useState<AIFailure | null>(null);
  // The newest reply's buttons and chips (not saved with the chat).
  const [last, setLast] = useState<EmberReply | null>(null);
  const [crisis, setCrisis] = useState(false);
  // Quizzo's running score, as Quizzo reports it.
  const [score, setScore] = useState<{ right: number; wrong: number } | null>(null);
  const level = useLifeStore((s) => s.settings.sageLevel) ?? 'hs';
  const setLevel = (l: string) => useLifeStore.getState().setSettings({ sageLevel: l });
  const scroll = useRef<ScrollView>(null);
  const turnsRef = useRef(turns);
  turnsRef.current = turns;

  // The helper leans in while you type, and relaxes when you pause.
  useEffect(() => {
    if (thinking || !draft.trim()) return;
    rig.setMood('listening');
    const t = setTimeout(() => rig.setMood('idle'), 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, thinking]);

  // Hold a reply to keep it in the Notebook.
  const keep = (content: string) => {
    const first = content.split(/[.!?\n]/)[0].trim().slice(0, 40);
    const blocks: NoteBlock[] = [{ id: uid(), type: 'text', text: content }];
    const note = useHubStore.getState().createNote({ title: `${helper.name}: ${first}`, icon: 'sparkle', color: helper.color, blocks });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    offerUndo('Saved to your Notebook', () => useHubStore.getState().deleteNote(note.id), 'book');
  };

  useEffect(() => {
    if (starter) setDraft(starter);
  }, [starter]);

  useEffect(() => {
    const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [turns.length, thinking, failure]);

  const send = async (raw?: string) => {
    const text = (raw ?? draft).trim();
    if (!text || thinking) return;
    if (soundsLikeCrisis(text)) setCrisis(true);
    const next: HelperTurn[] = [...turnsRef.current, { role: 'user', content: text }];
    setTurns(next);
    if (!raw) box.clear(text);
    else setDraft('');
    await answer(next);
  };

  // Ask the helper about the chat so far (also used by Try again).
  const answer = async (next: HelperTurn[]) => {
    setLast(null);
    setFailure(null);
    setThinking(true);
    rig.setMood('listening');
    Haptics.selectionAsync().catch(() => {});

    const pitch = helper.id === 'sage' ? LEVELS.find((l) => l.key === level)?.line : undefined;
    const res = await askHelper(helper, next, [extra, pitch].filter(Boolean).join('\n') || undefined);
    setThinking(false);
    if (res.ok) {
      const done: HelperTurn[] = [...next, { role: 'assistant', content: res.reply }];
      setTurns(done);
      setChat(helper.id, done);
      setLast(res);
      if (res.score) setScore(res.score);
      if (res.refused || res.actions.includes('help')) setCrisis(true);
      rig.setMood('happy');
      rig.talk(true);
      setTimeout(() => {
        rig.talk(false);
        rig.setMood('idle');
      }, Math.min(2600, 500 + res.reply.length * 30));
      return;
    }
    setChat(helper.id, next);
    setFailure(res.reason);
    rig.setMood('concerned');
    setTimeout(() => rig.setMood('idle'), 1200);
  };

  const clear = () => {
    const fresh: HelperTurn[] = [{ role: 'assistant', content: helper.hello }];
    setTurns(fresh);
    setChat(helper.id, fresh);
    setFailure(null);
    setLast(null);
    setScore(null);
  };

  const retry = () => {
    const t = turnsRef.current;
    if (t.length && t[t.length - 1].role === 'user') answer(t);
  };
  // Pip's plan, turned into time blocks and put on the plate as to-dos.
  const loadPlan = async () => {
    const transcript = turnsRef.current
      .slice(-8)
      .map((t) => `${t.role === 'assistant' ? helper.name : 'Student'}: ${t.content}`)
      .join('\n');
    const res = await askJob<{ blocks: { start: string; minutes: number; title: string; kind: 'work' | 'break' }[] }>('plan', transcript, { who: 'plan' });
    if (!res.ok) return res;
    return {
      ok: true as const,
      items: res.data.blocks.filter((b) => b.kind === 'work').map((b) => ({ title: `${clock12(b.start)} ${b.title}`, detail: `${b.minutes} min` })),
    };
  };
  const addPlan = async (picked: { title: string; detail?: string }[]) => {
    const added: string[] = [];
    for (const p of picked) {
      if (await useTasksStore.getState().addTask(p.title, 'occupational', parseInt(p.detail ?? '', 10) || null)) added.push(p.title);
    }
    if (!added.length) return;
    offerUndo(`${added.length} block${added.length === 1 ? '' : 's'} on your plate`, () => {
      for (const title of added) {
        const t = [...useTasksStore.getState().tasks].reverse().find((x) => x.title === title);
        if (t) useTasksStore.getState().deleteTask(t.id);
      }
    }, 'plate');
  };

  // The helper's own suggestions fit the moment; its fixed chips are the fallback.
  const chips = last?.chips.length ? last.chips : helper.chips;

  return (
    <View style={styles.wrap}>
      {score ? (
        <View style={[styles.score, { borderColor: alpha(helper.color, 0.4) }]} accessibilityLabel={`Score: ${score.right} right, ${score.wrong} wrong`}>
          <Icon name="trophy" size={14} color={helper.color} />
          <Text style={[styles.scoreText, { color: helper.color }]}>{score.right} right</Text>
          <Text style={styles.scoreMuted}>{score.wrong} missed</Text>
        </View>
      ) : null}
      <ScrollView ref={scroll} style={styles.chat} contentContainerStyle={styles.chatContent} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        {turns.map((t, i) => (
          <Animated.View key={i} entering={(t.role === 'assistant' ? FadeInUp : FadeInDown).duration(300)}>
            {t.role === 'assistant' && i > 0 ? (
              <Pressy
                onLongPress={() => keep(t.content)}
                depth={0.98}
                accessibilityLabel={`${helper.name} said: ${t.content}`}
                accessibilityHint="Hold to save this reply to your Notebook"
                style={[styles.bubble, styles.fromHelper, { borderColor: alpha(helper.color, 0.35) }]}
              >
                <View style={styles.whoRow}>
                  <Text style={[styles.who, { color: helper.color }]}>{helper.name}</Text>
                  <Icon name="sparkle" size={9} color={colors.textFaint} />
                </View>
                <RichText text={t.content} style={styles.text} reveal={i === turns.length - 1 && !!last} />
              </Pressy>
            ) : (
              <View style={[styles.bubble, t.role === 'assistant' ? [styles.fromHelper, { borderColor: alpha(helper.color, 0.35) }] : styles.fromYou]}>
                {t.role === 'assistant' ? <Text style={[styles.who, { color: helper.color }]}>{helper.name}</Text> : null}
                <Text style={[styles.text, t.role === 'user' && styles.textYou]}>{t.content}</Text>
              </View>
            )}
          </Animated.View>
        ))}
        {last && !thinking ? <ReplyExtras reply={last} color={helper.color} /> : null}

        {thinking ? (
          <Animated.View entering={FadeIn} style={[styles.bubble, styles.fromHelper, { borderColor: alpha(helper.color, 0.35) }]}>
            <Text style={[styles.who, { color: helper.color }]}>{helper.name}</Text>
            <Text style={styles.dots}>thinking…</Text>
          </Animated.View>
        ) : null}
      </ScrollView>

      {failure === 'limit' ? (
        <LimitCard offlineLabel={helper.offlineLabel} onOffline={onUseOffline} />
      ) : failure ? (
        <Animated.View entering={FadeInDown} style={styles.notice}>
          <Text style={styles.noticeText}>{whyOffline(failure)
              .replace('My thinking brain', `${helper.name}’s AI brain`)
              .replace('I can’t reach my thinking brain', `${helper.name} can’t reach its AI brain`)
              .replace('so I’ll use my own questions for now', `but ${helper.name} can still help right on your phone`)}</Text>
          <View style={styles.noticeRow}>
            {failure === 'busy' || failure === 'timeout' || failure === 'offline' || failure === 'unavailable' ? (
              <Button label="Try again" icon="repeat" size="sm" onPress={retry} style={styles.noticeBtn} />
            ) : null}
            <Button label={helper.offlineLabel} icon="arrow" variant="secondary" size="sm" onPress={onUseOffline} style={styles.noticeBtn} />
          </View>
        </Animated.View>
      ) : null}

      {last?.plan && !thinking ? (
        <AIPicker
          label="Put this on tonight"
          sends={`Sends this chat with ${helper.name} to Claude to turn it into time blocks.`}
          color={helper.color}
          load={loadPlan}
          addLabel={(k) => `Add ${k} to my plate`}
          onAdd={addPlan}
        />
      ) : null}
      {crisis ? (
        <View style={styles.helpWrap}>
          <HelpCard />
        </View>
      ) : null}
      {helper.id === 'sage' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipScroll} keyboardShouldPersistTaps="handled">
          {LEVELS.map((l) => (
            <Chip key={l.key} label={l.label} color={helper.color} selected={level === l.key} onPress={() => setLevel(l.key)} />
          ))}
        </ScrollView>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipScroll} keyboardShouldPersistTaps="handled">
        {chips.map((c) => (
          <Chip key={c} label={c} color={helper.color} onPress={() => send(c)} />
        ))}
      </ScrollView>
      <View style={styles.inputRow}>
        <Field ref={box.input} value={draft} onChangeText={box.onChangeText} placeholder={`Message ${helper.name}`} multiline containerStyle={styles.flex} style={styles.input} />
        <IconButton icon="arrow" label="Send" tint={helper.color} onPress={() => send()} />
      </View>
      {turns.some((t, i) => t.role === 'assistant' && i > 0) ? <Text style={styles.hint}>Hold a reply to save it to your Notebook.</Text> : null}
      <Button label="Start a new chat" variant="ghost" size="sm" onPress={clear} style={styles.clear} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  wrap: {
    marginTop: 14,
  },
  chat: {
    maxHeight: 420,
  },
  chatContent: {
    gap: 10,
    paddingBottom: 6,
  },
  bubble: {
    maxWidth: '86%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radii.lg,
  },
  fromHelper: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderBottomLeftRadius: 6,
  },
  fromYou: {
    alignSelf: 'flex-end',
    backgroundColor: alpha(colors.flame, 0.16),
    borderBottomRightRadius: 6,
  },
  who: {
    marginBottom: 2,
    fontFamily: fonts.bodySemi,
    fontSize: 11,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },
  textYou: {
    color: colors.flameHot,
  },
  dots: {
    fontFamily: fonts.displaySoft,
    fontSize: 15,
    color: colors.textMuted,
  },
  notice: {
    marginTop: 12,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSunk,
    borderWidth: 1,
    borderColor: colors.line,
  },
  noticeText: {
    fontFamily: fonts.displaySoft,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  noticeBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  helpWrap: {
    marginTop: 12,
  },
  noticeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  whoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  score: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  scoreText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
  },
  scoreMuted: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  chipScroll: {
    marginTop: 12,
    marginHorizontal: -20,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  input: {
    minHeight: 50,
    maxHeight: 130,
  },
  hint: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
  },
  clear: {
    alignSelf: 'center',
    marginTop: 6,
  },
});

/** "19:30" → "7:30 pm" */
function clock12(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h)) return hhmm;
  return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}
