import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import { ChatMessage } from '@/store/communityStore';
import { useAuthStore } from '@/store/authStore';

interface ChatBubbleProps {
  message: ChatMessage;
  onLongPress?: () => void;
  onReplyPress?: () => void;
}

export function ChatBubble({ message, onLongPress, onReplyPress }: ChatBubbleProps) {
  const user = useAuthStore((s) => s.user);
  const isOwn = message.sender_id === user?.id;

  const timeLabel = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.container, isOwn && styles.containerOwn]}>
      {!isOwn && (
        <Avatar uri={message.sender_avatar} size={32} style={styles.avatar} />
      )}
      <View style={[styles.bubbleGroup, isOwn && styles.bubbleGroupOwn]}>
        {!isOwn && (
          <ThemedText style={styles.senderName}>{message.sender_display_name}</ThemedText>
        )}

        {/* Reply preview */}
        {message.reply_to && message.reply_preview && (
          <TouchableOpacity style={styles.replyPreview} onPress={onReplyPress}>
            <View style={styles.replyBar} />
            <ThemedText style={styles.replyText} numberOfLines={1}>
              {message.reply_preview}
            </ThemedText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onLongPress={onLongPress}
          activeOpacity={0.85}
          style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}
        >
          {message.type === 'text' && (
            <ThemedText style={[styles.text, isOwn && styles.textOwn]}>
              {message.content}
            </ThemedText>
          )}
          {message.type === 'image' && (
            <Image
              source={{ uri: message.content }}
              style={styles.imageContent}
              resizeMode="cover"
            />
          )}
          {(message.type === 'sticker' || message.type === 'gif') && (
            <Image
              source={{ uri: message.content }}
              style={styles.stickerContent}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <View style={[styles.reactionsRow, isOwn && styles.reactionsRowOwn]}>
            {message.reactions
              .filter((r) => r.count > 0)
              .map((r) => (
                <View key={r.emoji} style={styles.reactionChip}>
                  <ThemedText style={styles.reactionEmoji}>{r.emoji}</ThemedText>
                  <ThemedText style={styles.reactionCount}>{r.count}</ThemedText>
                </View>
              ))}
          </View>
        )}

        <ThemedText style={[styles.time, isOwn && styles.timeOwn]}>{timeLabel}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 3,
    paddingHorizontal: 12,
    gap: 8,
  },
  containerOwn: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    marginBottom: 6,
  },
  bubbleGroup: {
    maxWidth: '75%',
    gap: 3,
  },
  bubbleGroupOwn: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '600',
    paddingLeft: 4,
  },
  replyPreview: {
    flexDirection: 'row',
    backgroundColor: '#F4F4F5',
    borderRadius: 8,
    overflow: 'hidden',
    maxWidth: '100%',
    marginBottom: 2,
  },
  replyBar: {
    width: 3,
    backgroundColor: '#7C3AED',
  },
  replyText: {
    flex: 1,
    fontSize: 12,
    color: '#52525B',
    padding: 6,
  },
  bubble: {
    borderRadius: 18,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  bubbleOwn: {
    backgroundColor: '#7C3AED',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#F4F4F5',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    color: '#18181B',
    lineHeight: 20,
  },
  textOwn: {
    color: '#fff',
  },
  imageContent: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  stickerContent: {
    width: 120,
    height: 120,
  },
  reactionsRow: {
    flexDirection: 'row',
    gap: 4,
    paddingLeft: 4,
  },
  reactionsRowOwn: {
    paddingRight: 4,
    paddingLeft: 0,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 11,
    color: '#52525B',
    fontWeight: '600',
  },
  time: {
    fontSize: 10,
    color: '#A1A1AA',
    paddingLeft: 4,
  },
  timeOwn: {
    paddingRight: 4,
    paddingLeft: 0,
  },
});
