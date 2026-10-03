import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { clock, nowState, useSchoolStore } from '../../core/schoolStore';
import { alpha, colors, fonts } from '../../core/theme';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';

function mins(n: number) {
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// Where you are in the school day, updated every minute.
export function NowCard() {
  const classes = useSchoolStore((s) => s.classes);
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const now = nowState(classes);

  const pulse = useSharedValue(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    pulse.value = reduced ? 1 : withRepeat(withTiming(1, { duration: 1400 }), -1, true);
  }, [pulse, reduced]);
  const live = useAnimatedStyle(() => ({ opacity: 0.4 + 0.6 * pulse.value, transform: [{ scale: 0.8 + 0.3 * pulse.value }] }));

  if (now.kind === 'none' || now.kind === 'unscheduled') {
    return (
      <Card onPress={() => router.push('/classes')} style={styles.card}>
        <View style={[styles.icon, { backgroundColor: alpha(colors.flame, 0.14) }]}>
          <Icon name="book" size={22} color={colors.flame} />
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>{now.kind === 'none' ? 'Add your schedule' : 'When do your classes meet?'}</Text>
          <Text style={styles.sub}>
            {now.kind === 'none' ? 'Then this card always knows what’s next.' : 'Add days and times, and this card will know what’s next.'}
          </Text>
        </View>
        <Icon name="chevron" size={18} color={colors.textFaint} />
      </Card>
    );
  }

  if (now.kind === 'free' || now.kind === 'done') {
    return (
      <Card style={styles.card} onPress={() => router.push('/today')}>
        <View style={[styles.icon, { backgroundColor: alpha(colors.secured, 0.14) }]}>
          <Icon name={now.kind === 'free' ? 'sun' : 'moon'} size={22} color={colors.secured} />
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>{now.kind === 'free' ? 'No classes today' : 'Done with classes for today'}</Text>
          <Text style={styles.sub}>{now.kind === 'free' ? 'A day that’s yours.' : 'The rest of the day is yours.'}</Text>
        </View>
      </Card>
    );
  }

  const c = now.cls;
  const inClass = now.kind === 'in';
  return (
    <Card tint={c.color} onPress={() => router.push('/today')} style={styles.card} accessibilityHint="Opens your day">
      <View style={[styles.bar, { backgroundColor: c.color }]} />
      <View style={styles.body}>
        <View style={styles.labelRow}>
          {inClass ? <Animated.View style={[styles.liveDot, { backgroundColor: c.color }, live]} /> : null}
          <Text style={[styles.label, { color: c.color }]}>{inClass ? 'Now' : `Next, in ${mins(now.minsUntil)}`}</Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {c.name}
        </Text>
        <Text style={styles.sub}>
          {inClass ? `Until ${clock(c.end)}, ${mins(now.minsLeft)} left` : `${clock(c.start)} – ${clock(c.end)}`}
          {c.room ? `, room ${c.room}` : ''}
        </Text>
        {inClass && now.next ? <Text style={styles.next}>Then {now.next.name} at {clock(now.next.start)}</Text> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    width: 5,
    alignSelf: 'stretch',
    borderRadius: 3,
  },
  body: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
  },
  title: {
    marginTop: 2,
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.text,
  },
  sub: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  next: {
    marginTop: 6,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textFaint,
  },
});
