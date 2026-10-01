import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { quickParse } from '../../core/quickParse';
import { useLifeStore } from '../../core/lifeStore';
import { dueLabel, KIND_LABEL, useSchoolStore } from '../../core/schoolStore';
import { alpha, colors, fonts, radii } from '../../core/theme';
import { offerUndo } from '../../core/undoStore';
import { emberSay } from '../ember/EmberBuddy';
import { Chip, ChipRow } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { Pressy } from '../ui/Pressy';

const NONE: string[] = [];

/** "today"/"tomorrow" read lowercase mid-sentence; weekday names and dates keep their capitals. */
function when(due: string) {
  const l = dueLabel(due);
  return l === 'Today' || l === 'Tomorrow' || l === 'Yesterday' ? l.toLowerCase() : l;
}

// Type it the way you'd say it: "bio quiz friday". A live preview shows how
// it was understood before you add it.
export function QuickCapture() {
  const classes = useSchoolStore((s) => s.classes);
  const addAssignment = useSchoolStore((s) => s.addAssignment);
  const [text, setText] = useState('');
  const item = useMemo(() => quickParse(text, classes), [text, classes]);
  // Select the stored array itself; a fallback inside the selector would be a new array every render.
  const recent = useLifeStore((s) => s.settings.recentCaptures) ?? NONE;

  const add = (value = text) => {
    const it = quickParse(value, classes);
    if (!it) return;
    const a = addAssignment({
      title: it.title,
      classId: it.classId,
      kind: it.kind,
      due: it.due,
      minutes: it.minutes,
      notes: '',
      ...(it.starred ? { starred: true } : {}),
      ...(it.weekly ? { repeat: 'weekly' as const } : {}),
    });
    // Keep the line (without its date) for a one-tap repeat next time.
    const line = value.trim();
    useLifeStore.getState().setSettings({ recentCaptures: [line, ...recent.filter((r) => r.toLowerCase() !== line.toLowerCase())].slice(0, 3) });
    setText('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    emberSay(`Added: ${a.title}, due ${when(a.due)}.`, 'happy');
    offerUndo(`Added “${a.title}”`, () => useSchoolStore.getState().deleteAssignment(a.id), 'close');
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Icon name="plus" size={18} color={colors.flame} strokeWidth={2.2} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Add homework: “bio quiz friday”"
          placeholderTextColor={colors.hint}
          selectionColor={colors.flame}
          returnKeyType="done"
          onSubmitEditing={(e) => add(e.nativeEvent.text)}
          style={styles.input}
          accessibilityLabel="Quick add homework"
          autoCorrect={false}
        />
        {text.trim() ? (
          <Pressy onPress={() => add()} style={styles.go} accessibilityRole="button" accessibilityLabel="Add it">
            <Icon name="arrow" size={16} color={colors.flameInk} strokeWidth={2.4} />
          </Pressy>
        ) : null}
      </View>
      {item && text.trim().length > 2 ? (
        <Animated.Text entering={FadeIn.duration(160)} style={styles.preview}>
          {KIND_LABEL[item.kind]}
          {item.className ? ` for ${item.className}` : ''}, due {when(item.due)}
          {item.dated ? '' : ' (no date found)'}
          {item.minutes ? `, ${item.minutes >= 60 ? `${Math.round((item.minutes / 60) * 10) / 10} h` : `${item.minutes} min`}` : ''}
          {item.weekly ? ', every week' : ''}
          {item.starred ? ', starred' : ''}
        </Animated.Text>
      ) : !text && recent.length ? (
        <ChipRow style={styles.recent}>
          {recent.map((r) => (
            <Chip key={r} label={r} icon="repeat" onPress={() => setText(r)} />
          ))}
        </ChipRow>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 6,
    minHeight: 50,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSunk,
  },
  input: {
    flex: 1,
    minHeight: 46,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
  },
  go: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.flame,
  },
  recent: {
    marginTop: 8,
  },
  preview: {
    marginTop: 6,
    marginLeft: 16,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: alpha(colors.flame, 0.9),
  },
});
