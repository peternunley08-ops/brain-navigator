import * as Haptics from '../../core/haptics';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withSequence, withSpring, withTiming, useSharedValue } from 'react-native-reanimated';
import { dateKey } from '../../core/dates';
import { useLifeStore } from '../../core/lifeStore';
import { alpha, colors, fonts, radii } from '../../core/theme';
import { emberSay } from '../ember/EmberBuddy';
import { Sparks } from '../ember/Sparks';
import { Icon } from '../ui/Icon';
import { Pressy } from '../ui/Pressy';

// The one thing that would make today a win. Not a to-do list — one line.
export function OneThing() {
  const today = dateKey();
  const text = useLifeStore((s) => s.oneThing[today] ?? '');
  const done = useLifeStore((s) => !!s.oneThingDone[today]);
  const setOneThing = useLifeStore((s) => s.setOneThing);
  const setDone = useLifeStore((s) => s.setOneThingDone);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [burst, setBurst] = useState(0);
  const pop = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  // Commit the field's own final text — state can lag a keystroke behind
  // when Return comes right after typing.
  const commit = (value: string) => {
    const v = value.trim();
    setDraft(v);
    setOneThing(today, v);
    setEditing(false);
    if (v && !text) emberSay('That’s the one. Everything else is a bonus.', 'happy');
  };

  if (!text || editing) {
    return (
      <View style={[styles.card, styles.empty]}>
        <Icon name="star" size={18} color={colors.flame} />
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onFocus={() => setEditing(true)}
          autoFocus={editing && !!text}
          onEndEditing={(e) => commit(e.nativeEvent.text)}
          placeholder="What would make today a win?"
          placeholderTextColor={colors.hint}
          selectionColor={colors.flame}
          returnKeyType="done"
          style={styles.input}
          accessibilityLabel="Today’s one thing"
        />
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(260)}>
      <Pressy
        onPress={() => {
          const finishing = !done;
          setDone(today, finishing);
          if (finishing) {
            pop.value = withSequence(withTiming(1.2, { duration: 110 }), withSpring(1, { damping: 8, stiffness: 260 }));
            setBurst((b) => b + 1);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            emberSay('The one thing: done. Today’s already a win.', 'cheer');
          }
        }}
        onLongPress={() => {
          setDraft(text);
          setEditing(true);
        }}
        style={[styles.card, done && styles.cardDone]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={`Today’s one thing: ${text}`}
        accessibilityHint="Hold to change it"
      >
        <Animated.View style={[styles.check, done && styles.checkOn, popStyle]}>
          <Sparks burst={burst} reach={34} />
          {done ? <Icon name="check" size={15} color={colors.flameInk} strokeWidth={3} /> : <Icon name="star" size={14} color={colors.flame} />}
        </Animated.View>
        <View style={styles.flex}>
          <Text style={styles.kicker}>Today’s one thing</Text>
          <Text style={[styles.text, done && styles.textDone]}>{text}</Text>
        </View>
      </Pressy>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: alpha(colors.flame, 0.35),
    backgroundColor: alpha(colors.flame, 0.06),
  },
  empty: {
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    paddingVertical: 4,
  },
  cardDone: {
    borderColor: alpha(colors.secured, 0.4),
    backgroundColor: alpha(colors.secured, 0.06),
  },
  input: {
    flex: 1,
    minHeight: 46,
    fontFamily: fonts.displaySoft,
    fontSize: 16,
    color: colors.text,
  },
  check: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: alpha(colors.flame, 0.6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: colors.secured,
    borderColor: colors.secured,
  },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.flame,
  },
  text: {
    marginTop: 1,
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
  },
  textDone: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
});
