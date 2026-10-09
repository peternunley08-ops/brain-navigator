import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { HelpCard } from '../components/ember/HelpCard';
import { EmberSprite } from '../components/ember/EmberSprite';
import { useEmberRig } from '../components/ember/useEmberRig';
import { Button } from '../components/ui/Button';
import { Chip, ChipRow } from '../components/ui/Chip';
import { Screen } from '../components/ui/Screen';
import { AGE_BANDS, type AgeBand, type AgeRecord, askApple, canPick } from '../core/age';
import { goBack } from '../core/chrome';
import { useLifeStore } from '../core/lifeStore';
import { useSchoolStore } from '../core/schoolStore';
import { colors, fonts } from '../core/theme';

type Mode = 'ask' | 'pick' | 'law' | 'young';

// Before anything else, once: the age range (core/age.ts). Apple answers
// first; a pick stands in where Apple can't, except where a state law says it
// has to be Apple. Under 13, the app stops here, and the help lines stay.
export default function AgeScreen() {
  const saved = useLifeStore((s) => s.settings.age);
  const rig = useEmberRig();
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<Mode>(() => (saved?.band === 'under13' ? 'young' : Platform.OS === 'ios' ? 'ask' : 'pick'));
  const [asking, setAsking] = useState(false);
  const [band, setBand] = useState<AgeBand | null>(null);

  useEffect(() => {
    rig.setMood(mode === 'young' ? 'idle' : mode === 'pick' ? 'curious' : 'happy');
    rig.talk(true);
    const t = setTimeout(() => rig.talk(false), 1200);
    return () => clearTimeout(t);
  }, [rig, mode]);

  const done = (rec: AgeRecord) => {
    useLifeStore.getState().setSettings({ age: rec });
    if (rec.band === 'under13') {
      setMode('young');
      return;
    }
    rig.setMood('cheer');
    rig.hopUp(10);
    if (!useSchoolStore.getState().profile.onboarded) router.replace('/welcome');
    else goBack();
  };

  const ask = async () => {
    setAsking(true);
    const { record, regulated, features } = await askApple();
    setAsking(false);
    if (record) done(record);
    // Apple already said under 13: no answer this time doesn't open the picker.
    else if (mode !== 'young') setMode(canPick(regulated, features) ? 'pick' : 'law');
  };

  const pick = () => {
    if (!band) return;
    const rec: AgeRecord = { band, source: 'picked', at: new Date().toISOString() };
    if (band !== 'under13') return done(rec);
    Alert.alert('Under 13?', 'Just checking, since this can’t be changed later in the app.', [
      { text: 'Go back', style: 'cancel' },
      { text: 'Yes, under 13', onPress: () => done(rec) },
    ]);
  };

  const line =
    mode === 'ask'
      ? 'Before anything else: your age range. Apple can share it with this app, and your birthday stays with Apple.'
      : mode === 'pick'
        ? 'That’s okay. Which of these fits?'
        : mode === 'law'
          ? 'Where you live, the law says your age has to come from the App Store. Try Apple’s sheet again, or ask a parent to turn on age sharing on this iPhone.'
          : 'Brain Navigator is for people 13\u00A0and\u00A0up.';

  return (
    <Screen nav={false} back={false} tone="ember" motes>
      <View style={styles.stage}>
        <EmberSprite rig={rig} size={110} seed={2.2} />
      </View>
      <Animated.Text key={mode} entering={reduced ? undefined : FadeInDown.duration(380)} style={styles.line} accessibilityRole="header">
        {line}
      </Animated.Text>

      {mode === 'ask' || mode === 'law' ? (
        <>
          <Button label={asking ? 'Asking Apple…' : mode === 'law' ? 'Try again' : 'Share my age range'} icon="person" loading={asking} onPress={ask} style={styles.next} />
          {/* Stuck here for now, but never without the help lines. */}
          {mode === 'law' ? (
            <View style={styles.block}>
              <HelpCard />
            </View>
          ) : null}
        </>
      ) : mode === 'pick' ? (
        <View style={styles.block}>
          <ChipRow>
            {AGE_BANDS.map((b) => (
              <Chip key={b.band} label={b.label} selected={band === b.band} onPress={() => setBand(b.band)} />
            ))}
          </ChipRow>
          <Button label="Continue" icon="arrow" onPress={pick} disabled={!band} style={styles.next} />
        </View>
      ) : (
        <View style={styles.block}>
          <Text style={styles.body}>That’s a rule for apps like this one, not anything about you. If something feels heavy right now, real people are here any time.</Text>
          <HelpCard />
          {saved?.source !== 'picked' ? <Button label="Ask Apple again" variant="ghost" size="sm" onPress={ask} loading={asking} style={styles.again} /> : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    marginTop: 4,
  },
  line: {
    marginTop: 14,
    fontFamily: fonts.displaySoft,
    fontSize: 21,
    lineHeight: 29,
    color: colors.text,
    textAlign: 'center',
  },
  block: {
    marginTop: 22,
    gap: 4,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 14,
  },
  next: {
    marginTop: 24,
  },
  again: {
    alignSelf: 'center',
    marginTop: 12,
  },
});
