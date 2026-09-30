import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../core/theme';
import { Icon } from './Icon';
import { Pressy } from './Pressy';

interface StepperProps {
  value: string | number;
  onDecrement: () => void;
  onIncrement: () => void;
  label?: string;
  minWidth?: number;
}

export function Stepper({ value, onDecrement, onIncrement, label, minWidth = 44 }: StepperProps) {
  return (
    <View style={styles.row}>
      <Pressy
        onPress={onDecrement}
        depth={0.88}
        style={styles.btn}
        accessibilityRole="button"
        accessibilityLabel={label ? `Less ${label}` : 'Less'}
      >
        <Icon name="minus" size={16} color={colors.textMuted} strokeWidth={2.2} />
      </Pressy>
      <Text style={[styles.value, { minWidth }]}>{value}</Text>
      <Pressy
        onPress={onIncrement}
        depth={0.88}
        style={styles.btn}
        accessibilityRole="button"
        accessibilityLabel={label ? `More ${label}` : 'More'}
      >
        <Icon name="plus" size={16} color={colors.textMuted} strokeWidth={2.2} />
      </Pressy>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.line,
  },
  value: {
    textAlign: 'center',
    fontFamily: fonts.bodySemi,
    fontSize: 17,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
