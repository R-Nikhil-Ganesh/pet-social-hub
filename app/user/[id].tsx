import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PetTag } from '@/components/ui/PetTag';
import { PostCard } from '@/components/feed/PostCard';
import { useAuthStore , User } from '@/store/authStore';
import api from '@/services/api';

import { Post } from '@/store/feedStore';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const userId = Number(id);
  const selfId = useAuthStore((s) => s.user?.id);
  const navigation = useNavigation();
  const updateUser = useAuthStore((s) => s.updateUser);

  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const isSelf = userId === selfId;

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const [profileRes, postsRes] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get(`/users/${userId}/posts`),
      ]);
      setProfile(profileRes.data.user);
      setPosts(postsRes.data.posts ?? []);
      setIsFollowing(profileRes.data.is_following);
      navigation.setOptions({ title: profileRes.data.user.display_name });
    } catch {
      Alert.alert('Error', 'Could not load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profile || followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const { data } = await api.delete(`/users/${userId}/follow`);
        setIsFollowing(false);
        setProfile((p) =>
          p
            ? {
                ...p,
                follower_count:
                  typeof data?.target_follower_count === 'number'
                    ? data.target_follower_count
                    : Math.max(0, p.follower_count - 1),
              }
            : p
        );
        if (typeof data?.actor_following_count === 'number') {
          updateUser({ following_count: data.actor_following_count });
        }
      } else {
        const { data } = await api.post(`/users/${userId}/follow`);
        setIsFollowing(true);
        setProfile((p) =>
          p
            ? {
                ...p,
                follower_count:
                  typeof data?.target_follower_count === 'number'
                    ? data.target_follower_count
                    : p.follower_count + 1,
              }
            : p
        );
        if (typeof data?.actor_following_count === 'number') {
          updateUser({ following_count: data.actor_following_count });
        }
      }
    } catch {
      Alert.alert('Error', 'Could not update follow status.');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.brand.primary} size="large" />
      </View>
    );
  }

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <LinearGradient colors={['#F97316', '#FB7185']} style={styles.hero}>
          <Avatar
            uri={profile.avatar_url}
            size={80}
            isProfessional={profile.is_professional}
            style={styles.heroAvatar}
          />
          <View style={styles.heroInfo}>
            <ThemedText variant="title" style={styles.displayName}>{profile.display_name}</ThemedText>
            <ThemedText variant="body" style={styles.username}>@{profile.username}</ThemedText>
            {profile.is_professional && (
              <View style={styles.proBadge}>
                <View style={styles.proRow}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                  <ThemedText style={styles.proText}>{profile.professional_type ?? 'Professional'}</ThemedText>
                </View>
              </View>
            )}
            {profile.bio ? (
              <ThemedText style={styles.bio}>{profile.bio}</ThemedText>
            ) : null}
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <ThemedText variant="title" style={styles.statValue}>{posts.length}</ThemedText>
            <ThemedText variant="caption" style={styles.statLabel}>Posts</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statBlock}
            onPress={() => router.push({ pathname: '/followers/[id]', params: { id: String(userId) } } as never)}
            activeOpacity={0.8}
          >
            <ThemedText variant="title" style={styles.statValue}>{profile.follower_count}</ThemedText>
            <ThemedText variant="caption" style={styles.statLabel}>Followers</ThemedText>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statBlock}
            onPress={() => router.push({ pathname: '/following/[id]', params: { id: String(userId) } } as never)}
            activeOpacity={0.8}
          >
            <ThemedText variant="title" style={styles.statValue}>{profile.following_count}</ThemedText>
            <ThemedText variant="caption" style={styles.statLabel}>Following</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Follow / Message buttons */}
        {!isSelf && (
          <View style={styles.actionRow}>
            <Button
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              variant={isFollowing ? 'secondary' : 'primary'}
              label={isFollowing ? 'Following' : 'Follow'}
              onPress={handleFollow}
              loading={followLoading}
              disabled={followLoading}
            />
          </View>
        )}

        {/* Pets */}
        {profile.pet_profiles?.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Pets</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petRow}>
              {profile.pet_profiles.map((pet) => (
                <View key={pet.id} style={styles.petCard}>
                  {pet.photo_url ? (
                    <Image source={{ uri: pet.photo_url }} style={styles.petPhoto} />
                  ) : (
                    <View style={[styles.petPhoto, styles.petPhotoFallback]}>
                      <Avatar size={30} fallback="" />
                    </View>
                  )}
                  <ThemedText style={styles.petName}>{pet.name}</ThemedText>
                  <PetTag breed={pet.breed} age={pet.age} compact />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Posts */}
        <View style={styles.section}>
          <ThemedText variant="title" style={styles.sectionTitle}>Posts</ThemedText>
          {posts.length === 0 ? (
            <Card style={styles.emptyPosts}>
              <EmptyState iconName="mail-open-outline" iconColor={colors.text.secondary} title="No posts yet" />
            </Card>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg.app },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  heroAvatar: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  heroInfo: { flex: 1, gap: 5 },
  displayName: { color: '#fff' },
  username: { color: 'rgba(255,255,255,0.85)' },
  proBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proText: { fontSize: 11, color: '#fff', fontWeight: typography.weight.bold },
  proRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bio: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 18 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surface,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.soft,
  },
  statBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44, gap: 3 },
  statValue: { color: colors.text.primary },
  statLabel: { color: colors.text.secondary },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border.soft, marginVertical: 4 },
  actionRow: {
    flexDirection: 'row',
    padding: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.bg.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.soft,
  },
  followBtn: {
    flex: 1,
    minHeight: 44,
  },
  followingBtn: {
  },
  section: { padding: spacing.md },
  sectionTitle: { color: colors.text.primary, marginBottom: spacing.sm },
  petRow: { gap: spacing.sm },
  petCard: { alignItems: 'center', gap: 6, width: 90 },
  petPhoto: { width: 80, height: 80, borderRadius: 20 },
  petPhotoFallback: { backgroundColor: colors.bg.subtle, alignItems: 'center', justifyContent: 'center' },
  petName: { fontSize: 13, fontWeight: typography.weight.bold, color: colors.text.primary, textAlign: 'center' },
  emptyPosts: { padding: spacing.sm, borderRadius: radius.md },
});
