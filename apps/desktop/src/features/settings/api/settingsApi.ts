// 设置 API 接口
import { invokeApi } from '@/shared/api/client';

/**
 * 应用设置
 */
export interface AppSettings {
  // 外观设置
  theme: 'light' | 'dark' | 'system';
  language: string;
  font_size: number;
  font_family: string;
  
  // 聊天设置
  chat: {
    default_model: string;
    max_history_messages: number;
    auto_save_conversations: boolean;
    show_word_count: boolean;
    send_with_enter: boolean;
  };
  
  // 智能体设置
  agents: {
    default_temperature: number;
    default_max_tokens: number;
    auto_load_templates: boolean;
    show_execution_time: boolean;
  };
  
  // 通知设置
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    email: boolean;
  };
  
  // 数据设置
  data: {
    auto_backup: boolean;
    backup_interval: number; // 小时
    export_format: 'json' | 'csv' | 'markdown';
    data_retention_days: number;
  };
  
  // 隐私设置
  privacy: {
    analytics: boolean;
    error_reporting: boolean;
    usage_statistics: boolean;
  };
  
  // 高级设置
  advanced: {
    debug_mode: boolean;
    api_timeout: number; // 秒
    max_concurrent_requests: number;
    custom_api_endpoint?: string;
  };
}

/**
 * 用户偏好设置
 */
export interface UserPreferences {
  // 工作区布局
  workspace: {
    sidebar_width: number;
    sidebar_collapsed: boolean;
    panel_layout: 'vertical' | 'horizontal';
    show_minimap: boolean;
  };
  
  // 快捷键
  shortcuts: Record<string, string>;
  
  // 最近使用
  recent: {
    conversations: string[];
    agents: string[];
    models: string[];
  };
  
  // 收藏夹
  favorites: {
    conversations: string[];
    agents: string[];
    prompts: string[];
  };
}

/**
 * 系统状态
 */
export interface SystemStatus {
  version: string;
  build: string;
  platform: string;
  uptime: number;
  memory_usage: number;
  disk_usage: number;
  network_status: 'online' | 'offline' | 'limited';
  last_backup?: number;
  last_update_check?: number;
}

/**
 * 更新设置请求
 */
export interface UpdateSettingsRequest {
  settings: Partial<AppSettings>;
}

/**
 * 更新偏好设置请求
 */
export interface UpdatePreferencesRequest {
  preferences: Partial<UserPreferences>;
}

/**
 * 导出数据选项
 */
export interface ExportDataOptions {
  format: 'json' | 'csv' | 'markdown';
  include_conversations: boolean;
  include_agents: boolean;
  include_settings: boolean;
  date_range?: {
    start: number;
    end: number;
  };
}

/**
 * 导入数据选项
 */
export interface ImportDataOptions {
  data: string;
  format: 'json' | 'csv';
  merge_strategy: 'overwrite' | 'merge' | 'skip';
}

/**
 * 设置 API 接口
 */
export const settingsApi = {
  /**
   * 获取应用设置
   */
  getSettings: (): Promise<AppSettings> =>
    invokeApi('settings_get'),

  /**
   * 更新应用设置
   */
  updateSettings: (request: UpdateSettingsRequest): Promise<AppSettings> =>
    invokeApi('settings_update', { request }),

  /**
   * 重置设置到默认值
   */
  resetSettings: (): Promise<AppSettings> =>
    invokeApi('settings_reset'),

  /**
   * 获取用户偏好设置
   */
  getPreferences: (): Promise<UserPreferences> =>
    invokeApi('settings_get_preferences'),

  /**
   * 更新用户偏好设置
   */
  updatePreferences: (request: UpdatePreferencesRequest): Promise<UserPreferences> =>
    invokeApi('settings_update_preferences', { request }),

  /**
   * 获取系统状态
   */
  getSystemStatus: (): Promise<SystemStatus> =>
    invokeApi('settings_get_system_status'),

  /**
   * 检查更新
   */
  checkUpdates: (): Promise<{
    available: boolean;
    version?: string;
    release_notes?: string;
    download_url?: string;
  }> =>
    invokeApi('settings_check_updates'),

  /**
   * 执行应用更新
   */
  performUpdate: (): Promise<void> =>
    invokeApi('settings_perform_update'),

  /**
   * 创建数据备份
   */
  createBackup: (): Promise<{
    backup_id: string;
    file_path: string;
    size: number;
    created_at: number;
  }> =>
    invokeApi('settings_create_backup'),

  /**
   * 恢复数据备份
   */
  restoreBackup: (backupId: string): Promise<void> =>
    invokeApi('settings_restore_backup', { backup_id: backupId }),

  /**
   * 获取备份列表
   */
  getBackups: (): Promise<Array<{
    backup_id: string;
    file_path: string;
    size: number;
    created_at: number;
  }>> =>
    invokeApi('settings_get_backups'),

  /**
   * 删除备份
   */
  deleteBackup: (backupId: string): Promise<void> =>
    invokeApi('settings_delete_backup', { backup_id: backupId }),

  /**
   * 导出数据
   */
  exportData: (options: ExportDataOptions): Promise<{
    file_path: string;
    size: number;
  }> =>
    invokeApi('settings_export_data', { options }),

  /**
   * 导入数据
   */
  importData: (options: ImportDataOptions): Promise<{
    imported_count: number;
    skipped_count: number;
    errors: string[];
  }> =>
    invokeApi('settings_import_data', { options }),

  /**
   * 清理缓存
   */
  clearCache: (): Promise<{
    cleared_size: number;
  }> =>
    invokeApi('settings_clear_cache'),

  /**
   * 获取日志文件
   */
  getLogs: (lines?: number): Promise<string[]> =>
    invokeApi('settings_get_logs', { lines: lines || 100 }),

  /**
   * 发送反馈
   */
  sendFeedback: (feedback: {
    type: 'bug' | 'feature' | 'general';
    title: string;
    description: string;
    email?: string;
    include_logs?: boolean;
  }): Promise<void> =>
    invokeApi('settings_send_feedback', { feedback }),

  /**
   * 获取使用统计
   */
  getUsageStats: (): Promise<{
    total_conversations: number;
    total_messages: number;
    total_agents: number;
    total_tokens: number;
    avg_daily_usage: number;
    most_used_features: string[];
  }> =>
    invokeApi('settings_get_usage_stats'),
} as const;