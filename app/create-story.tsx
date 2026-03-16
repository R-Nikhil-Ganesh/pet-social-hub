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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { useFeedStore } from '@/store/feedStore';

export default function CreateStoryScreen() {
  const router = useRouter();
  const createStory = useFeedStore((s) => s.createStory);

  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
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
    }
  };

  const handleShare = async () => {
    if (!mediaUri) return;
    setSubmitting(true);
    try {
      const form = new FormData() as any;
      const filename = mediaUri.split('/').pop() ?? 'story.jpg';
      const mimeType = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
      if (Platform.OS === 'web') {
        const response = await fetch(mediaUri);
        const blob = await response.blob();
        form.append('media', blob, filename);
      } else {
        form.append('media', { uri: mediaUri, name: filename, type: mimeType } as any);
      }
      await createStory(form);
      router.back();
    } catch {
      Alert.alert('Error', 'Could not share story. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Close */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
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
            <ThemedText style={styles.pickIcon}>📷</ThemedText>
            <ThemedText style={styles.pickTitle}>Add your story</ThemedText>
            <ThemedText style={styles.pickSub}>Disappears after 24 hours</ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
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
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
