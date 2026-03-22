import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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
  const cardScale = useRef(new Animated.Value(1)).current;
  const treatScale = useRef(new Animated.Value(1)).current;
  const reactionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!showReactions) {
      reactionAnim.setValue(0);
      return;
    }

    Animated.timing(reactionAnim, {
      toValue: 1,
      duration: 170,
      useNativeDriver: true,
    }).start();
  }, [reactionAnim, showReactions]);

  const onCardPressIn = () => {
    Animated.spring(cardScale, {
      toValue: 0.97,
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

  const handleTreat = () => {
    reactToPost(post.id);
    setShowReactions(false);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    treatScale.setValue(0.86);
    Animated.spring(treatScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 22,
      bounciness: 12,
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
    <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userRow}
          onPress={() => router.push(`/user/${post.user_id}`)}
          onPressIn={onCardPressIn}
          onPressOut={onCardPressOut}
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
        <View style={[styles.captionWrap, !post.media_url && styles.textOnlyCaptionWrap]}>
          {!post.media_url ? (
            <>
              <View style={[styles.blob, styles.blobA]} />
              <View style={[styles.blob, styles.blobB]} />
              <View style={[styles.blob, styles.blobC]} />
            </>
          ) : null}
          <ThemedText style={styles.caption}>{post.caption}</ThemedText>
        </View>
      ) : null}

      {/* Media */}
      {post.media_url ? (
        <TouchableOpacity
          onPress={() => router.push(`/post/${post.id}`)}
          activeOpacity={0.95}
          onPressIn={onCardPressIn}
          onPressOut={onCardPressOut}
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
          <Ionicons name="location-outline" size={12} color="#71717A" />
          <ThemedText style={styles.location}>{post.location_name}</ThemedText>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleTreat}
          onLongPress={() => setShowReactions(true)}
          onPressIn={onCardPressIn}
          onPressOut={onCardPressOut}
        >
          <Animated.View style={{ transform: [{ scale: treatScale }] }}>
            <ThemedText style={styles.actionIcon}>
              {post.user_reacted ? '🐾' : '🤍'}
            </ThemedText>
          </Animated.View>
          <ThemedText style={styles.actionCount}>{post.reaction_count}</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push(`/post/${post.id}`)}
          onPressIn={onCardPressIn}
          onPressOut={onCardPressOut}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#52525B" />
          <ThemedText style={styles.actionCount}>{post.comment_count}</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="arrow-redo-outline" size={18} color="#52525B" />
        </TouchableOpacity>
      </View>

      {/* Reaction Picker */}
      {showReactions && (
        <Animated.View
          style={[
            styles.reactionPicker,
            {
              opacity: reactionAnim,
              transform: [
                {
                  translateY: reactionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
                {
                  scale: reactionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.98, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {REACTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.reactionBtn}
              onPress={() => {
                handleTreat();
              }}
            >
              <ThemedText style={styles.reactionEmoji}>{emoji}</ThemedText>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </Animated.View>
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
  captionWrap: {
    position: 'relative',
  },
  textOnlyCaptionWrap: {
    marginHorizontal: 14,
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(249,115,22,0.025)',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(249,115,22,0.05)',
  },
  blobA: {
    width: 90,
    height: 70,
    top: -10,
    left: -20,
  },
  blobB: {
    width: 120,
    height: 92,
    right: -28,
    bottom: -18,
    backgroundColor: 'rgba(225,29,72,0.03)',
  },
  blobC: {
    width: 62,
    height: 62,
    top: 14,
    right: 52,
    backgroundColor: 'rgba(14,165,165,0.03)',
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
