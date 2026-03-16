import { create } from 'zustand';
import api from '../services/api';

export interface Community {
  id: number;
  name: string;
  description: string;
  type: 'breed' | 'topic' | 'local';
  cover_url?: string;
  icon_emoji: string;
  member_count: number;
  is_member: boolean;
  is_default: boolean;
  unread_count?: number;
}

export interface Thread {
  id: number;
  community_id: number;
  user_id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  is_professional: boolean;
  professional_type?: string;
  title: string;
  content: string;
  media_url?: string;
  flair?: string;
  upvotes: number;
  user_upvoted: boolean;
  reply_count: number;
  created_at: string;
}

export interface ThreadReply {
  id: number;
  thread_id: number;
  user_id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  is_professional: boolean;
  content: string;
  upvotes: number;
  user_upvoted: boolean;
  parent_reply_id?: number;
  children?: ThreadReply[];
  created_at: string;
}

export interface ChatMessage {
  _id: string;
  community_id: number;
  sender_id: number;
  sender_username: string;
  sender_display_name: string;
  sender_avatar: string;
  type: 'text' | 'image' | 'sticker' | 'gif' | 'reply';
  content: string;
  reply_to?: string;
  reply_preview?: string;
  reactions: { emoji: string; count: number; user_reacted: boolean }[];
  created_at: string;
}

interface CommunityState {
  communities: Community[];
  myBreedCommunities: Community[];
  activeCommunity: Community | null;
  threads: Thread[];
  activeThread: Thread | null;
  replies: ThreadReply[];
  chatMessages: ChatMessage[];
  isMembersLoading: boolean;
  isThreadsLoading: boolean;
  isChatLoading: boolean;

  fetchCommunities: () => Promise<void>;
  fetchMyCommunities: () => Promise<void>;
  joinCommunity: (communityId: number) => Promise<void>;
  leaveCommunity: (communityId: number) => Promise<void>;
  setActiveCommunity: (community: Community) => void;

  fetchThreads: (communityId: number) => Promise<void>;
  fetchThread: (threadId: number) => Promise<void>;
  createThread: (communityId: number, data: Partial<Thread>) => Promise<void>;
  upvoteThread: (threadId: number) => Promise<void>;

  fetchReplies: (threadId: number) => Promise<void>;
  createReply: (threadId: number, content: string, parentId?: number) => Promise<void>;
  upvoteReply: (replyId: number) => Promise<void>;

  fetchChatHistory: (communityId: number) => Promise<void>;
  addChatMessage: (message: ChatMessage) => void;
  updateMessageReaction: (messageId: string, emoji: string) => void;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  communities: [],
  myBreedCommunities: [],
  activeCommunity: null,
  threads: [],
  activeThread: null,
  replies: [],
  chatMessages: [],
  isMembersLoading: false,
  isThreadsLoading: false,
  isChatLoading: false,

  fetchCommunities: async () => {
    set({ isMembersLoading: true });
    try {
      const { data } = await api.get('/communities');
      set({ communities: data.communities });
    } finally {
      set({ isMembersLoading: false });
    }
  },

  fetchMyCommunities: async () => {
    const { data } = await api.get('/communities?filter=my');
    set({ myBreedCommunities: data.communities });
  },

  joinCommunity: async (communityId) => {
    await api.post(`/communities/${communityId}/join`);
    set({
      communities: get().communities.map((c) =>
        c.id === communityId
          ? { ...c, is_member: true, member_count: c.member_count + 1 }
          : c
      ),
    });
  },

  leaveCommunity: async (communityId) => {
    await api.delete(`/communities/${communityId}/join`);
    set({
      communities: get().communities.map((c) =>
        c.id === communityId
          ? { ...c, is_member: false, member_count: c.member_count - 1 }
          : c
      ),
    });
  },

  setActiveCommunity: (community) => set({ activeCommunity: community }),

  fetchThreads: async (communityId) => {
    set({ isThreadsLoading: true });
    try {
      const { data } = await api.get(`/threads?community_id=${communityId}`);
      set({ threads: data.threads });
    } finally {
      set({ isThreadsLoading: false });
    }
  },

  fetchThread: async (threadId) => {
    const { data } = await api.get(`/threads/${threadId}`);
    set({ activeThread: data.thread });
  },

  createThread: async (communityId, threadData) => {
    await api.post(`/threads`, { ...threadData, community_id: communityId });
    await get().fetchThreads(communityId);
  },

  upvoteThread: async (threadId) => {
    set({
      threads: get().threads.map((t) =>
        t.id === threadId
          ? {
              ...t,
              user_upvoted: !t.user_upvoted,
              upvotes: t.upvotes + (t.user_upvoted ? -1 : 1),
            }
          : t
      ),
    });
    await api.post(`/threads/${threadId}/vote`);
  },

  fetchReplies: async (threadId) => {
    const { data } = await api.get(`/threads/${threadId}/replies`);
    set({ replies: data.replies });
  },

  createReply: async (threadId, content, parentId) => {
    await api.post(`/threads/${threadId}/replies`, {
      content,
      parent_reply_id: parentId,
    });
    await get().fetchReplies(threadId);
  },

  upvoteReply: async (replyId) => {
    set({
      replies: get().replies.map((r) =>
        r.id === replyId
          ? {
              ...r,
              user_upvoted: !r.user_upvoted,
              upvotes: r.upvotes + (r.user_upvoted ? -1 : 1),
            }
          : r
      ),
    });
    await api.post(`/replies/${replyId}/upvote`);
  },

  fetchChatHistory: async (communityId) => {
    set({ isChatLoading: true });
    try {
      const { data } = await api.get(`/chat/${communityId}`);
      set({ chatMessages: data.messages });
    } finally {
      set({ isChatLoading: false });
    }
  },

  addChatMessage: (message) => {
    set({ chatMessages: [...get().chatMessages, message] });
  },

  updateMessageReaction: (messageId, emoji) => {
    set({
      chatMessages: get().chatMessages.map((m) =>
        m._id === messageId
          ? {
              ...m,
              reactions: m.reactions.some((r) => r.emoji === emoji)
                ? m.reactions.map((r) =>
                    r.emoji === emoji
                      ? {
                          ...r,
                          count: r.user_reacted ? r.count - 1 : r.count + 1,
                          user_reacted: !r.user_reacted,
                        }
                      : r
                  )
                : [...m.reactions, { emoji, count: 1, user_reacted: true }],
            }
          : m
      ),
    });
  },
}));
