import * as Haptics from '../../core/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withSequence, withSpring, withTiming, useSharedValue } from 'react-native-reanimated';
import { springs } from '../../core/motion';
import { cheerLine } from '../../core/about';
import { dateKey } from '../../core/dates';
import { useLifeStore } from '../../core/lifeStore';
import { alpha, colors, fonts, radii, textGrow } from '../../core/theme';
import { emberSay } from '../ember/EmberBuddy';
import { Sparks } from '../ember/Sparks';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Pressy } from '../ui/Pressy';

// The one thing that would make today a win. Not a to-do list — one line.
export function OneThing({ lit = false }: { lit?: boolean }) {
  const today = dateKey();
  const text = useLifeStore((s) => s.oneThing[today] ?? '');
  const done = useLifeStore((s) => !!s.oneThingDone[today]);
  const setOneThing = useLifeStore((s) => s.setOneThing);
  const setDone = useLifeStore((s) => s.setOneThingDone);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  // Follow the saved line when it changes underneath (a new day, or leaving
  // show mode), so Riley's one thing can't be saved as yours.
  const [shown, setShown] = useState(text);
  if (text !== shown && !editing) {
    setShown(text);
    setDraft(text);
  }
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
            pop.value = withSequence(withTiming(1.2, { duration: 110 }), withSpring(1, springs.pop));
            setBurst((b) => b + 1);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            emberSay(cheerLine('The one thing: done. Today’s already a win.'), 'cheer');
          }
        }}
        onLongPress={() => {
          setDraft(text);
          setEditing(true);
        }}
        style={[styles.card, lit && styles.cardLit, done && styles.cardDone]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={`Today’s one thing: ${text}`}
        accessibilityHint="Hold to change it"
      >
        <LinearGradient
          pointerEvents="none"
          colors={[
            alpha(done ? colors.secured : colors.flame, lit ? 0.14 : 0.08),
            alpha(done ? colors.secured : colors.flame, 0.02),
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.wash}
        />
        <View style={styles.topRow}>
          <Animated.View style={[styles.check, lit && styles.checkLit, done && styles.checkOn, popStyle]}>
            <Sparks burst={burst} reach={34} />
            {done ? <Icon name="check" size={15} color={colors.flameInk} strokeWidth={3} /> : <Icon name="star" size={lit ? 16 : 14} color={colors.flame} />}
          </Animated.View>
          <View style={styles.flex}>
            <Text style={styles.kicker} maxFontSizeMultiplier={2}>Today’s one thing</Text>
            <Text style={[styles.text, lit && styles.textLit, done && styles.textDone]} maxFontSizeMultiplier={textGrow.heading}>{text}</Text>
            {lit && !done ? (
              <Text style={styles.sub} maxFontSizeMultiplier={2}>Tap to mark it done, or light a study candle.</Text>
            ) : null}
          </View>
        </View>
        {lit && !done ? (
          <Button
            label="Light the candle"
            icon="candle"
            size="sm"
            onPress={() => router.push({ pathname: '/focus', params: { topic: text } })}
            style={styles.action}
          />
        ) : null}
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: alpha(colors.flame, 0.32),
    borderTopColor: alpha(colors.flame, 0.52),
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  cardLit: {
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  wash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    paddingVertical: 4,
  },
  cardDone: {
    borderColor: alpha(colors.secured, 0.4),
    borderTopColor: alpha(colors.secured, 0.55),
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
  checkLit: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: alpha(colors.flame, 0.12),
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
  textLit: {
    fontSize: 21,
    lineHeight: 27,
  },
  sub: {
    marginTop: 3,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  action: {
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  textDone: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
});
