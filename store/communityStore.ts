import { create } from 'zustand';
import api from '../services/api';

export interface Community {
  id: number;
  name: string;
  description: string;
  type: 'breed' | 'topic' | 'local';
  cover_url?: string;
  icon_emoji: string;
  icon_url?: string;
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
  media_url?: string;
  reply_to?: string;
  reply_preview?: string;
  reactions: {
    emoji: string;
    count: number;
    user_reacted: boolean;
    user_ids?: number[];
    users?: { id: number; username: string; display_name: string; is_self?: boolean }[];
  }[];
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
  updateMessageReaction: (
    messageId: string,
    emoji: string,
    currentUser?: { id: number; username?: string; display_name?: string }
  ) => void;
  applyServerMessageReactions: (
    messageId: string,
    reactions: {
      emoji: string;
      count: number;
      user_ids?: number[];
      user_reacted?: boolean;
      users?: { id: number; username: string; display_name: string; is_self?: boolean }[];
    }[],
    currentUserId?: number
  ) => void;
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
      set({ threads: (data.threads ?? []).map(normalizeThread) });
    } finally {
      set({ isThreadsLoading: false });
    }
  },

  fetchThread: async (threadId) => {
    const { data } = await api.get(`/threads/${threadId}`);
    set({
      activeThread: normalizeThread(data.thread),
      replies: (data.replies ?? []).map(normalizeReply),
    });
  },

  createThread: async (communityId, threadData) => {
    await api.post(`/threads`, { ...threadData, community_id: communityId });
    await get().fetchThreads(communityId);
  },

  upvoteThread: async (threadId) => {
    const activeThread = get().activeThread;
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
      activeThread:
        activeThread && activeThread.id === threadId
          ? {
              ...activeThread,
              user_upvoted: !activeThread.user_upvoted,
              upvotes: activeThread.upvotes + (activeThread.user_upvoted ? -1 : 1),
            }
          : activeThread,
    });
    await api.post(`/threads/${threadId}/vote`, { is_upvote: true });
  },

  fetchReplies: async (threadId) => {
    const { data } = await api.get(`/threads/${threadId}`);
    set({ replies: (data.replies ?? []).map(normalizeReply) });
  },

  createReply: async (threadId, content, parentId) => {
    await api.post(`/threads/${threadId}/replies`, {
      content,
      parent_id: parentId,
    });
    await get().fetchReplies(threadId);
  },

  upvoteReply: async (replyId) => {
    const replies = get().replies;
    const threadId = findReplyThreadId(replies, replyId);
    if (!threadId) return;
    set({
      replies: toggleReplyVote(replies, replyId),
    });
    await api.post(`/threads/${threadId}/vote`, { is_upvote: true, reply_id: replyId });
  },

  fetchChatHistory: async (communityId) => {
    if (!Number.isFinite(communityId) || communityId <= 0) {
      set({ chatMessages: [], isChatLoading: false });
      return;
    }

    set({ isChatLoading: true });
    try {
      const { data } = await api.get(`/chat/${communityId}`);
      set({ chatMessages: data.messages.map(normalizeChatMessage) });
    } catch {
      set({ chatMessages: [] });
    } finally {
      set({ isChatLoading: false });
    }
  },

  addChatMessage: (message) => {
    set({ chatMessages: [...get().chatMessages, normalizeChatMessage(message)] });
  },

  updateMessageReaction: (messageId, emoji, currentUser) => {
    set({
      chatMessages: get().chatMessages.map((m) =>
        m._id === messageId
          ? {
              ...m,
              reactions: applySingleUserReactionOptimistic(m.reactions, emoji, currentUser),
            }
          : m
      ),
    });
  },

  applyServerMessageReactions: (messageId, reactions, currentUserId) => {
    set({
      chatMessages: get().chatMessages.map((m) =>
        m._id === messageId
          ? {
              ...m,
              reactions: normalizeMessageReactionsForUser(reactions, currentUserId),
            }
          : m
      ),
    });
  },
}));

function normalizeThread(thread: any): Thread {
  return {
    ...thread,
    upvotes: Number(thread.upvotes ?? thread.upvote_count ?? 0),
    user_upvoted: Boolean(thread.user_upvoted ?? thread.user_voted),
    reply_count: Number(thread.reply_count ?? 0),
  };
}

function normalizeReply(reply: any): ThreadReply {
  return {
    ...reply,
    upvotes: Number(reply.upvotes ?? reply.upvote_count ?? 0),
    user_upvoted: Boolean(reply.user_upvoted ?? reply.user_voted),
    parent_reply_id: reply.parent_reply_id ?? reply.parent_id ?? undefined,
    children: Array.isArray(reply.children) ? reply.children.map(normalizeReply) : [],
  };
}

function toggleReplyVote(replies: ThreadReply[], replyId: number): ThreadReply[] {
  return replies.map((reply) => {
    if (reply.id === replyId) {
      return {
        ...reply,
        user_upvoted: !reply.user_upvoted,
        upvotes: reply.upvotes + (reply.user_upvoted ? -1 : 1),
      };
    }

    if (reply.children?.length) {
      return {
        ...reply,
        children: toggleReplyVote(reply.children, replyId),
      };
    }

    return reply;
  });
}

