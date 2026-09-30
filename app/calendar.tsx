import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip, ChipRow } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { Field } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { CalendarEvent, useGoogleCalendarStore } from '../core/googleCalendarStore';
import { alpha, colors, fonts } from '../core/theme';

const DURATIONS = [15, 30, 60];
const CAL = '#D99A6C';

function formatTime(iso: string) {
  if (!iso.includes('T')) return 'All day';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function minutesBetween(a: string, b: string) {
  if (!a.includes('T') || !b.includes('T')) return null;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
}

export default function CalendarScreen() {
  const signedIn = useGoogleCalendarStore((s) => s.signedIn);
  const events = useGoogleCalendarStore((s) => s.events);
  const isLoading = useGoogleCalendarStore((s) => s.isLoading);
  const isSaving = useGoogleCalendarStore((s) => s.isSaving);
  const error = useGoogleCalendarStore((s) => s.error);
  const restoreSession = useGoogleCalendarStore((s) => s.restoreSession);
  const signIn = useGoogleCalendarStore((s) => s.signIn);
  const signOut = useGoogleCalendarStore((s) => s.signOut);
  const createEvent = useGoogleCalendarStore((s) => s.createEvent);

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const handleAdd = async () => {
    const ok = await createEvent(title, duration);
    if (ok) setTitle('');
  };

  const now = Date.now();
  // Where "now" falls in the day's list, so a marker can sit between events.
  const nowIndex = events.findIndex((e) => e.start.includes('T') && new Date(e.start).getTime() > now);

  return (
    <Screen title="Calendar" subtitle={signedIn ? 'Today, from Google Calendar.' : 'See today’s schedule beside everything else.'}>
      {!signedIn ? (
        <Reveal index={0}>
          <Card tint={CAL} style={styles.connect}>
            <View style={[styles.connectIcon, { backgroundColor: alpha(CAL, 0.14) }]}>
              <Icon name="calendar" size={28} color={CAL} />
            </View>
            <Text style={styles.connectTitle}>Connect Google Calendar</Text>
            <Text style={styles.connectText}>See today’s events here, and add a focus block without leaving the app.</Text>
            <Button label="Connect" icon="calendar" onPress={signIn} style={styles.connectButton} />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </Card>
        </Reveal>
      ) : (
        <>
          <Reveal index={0}>
            <Section title="Today">
              {isLoading ? (
                <Text style={styles.hint}>Loading…</Text>
              ) : events.length > 0 ? (
                <View style={styles.timeline}>
                  {events.map((e, i) => (
                    <View key={e.id}>
                      {i === nowIndex ? <NowMarker /> : null}
                      <EventRow event={e} index={i} past={e.end.includes('T') && new Date(e.end).getTime() < now} />
                    </View>
                  ))}
                  {nowIndex === -1 ? <NowMarker /> : null}
                </View>
              ) : (
                <EmptyState title="A clear day." body="Nothing on your calendar today." />
              )}
            </Section>
          </Reveal>

          <Reveal index={1}>
            <Section title="Add a block" note="It starts now and goes on your Google Calendar.">
              <Card>
                <Field placeholder="e.g. Focus block" value={title} onChangeText={setTitle} />
                <ChipRow style={styles.chips}>
                  {DURATIONS.map((d) => (
                    <Chip key={d} label={`${d} min`} icon="clock" selected={duration === d} onPress={() => setDuration(d)} color={CAL} />
                  ))}
                </ChipRow>
                <Button label="Add to calendar" icon="plus" loading={isSaving} onPress={handleAdd} disabled={isSaving || !title.trim()} style={styles.addButton} />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </Card>
            </Section>
          </Reveal>

          <Reveal index={2}>
            <Button label="Disconnect Google Calendar" variant="ghost" size="sm" onPress={signOut} style={styles.disconnect} tint={colors.textFaint} />
          </Reveal>
        </>
      )}
    </Screen>
  );
}

function NowMarker() {
  return (
    <View style={styles.now}>
      <View style={styles.nowDot} />
      <View style={styles.nowLine} />
      <Text style={styles.nowText}>Now</Text>
    </View>
  );
}

function EventRow({ event, index, past }: { event: CalendarEvent; index: number; past: boolean }) {
  const mins = minutesBetween(event.start, event.end);
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(340)} style={styles.eventRow}>
      <Text style={[styles.eventTime, past && styles.past]}>{formatTime(event.start)}</Text>
      <Card style={[styles.eventCard, past && styles.pastCard]} tint={past ? undefined : CAL}>
        <Text style={[styles.eventTitle, past && styles.past]}>{event.title}</Text>
        {mins != null ? <Text style={styles.eventMeta}>{mins >= 60 ? `${(mins / 60).toFixed(mins % 60 ? 1 : 0)} h` : `${mins} min`}</Text> : null}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  connect: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 28,
  },
  connectIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectTitle: {
    marginTop: 14,
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
  },
  connectText: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
  },
  connectButton: {
    marginTop: 20,
    alignSelf: 'stretch',
  },
  timeline: {
    gap: 10,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventTime: {
    width: 64,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  eventCard: {
    flex: 1,
    width: undefined,
    paddingVertical: 14,
  },
  pastCard: {
    opacity: 0.6,
  },
  eventTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  eventMeta: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  past: {
    color: colors.textFaint,
  },
  now: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  nowDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.flame,
    marginLeft: 50,
  },
  nowLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: alpha(colors.flame, 0.5),
  },
  nowText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.flame,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textFaint,
  },
  chips: {
    marginTop: 12,
  },
  addButton: {
    marginTop: 16,
  },
  errorText: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },
  disconnect: {
    marginTop: 24,
    alignSelf: 'center',
  },
});
