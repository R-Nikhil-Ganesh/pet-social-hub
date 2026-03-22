import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { colors, spacing, typography } from '@/theme/tokens';

interface ComingSoonScreenProps {
  title: string;
  subtitle?: string;
}

export function ComingSoonScreen({ title, subtitle }: ComingSoonScreenProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="construct-outline" size={48} color={colors.text.secondary} />
        <ThemedText variant="title" style={styles.title}>{title}</ThemedText>
        <ThemedText variant="body" style={styles.subtitle}>
          {subtitle ?? 'This game is coming soon. Check back soon for updates.'}
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.app,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: spacing.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: typography.weight.extrabold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 21,
  },
});
