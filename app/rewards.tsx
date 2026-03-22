import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePointsStore } from '@/store/pointsStore';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function RewardsScreen() {
  const { totalPoints: points, transactions, rewards, fetchPoints, fetchTransactions, fetchRewards, redeemReward } =
    usePointsStore();
  const [tab, setTab] = useState<'rewards' | 'history'>('rewards');
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([fetchPoints(), fetchTransactions(), fetchRewards()]).finally(() =>
      setLoading(false)
    );
  }, [fetchPoints, fetchTransactions, fetchRewards]);

  const handleRedeem = async (rewardId: number, cost: number) => {
    if (points < cost) {
      Alert.alert('Not enough points', `You need ${cost} pts to redeem this.`);
      return;
    }
    Alert.alert('Redeem reward?', `This costs ${cost} pts.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Redeem',
        onPress: async () => {
          setRedeeming(rewardId);
          try {
            await redeemReward(rewardId);
            Alert.alert('Redeemed!', 'Your reward has been unlocked.');
          } catch {
            Alert.alert('Error', 'Could not redeem. Try again.');
          } finally {
            setRedeeming(null);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Points header */}
      <View style={styles.pointsHeader}>
        <ThemedText variant="label" style={styles.pointsLabel}>Your Points</ThemedText>
        <View style={styles.pointsRow}>
          <Ionicons name="paw" size={24} color="#DDD6FE" />
          <ThemedText variant="display" style={styles.pointsValue}>{points.toLocaleString()} pts</ThemedText>
        </View>
      </View>

      {/* Tab toggle */}
      <View style={styles.tabBar}>
        {(['rewards', 'history'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <ThemedText style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'rewards' ? 'Rewards' : 'History'}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'rewards' ? (
        <FlatList
          data={rewards}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState iconName="gift-outline" iconColor={colors.text.secondary} title="No rewards available" subtitle="Check back soon for new rewards." />
          }
          renderItem={({ item }) => (
            <Card style={styles.rewardCard}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.rewardImage} />
              ) : (
                <View style={[styles.rewardImage, styles.rewardImageFallback]}>
                  <Ionicons name="gift-outline" size={30} color={colors.brand.primary} />
                </View>
              )}
              <View style={styles.rewardInfo}>
                <ThemedText variant="label" style={styles.rewardTitle}>{item.title}</ThemedText>
                <ThemedText variant="caption" style={styles.rewardDesc}>{item.description}</ThemedText>
                <ThemedText variant="label" style={styles.rewardCost}>{item.points_cost} pts</ThemedText>
              </View>
              <Button
                style={[styles.redeemBtn, points < item.points_cost && styles.redeemBtnDisabled]}
                label="Redeem"
                onPress={() => handleRedeem(item.id, item.points_cost)}
                loading={redeeming === item.id}
                disabled={points < item.points_cost}
              />
            </Card>
          )}
        />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState iconName="document-text-outline" iconColor={colors.text.secondary} title="No transactions yet" />}
          renderItem={({ item }) => (
            <Card style={styles.txRow}>
              <View style={styles.txLeft}>
                <ThemedText variant="label" style={styles.txAction}>{item.action}</ThemedText>
                <ThemedText variant="caption" style={styles.txDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </ThemedText>
              </View>
              <ThemedText
                style={[styles.txAmount, item.amount > 0 ? styles.txPositive : styles.txNegative]}
              >
                {item.amount > 0 ? '+' : ''}
                {item.amount} pts
              </ThemedText>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.app },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pointsHeader: {
    backgroundColor: colors.brand.primary,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 4,
  },
  pointsLabel: { color: 'rgba(255,255,255,0.85)', fontWeight: typography.weight.semibold },
  pointsValue: { color: colors.text.inverse, fontSize: 30, fontWeight: typography.weight.extrabold },
  pointsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.soft,
  },
  tab: { flex: 1, minHeight: 48, borderRadius: 0 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.brand.primary, backgroundColor: colors.bg.subtle },
  tabText: { fontSize: typography.size.sm, color: colors.text.secondary, fontWeight: typography.weight.semibold },
  tabTextActive: { color: colors.brand.primary },
  list: { padding: spacing.sm, gap: spacing.sm },
  rewardCard: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: spacing.sm,
    alignItems: 'center',
  },
  rewardImage: { width: 64, height: 64, borderRadius: 12 },
  rewardImageFallback: { backgroundColor: colors.bg.subtle, alignItems: 'center', justifyContent: 'center' },
  rewardInfo: { flex: 1, gap: 3 },
  rewardTitle: { color: colors.text.primary },
  rewardDesc: { color: colors.text.secondary, lineHeight: 16 },
  rewardCost: { color: colors.brand.primary, marginTop: 2, fontSize: typography.size.xs },
  redeemBtn: {
    minWidth: 92,
    minHeight: 44,
  },
  redeemBtnDisabled: { backgroundColor: colors.border.strong },
  txRow: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txLeft: { gap: 2 },
  txAction: { color: colors.text.primary },
  txDate: { color: colors.text.secondary },
  txAmount: { fontSize: 15, fontWeight: '800' },
  txPositive: { color: '#22C55E' },
  txNegative: { color: '#EF4444' },
});
