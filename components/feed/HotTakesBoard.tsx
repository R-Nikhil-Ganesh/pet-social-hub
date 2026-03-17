import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import { PetTag } from '@/components/ui/PetTag';
import { HotTake, useFeedStore } from '@/store/feedStore';

const FLAIRS: Record<string, { label: string; color: string; bg: string }> = {
  hot_take: { label: '🌶️ Hot Take', color: '#DC2626', bg: '#FEF2F2' },
  unpopular: { label: '🙈 Unpopular Opinion', color: '#D97706', bg: '#FFFBEB' },
  meme: { label: '😂 Meme', color: '#7C3AED', bg: '#F5F3FF' },
  debate: { label: '⚡ Debate', color: '#2563EB', bg: '#EFF6FF' },
  confession: { label: '🤫 Confession', color: '#DB2777', bg: '#FDF2F8' },
};

interface HotTakeCardProps {
  hotTake: HotTake;
}

function HotTakeCard({ hotTake }: HotTakeCardProps) {
  const upvoteHotTake = useFeedStore((s) => s.upvoteHotTake);
  const flair = FLAIRS[hotTake.flair] ?? FLAIRS.hot_take;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar uri={hotTake.avatar_url} size={32} />
        <View style={styles.cardMeta}>
          <ThemedText style={styles.cardUser}>{hotTake.display_name}</ThemedText>
          {hotTake.pet ? (
            <PetTag breed={hotTake.pet.breed} age={hotTake.pet.age} compact />
          ) : (
            <ThemedText style={styles.cardUsername}>@{hotTake.username}</ThemedText>
          )}
        </View>
        <View style={[styles.flair, { backgroundColor: flair.bg }]}>
          <ThemedText style={[styles.flairText, { color: flair.color }]}>
            {flair.label}
          </ThemedText>
        </View>
      </View>

      <ThemedText style={styles.content}>{hotTake.content}</ThemedText>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.upvoteBtn, hotTake.user_upvoted && styles.upvotedBtn]}
          onPress={() => upvoteHotTake(hotTake.id)}
        >
          <ThemedText style={styles.upvoteArrow}>▲</ThemedText>
          <ThemedText
            style={[styles.upvoteCount, hotTake.user_upvoted && styles.upvotedText]}
          >
            {hotTake.upvotes}
          </ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.comments}>💬 {hotTake.comment_count}</ThemedText>
      </View>
    </View>
  );
}

interface HotTakesBoardProps {
  hotTakes: HotTake[];
}

export function HotTakesBoard({ hotTakes }: HotTakesBoardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>🔥 Hot Takes Board</ThemedText>
        <ThemedText style={styles.sectionSubtitle}>Trending in your community</ThemedText>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {hotTakes.map((ht) => (
          <HotTakeCard key={ht.id} hotTake={ht} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181B',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#71717A',
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    width: 260,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardMeta: {
    flex: 1,
    gap: 3,
  },
  cardUser: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181B',
  },
  cardUsername: {
    fontSize: 11,
    color: '#71717A',
  },
  flair: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  flairText: {
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    fontSize: 14,
    color: '#27272A',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#F4F4F5',
  },
  upvotedBtn: {
    backgroundColor: '#EDE9FE',
  },
  upvoteArrow: {
    fontSize: 12,
    color: '#52525B',
  },
  upvoteCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52525B',
  },
  upvotedText: {
    color: '#7C3AED',
  },
  comments: {
    fontSize: 13,
    color: '#71717A',
  },
});
