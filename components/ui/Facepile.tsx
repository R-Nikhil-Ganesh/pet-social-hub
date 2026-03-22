import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/tokens';

interface FacepileProps {
  seed: string | number;
  size?: number;
  count?: number;
}

export function Facepile({ seed, size = 24, count = 3 }: FacepileProps) {
  const avatars = useMemo(
    () =>
      Array.from({ length: count }).map((_, index) => ({
        id: `${seed}-${index}`,
        uri: `https://api.dicebear.com/7.x/pixel-art/png?seed=pet-${seed}-${index}`,
      })),
    [count, seed]
  );

  return (
    <View style={styles.row}>
      {avatars.map((avatar, index) => (
        <View
          key={avatar.id}
          style={[
            styles.avatarWrap,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: index === 0 ? 0 : -size * 0.35,
              zIndex: count - index,
            },
          ]}
        >
          <Image
            source={{ uri: avatar.uri }}
            style={{ width: size - 2, height: size - 2, borderRadius: (size - 2) / 2 }}
            onError={() => {}}
          />
        </View>
      ))}
      <View style={[styles.fallbackIcon, { width: size, height: size, borderRadius: size / 2, marginLeft: -size * 0.35 }]}>
        <Ionicons name="paw" size={size * 0.48} color={colors.brand.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fallbackIcon: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: colors.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
