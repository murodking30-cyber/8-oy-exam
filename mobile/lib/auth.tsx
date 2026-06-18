import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from './api';
import type { User } from './types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, phone: string, password: string) => Promise<{ contact: string }>;
  verify: (emailOrPhone: string, code: string) => Promise<void>;
  resendCode: (emailOrPhone: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => ({ contact: '' }),
  verify: async () => {},
  resendCode: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('user'),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (emailOrPhone: string, password: string) => {
    const res = await api.post<{ user: User; token: string }>('/auth/login', {
      emailOrPhone,
      password,
    });
    const { user: u, token: t } = res.data;
    await AsyncStorage.setItem('token', t);
    await AsyncStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
    router.replace('/(tabs)');
  }, []);

  const register = useCallback(async (fullName: string, email: string, phone: string, password: string) => {
    const res = await api.post<{ message: string; user?: User; token?: string; contact?: string }>('/auth/register', {
      fullName,
      email,
      phone,
      password,
    });
    if (res.data.token && res.data.user) {
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      router.replace('/(tabs)');
    }
    return { contact: res.data.contact ?? email };
  }, []);

  const verify = useCallback(async (emailOrPhone: string, code: string) => {
    const res = await api.post<{ user: User; token: string }>('/auth/verify', {
      emailOrPhone,
      code,
    });
    const { user: u, token: t } = res.data;
    await AsyncStorage.setItem('token', t);
    await AsyncStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
    router.replace('/(tabs)');
  }, []);

  const resendCode = useCallback(async (emailOrPhone: string) => {
    await api.post('/auth/resend-code', { emailOrPhone });
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.replace('/login');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, verify, resendCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
