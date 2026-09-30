import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
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

function wordCount(blocks: NoteBlock[]) {
  return blocks.reduce((s, b) => s + (b.text.trim() ? b.text.trim().split(/\s+/).length : 0), 0);
}

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

  const words = wordCount(note.blocks);
  const isEssay = /essay|personal statement|supplement/i.test(note.title) || note.icon === 'feather';
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
              multiline={blk.type === 'text' || blk.type === 'quote'}
              blurOnSubmit={false}
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
          {isEssay ? ` of 650` : ''}
        </Text>
        {isEssay ? <ProgressBar value={words / 650} color={words > 650 ? colors.danger : note.color} height={4} style={styles.countBar} /> : null}
        {isEssay && words > 650 ? <Text style={styles.over}>{words - 650} over the Common App limit</Text> : null}
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
