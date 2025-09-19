// 应用常量定义

// API 相关常量
export const API_CONSTANTS = {
  TIMEOUT: 30000, // 30秒超时
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;

// 分页常量
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 10,
} as const;

// 文件上传常量
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ],
} as const;

// 主题常量
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// 路由常量
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CHAT: '/chat',
  AGENTS: '/agents',
  PROJECTS: '/projects',
  SETTINGS: '/settings',
  PROFILE: '/profile',
} as const;

// 存储键常量
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  LAST_CONVERSATION_ID: 'last_conversation_id',
} as const;

// 错误代码常量
export const ERROR_CODES = {
  // 认证相关
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // 网络相关
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',

  // 业务相关
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',

  // 系统相关
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  MAINTENANCE: 'MAINTENANCE',
} as const;

// 状态常量
export const STATUS = {
  // 通用状态
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',

  // 任务状态
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',

  // 用户状态
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BANNED: 'banned',

  // 项目状态
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done',
  ARCHIVED: 'archived',
} as const;

// 动画持续时间常量
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// 键盘快捷键常量
export const KEYBOARD_SHORTCUTS = {
  SAVE: 'Ctrl+S',
  COPY: 'Ctrl+C',
  PASTE: 'Ctrl+V',
  UNDO: 'Ctrl+Z',
  REDO: 'Ctrl+Y',
  SEARCH: 'Ctrl+F',
  NEW: 'Ctrl+N',
  OPEN: 'Ctrl+O',
  TOGGLE_SIDEBAR: 'Ctrl+B',
  TOGGLE_THEME: 'Ctrl+Shift+T',
} as const;

// 正则表达式常量
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^1[3-9]\d{9}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  USERNAME: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
  URL: /^https?:\/\/.+/,
} as const;
