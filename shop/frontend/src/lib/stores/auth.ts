import { writable } from 'svelte/store';
import { api } from '../api';

interface AdminUser {
  id: number;
  username: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  token: typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null,
  user: null,
  isAuthenticated: false,
  loading: false
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,
    login: async (username: string, password: string) => {
      update(s => ({ ...s, loading: true }));
      try {
        const res = await api.login(username, password);
        const { token, user } = res.data;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('admin_token', token);
        }
        set({ token, user, isAuthenticated: true, loading: false });
        return true;
      } catch (err) {
        update(s => ({ ...s, loading: false }));
        throw err;
      }
    },
    logout: () => {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('admin_token');
      }
      set({ token: null, user: null, isAuthenticated: false, loading: false });
    },
    checkAuth: async () => {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null;
      if (!token) return;
      
      update(s => ({ ...s, loading: true }));
      try {
        const res = await api.getMe();
        update(s => ({ ...s, user: res.data, isAuthenticated: true, loading: false }));
      } catch (err) {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('admin_token');
        }
        set({ token: null, user: null, isAuthenticated: false, loading: false });
      }
    }
  };
}

export const auth = createAuthStore();
