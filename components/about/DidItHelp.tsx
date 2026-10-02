import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { CALMERS, calmOrder } from '../../core/about';
import { useLifeStore } from '../../core/lifeStore';
import { alpha, colors, fonts, radii } from '../../core/theme';
import { Pressy } from '../ui/Pressy';

// One tap after a calming tool, so the app learns what works for this
// student. "Not really" offers the next thing that might, in their order.
// Kept on the phone in About you (Steady uses it to order the tools).
export function DidItHelp({ tool, color = colors.flame }: { tool: string; color?: string }) {
  const [said, setSaid] = useState<'yes' | 'no' | null>(null);

  const answer = (yes: boolean) => {
    const { about, setAbout } = useLifeStore.getState();
    const [y, n] = about.helped[tool] ?? [0, 0];
    setAbout({ helped: { ...about.helped, [tool]: yes ? [y + 1, n] : [y, n + 1] } });
    setSaid(yes ? 'yes' : 'no');
  };

  if (said) {
    const about = useLifeStore.getState().about;
    const next = said === 'no' ? CALMERS.find((c) => c.id === calmOrder(about, CALMERS.map((x) => x.id)).find((id) => id !== tool && id !== 'sleep')) : null;
    return (
      <Animated.View entering={FadeIn.duration(220)} style={styles.wrap}>
        <Text style={styles.thanks}>{said === 'yes' ? 'Good. I’ll remember that.' : 'Thanks for saying. Not everything works every time.'}</Text>
        {next ? (
          <Pressy onPress={() => router.push(next.path as never)} style={[styles.pill, { borderColor: alpha(color, 0.45) }]} accessibilityRole="button">
            <Text style={[styles.pillText, { color }]}>Try {next.label.toLowerCase()}</Text>
          </Pressy>
        ) : null}
      </Animated.View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.ask}>Did that help?</Text>
      <View style={styles.row}>
        <Pressy onPress={() => answer(true)} style={[styles.pill, { borderColor: alpha(color, 0.45), backgroundColor: alpha(color, 0.1) }]} accessibilityRole="button">
          <Text style={[styles.pillText, { color }]}>It helped</Text>
        </Pressy>
        <Pressy onPress={() => answer(false)} style={styles.pill} accessibilityRole="button">
          <Text style={styles.pillText}>Not really</Text>
        </Pressy>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  ask: {
    fontFamily: fonts.displaySoft,
    fontSize: 15,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  pillText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.textMuted,
  },
  thanks: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
