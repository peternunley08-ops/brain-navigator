import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeOut, useReducedMotion } from 'react-native-reanimated';
import { clock, dateKey } from '../../core/dates';
import { useLifeStore } from '../../core/lifeStore';
import { firstClassOn, firstLightOpen, nightNow } from '../../core/night';
import { useSchoolStore } from '../../core/schoolStore';
import { colors, fonts } from '../../core/theme';
import { weatherCodeLabel } from '../../core/weatherCodes';
import { useWeatherStore } from '../../core/weatherStore';
import { Card } from '../ui/Card';
import { Pressy } from '../ui/Pressy';

const SHOW_MS = 4000;

// The first time the Desk opens each morning: a short, quiet stack, then
// it steps aside for the normal Desk. `seen` is the date it last showed.
export function FirstLight({ seen, onSeen }: { seen: string | undefined; onSeen: (key: string) => void }) {
  const reduced = useReducedMotion();
  const name = useSchoolStore((s) => s.profile.name);
  const classes = useSchoolStore((s) => s.classes);
  const wake = useLifeStore((s) => s.settings.wake);
  const oneThing = useLifeStore((s) => s.oneThing);
  const temp = useWeatherStore((s) => s.temperatureF);
  const code = useWeatherStore((s) => s.weatherCode);
  const today = dateKey(nightNow());
  // Decided once on mount, so marking it seen does not pull it away mid-read.
  const [open, setOpen] = useState(() => firstLightOpen(nightNow(), wake, seen));

  const close = () => {
    setOpen(false);
    onSeen(today);
  };
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(close, SHOW_MS);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;
  const first = firstClassOn(classes, today);
  const one = oneThing[today]?.trim();
  const weather = temp != null ? `${Math.round(temp)}° and ${code != null ? weatherCodeLabel(code).toLowerCase() : 'quiet'} out there.` : null;
  return (
    <Animated.View exiting={reduced ? undefined : FadeOut.duration(400)} style={styles.stack}>
      <Card tint={colors.flame} style={styles.card}>
        <Text style={styles.greeting} accessibilityRole="header">
          {name ? `Good morning, ${name}` : 'Good morning'}
        </Text>
        <Text style={styles.line}>A gentle start. Here is the shape of today.</Text>
        {weather ? <Text style={styles.sub}>{weather}</Text> : null}
      </Card>
      {first ? (
        <Card style={styles.card}>
          <Text style={styles.sub}>First class</Text>
          <Text style={styles.line}>
            {first.name} at {clock(first.start)}
          </Text>
        </Card>
      ) : null}
      {one ? (
        <Card style={styles.card}>
          <Text style={styles.sub}>The one thing</Text>
          <Text style={styles.line}>{one}</Text>
        </Card>
      ) : null}
      <Pressy onPress={close} accessibilityRole="button" hitSlop={10} style={styles.open}>
        <Text style={styles.openText}>Open the Desk</Text>
      </Pressy>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 10, marginTop: 8 },
  card: { gap: 4 },
  greeting: { fontFamily: fonts.display, fontSize: 24, color: colors.text },
  line: { fontFamily: fonts.body, fontSize: 16, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  open: { alignSelf: 'center', paddingVertical: 8 },
  openText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.flame },
});
