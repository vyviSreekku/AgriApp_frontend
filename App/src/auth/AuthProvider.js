import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = '@app_user_v1';

export const AuthContext = createContext({ user: null, setUser: () => {}, signOut: async () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(USER_KEY);
        if (raw) setUser(JSON.parse(raw));
      } catch (e) {
        console.warn('Failed to restore user', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        else await AsyncStorage.removeItem(USER_KEY);
      } catch (e) {
        console.warn('Failed to persist user', e);
      }
    })();
  }, [user]);

  const signOut = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
