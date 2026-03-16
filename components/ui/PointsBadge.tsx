import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

interface PointsBadgeProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  showLabel?: boolean;
}

export function PointsBadge({ points, size = 'md', onPress, showLabel }: PointsBadgeProps) {
  const fontSize = size === 'sm' ? 11 : size === 'lg' ? 16 : 13;
  const padH = size === 'sm' ? 8 : size === 'lg' ? 14 : 10;
  const padV = size === 'sm' ? 3 : size === 'lg' ? 7 : 4;

  const formatted =
    points >= 1000 ? `${(points / 1000).toFixed(1)}k` : `${points}`;

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.container, { paddingHorizontal: padH, paddingVertical: padV }]}
    >
      <ThemedText style={[styles.paw, { fontSize }]}>🐾</ThemedText>
      <ThemedText style={[styles.points, { fontSize }]}>{formatted}</ThemedText>
      {showLabel && (
        <ThemedText style={[styles.label, { fontSize: fontSize - 2 }]}>pts</ThemedText>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    gap: 4,
  },
  paw: {
    lineHeight: 18,
  },
  points: {
    color: '#fff',
    fontWeight: '700',
  },
  label: {
    color: '#DDD6FE',
    fontWeight: '500',
  },
});
