import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { CommunityCard } from '@/components/community/CommunityCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonShimmer } from '@/components/ui/SkeletonShimmer';
import { TouchableScale } from '@/components/ui/TouchableScale';
import { useCommunityStore } from '@/store/communityStore';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type Tab = 'my' | 'discover';

export default function CommunityScreen() {
  const router = useRouter();
  const { communities, isMembersLoading, fetchCommunities, fetchMyCommunities, joinCommunity } =
    useCommunityStore();
  const [activeTab, setActiveTab] = useState<Tab>('my');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCommunities();
    fetchMyCommunities();
  }, [fetchCommunities, fetchMyCommunities]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCommunities();
    setRefreshing(false);
  };

  const handleJoin = async (communityId: number) => {
    try {
      await joinCommunity(communityId);
    } catch {
      Alert.alert('Error', 'Could not join the community. Please try again.');
    }
  };

  const filtered = communities.filter((c) => {
    const matchSearch =
      !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === 'my' ? c.is_member : !c.is_member;
    return matchSearch && matchTab;
  });

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="people-outline" size={20} color={colors.text.primary} />
          <ThemedText variant="title" style={styles.title}>Communities</ThemedText>
        </View>
        <Button
          style={styles.createBtn}
          label="+ New"
          onPress={() => router.push('/create-community' as never)}
          accessibilityLabel="Create a new community"
        />
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={16} color={colors.text.muted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search communities…"
          placeholderTextColor={colors.text.muted}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableScale onPress={() => setSearch('')} style={styles.clearBtn} accessibilityLabel="Clear search">
            <ThemedText style={styles.clearText}>✕</ThemedText>
          </TouchableScale>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['my', 'discover'] as Tab[]).map((tab) => (
          <TouchableScale
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            accessibilityRole="button"
          >
            <ThemedText style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'my' ? 'My Communities' : 'Discover'}
            </ThemedText>
          </TouchableScale>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => `community-${item.id}`}
        renderItem={({ item }) => (
          Number.isFinite(Number(item?.id)) && typeof item?.name !== 'undefined' ? (
            <CommunityCard
              community={item}
              onJoin={!item.is_member ? () => handleJoin(Number(item.id)) : undefined}
            />
          ) : null
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} />
        }
        ListEmptyComponent={
          !isMembersLoading ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                iconName={activeTab === 'my' ? 'home-outline' : 'compass-outline'}
                iconColor={colors.text.secondary}
                title={activeTab === 'my' ? 'No communities yet' : 'No results'}
                subtitle={
                  activeTab === 'my'
                    ? 'Join breed communities to connect with other pet owners'
                    : 'Try a different search term'
                }
              />
            </View>
          ) : null
        }
        ListFooterComponent={
          isMembersLoading ? (
            <View style={styles.loader}>
              <SkeletonShimmer height={12} borderRadius={radius.pill} />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg.app },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.soft,
  },
  title: { color: colors.text.primary },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  createBtn: {
    minHeight: 44,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: radius.md,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border.soft,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    fontSize: typography.size.sm,
    color: colors.text.primary,
  },
  clearBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  clearText: { fontSize: 16, color: colors.text.muted },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.pill,
    alignItems: 'center',
    backgroundColor: colors.bg.muted,
  },
  tabActive: { backgroundColor: colors.brand.primary },
  tabText: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.text.secondary },
  tabTextActive: { color: colors.text.inverse },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  emptyWrap: { paddingTop: 60 },
  loader: { paddingVertical: spacing.lg },
});
