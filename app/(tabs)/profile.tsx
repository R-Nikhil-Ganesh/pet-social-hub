import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PetTag } from '@/components/ui/PetTag';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { PostCard } from '@/components/feed/PostCard';
import { useAuthStore } from '@/store/authStore';
import { usePointsStore } from '@/store/pointsStore';
import api from '@/services/api';
import { Post } from '@/store/feedStore';
import { colors, radius, spacing, typography } from '@/theme/tokens';

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
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace('/(auth)/login');
          } catch {
            Alert.alert('Error', 'Could not sign out. Please try again.');
          }
        },
      },
    ]);
  };

  if (!user) return null;

  const isProfessional = Boolean(user.is_professional);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} />
        }
      >
        {/* Top bar */}
        <AnimatedEntrance delay={20}>
          <View style={styles.topBar}>
            <ThemedText variant="title" style={styles.topTitle}>My Profile</ThemedText>
            <View style={styles.topActions}>
              <TouchableOpacity onPress={() => router.push('/settings')} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Open settings">
                <Ionicons name="settings-outline" size={20} color={colors.text.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Sign out">
                <Ionicons name="log-out-outline" size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </AnimatedEntrance>

        {/* Profile Hero */}
        <AnimatedEntrance delay={80}>
          <LinearGradient colors={['#F97316', '#FB7185']} style={styles.hero}>
            <Avatar
              uri={user.avatar_url}
              size={84}
              isProfessional={isProfessional}
              style={styles.heroAvatar}
            />
            <View style={styles.heroInfo}>
              <ThemedText style={styles.displayName}>{user.display_name}</ThemedText>
              <ThemedText style={styles.username}>@{user.username}</ThemedText>
              {isProfessional && (
                <View style={styles.proBadge}>
                  <View style={styles.proRow}>
                    <Ionicons name="checkmark" size={12} color={colors.text.inverse} />
                    <ThemedText style={styles.proText}>{user.professional_type ?? 'Professional'}</ThemedText>
                  </View>
                </View>
              )}
              {user.bio ? (
                <ThemedText style={styles.bio}>{user.bio}</ThemedText>
              ) : null}
            </View>
          </LinearGradient>
        </AnimatedEntrance>

        {/* Stats Row */}
        <AnimatedEntrance delay={130}>
          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <ThemedText variant="title" style={styles.statValue}>{myPosts.length}</ThemedText>
              <ThemedText variant="caption" style={styles.statLabel}>Posts</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statBlock}
              onPress={() =>
                router.push({ pathname: '/followers/[id]', params: { id: String(user.id) } } as never)
              }
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Open followers list"
            >
              <ThemedText variant="title" style={styles.statValue}>{user.follower_count}</ThemedText>
              <ThemedText variant="caption" style={styles.statLabel}>Followers</ThemedText>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statBlock}
              onPress={() =>
                router.push({ pathname: '/following/[id]', params: { id: String(user.id) } } as never)
              }
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Open following list"
            >
              <ThemedText variant="title" style={styles.statValue}>{user.following_count}</ThemedText>
              <ThemedText variant="caption" style={styles.statLabel}>Following</ThemedText>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statBlock} onPress={() => router.push('/rewards')} accessibilityRole="button" accessibilityLabel="Open rewards">
              <PointsBadge points={totalPoints} size="sm" />
              <ThemedText variant="caption" style={styles.statLabel}>Points</ThemedText>
            </TouchableOpacity>
          </View>
        </AnimatedEntrance>

        {/* Edit Profile */}
        <AnimatedEntrance delay={170}>
          <Button
            style={styles.editBtn}
            variant="secondary"
            label="Edit Profile"
            onPress={() => router.push('/edit-profile')}
            accessibilityLabel="Edit profile"
          />
        </AnimatedEntrance>

        <AnimatedEntrance delay={210}>
          <Button
            style={styles.managePetsBtn}
            variant="secondary"
            label="Manage Pets"
            onPress={() => router.push('/my-pets')}
            accessibilityLabel="Manage pets"
          />
        </AnimatedEntrance>

        {/* Pet Profiles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="title" style={styles.sectionTitle}>My Pets</ThemedText>
            <TouchableOpacity onPress={() => router.push({ pathname: '/add-pet' } as never)} style={styles.sectionActionBtn} accessibilityRole="button" accessibilityLabel="Add a pet">
              <ThemedText variant="label" style={styles.sectionAction}>+ Add pet</ThemedText>
            </TouchableOpacity>
          </View>
          {user.pet_profiles?.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petRow}>
              {user.pet_profiles.map((pet) => (
                <TouchableOpacity
                  key={pet.id}
                  style={styles.petCard}
                  onPress={() => router.push({ pathname: '/pet/[id]', params: { id: String(pet.id) } } as never)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${pet.name} profile`}
                >
                  {pet.photo_url ? (
                    <Image source={{ uri: pet.photo_url }} style={styles.petPhoto} />
                  ) : (
                    <View style={[styles.petPhoto, styles.petPhotoFallback]}>
                      <Ionicons name="paw" size={24} color={colors.brand.primary} />
                    </View>
                  )}
                  <ThemedText style={styles.petName}>{pet.name}</ThemedText>
                  <PetTag breed={pet.breed} age={pet.age} compact />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push({ pathname: '/add-pet' } as never)}
              accessibilityRole="button"
              accessibilityLabel="Add your first pet"
            >
              <Card style={styles.emptyPetsCard}>
                <EmptyState
                  iconName="paw-outline"
                  iconColor={colors.text.secondary}
                  title="No pets added yet"
                  subtitle="Tap to add your first pet profile"
                />
              </Card>
            </TouchableOpacity>
          )}
        </View>

        {/* Posts Section */}
        <View style={styles.section}>
          <ThemedText variant="title" style={styles.sectionTitle}>My Posts</ThemedText>
          {myPosts.length === 0 ? (
            <Card style={styles.emptyPosts}>
              <EmptyState
                iconName="images-outline"
                iconColor={colors.text.secondary}
                title="No posts yet"
                subtitle="Share your pet first moment with the community!"
              />
              <Button
                style={styles.createPostBtn}
                label="Create Post"
                onPress={() => router.push('/create-post')}
                accessibilityLabel="Create your first post"
              />
            </Card>
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
  safeArea: { flex: 1, backgroundColor: colors.bg.app },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.soft,
  },
  topTitle: { color: colors.text.primary },
  topActions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.bg.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { fontSize: 18 },
  hero: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  heroAvatar: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  heroInfo: { flex: 1, gap: 5 },
  displayName: { fontSize: typography.size.xl, fontWeight: typography.weight.extrabold, color: colors.text.inverse },
  username: { fontSize: typography.size.sm, color: 'rgba(255,255,255,0.8)' },
  proBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  proText: { fontSize: 11, color: colors.text.inverse, fontWeight: typography.weight.bold },
  proRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bio: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surface,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.soft,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    gap: 3,
  },
  statValue: { color: colors.text.primary },
  statLabel: { color: colors.text.secondary, fontSize: typography.size.xs },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border.soft, marginVertical: 4 },
  editBtn: {
    margin: spacing.md,
    borderColor: colors.brand.primary,
  },
  managePetsBtn: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderColor: colors.border.strong,
  },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.xs },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { color: colors.text.primary },
  sectionActionBtn: { minHeight: 44, justifyContent: 'center' },
  sectionAction: { color: colors.brand.primary },
  petRow: { gap: spacing.sm, paddingBottom: spacing.xs },
  petCard: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 90,
  },
  petPhoto: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  petPhotoFallback: {
    backgroundColor: colors.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petPhotoEmoji: { fontSize: 32 },
  petName: { fontSize: 13, fontWeight: typography.weight.bold, color: colors.text.primary, textAlign: 'center' },
  emptyPetsCard: {
    borderWidth: 1,
    borderColor: colors.border.soft,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  emptyPosts: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderRadius: radius.lg,
  },
  createPostBtn: { marginTop: spacing.xs },
});
