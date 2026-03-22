import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import { SkeletonShimmer } from '@/components/ui/SkeletonShimmer';
import { useGameStore } from '@/store/gameStore';

export default function LeaderboardScreen() {
  const { leaderboard, fetchLeaderboard } = useGameStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard().finally(() => setLoading(false));
  }, [fetchLeaderboard]);

  const medalColor = (rank: number) => {
    if (rank === 1) return '#EAB308';
    if (rank === 2) return '#94A3B8';
    if (rank === 3) return '#D97706';
    return '#71717A';
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <SkeletonShimmer width={100} height={12} borderRadius={999} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="trophy-outline" size={18} color="#fff" />
          <ThemedText style={styles.title}>All-Time Leaderboard</ThemedText>
        </View>
      </View>
      <FlatList
        data={leaderboard}
        keyExtractor={(item) => String(item.user_id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<ThemedText style={styles.empty}>No data yet.</ThemedText>}
        renderItem={({ item, index }) => (
          <View style={[styles.row, index < 3 && styles.topRow]}>
            <ThemedText style={[styles.rank, index < 3 && styles.medalRank]}>
              {index < 3 ? '' : `#${index + 1}`}
            </ThemedText>
            {index < 3 ? <Ionicons name="trophy" size={16} color={medalColor(index + 1)} style={styles.topIcon} /> : null}
            <Avatar uri={item.avatar_url} seed={item.user_id} size={40} isProfessional={false} />
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
  topIcon: { marginLeft: -20, marginRight: 4 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#18181B' },
  username: { fontSize: 12, color: '#71717A' },
  scoreCol: { alignItems: 'flex-end' },
  score: { fontSize: 18, fontWeight: '900', color: '#7C3AED' },
  scoreLbl: { fontSize: 11, color: '#A78BFA' },
});
