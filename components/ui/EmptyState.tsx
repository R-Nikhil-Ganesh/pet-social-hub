import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { WiggleSticker } from '@/components/ui/WiggleSticker';
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
      <View style={styles.stickerRow}>
        <WiggleSticker iconName="sparkles" size={24} iconSize={13} backgroundColor={colors.brand.secondary} />
        <View style={styles.mainIconWrap}>
          {emoji ? (
            <ThemedText style={styles.emoji}>{emoji}</ThemedText>
          ) : (
            <Ionicons name={iconName} size={iconSize} color={iconColor} />
          )}
        </View>
        <WiggleSticker iconName="heart" size={24} iconSize={12} backgroundColor={colors.brand.primary} />
      </View>
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
    borderWidth: 1,
    borderColor: colors.border.soft,
  },
  stickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mainIconWrap: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: colors.border.soft,
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
