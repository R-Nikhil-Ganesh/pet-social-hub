import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { GameCard } from '@/components/games/GameCard';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { Avatar } from '@/components/ui/Avatar';
import { useGameStore, GameMode } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { usePointsStore } from '@/store/pointsStore';

const GAMES: GameMode[] = ['trivia', 'photo_contest', 'training', 'breed_guess'];

export default function GamesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { leaderboard, fetchLeaderboard, challenges, fetchChallenges } = useGameStore();
  const { totalPoints, fetchPoints } = usePointsStore();

  useEffect(() => {
    fetchLeaderboard();
    fetchChallenges();
    fetchPoints();
  }, [fetchChallenges, fetchLeaderboard, fetchPoints]);

  const handleGamePress = (mode: GameMode) => {
    switch (mode) {
      case 'trivia':
        router.push('/trivia');
        break;
      case 'photo_contest':
        router.push('/photo-contest');
        break;
      case 'training':
        router.push('/training');
        break;
      case 'breed_guess':
        router.push('/breed-guess');
        break;
    }
  };

  const streakCount = challenges.filter((c) => c.completed_today).length;
  const totalChallenges = challenges.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.greeting}>🎮 Game Zone</ThemedText>
            <ThemedText style={styles.subGreeting}>Earn points, climb the leaderboard</ThemedText>
          </View>
          <PointsBadge points={totalPoints} size="md" showLabel />
        </View>

        {/* Streak Widget */}
        {totalChallenges > 0 && (
          <TouchableOpacity
            style={styles.streakCard}
            onPress={() => router.push('/training')}
            activeOpacity={0.85}
          >
            <View>
              <ThemedText style={styles.streakTitle}>🔥 Daily Streak</ThemedText>
              <ThemedText style={styles.streakSub}>
                {streakCount}/{totalChallenges} challenges done today
              </ThemedText>
            </View>
            <View style={styles.streakBars}>
              {challenges.map((c) => (
                <View
                  key={c.id}
                  style={[styles.streakBar, c.completed_today && styles.streakBarDone]}
                />
              ))}
            </View>
          </TouchableOpacity>
        )}

        {/* Game Cards */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Choose a Game</ThemedText>
          {GAMES.map((mode) => (
            <GameCard key={mode} mode={mode} onPress={() => handleGamePress(mode)} />
          ))}
        </View>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <ThemedText style={styles.sectionTitle}>🏆 Leaderboard</ThemedText>
              <TouchableOpacity onPress={() => router.push('/leaderboard')}>
                <ThemedText style={styles.seeAll}>See all</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.leaderboard}>
              {leaderboard.slice(0, 5).map((entry, index) => (
                <TouchableOpacity
                  key={entry.user_id}
                  style={[
                    styles.leaderEntry,
                    entry.user_id === user?.id && styles.myEntry,
                  ]}
                  onPress={() => router.push(`/user/${entry.user_id}`)}
                >
                  <ThemedText style={styles.rank}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${entry.rank}`}
                  </ThemedText>
                  <Avatar uri={entry.avatar_url} size={36} />
                  <View style={styles.entryInfo}>
                    <ThemedText style={styles.entryName}>{entry.display_name}</ThemedText>
                    <ThemedText style={styles.entryUsername}>@{entry.username}</ThemedText>
                  </View>
                  <PointsBadge points={entry.points} size="sm" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9F9FB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E7',
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#18181B' },
  subGreeting: { fontSize: 13, color: '#71717A', marginTop: 2 },
  streakCard: {
    margin: 16,
    backgroundColor: '#7C3AED',
    borderRadius: 18,
    padding: 18,
    gap: 12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  streakTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  streakSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  streakBars: { flexDirection: 'row', gap: 6 },
  streakBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  streakBarDone: {
    backgroundColor: '#FCD34D',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
  },
  leaderboard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  leaderEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F4F4F5',
  },
  myEntry: {
    backgroundColor: '#F5F3FF',
  },
  rank: {
    fontSize: 20,
    width: 32,
    textAlign: 'center',
  },
  entryInfo: { flex: 1 },
  entryName: { fontSize: 14, fontWeight: '700', color: '#18181B' },
  entryUsername: { fontSize: 12, color: '#71717A' },
  bottomPad: { height: 20 },
});
