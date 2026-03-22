import React, { useMemo, useState } from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

interface AvatarProps {
  uri?: string;
  size?: number;
  fallback?: string;
  seed?: string | number;
  isProfessional?: boolean;
  style?: ViewStyle;
}

export function Avatar({ uri, size = 40, fallback = '', seed, isProfessional, style }: AvatarProps) {
  const [generatedFailed, setGeneratedFailed] = useState(false);
  const generatedAvatarUri = useMemo(() => {
    const seedBase = String(seed ?? (fallback?.trim() || 'user-default'));
    return `https://api.dicebear.com/7.x/pixel-art/png?seed=user-${encodeURIComponent(seedBase)}`;
  }, [fallback, seed]);

  const shouldShowGeneratedAvatar = !uri && !generatedFailed;

  return (
    <View style={[styles.wrapper, { width: size, height: size, borderRadius: size / 2 }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : fallback ? (
        <View
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <ThemedText style={{ fontSize: size * 0.45 }}>{fallback}</ThemedText>
        </View>
      ) : shouldShowGeneratedAvatar ? (
        <Image
          source={{ uri: generatedAvatarUri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setGeneratedFailed(true)}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Ionicons name="person" size={size * 0.45} color="#7C3AED" />
        </View>
      )}
      {isProfessional && (
        <View style={[styles.badge, { right: -2, bottom: -2 }]}>
          <Ionicons name="checkmark" size={9} color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  fallback: {
    backgroundColor: '#F0E6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '700',
  },
});
