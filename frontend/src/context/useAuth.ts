import { useContext } from 'react';
import { AuthContext } from './AuthContext';

// Split into its own file so this exports only the hook — Fast Refresh can't hot-reload a file that mixes exports.
export function useAuth() {
  return useContext(AuthContext);
}
