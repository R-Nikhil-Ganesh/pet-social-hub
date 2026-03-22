import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface FacepileProps {
  seed: string | number;
  size?: number;
  count?: number;
}

export function Facepile({ seed, size = 24, count = 3 }: FacepileProps) {
  const safeCount = Math.max(0, count);
  const avatars = useMemo(
    () =>
      Array.from({ length: safeCount }).map((_, index) => ({
        id: `${seed}-${index}`,
        uri: `https://api.dicebear.com/7.x/pixel-art/png?seed=user-${seed}-${index}`,
      })),
    [safeCount, seed]
  );

  if (safeCount === 0) {
    return null;
  }

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
              zIndex: safeCount - index,
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
});
