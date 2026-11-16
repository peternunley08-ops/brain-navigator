import { Linking, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import { InfoList } from '../components/InfoList';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { useHubStore } from '../core/hubStore';
import { useLifeStore } from '../core/lifeStore';
import { useBrainNavigatorStore } from '../core/store';
import { alpha, colors, fonts, radii } from '../core/theme';
import { useWellnessStore } from '../core/wellnessStore';
const PHONE = [
  { icon: 'book' as const, title: 'School', body: 'Classes, homework, grades, focus sessions, and your sleep and homework goals.' },
  { icon: 'pen' as const, title: 'Notes and college', body: 'Your Notebook, colleges, essays, scholarships, rec letters, activities, and financial aid.' },
  { icon: 'heart' as const, title: 'You', body: 'Wins, gratitude, hours, countdowns, Your people (names and numbers), the worry box, flashcards, helper chats, badges, and settings.' },
  { icon: 'mic' as const, title: 'Your voice', body: 'Speech to text runs on the phone. The recording never leaves it.' },
  { icon: 'image' as const, title: 'Screenshots you scan', body: 'Read on the phone and thrown away. Nothing is uploaded.' },
];

const ONLINE = [
  { icon: 'sun' as const, title: 'Check-ins', body: 'Mood, sleep, stress, and the note you add.' },
  { icon: 'candle' as const, title: 'Your Desk', body: 'What you set down, how heavy it felt, and how it closed. The Map is built from these.' },
  { icon: 'feather' as const, title: 'Let it out and Talk it through', body: 'What you wrote or said there, once you save it.' },
  { icon: 'list' as const, title: 'Tasks, habits, and food', body: 'Your plate, habit check-offs, and meals if you log them.' },
];

const SENT = [
  { icon: 'chat' as const, title: 'Anthropic (Claude)', body: 'Only when you use an AI chat: your messages and a short note about your day. See How AI works.' },
  { icon: 'calendar' as const, title: 'Google', body: 'Only if you connect Google Calendar, to read and add events.' },
  { icon: 'cap' as const, title: 'Canvas', body: 'Only if you add a Canvas key, to read your to-do list. The key stays in this phone’s keychain and is left out of backups.' },
];

// When GitHub Pages publishes from /docs, docs/legal/index.html is /legal/.
const LEGAL_PAGES = 'https://peternunley08-ops.github.io/brain-navigator/legal/';

/** Quiet FNV-1a hex of a string — no new packages; good enough for a backup fingerprint. */
function quietChecksum(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (`00000000${(h >>> 0).toString(16)}`).slice(-8);
}

// Where everything lives, said plainly, including the parts that aren't locked yet.
export default function PrivacyScreen() {
  const phoneOnly = !!useLifeStore((s) => s.settings.phoneOnly);
  const checkins = useWellnessStore((s) => s.checkins);
  const openLoops = useBrainNavigatorStore((s) => s.openLoops);
  const notes = useHubStore((s) => s.notes);
  const decks = useLifeStore((s) => s.decks);
  const cards = useMemo(() => decks.reduce((n, d) => n + d.cards.length, 0), [decks]);

  const checksum = useMemo(() => {
    const payload = JSON.stringify({
      checkins: checkins.length,
      candles: openLoops.length,
      notes: notes.length,
      cards,
      phoneOnly,
    });
    return quietChecksum(payload);
  }, [checkins.length, openLoops.length, notes.length, cards, phoneOnly]);

  let n = 0;
  return (
    <Screen title="Where your stuff lives" subtitle="On this phone, online, or sent somewhere, and what that means.">
      <Reveal index={n++}>
        <Section title="Where your data lives">
          <Card>
            <View style={[styles.badge, { backgroundColor: alpha(phoneOnly ? colors.secured : colors.flame, 0.12) }]}>
              <Text style={[styles.badgeText, { color: phoneOnly ? colors.secured : colors.flame }]}>
                {phoneOnly ? 'On this phone only' : 'Cloud synced'}
              </Text>
            </View>
            <Text style={styles.badgeHint}>
              {phoneOnly
                ? 'Check-ins, habits, vents, and open loops stay in a file on this phone. School, notes, and flashcards already live here.'
                : 'Check-ins and Desk candles can sync to the app’s database. School, notes, and flashcards stay on this phone.'}
            </Text>
            <View style={styles.counts}>
              <Count label="Check-ins" value={checkins.length} />
              <Count label="Desk candles" value={openLoops.length} />
              <Count label="Notes" value={notes.length} />
              <Count label="Flashcards" value={cards} />
            </View>
            <Text style={styles.checksum}>Quiet fingerprint of these counts: {checksum}</Text>
          </Card>
        </Section>
      </Reveal>
      <Reveal index={n++}>
        <Section title="Only on this phone">
          <Card>
            <InfoList items={PHONE} color={colors.secured} />
          </Card>
        </Section>
      </Reveal>
      <Reveal index={n++}>
        <Section title="Online, in the app’s database">
          <Card>
            <InfoList items={ONLINE} color={colors.flame} />
            <Text style={styles.warn}>
              This is still a one-person version of the app, so the online part doesn’t have a login yet. Treat it like a notebook someone else could open: don’t put anything there you’d be upset for another person to read. Real accounts come before anyone else uses it.
            </Text>
          </Card>
        </Section>
      </Reveal>
      <Reveal index={n++}>
        <Section title="Sent to other services">
          <Card>
            <InfoList items={SENT} color="#8FB4E8" />
          </Card>
        </Section>
      </Reveal>
      <Reveal index={n++}>
        <Section title="Privacy policy, health data, and terms">
          <Card>
            <Text style={styles.policyBody}>
              Brain Navigator has no ads, no tracking pixels, and never sells or shares your schoolwork, mood, sleep, or consumer health data. AI features run only after your explicit consent and can be turned off at any time in Settings.
            </Text>
            <Button
              label="Read the legal pages"
              icon="book"
              variant="secondary"
              size="sm"
              onPress={() => Linking.openURL(LEGAL_PAGES).catch(() => {})}
              style={styles.policyBtn}
            />
            <Button
              label="Privacy Policy (GitHub)"
              icon="book"
              variant="ghost"
              size="sm"
              onPress={() => Linking.openURL('https://github.com/peternunley08-ops/brain-navigator/blob/main/docs/legal/PRIVACY-POLICY.md').catch(() => {})}
              style={styles.policyBtn}
            />
            <Button
              label="Terms of Service (GitHub)"
              icon="list"
              variant="ghost"
              size="sm"
              onPress={() => Linking.openURL('https://github.com/peternunley08-ops/brain-navigator/blob/main/docs/legal/TERMS.md').catch(() => {})}
              style={styles.policyBtn}
            />
            <Button
              label="Crisis protocol (GitHub)"
              icon="heart"
              variant="ghost"
              size="sm"
              onPress={() => Linking.openURL('https://github.com/peternunley08-ops/brain-navigator/blob/main/docs/legal/CRISIS-PROTOCOL.md').catch(() => {})}
              style={styles.policyBtn}
            />
          </Card>
        </Section>
      </Reveal>
      <Reveal index={n++}>
        <Text style={styles.foot}>A backup from Settings holds everything on this phone. Erasing in Settings clears both this phone and your online check-ins and entries.</Text>
      </Reveal>
    </Screen>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.count}>
      <Text style={styles.countValue}>{value}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  badgeText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
  },
  badgeHint: {
    marginTop: 12,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  counts: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  count: {
    minWidth: '40%',
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceHigh,
  },
  countValue: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
  },
  countLabel: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textFaint,
  },
  checksum: {
    marginTop: 14,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  warn: {
    marginTop: 16,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.unlocked,
  },
  policyBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  policyBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  foot: {
    marginTop: 18,
    fontFamily: fonts.displaySoft,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
