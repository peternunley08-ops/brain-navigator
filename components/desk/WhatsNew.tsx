import { router } from 'expo-router';
import { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import { useLifeStore } from '../../core/lifeStore';
import { alpha, colors, fonts } from '../../core/theme';
import { EmberGlyph } from '../ember/EmberSprite';
import { Card } from '../ui/Card';
import { Chip, ChipRow } from '../ui/Chip';
import { IconButton } from '../ui/IconButton';
import { LeaveNoteSheet } from './DayCards';

export const WHATS_NEW_VERSION = 3;

const NEW: { label: string; href: string }[] = [
  { label: 'Put the day down', href: '/goodnight' },
  { label: 'Your year', href: '/year' },
  { label: 'About you', href: '/about' },
  { label: 'Settings', href: '/settings' },
  { label: 'Check in', href: '/checkin' },
];

export function whenWhatsNew(seen: number) {
  return seen < WHATS_NEW_VERSION;
}

// A one-time note about what just arrived. Dismissed for good with the ×.
export function WhatsNew() {
  const seen = useLifeStore((s) => s.settings.whatsNewSeen);
  const setSettings = useLifeStore((s) => s.setSettings);
  const leave = useContext(LeaveNoteSheet);
  if (!whenWhatsNew(seen)) return null;
  return (
    <Animated.View exiting={FadeOut.duration(200)}>
      <Card tint={colors.flame} style={styles.card}>
        <View style={styles.head}>
          <EmberGlyph size={34} />
          <View style={styles.flex}>
            <Text style={styles.title}>New in your app</Text>
            <Text style={styles.body}>The Desk turns quiet at night, Ember gets to know you, and your weeks become candles on a shelf. All of it lives in the Drawer too.</Text>
          </View>
          <IconButton icon="close" label="Dismiss" size={32} onPress={() => setSettings({ whatsNewSeen: WHATS_NEW_VERSION })} />
        </View>
        <ChipRow style={styles.chips}>
          {NEW.map((n) => (
            <Chip key={n.href} label={n.label} onPress={() => {
                leave();
                router.push(n.href as never);
              }} style={styles.chip} />
          ))}
          <Chip label="Everything new" icon="arrow" onPress={() => {
              leave();
              router.push('/whats-new');
            }} style={styles.chip} />
        </ChipRow>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    marginTop: 12,
    backgroundColor: alpha(colors.flame, 0.04),
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
  },
  body: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  chips: {
    marginTop: 12,
  },
  chip: {
    minHeight: 32,
  },
});
