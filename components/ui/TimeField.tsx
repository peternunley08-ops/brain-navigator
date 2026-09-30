import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { clock } from '../../core/schoolStore';
import { alpha, colors, fonts, radii } from '../../core/theme';
import { Chip } from './Chip';
import { Icon } from './Icon';
import { Pressy } from './Pressy';

interface TimeFieldProps {
  label: string;
  /** Minutes after midnight. */
  value: number;
  onChange: (minutes: number) => void;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM – 9 PM
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

// Tap the time to open a row of hours and a row of minutes. No wheels,
// no keyboard — two taps and it's set.
export function TimeField({ label, value, onChange }: TimeFieldProps) {
  const [open, setOpen] = useState(false);
  const h = Math.floor(value / 60);
  const m = value % 60;

  return (
    <View style={styles.wrap}>
      <Pressy onPress={() => setOpen((o) => !o)} style={[styles.field, open && styles.fieldOpen]} accessibilityRole="button" accessibilityLabel={`${label}, ${clock(value)}`}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueRow}>
          <Icon name="clock" size={16} color={colors.flame} strokeWidth={2} />
          <Text style={styles.value}>{clock(value)}</Text>
        </View>
      </Pressy>
      {open ? (
        <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut.duration(120)} style={styles.picker}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {HOURS.map((hr) => (
              <Chip key={hr} label={`${((hr + 11) % 12) + 1} ${hr < 12 ? 'AM' : 'PM'}`} selected={hr === h} onPress={() => onChange(hr * 60 + m)} />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {MINUTES.map((mn) => (
              <Chip key={mn} label={`:${String(mn).padStart(2, '0')}`} selected={mn === m} onPress={() => onChange(h * 60 + mn)} />
            ))}
          </ScrollView>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  field: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSunk,
  },
  fieldOpen: {
    borderColor: alpha(colors.flame, 0.6),
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textFaint,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  value: {
    fontFamily: fonts.bodySemi,
    fontSize: 17,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  picker: {
    marginTop: 8,
    gap: 8,
  },
  row: {
    gap: 6,
    paddingRight: 8,
  },
});
