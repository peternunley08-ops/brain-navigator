import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { InfoList } from '../components/InfoList';
import { useAIStatus } from '../components/helpers/Quota';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { IconButton } from '../components/ui/IconButton';
import { Pressy } from '../components/ui/Pressy';
import { Card } from '../components/ui/Card';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { aiSpend, FREE_PER_WEEK, PLANS, PLUS_PER_MONTH } from '../core/aiQuota';
import { askJob, whyOffline } from '../core/emberAI';
import { HELPERS } from '../core/helpers';
import { useLifeStore } from '../core/lifeStore';
import { colors, fonts } from '../core/theme';

const FREE_TOOLS = [
  { icon: 'people' as const, title: 'Every helper’s own mode', body: 'Quizzo’s games, Pip’s plans, Quill’s questions, Sage’s explain-it-back, Spark’s starts. They run on your phone and never run out.' },
  { icon: 'flame' as const, title: 'Ember’s tips', body: 'What Ember says when you tap it comes from rules over your own data, not AI.' },
  { icon: 'steady' as const, title: 'Every wellness tool', body: 'Breathing, grounding, the toolkit, check-ins, the worry box, and the help lines.' },
  { icon: 'image' as const, title: 'Scanning screenshots', body: 'Your phone reads the text itself. Nothing is sent anywhere.' },
];

const SENT = [
  { icon: 'chat' as const, title: 'What you type, and the chat so far', body: 'The last few messages, so the reply makes sense. Phone numbers, emails, and street addresses are blanked on your phone first.' },
  { icon: 'book' as const, title: 'A short note about your day', body: 'Your first name, grade, bedtime, next class, what’s due this week, the titles of what’s open on your Desk, and today’s check-in numbers. “Keep my Desk private” leaves out the Desk and check-in. Hold any Ember reply to see exactly what was sent. Never your notes, grades, or journal, unless you tap a button that says it sends one.' },
  { icon: 'arrow' as const, title: 'Where it goes', body: 'Through this app’s server to Anthropic, the company that makes Claude, which writes the reply.' },
];

