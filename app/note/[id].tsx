import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
];

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
    blocks[index] = { ...blocks[index], text };
    setBlocks(blocks);
  };

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
          <IconButton
            icon="flag"
            label={note.pinned ? 'Unpin' : 'Pin to top'}
            tint={note.pinned ? colors.flame : undefined}
            onPress={() => updateNote(note.id, { pinned: !note.pinned })}
          />
          <IconButton
            icon="trash"
            label="Delete page"
            onPress={() => {
              deleteNote(note.id);
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
        value={note.title}
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
        {note.blocks.map((blk, i) => (
          <Animated.View key={blk.id} layout={LinearTransition.duration(180)} entering={FadeIn.duration(160)} style={styles.blockRow}>
            {blk.type === 'todo' ? (
              <Pressy onPress={() => check(i)} depth={0.85} hitSlop={8} style={[styles.box, blk.checked && styles.boxOn]} accessibilityRole="checkbox" accessibilityState={{ checked: !!blk.checked }}>
                {blk.checked ? <Icon name="check" size={13} color={colors.flameInk} strokeWidth={3} /> : null}
              </Pressy>
            ) : blk.type === 'bullet' ? (
              <Text style={styles.bullet}>•</Text>
            ) : null}
            <TextInput
              ref={(r) => {
                refs.current[blk.id] = r;
              }}
              style={[
                styles.input,
                blk.type === 'heading' && styles.heading,
                blk.type === 'todo' && blk.checked && styles.checked,
              ]}
              value={blk.text}
              onChangeText={(t) => change(i, t)}
              placeholder={blk.type === 'heading' ? 'Heading' : blk.type === 'todo' ? 'To do' : blk.type === 'bullet' ? 'List item' : i === 0 ? 'Start writing…' : ''}
              placeholderTextColor={colors.hint}
              selectionColor={colors.flame}
              multiline={blk.type === 'text'}
              blurOnSubmit={false}
              returnKeyType={blk.type === 'text' ? 'default' : 'next'}
              onSubmitEditing={() => blk.type !== 'text' && insertAfter(i, blk.type === 'heading' ? 'text' : blk.type)}
              onKeyPress={(e) => {
                if (e.nativeEvent.key === 'Backspace' && blk.text === '') remove(i);
              }}
            />
          </Animated.View>
        ))}
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
