import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientBackgroundProps extends ViewProps {
  children?: React.ReactNode;
}

export function GradientBackground({ children, style, ...props }: GradientBackgroundProps) {
  return (
    <LinearGradient
      colors={['#FFE5F7', '#FFD5F1', '#FFE9A6']}
      locations={[0, 0.56, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ flex: 1 }, style]}
      {...props}
    >
      <View pointerEvents="none" style={styles.patternLayer}>
        <View style={[styles.dot, styles.dotA]} />
        <View style={[styles.dot, styles.dotB]} />
        <View style={[styles.dot, styles.dotC]} />
        <View style={[styles.dot, styles.dotD]} />
        <View style={[styles.dot, styles.dotE]} />
      </View>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  patternLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.46,
  },
  dot: {
    position: 'absolute',
    borderRadius: 999,
  },
  dotA: {
    width: 120,
    height: 120,
    top: 34,
    left: -22,
    backgroundColor: 'rgba(255,255,255,0.36)',
  },
  dotB: {
    width: 96,
    height: 96,
    top: 116,
    right: 18,
    backgroundColor: 'rgba(255,79,163,0.2)',
  },
  dotC: {
    width: 68,
    height: 68,
    top: 270,
    left: 24,
    backgroundColor: 'rgba(34,211,238,0.22)',
  },
  dotD: {
    width: 136,
    height: 136,
    bottom: 120,
    right: -30,
    backgroundColor: 'rgba(255,207,90,0.26)',
  },
  dotE: {
    width: 52,
    height: 52,
    bottom: 56,
    left: 44,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
});
