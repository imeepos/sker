import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 通知类型定义
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // 显示时长（毫秒），0 表示不自动关闭
  timestamp: number;
}

// 应用设置接口
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';
  autoSave: boolean;
  autoSaveInterval: number; // 自动保存间隔（分钟）
  showNotifications: boolean;
  soundEnabled: boolean;
}

// 应用状态接口
export interface AppState {
  // 通知系统
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // 应用设置
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // UI 状态
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // 加载状态
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

// 默认设置
const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'zh-CN',
  autoSave: true,
  autoSaveInterval: 5,
  showNotifications: true,
  soundEnabled: false,
};

/**
 * 全局应用状态存储
 * 使用 Zustand 管理应用级别的状态
 */
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 通知系统
      notifications: [],
      
      addNotification: (notification) => {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: Date.now(),
          duration: notification.duration ?? (notification.type === 'error' ? 0 : 5000),
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 10), // 最多保留10条通知
        }));

        // 自动移除通知（如果设置了duration且不为0）
        if (newNotification.duration && newNotification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, newNotification.duration);
        }
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      // 应用设置
      settings: defaultSettings,
      
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      // UI 状态
      sidebarCollapsed: false,
      
      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });
      },

      // 加载状态
      isLoading: false,
      
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'codex-app-store',
      // 只持久化设置和UI状态，不持久化通知和加载状态
      partialize: (state) => ({
        settings: state.settings,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);