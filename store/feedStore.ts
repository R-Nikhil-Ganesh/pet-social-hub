import { create } from 'zustand';
import api from '../services/api';

export interface PetMeta {
  id: number;
  name: string;
  breed: string;
  age: number;
  photo_url: string;
}

export interface Post {
  id: number;
  user_id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  pet: PetMeta;
  caption: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  location_name?: string;
  reaction_count: number;
  comment_count: number;
  user_reacted: boolean;
  score: number;
  created_at: string;
}

export interface Story {
  id: number;
  user_id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  pet: PetMeta;
  media_url: string;
  media_type: 'image' | 'video';
  expires_at: string;
  viewed: boolean;
}

export interface HotTake {
  id: number;
  user_id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  pet?: PetMeta | null;
  content: string;
  media_url?: string;
  upvotes: number;
  user_upvoted: boolean;
  flair: string;
  comment_count: number;
  created_at: string;
}

interface FeedState {
  posts: Post[];
  stories: Story[];
  hotTakes: HotTake[];
  isLoadingFeed: boolean;
  isLoadingStories: boolean;
  isLoadingHotTakes: boolean;
  page: number;
  hasMore: boolean;
  activeTab: 'moments' | 'stories' | 'hotTakes';
  setActiveTab: (tab: 'moments' | 'stories' | 'hotTakes') => void;
  fetchFeed: (refresh?: boolean) => Promise<void>;
  fetchStories: () => Promise<void>;
  fetchHotTakes: () => Promise<void>;
  reactToPost: (postId: number) => Promise<void>;
  upvoteHotTake: (hotTakeId: number) => Promise<void>;
  createPost: (form: FormData) => Promise<void>;
  createStory: (form: FormData) => Promise<void>;
  createHotTake: (data: { content: string; flair: string; pet_id: number }) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  stories: [],
  hotTakes: [],
  isLoadingFeed: false,
  isLoadingStories: false,
  isLoadingHotTakes: false,
  page: 1,
  hasMore: true,
  activeTab: 'moments',

  setActiveTab: (tab) => set({ activeTab: tab }),

  fetchFeed: async (refresh = false) => {
    const { isLoadingFeed, hasMore, page } = get();
    if (isLoadingFeed || (!hasMore && !refresh)) return;
    const nextPage = refresh ? 1 : page;
    set({ isLoadingFeed: true });
    try {
      const { data } = await api.get(`/feed?page=${nextPage}&limit=10`);
      set({
        posts: refresh ? data.posts : [...get().posts, ...data.posts],
        page: nextPage + 1,
        hasMore: data.has_more,
      });
    } finally {
      set({ isLoadingFeed: false });
    }
  },

  fetchStories: async () => {
    set({ isLoadingStories: true });
    try {
      const { data } = await api.get('/stories');
      set({ stories: (data.stories ?? []).map(normalizeStory) });
    } finally {
      set({ isLoadingStories: false });
    }
  },

  fetchHotTakes: async () => {
    set({ isLoadingHotTakes: true });
    try {
      const { data } = await api.get('/hot-takes');
      set({ hotTakes: (data.hot_takes ?? []).map(normalizeHotTake) });
    } finally {
      set({ isLoadingHotTakes: false });
    }
  },

  reactToPost: async (postId) => {
    set({
      posts: get().posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              user_reacted: !p.user_reacted,
              reaction_count: p.reaction_count + (p.user_reacted ? -1 : 1),
            }
          : p
      ),
    });
    await api.post(`/posts/${postId}/react`);
  },

  upvoteHotTake: async (hotTakeId) => {
    set({
      hotTakes: get().hotTakes.map((h) =>
        h.id === hotTakeId
          ? {
              ...h,
              user_upvoted: !h.user_upvoted,
              upvotes: h.upvotes + (h.user_upvoted ? -1 : 1),
            }
          : h
      ),
    });
    await api.post(`/hot-takes/${hotTakeId}/upvote`);
  },

  createPost: async (form) => {
    await api.post('/posts', form, {
      });
    await get().fetchFeed(true);
  },

  createStory: async (form) => {
    await api.post('/stories', form);
    await get().fetchStories();
  },

  createHotTake: async (data) => {
    await api.post('/hot-takes', data);
    await get().fetchHotTakes();
  },
}));

function normalizeStory(story: any): Story {
  const pet = story.pet ?? {
    id: 0,
    name: story.pet_name || story.display_name,
    breed: story.pet_breed || 'Pet',
    age: Number(story.pet_age ?? 0),
    photo_url: story.pet_photo_url || '',
  };

  return {
    ...story,
    pet,
    viewed: Boolean(story.viewed),
  };
}

function normalizeHotTake(hotTake: any): HotTake {
  return {
    ...hotTake,
    pet: hotTake.pet ?? null,
    upvotes: Number(hotTake.upvotes ?? 0),
    user_upvoted: Boolean(hotTake.user_upvoted),
    comment_count: Number(hotTake.comment_count ?? 0),
  };
}
