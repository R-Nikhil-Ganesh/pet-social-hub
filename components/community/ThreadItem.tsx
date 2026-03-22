import React, { useRef } from 'react';
import { Animated, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import { Thread, useCommunityStore } from '@/store/communityStore';

const FLAIRS: Record<string, { color: string; bg: string }> = {
  question: { color: '#2563EB', bg: '#EFF6FF' },
  advice: { color: '#16A34A', bg: '#F0FDF4' },
  story: { color: '#7C3AED', bg: '#F5F3FF' },
  news: { color: '#DC2626', bg: '#FEF2F2' },
  discussion: { color: '#D97706', bg: '#FFFBEB' },
  expert: { color: '#0891B2', bg: '#ECFEFF' },
};

interface ThreadItemProps {
  thread: Thread;
}

export function ThreadItem({ thread }: ThreadItemProps) {
  const router = useRouter();
  const upvoteThread = useCommunityStore((s) => s.upvoteThread);
  const flair = thread.flair ? FLAIRS[thread.flair] : null;
  const cardScale = useRef(new Animated.Value(1)).current;

  const onCardPressIn = () => {
    Animated.spring(cardScale, {
      toValue: 0.985,
      useNativeDriver: true,
      speed: 36,
      bounciness: 0,
    }).start();
  };

  const onCardPressOut = () => {
    Animated.spring(cardScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 0,
    }).start();
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: cardScale }] }]}>
      <TouchableOpacity
        style={styles.pressArea}
        onPress={() => router.push(`/thread/${thread.id}`)}
        activeOpacity={0.85}
        onPressIn={onCardPressIn}
        onPressOut={onCardPressOut}
      >
      {/* Vote column */}
      <View style={styles.voteCol}>
        <TouchableOpacity
          onPress={() => upvoteThread(thread.id)}
          style={[styles.upvoteBtn, thread.user_upvoted && styles.upvotedBtn]}
          onPressIn={onCardPressIn}
          onPressOut={onCardPressOut}
        >
          <ThemedText style={[styles.arrow, thread.user_upvoted && styles.arrowActive]}>
            ▲
          </ThemedText>
        </TouchableOpacity>
        <ThemedText style={[styles.upvoteCount, thread.user_upvoted && styles.upvotedCount]}>
          {thread.upvotes}
        </ThemedText>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          {flair && (
            <View style={[styles.flairBadge, { backgroundColor: flair.bg }]}>
              <ThemedText style={[styles.flairText, { color: flair.color }]}>
                {thread.flair}
              </ThemedText>
            </View>
          )}
          {thread.is_professional && (
            <View style={styles.expertBadge}>
              <View style={styles.expertRow}>
                <Ionicons name="checkmark" size={10} color="#0891B2" />
                <ThemedText style={styles.expertText}>{thread.professional_type ?? 'Expert'}</ThemedText>
              </View>
            </View>
          )}
        </View>

        <ThemedText style={styles.title} numberOfLines={2}>
          {thread.title}
        </ThemedText>
        <ThemedText style={styles.preview} numberOfLines={2}>
          {thread.content}
        </ThemedText>

        {thread.media_url ? (
          <Image source={{ uri: thread.media_url }} style={styles.threadImage} resizeMode="cover" />
        ) : null}

        <View style={styles.bottomRow}>
          <Avatar uri={thread.avatar_url} size={18} />
          <TouchableOpacity onPress={() => router.push(`/user/${thread.user_id}`)} activeOpacity={0.8}>
            <ThemedText style={styles.author}>{thread.display_name}</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.sep}>·</ThemedText>
          <ThemedText style={styles.time}>{timeAgo(thread.created_at)}</ThemedText>
          <ThemedText style={styles.sep}>·</ThemedText>
          <View style={styles.repliesWrap}>
            <Ionicons name="chatbubble-outline" size={12} color="#71717A" />
            <ThemedText style={styles.replies}>{thread.reply_count}</ThemedText>
          </View>
        </View>
      </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  pressArea: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: 10,
  },
  voteCol: {
    alignItems: 'center',
    width: 36,
    gap: 2,
  },
  upvoteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upvotedBtn: {
    backgroundColor: '#EDE9FE',
  },
  arrow: {
    fontSize: 14,
    color: '#52525B',
  },
  arrowActive: {
    color: '#7C3AED',
  },
  upvoteCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#52525B',
  },
  upvotedCount: {
    color: '#7C3AED',
  },
  content: {
    flex: 1,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  flairBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  flairText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  expertBadge: {
    backgroundColor: '#ECFEFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  expertText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0891B2',
    textTransform: 'capitalize',
  },
  expertRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181B',
    lineHeight: 20,
  },
  preview: {
    fontSize: 13,
    color: '#52525B',
    lineHeight: 18,
  },
  threadImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  author: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
  },
  sep: {
    fontSize: 12,
    color: '#D4D4D8',
  },
  time: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  replies: {
    fontSize: 12,
    color: '#71717A',
  },
  repliesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
});
