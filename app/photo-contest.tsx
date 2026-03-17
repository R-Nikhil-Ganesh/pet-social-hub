import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useGameStore } from '@/store/gameStore';

export default function PhotoContestScreen() {
  const { activeContest, fetchPhotoContest, voteContest } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPhotoContest().finally(() => setLoading(false));
  }, [fetchPhotoContest]);

  const handleVote = async (entryId: number) => {
    setSubmittingId(entryId);
    try {
      await voteContest(entryId);
    } catch {
      Alert.alert('Error', 'Could not register your vote.');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#7C3AED" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={activeContest?.entries ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText style={styles.title}>{activeContest?.title ?? 'Photo Contest'}</ThemedText>
            <ThemedText style={styles.subtitle}>
              {activeContest?.description ?? 'Vote for the best pet photo this week.'}
            </ThemedText>
          </View>
        }
        ListEmptyComponent={<ThemedText style={styles.empty}>No entries yet.</ThemedText>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.media_url }} style={styles.image} resizeMode="cover" />
            <View style={styles.meta}>
              <View style={styles.metaCopy}>
                <ThemedText style={styles.petName}>{item.pet_name}</ThemedText>
                <ThemedText style={styles.petBreed}>{item.pet_breed || '@' + item.username}</ThemedText>
              </View>
              <TouchableOpacity
                style={[styles.voteBtn, item.user_voted && styles.voteBtnActive]}
                onPress={() => handleVote(item.id)}
                disabled={submittingId === item.id}
              >
                {submittingId === item.id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.voteText}>🏆 {item.votes}</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 14 },
  header: { marginBottom: 8, gap: 6 },
  title: { fontSize: 24, fontWeight: '800', color: '#18181B' },
  subtitle: { fontSize: 14, color: '#71717A', lineHeight: 20 },
  empty: { textAlign: 'center', color: '#71717A', marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  image: { width: '100%', height: 240, backgroundColor: '#E4E4E7' },
  meta: {
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  metaCopy: { flex: 1, gap: 4 },
  petName: { fontSize: 16, fontWeight: '700', color: '#18181B' },
  petBreed: { fontSize: 13, color: '#71717A' },
  voteBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 76,
    alignItems: 'center',
  },
  voteBtnActive: { backgroundColor: '#5B21B6' },
  voteText: { color: '#fff', fontWeight: '700' },
});