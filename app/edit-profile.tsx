import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function EditProfileScreen() {
  const router = useRouter();
  const goBackOrProfile = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/profile');
  };
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Required', 'Display name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const form = new FormData() as any;
      form.append('display_name', displayName.trim());
      form.append('bio', bio.trim());
      if (avatarUri) {
        const filename = avatarUri.split('/').pop() ?? 'avatar.jpg';
        form.append('avatar', { uri: avatarUri, name: filename, type: 'image/jpeg' } as any);
      }
      const { data } = await api.put('/users/me', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data.user);
      goBackOrProfile();
    } catch {
      Alert.alert('Error', 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Button variant="ghost" style={styles.headerBtn} onPress={goBackOrProfile} label="Cancel" />
        <ThemedText variant="title" style={styles.title}>Edit Profile</ThemedText>
        <Button style={styles.headerBtn} onPress={handleSave} loading={saving} label="Save" />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarPicker} onPress={pickAvatar} activeOpacity={0.9}>
              <Image
                source={{ uri: avatarUri ?? user?.avatar_url ?? '' }}
                style={styles.avatar}
              />
              <View style={styles.editBadge}>
                <Ionicons name="camera-outline" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Display name */}
          <Input
            label="Display Name"
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            maxLength={60}
            placeholder="Your name"
          />

          {/* Username (read-only) */}
          <View style={styles.field}>
            <ThemedText variant="caption" style={styles.label}>Username</ThemedText>
            <Card style={styles.readOnly}>
              <ThemedText style={styles.readOnlyText}>@{user?.username}</ThemedText>
            </Card>
            <ThemedText variant="caption" style={styles.hint}>Username cannot be changed.</ThemedText>
          </View>

          {/* Bio */}
          <View style={styles.field}>
            <Input
              label="Bio"
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={200}
              placeholder="Tell us about yourself and your pets..."
            />
            <ThemedText variant="caption" style={styles.charCount}>{bio.length}/200</ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.surface },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.soft,
  },
  headerBtn: { minWidth: 96, minHeight: 44 },
  title: { fontSize: 20, color: colors.text.primary },
  body: { flex: 1, padding: spacing.lg },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarPicker: { minHeight: 92, minWidth: 92, paddingHorizontal: 0 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.bg.subtle,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.brand.primary,
    borderRadius: 16,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  editBadgeText: { fontSize: 14 },
  field: { marginBottom: 22 },
  label: { color: colors.text.secondary, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    marginTop: 0,
  },
  bioInput: { minHeight: 90, textAlignVertical: 'top' },
  readOnly: {
    backgroundColor: colors.bg.muted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  readOnlyText: { fontSize: 15, color: colors.text.secondary },
  hint: { color: colors.text.muted, marginTop: 5 },
  charCount: { fontSize: typography.size.xs, color: colors.text.muted, textAlign: 'right', marginTop: 4 },
});
