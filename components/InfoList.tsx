import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../core/theme';
import { Icon, type IconName } from './ui/Icon';

// Plain rows for the explainer pages: an icon, a short bold line, and the detail.
export function InfoList({ items, color }: { items: { icon: IconName; title: string; body: string }[]; color: string }) {
  return (
    <View style={styles.list}>
      {items.map((it) => (
        <View key={it.title} style={styles.row}>
          <Icon name={it.icon} size={18} color={color} />
          <View style={styles.flex}>
            <Text style={styles.title}>{it.title}</Text>
            <Text style={styles.body}>{it.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  flex: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  body: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
});
