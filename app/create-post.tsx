import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { useFeedStore } from '@/store/feedStore';

export default function CreatePostScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const createPost = useFeedStore((s) => s.createPost);

  const [caption, setCaption] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [locationName, setLocationName] = useState('');
  const [selectedPetId, setSelectedPetId] = useState<number | null>(
    user?.pet_profiles?.[0]?.id ?? null
  );
  const [submitting, setSubmitting] = useState(false);

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload media.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaType(asset.type === 'video' ? 'video' : 'image');
    }
  };

  const handlePost = async () => {
    if (!caption.trim() && !mediaUri) {
      Alert.alert('Empty post', 'Add a caption or photo to share.');
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData() as any;
      form.append('caption', caption.trim());
      if (selectedPetId) form.append('pet_id', String(selectedPetId));
      if (locationName) form.append('location_name', locationName);
      if (mediaUri) {
        const filename = mediaUri.split('/').pop() ?? 'media.jpg';
        const mimeType = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
        if (Platform.OS === 'web') {
          const response = await fetch(mediaUri);
          const blob = await response.blob();
          form.append('media', blob, filename);
        } else {
          form.append('media', { uri: mediaUri, name: filename, type: mimeType } as any);
        }
      }
      await createPost(form);
      router.back();
    } catch {
      Alert.alert('Error', 'Could not create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <ThemedText style={styles.cancel}>Cancel</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.title}>New Post</ThemedText>
          <TouchableOpacity
            onPress={handlePost}
            disabled={submitting}
            style={[styles.postBtn, submitting && styles.postBtnDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.postBtnText}>Post</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
          {/* Author */}
          <View style={styles.authorRow}>
            <Avatar uri={user?.avatar_url ?? ''} size={42} isProfessional={user?.is_professional ?? false} />
            <View>
              <ThemedText style={styles.displayName}>{user?.display_name}</ThemedText>
              <ThemedText style={styles.username}>@{user?.username}</ThemedText>
            </View>
          </View>

          {/* Caption */}
          <TextInput
            style={styles.captionInput}
            placeholder="What's your pet up to? 🐾"
            placeholderTextColor="#A1A1AA"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={500}
          />

          {/* Media preview */}
          {mediaUri ? (
            <View style={styles.previewWrapper}>
              <Image source={{ uri: mediaUri }} style={styles.preview} resizeMode="cover" />
              <TouchableOpacity style={styles.removeMedia} onPress={() => setMediaUri(null)}>
                <ThemedText style={styles.removeMediaText}>✕</ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.mediaPicker} onPress={pickMedia}>
              <ThemedText style={styles.mediaPickerIcon}>📷</ThemedText>
              <ThemedText style={styles.mediaPickerText}>Add Photo / Video</ThemedText>
            </TouchableOpacity>
          )}

          {/* Location */}
          <View style={styles.field}>
            <ThemedText style={styles.fieldLabel}>📍 Location</ThemedText>
            <TextInput
              style={styles.fieldInput}
              placeholder="City, park, vet..."
              placeholderTextColor="#A1A1AA"
              value={locationName}
              onChangeText={setLocationName}
              maxLength={100}
            />
          </View>

          {/* Pet selector */}
          {user?.pet_profiles && user.pet_profiles.length > 0 && (
            <View style={styles.field}>
              <ThemedText style={styles.fieldLabel}>🐾 Featuring</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petRow}>
                {user.pet_profiles.map((pet) => (
                  <TouchableOpacity
                    key={pet.id}
                    style={[styles.petChip, selectedPetId === pet.id && styles.petChipSelected]}
                    onPress={() => setSelectedPetId(pet.id)}
                  >
                    <ThemedText
                      style={[styles.petChipText, selectedPetId === pet.id && styles.petChipTextSelected]}
                    >
                      {pet.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
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
  postBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    minWidth: 64,
    alignItems: 'center',
  },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  body: { flex: 1, padding: 16 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  displayName: { fontSize: 15, fontWeight: '700', color: '#18181B' },
  username: { fontSize: 12, color: '#71717A' },
  captionInput: {
    fontSize: 17,
    color: '#18181B',
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  previewWrapper: { borderRadius: 16, overflow: 'hidden', marginBottom: 18, position: 'relative' },
  preview: { width: '100%', height: 260 },
  removeMedia: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 30,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeMediaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  mediaPicker: {
    height: 140,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 18,
  },
  mediaPickerIcon: { fontSize: 32 },
  mediaPickerText: { fontSize: 14, color: '#71717A' },
  field: { marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#3F3F46', marginBottom: 8 },
  fieldInput: {
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#18181B',
  },
  petRow: { gap: 8 },
  petChip: {
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  petChipSelected: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  petChipText: { fontSize: 13, color: '#7C3AED', fontWeight: '600' },
  petChipTextSelected: { color: '#fff' },
});
