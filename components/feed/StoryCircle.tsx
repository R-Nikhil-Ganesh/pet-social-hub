import React, { useEffect } from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';
import { Story } from '@/store/feedStore';

interface StoryCircleProps {
  story: Story;
  onPress: () => void;
  isOwn?: boolean;
  showAddBadge?: boolean;
}

type StoryOutlineKind = 'default' | 'dog' | 'cat';

function getStoryOutlineKind(story: Story, shouldDecorate: boolean): StoryOutlineKind {
  if (!shouldDecorate) return 'default';

  const species = String(story.pet?.species || '').trim().toLowerCase();
  if (species === 'dog') return 'dog';
  if (species === 'cat') return 'cat';
  return 'default';
}

export function StoryCircle({ story, onPress, isOwn, showAddBadge }: StoryCircleProps) {
  const isRealPostedStory = Number(story.id) > 0 && Boolean(story.media_url);
  const outlineKind = getStoryOutlineKind(story, isRealPostedStory && !showAddBadge);
  const earColor = story.viewed ? '#D4D4D8' : '#7C3AED';
  const entranceScale = useSharedValue(0);

  useEffect(() => {
    entranceScale.value = withDelay(
      30,
      withSpring(1, {
        damping: 9,
        stiffness: 140,
        mass: 0.8,
      })
    );
  }, [entranceScale]);

  const entranceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: entranceScale.value }],
    opacity: entranceScale.value,
  }));

  return (
    <Animated.View style={[styles.container, entranceStyle]}>
    <TouchableOpacity style={styles.touchable} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.ringShell}>
        {outlineKind === 'cat' ? (
          <>
            <View style={[styles.catEarLeft, { borderBottomColor: earColor }]} />
            <View style={[styles.catEarRight, { borderBottomColor: earColor }]} />
          </>
        ) : null}
        {outlineKind === 'dog' ? (
          <>
            <View style={[styles.dogEarLeft, { backgroundColor: earColor }]} />
            <View style={[styles.dogEarRight, { backgroundColor: earColor }]} />
          </>
        ) : null}

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
                <Ionicons name="paw" size={22} color="#7C3AED" />
              </View>
            )}
            {showAddBadge && (
              <View style={styles.addBadge}>
                <ThemedText style={styles.addText}>+</ThemedText>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
      <ThemedText numberOfLines={1} style={styles.name}>
        {isOwn ? 'Your Story' : story.display_name}
      </ThemedText>
    </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 78,
    gap: 4,
    paddingTop: 2,
    overflow: 'visible',
  },
  touchable: {
    alignItems: 'center',
    gap: 4,
  },
  ringShell: {
    width: 78,
    height: 74,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
    overflow: 'visible',
  },
  ring: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dogEarLeft: {
    position: 'absolute',
    left: 2,
    top: 12,
    width: 18,
    height: 24,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 14,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 12,
    zIndex: 1,
  },
  dogEarRight: {
    position: 'absolute',
    right: 2,
    top: 12,
    width: 18,
    height: 24,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 14,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 12,
    zIndex: 1,
  },
  catEarLeft: {
    position: 'absolute',
    left: 18,
    top: 2,
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 2,
    borderBottomWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 1,
  },
  catEarRight: {
    position: 'absolute',
    right: 18,
    top: 2,
    width: 0,
    height: 0,
    borderLeftWidth: 2,
    borderRightWidth: 11,
    borderBottomWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 1,
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
});
