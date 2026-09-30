import { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, fonts, radii } from '../../core/theme';

interface FieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  big?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

// A text field sunk into the surface; its edge warms to candle gold while
// you're typing in it.
export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, hint, big, multiline, containerStyle, style, onFocus, onBlur, ...rest },
  ref
) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.hint}
        selectionColor={colors.flame}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          big && styles.big,
          multiline && styles.multiline,
          focused && styles.focused,
          style,
        ]}
        {...rest}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  label: {
    marginBottom: 8,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSunk,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
  },
  big: {
    minHeight: 60,
    fontFamily: fonts.display,
    fontSize: 22,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
    lineHeight: 23,
  },
  focused: {
    borderColor: 'rgba(245, 180, 92, 0.6)',
  },
  hint: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textFaint,
  },
});
