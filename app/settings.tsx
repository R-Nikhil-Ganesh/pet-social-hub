import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { useAuthStore } from '@/store/authStore';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function SettingsScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const [notifLikes, setNotifLikes] = useState(true);
  const [notifComments, setNotifComments] = useState(true);
  const [notifFollows, setNotifFollows] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifGames, setNotifGames] = useState(true);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogoutPress = () => {
    setLogoutDialogVisible(true);
  };

  const handleLogoutConfirm = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      setLogoutDialogVisible(false);
      router.replace('/(auth)/login');
    } catch {
      setLogoutLoading(false);
      setLogoutDialogVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Notifications section */}
        <ThemedText variant="caption" style={styles.sectionHeader}>Notifications</ThemedText>
        <Card style={styles.card}>
          <SettingRow label="Likes & Reactions" value={notifLikes} onToggle={setNotifLikes} />
          <SettingRow label="Comments" value={notifComments} onToggle={setNotifComments} />
          <SettingRow label="New Followers" value={notifFollows} onToggle={setNotifFollows} />
          <SettingRow label="Chat Messages" value={notifMessages} onToggle={setNotifMessages} />
          <SettingRow label="Game Invites" value={notifGames} onToggle={setNotifGames} last />
        </Card>

        {/* Account section */}
        <ThemedText variant="caption" style={styles.sectionHeader}>Account</ThemedText>
        <Card style={styles.card}>
          <LinkRow label="Edit Profile" onPress={() => router.push('/edit-profile')} />
          <LinkRow label="Privacy Policy" onPress={() => {}} />
          <LinkRow label="Terms of Service" onPress={() => {}} last />
        </Card>

        {/* Danger zone */}
        <Button style={styles.logoutBtn} variant="secondary" label="Log Out" onPress={handleLogoutPress} />

        <ThemedText variant="caption" style={styles.version}>Pawprint v1.0.0</ThemedText>
      </ScrollView>

      <ConfirmationDialog
        visible={logoutDialogVisible}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmLabel="Log Out"
        cancelLabel="Cancel"
        destructive
        loading={logoutLoading}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutDialogVisible(false)}
      />
    </SafeAreaView>
  );
}

function SettingRow({
  label,
  value,
  onToggle,
  last,
}: {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#D4D4D8', true: colors.brand.primary }}
        thumbColor="#fff"
        accessibilityLabel={`${label} notifications`}
        accessibilityRole="switch"
      />
    </View>
  );
}

function LinkRow({
  label,
  onPress,
  last,
}: {
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, !last && styles.rowBorder]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      <ThemedText style={styles.chevron}>›</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.app },
  sectionHeader: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: colors.text.secondary,
    marginTop: 24,
    marginBottom: 6,
    paddingHorizontal: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.bg.surface,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.soft,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.soft,
  },
  rowLabel: { fontSize: 15, color: colors.text.primary },
  chevron: { fontSize: 22, color: colors.text.muted },
  logoutBtn: {
    marginTop: spacing.xxl,
    marginHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  version: { fontSize: typography.size.xs, color: colors.text.muted, textAlign: 'center', marginTop: spacing.xl, marginBottom: 40 },
});
