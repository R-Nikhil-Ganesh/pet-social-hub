import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import { PetTag } from '@/components/ui/PetTag';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { PostCard } from '@/components/feed/PostCard';
import { useAuthStore } from '@/store/authStore';
import { usePointsStore } from '@/store/pointsStore';
import api from '@/services/api';
import { Post } from '@/store/feedStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { totalPoints, fetchPoints } = usePointsStore();
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadMyPosts = useCallback(async () => {
    try {
      const { data } = await api.get('/users/me/posts');
      setMyPosts(data.posts ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPoints();
    loadMyPosts();
  }, [fetchPoints, loadMyPosts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPoints(), loadMyPosts()]);
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
        }
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <ThemedText style={styles.topTitle}>My Profile</ThemedText>
          <View style={styles.topActions}>
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.iconBtn}>
              <ThemedText style={styles.iconBtnText}>⚙️</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
              <ThemedText style={styles.iconBtnText}>↩️</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Hero */}
        <LinearGradient colors={['#7C3AED', '#9D4EDD']} style={styles.hero}>
          <Avatar
            uri={user.avatar_url}
            size={84}
            isProfessional={user.is_professional}
            style={styles.heroAvatar}
          />
          <View style={styles.heroInfo}>
            <ThemedText style={styles.displayName}>{user.display_name}</ThemedText>
            <ThemedText style={styles.username}>@{user.username}</ThemedText>
            {user.is_professional && (
              <View style={styles.proBadge}>
                <ThemedText style={styles.proText}>
                  ✓ {user.professional_type ?? 'Professional'}
                </ThemedText>
              </View>
            )}
            {user.bio ? (
              <ThemedText style={styles.bio}>{user.bio}</ThemedText>
            ) : null}
          </View>
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <ThemedText style={styles.statValue}>{myPosts.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Posts</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <ThemedText style={styles.statValue}>{user.follower_count}</ThemedText>
            <ThemedText style={styles.statLabel}>Followers</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <ThemedText style={styles.statValue}>{user.following_count}</ThemedText>
            <ThemedText style={styles.statLabel}>Following</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statBlock} onPress={() => router.push('/rewards')}>
            <PointsBadge points={totalPoints} size="sm" />
            <ThemedText style={styles.statLabel}>Points</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Edit Profile */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push('/edit-profile')}
        >
          <ThemedText style={styles.editBtnText}>✏️ Edit Profile</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.managePetsBtn}
          onPress={() => router.push('/my-pets')}
        >
          <ThemedText style={styles.managePetsBtnText}>🐾 Manage Pets</ThemedText>
        </TouchableOpacity>

        {/* Pet Profiles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>🐾 My Pets</ThemedText>
            <TouchableOpacity onPress={() => router.push({ pathname: '/add-pet' } as never)}>
              <ThemedText style={styles.sectionAction}>+ Add pet</ThemedText>
            </TouchableOpacity>
          </View>
          {user.pet_profiles?.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petRow}>
              {user.pet_profiles.map((pet) => (
                <TouchableOpacity
                  key={pet.id}
                  style={styles.petCard}
                  onPress={() => router.push({ pathname: '/pet/[id]', params: { id: String(pet.id) } } as never)}
                >
                  {pet.photo_url ? (
                    <Image source={{ uri: pet.photo_url }} style={styles.petPhoto} />
                  ) : (
                    <View style={[styles.petPhoto, styles.petPhotoFallback]}>
                      <ThemedText style={styles.petPhotoEmoji}>🐾</ThemedText>
                    </View>
                  )}
                  <ThemedText style={styles.petName}>{pet.name}</ThemedText>
                  <PetTag breed={pet.breed} age={pet.age} compact />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <TouchableOpacity
              style={styles.emptyPetsCard}
              onPress={() => router.push({ pathname: '/add-pet' } as never)}
            >
              <ThemedText style={styles.emptyPetsTitle}>No pets added yet</ThemedText>
              <ThemedText style={styles.emptyPetsSub}>Tap to add your first pet profile</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Posts Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>📸 My Posts</ThemedText>
          {myPosts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <ThemedText style={styles.emptyPostsText}>
                {"You haven't posted yet. Share your pet's first moment!"}
              </ThemedText>
              <TouchableOpacity
                style={styles.createPostBtn}
                onPress={() => router.push('/create-post')}
              >
                <ThemedText style={styles.createPostBtnText}>Create Post</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            myPosts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9F9FB' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E7',
  },
  topTitle: { fontSize: 18, fontWeight: '800', color: '#18181B' },
  topActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { fontSize: 18 },
  hero: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
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
  statBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#18181B' },
  statLabel: { fontSize: 11, color: '#71717A', fontWeight: '500' },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: '#E4E4E7', marginVertical: 4 },
  editBtn: {
    margin: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  editBtnText: { color: '#7C3AED', fontSize: 15, fontWeight: '700' },
  managePetsBtn: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  managePetsBtnText: { color: '#6D28D9', fontSize: 14, fontWeight: '700' },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#18181B' },
  sectionAction: { fontSize: 14, color: '#7C3AED', fontWeight: '600' },
  petRow: { gap: 12, paddingBottom: 8 },
  petCard: {
    alignItems: 'center',
    gap: 6,
    width: 90,
  },
  petPhoto: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  petPhotoFallback: {
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petPhotoEmoji: { fontSize: 32 },
  petName: { fontSize: 13, fontWeight: '700', color: '#18181B', textAlign: 'center' },
  emptyPetsCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  emptyPetsTitle: { fontSize: 14, fontWeight: '700', color: '#18181B' },
  emptyPetsSub: { fontSize: 12, color: '#71717A' },
  emptyPosts: {
    alignItems: 'center',
    padding: 30,
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyPostsText: {
    fontSize: 14,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 20,
  },
  createPostBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  createPostBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
