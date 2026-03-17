import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';

export default function AddPetScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [species, setSpecies] = useState<'dog' | 'cat' | 'bird' | 'rabbit' | 'other'>('dog');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !breed.trim() || !age.trim()) {
      Alert.alert('Missing info', 'Name, breed, and age are required.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/users/pets', {
        name: name.trim(),
        breed: breed.trim(),
        age: Number(age),
        species,
      });
      updateUser({ pet_profiles: [...(user?.pet_profiles ?? []), data.pet] });
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'Could not add pet.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.title}>Add Pet</ThemedText>
        <ThemedText style={styles.subtitle}>Create a pet profile for feed posts and stories.</ThemedText>
        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Breed" value={breed} onChangeText={setBreed} />
        <TextInput
          style={styles.input}
          placeholder="Age"
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
        />
        <View style={styles.speciesRow}>
          {(['dog', 'cat', 'bird', 'rabbit', 'other'] as const).map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.speciesChip, species === value && styles.speciesChipActive]}
              onPress={() => setSpecies(value)}
            >
              <ThemedText style={[styles.speciesText, species === value && styles.speciesTextActive]}>
                {value}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.submitText}>Save Pet</ThemedText>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB' },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#18181B' },
  subtitle: { fontSize: 14, color: '#71717A', lineHeight: 20 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  speciesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  speciesChip: {
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  speciesChipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  speciesText: { color: '#6D28D9', fontWeight: '600' },
  speciesTextActive: { color: '#fff' },
  submitBtn: {
    marginTop: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});