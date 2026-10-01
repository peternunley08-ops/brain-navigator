import { router } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { alpha, colors, fonts, radii } from '../../core/theme';
import { Icon, type IconName } from '../ui/Icon';
import { Pressy } from '../ui/Pressy';

const LINES: { label: string; url: string; icon: IconName }[] = [
  { label: 'Call 988', url: 'tel:988', icon: 'phone' },
  { label: 'Text 988', url: 'sms:988', icon: 'message' },
  { label: 'Text HOME to 741741', url: 'sms:741741&body=HOME', icon: 'message' },
];

// Real people, right now. Shown the moment someone types words that sound
// like they're in danger, before any AI is asked, and kept in view for the
// rest of the conversation. Works with no connection and no AI replies left.
export function HelpCard() {
  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.card} accessibilityRole="summary">
      <Text style={styles.title}>You don’t have to carry this alone.</Text>
      <Text style={styles.body}>Talk to someone now: a trusted adult, or these free, private lines, any time, day or night.</Text>
      <View style={styles.row}>
        {LINES.map((l) => (
          <Pressy key={l.url} style={styles.btn} depth={0.95} onPress={() => Linking.openURL(l.url).catch(() => {})} accessibilityRole="button" accessibilityLabel={l.label}>
            <Icon name={l.icon} size={15} color={colors.text} />
            <Text style={styles.btnText}>{l.label}</Text>
          </Pressy>
        ))}
      </View>
      <Pressy onPress={() => router.push('/help')} depth={0.97} accessibilityRole="link" style={styles.more}>
        <Text style={styles.moreText}>All help lines, and 911 for emergencies</Text>
      </Pressy>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: alpha(colors.danger, 0.1),
    borderWidth: 1,
    borderColor: alpha(colors.danger, 0.35),
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.text,
  },
  body: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  btnText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.text,
  },
  more: {
    marginTop: 10,
    minHeight: 32,
    justifyContent: 'center',
  },
  moreText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});
