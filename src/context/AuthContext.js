import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEY, SECURE_STORE_PASSWORD_KEY, ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const val = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      setIsAdmin(val === 'true');
    } catch {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }

  async function login(username, password) {
    let storedPassword = await SecureStore.getItemAsync(SECURE_STORE_PASSWORD_KEY);
    if (!storedPassword) storedPassword = DEFAULT_ADMIN_PASSWORD;

    if (username === ADMIN_USERNAME && password === storedPassword) {
      await SecureStore.setItemAsync(SECURE_STORE_KEY, 'true');
      setIsAdmin(true);
      return true;
    }
    return false;
  }

  async function logout() {
    await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
    setIsAdmin(false);
  }

  async function changePassword(currentPassword, newPassword) {
    let storedPassword = await SecureStore.getItemAsync(SECURE_STORE_PASSWORD_KEY);
    if (!storedPassword) storedPassword = DEFAULT_ADMIN_PASSWORD;
    if (currentPassword !== storedPassword) return false;
    await SecureStore.setItemAsync(SECURE_STORE_PASSWORD_KEY, newPassword);
    return true;
  }

  return (
    <AuthContext.Provider value={{ isAdmin, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
