import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { emberSay } from '../components/ember/EmberBuddy';
import { EmberSprite } from '../components/ember/EmberSprite';
import { useEmberRig } from '../components/ember/useEmberRig';
import { useAIStatus } from '../components/helpers/Quota';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Icon, type IconName } from '../components/ui/Icon';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { aiBreakdown, FREE_PER_WEEK, PLANS, type PlanKey, PLUS_PER_MONTH, purchasePlus, restorePurchases } from '../core/aiQuota';
import { plural } from '../core/words';
import { HELPERS } from '../core/helpers';
import { useLifeStore } from '../core/lifeStore';
import { alpha, colors, fonts, radii } from '../core/theme';

const PERKS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'sparkle', title: `${PLUS_PER_MONTH} AI replies a month`, body: `Instead of ${FREE_PER_WEEK} a week. Talk things through with Ember as much as you need.` },
  { icon: 'people', title: 'The whole crew, in AI mode', body: 'Quizzo on any topic, Pip re-planning your night, Quill on your outline, Sage explaining.' },
  { icon: 'flame', title: 'Keeps the lights on', body: 'AI costs real money per reply. Plus pays for it — and keeps the free version free.' },
];

// Brain Navigator Plus. What stays free is said up front: nothing that
// keeps a student safe or organized is ever behind this.
export default function PlusScreen() {
  const rig = useEmberRig();
  const st = useAIStatus();
  useLifeStore((s) => s.ai); // re-render when a reply is counted
  const used = aiBreakdown();
  const setSettings = useLifeStore((s) => s.setSettings);
  const [plan, setPlan] = useState<PlanKey>('yearly');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const buy = async () => {
    setBusy(true);
    const res = await purchasePlus(plan);
    setBusy(false);
    if (res.ok) {
      setSettings({ plus: true, plusPlan: plan });
      rig.setMood('cheer');
      rig.hopUp(20);
      emberSay('Welcome to Plus. Thank you — really.', 'cheer');
      return;
    }
    setMessage(
      res.reason === 'not_configured'
        ? 'Payments aren’t switched on in this version of the app yet. Nothing was charged. When they are, this button will open the App Store.'
        : 'That didn’t go through. Nothing was charged.'
    );
    rig.setMood('concerned');
    setTimeout(() => rig.setMood('idle'), 1200);
  };

  return (
    <Screen glowColor={colors.flame} tone="ember" motes>
      <View style={styles.hero}>
        <View style={styles.crew}>
          {HELPERS.slice(0, 2).map((h) => (
            <MiniHelper key={h.id} theme={h.theme} accessory={h.accessory} />
          ))}
          <EmberSprite rig={rig} size={96} accessory="cap" />
          {HELPERS.slice(2, 4).map((h) => (
            <MiniHelper key={h.id} theme={h.theme} accessory={h.accessory} />
          ))}
        </View>
        <Text style={styles.kicker}>Brain Navigator</Text>
        <Text style={styles.title}>Plus</Text>
        <Text style={styles.subtitle}>More AI for Ember and the crew.</Text>
      </View>

      <Reveal index={0}>
        <Card style={styles.usage}>
          <Text style={styles.usageTitle}>
            {st.plus ? 'You have Plus' : 'Free plan'}: {st.left} of {st.limit} AI replies left {st.plus ? 'this month' : 'this week'}
          </Text>
          <ProgressBar value={st.used / st.limit} color={st.left <= 3 ? colors.unlocked : colors.flame} style={styles.bar} />
          <Text style={styles.small}>
            Resets {st.resets}
            {st.resets === 'tomorrow' ? '' : `, in ${plural(st.resetsIn, 'day')}`}.
          </Text>
          {used.length ? (
            <View style={styles.log}>
              <Text style={styles.logTitle}>Where they went</Text>
              {used.map((u) => {
                const h = HELPERS.find((x) => x.id === u.who);
                return (
                  <View key={u.label} style={styles.logRow}>
                    <View style={[styles.logDot, { backgroundColor: h?.color ?? colors.flame }]} />
                    <Text style={styles.logName}>{u.label}</Text>
                    <Text style={styles.logCount}>
                      {u.count} repl{u.count === 1 ? 'y' : 'ies'}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </Card>
      </Reveal>

      <Reveal index={1}>
        <View style={styles.perks}>
          {PERKS.map((p) => (
            <View key={p.title} style={styles.perk}>
              <View style={styles.perkIcon}>
                <Icon name={p.icon} size={18} color={colors.flame} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.perkTitle}>{p.title}</Text>
                <Text style={styles.small}>{p.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </Reveal>

      {!st.plus ? (
        <Reveal index={2}>
          <View style={styles.plans}>
            {(Object.keys(PLANS) as PlanKey[]).map((k) => {
              const p = PLANS[k];
              const on = plan === k;
              return (
                <Pressy
                  key={k}
                  onPress={() => setPlan(k)}
                  style={[styles.planCard, on && styles.planOn]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${p.price} a ${p.per}`}
                >
                  {k === 'yearly' ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Best value</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.price, on && { color: colors.flame }]}>{p.price}</Text>
                  <Text style={styles.per}>a {p.per}</Text>
                  <Text style={styles.small}>{p.note}</Text>
                </Pressy>
              );
            })}
          </View>
          <Button label={busy ? 'One moment…' : 'Get Plus'} icon="sparkle" onPress={buy} loading={busy} style={styles.buy} />
          {message ? (
            <Animated.Text entering={FadeInDown} style={styles.message}>
              {message}
            </Animated.Text>
          ) : null}
          <Button
            label="Restore purchases"
            variant="ghost"
            size="sm"
            onPress={async () => {
              const r = await restorePurchases();
              if (!r.ok) setMessage('There’s nothing to restore yet — payments aren’t switched on in this version.');
            }}
            style={styles.restore}
          />
        </Reveal>
      ) : null}

      <Reveal index={3}>
        <Card tint={colors.secured} style={styles.free}>
          <Text style={styles.freeTitle}>Always free, no matter what</Text>
          <Text style={styles.small}>
            Need help now and crisis lines, check-ins, Steady and Breathe, your planner, grades, flashcards and Quizzo’s flashcard games, Pip’s tonight plan, every
            helper’s on-phone mode, and your notes. Plus only adds more AI.
          </Text>
        </Card>
        <Text style={styles.fine}>
          Billed through the App Store once payments are on. Cancel anytime in your Apple ID settings. Under 18? Ask a parent — Apple’s Ask to Buy may send them the
          request.
        </Text>
        {__DEV__ ? (
          <Button
            label={st.plus ? 'Developer: turn Plus off' : 'Developer: pretend I bought Plus'}
            variant="ghost"
            size="sm"
            onPress={() => setSettings({ plus: !st.plus, plusPlan: st.plus ? null : plan })}
            style={styles.restore}
          />
        ) : null}
      </Reveal>
    </Screen>
  );
}

function MiniHelper({ theme, accessory }: { theme: (typeof HELPERS)[number]['theme']; accessory: (typeof HELPERS)[number]['accessory'] }) {
  const rig = useEmberRig();
  return (
    <View style={styles.mini}>
      <EmberSprite rig={rig} size={46} theme={theme} accessory={accessory} />
    </View>
  );
}

const styles = StyleSheet.create({
  log: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: 8,
  },
  logTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.textMuted,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logName: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
  },
  logCount: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  flex: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    marginTop: 6,
  },
  crew: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  mini: {
    marginBottom: 6,
  },
  kicker: {
    marginTop: 12,
    fontFamily: fonts.displaySoft,
    fontSize: 16,
    color: colors.flame,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 50,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textMuted,
  },
  usage: {
    marginTop: 20,
  },
  usageTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.text,
  },
  bar: {
    marginTop: 10,
  },
  small: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textFaint,
  },
  perks: {
    marginTop: 18,
    gap: 14,
  },
  perk: {
    flexDirection: 'row',
    gap: 12,
  },
  perkIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.flame, 0.14),
  },
  perkTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  plans: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  planCard: {
    flex: 1,
    padding: 16,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  planOn: {
    borderColor: colors.flame,
    backgroundColor: alpha(colors.flame, 0.08),
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 12,
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    backgroundColor: colors.flame,
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.flameInk,
  },
  price: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  per: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
  },
  buy: {
    marginTop: 16,
  },
  message: {
    marginTop: 10,
    fontFamily: fonts.displaySoft,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
  },
  restore: {
    alignSelf: 'center',
    marginTop: 6,
  },
  free: {
    marginTop: 22,
  },
  freeTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  fine: {
    marginTop: 12,
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
