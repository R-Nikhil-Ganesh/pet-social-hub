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
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

interface FollowUser {
  id: number;
  username: string;
  display_name: string;
  avatar_url?: string;
  is_professional: boolean;
  professional_type?: string;
  is_following: boolean;
}

export default function FollowingScreen() {
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

  const loadFollowing = useCallback(
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
        const { data } = await api.get(`/users/${userId}/following?page=${nextPage}&limit=25`);
        const nextUsers = (data?.users ?? []) as FollowUser[];
        const targetName = data?.target_user?.display_name;
        if (targetName) {
          navigation.setOptions({ title: `${targetName} is Following` });
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
    loadFollowing(1, true);
  }, [loadFollowing, userId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#7C3AED" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={users}
        keyExtractor={(item) => `following-${item.id}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadFollowing(1, true)} />
        }
        renderItem={({ item }) => {
          const isPending = pendingIds.includes(item.id);
          const isSelfRow = item.id === selfId;

          return (
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.rowMain}
                onPress={() => router.push({ pathname: '/user/[id]', params: { id: String(item.id) } } as never)}
                activeOpacity={0.85}
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
                <TouchableOpacity
                  style={[styles.followBtn, item.is_following && styles.followingBtn]}
                  onPress={() => toggleFollow(item.id, item.is_following)}
                  disabled={isPending}
                  activeOpacity={0.85}
                >
                  {isPending ? (
                    <ActivityIndicator color={item.is_following ? '#7C3AED' : '#fff'} size="small" />
                  ) : (
                    <ThemedText style={[styles.followBtnText, item.is_following && styles.followingBtnText]}>
                      {item.is_following ? 'Following' : 'Follow'}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (!loadingMore && hasMore) {
            loadFollowing(page + 1);
          }
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <ThemedText style={styles.emptyTitle}>Not following anyone yet</ThemedText>
            <ThemedText style={styles.emptySub}>No profiles are being followed yet.</ThemedText>
          </View>
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color="#7C3AED" style={styles.footerLoader} /> : null}
        contentContainerStyle={users.length === 0 ? styles.emptyContainer : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9F9FB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9F9FB' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECECF0',
    backgroundColor: '#fff',
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  meta: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  displayName: { fontSize: 15, fontWeight: '700', color: '#18181B' },
  username: { fontSize: 12, color: '#71717A' },
  proBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0E7490',
    backgroundColor: '#CFFAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  followBtn: {
    minWidth: 90,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  followingBtn: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  followBtnText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  followingBtnText: {
    color: '#7C3AED',
  },
  footerLoader: { marginVertical: 12 },
  emptyContainer: { flexGrow: 1 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#18181B' },
  emptySub: { fontSize: 13, color: '#71717A', textAlign: 'center' },
});
