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
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCommunityStore, ThreadReply } from '@/store/communityStore';
import { useAuthStore } from '@/store/authStore';
import { colors, radius, spacing, typography } from '@/theme/tokens';

interface ReplyRowProps {
  reply: ThreadReply;
  depth?: number;
  onReply: (replyId: number, username: string) => void;
  onUserPress: (userId: number) => void;
}

function ReplyRow({ reply, depth = 0, onReply, onUserPress }: ReplyRowProps) {
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
    <Card style={[styles.replyContainer, { marginLeft: depth * 20 }]}>
      <View style={styles.replyHeader}>
        <TouchableOpacity
          onPress={() => onUserPress(reply.user_id)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Open ${reply.display_name} profile`}
        >
          <Avatar uri={reply.avatar_url} size={28} isProfessional={reply.is_professional} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onUserPress(reply.user_id)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Open ${reply.display_name} profile`}
        >
          <ThemedText style={styles.replyAuthor}>{reply.display_name}</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.replyTime}>{timeAgo(reply.created_at)}</ThemedText>
      </View>
      <ThemedText style={styles.replyContent}>{reply.content}</ThemedText>
      <View style={styles.replyActions}>
        <TouchableOpacity
          onPress={() => upvoteReply(reply.id)}
          style={[styles.replyUpvote, reply.user_upvoted && styles.replyUpvotedBtn]}
          accessibilityRole="button"
          accessibilityLabel={reply.user_upvoted ? 'Remove upvote from reply' : 'Upvote reply'}
          accessibilityState={{ selected: reply.user_upvoted }}
        >
          <ThemedText style={[styles.replyUpvoteText, reply.user_upvoted && styles.replyUpvoteActive]}>
            ▲ {reply.upvotes}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onReply(reply.id, reply.username)}
          accessibilityRole="button"
          accessibilityLabel={`Reply to ${reply.display_name}`}
        >
          <ThemedText style={styles.replyBtn}>↩ Reply</ThemedText>
        </TouchableOpacity>
      </View>
      {reply.children?.map((child) => (
        <ReplyRow
          key={child.id}
          reply={child}
          depth={depth + 1}
          onReply={onReply}
          onUserPress={onUserPress}
        />
      ))}
    </Card>
  );
}

export default function ThreadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const threadId = Number(id);
  const user = useAuthStore((s) => s.user);

  const { activeThread, replies, fetchThread, createReply, upvoteThread } = useCommunityStore();

  const [replyInput, setReplyInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: number; username: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchThread(threadId);
  }, [fetchThread, threadId]);

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

  const goToUserProfile = (userId: number) => {
    if (!Number.isFinite(userId) || userId <= 0) return;
    router.push(`/user/${userId}`);
  };

  if (!activeThread) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.brand.primary} size="large" />
      </View>
    );
  }

  const topLevelReplies = replies;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <FlatList
          data={topLevelReplies}
          keyExtractor={(item) => `reply-${item.id}`}
          renderItem={({ item }) => (
            <ReplyRow reply={item} onReply={handleSetReply} onUserPress={goToUserProfile} />
          )}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Card style={styles.threadCard}>
              {/* Thread OP */}
              <View style={styles.opHeader}>
                <TouchableOpacity
                  onPress={() => goToUserProfile(activeThread.user_id)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${activeThread.display_name} profile`}
                >
                  <Avatar
                    uri={activeThread.avatar_url}
                    size={40}
                    isProfessional={activeThread.is_professional}
                  />
                </TouchableOpacity>
                <View style={styles.opMeta}>
                  <TouchableOpacity
                    onPress={() => goToUserProfile(activeThread.user_id)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${activeThread.display_name} profile`}
                  >
                    <ThemedText style={styles.opName}>{activeThread.display_name}</ThemedText>
                    <ThemedText style={styles.opUsername}>@{activeThread.username}</ThemedText>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => upvoteThread(activeThread.id)}
                  accessibilityRole="button"
                  accessibilityLabel={activeThread.user_upvoted ? 'Remove upvote from thread' : 'Upvote thread'}
                  accessibilityState={{ selected: activeThread.user_upvoted }}
                >
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
              {activeThread.media_url ? (
                <Image source={{ uri: activeThread.media_url }} style={styles.threadImage} resizeMode="cover" />
              ) : null}
              <ThemedText style={styles.repliesLabel}>
                {activeThread.reply_count} replies
              </ThemedText>
            </Card>
          }
          ListEmptyComponent={<EmptyState iconName="chatbubble-outline" iconColor={colors.text.secondary} title="No replies yet" subtitle="Start the discussion with the first reply." />}
          showsVerticalScrollIndicator={false}
        />

        {/* Reply Input */}
        <View style={styles.inputArea}>
          {replyingTo && (
            <View style={styles.replyingToBar}>
              <ThemedText style={styles.replyingToText}>
                Replying to @{replyingTo.username}
              </ThemedText>
              <TouchableOpacity
                onPress={() => setReplyingTo(null)}
                accessibilityRole="button"
                accessibilityLabel="Cancel reply"
              >
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
            <Button
              style={[styles.sendBtn, (!replyInput.trim() || isSubmitting) && styles.sendBtnOff]}
              label={isSubmitting ? '' : '↑'}
              onPress={handleReply}
              loading={isSubmitting}
              disabled={!replyInput.trim() || isSubmitting}
              accessibilityLabel="Send reply"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg.app },
  flex: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: spacing.sm, paddingBottom: spacing.lg },
  threadCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  opHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  opMeta: { flex: 1 },
  opName: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.text.primary },
  opUsername: { fontSize: typography.size.xs, color: colors.text.secondary },
  upvoteBtn: {
    borderRadius: radius.sm,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    backgroundColor: colors.bg.muted,
  },
  upvotedBtn: { backgroundColor: colors.bg.subtle },
  upvoteText: { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.text.secondary },
  upvoteActive: { color: colors.brand.primary },
  threadTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.extrabold, color: colors.text.primary, lineHeight: 24 },
  threadContent: { fontSize: 14, color: '#27272A', lineHeight: 21 },
  threadImage: {
    width: '100%',
    height: 190,
    borderRadius: radius.md,
  },
  repliesLabel: { fontSize: 13, color: colors.text.secondary, fontWeight: typography.weight.medium },
  replyContainer: {
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  replyAuthor: { flex: 1, fontSize: 13, fontWeight: typography.weight.semibold, color: colors.text.primary },
  replyTime: { fontSize: 11, color: colors.text.muted },
  replyContent: { fontSize: 14, color: '#27272A', lineHeight: 20 },
  replyActions: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  replyUpvote: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.muted,
  },
  replyUpvotedBtn: { backgroundColor: colors.bg.subtle },
  replyUpvoteText: { fontSize: 12, fontWeight: typography.weight.semibold, color: colors.text.secondary },
  replyUpvoteActive: { color: colors.brand.primary },
  replyBtn: { fontSize: 12, color: colors.text.secondary, fontWeight: typography.weight.semibold },
  inputArea: {
    backgroundColor: colors.bg.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.soft,
  },
  replyingToBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  replyingToText: { fontSize: 12, color: colors.brand.primary, fontWeight: typography.weight.semibold },
  replyingToClose: { fontSize: 14, color: colors.text.muted, padding: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg.muted,
    borderRadius: radius.pill,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: typography.size.sm,
    color: colors.text.primary,
    maxHeight: 120,
  },
  sendBtn: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 0,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
  },
  sendBtnOff: { backgroundColor: colors.border.strong },
});
