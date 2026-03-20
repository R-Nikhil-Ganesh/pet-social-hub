import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Animated, PanResponder, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import { ChatMessage } from '@/store/communityStore';
import { useAuthStore } from '@/store/authStore';

interface ChatBubbleProps {
  message: ChatMessage;
  onLongPress?: () => void;
  onReplyPress?: () => void;
  onReactPress?: (emoji: string) => void;
}

export function ChatBubble({ message, onLongPress, onReplyPress, onReactPress }: ChatBubbleProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isOwn = message.sender_id === user?.id;
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;

  const openSenderProfile = () => {
    if (!message.sender_id) return;
    router.push(`/user/${message.sender_id}`);
  };

  const timeLabel = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const emojis = useMemo(() => ['🐾', '❤️', '😂', '🔥', '👏'], []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gesture) =>
          Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_evt, gesture) => {
          const dx = isOwn ? Math.min(0, gesture.dx) : Math.max(0, gesture.dx);
          translateX.setValue(Math.max(-60, Math.min(60, dx)));
        },
        onPanResponderRelease: (_evt, gesture) => {
          const triggerReply = isOwn ? gesture.dx <= -50 : gesture.dx >= 50;
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();

          if (triggerReply) {
            onReplyPress?.();
          }
        },
      }),
    [isOwn, onReplyPress, translateX]
  );

  const reactWith = (emoji: string) => {
    onReactPress?.(emoji);
    setShowEmojiPicker(false);
  };

  return (
    <View style={[styles.container, isOwn && styles.containerOwn]}>
      {!isOwn && (
        <TouchableOpacity onPress={openSenderProfile} activeOpacity={0.8}>
          <Avatar uri={message.sender_avatar} size={32} style={styles.avatar} />
        </TouchableOpacity>
      )}
      <View style={[styles.bubbleGroup, isOwn && styles.bubbleGroupOwn]}>
        {!isOwn && (
          <TouchableOpacity onPress={openSenderProfile} activeOpacity={0.8}>
            <ThemedText style={styles.senderName}>{message.sender_display_name}</ThemedText>
          </TouchableOpacity>
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

        <Animated.View
          style={{ transform: [{ translateX }] }}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            onLongPress={onLongPress}
            onPress={() => setShowEmojiPicker((prev) => !prev)}
            activeOpacity={0.85}
            style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}
          >
            {(message.type === 'text' || message.type === 'reply') && (
              <ThemedText style={[styles.text, isOwn && styles.textOwn]}>
                {message.content}
              </ThemedText>
            )}
            {message.type === 'image' && (
              <Image
                source={{ uri: message.media_url || message.content }}
                style={styles.imageContent}
                resizeMode="cover"
              />
            )}
            {(message.type === 'sticker' || message.type === 'gif') && (
              <Image
                source={{ uri: message.media_url || message.content }}
                style={styles.stickerContent}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </Animated.View>

        {showEmojiPicker && (
          <View style={[styles.emojiPicker, isOwn && styles.emojiPickerOwn]}>
            {emojis.map((emoji) => (
              <TouchableOpacity
                key={`${message._id}-${emoji}`}
                style={styles.emojiPickerBtn}
                onPress={() => reactWith(emoji)}
              >
                <ThemedText style={styles.emojiPickerText}>{emoji}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <TouchableOpacity
            style={[styles.reactionsRow, isOwn && styles.reactionsRowOwn]}
            onPress={() => setShowReactionsModal(true)}
            activeOpacity={0.85}
          >
            {message.reactions
              .filter((r) => r.count > 0)
              .map((r) => (
                <View
                  key={r.emoji}
                  style={[styles.reactionChip, r.user_reacted && styles.reactionChipActive]}
                >
                  <ThemedText style={styles.reactionEmoji}>{r.emoji}</ThemedText>
                  <ThemedText style={styles.reactionCount}>{r.count}</ThemedText>
                </View>
              ))}
            <TouchableOpacity
              style={styles.quickReactionBtn}
              onPress={() => setShowEmojiPicker((prev) => !prev)}
              onLongPress={() => setShowReactionsModal(true)}
            >
              <ThemedText style={styles.quickReactionText}>+</ThemedText>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        <ThemedText style={[styles.time, isOwn && styles.timeOwn]}>{timeLabel}</ThemedText>
      </View>

      <Modal
        visible={showReactionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReactionsModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowReactionsModal(false)}>
          <Pressable style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>Reactions</ThemedText>
            <View style={styles.modalList}>
              {message.reactions
                .filter((r) => r.count > 0)
                .map((reaction) => (
                  <View key={`modal-${message._id}-${reaction.emoji}`} style={styles.modalRow}>
                    <View style={styles.modalEmojiGroup}>
                      <ThemedText style={styles.modalEmoji}>{reaction.emoji}</ThemedText>
                      <ThemedText style={styles.modalCount}>{reaction.count}</ThemedText>
                    </View>
                    <ThemedText style={styles.modalUsers} numberOfLines={3}>
                      {(reaction.users || [])
                        .map((u) => (u.is_self ? 'You' : u.display_name || u.username))
                        .join(', ') || 'Unknown users'}
                    </ThemedText>
                  </View>
                ))}
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowReactionsModal(false)}>
              <ThemedText style={styles.modalCloseText}>Close</ThemedText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  reactionChipActive: {
    backgroundColor: '#EDE9FE',
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 11,
    color: '#52525B',
    fontWeight: '600',
  },
  quickReactionBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickReactionText: {
    fontSize: 14,
    color: '#52525B',
    fontWeight: '700',
    lineHeight: 16,
  },
  emojiPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  emojiPickerOwn: {
    alignSelf: 'flex-end',
  },
  emojiPickerBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  emojiPickerText: {
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '85%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181B',
  },
  modalList: {
    gap: 8,
  },
  modalRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: '#F4F4F5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  modalEmojiGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalEmoji: {
    fontSize: 17,
  },
  modalCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3F3F46',
  },
  modalUsers: {
    fontSize: 12,
    color: '#52525B',
    lineHeight: 18,
  },
  modalCloseBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  modalCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
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
