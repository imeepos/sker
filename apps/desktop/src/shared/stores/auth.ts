import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  AuthState, 
  AuthResponse,
  CurrentUser 
} from '../types/auth';

/**
 * 认证状态管理
 * 基于Zustand的持久化认证状态
 * 
 * 注意：API调用和状态管理由React Query负责
 * 这里只负责存储认证信息和基本状态操作
 */
interface AuthStore extends AuthState {
  // 操作方法
  setAuth: (response: AuthResponse) => void;
  setUser: (user: CurrentUser) => void;
  clearAuth: () => void;
  isTokenExpired: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,

      // 设置认证信息
      setAuth: (response: AuthResponse) => {
        const expiresAt = new Date(Date.now() + response.expires_in * 1000);
        set({
          isAuthenticated: true,
          user: response.user,
          token: response.token,
          refreshToken: response.refresh_token,
          expiresAt,
        });
      },

      // 设置用户信息
      setUser: (user: CurrentUser) => {
        set({ user });
      },

      // 清除认证信息
      clearAuth: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          refreshToken: null,
          expiresAt: null,
        });
      },

      // 检查Token是否过期
      isTokenExpired: () => {
        const { expiresAt } = get();
        if (!expiresAt) return true;
        
        const now = new Date();
        const expires = new Date(expiresAt);
        const isExpired = now >= expires;
        
        // 如果token过期，异步清除认证状态避免渲染中的状态更新
        if (isExpired) {
          setTimeout(() => {
            const { clearAuth } = get();
            clearAuth();
          }, 0);
        }
        
        return isExpired;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);