import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useGameStore } from '@/store/gameStore';

export default function TrainingScreen() {
  const { challenges, fetchChallenges, completeChallenge } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  useEffect(() => {
    fetchChallenges().finally(() => setLoading(false));
  }, [fetchChallenges]);

  const handleComplete = async (challengeId: number) => {
    setSubmittingId(challengeId);
    try {
      await completeChallenge(challengeId);
    } catch {
      Alert.alert('Error', 'Could not complete challenge.');
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
        data={challenges}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText style={styles.title}>Daily Training</ThemedText>
            <ThemedText style={styles.subtitle}>Complete challenges to build your streak.</ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.copy}>
              <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
              <ThemedText style={styles.cardDesc}>{item.description}</ThemedText>
              <ThemedText style={styles.reward}>+{item.points_reward} pts</ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.actionBtn, item.completed_today && styles.actionBtnDone]}
              onPress={() => handleComplete(item.id)}
              disabled={item.completed_today || submittingId === item.id}
            >
              {submittingId === item.id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText style={styles.actionText}>
                  {item.completed_today ? 'Done' : 'Complete'}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  header: { marginBottom: 8, gap: 6 },
  title: { fontSize: 24, fontWeight: '800', color: '#18181B' },
  subtitle: { fontSize: 14, color: '#71717A' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  copy: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#18181B' },
  cardDesc: { fontSize: 13, color: '#71717A', lineHeight: 18 },
  reward: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },
  actionBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 86,
    alignItems: 'center',
  },
  actionBtnDone: { backgroundColor: '#22C55E' },
  actionText: { color: '#fff', fontWeight: '700' },
});