import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import { useNotificationStore } from '@/store/notificationStore';
import api from '@/services/api';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, isLoading, fetchNotifications, markAllRead } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [requestBusyId, setRequestBusyId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      await fetchNotifications();
      await markAllRead();
    };

    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    await markAllRead();
    setRefreshing(false);
  };

  const handlePress = (notificationId: number | null, refType: string | null) => {
    if (refType === 'post' && notificationId) {
      router.push(`/post/${notificationId}`);
    }
  };

  const handleRequestAction = async (requestId: number, action: 'accept' | 'decline') => {
    if (requestBusyId) return;
    setRequestBusyId(requestId);
    try {
      const { data } = await api.post(`/event-groups/requests/${requestId}/respond`, { action });
      await fetchNotifications();
      if (action === 'accept' && data?.community_id) {
        router.push({ pathname: '/community/[id]', params: { id: String(data.community_id) } } as never);
      }
    } finally {
      setRequestBusyId(null);
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const getMessage = (type: string, actorName: string, caption?: string) => {
    const postLabel = caption?.trim() ? `"${caption.trim().slice(0, 40)}${caption.trim().length > 40 ? '…' : ''}"` : 'your post';
    if (type === 'game_invite') return `${actorName} sent you an event group request`;
    if (type === 'follow') return `${actorName} followed you`;
    if (type === 'comment') return `${actorName} commented on ${postLabel}`;
    return `${actorName} reacted to ${postLabel}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => `notification-${item.id}`}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.is_read && styles.cardUnread]}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.cardTop}
              onPress={() => handlePress(item.ref_id, item.ref_type)}
            >
              <Avatar uri={item.actor?.avatar_url} size={42} />
              <View style={styles.content}>
                <ThemedText style={styles.message}>
                  {getMessage(item.type, item.actor?.display_name || 'Someone', item.post?.caption)}
                </ThemedText>
                <ThemedText style={styles.meta}>{timeAgo(item.created_at)}</ThemedText>
              </View>
            </TouchableOpacity>

            {item.ref_type === 'event_group_request' && item.event_group_request?.status === 'pending' && (
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={[styles.requestBtn, styles.acceptBtn]}
                  onPress={() => handleRequestAction(item.event_group_request!.id, 'accept')}
                  disabled={requestBusyId === item.event_group_request.id}
                >
                  {requestBusyId === item.event_group_request.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <ThemedText style={styles.acceptBtnText}>Accept</ThemedText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.requestBtn, styles.declineBtn]}
                  onPress={() => handleRequestAction(item.event_group_request!.id, 'decline')}
                  disabled={requestBusyId === item.event_group_request.id}
                >
                  <ThemedText style={styles.declineBtnText}>Decline</ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {item.ref_type === 'event_group_request' && item.event_group_request?.status !== 'pending' && (
              <ThemedText style={styles.requestStatus}>Request {item.event_group_request?.status}</ThemedText>
            )}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <ThemedText style={styles.emptyTitle}>No notifications yet</ThemedText>
              <ThemedText style={styles.emptyText}>
                Reactions and comments on your posts will show up here.
              </ThemedText>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  card: {
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cardUnread: {
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#FAF5FF',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#18181B',
  },
  meta: {
    fontSize: 12,
    color: '#71717A',
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 54,
  },
  requestBtn: {
    minWidth: 80,
    borderRadius: 10,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  acceptBtn: {
    backgroundColor: '#16A34A',
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  declineBtn: {
    backgroundColor: '#F4F4F5',
  },
  declineBtnText: {
    color: '#3F3F46',
    fontSize: 12,
    fontWeight: '700',
  },
  requestStatus: {
    marginLeft: 54,
    fontSize: 12,
    color: '#71717A',
    fontWeight: '600',
  },
  empty: {
    paddingVertical: 64,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181B',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#71717A',
    maxWidth: 240,
  },
});