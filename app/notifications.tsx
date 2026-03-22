import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNotificationStore } from '@/store/notificationStore';
import api from '@/services/api';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import { formatRelativeTime } from '@/utils/relativeTime';

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
  }, [fetchNotifications, markAllRead]);

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
          <Card style={[styles.card, !item.is_read && styles.cardUnread]}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.cardTop}
              onPress={() => handlePress(item.ref_id, item.ref_type)}
            >
              <Avatar uri={item.actor?.avatar_url} seed={item.actor?.id ?? item.actor?.username ?? item.id} size={42} />
              <View style={styles.content}>
                <ThemedText style={styles.message}>
                  {getMessage(item.type, item.actor?.display_name || 'Someone', item.post?.caption)}
                </ThemedText>
                <ThemedText style={styles.meta}>{formatRelativeTime(item.created_at)}</ThemedText>
              </View>
            </TouchableOpacity>

            {item.ref_type === 'event_group_request' && item.event_group_request?.status === 'pending' && (
              <View style={styles.requestActions}>
                <Button
                  style={[styles.requestBtn, styles.acceptBtn]}
                  label="Accept"
                  onPress={() => handleRequestAction(item.event_group_request!.id, 'accept')}
                  loading={requestBusyId === item.event_group_request.id}
                  accessibilityLabel="Accept request"
                />
                <Button
                  style={[styles.requestBtn, styles.declineBtn]}
                  variant="secondary"
                  label="Decline"
                  onPress={() => handleRequestAction(item.event_group_request!.id, 'decline')}
                  disabled={requestBusyId === item.event_group_request.id}
                  accessibilityLabel="Decline request"
                />
              </View>
            )}

            {item.ref_type === 'event_group_request' && item.event_group_request?.status !== 'pending' && (
              <ThemedText style={styles.requestStatus}>Request {item.event_group_request?.status}</ThemedText>
            )}
          </Card>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <EmptyState
                iconName="notifications-outline"
                iconColor={colors.text.secondary}
                title="No notifications yet"
                subtitle="Reactions and comments on your posts will show up here."
              />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.app,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  card: {
    padding: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    minHeight: 44,
    gap: spacing.sm,
    alignItems: 'center',
  },
  cardUnread: {
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.bg.subtle,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  message: {
    fontSize: typography.size.sm,
    lineHeight: 20,
    color: colors.text.primary,
  },
  meta: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: 54,
  },
  requestBtn: {
    minWidth: 92,
    minHeight: 44,
  },
  acceptBtn: {
    backgroundColor: colors.state.success,
  },
  declineBtn: {
    borderColor: colors.border.strong,
  },
  requestStatus: {
    marginLeft: 54,
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    fontWeight: typography.weight.semibold,
  },
  empty: {
    paddingVertical: 64,
    paddingHorizontal: spacing.md,
  },
});