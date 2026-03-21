import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { PostCard } from '@/components/feed/PostCard';
import { StoryRow } from '@/components/feed/StoryRow';
import { EventGroupsBoard } from '@/components/feed/EventGroupsBoard';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { getSocket } from '@/services/socket';
import { useFeedStore } from '@/store/feedStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { usePointsStore } from '@/store/pointsStore';

type FeedTab = 'moments' | 'events';

const TABS: { key: FeedTab; label: string }[] = [
  { key: 'moments', label: '📸 Moments' },
  { key: 'events', label: '🎉 Event Groups' },
];

export default function FeedScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const totalPoints = usePointsStore((s) => s.totalPoints);
  const fetchPoints = usePointsStore((s) => s.fetchPoints);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);
  const receiveNotification = useNotificationStore((s) => s.receiveNotification);
  const removeNotification = useNotificationStore((s) => s.removeNotification);

  const {
    posts,
    events,
    connections,
    isLoadingFeed,
    activeTab,
    setActiveTab,
    fetchFeed,
    fetchStories,
    fetchEvents,
    fetchConnections,
  } = useFeedStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFeed(true);
    fetchStories();
    fetchEvents();
    fetchConnections();
    fetchPoints();
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);
    const handleNotificationNew = (payload: { notification?: Parameters<typeof receiveNotification>[0] }) => {
      if (payload.notification) {
        receiveNotification(payload.notification);
      }
    };
    const handleNotificationRemove = (payload: { id?: number }) => {
      if (payload.id) {
        removeNotification(payload.id);
      }
    };

    socket.on('notification:new', handleNotificationNew);
    socket.on('notification:remove', handleNotificationRemove);

    return () => {
      socket.off('notification:new', handleNotificationNew);
      socket.off('notification:remove', handleNotificationRemove);
    };
  }, [token, receiveNotification, removeNotification]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchFeed(true),
      fetchStories(),
      fetchEvents(),
      fetchConnections(),
      fetchUnreadCount(),
    ]);
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
          <TouchableOpacity onPress={() => router.push('/notifications' as never)} style={styles.notifyBtn}>
            <Ionicons name="notifications-outline" size={21} color="#18181B" />
            {unreadCount > 0 && (
              <View style={styles.notifyBadge}>
                <ThemedText style={styles.notifyBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
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

      {activeTab === 'events' && (
        <EventGroupsBoard
          events={events}
          connections={connections}
        />
      )}
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
    <SafeAreaView edges={['top']} style={styles.safeArea}>
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
      ) : (
        <FlatList
          key="events"
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
  notifyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
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
});
