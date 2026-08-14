import React, { createContext, useContext, useState, useCallback } from 'react';

interface AuthContextValue {
  token: string | null;
  name: string | null;
  login: (token: string, name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  name: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [name, setName] = useState<string | null>(() => localStorage.getItem('name'));

  const login = useCallback((t: string, n: string) => {
    localStorage.setItem('token', t);
    localStorage.setItem('name', n);
    setToken(t);
    setName(n);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    setToken(null);
    setName(null);
  }, []);

  return <AuthContext.Provider value={{ token, name, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
