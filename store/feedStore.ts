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

export interface EventItem {
  id: number;
  title: string;
  description: string;
  location_name: string;
  starts_at: string;
  cover_url?: string;
  created_groups: {
    id: number;
    name: string;
    created_at: string;
    community_id: number | null;
    member_count: number;
    members: {
      id: number;
      display_name: string;
      avatar_url?: string;
    }[];
  }[];
  joined_groups: {
    id: number;
    name: string;
    created_at: string;
    community_id: number | null;
    member_count: number;
    members: {
      id: number;
      display_name: string;
      avatar_url?: string;
    }[];
  }[];
}

export interface ConnectionUser {
  id: number;
  username: string;
  display_name: string;
  avatar_url?: string;
  is_follower: boolean;
  is_following: boolean;
}

export interface EventGroupRequest {
  id: number;
  group_id: number;
  invitee_id: number;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  event_id: string;
  group_name: string;
  event_title: string;
  community_id: number | null;
  creator: {
    id: number;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

interface FeedState {
  posts: Post[];
  stories: Story[];
  events: EventItem[];
  connections: ConnectionUser[];
  eventRequests: EventGroupRequest[];
  isLoadingFeed: boolean;
  isLoadingStories: boolean;
  isLoadingEvents: boolean;
  isLoadingEventRequests: boolean;
  isCreatingEventGroup: boolean;
  page: number;
  hasMore: boolean;
  activeTab: 'moments' | 'events';
  setActiveTab: (tab: 'moments' | 'events') => void;
  fetchFeed: (refresh?: boolean) => Promise<void>;
  fetchStories: () => Promise<void>;
  fetchEvents: () => Promise<void>;
  fetchConnections: () => Promise<void>;
  fetchEventRequests: () => Promise<void>;
  reactToPost: (postId: number) => Promise<void>;
  createEventGroup: (eventId: number, inviteeIds: number[], groupName?: string) => Promise<void>;
  respondToEventRequest: (
    requestId: number,
    action: 'accept' | 'decline'
  ) => Promise<{ community_id?: number }>;
  createPost: (form: FormData) => Promise<void>;
  createStory: (form: FormData) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  stories: [],
  events: [],
  connections: [],
  eventRequests: [],
  isLoadingFeed: false,
  isLoadingStories: false,
  isLoadingEvents: false,
  isLoadingEventRequests: false,
  isCreatingEventGroup: false,
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
        posts: refresh
          ? (data.posts ?? []).map(normalizePost)
          : [...get().posts, ...(data.posts ?? []).map(normalizePost)],
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

  fetchEvents: async () => {
    set({ isLoadingEvents: true });
    try {
      const { data } = await api.get('/event-groups/events');
      set({ events: (data.events ?? []).map(normalizeEvent) });
    } finally {
      set({ isLoadingEvents: false });
    }
  },

  fetchConnections: async () => {
    const { data } = await api.get('/event-groups/connections');
    set({ connections: (data.connections ?? []).map(normalizeConnection) });
  },

  fetchEventRequests: async () => {
    set({ isLoadingEventRequests: true });
    try {
      const { data } = await api.get('/event-groups/requests');
      set({ eventRequests: (data.requests ?? []).map(normalizeEventRequest) });
    } finally {
      set({ isLoadingEventRequests: false });
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

  createEventGroup: async (eventId, inviteeIds, groupName) => {
    set({ isCreatingEventGroup: true });
    try {
      await api.post('/event-groups', {
        event_id: eventId,
        invitee_ids: inviteeIds,
        name: groupName?.trim() || undefined,
      });
      await get().fetchEvents();
    } finally {
      set({ isCreatingEventGroup: false });
    }
  },

  respondToEventRequest: async (requestId, action) => {
    const { data } = await api.post(`/event-groups/requests/${requestId}/respond`, { action });
    set({ eventRequests: get().eventRequests.filter((request) => request.id !== requestId) });
    return {
      community_id: data?.community_id,
    };
  },

  createPost: async (form) => {
    const { data } = await api.post('/posts', form, {});
    const createdPost = data?.post ? normalizePost(data.post) : null;

    if (createdPost) {
      set({ posts: [createdPost, ...get().posts] });
      return;
    }

    await get().fetchFeed(true);
  },

  createStory: async (form) => {
    await api.post('/stories', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await get().fetchStories();
  },

}));

function normalizeEvent(event: any): EventItem {
  return {
    id: Number(event.id),
    title: String(event.title || ''),
    description: String(event.description || ''),
    location_name: String(event.location_name || ''),
    starts_at: String(event.starts_at || ''),
    cover_url: event.cover_url || undefined,
    created_groups: Array.isArray(event.created_groups)
      ? event.created_groups.map((group: any) => ({
          id: Number(group.id),
          name: String(group.name || ''),
          created_at: String(group.created_at || ''),
          community_id: group.community_id ? Number(group.community_id) : null,
          member_count: Number(group.member_count ?? 0),
          members: Array.isArray(group.members)
            ? group.members.map((member: any) => ({
                id: Number(member.id),
                display_name: String(member.display_name || ''),
                avatar_url: member.avatar_url || undefined,
              }))
            : [],
        }))
      : [],
    joined_groups: Array.isArray(event.joined_groups)
      ? event.joined_groups.map((group: any) => ({
          id: Number(group.id),
          name: String(group.name || ''),
          created_at: String(group.created_at || ''),
          community_id: group.community_id ? Number(group.community_id) : null,
          member_count: Number(group.member_count ?? 0),
          members: Array.isArray(group.members)
            ? group.members.map((member: any) => ({
                id: Number(member.id),
                display_name: String(member.display_name || ''),
                avatar_url: member.avatar_url || undefined,
              }))
            : [],
        }))
      : [],
  };
}

function normalizeConnection(connection: any): ConnectionUser {
  return {
    id: Number(connection.id),
    username: String(connection.username || ''),
    display_name: String(connection.display_name || ''),
    avatar_url: connection.avatar_url || undefined,
    is_follower: Boolean(connection.is_follower),
    is_following: Boolean(connection.is_following),
  };
}

function normalizeEventRequest(request: any): EventGroupRequest {
  return {
    id: Number(request.id),
    group_id: Number(request.group_id),
    invitee_id: Number(request.invitee_id),
    status: request.status,
    created_at: String(request.created_at || ''),
    event_id: String(request.event_id || ''),
    group_name: String(request.group_name || ''),
    event_title: String(request.event_title || ''),
    community_id: request.community_id ? Number(request.community_id) : null,
    creator: {
      id: Number(request.creator?.id),
      username: String(request.creator?.username || ''),
      display_name: String(request.creator?.display_name || ''),
      avatar_url: request.creator?.avatar_url || undefined,
    },
  };
}

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

function normalizePost(post: any): Post {
  return {
    ...post,
    pet: post.pet ?? {
      id: 0,
      name: post.pet_name || post.display_name || 'Pet',
      breed: post.pet_breed || '',
      age: Number(post.pet_age ?? 0),
      photo_url: post.pet_photo_url || '',
    },
    reaction_count: Number(post.reaction_count ?? 0),
    comment_count: Number(post.comment_count ?? 0),
    user_reacted: Boolean(post.user_reacted),
    score: Number(post.score ?? 0),
  };
}

