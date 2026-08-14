import React, { useState, useCallback } from 'react';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [name, setName] = useState<string | null>(() => localStorage.getItem('name'));
  const [hasPreferences, setHasPreferences] = useState<boolean>(() => localStorage.getItem('hasPreferences') === 'true');

  const login = useCallback((t: string, n: string, hp: boolean) => {
    localStorage.setItem('token', t);
    localStorage.setItem('name', n);
    localStorage.setItem('hasPreferences', String(hp));
    setToken(t);
    setName(n);
    setHasPreferences(hp);
  }, []);

  // called once onboarding finishes so the route guard sees it without a fresh login
  const completeOnboarding = useCallback(() => {
    localStorage.setItem('hasPreferences', 'true');
    setHasPreferences(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    localStorage.removeItem('hasPreferences');
    setToken(null);
    setName(null);
    setHasPreferences(false);
  }, []);

  return (
    <AuthContext.Provider value={{ token, name, hasPreferences, login, completeOnboarding, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
