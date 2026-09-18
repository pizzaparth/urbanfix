import axios from 'axios';
import * as tokenStore from './tokenStore.js';

// Must be the machine's LAN IP when running on a physical device — `localhost`
// on a phone means the phone, not your dev machine. Set EXPO_PUBLIC_API_URL in
// mobile/.env (see .env.example).
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api';

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
