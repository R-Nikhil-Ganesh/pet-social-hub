import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { PostCard } from '@/components/feed/PostCard';
import api from '@/services/api';
import { Post } from '@/store/feedStore';
import { colors, radius, spacing } from '@/theme/tokens';

export default function MyPostsScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadMyPosts = useCallback(async () => {
    try {
      const { data } = await api.get('/users/me/posts');
      setPosts(data.posts ?? []);
    } catch {
      setPosts([]);
    }
  }, []);

  useEffect(() => {
    loadMyPosts();
  }, [loadMyPosts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyPosts();
    setRefreshing(false);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.topBar}>
        <ThemedText variant="title" style={[styles.title, styles.titleCenter]}>My Posts</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} />
        }
      >
        {posts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              iconName="images-outline"
              iconColor={colors.text.secondary}
              title="No posts yet"
              subtitle="Share your first moment with the community."
            />
            <Button
              style={styles.createBtn}
              label="Create Post"
              onPress={() => router.push('/new-post' as never)}
              accessibilityLabel="Create a new post"
            />
          </Card>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg.app },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.soft,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.muted,
  },
  title: { color: colors.text.primary },
  titleCenter: { flex: 1, textAlign: 'center' },
  placeholder: { width: 40, height: 40 },
  content: { flex: 1 },
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  emptyCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  createBtn: { marginTop: spacing.xs },
});
