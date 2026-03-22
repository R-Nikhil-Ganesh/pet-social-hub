import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/theme/tokens';

type WiggleStickerProps = {
  iconName: keyof typeof Ionicons.glyphMap;
  size?: number;
  iconSize?: number;
  iconColor?: string;
  backgroundColor?: string;
  style?: ViewStyle;
};

export function WiggleSticker({
  iconName,
  size = 28,
  iconSize = 15,
  iconColor = colors.text.inverse,
  backgroundColor = colors.brand.primary,
  style,
}: WiggleStickerProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 2400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    );

    animation.start();
    return () => animation.stop();
  }, [progress]);

  const rotate = progress.interpolate({
    inputRange: [0, 0.2, 0.5, 0.8, 1],
    outputRange: ['0deg', '-8deg', '0deg', '8deg', '0deg'],
  });

  const translateY = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -2, 0],
  });

  const scale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.06, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius.pill,
          backgroundColor,
          transform: [{ rotate }, { translateY }, { scale }],
        },
        style,
      ]}
    >
      <Ionicons name={iconName} size={iconSize} color={iconColor} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
