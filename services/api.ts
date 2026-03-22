import axios, { AxiosHeaders } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;

const normalizeBaseUrl = (url: string) => {
  const trimmed = url.trim().replace(/\/$/, '');
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
};

const getExpoDevHost = () => {
  // Expo SDK 54 can expose host information via these fields depending on runtime.
  const hostCandidates = [
    Constants.expoConfig?.hostUri,
    (Constants as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2?.extra?.expoGo?.debuggerHost,
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost,
  ];

  for (const candidate of hostCandidates) {
    if (!candidate) continue;
    const host = String(candidate).split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }

  return null;
};

const getDevApiBaseUrl = () => {
  if (configuredApiUrl) return normalizeBaseUrl(configuredApiUrl);

  const expoHost = getExpoDevHost();
  if (expoHost) {
    return `http://${expoHost}:3001`;
  }

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
});

function isFormDataLike(data: unknown) {
  if (!data) return false;
  if (typeof FormData !== 'undefined' && data instanceof FormData) return true;
  // React Native FormData polyfill often exposes _parts.
  return Boolean((data as { _parts?: unknown })._parts);
}

api.interceptors.request.use(async (config) => {
  const headers = AxiosHeaders.from(config.headers);

  // React Native Android can fail to infer multipart correctly unless this header is explicit.
  if (isFormDataLike(config.data)) {
    if (Platform.OS === 'android') {
      headers.set('Content-Type', 'multipart/form-data');
    } else {
      headers.delete('Content-Type');
      headers.delete('content-type');
    }
  }

  const token = await AsyncStorage.getItem('pawprint_token');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  config.headers = headers;
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
