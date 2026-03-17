import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import { useGameStore } from '@/store/gameStore';

export default function LeaderboardScreen() {
  const { leaderboard, fetchLeaderboard } = useGameStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard().finally(() => setLoading(false));
  }, [fetchLeaderboard]);

  const medal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
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
      <View style={styles.header}>
        <ThemedText style={styles.title}>🏆 All-Time Leaderboard</ThemedText>
      </View>
      <FlatList
        data={leaderboard}
        keyExtractor={(item) => String(item.user_id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<ThemedText style={styles.empty}>No data yet.</ThemedText>}
        renderItem={({ item, index }) => (
          <View style={[styles.row, index < 3 && styles.topRow]}>
            <ThemedText style={[styles.rank, index < 3 && styles.medalRank]}>
              {medal(index + 1)}
            </ThemedText>
            <Avatar uri={item.avatar_url} size={40} isProfessional={false} />
            <View style={styles.info}>
              <ThemedText style={styles.name}>{item.display_name}</ThemedText>
              <ThemedText style={styles.username}>@{item.username}</ThemedText>
            </View>
            <View style={styles.scoreCol}>
              <ThemedText style={styles.score}>{item.points.toLocaleString()}</ThemedText>
              <ThemedText style={styles.scoreLbl}>pts</ThemedText>
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
  header: {
    backgroundColor: '#7C3AED',
    paddingVertical: 18,
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#fff' },
  list: { padding: 14, gap: 10 },
  empty: { textAlign: 'center', color: '#71717A', marginTop: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  topRow: {
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
  },
  rank: { fontSize: 16, fontWeight: '800', color: '#71717A', width: 36, textAlign: 'center' },
  medalRank: { fontSize: 22 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#18181B' },
  username: { fontSize: 12, color: '#71717A' },
  scoreCol: { alignItems: 'flex-end' },
  score: { fontSize: 18, fontWeight: '900', color: '#7C3AED' },
  scoreLbl: { fontSize: 11, color: '#A78BFA' },
});
