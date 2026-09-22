import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { colors, fonts, radii, spacing } from '../core/theme';
import { CalendarEvent, useGoogleCalendarStore } from '../core/googleCalendarStore';

const DURATIONS = [15, 30, 60];

function formatTime(iso: string) {
  if (!iso.includes('T')) return 'All day';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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

  return (
    <View style={styles.outer}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <Button label="Back" variant="pill" onPress={() => router.back()} style={styles.back} />

        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>
          {signedIn ? "Today's schedule" : 'Connect your Google Calendar'}
        </Text>

        {!signedIn ? (
          <View style={styles.connectCard}>
            <Text style={styles.connectText}>
              See today's events alongside your check-in, and add new ones without leaving the app.
            </Text>
            <Button label="Connect Google Calendar" onPress={signIn} style={styles.connectButton} />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        ) : (
          <>
            <Card style={styles.addCard}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Focus block"
                placeholderTextColor={colors.hint}
                value={title}
                onChangeText={setTitle}
              />
              <View style={styles.durationRow}>
                {DURATIONS.map((d) => {
                  const active = duration === d;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setDuration(d)}
                      style={[styles.durationChip, active && styles.durationChipActive]}
                    >
                      <Text style={[styles.durationChipText, active && styles.durationChipTextActive]}>
                        {d} min
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Button
                label={isSaving ? 'Adding…' : 'Add to Calendar (starts now)'}
                onPress={handleAdd}
                disabled={isSaving || !title.trim()}
                style={styles.addButton}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </Card>

            {isLoading ? (
              <Text style={styles.hint}>Loading…</Text>
            ) : events.length > 0 ? (
              <View style={styles.list}>
                {events.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </View>
            ) : (
              <Text style={styles.hint}>Nothing on your calendar today.</Text>
            )}

            <Button label="Disconnect" variant="pill" onPress={signOut} style={styles.disconnectButton} />
          </>
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

function EventRow({ event }: { event: CalendarEvent }) {
  return (
    <Card style={styles.eventCard}>
      <Text style={styles.eventTime}>{formatTime(event.start)}</Text>
      <Text style={styles.eventTitle}>{event.title}</Text>
    </Card>
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
    paddingBottom: 100,
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.ink,
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.inkFaint,
  },
  connectCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.backgroundAlt,
  },
  connectText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkMuted,
    marginBottom: spacing.md,
  },
  connectButton: {},
  addCard: {
    gap: spacing.sm,
  },
  input: {
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
    borderRadius: radii.lg,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.background,
  },
  durationRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  durationChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.background,
  },
  durationChipActive: {
    backgroundColor: colors.leather,
    borderColor: colors.leather,
  },
  durationChipText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.inkMuted,
  },
  durationChipTextActive: {
    color: colors.background,
  },
  addButton: {
    marginTop: spacing.xs,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.danger,
  },
  list: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTime: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.inkFaint,
    width: 76,
  },
  eventTitle: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
  },
  hint: {
    marginTop: spacing.xl,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.hint,
  },
  disconnectButton: {
    marginTop: spacing.xl,
    alignSelf: 'center',
  },
});
