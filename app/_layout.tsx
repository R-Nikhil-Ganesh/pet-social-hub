import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  const { isLoading, isAuthenticated, hydrate } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/feed');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifications' }} />
        <Stack.Screen name="post/[id]" options={{ presentation: 'modal', headerShown: true, title: 'Post' }} />
        <Stack.Screen name="community/[id]" options={{ headerShown: true }} />
        <Stack.Screen name="thread/[id]" options={{ headerShown: true, title: 'Thread' }} />
        <Stack.Screen name="user/[id]" options={{ headerShown: true, title: 'Profile' }} />
        <Stack.Screen name="followers/[id]" options={{ headerShown: true, title: 'Followers' }} />
        <Stack.Screen name="following/[id]" options={{ headerShown: true, title: 'Following' }} />
        <Stack.Screen name="story/[id]" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="create-post" options={{ presentation: 'modal', headerShown: true, title: 'New Post' }} />
        <Stack.Screen name="create-story" options={{ presentation: 'modal', headerShown: true, title: 'New Story' }} />
        <Stack.Screen name="trivia" options={{ presentation: 'fullScreenModal', headerShown: false }} />
      </Stack>
    </>
  );
}
