import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { Story } from '@/store/feedStore';

interface StoryCircleProps {
  story: Story;
  onPress: () => void;
  isOwn?: boolean;
}

export function StoryCircle({ story, onPress, isOwn }: StoryCircleProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.85}>
      <LinearGradient
        colors={story.viewed ? ['#D4D4D8', '#D4D4D8'] : ['#7C3AED', '#EC4899', '#F59E0B']}
        style={styles.ring}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.imageWrapper}>
          {story.avatar_url ? (
            <Image source={{ uri: story.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.fallback]}>
              <ThemedText style={styles.fallbackText}>🐾</ThemedText>
            </View>
          )}
          {isOwn && (
            <View style={styles.addBadge}>
              <ThemedText style={styles.addText}>+</ThemedText>
            </View>
          )}
        </View>
      </LinearGradient>
      <ThemedText numberOfLines={1} style={styles.name}>
        {isOwn ? 'Your Story' : story.pet.name}
      </ThemedText>
      <ThemedText numberOfLines={1} style={styles.breed}>
        {story.pet.breed}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 72,
    gap: 4,
  },
  ring: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  fallback: {
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 24,
  },
  addBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  addText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  name: {
    fontSize: 11,
    fontWeight: '600',
    color: '#18181B',
    maxWidth: 68,
    textAlign: 'center',
  },
  breed: {
    fontSize: 10,
    color: '#71717A',
    maxWidth: 68,
    textAlign: 'center',
  },
});
