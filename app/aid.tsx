import * as Haptics from 'expo-haptics';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { AID_STEPS, useHubStore } from '../core/hubStore';
import { colors, fonts } from '../core/theme';

const GREEN = '#9FD08A';

// Financial aid, step by step. Families leave billions in aid unclaimed
// every year, mostly by not filing the FAFSA.
export default function AidScreen() {
  const aid = useHubStore((s) => s.aid);
  const toggle = useHubStore((s) => s.toggleAid);
  const done = AID_STEPS.filter((s) => aid[s]).length;

  return (
    <Screen glowColor={GREEN} title="Financial aid" subtitle="Do this with a parent or guardian. It unlocks grants, work-study, and loans.">
      <Reveal index={0}>
        <Card tint={GREEN} style={styles.top}>
          <Text style={styles.big}>
            {done} of {AID_STEPS.length}
          </Text>
          <ProgressBar value={done / AID_STEPS.length} color={GREEN} />
          <Text style={styles.hint}>The FAFSA usually opens October 1. Some aid is first-come, first-served — file early.</Text>
        </Card>
      </Reveal>
      <Reveal index={1}>
        <Card style={styles.list}>
          {AID_STEPS.map((s, i) => {
            const on = !!aid[s];
            return (
              <Pressy
                key={s}
                onPress={() => {
                  toggle(s);
                  Haptics.selectionAsync().catch(() => {});
                  if (!on && s === 'Submit the FAFSA') emberSay('FAFSA submitted. That’s one of the most valuable forms you’ll ever fill out.', 'cheer');
                }}
                style={[styles.row, i === AID_STEPS.length - 1 && styles.last]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
              >
                <View style={[styles.box, on && { backgroundColor: GREEN, borderColor: GREEN }]}>{on ? <Icon name="check" size={13} color={colors.flameInk} strokeWidth={3} /> : null}</View>
                <Text style={[styles.text, on && styles.done]}>{s}</Text>
              </Pressy>
            );
          })}
        </Card>
      </Reveal>
      <Reveal index={2}>
        <View style={styles.links}>
          <Button label="StudentAid.gov" icon="arrow" variant="secondary" size="sm" onPress={() => Linking.openURL('https://studentaid.gov')} style={styles.flex} />
          <Button label="CSS Profile" icon="arrow" variant="secondary" size="sm" onPress={() => Linking.openURL('https://cssprofile.collegeboard.org')} style={styles.flex} />
        </View>
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  top: {
    marginTop: 16,
    gap: 10,
  },
  big: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.text,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textFaint,
  },
  list: {
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  last: {
    borderBottomWidth: 0,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  done: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
  links: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
});
