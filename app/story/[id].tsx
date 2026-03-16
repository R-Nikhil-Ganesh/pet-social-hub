import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import api from '@/services/api';

const { width, height } = Dimensions.get('window');

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
}

export default function StoryViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const DURATION = 5000;

  useEffect(() => {
    loadStory();
    return () => clearTick();
  }, [id]);

  const loadStory = async () => {
    try {
      const { data } = await api.get(`/stories/${id}`);
      setStory(data.story);
      api.post(`/stories/${id}/view`).catch(() => {});
      startTick();
    } catch {
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const startTick = () => {
    clearTick();
    const step = 100 / (DURATION / 100);
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearTick();
          router.back();
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

  if (!story) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />
      {/* Media */}
      <Image source={{ uri: story.media_url }} style={styles.media} resizeMode="cover" />

      {/* Top overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={styles.topOverlay}
        pointerEvents="none"
      />

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
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

      {/* Tap zones: left to close, right to close */}
      <TouchableOpacity style={styles.tapLeft} onPress={() => router.back()} />
      <TouchableOpacity style={styles.tapRight} onPress={() => router.back()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  media: { position: 'absolute', top: 0, left: 0, width, height },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  progressBar: {
    position: 'absolute',
    top: 44,
    left: 12,
    right: 12,
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
  tapLeft: { position: 'absolute', top: 0, left: 0, width: width * 0.35, height },
  tapRight: { position: 'absolute', top: 0, right: 0, width: width * 0.35, height },
});
