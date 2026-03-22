import React from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type InputProps = TextInputProps & {
  label?: string;
  errorText?: string;
};

export function Input({ label, errorText, style, ...rest }: InputProps) {
  return (
    <View style={styles.group}>
      {label ? <ThemedText variant="label" style={styles.label}>{label}</ThemedText> : null}
      <TextInput
        style={[styles.input, errorText ? styles.inputError : null, style]}
        placeholderTextColor={colors.text.muted}
        {...rest}
      />
      {errorText ? (
        <ThemedText variant="caption" style={styles.errorText}>
          {errorText}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text.secondary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border.soft,
    borderRadius: radius.md,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.size.sm,
    lineHeight: 20,
    color: colors.text.primary,
    backgroundColor: colors.bg.muted,
  },
  inputError: {
    borderColor: colors.state.danger,
  },
  errorText: {
    color: colors.state.danger,
  },
});
