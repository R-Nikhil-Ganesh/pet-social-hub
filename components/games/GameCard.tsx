import React from 'react';
import { View, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { GameMode } from '@/store/gameStore';

interface GameCardProps {
  mode: GameMode;
  onPress: () => void;
  disabled?: boolean;
}

const GAME_META: Record<
  GameMode,
  { title: string; description: string; emoji: string; gradient: [string, string] }
> = {
  trivia: {
    title: 'Trivia Battle',
    description: '1v1 pet quiz showdown',
    emoji: '🧠',
    gradient: ['#7C3AED', '#5B21B6'],
  },
  photo_contest: {
    title: 'Photo Contest',
    description: 'Vote for the cutest pet',
    emoji: '📸',
    gradient: ['#EC4899', '#9D174D'],
  },
  training: {
    title: 'Training Challenges',
    description: 'Daily streaks & rewards',
    emoji: '🏆',
    gradient: ['#F59E0B', '#B45309'],
  },
  breed_guess: {
    title: 'Breed Guesser',
    description: 'Guess the breed, win points',
    emoji: '🔍',
    gradient: ['#10B981', '#065F46'],
  },
};

export function GameCard({ mode, onPress, disabled }: GameCardProps) {
  const meta = GAME_META[mode];

  return (
    <TouchableOpacity
      style={[styles.card, disabled && styles.disabled]}
      onPress={onPress}
      activeOpacity={0.88}
      disabled={disabled}
    >
      <LinearGradient
        colors={meta.gradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ThemedText style={styles.emoji}>{meta.emoji}</ThemedText>
        <View style={styles.textGroup}>
          <ThemedText style={styles.title}>{meta.title}</ThemedText>
          <ThemedText style={styles.description}>{meta.description}</ThemedText>
        </View>
        <ThemedText style={styles.arrow}>›</ThemedText>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 14,
  },
  emoji: {
    fontSize: 36,
  },
  textGroup: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  description: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
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
