import { create } from 'zustand';
import api from '../services/api';

export interface PointsTransaction {
  id: number;
  action: string;
  amount: number;
  created_at: string;
}

export interface Reward {
  id: number;
  title: string;
  description: string;
  points_cost: number;
  reward_type?: 'badge' | 'contest_boost' | 'perk';
  icon_emoji?: string;
  image_url?: string;
  redeemed: boolean;
}

interface PointsState {
  totalPoints: number;
  transactions: PointsTransaction[];
  rewards: Reward[];
  isLoading: boolean;

  fetchPoints: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchRewards: () => Promise<void>;
  redeemReward: (rewardId: number) => Promise<void>;
  addPoints: (amount: number, action: string) => void;
}

export const usePointsStore = create<PointsState>((set, get) => ({
  totalPoints: 0,
  transactions: [],
  rewards: [],
  isLoading: false,

  fetchPoints: async () => {
    const { data } = await api.get('/points/me');
    set({ totalPoints: data.points });
  },

  fetchTransactions: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/points/transactions');
      set({ transactions: data.transactions });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchRewards: async () => {
    const { data } = await api.get('/points/rewards');
    set({ rewards: data.rewards });
  },

  redeemReward: async (rewardId) => {
    const reward = get().rewards.find((r) => r.id === rewardId);
    if (!reward) return;
    await api.post(`/points/rewards/${rewardId}/redeem`);
    set({
      totalPoints: get().totalPoints - reward.points_cost,
      rewards: get().rewards.map((r) =>
        r.id === rewardId ? { ...r, redeemed: true } : r
      ),
    });
  },

  addPoints: (amount, action) => {
    set({ totalPoints: get().totalPoints + amount });
  },
}));
