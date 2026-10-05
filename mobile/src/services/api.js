import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as tokenStore from './tokenStore.js';

const API_PORT = 5001; // must match PORT in backend/.env

// The backend runs on the same machine as Metro, so we reuse whatever host the
// app loaded its bundle from. That keeps working when the Mac's LAN IP changes
// (new Wi-Fi, DHCP lease) without editing .env. EXPO_PUBLIC_API_URL still wins
// when set, e.g. to point at a deployed backend.
const resolveDevHost = () => {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  }

  // hostUri looks like "172.25.233.111:8081" — the dev server the phone or
  // emulator connected to. Tunnel mode gives an *.exp.direct host instead,
  // which can't reach the backend; use EXPO_PUBLIC_API_URL for that case.
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost;
  const host = hostUri?.split(':')[0];

  if (!host || host === 'localhost' || host === '127.0.0.1') {
    // The Android emulator reaches the host machine through 10.0.2.2.
    return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  }
  return host;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${resolveDevHost()}:${API_PORT}/api`;

export const TOKEN_KEY = 'token';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Base URL for statically served uploads (images), derived from the API URL.
// The backend stores image paths and pdfReceiptUrl as root-relative strings
// ('/uploads/<file>'), so the client has to supply the host itself.
export const getUploadsBaseUrl = () => API_BASE_URL.replace(/\/api\/?$/, '');

// Token storage is async (keychain on device, localStorage on web), so we keep
// the token in module scope and hydrate it once at boot — that keeps the
// interceptor synchronous instead of making every request await a disk read.
let authToken = null;

export const setAuthToken = async (token) => {
  authToken = token;
  if (token) {
    await tokenStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await tokenStore.deleteItemAsync(TOKEN_KEY);
  }
};

export const getAuthToken = () => authToken;

// Called once from AuthContext on mount, before any authed request can fire.
export const hydrateAuthToken = async () => {
  authToken = await tokenStore.getItemAsync(TOKEN_KEY);
  return authToken;
};

api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
