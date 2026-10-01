import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { aiStatus } from '../../core/aiQuota';
import { useLifeStore } from '../../core/lifeStore';
import { alpha, colors, fonts, radii } from '../../core/theme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { Pressy } from '../ui/Pressy';

/** Re-reads the allowance whenever usage or the plan changes. */
export function useAIStatus() {
  useLifeStore((s) => s.ai);
  useLifeStore((s) => s.settings.plus);
  return aiStatus();
}

// "14 AI left" — tap to see what Plus adds.
export function QuotaPill() {
  const st = useAIStatus();
  const low = st.left <= 3;
  return (
    <Pressy
      onPress={() => router.push('/plus')}
      style={[styles.pill, low && { borderColor: alpha(colors.unlocked, 0.6), backgroundColor: alpha(colors.unlocked, 0.1) }]}
      accessibilityRole="button"
      accessibilityLabel={`${st.left} of ${st.limit} AI replies left ${st.plus ? 'this month' : 'this week'}`}
    >
      <Icon name="sparkle" size={13} color={low ? colors.unlocked : colors.flame} strokeWidth={2} />
      <Text style={[styles.pillText, low && { color: colors.unlocked }]}>
        {st.plus ? `Plus: ${st.left} AI left` : `${st.left} AI left`}
      </Text>
    </Pressy>
  );
}

// Shown when this week's free AI replies are gone. Never a dead end: the
// on-phone mode always keeps working.
export function LimitCard({ offlineLabel, onOffline }: { offlineLabel?: string; onOffline?: () => void }) {
  const st = useAIStatus();
  return (
    <Card tint={colors.flame} style={styles.card}>
      <Text style={styles.title}>{st.plus ? 'That’s this month’s AI replies.' : 'That’s all your free AI replies this week.'}</Text>
      <Text style={styles.body}>
        {st.plus
          ? `They come back on ${st.resets}. Everything on your phone still works.`
          : `They come back ${st.resets}. Plus gives you 400 a month for all of Ember and the crew — or keep going for free without AI.`}
      </Text>
      {!st.plus ? <Button label="See Plus" icon="sparkle" onPress={() => router.push('/plus')} style={styles.btn} /> : null}
      {onOffline ? <Button label={`${offlineLabel ?? 'Keep going without AI'} (free)`} variant="ghost" size="sm" onPress={onOffline} style={styles.ghost} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: alpha(colors.flame, 0.4),
    backgroundColor: alpha(colors.flame, 0.08),
  },
  pillText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.flame,
  },
  card: {
    marginTop: 12,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
  },
  body: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  btn: {
    marginTop: 14,
  },
  ghost: {
    marginTop: 6,
    alignSelf: 'center',
  },
});
