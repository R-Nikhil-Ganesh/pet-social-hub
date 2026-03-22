import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { GameCard } from '@/components/games/GameCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { Avatar } from '@/components/ui/Avatar';
import { TouchableScale } from '@/components/ui/TouchableScale';
import { useGameStore, GameMode } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { usePointsStore } from '@/store/pointsStore';
import { colors, radius, spacing, typography } from '@/theme/tokens';

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

  const renderRank = (index: number, rank: number) => {
    if (index < 3) {
      const color = index === 0 ? '#EAB308' : index === 1 ? '#94A3B8' : '#D97706';
      return <Ionicons name="trophy" size={18} color={color} />;
    }
    return <ThemedText style={styles.rankNumber}>{rank}</ThemedText>;
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.headerTitleRow}>
              <Ionicons name="game-controller-outline" size={20} color={colors.text.primary} />
              <ThemedText variant="title" style={styles.greeting}>Game Zone</ThemedText>
            </View>
            <ThemedText variant="body" style={styles.subGreeting}>Earn points, climb the leaderboard</ThemedText>
          </View>
          <PointsBadge points={totalPoints} size="md" showLabel />
        </View>

        {/* Streak Widget */}
        {totalChallenges > 0 && (
          <TouchableScale onPress={() => router.push('/training')}>
            <Card style={styles.streakCard}>
              <View>
                <View style={styles.streakTitleRow}>
                  <Ionicons name="flame-outline" size={16} color={colors.text.inverse} />
                  <ThemedText variant="title" style={styles.streakTitle}>Daily Streak</ThemedText>
                </View>
                <ThemedText variant="body" style={styles.streakSub}>
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
            </Card>
          </TouchableScale>
        )}

        {/* Game Cards */}
        <View style={styles.section}>
          <ThemedText variant="title" style={styles.sectionTitle}>Choose a Game</ThemedText>
          {GAMES.length === 0 ? (
            <EmptyState iconName="game-controller-outline" iconColor={colors.text.secondary} title="No games available" subtitle="Please check back shortly." />
          ) : (
            <View style={styles.bentoGrid}>
              {GAMES.map((mode) => (
                <GameCard
                  key={mode}
                  mode={mode}
                  onPress={() => handleGamePress(mode)}
                  size={mode === 'trivia' ? 'wide' : 'square'}
                />
              ))}
            </View>
          )}
        </View>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <View style={styles.leaderboardTitleRow}>
                <Ionicons name="trophy-outline" size={18} color={colors.text.primary} />
                <ThemedText variant="title" style={styles.sectionTitle}>Leaderboard</ThemedText>
              </View>
              <Button
                variant="ghost"
                style={styles.seeAllBtn}
                label="See all"
                onPress={() => router.push('/leaderboard')}
              />
            </View>
            <Card style={styles.leaderboard}>
              {leaderboard.slice(0, 5).map((entry, index) => (
                <TouchableScale
                  key={entry.user_id}
                  style={[
                    styles.leaderEntry,
                    entry.user_id === user?.id && styles.myEntry,
                  ]}
                  onPress={() => router.push(`/user/${entry.user_id}`)}
                >
                  <View style={styles.rank}>{renderRank(index, entry.rank)}</View>
                  <Avatar uri={entry.avatar_url} size={36} />
                  <View style={styles.entryInfo}>
                    <ThemedText variant="label" style={styles.entryName}>{entry.display_name}</ThemedText>
                    <ThemedText variant="caption" style={styles.entryUsername}>@{entry.username}</ThemedText>
                  </View>
                  <PointsBadge points={entry.points} size="sm" />
                </TouchableScale>
              ))}
            </Card>
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg.app },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.soft,
  },
  greeting: { color: colors.text.primary },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  subGreeting: { color: colors.text.secondary, marginTop: 2 },
  streakCard: {
    margin: spacing.md,
    backgroundColor: colors.brand.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  streakTitle: { color: colors.text.inverse },
  streakTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakSub: { color: 'rgba(255,255,255,0.9)' },
  streakBars: { flexDirection: 'row', gap: spacing.xs },
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
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xxs,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    color: colors.text.primary,
    marginBottom: 12,
  },
  leaderboardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  seeAllBtn: {
    minHeight: 44,
    minWidth: 90,
    paddingHorizontal: spacing.xs,
  },
  leaderboard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  leaderEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.sm,
    minHeight: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.soft,
  },
  myEntry: {
    backgroundColor: colors.bg.subtle,
  },
  rank: {
    width: 32,
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: typography.weight.bold,
  },
  entryInfo: { flex: 1 },
  entryName: { color: colors.text.primary, fontSize: typography.size.sm },
  entryUsername: { color: colors.text.secondary },
  bottomPad: { height: spacing.lg },
});
