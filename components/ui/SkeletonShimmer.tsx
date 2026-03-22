import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  baseColor?: string;
  highlightColor?: string;
}

export function SkeletonShimmer({
  width = '100%',
  height = 14,
  borderRadius = 10,
  style,
  baseColor = '#ECEAF1',
  highlightColor = '#F9F8FC',
}: SkeletonShimmerProps) {
  const shimmerX = useRef(new Animated.Value(-140)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerX, {
        toValue: 280,
        duration: 1100,
        useNativeDriver: true,
      })
    );

    animation.start();
    return () => animation.stop();
  }, [shimmerX]);

  const resolvedWidth = width as DimensionValue;

  return (
    <View style={[styles.container, { width: resolvedWidth, height, borderRadius, backgroundColor: baseColor }, style]}>
      <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerX }] }]}>
        <LinearGradient
          colors={[baseColor, highlightColor, baseColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 140,
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
});