// What the AI does, what it costs, and what leaves the phone, in plain words.
export default function AIScreen() {
  const st = useAIStatus();
  const aiOff = useLifeStore((s) => !!s.settings.aiOff);
  const consentAt = useLifeStore((s) => s.settings.aiConsentAt);
  const memoryOff = useLifeStore((s) => !!s.settings.memoryOff);
  const memory = useLifeStore((s) => s.emberMemory);
  const rated = useLifeStore((s) => s.replyFeedback);
  const [openRating, setOpenRating] = useState<string | null>(null);
  useLifeStore((s) => s.ai);
  const spend = aiSpend(30);
  const [test, setTest] = useState<{ busy: boolean; line: string | null }>({ busy: false, line: null });
  let n = 0;

  const runTest = async () => {
    setTest({ busy: true, line: null });
    const res = await askJob('ping', 'Can you hear me?', { who: 'test' });
    setTest({
      busy: false,
      line: res.ok ? `“${(res.data as { reply: string }).reply}” — ${/haiku/.test(res.model) ? 'Claude Haiku' : 'Claude Sonnet'}, ${(res.ms / 1000).toFixed(1)} seconds.` : whyOffline(res.reason),
    });
  };

  // Ratings never leave the phone on their own; Share is the student's choice.
  const shareRatings = () => {
    const text = [...rated]
      .reverse()
      .map((r) =>
        [
          `${r.verdict === 'good' ? 'Good reply' : 'Reply was off'} · ${new Date(r.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${r.v ? ` · prompt v${r.v}` : ''}`,
          ...(r.lines ?? [{ from: 'ember' as const, text: r.reply }]).map((l) => `${l.from === 'ember' ? 'Ember' : 'Me'}: ${l.text}`),
        ].join('\n'),
      )
      .join('\n\n---\n\n');
    Share.share({ message: text }).catch(() => {});
  };

  const clearChats = () =>
    Alert.alert('Clear every AI chat?', 'Helper chats start over. Saved Ember conversations stay in your journal.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          for (const h of HELPERS) useLifeStore.getState().setHelperChat(h.id, []);
        },
      },
    ]);
  return (
    <Screen title="How AI works here" subtitle="What’s free, what’s sent, and what it costs.">
      <Reveal index={n++}>
        <Card tint={colors.flame} style={styles.top}>
          <Text style={styles.big}>
            {st.left} of {st.limit} AI replies left {st.plus ? 'this month' : 'this week'}
          </Text>
          <Text style={styles.body}>Only replies written by AI count, and only when one actually arrives. If it can’t answer, nothing is used.</Text>
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <Text style={styles.switchTitle}>Turn off AI everywhere</Text>
              <Text style={styles.body}>Ember and the helpers use only what’s on your phone. Nothing is sent.</Text>
            </View>
            <Switch value={aiOff} onValueChange={(v) => useLifeStore.getState().setSettings({ aiOff: v })} trackColor={{ true: colors.flame }} accessibilityLabel="Turn off AI everywhere" />
          </View>
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <Text style={styles.switchTitle}>Your OK to send to the AI</Text>
              <Text style={styles.body}>
                {consentAt
                  ? `Given ${new Date(consentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}. Take it back and nothing is sent until you agree again.`
                  : 'Not given yet. Ember asks the first time you want an AI reply.'}
              </Text>
            </View>
            <Switch
              value={!!consentAt}
              onValueChange={(on) => (on ? router.push('/ai-consent') : useLifeStore.getState().setSettings({ aiConsentAt: undefined }))}
              trackColor={{ true: colors.flame }}
              accessibilityLabel="Your OK to send to the AI"
            />
          </View>
        </Card>
      </Reveal>
      <Reveal index={n++}>
        <Section title="Free, always">
          <Card>
            <InfoList items={FREE_TOOLS} color={colors.secured} />
          </Card>
        </Section>
      </Reveal>
      <Reveal index={n++}>
        <Section title="What uses AI">
          <Card>
            <Text style={styles.body}>
              Talking it through with Ember after its first question, the AI chat with any helper, and buttons marked with a sparkle (like breaking an assignment into steps or making cards from a note). Each reply is written by Claude. It can be wrong, so check facts that matter. Nothing the AI suggests happens until you tap it.
            </Text>
          </Card>
        </Section>
      </Reveal>
      <Reveal index={n++}>
        <Section title="What gets sent">
          <Card>
            <InfoList items={SENT} color={colors.flame} />
          </Card>
        </Section>
      </Reveal>
      <Reveal index={n++}>
        <Section title="What it costs">
          <Card>
            <Text style={styles.body}>
              Free: {FREE_PER_WEEK} replies a week, starting over each Monday. Plus: {PLUS_PER_MONTH} a month for {PLANS.monthly.price} a month or {PLANS.yearly.price} a year. Each reply costs real money to make, which is why there’s a limit.
            </Text>
            <Button label="See Plus" icon="sparkle" variant="secondary" size="sm" onPress={() => router.push('/plus')} style={styles.btn} />
          </Card>
        </Section>
      </Reveal>
      <Reveal index={n++}>
        <Section title="What Ember remembers" note={memoryOff ? 'Off' : memory.length ? `${memory.length} kept` : undefined}>
          <Card>
            <View style={styles.switchRow}>
              <View style={styles.flex}>
                <Text style={styles.switchTitle}>Ember’s memory</Text>
                <Text style={styles.body}>After a chat, Ember can ask to keep one line about it, and facts you agree to. They stay on your phone and go along only with your next chats with Ember.</Text>
              </View>
              <Switch
                value={!memoryOff}
                onValueChange={(on) => useLifeStore.getState().setSettings({ memoryOff: !on })}
                trackColor={{ true: colors.flame }}
                accessibilityLabel="Ember’s memory"
              />
            </View>
            {memory.length ? (
              <View style={styles.memList}>
                {[...memory].reverse().map((m) => (
                  <View key={m.id} style={styles.memRow}>
                    <View style={styles.flex}>
                      <Text style={styles.memText}>{m.text}</Text>
                      <Text style={styles.memMeta}>
                        {m.kind === 'fact' ? 'Something you told Ember' : new Date(m.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {m.followUp && !m.followedUp ? ` · will ask about ${m.followUp}` : ''}
                      </Text>
                    </View>
                    <IconButton icon="close" label={`Forget: ${m.text}`} size={30} onPress={() => useLifeStore.getState().forget(m.id)} />
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.body, styles.testLine]}>Nothing yet.</Text>
            )}
            {memory.length ? <Button label="Forget everything" variant="ghost" size="sm" tint={colors.danger} onPress={() => useLifeStore.getState().forgetAll()} style={styles.btn} /> : null}
          </Card>
        </Section>
      </Reveal>
      {rated.length ? (
        <Reveal index={n++}>
          <Section title="Replies you rated" note={`${rated.filter((r) => r.verdict === 'good').length} good, ${rated.filter((r) => r.verdict === 'off').length} off`}>
            <Card>
              <Text style={styles.body}>Hold any Ember reply to rate it. Ratings stay on your phone. Share them only if you want someone to look them over.</Text>
              <View style={styles.memList}>
                {[...rated].reverse().map((r) => {
                  const open = openRating === r.id;
                  return (
                    <Pressy
                      key={r.id}
                      depth={0.99}
                      haptic="none"
                      onPress={() => setOpenRating(open ? null : r.id)}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: open }}
                      accessibilityLabel={`${r.verdict === 'good' ? 'Good reply' : 'Reply was off'}: ${r.reply}`}
                      style={styles.memRow}
                    >
                      <Icon name={r.verdict === 'good' ? 'heart' : 'flag'} size={15} color={r.verdict === 'good' ? colors.flame : colors.textMuted} />
                      <View style={styles.flex}>
                        {open && r.lines ? (
                          r.lines.map((l, k) => (
                            <Text key={k} style={[styles.memText, l.from === 'you' && styles.rateYou]}>
                              {l.from === 'ember' ? 'Ember' : 'You'}: {l.text}
                            </Text>
                          ))
                        ) : (
                          <Text style={styles.memText} numberOfLines={open ? undefined : 2}>
                            {r.reply}
                          </Text>
                        )}
                        <Text style={styles.memMeta}>
                          {new Date(r.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {r.verdict === 'off' && !open ? ' · tap to see the chat' : ''}
                        </Text>
                      </View>
                      <IconButton icon="close" label="Remove this rating" size={30} onPress={() => useLifeStore.getState().unrateReply(r.id)} />
                    </Pressy>
                  );
                })}
              </View>
              <View style={styles.btnRow}>
                <Button label="Share" icon="share" variant="secondary" size="sm" onPress={shareRatings} />
                <Button label="Clear" variant="ghost" size="sm" tint={colors.danger} onPress={() => useLifeStore.getState().clearFeedback()} />
              </View>
            </Card>
          </Section>
        </Reveal>
      ) : null}
      <Reveal index={n++}>
        <Section title="Under the hood">
          <Card>
            <Text style={styles.body}>
              Ember and the helpers think with Claude Sonnet 5.5, which reasons before it answers. Quick background jobs, like naming a chat, use the faster Claude Haiku 4.5.
              {spend.replies
                ? ` Over the last 30 days: ${spend.replies} ${spend.replies === 1 ? 'reply' : 'replies'}, about ${spend.perReply < 1 ? 'a penny or less' : `${spend.perReply.toFixed(1)}¢`} each${spend.typicalMs ? `, usually in about ${Math.max(1, Math.round(spend.typicalMs / 1000))} seconds` : ''}.`
                : ''}
            </Text>
            <View style={styles.btnRow}>
              <Button label={test.busy ? 'Asking…' : 'Test Ember’s brain'} icon="sparkle" variant="secondary" size="sm" onPress={runTest} disabled={test.busy || aiOff} />
              <Button label="Clear every AI chat" variant="ghost" size="sm" tint={colors.danger} onPress={clearChats} />
            </View>
            {test.line ? <Text style={[styles.body, styles.testLine]}>{test.line}</Text> : null}
          </Card>
        </Section>
      </Reveal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    marginTop: 16,
    gap: 6,
  },
  big: {
    fontFamily: fonts.display,
    fontVariant: ['tabular-nums'],
    fontSize: 20,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  btn: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  btnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  testLine: {
    marginTop: 10,
  },
  memList: {
    marginTop: 12,
    gap: 10,
  },
  memRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rateYou: {
    color: colors.textMuted,
  },
  memText: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
  },
  memMeta: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  switchTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  flex: {
    flex: 1,
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
