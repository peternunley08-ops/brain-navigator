import { StyleSheet, View, ViewProps } from 'react-native';
import { colors } from '../../core/theme';

export function Divider({ style, ...rest }: ViewProps) {
  return <View style={[styles.divider, style]} {...rest} />;
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    backgroundColor: colors.divider,
  },
});
