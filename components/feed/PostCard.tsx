import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import { PetTag } from '@/components/ui/PetTag';
import { Post, useFeedStore } from '@/store/feedStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
}

const REACTIONS = ['🐾', '❤️', '😂', '😮', '🔥'];

export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const reactToPost = useFeedStore((s) => s.reactToPost);
  const [showReactions, setShowReactions] = useState(false);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => router.push(`/user/${post.user_id}`)}
        >
          <Avatar uri={post.avatar_url} size={42} />
          <View style={styles.userInfo}>
            <ThemedText style={styles.displayName}>{post.display_name}</ThemedText>
            <ThemedText style={styles.username}>@{post.username}</ThemedText>
          </View>
        </TouchableOpacity>
        <ThemedText style={styles.time}>{timeAgo(post.created_at)}</ThemedText>
      </View>

      {/* Pet Context Tag */}
      <View style={styles.petRow}>
        <PetTag breed={post.pet.breed} age={post.pet.age} />
        <ThemedText style={styles.petName}>— {post.pet.name}</ThemedText>
      </View>

      {/* Caption */}
      {post.caption ? (
        <ThemedText style={styles.caption}>{post.caption}</ThemedText>
      ) : null}

      {/* Media */}
      {post.media_url ? (
        <TouchableOpacity
          onPress={() => router.push(`/post/${post.id}`)}
          activeOpacity={0.95}
        >
          <Image
            source={{ uri: post.media_url }}
            style={styles.media}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ) : null}

      {/* Location */}
      {post.location_name ? (
        <View style={styles.locationRow}>
          <ThemedText style={styles.locationIcon}>📍</ThemedText>
          <ThemedText style={styles.location}>{post.location_name}</ThemedText>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setShowReactions(!showReactions)}
          onLongPress={() => setShowReactions(true)}
        >
          <ThemedText style={styles.actionIcon}>
            {post.user_reacted ? '🐾' : '🤍'}
          </ThemedText>
          <ThemedText style={styles.actionCount}>{post.reaction_count}</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push(`/post/${post.id}`)}
        >
          <ThemedText style={styles.actionIcon}>💬</ThemedText>
          <ThemedText style={styles.actionCount}>{post.comment_count}</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <ThemedText style={styles.actionIcon}>↗️</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Reaction Picker */}
      {showReactions && (
        <View style={styles.reactionPicker}>
          {REACTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.reactionBtn}
              onPress={() => {
                reactToPost(post.id);
                setShowReactions(false);
              }}
            >
              <ThemedText style={styles.reactionEmoji}>{emoji}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userInfo: {
    gap: 1,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
  },
  username: {
    fontSize: 12,
    color: '#71717A',
  },
  time: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 6,
  },
  petName: {
    fontSize: 12,
    color: '#52525B',
    fontStyle: 'italic',
  },
  caption: {
    fontSize: 14,
    color: '#27272A',
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  media: {
    width: SCREEN_WIDTH - 32,
    marginHorizontal: 16,
    height: (SCREEN_WIDTH - 32) * 0.75,
    borderRadius: 12,
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 4,
  },
  locationIcon: { fontSize: 12 },
  location: {
    fontSize: 12,
    color: '#71717A',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F4F4F5',
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionCount: {
    fontSize: 13,
    color: '#52525B',
    fontWeight: '500',
  },
  reactionPicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F4F4F5',
  },
  reactionBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F4F4F5',
  },
  reactionEmoji: {
    fontSize: 22,
  },
});
