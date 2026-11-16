import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { goBack } from '../core/chrome';
import * as Haptics from '../core/haptics';
import { useLifeStore } from '../core/lifeStore';
import { isNight, minutesOf, nightNow, nightStart } from '../core/night';
import { offerUndo } from '../core/undoStore';
import { colors, fonts } from '../core/theme';

// Pocket worry: a shake from any page opens this sheet (components/ShakeToWorry).
// One line, into the box, back to whatever you were doing.
export default function PocketWorryScreen() {
  const addWorry = useLifeStore((s) => s.addWorry);
  const [text, setText] = useState('');
  const fieldRef = useRef<TextInput>(null);
  const windDown = useLifeStore((s) => s.settings.windDown);
  const owl = useLifeStore((s) => s.about.picks.time === 'b');
  const nightish = isNight(minutesOf(nightNow()), nightStart(windDown, owl));

  const putAway = () => {
    const id = addWorry(text);
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    offerUndo('Worry put in the box', () => useLifeStore.getState().deleteWorry(id), 'arrow');
    emberSay('It’s in the box. You can leave it there until worry time.', 'happy');
    goBack();
  };

  return (
    <Screen sheet back={goBack} backIcon="close" nav={false} tone="dusk" kicker="Worry box" title="Drop a worry" subtitle="Write it down and put it away for later.">
      <Reveal index={0}>
        <Field
          ref={fieldRef}
          big
          autoFocus
          placeholder="What’s on your mind?"
          value={text}
          onChangeText={setText}
          returnKeyType="done"
          onSubmitEditing={putAway}
          accessibilityLabel="What’s on your mind"
        />
        <Pressy
          onPress={() => fieldRef.current?.focus()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Focus the note field for voice dictation"
          style={styles.dictateCue}
        >
          <Icon name="mic" size={14} color={colors.textFaint} />
          <Text style={styles.dictateText}>
            {nightish
              ? 'Too tired to type? Tap here, then the mic on the keyboard.'
              : 'Prefer to speak it? Tap here, then the mic on the keyboard.'}
          </Text>
        </Pressy>
      </Reveal>
      <Reveal index={1}>
        <Button label="Put it in the box" icon="feather" onPress={putAway} disabled={!text.trim()} style={styles.gap} />
        <Text style={styles.hint}>Worry time is 4–7 PM. It’ll be waiting in the worry box.</Text>
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: {
    marginTop: 16,
  },
  hint: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textFaint,
  },
  dictateCue: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 4,
  },
  dictateText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textFaint,
  },
});
