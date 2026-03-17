import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  DimensionValue,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import api from '@/services/api';

interface Story {
  id: number;
  user_id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  media_url: string;
  media_type: 'image' | 'video';
  expires_at: string;
  pet_name?: string;
  created_at?: string;
}

export default function StoryViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [storyList, setStoryList] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [mediaFailed, setMediaFailed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const DURATION = 5000;

  const loadStorySequence = useCallback(async () => {
    try {
      const storyId = Number(id);
      const { data } = await api.get('/stories');
      const allStories: Story[] = data?.stories ?? [];
      const currentStory = allStories.find((s) => s.id === storyId);

      if (!currentStory) {
        router.back();
        return;
      }

      const userStories = allStories
        .filter((s) => s.user_id === currentStory.user_id)
        .sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          if (aTime !== bTime) return aTime - bTime;
          return a.id - b.id;
        });

      setStoryList(userStories);
      setCurrentIndex(0);
      setProgress(0);
      setMediaFailed(false);
    } catch {
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadStorySequence();
    return () => clearTick();
  }, [loadStorySequence]);

  useEffect(() => {
    const currentStory = storyList[currentIndex];
    if (!currentStory) return;

    setProgress(0);
    setMediaFailed(false);
    api.post(`/stories/${currentStory.id}/view`).catch(() => {});
    startTick();
  }, [currentIndex, storyList]);

  const goNext = () => {
    if (currentIndex >= storyList.length - 1) {
      router.back();
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  const goPrev = () => {
    if (currentIndex <= 0) {
      router.back();
      return;
    }

    setCurrentIndex((prev) => prev - 1);
  };

  const startTick = () => {
    clearTick();
    const step = 100 / (DURATION / 100);
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearTick();
          goNext();
          return 100;
        }
        return p + step;
      });
    }, 100);
  };

  const clearTick = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  const story = storyList[currentIndex];
  if (!story) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
      {/* Media */}
      {!mediaFailed ? (
        <ExpoImage
          source={{ uri: story.media_url }}
          style={styles.media}
          contentFit="cover"
          transition={120}
          onError={() => setMediaFailed(true)}
        />
      ) : (
        <View style={styles.mediaFallback}>
          <ThemedText style={styles.mediaFallbackTitle}>Could not load story media</ThemedText>
          <ThemedText style={styles.mediaFallbackUrl}>{story.media_url}</ThemedText>
        </View>
      )}

      {/* Top overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={styles.topOverlay}
        pointerEvents="none"
      />

      {/* Progress bar */}
      <View style={styles.progressRow}>
        {storyList.map((item, idx) => {
          let width: DimensionValue = '0%';
          if (idx < currentIndex) width = '100%';
          if (idx === currentIndex) width = `${Math.min(progress, 100)}%`;

          return (
            <View key={item.id} style={styles.progressBar}>
              <View style={[styles.progressFill, { width }]} />
            </View>
          );
        })}
      </View>

      {/* Author row */}
      <View style={styles.authorRow}>
        <Avatar uri={story.avatar_url} size={36} isProfessional={false} />
        <View>
          <ThemedText style={styles.displayName}>{story.display_name}</ThemedText>
          <ThemedText style={styles.username}>@{story.username}</ThemedText>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => router.back()} hitSlop={16}>
          <ThemedText style={styles.closeBtn}>✕</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Pet name if present */}
      {story.pet_name && (
        <View style={styles.petPill}>
          <ThemedText style={styles.petPillText}>🐾 {story.pet_name}</ThemedText>
        </View>
      )}

      {/* Tap zones: left to previous, right to next */}
      <TouchableOpacity style={styles.tapLeft} onPress={goPrev} />
      <TouchableOpacity style={styles.tapRight} onPress={goNext} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  media: { ...StyleSheet.absoluteFillObject },
  mediaFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  mediaFallbackTitle: { color: '#fff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  mediaFallbackUrl: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center' },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  progressRow: {
    position: 'absolute',
    top: 44,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 4,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  authorRow: {
    position: 'absolute',
    top: 54,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  displayName: { fontSize: 14, color: '#fff', fontWeight: '700' },
  username: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  closeBtn: { fontSize: 22, color: '#fff', fontWeight: '700' },
  petPill: {
    position: 'absolute',
    top: 108,
    left: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  petPillText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  tapLeft: { position: 'absolute', top: 0, left: 0, bottom: 0, width: '35%' },
  tapRight: { position: 'absolute', top: 0, right: 0, bottom: 0, width: '35%' },
});
