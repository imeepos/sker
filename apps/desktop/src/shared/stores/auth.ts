// 认证状态管理
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/shared/types';
import { STORAGE_KEYS } from '@/shared/utils/constants';

interface AuthState {
  // 状态
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;

  // 动作
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  updateUserProfile: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,

      // 动作实现
      setAuth: (token, user) => {
        set({
          isAuthenticated: true,
          token,
          user,
          isLoading: false,
        });
      },

      setUser: user => {
        set({ user });
      },

      setLoading: loading => {
        set({ isLoading: loading });
      },

      clearAuth: () => {
        set({
          isAuthenticated: false,
          token: null,
          user: null,
          isLoading: false,
        });
      },

      updateUserProfile: updates => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          });
        }
      },
    }),
    {
      name: STORAGE_KEYS.AUTH_TOKEN,
      partialize: state => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// 选择器函数
export const authSelectors = {
  isAuthenticated: (state: AuthState) => state.isAuthenticated,
  user: (state: AuthState) => state.user,
  token: (state: AuthState) => state.token,
  isLoading: (state: AuthState) => state.isLoading,
  userId: (state: AuthState) => state.user?.id,
  userEmail: (state: AuthState) => state.user?.email,
  userName: (state: AuthState) => state.user?.name,
};
