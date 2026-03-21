import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';

interface ComingSoonScreenProps {
  title: string;
  subtitle?: string;
}

export function ComingSoonScreen({ title, subtitle }: ComingSoonScreenProps) {
  const router = useRouter();
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/games');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ThemedText style={styles.backBtnText}>Back</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <ThemedText style={styles.emoji}>🚧</ThemedText>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={styles.subtitle}>
          {subtitle ?? 'This game is coming soon. Check back soon for updates.'}
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E4E4E7',
  },
  backBtnText: {
    fontSize: 14,
    color: '#52525B',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  emoji: {
    fontSize: 52,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#18181B',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#71717A',
    textAlign: 'center',
    lineHeight: 21,
  },
});
