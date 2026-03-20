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
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import { PetTag } from '@/components/ui/PetTag';
import { PostCard } from '@/components/feed/PostCard';
import { useAuthStore , User } from '@/store/authStore';
import api from '@/services/api';

import { Post } from '@/store/feedStore';

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
        <ActivityIndicator color="#7C3AED" size="large" />
      </View>
    );
  }

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <LinearGradient colors={['#7C3AED', '#9D4EDD']} style={styles.hero}>
          <Avatar
            uri={profile.avatar_url}
            size={80}
            isProfessional={profile.is_professional}
            style={styles.heroAvatar}
          />
          <View style={styles.heroInfo}>
            <ThemedText style={styles.displayName}>{profile.display_name}</ThemedText>
            <ThemedText style={styles.username}>@{profile.username}</ThemedText>
            {profile.is_professional && (
              <View style={styles.proBadge}>
                <ThemedText style={styles.proText}>
                  ✓ {profile.professional_type ?? 'Professional'}
                </ThemedText>
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
            <ThemedText style={styles.statValue}>{posts.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Posts</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statBlock}
            onPress={() => router.push({ pathname: '/followers/[id]', params: { id: String(userId) } } as never)}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.statValue}>{profile.follower_count}</ThemedText>
            <ThemedText style={styles.statLabel}>Followers</ThemedText>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity
            style={styles.statBlock}
            onPress={() => router.push({ pathname: '/following/[id]', params: { id: String(userId) } } as never)}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.statValue}>{profile.following_count}</ThemedText>
            <ThemedText style={styles.statLabel}>Following</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Follow / Message buttons */}
        {!isSelf && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={handleFollow}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator color={isFollowing ? '#7C3AED' : '#fff'} size="small" />
              ) : (
                <ThemedText
                  style={[styles.followBtnText, isFollowing && styles.followingBtnText]}
                >
                  {isFollowing ? '✓ Following' : '+ Follow'}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Pets */}
        {profile.pet_profiles?.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>🐾 Pets</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petRow}>
              {profile.pet_profiles.map((pet) => (
                <View key={pet.id} style={styles.petCard}>
                  {pet.photo_url ? (
                    <Image source={{ uri: pet.photo_url }} style={styles.petPhoto} />
                  ) : (
                    <View style={[styles.petPhoto, styles.petPhotoFallback]}>
                      <ThemedText style={styles.petEmoji}>🐾</ThemedText>
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
          <ThemedText style={styles.sectionTitle}>📸 Posts</ThemedText>
          {posts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <ThemedText style={styles.emptyText}>No posts yet</ThemedText>
            </View>
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
  safeArea: { flex: 1, backgroundColor: '#F9F9FB' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    flexDirection: 'row',
    padding: 20,
    gap: 14,
    alignItems: 'flex-start',
  },
  heroAvatar: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  heroInfo: { flex: 1, gap: 5 },
  displayName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  username: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  proBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  bio: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 18 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F4F4F5',
  },
  statBlock: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#18181B' },
  statLabel: { fontSize: 11, color: '#71717A' },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: '#E4E4E7', marginVertical: 4 },
  actionRow: {
    flexDirection: 'row',
    padding: 14,
    gap: 10,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F4F4F5',
  },
  followBtn: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  followBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  followingBtnText: { color: '#7C3AED' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#18181B', marginBottom: 12 },
  petRow: { gap: 12 },
  petCard: { alignItems: 'center', gap: 6, width: 90 },
  petPhoto: { width: 80, height: 80, borderRadius: 20 },
  petPhotoFallback: { backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  petEmoji: { fontSize: 32 },
  petName: { fontSize: 13, fontWeight: '700', color: '#18181B', textAlign: 'center' },
  emptyPosts: { padding: 30, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#71717A' },
});
