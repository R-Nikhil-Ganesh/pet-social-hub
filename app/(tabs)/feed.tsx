import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  Animated,
  View,
  StyleSheet,
  RefreshControl,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { PostCard } from '@/components/feed/PostCard';
import { StoryRow } from '@/components/feed/StoryRow';
import { EventGroupsBoard } from '@/components/feed/EventGroupsBoard';
import { EmptyState } from '@/components/ui/EmptyState';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { SkeletonShimmer } from '@/components/ui/SkeletonShimmer';
import { TouchableScale } from '@/components/ui/TouchableScale';
import { WiggleSticker } from '@/components/ui/WiggleSticker';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import { getSocket } from '@/services/socket';
import { useFeedStore } from '@/store/feedStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { usePointsStore } from '@/store/pointsStore';

type FeedTab = 'moments' | 'events';

const TABS: { key: FeedTab; label: string }[] = [
  { key: 'moments', label: 'Moments' },
  { key: 'events', label: 'Event Groups' },
];

export default function FeedScreen() {
  const router = useRouter();
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
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const [collapsibleHeaderHeight, setCollapsibleHeaderHeight] = useState(0);
  const tabContentOpacity = useRef(new Animated.Value(1)).current;
  const tabContentTranslateX = useRef(new Animated.Value(0)).current;
  const tabIndicatorIndex = useRef(new Animated.Value(0)).current;
  const feedScrollY = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    tabContentOpacity.setValue(0);
    tabContentTranslateX.setValue(18);
    Animated.parallel([
      Animated.timing(tabContentOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(tabContentTranslateX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeTab, tabContentOpacity, tabContentTranslateX]);

  useEffect(() => {
    Animated.spring(tabIndicatorIndex, {
      toValue: activeTab === 'moments' ? 0 : 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 0,
    }).start();
  }, [activeTab, tabIndicatorIndex]);

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

  const handleTabPress = (nextTab: FeedTab) => {
    if (nextTab === activeTab) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setActiveTab(nextTab);
  };

  const handleCreatePost = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    router.push('/new-post' as never);
  };

  const tabGap = spacing.xs;
  const tabBarInset = spacing.xxs;
  const indicatorWidth = tabBarWidth > 0 ? (tabBarWidth - tabBarInset * 2 - tabGap) / 2 : 0;
  const indicatorTranslateX = tabIndicatorIndex.interpolate({
    inputRange: [0, 1],
    outputRange: [0, indicatorWidth + tabGap],
  });

  const collapseDistance = Math.max(collapsibleHeaderHeight, 1);
  const collapsibleTranslateY = feedScrollY.interpolate({
    inputRange: [0, collapseDistance],
    outputRange: [0, -collapseDistance],
    extrapolate: 'clamp',
  });
  const collapsibleOpacity = feedScrollY.interpolate({
    inputRange: [0, collapseDistance * 0.55, collapseDistance],
    outputRange: [1, 0.25, 0],
    extrapolate: 'clamp',
  });
  const collapsibleScale = feedScrollY.interpolate({
    inputRange: [0, collapseDistance],
    outputRange: [1, 0.98],
    extrapolate: 'clamp',
  });

  const handleFeedScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: feedScrollY } } }],
    { useNativeDriver: true }
  );

  const renderTopBar = () => (
    <View>
      {/* Top Bar */}
      <AnimatedEntrance delay={20}>
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <WiggleSticker iconName="sparkles" size={24} iconSize={12} backgroundColor={colors.brand.secondary} />
            <Ionicons name="paw" size={20} color={colors.brand.primary} />
            <ThemedText style={styles.appTitle}>Pawprint</ThemedText>
            <WiggleSticker iconName="happy" size={24} iconSize={12} backgroundColor={colors.brand.accent} iconColor={colors.text.primary} />
          </View>
          <View style={styles.topRight}>
            <TouchableScale
              onPress={() => router.push('/notifications' as never)}
              style={styles.notifyBtn}
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text.primary} />
              {unreadCount > 0 && (
                <View style={styles.notifyBadge}>
                  <ThemedText style={styles.notifyBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </ThemedText>
                </View>
              )}
            </TouchableScale>
            <PointsBadge points={totalPoints} size="sm" onPress={() => router.push('/rewards')} />
            <TouchableScale
              onPress={handleCreatePost}
              style={styles.createBtn}
              accessibilityRole="button"
              accessibilityLabel="Create a post"
            >
              <ThemedText style={styles.createBtnText}>＋</ThemedText>
            </TouchableScale>
          </View>
        </View>
      </AnimatedEntrance>
    </View>
  );

  const renderCollapsibleHeader = () => (
    <Animated.View
      style={[
        styles.collapsibleHeader,
        {
          opacity: collapsibleOpacity,
          transform: [{ translateY: collapsibleTranslateY }, { scale: collapsibleScale }],
        },
      ]}
    >
      <View
        onLayout={(e) => {
          const measured = Math.round(e.nativeEvent.layout.height);
          if (measured > 0 && measured !== collapsibleHeaderHeight) {
            setCollapsibleHeaderHeight(measured);
          }
        }}
      >
        <AnimatedEntrance delay={90}>
          <StoryRow />
        </AnimatedEntrance>

        <AnimatedEntrance delay={140}>
          <View style={styles.tabBar} onLayout={(e) => setTabBarWidth(e.nativeEvent.layout.width)}>
            {indicatorWidth > 0 && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.tabIndicator,
                  {
                    width: indicatorWidth,
                    transform: [{ translateX: indicatorTranslateX }],
                  },
                ]}
              />
            )}
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => handleTabPress(tab.key)}
                style={styles.tab}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={`Show ${tab.key} tab`}
                accessibilityState={{ selected: activeTab === tab.key }}
              >
                <ThemedText style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </AnimatedEntrance>
      </View>
    </Animated.View>
  );

  const renderFooter = () =>
    isLoadingFeed && !refreshing ? (
      <View style={styles.loadingMore}>
        <SkeletonShimmer width={96} height={10} borderRadius={radius.pill} />
      </View>
    ) : null;

  const renderEmpty = () =>
    !isLoadingFeed ? (
      <View style={styles.emptyWrap}>
        <EmptyState
          iconName="images-outline"
          iconColor={colors.text.secondary}
          title="No posts yet"
          subtitle="Follow more pet owners or create the first post!"
        />
      </View>
    ) : null;

  return (
    <GradientBackground>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
      {renderTopBar()}

        <Animated.View
          style={{
            flex: 1,
            opacity: tabContentOpacity,
            transform: [{ translateX: tabContentTranslateX }],
          }}
        >
        <View style={styles.feedBody}>
        {renderCollapsibleHeader()}
        {activeTab === 'moments' ? (
          <Animated.FlatList
            data={posts}
            keyExtractor={(item) => `post-${item.id}`}
            renderItem={({ item }) => <PostCard post={item} />}
            contentContainerStyle={[
              styles.listContent,
              { paddingTop: collapsibleHeaderHeight + spacing.xs },
            ]}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            onScroll={handleFeedScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.brand.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <Animated.FlatList
            data={[{ id: 'events-board' }]}
            keyExtractor={(item) => item.id}
            renderItem={() => (
              <EventGroupsBoard
                events={events}
                connections={connections}
              />
            )}
            contentContainerStyle={[
              styles.listContent,
              { paddingTop: collapsibleHeaderHeight + spacing.xs },
            ]}
            onScroll={handleFeedScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
        </View>
      </Animated.View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  feedBody: {
    flex: 1,
    position: 'relative',
  },
  collapsibleHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.soft,
  },
  appTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.extrabold,
    color: colors.brand.primary,
    letterSpacing: -0.3,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  notifyBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.muted,
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
    backgroundColor: colors.state.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    color: colors.text.inverse,
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 28,
  },
  tabBar: {
    position: 'relative',
    flexDirection: 'row',
    backgroundColor: colors.bg.muted,
    borderRadius: radius.pill,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    padding: spacing.xxs,
    gap: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.soft,
  },
  tabIndicator: {
    position: 'absolute',
    left: spacing.xxs,
    top: spacing.xxs,
    bottom: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.pill,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.text.inverse,
  },
  loadingMore: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyWrap: {
    padding: spacing.xl,
  },
});
