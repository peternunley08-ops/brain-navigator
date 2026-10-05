import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { emberSay } from '../components/ember/EmberBuddy';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Icon, type IconName } from '../components/ui/Icon';
import { Pressy } from '../components/ui/Pressy';
import { Reveal } from '../components/ui/Reveal';
import { Screen } from '../components/ui/Screen';
import { Section } from '../components/ui/Section';
import { normalizeCanvasUrl, syncCanvas } from '../core/canvas';
import { useGoogleCalendarStore } from '../core/googleCalendarStore';
import { useHubStore } from '../core/hubStore';
import { openSafe } from '../core/links';
import { alpha, colors, fonts } from '../core/theme';

const SCHOOL_REQUEST = `Hi, I use an app called Brain Navigator to keep track of my classes and assignments. My school Google account blocks it from connecting to Google Classroom and Calendar. Could the school approve it in the Google Admin console (Security → API controls → App access control)? It only needs read-only access to my own classes and coursework. Thank you!`;

// Everything a student already uses, in one place: what can truly connect
// (Google Calendar, Canvas), what comes in by screenshot (Classroom), and
// one-tap shortcuts for the rest (Aeries, ParentSquare, Common App, Gmail,
// Drive, Notion, Claude) — those don't let other apps read your data.
export default function ConnectionsScreen() {
  const googleSignedIn = useGoogleCalendarStore((s) => s.signedIn);
  const restoreSession = useGoogleCalendarStore((s) => s.restoreSession);
  const canvas = useHubStore((s) => s.canvas);
  const links = useHubStore((s) => s.links);
  const setCanvas = useHubStore((s) => s.setCanvas);
  const setLinks = useHubStore((s) => s.setLinks);

  const [canvasOpen, setCanvasOpen] = useState(false);
  const [url, setUrl] = useState(canvas.baseUrl);
  const [token, setToken] = useState(canvas.token);
  const [syncing, setSyncing] = useState(false);
  const [canvasMsg, setCanvasMsg] = useState<string | null>(null);
  const [aeriesOpen, setAeriesOpen] = useState(false);
  const [aeries, setAeries] = useState(links.aeries);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const canvasReady = !!canvas.baseUrl && !!canvas.token;

  const runSync = async () => {
    setSyncing(true);
    setCanvasMsg(null);
    const r = await syncCanvas();
    setSyncing(false);
    if (!r.ok) {
      setCanvasMsg(r.message);
      return;
    }
    const msg = r.added || r.updated ? `Canvas: ${r.added} new, ${r.updated} updated${r.classes ? `, ${r.classes} classes added` : ''}.` : 'Canvas is already up to date.';
    setCanvasMsg(msg);
    emberSay(msg, r.added ? 'cheer' : 'happy');
  };

  return (
    <Screen title="Connections" subtitle="Your school apps, in one place.">
      <Reveal index={0}>
        <Section title="Connected">
          <Row
            icon="calendar"
            color="#D99A6C"
            title="Google Calendar"
            body={googleSignedIn ? 'Connected. Today’s events show on your Calendar.' : 'See today’s events, and add study blocks.'}
            status={googleSignedIn ? 'on' : undefined}
            onPress={() => router.push('/calendar')}
          />
          <Row
            icon="book"
            color="#E5534B"
            title="Canvas"
            body={canvasReady ? `Syncs your due dates.${canvas.lastSync ? ' Last synced ' + new Date(canvas.lastSync).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }) + '.' : ''}` : 'Pull in every due date from your Canvas.'}
            status={canvasReady ? 'on' : undefined}
            onPress={() => setCanvasOpen((v) => !v)}
          />
          {canvasOpen ? (
            <Animated.View entering={FadeInDown.duration(240)}>
              <Card style={styles.panel}>
                <Text style={styles.panelText}>
                  In Canvas, open Account → Settings → New access token, give it a name like “Brain Navigator,” and copy the token. It stays on this
                  phone, locked in the iPhone keychain.
                </Text>
                <Field label="Your Canvas address" placeholder="yourschool.instructure.com" autoCapitalize="none" autoCorrect={false} keyboardType="url" value={url} onChangeText={setUrl} containerStyle={styles.gap} />
                <Field label="Access token" placeholder="Paste it here" autoCapitalize="none" autoCorrect={false} secureTextEntry value={token} onChangeText={setToken} containerStyle={styles.gap} />
                <Button
                  label={canvasReady && url === canvas.baseUrl && token === canvas.token ? 'Sync now' : 'Save and sync'}
                  icon="repeat"
                  loading={syncing}
                  disabled={!url.trim() || !token.trim()}
                  onPress={() => {
                    setCanvas({ baseUrl: normalizeCanvasUrl(url), token: token.trim() });
                    runSync();
                  }}
                  style={styles.gap}
                />
                {canvasMsg ? <Text style={styles.msg}>{canvasMsg}</Text> : null}
                {canvasReady ? (
                  <Button
                    label="Disconnect Canvas"
                    variant="ghost"
                    size="sm"
                    tint={colors.textFaint}
                    onPress={() => {
                      setCanvas({ baseUrl: '', token: '', lastSync: null });
                      setUrl('');
                      setToken('');
                      setCanvasMsg(null);
                    }}
                    style={styles.center}
                  />
                ) : null}
              </Card>
            </Animated.View>
          ) : null}
        </Section>
      </Reveal>

      <Reveal index={1}>
        <Section title="Google Classroom" note="Works even if your school blocks outside apps.">
          <Card tint="#AFA2DE">
            <Text style={styles.panelText}>Screenshot your Classroom home screen or To-do list, and your phone reads it. Nothing is uploaded.</Text>
            <View style={styles.row2}>
              <Button label="Scan a screenshot" icon="image" onPress={() => router.push('/scan')} style={styles.flex} size="sm" />
              <Button label="Open Classroom" icon="arrow" variant="secondary" size="sm" onPress={() => Linking.openURL('https://classroom.google.com')} style={styles.flex} />
            </View>
            <Pressy onPress={() => Share.share({ message: SCHOOL_REQUEST })} style={styles.ask} accessibilityRole="button">
              <Icon name="message" size={15} color={colors.textMuted} />
              <Text style={styles.askText}>Want a direct connection? Send your school’s IT a request</Text>
            </Pressy>
          </Card>
        </Section>
      </Reveal>

      <Reveal index={2}>
        <Section title="Shortcuts" note="These apps don’t let others read your data, so here they’re one tap away.">
          <Row
            icon="cap"
            color="#8FB4E8"
            title="Aeries"
            body={links.aeries ? 'Grades and attendance' : 'Add your district’s Aeries link'}
            onPress={() => (links.aeries ? openSafe(links.aeries) : setAeriesOpen(true))}
            onLongPress={() => setAeriesOpen(true)}
          />
          {aeriesOpen ? (
            <Card style={styles.panel}>
              <Field label="Your district’s Aeries portal" placeholder="e.g. yourdistrict.aeries.net/student" autoCapitalize="none" autoCorrect={false} keyboardType="url" value={aeries} onChangeText={setAeries} />
              <Button
                label="Save"
                size="sm"
                icon="check"
                disabled={!aeries.trim()}
                onPress={() => {
                  setLinks({ aeries: aeries.trim() });
                  setAeriesOpen(false);
                }}
                style={styles.gap}
              />
            </Card>
          ) : null}
          <Row icon="message" color="#9FD08A" title="ParentSquare" body="School messages and announcements" onPress={() => openSafe(links.parentsquare)} />
          <Row icon="flag" color="#F5B45C" title="Common App" body="Plus your own tracker for every college" onPress={() => router.push('/college')} extra={{ label: 'Open site', onPress: () => Linking.openURL('https://apply.commonapp.org') }} />
          <Row icon="message" color="#F07060" title="Gmail" body="Your inbox" onPress={() => Linking.openURL('https://mail.google.com')} />
          <Row icon="jar" color="#8CC0A8" title="Google Drive" body="Docs and files" onPress={() => Linking.openURL('https://drive.google.com')} />
          <Row icon="pen" color="#C3B3A0" title="Notion" body="Your tasks, check-ins, and entries sync there automatically" onPress={() => Linking.openURL('https://www.notion.so')} />
          <Row icon="sparkle" color="#D99A6C" title="Claude" body="Ember’s thinking brain, or open Claude itself" onPress={() => router.push('/companion')} extra={{ label: 'Open Claude', onPress: () => Linking.openURL('https://claude.ai') }} />
        </Section>
      </Reveal>
    </Screen>
  );
}

