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
import { ThemedText } from '@/components/ThemedText';
import { useAuthStore } from '@/store/authStore';

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
        <ThemedText style={styles.title}>My Pets</ThemedText>
        <TouchableOpacity onPress={() => router.push('/add-pet')} style={styles.addBtn}>
          <ThemedText style={styles.addBtnText}>+ Add Pet</ThemedText>
        </TouchableOpacity>
      </View>

      {user?.pet_profiles?.length ? (
        <ScrollView contentContainerStyle={styles.list}>
          {user.pet_profiles.map((pet) => (
            <TouchableOpacity
              key={pet.id}
              style={styles.card}
              onPress={() => router.push({ pathname: '/pet/[id]', params: { id: String(pet.id) } } as never)}
            >
              {pet.photo_url ? (
                <Image source={{ uri: pet.photo_url }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.photoFallback]}>
                  <ThemedText style={styles.photoFallbackText}>🐾</ThemedText>
                </View>
              )}
              <View style={styles.meta}>
                <ThemedText style={styles.name}>{pet.name}</ThemedText>
                <ThemedText style={styles.detail}>{pet.breed}</ThemedText>
                <ThemedText style={styles.detail}>{pet.age} years old • {pet.species}</ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyTitle}>No pets yet</ThemedText>
          <ThemedText style={styles.emptyText}>Add a pet profile to tag pets in posts and stories.</ThemedText>
          <TouchableOpacity onPress={() => router.push('/add-pet')} style={styles.emptyCta}>
            <ThemedText style={styles.emptyCtaText}>Add your first pet</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#18181B' },
  addBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
  },
  photo: { width: 64, height: 64, borderRadius: 14 },
  photoFallback: {
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFallbackText: { fontSize: 28 },
  meta: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '700', color: '#18181B' },
  detail: { fontSize: 13, color: '#71717A' },
  emptyState: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    gap: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#18181B' },
  emptyText: { fontSize: 13, color: '#71717A', lineHeight: 18 },
  emptyCta: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  emptyCtaText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});