// 主题类型
export type ThemeMode = 'light' | 'dark' | 'system'

// 语言类型
export type Language = 'zh-CN' | 'en-US'

// AI 模型提供商类型
export type ModelProvider = 'openai' | 'ollama' | 'anthropic'

// AI 模型配置
export interface ModelSettings {
  currentModel: string
  temperature: number
  maxTokens: number
  topP: number
  presencePenalty: number
  frequencyPenalty: number
}

// 外观设置
export interface AppearanceSettings {
  theme: ThemeMode
  fontSize: number
  fontFamily: string
  language: Language
  compactMode: boolean
}

// 对话设置
export interface ConversationSettings {
  maxHistoryMessages: number
  autoSave: boolean
  showTimestamp: boolean
  enableMarkdown: boolean
  enableCodeHighlight: boolean
  streamResponse: boolean
}

// 数据管理设置
export interface DataSettings {
  autoBackup: boolean
  backupInterval: number // 小时
  maxBackupFiles: number
  exportFormat: 'json' | 'markdown' | 'csv'
}

// API 配置类型
export type ApiProvider = 'openai' | 'custom' | 'anthropic'

// API 配置接口
export interface ApiConfig {
  provider: ApiProvider
  apiKey: string
  baseUrl?: string
  customName?: string // 自定义provider的显示名称
}

// MCP 服务器配置
export interface McpServerConfig {
  name: string
  command: string
  args: string[]
  env?: Record<string, string>
  startupTimeoutMs?: number
  enabled: boolean
}

// 系统设置
export interface SystemSettings {
  // API 配置
  apiConfig: ApiConfig
  
  // MCP 服务器配置
  mcpServers: McpServerConfig[]
  
  // 传统代理设置（用于网络代理，不是API代理）
  proxyEnabled: boolean
  proxyHost?: string
  proxyPort?: number
  proxyAuth?: {
    username: string
    password: string
  }
  
  // 兼容性：保留原有的apiKeys字段
  apiKeys: {
    openai?: string
    anthropic?: string
  }
  
  // 系统行为设置
  autoStart: boolean
  minimizeToTray: boolean
}

// 完整的应用设置
export interface AppSettings {
  model: ModelSettings
  appearance: AppearanceSettings
  conversation: ConversationSettings
  data: DataSettings
  system: SystemSettings
  version: string
  lastUpdated: number
}

// 设置更新请求
export interface UpdateSettingsRequest {
  section: keyof Omit<AppSettings, 'version' | 'lastUpdated'>
  settings: Partial<AppSettings[keyof Omit<AppSettings, 'version' | 'lastUpdated'>]>
}

// 设置导入/导出
export interface SettingsExport {
  settings: AppSettings
  exportedAt: number
  version: string
}

// 设置表单状态
export interface SettingsFormState {
  isOpen: boolean
  activeTab: 'model' | 'appearance' | 'conversation' | 'data' | 'system'
  isDirty: boolean
  isLoading: boolean
  error?: string
}

// 默认设置
export const DEFAULT_SETTINGS: AppSettings = {
  model: {
    currentModel: 'gpt-4',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1,
    presencePenalty: 0,
    frequencyPenalty: 0,
  },
  appearance: {
    theme: 'system',
    fontSize: 14,
    fontFamily: 'system-ui',
    language: 'zh-CN',
    compactMode: false,
  },
  conversation: {
    maxHistoryMessages: 50,
    autoSave: true,
    showTimestamp: true,
    enableMarkdown: true,
    enableCodeHighlight: true,
    streamResponse: true,
  },
  data: {
    autoBackup: true,
    backupInterval: 24,
    maxBackupFiles: 7,
    exportFormat: 'json',
  },
  system: {
    apiConfig: {
      provider: 'openai',
      apiKey: '',
    },
    mcpServers: [],
    proxyEnabled: false,
    apiKeys: {},
    autoStart: false,
    minimizeToTray: true,
  },
  version: '1.0.0',
  lastUpdated: Date.now(),
}