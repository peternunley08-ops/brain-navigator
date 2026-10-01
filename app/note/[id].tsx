import * as Haptics from '../../core/haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { AIPicker, type PickItem } from '../../components/ember/AIPicker';
import { emberSay } from '../../components/ember/EmberBuddy';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { offerUndo } from '../../core/undoStore';
import { addDays, dateKey } from '../../core/dates';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { Chip, ChipRow } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { Icon, type IconName } from '../../components/ui/Icon';
import { IconButton } from '../../components/ui/IconButton';
import { Pressy } from '../../components/ui/Pressy';
import { Screen } from '../../components/ui/Screen';
import { type BlockType, type NoteBlock, uid, useHubStore } from '../../core/hubStore';
import { parseCards, useLifeStore } from '../../core/lifeStore';
import { essayWords, wordGoalFor } from '../../core/words';
import { askJob } from '../../core/emberAI';
import { useSchoolStore } from '../../core/schoolStore';
import { alpha, colors, fonts } from '../../core/theme';

const ADDERS: { type: BlockType; label: string; icon: IconName }[] = [
  { type: 'text', label: 'Text', icon: 'pen' },
  { type: 'heading', label: 'Heading', icon: 'flag' },
  { type: 'todo', label: 'Checklist', icon: 'check' },
  { type: 'bullet', label: 'Bullet', icon: 'minus' },
  { type: 'numbered', label: 'Numbered', icon: 'list' },
  { type: 'quote', label: 'Quote', icon: 'quote' },
  { type: 'divider', label: 'Divider', icon: 'minus' },
];

// Type these at the start of a line and it turns into that kind of block.
const SHORTCUTS: [RegExp, BlockType][] = [
  [/^#{1,3} /, 'heading'],
  [/^[-*] /, 'bullet'],
  [/^\[ ?\] /, 'todo'],
  [/^> /, 'quote'],
  [/^1[.)] /, 'numbered'],
];

// A block's own prefix, if the native field still shows it after converting.
const OWN_PREFIX: Partial<Record<BlockType, RegExp>> = {
  heading: /^#{1,3} /,
  bullet: /^[-*] /,
  todo: /^\[ ?\] /,
  quote: /^> /,
  numbered: /^1[.)] /,
};


// Plain text for sharing: headings, bullets, checkboxes, numbers.
function asText(title: string, blocks: NoteBlock[]) {
  let n = 0;
  const lines = blocks.map((b) => {
    n = b.type === 'numbered' ? n + 1 : 0;
    if (b.type === 'heading') return `\n${b.text.toUpperCase()}`;
    if (b.type === 'bullet') return `• ${b.text}`;
    if (b.type === 'todo') return `${b.checked ? '☑' : '☐'} ${b.text}`;
    if (b.type === 'numbered') return `${n}. ${b.text}`;
    if (b.type === 'quote') return `“${b.text}”`;
    if (b.type === 'divider') return '———';
    return b.text;
  });
  return `${title || 'Untitled'}\n${lines.join('\n')}`.trim();
}

