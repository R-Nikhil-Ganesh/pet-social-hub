import React from 'react';
import { Text, TextProps } from 'react-native';
import { colors, typography } from '@/theme/tokens';

type TextVariant = 'display' | 'title' | 'body' | 'caption' | 'label';

export type ThemedTextProps = TextProps & {
  variant?: TextVariant;
};

const variantStyles = {
  display: {
    fontSize: typography.size.xxl,
    lineHeight: 36,
    fontWeight: typography.weight.extrabold,
    letterSpacing: typography.letterSpacing.header,
    color: colors.text.primary,
  },
  title: {
    fontSize: typography.size.xl,
    lineHeight: 30,
    fontWeight: typography.weight.bold,
    letterSpacing: typography.letterSpacing.header,
    color: colors.text.primary,
  },
  body: {
    fontSize: typography.size.sm,
    lineHeight: Math.round(typography.size.sm * 1.5),
    fontWeight: typography.weight.regular,
    letterSpacing: typography.letterSpacing.body,
    color: colors.text.secondary,
  },
  caption: {
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.tight,
    fontWeight: typography.weight.regular,
    color: colors.text.muted,
  },
  label: {
    fontSize: typography.size.sm,
    lineHeight: 20,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
};

export function ThemedText({ variant = 'body', style, ...rest }: ThemedTextProps) {
  return <Text style={[variantStyles[variant], style]} {...rest} />;
}
