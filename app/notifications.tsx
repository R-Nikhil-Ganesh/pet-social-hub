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
import { useNotificationStore } from '@/store/notificationStore';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, isLoading, fetchNotifications, markAllRead } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);

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
    if (type === 'comment') return `${actorName} commented on ${postLabel}`;
    return `${actorName} reacted to ${postLabel}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => `notification-${item.id}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.card, !item.is_read && styles.cardUnread]}
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
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
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