import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

const API = '/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  role: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      role: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // 1. Try XAMPP API first
          try {
            const res = await fetch(`${API}?action=login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
              signal: AbortSignal.timeout(3000),
            });
            const json = await res.json();
            if (json.success) {
              const user = json.data as User;
              set({ user, isAuthenticated: true, role: user.role, isLoading: false, error: null });
              return true;
            }
          } catch { /* fall through to local */ }

          // 2. Fallback: local users array
          const { loginUser } = await import('@/data/queries');
          const user = loginUser(email, password);
          if (user) {
            set({ user, isAuthenticated: true, role: user.role, isLoading: false, error: null });
            return true;
          }

          // 3. Check localStorage for citizen signups
          try {
            const stored = localStorage.getItem('sk_citizens');
            if (stored) {
              const citizens: User[] = JSON.parse(stored);
              const found = citizens.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
              if (found) {
                set({ user: found, isAuthenticated: true, role: 'citizen', isLoading: false, error: null });
                return true;
              }
            }
          } catch { /* */ }

          set({ user: null, isAuthenticated: false, role: null, isLoading: false, error: 'Invalid email or password' });
          return false;
        } catch {
          set({ isLoading: false, error: 'Login failed. Please try again.' });
          return false;
        }
      },

      signup: async (name: string, email: string, phone: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // Try API first
          try {
            const res = await fetch(`${API}?action=signup`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, phone, password }),
              signal: AbortSignal.timeout(3000),
            });
            const json = await res.json();
            if (json.success) {
              const user = { ...json.data, role: 'citizen' as const, password: '' };
              set({ user, isAuthenticated: true, role: 'citizen', isLoading: false, error: null });
              return true;
            }
          } catch { /* fall through */ }

          // Fallback: save to localStorage
          const newUser: User = {
            user_id: 'CIT_' + Date.now(),
            name, email, phone, password, role: 'citizen',
          };
          try {
            const stored = localStorage.getItem('sk_citizens');
            const citizens: User[] = stored ? JSON.parse(stored) : [];
            // Check duplicate
            if (citizens.find(u => u.email.toLowerCase() === email.toLowerCase())) {
              set({ isLoading: false, error: 'Email already registered' });
              return false;
            }
            citizens.push(newUser);
            localStorage.setItem('sk_citizens', JSON.stringify(citizens));
          } catch { /* */ }

          const safeUser = { ...newUser, password: '' };
          set({ user: safeUser, isAuthenticated: true, role: 'citizen', isLoading: false, error: null });
          return true;
        } catch {
          set({ isLoading: false, error: 'Signup failed. Please try again.' });
          return false;
        }
      },

      logout: () => set({ user: null, isAuthenticated: false, role: null, error: null }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'suraksha-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated, role: state.role }),
    }
  )
);
