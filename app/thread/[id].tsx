import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import { useCommunityStore, ThreadReply } from '@/store/communityStore';
import { useAuthStore } from '@/store/authStore';

interface ReplyRowProps {
  reply: ThreadReply;
  depth?: number;
  onReply: (replyId: number, username: string) => void;
}

function ReplyRow({ reply, depth = 0, onReply }: ReplyRowProps) {
  const upvoteReply = useCommunityStore((s) => s.upvoteReply);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <View style={[styles.replyContainer, { marginLeft: depth * 20 }]}>
      <View style={styles.replyHeader}>
        <Avatar uri={reply.avatar_url} size={28} isProfessional={reply.is_professional} />
        <ThemedText style={styles.replyAuthor}>{reply.display_name}</ThemedText>
        <ThemedText style={styles.replyTime}>{timeAgo(reply.created_at)}</ThemedText>
      </View>
      <ThemedText style={styles.replyContent}>{reply.content}</ThemedText>
      <View style={styles.replyActions}>
        <TouchableOpacity
          onPress={() => upvoteReply(reply.id)}
          style={[styles.replyUpvote, reply.user_upvoted && styles.replyUpvotedBtn]}
        >
          <ThemedText style={[styles.replyUpvoteText, reply.user_upvoted && styles.replyUpvoteActive]}>
            ▲ {reply.upvotes}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onReply(reply.id, reply.username)}>
          <ThemedText style={styles.replyBtn}>↩ Reply</ThemedText>
        </TouchableOpacity>
      </View>
      {reply.children?.map((child) => (
        <ReplyRow key={child.id} reply={child} depth={depth + 1} onReply={onReply} />
      ))}
    </View>
  );
}

export default function ThreadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const threadId = Number(id);
  const user = useAuthStore((s) => s.user);

  const { activeThread, replies, fetchThread, fetchReplies, createReply, upvoteThread } =
    useCommunityStore();

  const [replyInput, setReplyInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: number; username: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchThread(threadId);
    fetchReplies(threadId);
  }, [threadId]);

  const handleReply = async () => {
    if (!replyInput.trim()) return;
    setIsSubmitting(true);
    try {
      await createReply(threadId, replyInput.trim(), replyingTo?.id);
      setReplyInput('');
      setReplyingTo(null);
    } catch {
      Alert.alert('Error', 'Could not post reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetReply = (replyId: number, username: string) => {
    setReplyingTo({ id: replyId, username });
  };

  if (!activeThread) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#7C3AED" size="large" />
      </View>
    );
  }

  const topLevelReplies = replies.filter((r) => !r.parent_reply_id);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <FlatList
          data={topLevelReplies}
          keyExtractor={(item) => `reply-${item.id}`}
          renderItem={({ item }) => (
            <ReplyRow reply={item} onReply={handleSetReply} />
          )}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.threadCard}>
              {/* Thread OP */}
              <View style={styles.opHeader}>
                <Avatar
                  uri={activeThread.avatar_url}
                  size={40}
                  isProfessional={activeThread.is_professional}
                />
                <View style={styles.opMeta}>
                  <ThemedText style={styles.opName}>{activeThread.display_name}</ThemedText>
                  <ThemedText style={styles.opUsername}>@{activeThread.username}</ThemedText>
                </View>
                <TouchableOpacity onPress={() => upvoteThread(activeThread.id)}>
                  <View style={[styles.upvoteBtn, activeThread.user_upvoted && styles.upvotedBtn]}>
                    <ThemedText
                      style={[styles.upvoteText, activeThread.user_upvoted && styles.upvoteActive]}
                    >
                      ▲ {activeThread.upvotes}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              </View>
              <ThemedText style={styles.threadTitle}>{activeThread.title}</ThemedText>
              <ThemedText style={styles.threadContent}>{activeThread.content}</ThemedText>
              <ThemedText style={styles.repliesLabel}>
                💬 {activeThread.reply_count} replies
              </ThemedText>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Reply Input */}
        <View style={styles.inputArea}>
          {replyingTo && (
            <View style={styles.replyingToBar}>
              <ThemedText style={styles.replyingToText}>
                Replying to @{replyingTo.username}
              </ThemedText>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <ThemedText style={styles.replyingToClose}>✕</ThemedText>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <Avatar uri={user?.avatar_url} size={32} />
            <TextInput
              style={styles.input}
              value={replyInput}
              onChangeText={setReplyInput}
              placeholder="Write a reply…"
              placeholderTextColor="#A1A1AA"
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!replyInput.trim() || isSubmitting) && styles.sendBtnOff]}
              onPress={handleReply}
              disabled={!replyInput.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText style={styles.sendText}>↑</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9F9FB' },
  flex: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 12, paddingBottom: 20 },
  threadCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  opHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  opMeta: { flex: 1 },
  opName: { fontSize: 14, fontWeight: '700', color: '#18181B' },
  opUsername: { fontSize: 12, color: '#71717A' },
  upvoteBtn: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#F4F4F5',
  },
  upvotedBtn: { backgroundColor: '#EDE9FE' },
  upvoteText: { fontSize: 14, fontWeight: '700', color: '#52525B' },
  upvoteActive: { color: '#7C3AED' },
  threadTitle: { fontSize: 18, fontWeight: '800', color: '#18181B', lineHeight: 24 },
  threadContent: { fontSize: 14, color: '#27272A', lineHeight: 21 },
  repliesLabel: { fontSize: 13, color: '#71717A', fontWeight: '500' },
  replyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  replyAuthor: { flex: 1, fontSize: 13, fontWeight: '600', color: '#18181B' },
  replyTime: { fontSize: 11, color: '#A1A1AA' },
  replyContent: { fontSize: 14, color: '#27272A', lineHeight: 20 },
  replyActions: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  replyUpvote: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F4F4F5',
  },
  replyUpvotedBtn: { backgroundColor: '#EDE9FE' },
  replyUpvoteText: { fontSize: 12, fontWeight: '600', color: '#52525B' },
  replyUpvoteActive: { color: '#7C3AED' },
  replyBtn: { fontSize: 12, color: '#71717A', fontWeight: '600' },
  inputArea: {
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E4E7',
  },
  replyingToBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  replyingToText: { fontSize: 12, color: '#7C3AED', fontWeight: '600' },
  replyingToClose: { fontSize: 14, color: '#A1A1AA', padding: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F4F4F5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#18181B',
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: '#E4E4E7' },
  sendText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
