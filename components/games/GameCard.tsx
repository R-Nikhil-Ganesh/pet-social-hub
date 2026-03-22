import React, { useRef } from 'react';
import { Animated, View, StyleSheet, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { GameMode } from '@/store/gameStore';
import { radius, spacing, typography } from '@/theme/tokens';

interface GameCardProps {
  mode: GameMode;
  onPress: () => void;
  disabled?: boolean;
  size?: 'wide' | 'square';
  imageSource?: ImageSourcePropType;
}

const GAME_META: Record<
  GameMode,
  { title: string; description: string; icon: keyof typeof Ionicons.glyphMap; gradient: [string, string] }
> = {
  trivia: {
    title: 'Trivia Battle',
    description: '1v1 pet quiz showdown',
    icon: 'help-circle-outline',
    gradient: ['#7C3AED', '#5B21B6'],
  },
  photo_contest: {
    title: 'Photo Contest',
    description: 'Vote for the cutest pet',
    icon: 'camera-outline',
    gradient: ['#EC4899', '#9D174D'],
  },
  training: {
    title: 'Training Challenges',
    description: 'Daily streaks & rewards',
    icon: 'trophy-outline',
    gradient: ['#F59E0B', '#B45309'],
  },
  breed_guess: {
    title: 'Breed Guesser',
    description: 'Guess the breed, win points',
    icon: 'search-outline',
    gradient: ['#10B981', '#065F46'],
  },
};

export function GameCard({ mode, onPress, disabled, size = 'square', imageSource }: GameCardProps) {
  const meta = GAME_META[mode];
  const cardScale = useRef(new Animated.Value(1)).current;

  const onCardPressIn = () => {
    Animated.spring(cardScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 36,
      bounciness: 0,
    }).start();
  };

  const onCardPressOut = () => {
    Animated.spring(cardScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 0,
    }).start();
  };

  return (
    <Animated.View style={[styles.card, size === 'wide' ? styles.cardWide : styles.cardSquare, disabled && styles.disabled, { transform: [{ scale: cardScale }] }]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.88}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={meta.title}
        onPressIn={onCardPressIn}
        onPressOut={onCardPressOut}
      >
        <LinearGradient
          colors={meta.gradient}
          style={[styles.gradient, size === 'wide' ? styles.gradientWide : styles.gradientSquare]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glossOverlay}
          />
          {imageSource ? (
            <View style={styles.imageWrap}>
              <Image source={imageSource} style={styles.image} resizeMode="cover" />
            </View>
          ) : (
            <Ionicons name={meta.icon} size={34} color="#fff" style={styles.icon} />
          )}
          <View style={styles.textGroup}>
            <ThemedText style={styles.title}>{meta.title}</ThemedText>
            <ThemedText style={styles.description}>{meta.description}</ThemedText>
          </View>
          <ThemedText style={styles.arrow}>›</ThemedText>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  cardWide: {
    width: '100%',
  },
  cardSquare: {
    width: '48.5%',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  gradientWide: {
    minHeight: 128,
  },
  gradientSquare: {
    minHeight: 118,
    padding: spacing.md,
  },
  glossOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  icon: {
    width: 38,
    textAlign: 'center',
  },
  imageWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textGroup: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.extrabold,
    color: '#fff',
  },
  description: {
    fontSize: typography.size.sm,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  arrow: {
    fontSize: 28,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '300',
  },
  disabled: {
    opacity: 0.6,
  },
});
