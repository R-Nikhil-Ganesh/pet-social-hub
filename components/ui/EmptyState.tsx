import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { colors, radius, spacing } from '@/theme/tokens';

type EmptyStateProps = {
  emoji?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconSize?: number;
  title: string;
  subtitle?: string;
};

export function EmptyState({
  emoji,
  iconName = 'help-circle-outline',
  iconColor = colors.text.secondary,
  iconSize = 40,
  title,
  subtitle,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {emoji ? (
        <ThemedText style={styles.emoji}>{emoji}</ThemedText>
      ) : (
        <Ionicons name={iconName} size={iconSize} color={iconColor} />
      )}
      <ThemedText variant="title" style={styles.title}>{title}</ThemedText>
      {subtitle ? (
        <ThemedText variant="body" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
  },
  emoji: {
    fontSize: 42,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
});
