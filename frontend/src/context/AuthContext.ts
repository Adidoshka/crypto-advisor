import { createContext } from 'react';

export interface AuthContextValue {
  token: string | null;
  name: string | null;
  hasPreferences: boolean;
  login: (token: string, name: string, hasPreferences: boolean) => void;
  completeOnboarding: () => void;
  logout: () => void;
}

// Kept apart from AuthProvider.tsx/useAuth.ts so this file exports only the context object, nothing else.
export const AuthContext = createContext<AuthContextValue>({
  token: null,
  name: null,
  hasPreferences: false,
  login: () => {},
  completeOnboarding: () => {},
  logout: () => {},
});
