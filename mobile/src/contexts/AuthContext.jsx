import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setAuthToken, hydrateAuthToken } from '../services/api.js';

// Ported from the web AuthContext. Two changes:
//   - the token lives in expo-secure-store (it's a credential), the user object in
//     AsyncStorage (it's just display data)
//   - both are async, so `loading` now genuinely gates the first render instead of
//     flipping synchronously
export const AuthContext = createContext();

const USER_KEY = 'user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          hydrateAuthToken(),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (storedToken && storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch {
        // Corrupt or unreadable storage shouldn't wedge the app at a spinner —
        // fall through to logged-out.
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const persistSession = async (token, userData) => {
    await setAuthToken(token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const registerUser = async (name, email, password, phone) => {
    const response = await api.post('/auth/register', { name, email, password, phone });
    return response.data;
  };

  const verifyOtpCode = async (email, otp) => {
    const response = await api.post('/auth/verify-otp', { email, otp });
    const { token, user: userData } = response.data;
    await persistSession(token, userData);
    return response.data;
  };

  const loginUser = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user: userData } = response.data;
    await persistSession(token, userData);
    return response.data;
  };

  const logoutUser = async () => {
    await setAuthToken(null);
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, registerUser, verifyOtpCode, loginUser, logoutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
