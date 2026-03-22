import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { SkeletonShimmer } from '@/components/ui/SkeletonShimmer';

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
        <SkeletonShimmer width={140} height={14} borderRadius={999} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" translucent={false} backgroundColor="#ffffff" />
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#18181B',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 17,
            color: '#18181B',
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifications' }} />
        <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
        <Stack.Screen name="rewards" options={{ headerShown: true, title: 'Rewards' }} />
        <Stack.Screen name="leaderboard" options={{ headerShown: true, title: 'Leaderboard' }} />
        <Stack.Screen name="my-pets" options={{ headerShown: true, title: 'My Pets' }} />
        <Stack.Screen name="add-pet" options={{ headerShown: true, title: 'Add Pet' }} />
        <Stack.Screen name="pet/[id]" options={{ headerShown: true, title: 'Pet Details' }} />
        <Stack.Screen name="post/[id]" options={{ presentation: 'modal', headerShown: true, title: 'Post' }} />
        <Stack.Screen name="community/[id]" options={{ headerShown: true, title: 'Community' }} />
        <Stack.Screen name="thread/[id]" options={{ headerShown: true, title: 'Thread' }} />
        <Stack.Screen name="user/[id]" options={{ headerShown: true, title: 'Profile' }} />
        <Stack.Screen name="followers/[id]" options={{ headerShown: true, title: 'Followers' }} />
        <Stack.Screen name="following/[id]" options={{ headerShown: true, title: 'Following' }} />
        <Stack.Screen name="training" options={{ headerShown: true, title: 'Training' }} />
        <Stack.Screen name="photo-contest" options={{ headerShown: true, title: 'Photo Contest' }} />
        <Stack.Screen name="breed-guess" options={{ headerShown: true, title: 'Breed Guess' }} />
        <Stack.Screen name="story/[id]" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="create-post" options={{ presentation: 'modal', headerShown: false, title: 'New Post' }} />
        <Stack.Screen name="create-story" options={{ presentation: 'modal', headerShown: false, title: 'New Story' }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
        <Stack.Screen name="trivia" options={{ presentation: 'fullScreenModal', headerShown: false }} />
      </Stack>
    </>
  );
}
