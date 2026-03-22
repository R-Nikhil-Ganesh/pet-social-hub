import React, { useRef } from 'react';
import { Animated, StyleProp, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';

interface TouchableScaleProps extends TouchableOpacityProps {
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
}

export function TouchableScale({
  style,
  pressedScale = 0.97,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: TouchableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn: TouchableOpacityProps['onPressIn'] = (event) => {
    Animated.spring(scale, {
      toValue: pressedScale,
      useNativeDriver: true,
      speed: 28,
      bounciness: 0,
    }).start();
    onPressIn?.(event);
  };

  const handlePressOut: TouchableOpacityProps['onPressOut'] = (event) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 0,
    }).start();
    onPressOut?.(event);
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity {...rest} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