function Row({
  icon,
  color,
  title,
  body,
  status,
  onPress,
  onLongPress,
  extra,
}: {
  icon: IconName;
  color: string;
  title: string;
  body: string;
  status?: 'on';
  onPress: () => void;
  onLongPress?: () => void;
  extra?: { label: string; onPress: () => void };
}) {
  return (
    <Card onPress={onPress} onLongPress={onLongPress} style={styles.rowCard}>
      <View style={[styles.icon, { backgroundColor: alpha(color, 0.14), borderColor: alpha(color, 0.3) }]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <View style={styles.flex}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {status === 'on' ? (
            <View style={styles.on}>
              <View style={styles.onDot} />
              <Text style={styles.onText}>Connected</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.body}>{body}</Text>
        {extra ? (
          <Pressy onPress={extra.onPress} hitSlop={8} style={styles.extra}>
            <Text style={styles.extraText}>{extra.label}</Text>
          </Pressy>
        ) : null}
      </View>
      <Icon name="chevron" size={18} color={colors.textFaint} />
    </Card>
  );
}

const styles = StyleSheet.create({
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.text,
  },
  body: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  on: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secured,
  },
  onText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.secured,
  },
  extra: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  extraText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.flame,
  },
  panel: {
    marginBottom: 12,
  },
  panelText: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  gap: {
    marginTop: 12,
  },
  msg: {
    marginTop: 10,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.text,
    textAlign: 'center',
  },
  center: {
    marginTop: 6,
    alignSelf: 'center',
  },
  row2: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  ask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  askText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
  },
});
