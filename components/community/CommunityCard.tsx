import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Community } from '@/store/communityStore';
import { colors, radius, spacing, typography } from '@/theme/tokens';

interface CommunityCardProps {
  community: Community;
  onJoin?: () => void;
}

export function CommunityCard({ community, onJoin }: CommunityCardProps) {
  const router = useRouter();
  const [imageFailed, setImageFailed] = useState(false);
  const name = String(community?.name ?? 'Community');
  const description = String(community?.description ?? '');

  const fallbackLabel = useMemo(() => {
    const words = name.split(/\s+/).filter(Boolean).slice(0, 2);
    return words.map((word) => word[0]?.toUpperCase() ?? '').join('') || 'P';
  }, [name]);
  const canShowImage = Boolean(community.icon_url) && !imageFailed;
  const memberCount = Number(community.member_count ?? 0);
  const memberPreview = Array.isArray(community.members_preview)
    ? community.members_preview.slice(0, 3)
    : [];
  const unreadCount = Number(community.unread_count ?? 0);
  const communityId = Number(community?.id);

  return (
    <TouchableOpacity
      onPress={() => {
        if (Number.isFinite(communityId) && communityId > 0) {
          router.push(`/community/${communityId}`);
        }
      }}
      activeOpacity={0.92}
      accessibilityRole="button"
    >
      <Card style={styles.card}>
        <View style={styles.iconWrapper}>
          {canShowImage ? (
            <Image
              source={{ uri: community.icon_url }}
              style={styles.iconImage}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <ThemedText style={styles.iconFallback}>{fallbackLabel}</ThemedText>
          )}
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <ThemedText variant="label" style={styles.name}>{name}</ThemedText>
            {community.is_default && (
              <View style={styles.defaultBadge}>
                <ThemedText style={styles.defaultText}>Auto</ThemedText>
              </View>
            )}
          </View>
          <ThemedText style={styles.description} numberOfLines={2}>
            {description}
          </ThemedText>
          <View style={styles.stats}>
            {memberPreview.length > 0 ? (
              <View style={styles.memberPile}>
                {memberPreview.map((member, index) => (
                  <View
                    key={`community-member-${communityId}-${member.id}`}
                    style={[
                      styles.memberAvatarWrap,
                      {
                        marginLeft: index === 0 ? 0 : -8,
                        zIndex: memberPreview.length - index,
                      },
                    ]}
                  >
                    <Avatar uri={member.avatar_url} seed={member.id} size={24} />
                  </View>
                ))}
              </View>
            ) : null}
            <ThemedText style={styles.stat}>{memberCount.toLocaleString()} members</ThemedText>
            {unreadCount > 0 ? (
              <View style={styles.unreadBadge}>
                <ThemedText style={styles.unreadText}>{unreadCount}</ThemedText>
              </View>
            ) : null}
          </View>
        </View>

        {!community.is_member ? (
          <Button
            style={styles.joinBtn}
            label="Join"
            onPress={onJoin}
            accessibilityLabel={`Join ${name}`}
          />
        ) : (
          <View style={styles.joinedBadge}>
            <ThemedText style={styles.joinedText}>Joined</ThemedText>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    borderRadius: radius.lg,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  iconFallback: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.extrabold,
    color: colors.brand.primaryDark,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    color: colors.text.primary,
  },
  defaultBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  defaultText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: typography.weight.semibold,
  },
  description: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    lineHeight: 17,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  memberPile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 2,
  },
  memberAvatarWrap: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  stat: {
    fontSize: 11,
    color: colors.text.muted,
  },
  unreadBadge: {
    backgroundColor: colors.brand.primary,
    borderRadius: radius.pill,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    fontSize: 10,
    color: colors.text.inverse,
    fontWeight: typography.weight.bold,
  },
  joinBtn: {
    minWidth: 74,
    minHeight: 44,
  },
  joinedBadge: {
    minWidth: 74,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  joinedText: {
    color: '#16A34A',
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
  },
});
