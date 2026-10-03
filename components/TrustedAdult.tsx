import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from '../core/haptics';
import { openSafe } from '../core/links';
import { useLifeStore } from '../core/lifeStore';
import { offerUndo } from '../core/undoStore';
import { colors, fonts, type } from '../core/theme';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Chip, ChipRow } from './ui/Chip';
import { Pressy } from './ui/Pressy';

const PINK = colors.flame;

// One person from Your people, a single tap away on Steady. Opens Messages
// with the words in the box; the app never sends anything.
export function TrustedAdult() {
  const people = useLifeStore((s) => s.people);
  const trustedId = useLifeStore((s) => s.settings.trustedAdultId);
  const [picking, setPicking] = useState(false);
  const who = trustedId ? people.find((p) => p.id === trustedId) : undefined;

  const set = (id: string | undefined) => useLifeStore.getState().setSettings({ trustedAdultId: id });

  if (who) {
    const text = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const digits = who.phone.replace(/[^\d+]/g, '');
      useLifeStore.getState().savePerson({ ...who, reachedAt: new Date().toISOString() });
      openSafe(`sms:${digits}&body=${encodeURIComponent('Can you talk?')}`);
    };
    return (
      <Card tint={PINK} style={styles.card}>
        <Button label={`Text ${who.name}`} icon="message" onPress={text} accessibilityHint="Opens Messages with Can you talk? ready to send" />
        <Pressy
          onPress={() => {
            const before = who.id;
            set(undefined);
            offerUndo(`Cleared ${who.name} as your trusted adult`, () => set(before));
          }}
          accessibilityRole="button"
          accessibilityLabel={`Clear ${who.name} as your trusted adult`}
          style={styles.clear}
        >
          <Text style={styles.small}>Change trusted adult</Text>
        </Pressy>
      </Card>
    );
  }

  if (!people.length) {
    return (
      <Card tint={PINK} onPress={() => router.push('/people')} style={styles.card} accessibilityLabel="Add a trusted adult in Your people">
        <Text style={styles.title}>A trusted adult, one tap away</Text>
        <Text style={styles.small}>Add someone to Your people first.</Text>
      </Card>
    );
  }

  return (
    <Card tint={PINK} style={styles.card}>
      <Text style={styles.title}>A trusted adult, one tap away</Text>
      {picking ? (
        <View style={styles.pick}>
          <Text style={styles.small}>Who would you text first?</Text>
          <ChipRow>
            {people.map((p) => (
              <Chip
                key={p.id}
                label={p.name}
                color={PINK}
                onPress={() => {
                  Haptics.selectionAsync();
                  set(p.id);
                  setPicking(false);
                }}
              />
            ))}
          </ChipRow>
        </View>
      ) : (
        <Button label="Choose someone" icon="people" variant="secondary" size="sm" onPress={() => setPicking(true)} style={styles.pick} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8 },
  title: { ...type.body, fontFamily: fonts.bodySemi, color: colors.text },
  small: { ...type.small, color: colors.textMuted },
  pick: { marginTop: 4, gap: 8 },
  clear: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
});
