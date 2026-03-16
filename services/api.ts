import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;

const getDevApiBaseUrl = () => {
  if (configuredApiUrl) return configuredApiUrl;

  // In Expo dev, infer the host machine IP from Metro bundle URL.
  const scriptURL = NativeModules?.SourceCode?.scriptURL as string | undefined;
  const host = scriptURL?.match(/^https?:\/\/([^/:]+)/)?.[1];

  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:3001`;
  }

  // Android emulator cannot reach localhost on host machine directly.
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001';
  }

  return 'http://localhost:3001';
};

export const API_BASE_URL = __DEV__
  ? getDevApiBaseUrl()
  : 'https://your-pawprint-api.com';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('pawprint_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['pawprint_token', 'pawprint_user']);
    }
    return Promise.reject(error);
  }
);

export default api;
