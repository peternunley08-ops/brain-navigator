import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import { useLifeStore } from '../../core/lifeStore';
import { isNight, minutesOf, nightNow, nightStart, tonightKey } from '../../core/night';
import { tonightsLoad, useSchoolStore } from '../../core/schoolStore';
import { alpha, colors, fonts, textGrow } from '../../core/theme';
import { plural } from '../../core/words';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';

/** Evening + opt-in + tonight over the homework cap + not already put away tonight. */
export function whenCapNudge({
  enabled,
  dismissed,
  over,
  evening,
  night,
}: {
  enabled: boolean;
  dismissed: string | undefined;
  over: boolean;
  evening: boolean;
  night: string;
}) {
  return enabled && over && evening && dismissed !== night;
}

// Opt-in quiet banner: tonight’s load is over the cap. Links to Pip’s plan.
// Off by default; dismissible for the night (Pick E).
export function CapNudge() {
  const assignments = useSchoolStore((s) => s.assignments);
  const cap = useSchoolStore((s) => s.profile.nightlyCap);
  const enabled = !!useLifeStore((s) => s.settings.capNudge);
  const dismissed = useLifeStore((s) => s.settings.capNudgeDismissed);
  const windDown = useLifeStore((s) => s.settings.windDown);
  const owl = useLifeStore((s) => s.about.picks.time === 'b');
  const now = nightNow();
  const hour = now.getHours();
  // Evening starts mid-afternoon so the nudge can help before wind-down; night itself always counts.
  const evening = hour >= 15 || isNight(minutesOf(now), nightStart(windDown, owl));
  const load = tonightsLoad(assignments);
  const night = tonightKey();
  const over = load.minutes > cap;

  if (!whenCapNudge({ enabled, dismissed, over, evening, night })) return null;

  const putAway = () => useLifeStore.getState().setSettings({ capNudgeDismissed: night });

  return (
    <Animated.View exiting={FadeOut.duration(200)} style={styles.wrap}>
      <Card tint={colors.unlocked} style={styles.card}>
        <View style={styles.head}>
          <View style={[styles.icon, { backgroundColor: alpha(colors.unlocked, 0.16) }]}>
            <Icon name="calendar" size={18} color={colors.unlocked} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.title} maxFontSizeMultiplier={textGrow.heading}>
              Tonight is over your cap
            </Text>
            <Text style={styles.body} maxFontSizeMultiplier={2}>
              {plural(load.minutes, 'minute')} of homework against a {cap}-minute night. Pip can fit it inside your limit.
            </Text>
          </View>
          <IconButton icon="close" label="Dismiss for tonight" size={32} onPress={putAway} />
        </View>
        <Button
          label="Open Pip’s plan"
          icon="calendar"
          size="sm"
          variant="secondary"
          onPress={() => {
            putAway();
            router.push('/helper/pip');
          }}
          style={styles.action}
        />
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
  },
  card: {
    backgroundColor: alpha(colors.unlocked, 0.05),
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  body: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  action: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
});
