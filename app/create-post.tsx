import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { useFeedStore } from '@/store/feedStore';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function CreatePostScreen() {
  const router = useRouter();
  const goBackOrFeed = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/feed');
  };
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
      goBackOrFeed();
    } catch {
      Alert.alert('Error', 'Could not create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBackOrFeed} hitSlop={12}>
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

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
          {/* Author */}
          <View style={styles.authorRow}>
            <Avatar uri={user?.avatar_url ?? ''} seed={user?.id ?? 'me'} size={42} isProfessional={user?.is_professional ?? false} />
            <View>
              <ThemedText style={styles.displayName}>{user?.display_name}</ThemedText>
              <ThemedText style={styles.username}>@{user?.username}</ThemedText>
            </View>
          </View>

          {/* Caption */}
          <TextInput
            style={styles.captionInput}
            placeholder="What's your pet up to?"
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
              <ThemedText style={styles.mediaPickerIcon}>+</ThemedText>
              <ThemedText style={styles.mediaPickerText}>Add Photo / Video</ThemedText>
            </TouchableOpacity>
          )}

          {/* Location */}
          <View style={styles.field}>
            <ThemedText style={styles.fieldLabel}>Location</ThemedText>
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
              <ThemedText style={styles.fieldLabel}>Featuring</ThemedText>
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

          {(!user?.pet_profiles || user.pet_profiles.length === 0) && (
            <TouchableOpacity style={styles.noPetsCta} onPress={() => router.push('/add-pet')}>
              <ThemedText style={styles.noPetsCtaText}>+ Add a pet profile to tag this post</ThemedText>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg.app },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.soft,
    backgroundColor: colors.bg.surface,
  },
  cancel: { fontSize: typography.size.md, color: colors.text.secondary },
  title: { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.text.primary },
  postBtn: {
    backgroundColor: colors.brand.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 64,
    alignItems: 'center',
  },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { color: colors.text.inverse, fontWeight: typography.weight.bold, fontSize: typography.size.sm },
  body: { flex: 1, paddingHorizontal: spacing.md },
  bodyContent: { paddingTop: spacing.md, paddingBottom: spacing.xxl },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  displayName: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.text.primary },
  username: { fontSize: typography.size.xs, color: colors.text.secondary },
  captionInput: {
    fontSize: typography.size.lg,
    color: colors.text.primary,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
    lineHeight: typography.lineHeight.relaxed,
  },
  previewWrapper: { borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.md, position: 'relative' },
  preview: { width: '100%', height: 260 },
  removeMedia: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 30,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeMediaText: { color: colors.text.inverse, fontSize: typography.size.md, fontWeight: typography.weight.bold },
  mediaPicker: {
    height: 140,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.soft,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    marginBottom: spacing.md,
    backgroundColor: colors.bg.surface,
  },
  mediaPickerIcon: { fontSize: 32, color: colors.brand.primary },
  mediaPickerText: { fontSize: typography.size.sm, color: colors.text.secondary },
  field: { marginBottom: spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: typography.weight.semibold, color: colors.text.primary, marginBottom: spacing.xs },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.border.soft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 11,
    fontSize: typography.size.md,
    color: colors.text.primary,
    backgroundColor: colors.bg.surface,
  },
  petRow: { gap: spacing.xs },
  petChip: {
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: 30,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    backgroundColor: colors.bg.surface,
  },
  petChipSelected: { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary },
  petChipText: { fontSize: 13, color: colors.text.secondary, fontWeight: typography.weight.semibold },
  petChipTextSelected: { color: colors.text.inverse },
  noPetsCta: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    backgroundColor: colors.bg.subtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  noPetsCtaText: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, color: colors.brand.primaryDark },
});
