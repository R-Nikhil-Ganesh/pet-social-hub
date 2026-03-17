import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useAuthStore } from '@/store/authStore';

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pet = useAuthStore((s) => s.user?.pet_profiles.find((item) => item.id === Number(id)));

  if (!pet) {
    return (
      <View style={styles.center}>
        <ThemedText style={styles.empty}>Pet not found.</ThemedText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <ThemedText style={styles.name}>{pet.name}</ThemedText>
        <ThemedText style={styles.meta}>{pet.breed}</ThemedText>
        <ThemedText style={styles.meta}>{pet.age} years old</ThemedText>
        <ThemedText style={styles.meta}>{pet.species}</ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB', padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9F9FB' },
  empty: { color: '#71717A' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 20, gap: 8 },
  name: { fontSize: 24, fontWeight: '800', color: '#18181B' },
  meta: { fontSize: 15, color: '#52525B' },
});