import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/ui/Button';
import { Bear } from '../components/ui/Bear';
import { CLOSING_LINES, FOLLOW_UP_PROMPTS, OPENING_PROMPTS, randomFrom } from '../core/companionPrompts';
import { colors, fonts, radii, spacing } from '../core/theme';
import { useVentStore } from '../core/ventStore';

type Step = 'q1' | 'q2' | 'done';

export default function CompanionScreen() {
  const question1 = useRef(randomFrom(OPENING_PROMPTS)).current;
  const question2 = useRef(randomFrom(FOLLOW_UP_PROMPTS)).current;
  const closingLine = useRef(randomFrom(CLOSING_LINES)).current;

  const [step, setStep] = useState<Step>('q1');
  const [answer1, setAnswer1] = useState('');
  const [answer2, setAnswer2] = useState('');

  const isSaving = useVentStore((s) => s.isSaving);
  const saveEntry = useVentStore((s) => s.saveEntry);

  const handleAnswer1 = () => {
    if (!answer1.trim()) return;
    setStep('q2');
  };

  const finish = async (secondAnswer: string) => {
    const content = secondAnswer.trim()
      ? `${question1}\n${answer1.trim()}\n\n${question2}\n${secondAnswer.trim()}`
      : `${question1}\n${answer1.trim()}`;
    await saveEntry(content, 'companion');
    setStep('done');
  };

  return (
    <View style={styles.outer}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <Button label="Back" variant="pill" onPress={() => router.back()} style={styles.back} />

        <View style={styles.bearWrap}>
          <View style={styles.glow} />
          <Bear size={110} />
        </View>

        <Text style={styles.title}>Ember</Text>
        <Text style={styles.subtitle}>stopped by to ask how you're doing.</Text>

        {step === 'q1' ? (
          <View style={styles.qa}>
            <Text style={styles.question}>{question1}</Text>
            <TextInput
              style={styles.input}
              multiline
              placeholder="Take your time."
              placeholderTextColor={colors.hint}
              value={answer1}
              onChangeText={setAnswer1}
              autoFocus
            />
            <Button
              label="Tell Ember"
              onPress={handleAnswer1}
              disabled={!answer1.trim()}
              style={styles.actionButton}
            />
          </View>
        ) : null}

        {step === 'q2' ? (
          <View style={styles.qa}>
            <Text style={styles.question}>{question2}</Text>
            <TextInput
              style={styles.input}
              multiline
              placeholder="Or leave it here — that's okay too."
              placeholderTextColor={colors.hint}
              value={answer2}
              onChangeText={setAnswer2}
              autoFocus
            />
            <View style={styles.row}>
              <Button
                label={isSaving ? 'Saving…' : 'Tell Ember'}
                onPress={() => finish(answer2)}
                disabled={isSaving || !answer2.trim()}
                style={styles.actionButton}
              />
              <Button
                label="Leave it here"
                variant="pill"
                onPress={() => finish('')}
                disabled={isSaving}
              />
            </View>
          </View>
        ) : null}

        {step === 'done' ? (
          <View style={styles.qa}>
            <Text style={styles.closing}>{closingLine}</Text>
            <Button label="Back to Today" variant="pill" onPress={() => router.back()} style={styles.actionButton} />
          </View>
        ) : null}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: 120,
    alignItems: 'center',
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  bearWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.lanternGlow,
  },
  title: {
    marginTop: spacing.sm,
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.ink,
  },
  subtitle: {
    marginTop: 2,
    marginBottom: spacing.xl,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  qa: {
    width: '100%',
    alignItems: 'center',
  },
  question: {
    fontFamily: fonts.displaySoft,
    fontSize: 20,
    lineHeight: 27,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    width: '100%',
    minHeight: 110,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.backgroundAlt,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 23,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  actionButton: {
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  closing: {
    fontFamily: fonts.displaySoft,
    fontSize: 19,
    lineHeight: 26,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
