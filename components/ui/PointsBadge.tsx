import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const content = (
    <>
      <Ionicons name="paw" size={fontSize + 1} color="#DDD6FE" style={styles.pawIcon} />
      <ThemedText style={[styles.points, { fontSize }]}>{formatted}</ThemedText>
      {showLabel && (
        <ThemedText style={[styles.label, { fontSize: fontSize - 2 }]}>pts</ThemedText>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.container, { paddingHorizontal: padH, paddingVertical: padV }]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.container, { paddingHorizontal: padH, paddingVertical: padV }]}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    gap: 4,
  },
  pawIcon: {
    marginRight: 1,
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
