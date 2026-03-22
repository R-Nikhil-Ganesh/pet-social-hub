import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ViewStyle,
  LayoutChangeEvent,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { colors, spacing, radius, typography } from '@/theme/tokens';

export interface MenuOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface MenuPopoverProps {
  visible: boolean;
  onDismiss: () => void;
  options: MenuOption[];
  anchorPoint?: { x: number; y: number };
  style?: ViewStyle;
}

export const MenuPopover = ({ visible, onDismiss, options, anchorPoint }: MenuPopoverProps) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setLayout({
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.backdrop}>
          <Animated.View
            style={[
              styles.menu,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
                top: anchorPoint?.y ?? 0,
                right: 16,
              },
            ]}
          >
            <View onLayout={handleLayout}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.option,
                    index !== options.length - 1 && styles.optionBorder,
                  ]}
                  onPress={() => {
                    option.onPress();
                    onDismiss();
                  }}
                  activeOpacity={0.6}
                >
                  <ThemedText
                    style={[
                      styles.optionText,
                      option.destructive && styles.destructiveText,
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menu: {
    position: 'absolute',
    backgroundColor: colors.bg.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.soft,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 160,
    overflow: 'hidden',
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  optionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.soft,
  },
  optionText: {
    fontSize: typography.size.sm,
    color: colors.text.primary,
  },
  destructiveText: {
    color: colors.state.danger,
    fontWeight: typography.weight.semibold,
  },
});
