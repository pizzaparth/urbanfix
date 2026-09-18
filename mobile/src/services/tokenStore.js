import { Platform } from 'react-native';

// The auth token is a credential, so on a device it belongs in the OS keychain
// (iOS) / keystore (Android) via expo-secure-store. That module has no web
// implementation, so the browser falls back to localStorage.
//
// This fallback is for local browser testing only — localStorage is readable by
// any script on the origin, which is not where a real credential should live.
// Ship the app to a phone and the keychain path is the one that runs.
//
// expo-secure-store is required lazily so the native module is never pulled
// into the web bundle.
const webStore = {
  getItemAsync: async (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItemAsync: async (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* private mode / blocked storage — the session just won't persist */
    }
  },
  deleteItemAsync: async (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* nothing to clear */
    }
  },
};

const store = Platform.OS === 'web' ? webStore : require('expo-secure-store');

export const getItemAsync = (key) => store.getItemAsync(key);
export const setItemAsync = (key, value) => store.setItemAsync(key, value);
export const deleteItemAsync = (key) => store.deleteItemAsync(key);
