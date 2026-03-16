import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

export default function EditProfileScreen() {
  const router = useRouter();
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
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText style={styles.cancel}>Cancel</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.title}>Edit Profile</ThemedText>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#7C3AED" size="small" />
          ) : (
            <ThemedText style={styles.save}>Save</ThemedText>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar}>
            <Image
              source={{ uri: avatarUri ?? user?.avatar_url ?? '' }}
              style={styles.avatar}
            />
            <View style={styles.editBadge}>
              <ThemedText style={styles.editBadgeText}>📷</ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Display name */}
        <View style={styles.field}>
          <ThemedText style={styles.label}>Display Name</ThemedText>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            maxLength={60}
            placeholder="Your name"
            placeholderTextColor="#A1A1AA"
          />
        </View>

        {/* Username (read-only) */}
        <View style={styles.field}>
          <ThemedText style={styles.label}>Username</ThemedText>
          <View style={styles.readOnly}>
            <ThemedText style={styles.readOnlyText}>@{user?.username}</ThemedText>
          </View>
          <ThemedText style={styles.hint}>Username cannot be changed.</ThemedText>
        </View>

        {/* Bio */}
        <View style={styles.field}>
          <ThemedText style={styles.label}>Bio</ThemedText>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={200}
            placeholder="Tell us about yourself and your pets..."
            placeholderTextColor="#A1A1AA"
          />
          <ThemedText style={styles.charCount}>{bio.length}/200</ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E7',
  },
  cancel: { fontSize: 16, color: '#71717A' },
  title: { fontSize: 17, fontWeight: '700', color: '#18181B' },
  save: { fontSize: 16, color: '#7C3AED', fontWeight: '700' },
  body: { flex: 1, padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EDE9FE',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#7C3AED',
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
  label: { fontSize: 12, fontWeight: '700', color: '#3F3F46', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#18181B',
  },
  bioInput: { minHeight: 90, textAlignVertical: 'top' },
  readOnly: {
    backgroundColor: '#F4F4F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  readOnlyText: { fontSize: 15, color: '#71717A' },
  hint: { fontSize: 12, color: '#A1A1AA', marginTop: 5 },
  charCount: { fontSize: 12, color: '#A1A1AA', textAlign: 'right', marginTop: 4 },
});
