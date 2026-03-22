import React from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { SkeletonShimmer } from './SkeletonShimmer';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  loading,
  variant = 'primary',
  disabled,
  style,
  accessibilityRole = 'button',
  ...rest
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        style,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
      {...rest}
    >
      <View style={styles.inner}>
        {loading ? (
          <SkeletonShimmer
            width={56}
            height={12}
            borderRadius={radius.pill}
            baseColor={variant === 'primary' ? 'rgba(255,255,255,0.25)' : '#E9E7EF'}
            highlightColor={variant === 'primary' ? 'rgba(255,255,255,0.6)' : '#F7F6FA'}
          />
        ) : (
          <ThemedText
            variant="label"
            style={[
              styles.textBase,
              variant === 'primary' ? styles.textPrimary : styles.textSecondary,
            ]}
          >
            {label}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.lg,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: {
    backgroundColor: colors.brand.primary,
  },
  secondary: {
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.soft,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.65,
  },
  textBase: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
  },
  textPrimary: {
    color: colors.text.inverse,
  },
  textSecondary: {
    color: colors.brand.primary,
  },
});
