import { create } from 'zustand';
import api from '../services/api';

export interface NotificationItem {
  id: number;
  user_id: number;
  actor_id: number | null;
  type: 'like' | 'comment' | 'follow' | 'game_invite' | 'reply' | 'mention';
  ref_id: number | null;
  ref_type: string | null;
  is_read: boolean;
  created_at: string;
  actor: {
    id: number;
    username: string;
    display_name: string;
    avatar_url: string;
  } | null;
  post: {
    id: number;
    caption?: string;
    media_url?: string;
  } | null;
  event_group_request: {
    id: number;
    group_id: number;
    status: 'pending' | 'accepted' | 'declined';
    event_id: string;
    event_title: string;
    group_name: string;
    community_id: number | null;
  } | null;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAllRead: () => Promise<void>;
  receiveNotification: (notification: NotificationItem) => void;
  removeNotification: (notificationId: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/notifications');
      set({
        notifications: data.notifications ?? [],
        unreadCount: Number(data.unread_count ?? 0),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    const { data } = await api.get('/notifications?limit=1');
    set({ unreadCount: Number(data.unread_count ?? 0) });
  },

  markAllRead: async () => {
    await api.post('/notifications/read-all');
    set((state) => ({
      unreadCount: 0,
      notifications: state.notifications.map((notification) => ({
        ...notification,
        is_read: true,
      })),
    }));
  },

  receiveNotification: (notification) => {
    set((state) => {
      const exists = state.notifications.some((item) => item.id === notification.id);
      if (exists) return state;

      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + (notification.is_read ? 0 : 1),
      };
    });
  },

  removeNotification: (notificationId) => {
    set((state) => {
      const existing = state.notifications.find((item) => item.id === notificationId);
      return {
        notifications: state.notifications.filter((item) => item.id !== notificationId),
        unreadCount:
          existing && !existing.is_read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },
}));