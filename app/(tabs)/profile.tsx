import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { AnimatedEntrance } from '@/components/ui/AnimatedEntrance';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PetTag } from '@/components/ui/PetTag';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { MenuPopover, MenuOption } from '@/components/ui/MenuPopover';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { useAuthStore } from '@/store/authStore';
import { usePointsStore } from '@/store/pointsStore';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { totalPoints, fetchPoints } = usePointsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPoints();
    setRefreshing(false);
  };

  const handleLogout = () => {
    setLogoutDialogVisible(true);
  };

  const handleLogoutConfirm = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      setLogoutDialogVisible(false);
      router.replace('/(auth)/login');
    } catch {
      setLogoutLoading(false);
      setLogoutDialogVisible(false);
    }
  };

  const menuOptions: MenuOption[] = [
    { label: 'My Posts', onPress: () => router.push('/my-posts' as never) },
    { label: 'Edit Profile', onPress: () => router.push('/edit-profile') },
    { label: 'Settings', onPress: () => router.push('/settings') },
    { label: 'Sign Out', destructive: true, onPress: handleLogout },
  ];

  const openProfileMenu = () => {
    setMenuVisible(true);
  };

  if (!user) return null;

  const isProfessional = Boolean(user.is_professional);

  return (
    <GradientBackground>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
      <MenuPopover
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        options={menuOptions}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} />
        }
      >
        {/* Top bar */}
        <AnimatedEntrance delay={20}>
          <View style={styles.topBar}>
            <ThemedText variant="title" style={styles.topTitle}>Me</ThemedText>
            <View style={styles.topActions}>
              <TouchableOpacity
                onPress={openProfileMenu}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="Open profile menu"
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </AnimatedEntrance>

        {/* Top Card */}
        <AnimatedEntrance delay={80}>
          <View style={styles.heroShell}>
            <View style={styles.heroGlass}>
            <View style={styles.heroTint} />
            <View style={styles.heroTopRow}>
                <View style={styles.avatarGlowWrap}>
                  <Avatar
                    uri={user.avatar_url}
                    seed={user.id}
                    size={84}
                    isProfessional={isProfessional}
                    style={styles.heroAvatar}
                  />
                </View>
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
              </View>
            </View>

            {user.bio ? (
              <ThemedText style={styles.bio}>{user.bio}</ThemedText>
            ) : null}

            <View style={styles.heroStatsRow}>
              <TouchableOpacity
                style={styles.heroStatPill}
                onPress={() =>
                  router.push({ pathname: '/followers/[id]', params: { id: String(user.id) } } as never)
                }
                accessibilityRole="button"
                accessibilityLabel="Open followers list"
              >
                <ThemedText style={styles.heroStatValue}>{user.follower_count}</ThemedText>
                <ThemedText style={styles.heroStatLabel}>Followers</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heroStatPill}
                onPress={() =>
                  router.push({ pathname: '/following/[id]', params: { id: String(user.id) } } as never)
                }
                accessibilityRole="button"
                accessibilityLabel="Open following list"
              >
                <ThemedText style={styles.heroStatValue}>{user.following_count}</ThemedText>
                <ThemedText style={styles.heroStatLabel}>Following</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heroStatPill}
                onPress={() => router.push('/rewards')}
                accessibilityRole="button"
                accessibilityLabel="Open rewards"
              >
                <PointsBadge points={totalPoints} size="sm" />
                <ThemedText style={styles.heroStatLabel}>Points</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.heroActionsRow}>
              <Button
                style={styles.editBtn}
                variant="secondary"
                label="Edit Profile"
                onPress={() => router.push('/edit-profile')}
                accessibilityLabel="Edit profile"
              />
              <Button
                style={styles.managePetsBtn}
                variant="secondary"
                label="Manage Pets"
                onPress={() => router.push('/my-pets')}
                accessibilityLabel="Manage pets"
              />
            </View>
            </View>
          </View>
        </AnimatedEntrance>

        {/* Pet Profiles */}
        <AnimatedEntrance delay={140}>
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
                  <LinearGradient
                    colors={['#FFF4EA', '#FFECDD']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.petCardInner}
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
                  </LinearGradient>
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
              <View style={styles.emptyPetsCard}>
                <EmptyState
                  iconName="paw-outline"
                  iconColor={colors.text.secondary}
                  title="No pets added yet"
                  subtitle="Tap to add your first pet profile"
                />
                </View>
            </TouchableOpacity>
          )}
        </View>
        </AnimatedEntrance>

        <View style={{ height: 20 }} />
      </ScrollView>
      </SafeAreaView>

      <ConfirmationDialog
        visible={logoutDialogVisible}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        destructive
        loading={logoutLoading}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutDialogVisible(false)}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
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
  heroShell: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.soft,
  },
  heroGlass: {
    padding: spacing.lg,
    backgroundColor: 'rgba(249,115,22,0.85)',
  },
  heroTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(249,115,22,0.5)',
  },
  hero: {
    gap: spacing.md,
  },
  heroTopRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  avatarGlowWrap: {
    borderRadius: 50,
    padding: 4,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
  },
  heroAvatar: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
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
  heroStatsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  heroStatPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    gap: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  heroStatValue: { color: colors.text.inverse, fontSize: typography.size.md, fontWeight: typography.weight.bold },
  heroStatLabel: { color: 'rgba(255,255,255,0.92)', fontSize: typography.size.xs },
  heroActionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  editBtn: {
    flex: 1,
    borderColor: colors.brand.primary,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  managePetsBtn: {
    flex: 1,
    borderColor: colors.border.strong,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { color: colors.text.primary },
  sectionActionBtn: { minHeight: 44, justifyContent: 'center' },
  sectionAction: { color: colors.brand.primary },
  petRow: { gap: spacing.sm, paddingBottom: spacing.xs, paddingRight: spacing.md },
  petCard: {
    width: 128,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#F1B3C9',
    overflow: 'hidden',
    shadowColor: '#B57E5E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  petCardInner: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    minHeight: 164,
  },
  petPhoto: {
    width: 84,
    height: 84,
    borderRadius: 22,
  },
  petPhotoFallback: {
    backgroundColor: colors.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petPhotoEmoji: { fontSize: 32 },
  petName: {
    fontSize: 13,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    maxWidth: 104,
  },
  emptyPetsCard: {
    backgroundColor: colors.bg.surface,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.soft,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
});
