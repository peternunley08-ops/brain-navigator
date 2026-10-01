import * as Haptics from '../core/haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EmberSprite } from '../components/ember/EmberSprite';
import { Sparks } from '../components/ember/Sparks';
import { useEmberRig } from '../components/ember/useEmberRig';
import { QuotaPill, useAIStatus } from '../components/helpers/Quota';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { type Helper, HELPERS } from '../core/helpers';
import { dateKey } from '../core/dates';
import { useLifeStore } from '../core/lifeStore';
import { alpha, colors, fonts } from '../core/theme';

// Ember's crew. Each card holds a little living helper; tap one and it
// bursts out to help. `about` (an assignment id) rides along so the helper
// knows what it was called for.
export default function HelpersScreen() {
  const { about } = useLocalSearchParams<{ about?: string }>();
  const chats = useLifeStore((s) => s.helperChats);
  const combo = useLifeStore((s) => s.settings.combo);
  const resume = combo && combo.day === dateKey() && combo.step > 0 && combo.step < 3 ? combo.step : null;
  const st = useAIStatus();

  return (
    <Screen
      glowColor="#B79AF0"
      kicker="Ember’s crew"
      title="Helpers"
      subtitle="Call one over. Each has a free mode that works on your phone, and an AI mode for more."
      right={<QuotaPill />}
    >
      <View style={styles.grid}>
        {HELPERS.map((h, i) => (
          <Reveal key={h.id} index={i} style={styles.cell}>
            <HelperCard helper={h} talked={(chats[h.id]?.length ?? 0) > 1} about={about} />
          </Reveal>
        ))}
      </View>
      <Reveal index={HELPERS.length}>
        <Card
          tint="#7CC4F2"
          onPress={() => {
            const startAt = resume != null ? (['pip', 'quizzo', 'spark'] as const)[resume] : 'pip';
            router.push({ pathname: '/helper/[id]', params: about ? { id: startAt, combo: '1', about } : { id: startAt, combo: '1' } });
          }}
          style={styles.plan}
        >
          <Icon name="people" size={20} color="#7CC4F2" />
          <View style={styles.flex}>
            <Text style={styles.planTitle}>{resume != null ? `Pick up your study session: step ${resume + 1} of 3` : 'Study session'}</Text>
            <Text style={styles.planBody}>Pip plans tonight, Quizzo warms you up, Spark gets you started. All free.</Text>
          </View>
          <Icon name="chevron" size={16} color={colors.textFaint} />
        </Card>
      </Reveal>
      <Reveal index={HELPERS.length + 1}>
        <Card onPress={() => router.push('/plus')} style={styles.plan}>
          <Icon name="sparkle" size={20} color={colors.flame} />
          <View style={styles.flex}>
            <Text style={styles.planTitle}>
              {st.left} of {st.limit} AI replies left {st.plus ? 'this month' : 'this week'}
            </Text>
            <Text style={styles.planBody}>{st.plus ? `Plus. Resets ${st.resets}.` : `Resets ${st.resets}. Plus gives you 400 a month.`}</Text>
          </View>
          <Icon name="chevron" size={16} color={colors.textFaint} />
        </Card>
      </Reveal>
    </Screen>
  );
}

function HelperCard({ helper, talked, about }: { helper: Helper; talked: boolean; about?: string }) {
  const rig = useEmberRig();
  const [burst, setBurst] = useState(0);

  // The "spawn": the little one hops and throws sparks, then you're with it.
  const call = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    rig.setMood('cheer');
    rig.hopUp(20);
    setBurst((b) => b + 1);
    setTimeout(() => router.push({ pathname: '/helper/[id]', params: about ? { id: helper.id, about } : { id: helper.id } }), 380);
    setTimeout(() => rig.setMood('idle'), 1200);
  };

  return (
    <Pressy
      onPress={call}
      depth={0.95}
      style={[styles.card, { borderColor: alpha(helper.color, 0.35) }]}
      accessibilityRole="button"
      accessibilityLabel={`${helper.name}, ${helper.role}`}
      accessibilityHint={helper.tagline}
    >
      <View style={[styles.wash, { backgroundColor: alpha(helper.color, 0.07) }]} />
      <View style={styles.sprite}>
        <Sparks burst={burst} reach={50} />
        <EmberSprite rig={rig} size={62} theme={helper.theme} accessory={helper.accessory} seed={helper.id.length * 1.7} />
      </View>
      <Text style={styles.name}>{helper.name}</Text>
      <Text style={[styles.role, { color: helper.color }]}>{helper.role}</Text>
      <Text style={styles.tagline}>{helper.tagline}</Text>
      {talked ? <Text style={styles.talked}>Chat saved</Text> : null}
    </Pressy>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  grid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    flexBasis: '46%',
    flexGrow: 1,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: 14,
    alignItems: 'center',
    minHeight: 208,
    overflow: 'hidden',
  },
  wash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sprite: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    marginTop: 4,
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.text,
  },
  role: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
  },
  tagline: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textFaint,
    textAlign: 'center',
  },
  talked: {
    marginTop: 6,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textMuted,
  },
  plan: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  planBody: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
});
