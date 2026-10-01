import * as Haptics from '../../core/haptics';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { type AIFailure, askHelper, whyOffline } from '../../core/emberAI';
import type { Helper } from '../../core/helpers';
import { type NoteBlock, uid, useHubStore } from '../../core/hubStore';
import { type HelperTurn, useLifeStore } from '../../core/lifeStore';
import { offerUndo } from '../../core/undoStore';
import { alpha, colors, fonts, radii } from '../../core/theme';
import type { EmberRig } from '../ember/useEmberRig';
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
  const [thinking, setThinking] = useState(false);
  const [failure, setFailure] = useState<AIFailure | null>(null);
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
    const next: HelperTurn[] = [...turnsRef.current, { role: 'user', content: text }];
    setTurns(next);
    setDraft('');
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
  };

  return (
    <View style={styles.wrap}>
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
                <Text style={[styles.who, { color: helper.color }]}>{helper.name}</Text>
                <Text style={styles.text}>{t.content}</Text>
              </Pressy>
            ) : (
              <View style={[styles.bubble, t.role === 'assistant' ? [styles.fromHelper, { borderColor: alpha(helper.color, 0.35) }] : styles.fromYou]}>
                {t.role === 'assistant' ? <Text style={[styles.who, { color: helper.color }]}>{helper.name}</Text> : null}
                <Text style={[styles.text, t.role === 'user' && styles.textYou]}>{t.content}</Text>
              </View>
            )}
          </Animated.View>
        ))}
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
          <Button label={helper.offlineLabel} icon="arrow" variant="secondary" size="sm" onPress={onUseOffline} style={styles.noticeBtn} />
        </Animated.View>
      ) : null}

      {helper.id === 'sage' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipScroll} keyboardShouldPersistTaps="handled">
          {LEVELS.map((l) => (
            <Chip key={l.key} label={l.label} color={helper.color} selected={level === l.key} onPress={() => setLevel(l.key)} />
          ))}
        </ScrollView>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipScroll} keyboardShouldPersistTaps="handled">
        {helper.chips.map((c) => (
          <Chip key={c} label={c} color={helper.color} onPress={() => send(c)} />
        ))}
      </ScrollView>
      <View style={styles.inputRow}>
        <Field value={draft} onChangeText={setDraft} placeholder={`Message ${helper.name}`} multiline containerStyle={styles.flex} style={styles.input} />
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
