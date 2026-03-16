import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { PostCard } from '@/components/feed/PostCard';
import { StoryRow } from '@/components/feed/StoryRow';
import { HotTakesBoard } from '@/components/feed/HotTakesBoard';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { useFeedStore } from '@/store/feedStore';
import { useAuthStore } from '@/store/authStore';
import { usePointsStore } from '@/store/pointsStore';

type FeedTab = 'moments' | 'stories' | 'hotTakes';

const TABS: { key: FeedTab; label: string }[] = [
  { key: 'moments', label: '📸 Moments' },
  { key: 'stories', label: '⏳ Stories' },
  { key: 'hotTakes', label: '🔥 Hot Takes' },
];

export default function FeedScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const totalPoints = usePointsStore((s) => s.totalPoints);
  const fetchPoints = usePointsStore((s) => s.fetchPoints);

  const {
    posts,
    stories,
    hotTakes,
    isLoadingFeed,
    isLoadingStories,
    activeTab,
    setActiveTab,
    fetchFeed,
    fetchStories,
    fetchHotTakes,
  } = useFeedStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFeed(true);
    fetchStories();
    fetchHotTakes();
    fetchPoints();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFeed(true), fetchStories(), fetchHotTakes()]);
    setRefreshing(false);
  }, []);

  const handleLoadMore = () => {
    if (activeTab === 'moments') fetchFeed();
  };

  const renderHeader = () => (
    <View>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <ThemedText style={styles.appTitle}>🐾 Pawprint</ThemedText>
        <View style={styles.topRight}>
          <PointsBadge points={totalPoints} size="sm" onPress={() => router.push('/rewards')} />
          <TouchableOpacity onPress={() => router.push('/create-post')} style={styles.createBtn}>
            <ThemedText style={styles.createBtnText}>＋</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Story Row */}
      <StoryRow />

      {/* Feed Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          >
            <ThemedText style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Hot Takes Board shown inline for that tab */}
      {activeTab === 'hotTakes' && <HotTakesBoard hotTakes={hotTakes} />}
    </View>
  );

  const renderFooter = () =>
    isLoadingFeed && !refreshing ? (
      <View style={styles.loadingMore}>
        <ActivityIndicator color="#7C3AED" />
      </View>
    ) : null;

  const renderEmpty = () =>
    !isLoadingFeed ? (
      <View style={styles.empty}>
        <ThemedText style={styles.emptyEmoji}>🐶</ThemedText>
        <ThemedText style={styles.emptyTitle}>No posts yet</ThemedText>
        <ThemedText style={styles.emptySubtext}>
          Follow more pet owners or create the first post!
        </ThemedText>
      </View>
    ) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      {activeTab === 'moments' ? (
        <FlatList
          key="moments"
          data={posts}
          keyExtractor={(item) => `post-${item.id}`}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#7C3AED"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : activeTab === 'stories' ? (
        <FlatList
          key="stories"
          data={stories}
          keyExtractor={(item) => `story-${item.id}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.storyListItem}
              onPress={() => router.push(`/story/${item.id}`)}
            >
              <ThemedText style={styles.storyEmoji}>🎬</ThemedText>
              <View style={styles.storyMeta}>
                <ThemedText style={styles.storyPet}>{item.pet.name}</ThemedText>
                <ThemedText style={styles.storyBreed}>{item.pet.breed}</ThemedText>
              </View>
              <ThemedText style={styles.storyChevron}>›</ThemedText>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
          }
        />
      ) : (
        <FlatList
          key="hottakes"
          data={[]}
          renderItem={null}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  listContent: {
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E7',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: -0.3,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  createBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 28,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E7',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
  },
  tabActive: {
    backgroundColor: '#7C3AED',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#52525B',
  },
  tabTextActive: {
    color: '#fff',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    padding: 40,
    gap: 10,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181B',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 20,
  },
  storyListItem: {
    flex: 0.5,
    margin: 6,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storyEmoji: { fontSize: 28 },
  storyMeta: { flex: 1 },
  storyPet: { fontSize: 14, fontWeight: '700', color: '#18181B' },
  storyBreed: { fontSize: 12, color: '#71717A' },
  storyChevron: { fontSize: 20, color: '#D4D4D8' },
});
