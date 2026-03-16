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
import { useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { PostCard } from '@/components/feed/PostCard';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { Post } from '@/store/feedStore';

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
        <ActivityIndicator color="#7C3AED" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => `comment-${item.id}`}
          renderItem={({ item }) => (
            <View style={styles.comment}>
              <Avatar uri={item.avatar_url} size={34} />
              <View style={styles.commentBody}>
                <View style={styles.commentHeader}>
                  <ThemedText style={styles.commentAuthor}>{item.display_name}</ThemedText>
                  <ThemedText style={styles.commentTime}>{timeAgo(item.created_at)}</ThemedText>
                </View>
                <ThemedText style={styles.commentContent}>{item.content}</ThemedText>
              </View>
            </View>
          )}
          ListHeaderComponent={
            post ? (
              <View>
                <PostCard post={post} />
                <View style={styles.commentsHeader}>
                  <ThemedText style={styles.commentsTitle}>
                    💬 {comments.length} Comment{comments.length !== 1 ? 's' : ''}
                  </ThemedText>
                </View>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
          <TouchableOpacity
            style={[styles.sendBtn, !commentInput.trim() && styles.sendBtnOff]}
            onPress={handleComment}
            disabled={!commentInput.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.sendText}>↑</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9F9FB' },
  flex: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: 20 },
  commentsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E4E7',
  },
  commentsTitle: { fontSize: 15, fontWeight: '700', color: '#18181B' },
  comment: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F4F4F5',
  },
  commentBody: { flex: 1, gap: 4 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: '#18181B' },
  commentTime: { fontSize: 11, color: '#A1A1AA' },
  commentContent: { fontSize: 14, color: '#27272A', lineHeight: 20 },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    gap: 8,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E4E7',
  },
  input: {
    flex: 1,
    backgroundColor: '#F4F4F5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#18181B',
    maxHeight: 100,
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
