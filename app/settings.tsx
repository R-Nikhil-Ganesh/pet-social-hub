import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useAuthStore } from '@/store/authStore';

export default function SettingsScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const [notifLikes, setNotifLikes] = useState(true);
  const [notifComments, setNotifComments] = useState(true);
  const [notifFollows, setNotifFollows] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifGames, setNotifGames] = useState(true);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Notifications section */}
        <ThemedText style={styles.sectionHeader}>Notifications</ThemedText>
        <View style={styles.card}>
          <SettingRow label="Likes & Reactions" value={notifLikes} onToggle={setNotifLikes} />
          <SettingRow label="Comments" value={notifComments} onToggle={setNotifComments} />
          <SettingRow label="New Followers" value={notifFollows} onToggle={setNotifFollows} />
          <SettingRow label="Chat Messages" value={notifMessages} onToggle={setNotifMessages} last />
          <SettingRow label="Game Invites" value={notifGames} onToggle={setNotifGames} last />
        </View>

        {/* Account section */}
        <ThemedText style={styles.sectionHeader}>Account</ThemedText>
        <View style={styles.card}>
          <LinkRow label="Edit Profile" onPress={() => router.push('/edit-profile')} />
          <LinkRow label="Privacy Policy" onPress={() => {}} />
          <LinkRow label="Terms of Service" onPress={() => {}} last />
        </View>

        {/* Danger zone */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <ThemedText style={styles.logoutText}>Log Out</ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.version}>Pawprint v1.0.0</ThemedText>
      </ScrollView>
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
        trackColor={{ false: '#D4D4D8', true: '#7C3AED' }}
        thumbColor="#fff"
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
    <TouchableOpacity style={[styles.row, !last && styles.rowBorder]} onPress={onPress}>
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      <ThemedText style={styles.chevron}>›</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9FB' },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717A',
    marginTop: 24,
    marginBottom: 6,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E4E4E7',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F4F4F5',
  },
  rowLabel: { fontSize: 15, color: '#18181B' },
  chevron: { fontSize: 22, color: '#A1A1AA' },
  logoutBtn: {
    marginTop: 32,
    marginHorizontal: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: { fontSize: 16, color: '#EF4444', fontWeight: '700' },
  version: { fontSize: 12, color: '#A1A1AA', textAlign: 'center', marginTop: 24, marginBottom: 40 },
});
