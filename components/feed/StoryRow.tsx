import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StoryCircle } from './StoryCircle';
import { Story, useFeedStore } from '@/store/feedStore';
import { useAuthStore } from '@/store/authStore';

export function StoryRow() {
  const router = useRouter();
  const stories = useFeedStore((s) => s.stories);
  const user = useAuthStore((s) => s.user);

  const handleStoryPress = (story: Story) => {
    router.push(`/story/${story.id}`);
  };

  const handleOwnStoryPress = () => {
    if (myStory) {
      router.push(`/story/${myStory.id}`);
      return;
    }

    router.push('/create-story');
  };

  const myStory = stories.find((s) => s.user_id === user?.id);
  const uniqueStoriesByUser = stories.reduce<Story[]>((acc, currentStory) => {
    const alreadyIncluded = acc.some((story) => story.user_id === currentStory.user_id);
    if (!alreadyIncluded) acc.push(currentStory);
    return acc;
  }, []);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Own Story / Add Story */}
        <StoryCircle
          story={
            myStory ?? {
              id: -1,
              user_id: user?.id ?? 0,
              username: user?.username ?? '',
              display_name: user?.display_name ?? '',
              avatar_url: user?.avatar_url ?? '',
              pet: user?.pet_profiles?.[0]
                ? {
                    id: user.pet_profiles[0].id,
                    name: user.pet_profiles[0].name,
                    breed: user.pet_profiles[0].breed,
                    age: user.pet_profiles[0].age,
                    photo_url: user.pet_profiles[0].photo_url,
                    species: user.pet_profiles[0].species,
                  }
                : { id: 0, name: '', breed: '', age: 0, photo_url: '', species: '' },
              media_url: '',
              media_type: 'image',
              expires_at: '',
              viewed: false,
            }
          }
          isOwn
          showAddBadge={!myStory}
          onPress={handleOwnStoryPress}
        />

        {/* Other Stories (exclude own) */}
        {uniqueStoriesByUser
          .filter((s) => s.user_id !== user?.id)
          .map((story) => (
            <StoryCircle
              key={story.id}
              story={story}
              onPress={() => handleStoryPress(story)}
            />
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F4F4F5',
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
});
