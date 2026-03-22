import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { PostCard } from '@/components/feed/PostCard';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { Post } from '@/store/feedStore';
import { colors, radius, spacing, typography } from '@/theme/tokens';

interface Comment {
  id: number;
  user_id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  content: string;
  created_at: string;
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const postId = Number(id);
  const user = useAuthStore((s) => s.user);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadPost = async () => {
    try {
      const [postRes, commentsRes] = await Promise.all([
        api.get(`/posts/${postId}`),
        api.get(`/posts/${postId}/comments`),
      ]);
      setPost(postRes.data.post);
      setComments(commentsRes.data.comments);
    } catch {
      Alert.alert('Error', 'Could not load post.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPost();
  }, [postId]);

  const handleComment = async () => {
    if (!commentInput.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/posts/${postId}/comments`, { content: commentInput.trim() });
      setCommentInput('');
      const { data } = await api.get(`/posts/${postId}/comments`);
      setComments(data.comments);
    } catch {
      Alert.alert('Error', 'Could not post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.brand.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => `comment-${item.id}`}
          renderItem={({ item }) => (
            <Card style={styles.comment}>
              <Avatar uri={item.avatar_url} size={34} />
              <View style={styles.commentBody}>
                <View style={styles.commentHeader}>
                  <TouchableOpacity
                    onPress={() => router.push(`/user/${item.user_id}`)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${item.display_name} profile`}
                  >
                    <ThemedText style={styles.commentAuthor}>{item.display_name}</ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={styles.commentTime}>{timeAgo(item.created_at)}</ThemedText>
                </View>
                <ThemedText style={styles.commentContent}>{item.content}</ThemedText>
              </View>
            </Card>
          )}
          ListHeaderComponent={
            post ? (
              <View>
                <PostCard post={post} />
                <View style={styles.commentsHeader}>
                  <ThemedText style={styles.commentsTitle}>
                    {comments.length} Comment{comments.length !== 1 ? 's' : ''}
                  </ThemedText>
                </View>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState iconName="chatbubble-outline" iconColor={colors.text.secondary} title="No comments yet" subtitle="Be the first to comment on this post." />}
        />

        {/* Comment Input */}
        <View style={styles.inputArea}>
          <Avatar uri={user?.avatar_url} size={34} />
          <TextInput
            style={styles.input}
            value={commentInput}
            onChangeText={setCommentInput}
            placeholder="Add a comment…"
            placeholderTextColor="#A1A1AA"
            multiline
            maxLength={500}
          />
          <Button
            style={[styles.sendBtn, !commentInput.trim() && styles.sendBtnOff]}
            label={submitting ? '' : '↑'}
            onPress={handleComment}
            loading={submitting}
            disabled={!commentInput.trim() || submitting}
            accessibilityLabel="Send comment"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg.app },
  flex: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: spacing.lg, paddingHorizontal: spacing.md, gap: spacing.xs },
  commentsHeader: {
    paddingVertical: spacing.sm,
  },
  commentsTitle: { fontSize: 15, fontWeight: typography.weight.bold, color: colors.text.primary },
  comment: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  commentBody: { flex: 1, gap: 4 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentAuthor: { fontSize: 13, fontWeight: typography.weight.bold, color: colors.text.primary },
  commentTime: { fontSize: 11, color: colors.text.muted },
  commentContent: { fontSize: 14, color: '#27272A', lineHeight: 20 },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.bg.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.soft,
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
    maxHeight: 100,
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
