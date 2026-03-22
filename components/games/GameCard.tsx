import React, { useRef, useState } from 'react';
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
  { title: string; icon: keyof typeof Ionicons.glyphMap; gradient: [string, string] }
> = {
  trivia: {
    title: 'Trivia Battle',
    icon: 'help-circle-outline',
    gradient: ['#7C3AED', '#5B21B6'],
  },
  photo_contest: {
    title: 'Photo Contest',
    icon: 'camera-outline',
    gradient: ['#EC4899', '#9D174D'],
  },
  training: {
    title: 'Training Challenges',
    icon: 'trophy-outline',
    gradient: ['#F59E0B', '#B45309'],
  },
  breed_guess: {
    title: 'Breed Guesser',
    icon: 'search-outline',
    gradient: ['#10B981', '#065F46'],
  },
};

const IMAGE_ZOOM_BY_MODE: Partial<Record<GameMode, number>> = {
  photo_contest: 0.98,
  breed_guess: 0.98,
};

export function GameCard({ mode, onPress, disabled, size = 'square', imageSource }: GameCardProps) {
  const meta = GAME_META[mode];
  const cardScale = useRef(new Animated.Value(1)).current;
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageSource) && !imageFailed;
  const imageZoom = IMAGE_ZOOM_BY_MODE[mode] ?? 1.14;

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
    <Animated.View
      style={[
        styles.card,
        size === 'wide' ? styles.cardWide : styles.cardSquare,
        disabled && styles.disabled,
        { transform: [{ scale: cardScale }] },
      ]}
    >
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
          <View style={styles.mediaArea}>
          {showImage ? (
            <View style={styles.imagePlate}>
              <Image
                source={imageSource}
                style={[styles.featuredImage, { transform: [{ scale: imageZoom }] }]}
                resizeMode="cover"
                onError={() => setImageFailed(true)}
              />
            </View>
          ) : (
            <View style={styles.iconWrap}>
              <Ionicons name={meta.icon} size={40} color="#fff" style={styles.icon} />
            </View>
          )}
          </View>

          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.62)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.imageOverlay}
          />

          <View style={styles.textGroup}>
            <ThemedText style={styles.title}>{meta.title}</ThemedText>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
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
    width: '100%',
  },
  gradient: {
    justifyContent: 'space-between',
    position: 'relative',
    padding: spacing.sm,
  },
  gradientWide: {
    minHeight: 170,
  },
  gradientSquare: {
    minHeight: 162,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  mediaArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xs,
  },
  imagePlate: {
    width: '92%',
    height: '76%',
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  iconWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    textAlign: 'center',
  },
  textGroup: {
    width: '100%',
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.extrabold,
    color: '#fff',
    lineHeight: 20,
  },
  disabled: {
    opacity: 0.6,
  },
});
