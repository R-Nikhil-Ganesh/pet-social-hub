import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

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
    const { data } = await api.post('/auth/login', { email, password });
    await AsyncStorage.multiSet([
      ['pawprint_token', data.token],
      ['pawprint_user', JSON.stringify(data.user)],
    ]);
    set({ token: data.token, user: data.user, isAuthenticated: true });
  },

  register: async (registerData) => {
    const { data } = await api.post('/auth/register', registerData);
    await AsyncStorage.multiSet([
      ['pawprint_token', data.token],
      ['pawprint_user', JSON.stringify(data.user)],
    ]);
    set({ token: data.token, user: data.user, isAuthenticated: true });
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
