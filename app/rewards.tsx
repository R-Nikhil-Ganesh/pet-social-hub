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
  TextInput,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { usePointsStore } from '@/store/pointsStore';

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
  }, []);

  const handleRedeem = async (rewardId: number, cost: number) => {
    if (points < cost) {
      Alert.alert('Not enough points', `You need ${cost} 🐾 pts to redeem this.`);
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
            Alert.alert('🎉 Redeemed!', 'Your reward has been unlocked.');
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
        <ActivityIndicator color="#7C3AED" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Points header */}
      <View style={styles.pointsHeader}>
        <ThemedText style={styles.pointsLabel}>Your Points</ThemedText>
        <ThemedText style={styles.pointsValue}>🐾 {points.toLocaleString()} pts</ThemedText>
      </View>

      {/* Tab toggle */}
      <View style={styles.tabBar}>
        {(['rewards', 'history'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <ThemedText style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'rewards' ? '🎁 Rewards' : '📜 History'}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'rewards' ? (
        <FlatList
          data={rewards}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<ThemedText style={styles.emptyText}>No rewards available.</ThemedText>}
          renderItem={({ item }) => (
            <View style={styles.rewardCard}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.rewardImage} />
              ) : (
                <View style={[styles.rewardImage, styles.rewardImageFallback]}>
                  <ThemedText style={{ fontSize: 32 }}>🎁</ThemedText>
                </View>
              )}
              <View style={styles.rewardInfo}>
                <ThemedText style={styles.rewardTitle}>{item.title}</ThemedText>
                <ThemedText style={styles.rewardDesc}>{item.description}</ThemedText>
                <ThemedText style={styles.rewardCost}>🐾 {item.points_cost} pts</ThemedText>
              </View>
              <TouchableOpacity
                style={[styles.redeemBtn, points < item.points_cost && styles.redeemBtnDisabled]}
                onPress={() => handleRedeem(item.id, item.points_cost)}
                disabled={redeeming === item.id}
              >
                {redeeming === item.id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ThemedText style={styles.redeemBtnText}>Redeem</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<ThemedText style={styles.emptyText}>No transactions yet.</ThemedText>}
          renderItem={({ item }) => (
            <View style={styles.txRow}>
              <View style={styles.txLeft}>
                <ThemedText style={styles.txAction}>{item.action}</ThemedText>
                <ThemedText style={styles.txDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </ThemedText>
              </View>
              <ThemedText
                style={[styles.txAmount, item.amount > 0 ? styles.txPositive : styles.txNegative]}
              >
                {item.amount > 0 ? '+' : ''}
                {item.amount} pts
              </ThemedText>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pointsHeader: {
    backgroundColor: '#7C3AED',
    paddingVertical: 22,
    alignItems: 'center',
    gap: 4,
  },
  pointsLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  pointsValue: { fontSize: 30, color: '#fff', fontWeight: '900' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E7',
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#7C3AED' },
  tabText: { fontSize: 14, color: '#71717A', fontWeight: '600' },
  tabTextActive: { color: '#7C3AED' },
  list: { padding: 14, gap: 12 },
  emptyText: { textAlign: 'center', color: '#71717A', marginTop: 30 },
  rewardCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  rewardImage: { width: 64, height: 64, borderRadius: 12 },
  rewardImageFallback: { backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  rewardInfo: { flex: 1, gap: 3 },
  rewardTitle: { fontSize: 14, fontWeight: '700', color: '#18181B' },
  rewardDesc: { fontSize: 12, color: '#71717A', lineHeight: 16 },
  rewardCost: { fontSize: 12, fontWeight: '700', color: '#7C3AED', marginTop: 2 },
  redeemBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 68,
    alignItems: 'center',
  },
  redeemBtnDisabled: { backgroundColor: '#D4D4D8' },
  redeemBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  txRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  txLeft: { gap: 2 },
  txAction: { fontSize: 14, fontWeight: '600', color: '#18181B' },
  txDate: { fontSize: 12, color: '#71717A' },
  txAmount: { fontSize: 15, fontWeight: '800' },
  txPositive: { color: '#22C55E' },
  txNegative: { color: '#EF4444' },
});
