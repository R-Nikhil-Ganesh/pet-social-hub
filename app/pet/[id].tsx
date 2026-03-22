import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pet = useAuthStore((s) => s.user?.pet_profiles.find((item) => item.id === Number(id)));

  if (!pet) {
    return (
      <View style={styles.center}>
        <EmptyState iconName="paw-outline" iconColor={colors.text.secondary} title="Pet not found" subtitle="This pet profile may have been removed." />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Card style={styles.card}>
        <ThemedText variant="display" style={styles.name}>{pet.name}</ThemedText>
        <ThemedText variant="body" style={styles.meta}>{pet.breed}</ThemedText>
        <ThemedText variant="body" style={styles.meta}>{pet.age} years old</ThemedText>
        <ThemedText variant="body" style={styles.meta}>{pet.species}</ThemedText>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.app, padding: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.app, paddingHorizontal: spacing.md },
  card: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  name: { fontSize: 24, color: colors.text.primary },
  meta: { fontSize: typography.size.md, color: colors.text.secondary },
});