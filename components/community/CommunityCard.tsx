import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Community } from '@/store/communityStore';

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
  const unreadCount = Number(community.unread_count ?? 0);
  const communityId = Number(community?.id);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        if (Number.isFinite(communityId) && communityId > 0) {
          router.push(`/community/${communityId}`);
        }
      }}
      activeOpacity={0.85}
    >
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
          <ThemedText style={styles.name}>{name}</ThemedText>
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
          <ThemedText style={styles.stat}>Members: {memberCount.toLocaleString()}</ThemedText>
          {unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <ThemedText style={styles.unreadText}>{unreadCount}</ThemedText>
            </View>
          ) : null}
        </View>
      </View>

      {!community.is_member ? (
        <TouchableOpacity style={styles.joinBtn} onPress={onJoin}>
          <ThemedText style={styles.joinText}>Join</ThemedText>
        </TouchableOpacity>
      ) : (
        <View style={styles.joinedBadge}>
          <ThemedText style={styles.joinedText}>Joined</ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  iconFallback: {
    fontSize: 16,
    fontWeight: '800',
    color: '#5B21B6',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181B',
  },
  defaultBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  defaultText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    color: '#71717A',
    lineHeight: 16,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  stat: {
    fontSize: 11,
    color: '#A1A1AA',
  },
  unreadBadge: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  joinBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  joinText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  joinedBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  joinedText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
  },
});
