import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import { useLifeStore } from '../../core/lifeStore';
import { useSchoolStore } from '../../core/schoolStore';
import { isShowing } from '../../core/showMode';
import { alpha, colors, fonts, textGrow } from '../../core/theme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';

/** True when the Desk should offer the first-open starter (Pick D). */
export function whenStarterCard(classes: number, assignments: number, dismissed: boolean | undefined, showing: boolean) {
  return !showing && !dismissed && classes === 0 && assignments === 0;
}

// Brand-new install: one warm card before asking for classes. Riley's show
// mode has sample data, so this stays off there.
export function StarterCard() {
  const classes = useSchoolStore((s) => s.classes);
  const assignments = useSchoolStore((s) => s.assignments);
  const dismissed = useLifeStore((s) => s.settings.starterDismissed);
  const showing = isShowing();
  if (!whenStarterCard(classes.length, assignments.length, dismissed, showing)) return null;

  const dismiss = () => useLifeStore.getState().setSettings({ starterDismissed: true });

  return (
    <Animated.View exiting={FadeOut.duration(200)} style={styles.wrap}>
      <Card tint={colors.flame} style={styles.card}>
        <View style={styles.head}>
          <View style={[styles.icon, { backgroundColor: alpha(colors.flame, 0.14) }]}>
            <Icon name="candle" size={20} color={colors.flame} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.title} maxFontSizeMultiplier={textGrow.heading}>
              Your Desk is ready
            </Text>
            <Text style={styles.body} maxFontSizeMultiplier={2}>
              Set one thing down, or add a class when you’re ready. Nothing has to be perfect tonight.
            </Text>
          </View>
          <IconButton icon="close" label="Dismiss starter card" size={32} onPress={dismiss} />
        </View>
        <View style={styles.actions}>
          <Button
            label="Set something down"
            icon="candle"
            size="sm"
            onPress={() => {
              dismiss();
              router.push('/new-entry');
            }}
          />
          <Button
            label="Add a class"
            icon="book"
            variant="secondary"
            size="sm"
            onPress={() => {
              dismiss();
              router.push('/classes');
            }}
          />
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
  },
  card: {
    backgroundColor: alpha(colors.flame, 0.04),
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
  },
  body: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  actions: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
