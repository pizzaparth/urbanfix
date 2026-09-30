import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setAuthToken, hydrateAuthToken, getAuthToken } from '../services/api.js';

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

  // Keep the session honest with the server. Three things can change under a
  // signed-in user: their account is deactivated, their JWT lapses, or (researchers)
  // their access window ends. All are enforced server-side in `protect`; this is
  // just the client reacting so it doesn't sit on screens whose every call fails.
  useEffect(() => {
    const AUTH_URLS = ['/auth/login', '/auth/set-password', '/auth/verify-otp', '/auth/register'];
    const id = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error.response?.status;
        const code = error.response?.data?.code;
        const isAuthCall = AUTH_URLS.some((u) => error.config?.url?.startsWith(u));

        if (getAuthToken() && !isAuthCall) {
          if (code === 'ACCOUNT_DEACTIVATED' || status === 401) {
            await setAuthToken(null);
            await AsyncStorage.removeItem(USER_KEY);
            setUser(null);
          } else if (code === 'RESEARCH_ACCESS_EXPIRED') {
            setUser((u) =>
              u && u.role === 'researcher'
                ? { ...u, researcher: { ...u.researcher, accessExpiresAt: new Date(0).toISOString() } }
                : u
            );
          }
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(id);
  }, []);

  // Once a stored session is restored, ask the server who we are *now* — a
  // role change, deactivation or expiry since last launch shows up immediately
  // instead of after the first failing request.
  useEffect(() => {
    if (!user?.id || loading) return;
    let cancelled = false;
    api
      .get('/auth/me')
      .then(async (res) => {
        if (cancelled) return;
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
        setUser(res.data.user);
      })
      .catch(() => {
        // Offline or refused — the interceptor handles refusals; offline keeps the cached user.
      });
    return () => {
      cancelled = true;
    };
    // Only on (re)start of a session, not on every user object change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loading]);

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

  // First login for an invited employee / approved researcher.
  const setPasswordWithInvite = async (inviteToken, password) => {
    const response = await api.post('/auth/set-password', { inviteToken, password });
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
      value={{ user, loading, registerUser, verifyOtpCode, loginUser, setPasswordWithInvite, logoutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
