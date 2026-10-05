import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Pressy } from '../components/ui/Pressy';
import { Screen } from '../components/ui/Screen';
import { plural } from '../core/words';
import { colors, fonts } from '../core/theme';

// Open-source notices: the packages the app is built with, their licenses,
// and the license texts those licenses ask to ship along
// (assets/licenses.json, made by tools/hub/licenses.mjs).
const DATA: { packages: { n: string; v: string; l: string; t: number | null }[]; texts: string[] } = require('../assets/licenses.json');
const SHOWN = 60;

export default function LicensesScreen() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? DATA.packages.filter((p) => p.n.toLowerCase().includes(s) || p.l.toLowerCase().includes(s)) : DATA.packages;
  }, [q]);

  return (
    <Screen title="Open-source licenses" subtitle={`Brain Navigator is built with ${plural(DATA.packages.length, 'open-source package')}. Thank you to everyone who made them.`}>
      <Field value={q} onChangeText={setQ} placeholder="Search a package or license" autoCapitalize="none" autoCorrect={false} />
      <Card style={styles.gap}>
        {matches.slice(0, SHOWN).map((p) => {
          const id = `${p.n}@${p.v}`;
          const expanded = open === id;
          return (
            <View key={id} style={styles.item}>
              <Pressy
                onPress={() => setOpen(expanded ? null : id)}
                haptic="none"
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                accessibilityLabel={`${p.n}, version ${p.v}, ${p.l} license`}
              >
                <Text style={styles.name}>{p.n}</Text>
                <Text style={styles.meta}>
                  {p.v} · {p.l}
                </Text>
              </Pressy>
              {expanded ? <Text style={styles.text}>{p.t != null ? DATA.texts[p.t] : `Licensed under ${p.l}. The package has no separate license file.`}</Text> : null}
            </View>
          );
        })}
        {matches.length > SHOWN ? <Text style={styles.more}>{plural(matches.length - SHOWN, 'more package')}. Search to find one.</Text> : null}
        {!matches.length ? <Text style={styles.more}>Nothing matches that.</Text> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: {
    marginTop: 14,
  },
  item: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  name: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
  },
  meta: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
  text: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
  },
  more: {
    paddingTop: 12,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textFaint,
  },
});