// A page: a title and a list of blocks. Return on a heading, bullet, or
// checklist line starts a new line of the same kind; Backspace on an empty
// line removes it — the way Notion feels.
export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const note = useHubStore((s) => s.notes.find((n) => n.id === id));
  const updateNote = useHubStore((s) => s.updateNote);
  const deleteNote = useHubStore((s) => s.deleteNote);
  const classes = useSchoolStore((s) => s.classes);
  const refs = useRef<Record<string, TextInput | null>>({});
  // A block that just changed type and should grab focus the moment its new field mounts.
  const refocus = useRef<string | null>(null);
  // Flashcards from this page: which new lines are picked, while the preview is open.
  const [cardPick, setCardPick] = useState<string[] | null>(null);
  const decks = useLifeStore((s) => s.decks);
  // Which AI study help is picked under the page.
  const [aiMode, setAiMode] = useState<'cards' | 'points' | 'practice'>('cards');

  if (!note) {
    return (
      <Screen nav={false}>
        <EmptyState title="This page is gone." />
      </Screen>
    );
  }

  const setBlocks = (blocks: NoteBlock[]) => updateNote(note.id, { blocks });
  const focus = (blockId: string) => setTimeout(() => refs.current[blockId]?.focus(), 60);

  const insertAfter = (index: number, type: BlockType) => {
    const block: NoteBlock = { id: uid(), type, text: '', ...(type === 'todo' ? { checked: false } : {}) };
    const blocks = [...note.blocks];
    blocks.splice(index + 1, 0, block);
    setBlocks(blocks);
    focus(block.id);
  };

  const change = (index: number, text: string) => {
    const blocks = [...note.blocks];
    const cur = blocks[index];
    // Markdown-style shortcuts at the start of a plain line.
    if (cur.type === 'text' || cur.type === 'bullet') {
      if (text === '---') {
        blocks[index] = { ...cur, type: 'divider', text: '' };
        const next: NoteBlock = { id: uid(), type: 'text', text: '' };
        blocks.splice(index + 1, 0, next);
        setBlocks(blocks);
        focus(next.id);
        return;
      }
      for (const [re, type] of SHORTCUTS) {
        if (re.test(text) && (cur.type === 'text' || type !== 'bullet')) {
          blocks[index] = { ...cur, type, text: text.replace(re, ''), ...(type === 'todo' ? { checked: false } : {}) };
          setBlocks(blocks);
          Haptics.selectionAsync().catch(() => {});
          // The field remounts for its new type; put the cursor back in it.
          refocus.current = cur.id;
          return;
        }
      }
    }
    const own = OWN_PREFIX[cur.type];
    blocks[index] = { ...cur, text: own ? text.replace(own, '') : text };
    setBlocks(blocks);
  };

  const toAssignment = (blk: NoteBlock) => {
    const a = useSchoolStore.getState().addAssignment({
      title: blk.text.trim(),
      classId: note.classId,
      kind: 'homework',
      due: addDays(dateKey(), 1),
      minutes: null,
      notes: `From the note “${note.title || 'Untitled'}”`,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    emberSay(`“${a.title}” is on your School list, due tomorrow. Change the date if you need to.`, 'happy');
  };

  // "term — definition" lines (or "term :: definition") become flashcards.
  const pairs = parseCards(
    note.blocks
      .filter((b) => b.type === 'text' || b.type === 'bullet' || b.type === 'numbered')
      .map((b) => b.text)
      .join('\n')
  );
  const deckName = note.title.trim() || 'From my notes';
  // The deck this page feeds: linked by id, or an older one with the same name.
  const linked = decks.find((d) => d.noteId === note.id) ?? decks.find((d) => d.name === deckName);
  const have = new Set((linked?.cards ?? []).map((c) => c.front.toLowerCase()));
  const fresh = pairs.filter((p) => !have.has(p.front.toLowerCase()));
  const makeCards = () => {
    const life = useLifeStore.getState();
    const cls = classes.find((c) => c.id === note.classId);
    const deck = linked ?? life.saveDeck({ name: deckName, classId: note.classId, color: cls?.color ?? note.color });
    if (deck.noteId !== note.id) life.updateDeck(deck.id, { noteId: note.id });
    const chosen = fresh.filter((p) => cardPick?.includes(p.front));
    if (chosen.length) life.addCards(deck.id, chosen);
    setCardPick(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    emberSay(`${chosen.length} flashcard${chosen.length === 1 ? '' : 's'} ${linked ? `added to “${deck.name}”` : 'made from this page'}.`, 'happy');
    router.push(`/deck/${deck.id}`);
  };

  // AI study help from this page. Cards and practice questions go into the
  // page's deck; key points go at the bottom of the page.
  const pageText = asText(note.title, note.blocks);
  const pageHasText = pageText.replace(/\s+/g, ' ').length >= 60;
  const toDeck = (picked: PickItem[]) => {
    const life = useLifeStore.getState();
    const cls = classes.find((c) => c.id === note.classId);
    const deck = linked ?? life.saveDeck({ name: deckName, classId: note.classId, color: cls?.color ?? note.color });
    if (deck.noteId !== note.id) life.updateDeck(deck.id, { noteId: note.id });
    life.addCards(deck.id, picked.map((p) => ({ front: p.title, back: p.detail ?? '' })));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    emberSay(`${picked.length} card${picked.length === 1 ? '' : 's'} added to “${deck.name}”. Quizzo can play them with you.`, 'happy');
  };
  const AI_MODES = {
    cards: {
      chip: 'Flashcards',
      label: 'Make flashcards',
      add: (k: number) => `Add ${k} card${k === 1 ? '' : 's'}`,
      load: async () => {
        const res = await askJob<{ cards: { front: string; back: string }[] }>('cards', pageText.slice(0, 7500), { who: 'cards' });
        return res.ok ? { ok: true as const, items: res.data.cards.map((c) => ({ title: c.front, detail: c.back })) } : res;
      },
      onAdd: toDeck,
    },
    practice: {
      chip: 'Practice test',
      label: 'Write practice questions',
      add: (k: number) => `Add ${k} to the deck`,
      load: async () => {
        const res = await askJob<{ questions: { q: string; a: string }[] }>('practice', pageText.slice(0, 7500), { who: 'practice' });
        return res.ok ? { ok: true as const, items: res.data.questions.map((q) => ({ title: q.q, detail: q.a })) } : res;
      },
      onAdd: toDeck,
    },
    points: {
      chip: 'Key points',
      label: 'Pull out key points',
      add: (k: number) => `Add ${k} to this page`,
      load: async () => {
        const res = await askJob<{ points: string[] }>('points', pageText.slice(0, 7500), { who: 'points' });
        return res.ok ? { ok: true as const, items: res.data.points.map((t) => ({ title: t })) } : res;
      },
      onAdd: (picked: PickItem[]) => {
        const before = note.blocks;
        setBlocks([...note.blocks, { id: uid(), type: 'heading', text: 'Key points' }, ...picked.map((p) => ({ id: uid(), type: 'bullet' as const, text: p.title }))]);
        offerUndo('Key points added', () => setBlocks(before), 'list');
      },
    },
  } as const;

  // Headings don't count toward an essay's limit.
  const words = essayWords(note.blocks);
  const isEssay = /essay|personal statement|supplement|brainstorm/i.test(note.title) || note.icon === 'feather';
  // An essay's word limit: 650 (the Common App) unless you pick another; none for other pages.
  const goal = wordGoalFor(note);
  let numbered = 0;

  const remove = (index: number) => {
    if (note.blocks.length <= 1) return;
    const prev = note.blocks[index - 1];
    setBlocks(note.blocks.filter((_, i) => i !== index));
    if (prev) focus(prev.id);
  };

  const check = (index: number) => {
    Haptics.selectionAsync().catch(() => {});
    const blocks = [...note.blocks];
    blocks[index] = { ...blocks[index], checked: !blocks[index].checked };
    setBlocks(blocks);
  };

  return (
    <Screen
      nav={false}
      glowColor={note.color}
      right={
        <View style={styles.headerBtns}>
          <IconButton icon="timer" label="Focus on this page" onPress={() => router.push({ pathname: '/focus', params: { topic: note.title || 'Notes' } })} />
          <IconButton icon="share" label="Share as text" onPress={() => Share.share({ message: asText(note.title, note.blocks) })} />
          <IconButton
            icon="pin"
            label={note.pinned ? 'Unpin' : 'Pin to top'}
            tint={note.pinned ? colors.flame : undefined}
            onPress={() => updateNote(note.id, { pinned: !note.pinned })}
          />
          <IconButton
            icon="trash"
            label="Delete page"
            onPress={() => {
              const snap = note;
              deleteNote(note.id);
              offerUndo(`Deleted “${snap.title || 'Untitled'}”`, () => useHubStore.getState().restoreNote(snap));
              router.back();
            }}
          />
        </View>
      }
    >
      <View style={[styles.iconTile, { backgroundColor: alpha(note.color, 0.16), borderColor: alpha(note.color, 0.35) }]}>
        <Icon name={note.icon as IconName} size={26} color={note.color} />
      </View>
      <TextInput
        style={styles.title}
        defaultValue={note.title}
        onChangeText={(t) => updateNote(note.id, { title: t })}
        placeholder="Untitled"
        placeholderTextColor={colors.hint}
        selectionColor={colors.flame}
        multiline
        blurOnSubmit
        returnKeyType="next"
        onSubmitEditing={() => note.blocks[0] && focus(note.blocks[0].id)}
      />
      {classes.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classes}>
          {classes
            .filter((c) => c.kind === 'class')
            .map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                dot
                color={c.color}
                selected={note.classId === c.id}
                onPress={() => updateNote(note.id, { classId: note.classId === c.id ? null : c.id })}
              />
            ))}
        </ScrollView>
      ) : null}

      <View style={styles.blocks}>
        {note.blocks.map((blk, i) => {
          numbered = blk.type === 'numbered' ? numbered + 1 : 0;
          if (blk.type === 'divider') {
            return (
              <Pressy key={blk.id} onLongPress={() => remove(i)} accessibilityLabel="Divider" accessibilityHint="Hold to remove" style={styles.dividerRow}>
                <View style={styles.divider} />
              </Pressy>
            );
          }
          return (
          <Animated.View key={blk.id} layout={LinearTransition.duration(180)} entering={FadeIn.duration(160)} style={[styles.blockRow, blk.type === 'quote' && [styles.quoteRow, { borderLeftColor: note.color }]]}>
            {blk.type === 'numbered' ? (
              <Text style={styles.number}>{numbered}.</Text>
            ) : blk.type === 'todo' ? (
              <Pressy onPress={() => check(i)} depth={0.85} hitSlop={8} style={[styles.box, blk.checked && styles.boxOn]} accessibilityRole="checkbox" accessibilityState={{ checked: !!blk.checked }}>
                {blk.checked ? <Icon name="check" size={13} color={colors.flameInk} strokeWidth={3} /> : null}
              </Pressy>
            ) : blk.type === 'bullet' ? (
              <Text style={styles.bullet}>•</Text>
            ) : null}
            <TextInput
              // Remount when the block changes type, so the native field
              // picks up the new font and the text without its "# " prefix.
              key={blk.type}
              ref={(r) => {
                refs.current[blk.id] = r;
                if (r && refocus.current === blk.id) {
                  refocus.current = null;
                  r.focus();
                }
              }}
              style={[
                styles.input,
                blk.type === 'heading' && styles.heading,
                blk.type === 'quote' && styles.quote,
                blk.type === 'todo' && blk.checked && styles.checked,
              ]}
              // The field owns its text; the store just follows. A controlled
              // value fights fast typing (the store lags a keystroke behind).
              defaultValue={blk.text}
              onChangeText={(t) => change(i, t)}
              placeholder={
                blk.type === 'heading'
                  ? 'Heading'
                  : blk.type === 'todo'
                    ? 'To do'
                    : blk.type === 'bullet' || blk.type === 'numbered'
                      ? 'List item'
                      : blk.type === 'quote'
                        ? 'A quote worth keeping'
                        : i === 0
                          ? 'Start writing… (try “# ”, “- ”, “[] ”)'
                          : ''
              }
              placeholderTextColor={colors.hint}
              selectionColor={colors.flame}
              // Every line wraps; on list lines and headings Return still starts the next line.
              multiline
              submitBehavior={blk.type === 'text' || blk.type === 'quote' ? 'newline' : 'submit'}
              returnKeyType={blk.type === 'text' ? 'default' : 'next'}
              onSubmitEditing={() => blk.type !== 'text' && blk.type !== 'quote' && insertAfter(i, blk.type === 'heading' ? 'text' : blk.type)}
              onKeyPress={(e) => {
                if (e.nativeEvent.key === 'Backspace' && blk.text === '') remove(i);
              }}
            />
            {blk.type === 'todo' && blk.text.trim() && !blk.checked ? (
              <Pressy onPress={() => toAssignment(blk)} hitSlop={8} style={styles.toSchool} accessibilityLabel={`Add “${blk.text}” to School`}>
                <Icon name="book" size={15} color={colors.textFaint} />
              </Pressy>
            ) : null}
          </Animated.View>
          );
        })}
      </View>

      <View style={styles.count}>
        <Text style={styles.countText}>
          {words} word{words === 1 ? '' : 's'}
          {goal ? ` of ${goal}` : ''}
        </Text>
        {goal ? <ProgressBar value={words / goal} color={words > goal ? colors.danger : note.color} height={4} style={styles.countBar} /> : null}
        {goal && words > goal ? (
          <Text style={styles.over}>
            {words - goal} over the {goal === 650 ? 'Common App' : `${goal}-word`} limit
          </Text>
        ) : null}
        {isEssay || goal ? (
          <View style={styles.limits}>
            <Text style={styles.limitLabel}>Word limit</Text>
            {[150, 250, 350, 500, 650].map((n) => (
              <Pressy
                key={n}
                onPress={() => updateNote(note.id, { wordGoal: goal === n ? null : n })}
                depth={0.9}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityState={{ selected: goal === n }}
                style={[styles.limit, goal === n && { borderColor: note.color, backgroundColor: alpha(note.color, 0.14) }]}
              >
                <Text style={[styles.limitText, goal === n && { color: note.color }]}>{n}</Text>
              </Pressy>
            ))}
          </View>
        ) : null}
        {pairs.length >= 2 && !cardPick ? (
          <Pressy
            onPress={() => (fresh.length ? setCardPick(fresh.map((p) => p.front)) : linked && router.push(`/deck/${linked.id}`))}
            style={styles.makeCards}
            accessibilityRole="button"
          >
            <Icon name="cards" size={15} color={colors.flame} />
            <Text style={styles.makeCardsText}>
              {!linked
                ? `Make ${fresh.length} flashcards from this page`
                : fresh.length
                  ? `Add ${fresh.length} new card${fresh.length === 1 ? '' : 's'} to “${linked.name}”`
                  : `Cards are up to date. Open “${linked.name}”`}
            </Text>
          </Pressy>
        ) : null}
        {pageHasText && !cardPick ? (
          <View style={styles.aiStudy}>
            <ChipRow>
              {(Object.keys(AI_MODES) as (keyof typeof AI_MODES)[]).map((k) => (
                <Chip key={k} label={AI_MODES[k].chip} icon={k === 'points' ? 'list' : 'cards'} selected={aiMode === k} color={note.color} onPress={() => setAiMode(k)} />
              ))}
            </ChipRow>
            <AIPicker
              key={aiMode}
              label={AI_MODES[aiMode].label}
              sends="Sends this page’s title and text to Claude. Only what’s on this page."
              color={note.color}
              load={AI_MODES[aiMode].load}
              addLabel={AI_MODES[aiMode].add}
              onAdd={AI_MODES[aiMode].onAdd}
            />
          </View>
        ) : null}
        {cardPick ? (
          <Animated.View entering={FadeIn.duration(180)} style={styles.pick}>
            {fresh.map((p) => {
              const on = cardPick.includes(p.front);
              return (
                <Pressy
                  key={p.front}
                  onPress={() => setCardPick(on ? cardPick.filter((f) => f !== p.front) : [...cardPick, p.front])}
                  style={styles.pickRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${p.front}: ${p.back}`}
                >
                  <View style={[styles.box, on && styles.boxOn]}>{on ? <Icon name="check" size={12} color={colors.flameInk} strokeWidth={3} /> : null}</View>
                  <View style={styles.flexCol}>
                    <Text style={styles.pickFront}>{p.front}</Text>
                    <Text style={styles.pickBack}>{p.back}</Text>
                  </View>
                </Pressy>
              );
            })}
            <View style={styles.pickBtns}>
              <Pressy onPress={() => setCardPick(null)} style={styles.pickCancel} accessibilityRole="button">
                <Text style={styles.pickCancelText}>Cancel</Text>
              </Pressy>
              <Pressy onPress={makeCards} disabled={!cardPick.length} style={[styles.makeCards, styles.pickGo, !cardPick.length && styles.dim]} accessibilityRole="button">
                <Icon name="cards" size={15} color={colors.flame} />
                <Text style={styles.makeCardsText}>
                  {linked ? 'Add' : 'Make'} {cardPick.length} card{cardPick.length === 1 ? '' : 's'}
                </Text>
              </Pressy>
            </View>
          </Animated.View>
        ) : null}
      </View>

      <View style={styles.toolbar}>
        <ChipRow>
          {ADDERS.map((a) => (
            <Chip key={a.type} label={a.label} icon={a.icon} onPress={() => insertAfter(note.blocks.length - 1, a.type)} />
          ))}
        </ChipRow>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  aiStudy: {
    marginTop: 16,
  },
  limits: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  limitLabel: {
    marginRight: 4,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  limit: {
    paddingHorizontal: 9,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'center',
  },
  limitText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  pick: {
    marginTop: 12,
    alignSelf: 'stretch',
    gap: 8,
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  flexCol: {
    flex: 1,
  },
  pickFront: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.text,
  },
  pickBack: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  pickBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  pickCancel: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pickCancelText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.textMuted,
  },
  pickGo: {
    marginTop: 0,
    alignSelf: 'auto',
  },
  dim: {
    opacity: 0.4,
  },
  makeCards: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: alpha(colors.flame, 0.4),
    backgroundColor: alpha(colors.flame, 0.08),
  },
  makeCardsText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.flame,
  },
  headerBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  iconTile: {
    marginTop: 16,
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 12,
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    color: colors.text,
    padding: 0,
  },
  classes: {
    gap: 6,
    paddingTop: 12,
    paddingRight: 8,
  },
  blocks: {
    marginTop: 18,
    gap: 4,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  box: {
    marginTop: 9,
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    backgroundColor: colors.secured,
    borderColor: colors.secured,
  },
  bullet: {
    marginTop: 5,
    width: 12,
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.flame,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    minHeight: 36,
    paddingVertical: 7,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 23,
    color: colors.text,
  },
  heading: {
    marginTop: 10,
    fontFamily: fonts.display,
    fontSize: 21,
    lineHeight: 27,
  },
  quote: {
    fontFamily: fonts.displaySoft,
    fontSize: 17,
    color: colors.textMuted,
  },
  quoteRow: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    marginVertical: 4,
  },
  number: {
    marginTop: 7,
    minWidth: 18,
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    lineHeight: 23,
    color: colors.flame,
  },
  dividerRow: {
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lineStrong,
  },
  toSchool: {
    marginTop: 10,
  },
  count: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  countText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textFaint,
  },
  countBar: {
    marginTop: 6,
    width: 140,
  },
  over: {
    marginTop: 4,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.danger,
  },
  checked: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
  toolbar: {
    marginTop: 24,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
