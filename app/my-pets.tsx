import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function MyPetsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ThemedText variant="title" style={styles.title}>My Pets</ThemedText>
        <Button onPress={() => router.push('/add-pet')} style={styles.addBtn} label="+ Add Pet" />
      </View>

      {user?.pet_profiles?.length ? (
        <ScrollView contentContainerStyle={styles.list}>
          {user.pet_profiles.map((pet) => (
            <TouchableOpacity
              key={pet.id}
              style={styles.cardWrap}
              onPress={() => router.push({ pathname: '/pet/[id]', params: { id: String(pet.id) } } as never)}
            >
              <Card style={styles.card}>
                <LinearGradient
                  colors={['#FFF4EA', '#FFECDD']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardInner}
                >
                  {pet.photo_url ? (
                    <Image source={{ uri: pet.photo_url }} style={styles.photo} />
                  ) : (
                    <View style={[styles.photo, styles.photoFallback]}>
                      <Ionicons name="paw" size={24} color={colors.brand.primary} />
                    </View>
                  )}
                  <View style={styles.meta}>
                    <ThemedText variant="label" style={styles.name}>{pet.name}</ThemedText>
                    <ThemedText variant="caption" style={styles.detail}>{pet.breed}</ThemedText>
                    <ThemedText variant="caption" style={styles.detail}>{pet.age} years old • {pet.species}</ThemedText>
                  </View>
                </LinearGradient>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyWrap}>
          <Card style={styles.emptyState}>
            <EmptyState
              iconName="paw-outline"
              iconColor={colors.text.secondary}
              title="No pets yet"
              subtitle="Add a pet profile to tag pets in posts and stories."
            />
            <Button onPress={() => router.push('/add-pet')} style={styles.emptyCta} label="Add your first pet" />
          </Card>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.app },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: colors.text.primary },
  addBtn: {
    minWidth: 112,
    minHeight: 44,
  },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  cardWrap: {
    borderRadius: radius.md,
    shadowColor: '#B57E5E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  card: {
    borderRadius: radius.md,
    borderColor: '#F1B3C9',
    borderWidth: 1,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  photo: { width: 64, height: 64, borderRadius: 14 },
  photoFallback: {
    backgroundColor: colors.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1, gap: 2 },
  name: { fontSize: typography.size.md, color: colors.text.primary },
  detail: { color: colors.text.secondary },
  emptyWrap: { padding: spacing.md },
  emptyState: {
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  emptyCta: {
    marginTop: spacing.xs,
    alignSelf: 'center',
    minWidth: 160,
  },
});