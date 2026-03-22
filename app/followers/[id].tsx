import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { colors, radius, spacing, typography } from '@/theme/tokens';

interface FollowUser {
  id: number;
  username: string;
  display_name: string;
  avatar_url?: string;
  is_professional: boolean;
  professional_type?: string;
  is_following: boolean;
}

export default function FollowersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const userId = Number(id);
  const selfId = useAuthStore((s) => s.user?.id);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [users, setUsers] = useState<FollowUser[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingIds, setPendingIds] = useState<number[]>([]);
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);

  const toggleFollow = async (targetId: number, currentlyFollowing: boolean) => {
    if (!Number.isFinite(targetId) || targetId <= 0 || targetId === selfId) return;
    if (pendingIds.includes(targetId)) return;

    setPendingIds((prev) => [...prev, targetId]);
    setUsers((prev) =>
      prev.map((u) => (u.id === targetId ? { ...u, is_following: !currentlyFollowing } : u))
    );

    try {
      const response = currentlyFollowing
        ? await api.delete(`/users/${targetId}/follow`)
        : await api.post(`/users/${targetId}/follow`);

      const actorFollowing = response?.data?.actor_following_count;
      if (typeof actorFollowing === 'number') {
        updateUser({ following_count: actorFollowing });
      }
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, is_following: currentlyFollowing } : u))
      );
    } finally {
      setPendingIds((prev) => prev.filter((id) => id !== targetId));
    }
  };

  const loadFollowers = useCallback(
    async (nextPage = 1, replace = false) => {
      if (!Number.isFinite(userId) || userId <= 0) return;
      if (!replace && (!hasMoreRef.current && nextPage > 1)) return;
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (replace) {
        setRefreshing(true);
      } else if (nextPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const { data } = await api.get(`/users/${userId}/followers?page=${nextPage}&limit=25`);
        const nextUsers = (data?.users ?? []) as FollowUser[];
        const targetName = data?.target_user?.display_name;
        if (targetName) {
          navigation.setOptions({ title: `${targetName}'s Followers` });
        }

        setUsers((prev) => (replace || nextPage === 1 ? nextUsers : [...prev, ...nextUsers]));
        setPage(nextPage);
        const nextHasMore = Boolean(data?.has_more);
        hasMoreRef.current = nextHasMore;
        setHasMore(nextHasMore);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [navigation, userId]
  );

  useEffect(() => {
    setUsers([]);
    setPage(1);
    setHasMore(true);
    hasMoreRef.current = true;
    loadFollowers(1, true);
  }, [loadFollowers, userId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={users}
        keyExtractor={(item) => `follower-${item.id}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadFollowers(1, true)} tintColor={colors.brand.primary} />
        }
        renderItem={({ item }) => {
          const isPending = pendingIds.includes(item.id);
          const isSelfRow = item.id === selfId;

          return (
            <Card style={styles.row}>
              <TouchableOpacity
                style={styles.rowMain}
                onPress={() => router.push({ pathname: '/user/[id]', params: { id: String(item.id) } } as never)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.display_name} profile`}
              >
                <Avatar uri={item.avatar_url} size={46} isProfessional={item.is_professional} />
                <View style={styles.meta}>
                  <View style={styles.nameRow}>
                    <ThemedText style={styles.displayName}>{item.display_name}</ThemedText>
                    {item.is_professional ? <ThemedText style={styles.proBadge}>PRO</ThemedText> : null}
                  </View>
                  <ThemedText style={styles.username}>@{item.username}</ThemedText>
                </View>
              </TouchableOpacity>

              {!isSelfRow && (
                <Button
                  style={[styles.followBtn, item.is_following && styles.followingBtn]}
                  label={item.is_following ? 'Following' : 'Follow'}
                  variant={item.is_following ? 'secondary' : 'primary'}
                  onPress={() => toggleFollow(item.id, item.is_following)}
                  loading={isPending}
                  disabled={isPending}
                />
              )}
            </Card>
          );
        }}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (!loadingMore && hasMore) {
            loadFollowers(page + 1);
          }
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState emoji="👥" title="No followers yet" subtitle="This profile has no followers right now." />
          </View>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.brand.primary} style={styles.footerLoader} /> : null}
        contentContainerStyle={users.length === 0 ? styles.emptyContainer : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg.app },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.app },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    borderRadius: radius.md,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  meta: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  displayName: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.text.primary },
  username: { fontSize: typography.size.xs, color: colors.text.secondary },
  proBadge: {
    fontSize: 10,
    fontWeight: typography.weight.bold,
    color: '#0E7490',
    backgroundColor: '#CFFAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  followBtn: {
    minWidth: 90,
    minHeight: 44,
  },
  followingBtn: {
    borderColor: colors.brand.primary,
  },
  footerLoader: { marginVertical: 12 },
  emptyContainer: { flexGrow: 1 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
});
