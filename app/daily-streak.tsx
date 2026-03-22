import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useGameStore } from '@/store/gameStore';
import { usePointsStore } from '@/store/pointsStore';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function DailyStreakScreen() {
  const { challenges, fetchChallenges, completeChallenge } = useGameStore();
  const { fetchPoints } = usePointsStore();
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const streakCount = challenges.filter((c) => c.completed_today).length;
  const totalChallenges = challenges.length;

  const handleCompleteTask = async (challengeId: number, alreadyCompleted: boolean) => {
    if (alreadyCompleted || completingTaskId) return;

    try {
      setCompletingTaskId(challengeId);
      await completeChallenge(challengeId);
      await Promise.all([fetchChallenges(), fetchPoints()]);
    } finally {
      setCompletingTaskId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.headerCard}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="flame-outline" size={18} color={colors.brand.primary} />
            <ThemedText variant="title" style={styles.headerTitle}>Daily Streak</ThemedText>
          </View>
          <ThemedText style={styles.headerSub}>
            {streakCount}/{totalChallenges} tasks done today
          </ThemedText>
          <ThemedText style={styles.resetText}>Tasks reset every 24 hours</ThemedText>
          <View style={styles.streakBars}>
            {challenges.map((c) => (
              <View key={c.id} style={[styles.streakBar, c.completed_today && styles.streakBarDone]} />
            ))}
          </View>
        </Card>

        {challenges.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              iconName="checkbox-outline"
              iconColor={colors.text.secondary}
              title="No tasks available"
              subtitle="Please check back shortly."
            />
          </View>
        ) : (
          <View style={styles.grid}>
            {challenges.map((challenge) => {
              const isCompleted = challenge.completed_today;
              const isWorking = completingTaskId === challenge.id;

              return (
                <TouchableOpacity
                  key={challenge.id}
                  activeOpacity={0.9}
                  onPress={() => handleCompleteTask(challenge.id, isCompleted)}
                  disabled={isCompleted || Boolean(completingTaskId)}
                  style={styles.gridItem}
                  accessibilityRole="button"
                  accessibilityLabel={`${isCompleted ? 'Completed' : 'Complete'} task: ${challenge.title}`}
                >
                  <Card style={[styles.taskCard, isCompleted && styles.taskCardDone]}>
                    <View style={styles.taskTopRow}>
                      <View style={[styles.taskTickWrap, isCompleted && styles.taskTickWrapDone]}>
                        <Ionicons
                          name={isCompleted ? 'checkmark' : isWorking ? 'time-outline' : 'ellipse-outline'}
                          size={14}
                          color={isCompleted ? '#FFFFFF' : colors.text.secondary}
                        />
                      </View>
                      <View style={styles.pointsBadge}>
                        <ThemedText style={styles.pointsText}>+{challenge.points_reward}</ThemedText>
                      </View>
                    </View>

                    <ThemedText style={[styles.taskTitle, isCompleted && styles.taskTitleDone]}>
                      {challenge.title}
                    </ThemedText>
                    <ThemedText style={styles.taskDescription}>{challenge.description}</ThemedText>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.app,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    color: colors.text.primary,
  },
  headerSub: {
    color: colors.text.secondary,
    fontSize: typography.size.sm,
  },
  resetText: {
    color: colors.text.muted,
    fontSize: typography.size.xs,
  },
  streakBars: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  streakBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EAD8CF',
  },
  streakBarDone: {
    backgroundColor: '#F59E0B',
  },
  emptyWrap: {
    marginTop: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  taskCard: {
    minHeight: 146,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
    borderColor: '#F1B3C9',
    borderWidth: 1,
  },
  taskCardDone: {
    opacity: 0.85,
  },
  taskTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTickWrap: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.muted,
    borderWidth: 1,
    borderColor: colors.border.soft,
  },
  taskTickWrapDone: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
  },
  pointsBadge: {
    minWidth: 44,
    height: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    backgroundColor: '#FEE2D0',
  },
  pointsText: {
    color: '#C2410C',
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
  taskTitle: {
    color: colors.text.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    textDecorationColor: colors.text.secondary,
  },
  taskDescription: {
    color: colors.text.secondary,
    fontSize: typography.size.xs,
    lineHeight: 16,
  },
});
