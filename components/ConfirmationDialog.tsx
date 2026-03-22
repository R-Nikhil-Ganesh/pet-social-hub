import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmationDialogProps) {
  const confirmBgColor = destructive ? colors.state.danger : colors.brand.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      supportedOrientations={['portrait']}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <ThemedText variant="title" style={styles.title}>
            {title}
          </ThemedText>

          {/* Message */}
          <ThemedText variant="body" style={styles.message}>
            {message}
          </ThemedText>

          {/* Button Row */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.7}
            >
              <ThemedText variant="label" style={styles.cancelButtonText}>
                {cancelLabel}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: confirmBgColor },
                loading && styles.buttonDisabled,
              ]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.7}
            >
              <ThemedText
                variant="label"
                style={styles.confirmButtonText}
              >
                {loading ? 'Processing...' : confirmLabel}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    width: '85%',
    maxWidth: 320,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  message: {
    color: colors.text.secondary,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    backgroundColor: colors.bg.subtle,
    borderWidth: 1,
    borderColor: colors.border.soft,
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontWeight: typography.weight.semibold,
  },
  confirmButton: {
    backgroundColor: colors.brand.primary,
  },
  confirmButtonText: {
    color: colors.text.inverse,
    fontWeight: typography.weight.semibold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
