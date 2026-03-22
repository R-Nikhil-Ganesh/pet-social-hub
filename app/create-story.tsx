import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { useFeedStore } from '@/store/feedStore';
import { useAuthStore } from '@/store/authStore';

export default function CreateStoryScreen() {
  const router = useRouter();
  const goBackOrFeed = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/feed');
  };
  const createStory = useFeedStore((s) => s.createStory);
  const user = useAuthStore((s) => s.user);

  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaMimeType, setMediaMimeType] = useState<string | null>(null);
  const [mediaFileName, setMediaFileName] = useState<string | null>(null);
  const [selectedPetId, setSelectedPetId] = useState<number | null>(
    user?.pet_profiles?.[0]?.id ?? null
  );
  const [submitting, setSubmitting] = useState(false);

  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow access to pick a photo or video.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.9,
      allowsEditing: true,
      aspect: [9, 16],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaType(asset.type === 'video' ? 'video' : 'image');
      setMediaMimeType(asset.mimeType || null);
      setMediaFileName(asset.fileName || null);
    }
  };

  const handleShare = async () => {
    if (!mediaUri) return;
    setSubmitting(true);
    try {
      const form = new FormData() as any;
      const filename = mediaFileName || mediaUri.split('/').pop() || (mediaType === 'video' ? 'story.mp4' : 'story.jpg');
      const mimeType = mediaMimeType || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg');
      const normalizedUri =
        Platform.OS === 'android' && mediaUri.startsWith('/') ? `file://${mediaUri}` : mediaUri;

      if (selectedPetId) {
        form.append('pet_id', String(selectedPetId));
      }

      if (Platform.OS === 'web') {
        const response = await fetch(mediaUri);
        const blob = await response.blob();
        form.append('media', blob, filename);
      } else {
        form.append('media', { uri: normalizedUri, name: filename, type: mimeType } as any);
      }

      await createStory(form);
      goBackOrFeed();
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        (err?.message?.includes('Network Error')
          ? 'Cannot reach server. Check API URL and backend status.'
          : 'Could not share story. Please try again.');
      Alert.alert('Error', status ? `${msg} (HTTP ${status})` : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Close */}
      <TouchableOpacity style={styles.closeBtn} onPress={goBackOrFeed}>
        <ThemedText style={styles.closeBtnText}>✕</ThemedText>
      </TouchableOpacity>

      {/* Media area */}
      {mediaUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: mediaUri }} style={styles.preview} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)']}
            style={styles.bottomGradient}
            pointerEvents="none"
          />
        </View>
      ) : (
        <TouchableOpacity style={styles.pickArea} onPress={pickMedia}>
          <LinearGradient colors={['#7C3AED', '#EC4899']} style={styles.pickAreaGradient}>
            <ThemedText style={styles.pickIcon}>+</ThemedText>
            <ThemedText style={styles.pickTitle}>Add your story</ThemedText>
            <ThemedText style={styles.pickSub}>Disappears after 24 hours</ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        {user?.pet_profiles?.length ? (
          <View style={styles.petPickerWrap}>
            <ThemedText style={styles.petPickerLabel}>Featuring</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petRow}>
              {user.pet_profiles.map((pet) => (
                <TouchableOpacity
                  key={pet.id}
                  style={[styles.petChip, selectedPetId === pet.id && styles.petChipActive]}
                  onPress={() => setSelectedPetId(pet.id)}
                >
                  <ThemedText style={[styles.petChipText, selectedPetId === pet.id && styles.petChipTextActive]}>
                    {pet.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          <TouchableOpacity onPress={() => router.push('/add-pet')} style={styles.addPetHint}>
            <ThemedText style={styles.addPetHintText}>+ Add a pet profile to tag stories</ThemedText>
          </TouchableOpacity>
        )}
        <View style={styles.actionsRow}>
          {mediaUri && (
            <TouchableOpacity style={styles.retakeBtn} onPress={pickMedia}>
              <ThemedText style={styles.retakeBtnText}>⟳ Retake</ThemedText>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.shareBtn, (!mediaUri || submitting) && styles.shareBtnDisabled]}
            onPress={handleShare}
            disabled={!mediaUri || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.shareBtnText}>Share Story →</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  closeBtn: {
    position: 'absolute',
    top: 52,
    left: 18,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 30,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  previewContainer: { flex: 1 },
  preview: { flex: 1 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  pickArea: { flex: 1 },
  pickAreaGradient: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  pickIcon: { fontSize: 64 },
  pickTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  pickSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  bottomBar: {
    flexDirection: 'column',
    padding: 16,
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  petPickerWrap: { gap: 8 },
  petPickerLabel: { color: '#fff', fontSize: 12, fontWeight: '700' },
  petRow: { gap: 8 },
  petChip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  petChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  petChipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  petChipTextActive: { color: '#fff' },
  addPetHint: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  addPetHintText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  retakeBtn: {
    borderWidth: 1.5,
    borderColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retakeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  shareBtn: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 30,
    paddingVertical: 13,
    alignItems: 'center',
  },
  shareBtnDisabled: { opacity: 0.4 },
  shareBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
