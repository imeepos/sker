// 应用状态管理
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '@/shared/types';
import { STORAGE_KEYS, THEME } from '@/shared/utils/constants';

interface AppState {
  // UI 状态
  sidebarCollapsed: boolean;
  theme: Theme;

  // 应用状态
  isLoading: boolean;
  error: string | null;

  // 通知状态
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    timestamp: number;
  }>;

  // 动作
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: Theme) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // 通知动作
  addNotification: (
    notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态
      sidebarCollapsed: false,
      theme: THEME.SYSTEM as Theme,
      isLoading: false,
      error: null,
      notifications: [],

      // 动作实现
      toggleSidebar: () => {
        set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setSidebarCollapsed: collapsed => {
        set({ sidebarCollapsed: collapsed });
      },

      setTheme: theme => {
        set({ theme });

        // 更新 DOM 类名
        const root = document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === THEME.LIGHT) {
          root.classList.add('light');
        } else if (theme === THEME.DARK) {
          root.classList.add('dark');
        } else {
          // 系统主题
          const isDark = window.matchMedia(
            '(prefers-color-scheme: dark)'
          ).matches;
          root.classList.add(isDark ? 'dark' : 'light');
        }
      },

      setLoading: loading => {
        set({ isLoading: loading });
      },

      setError: error => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      // 通知动作
      addNotification: notification => {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNotification = {
          ...notification,
          id,
          timestamp: Date.now(),
        };

        set(state => ({
          notifications: [...state.notifications, newNotification],
        }));

        // 自动删除成功通知
        if (notification.type === 'success') {
          setTimeout(() => {
            get().removeNotification(id);
          }, 5000);
        }
      },

      removeNotification: id => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },
    }),
    {
      name: STORAGE_KEYS.USER_PREFERENCES,
      partialize: state => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);

// 选择器函数
export const appSelectors = {
  sidebarCollapsed: (state: AppState) => state.sidebarCollapsed,
  theme: (state: AppState) => state.theme,
  isLoading: (state: AppState) => state.isLoading,
  error: (state: AppState) => state.error,
  notifications: (state: AppState) => state.notifications,
  hasError: (state: AppState) => !!state.error,
  notificationCount: (state: AppState) => state.notifications.length,
};

// 主题监听器
if (typeof window !== 'undefined') {
  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleSystemThemeChange = () => {
    const { theme, setTheme } = useAppStore.getState();
    if (theme === THEME.SYSTEM) {
      setTheme(THEME.SYSTEM); // 重新应用系统主题
    }
  };

  mediaQuery.addEventListener('change', handleSystemThemeChange);

  // 初始化主题
  const { theme, setTheme } = useAppStore.getState();
  setTheme(theme);
}