function findReplyThreadId(replies: ThreadReply[], replyId: number): number | null {
  for (const reply of replies) {
    if (reply.id === replyId) {
      return reply.thread_id;
    }

    if (reply.children?.length) {
      const nested = findReplyThreadId(reply.children, replyId);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

function normalizeChatMessage(msg: any): ChatMessage {
  return {
    ...msg,
    _id: msg._id || msg.id,
    created_at: msg.created_at || msg.createdAt,
    reply_to: msg.reply_to ? String(msg.reply_to) : undefined,
    reply_preview: msg.reply_preview || undefined,
    reactions: normalizeMessageReactionsForUser(msg.reactions, undefined),
  };
}

function normalizeMessageReactionsForUser(
  reactions: any,
  currentUserId: number | undefined
): { emoji: string; count: number; user_reacted: boolean; user_ids?: number[] }[] {
  const byEmoji = new Map<string, Set<number>>();

  for (const reaction of Array.isArray(reactions) ? reactions : []) {
    const emoji = String(reaction?.emoji || '').trim();
    if (!emoji) continue;
    if (!byEmoji.has(emoji)) {
      byEmoji.set(emoji, new Set<number>());
    }
    const users = byEmoji.get(emoji)!;

    if (Array.isArray(reaction.user_ids)) {
      reaction.user_ids.forEach((id: any) => {
        const n = Number(id);
        if (Number.isFinite(n)) users.add(n);
      });
    } else if (Number.isFinite(Number(reaction.user_id))) {
      users.add(Number(reaction.user_id));
    }
  }

  return Array.from(byEmoji.entries()).map(([emoji, users]) => {
    const userIds = Array.from(users);
    const usersFromPayload = (Array.isArray(reactions) ? reactions : [])
      .filter((r: any) => String(r?.emoji || '').trim() === emoji)
      .flatMap((r: any) => (Array.isArray(r?.users) ? r.users : []));

    const usersMap = new Map<number, { id: number; username: string; display_name: string; is_self?: boolean }>();
    usersFromPayload.forEach((u: any) => {
      const id = Number(u?.id);
      if (!Number.isFinite(id)) return;
      usersMap.set(id, {
        id,
        username: String(u?.username || `user${id}`),
        display_name: String(u?.display_name || u?.username || `User ${id}`),
        is_self: Boolean(u?.is_self),
      });
    });

    return {
      emoji,
      count: userIds.length,
      user_reacted:
        currentUserId != null ? userIds.includes(Number(currentUserId)) : Boolean(false),
      user_ids: userIds,
      users: userIds.map((id) =>
        usersMap.get(id) || {
          id,
          username: `user${id}`,
          display_name: `User ${id}`,
          is_self: currentUserId != null ? id === Number(currentUserId) : false,
        }
      ),
    };
  });
}

function applySingleUserReactionOptimistic(
  reactions: ChatMessage['reactions'],
  emoji: string,
  currentUser?: { id: number; username?: string; display_name?: string }
): ChatMessage['reactions'] {
  const userId = Number(currentUser?.id);
  const hasUser = Number.isFinite(userId);

  const cleared = reactions
    .map((reaction) => {
      if (!reaction.user_reacted || !hasUser) return reaction;
      const nextUserIds = (reaction.user_ids || []).filter((id) => Number(id) !== userId);
      const nextUsers = (reaction.users || []).filter((u) => Number(u.id) !== userId);
      return {
        ...reaction,
        count: Math.max(0, reaction.count - 1),
        user_reacted: false,
        user_ids: nextUserIds,
        users: nextUsers,
      };
    })
    .filter((reaction) => reaction.count > 0);

  const existingIndex = cleared.findIndex((reaction) => reaction.emoji === emoji);
  if (existingIndex >= 0) {
    const existing = cleared[existingIndex];
    const nextUserIds = hasUser
      ? [...new Set([...(existing.user_ids || []), userId])]
      : existing.user_ids;
    const nextUsers = hasUser
      ? [
          ...(existing.users || []).filter((u) => Number(u.id) !== userId),
          {
            id: userId,
            username: currentUser?.username || `user${userId}`,
            display_name: currentUser?.display_name || currentUser?.username || `User ${userId}`,
            is_self: true,
          },
        ]
      : existing.users;

    cleared[existingIndex] = {
      ...existing,
      count: hasUser ? nextUserIds.length : Math.max(1, existing.count),
      user_reacted: hasUser ? true : existing.user_reacted,
      user_ids: nextUserIds,
      users: nextUsers,
    };
    return cleared;
  }

  return [
    ...cleared,
    {
      emoji,
      count: 1,
      user_reacted: true,
      user_ids: hasUser ? [userId] : [],
      users: hasUser
        ? [
            {
              id: userId,
              username: currentUser?.username || `user${userId}`,
              display_name: currentUser?.display_name || currentUser?.username || `User ${userId}`,
              is_self: true,
            },
          ]
        : [],
    },
  ];
}
