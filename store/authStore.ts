import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

// Retry helper with exponential backoff for handling cold starts
const retryWithBackoff = async <T,>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  initialDelayMs = 1000
): Promise<T> => {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Only retry on network errors or timeouts, not auth errors (401, 409)
      const isRetryable =
        !error?.response?.status || // No response = network error
        error?.response?.status >= 500 || // Server error
        error?.code === 'ECONNABORTED' ||
        error?.message?.includes('timeout');

      if (!isRetryable || attempt === maxAttempts) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = initialDelayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

export interface PetProfile {
  id: number;
  name: string;
  breed: string;
  age: number;
  species: string;
  photo_url: string;
  weight_kg?: number;
  birthday?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  location_lat: number;
  location_lng: number;
  location_name: string;
  is_professional: boolean;
  professional_type?: string;
  points: number;
  follower_count: number;
  following_count: number;
  pet_profiles: PetProfile[];
  created_at: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  display_name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  hydrate: async () => {
    try {
      const [token, userJson] = await AsyncStorage.multiGet([
        'pawprint_token',
        'pawprint_user',
      ]);
      if (token[1] && userJson[1]) {
        set({
          token: token[1],
          user: JSON.parse(userJson[1]),
          isAuthenticated: true,
        });
      }
    } catch (_) {
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const { token, user } = await retryWithBackoff(() =>
      api.post('/auth/login', { email, password }).then((res) => res.data)
    );
    await AsyncStorage.multiSet([
      ['pawprint_token', token],
      ['pawprint_user', JSON.stringify(user)],
    ]);
    set({ token, user, isAuthenticated: true });
  },

  register: async (registerData) => {
    const { token, user } = await retryWithBackoff(() =>
      api.post('/auth/register', registerData).then((res) => res.data)
    );
    await AsyncStorage.multiSet([
      ['pawprint_token', token],
      ['pawprint_user', JSON.stringify(user)],
    ]);
    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['pawprint_token', 'pawprint_user']);
    set({ token: null, user: null, isAuthenticated: false });
  },

  updateUser: (updates) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...updates };
    set({ user: updated });
    AsyncStorage.setItem('pawprint_user', JSON.stringify(updated));
  },

  refreshUser: async () => {
    try {
      const { data } = await api.get('/users/me');
      set({ user: data.user });
      await AsyncStorage.setItem('pawprint_user', JSON.stringify(data.user));
    } catch (_) {}
  },
}));
