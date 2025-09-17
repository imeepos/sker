import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { invoke } from '@tauri-apps/api/core'
import { 
  AppSettings, 
  SettingsFormState, 
  UpdateSettingsRequest,
  DEFAULT_SETTINGS 
} from '../types/settings'

interface SettingsState {
  // 设置数据
  settings: AppSettings
  
  // 表单状态
  form: SettingsFormState
  
  // 计算属性
  isDarkMode: boolean
  
  // 动作
  loadSettings: () => Promise<void>
  updateSettings: (request: UpdateSettingsRequest) => Promise<void>
  resetSettings: () => Promise<void>
  exportSettings: () => Promise<string>
  importSettings: (data: string) => Promise<void>
  
  // 表单操作
  openSettings: (tab?: SettingsFormState['activeTab']) => void
  closeSettings: () => void
  setActiveTab: (tab: SettingsFormState['activeTab']) => void
  setFormDirty: (dirty: boolean) => void
  setFormLoading: (loading: boolean) => void
  setFormError: (error?: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    settings: DEFAULT_SETTINGS,
    
    form: {
      isOpen: false,
      activeTab: 'model',
      isDirty: false,
      isLoading: false,
    },
    
    // 计算属性：根据主题设置判断是否为深色模式
    get isDarkMode() {
      const { theme } = get().settings.appearance
      if (theme === 'dark') return true
      if (theme === 'light') return false
      // system 模式下检查系统主题
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    },
    
    // 加载设置
    loadSettings: async () => {
      try {
        set(state => ({
          form: { ...state.form, isLoading: true, error: undefined }
        }))
        
        const loadedSettings = await invoke<AppSettings>('get_app_settings')
        
        // 深度合并设置，确保所有必需的属性都存在
        const mergedSettings = {
          ...DEFAULT_SETTINGS,
          ...loadedSettings,
          model: {
            ...DEFAULT_SETTINGS.model,
            ...loadedSettings.model
          },
          appearance: {
            ...DEFAULT_SETTINGS.appearance,
            ...loadedSettings.appearance
          },
          conversation: {
            ...DEFAULT_SETTINGS.conversation,
            ...loadedSettings.conversation
          },
          data: {
            ...DEFAULT_SETTINGS.data,
            ...loadedSettings.data
          },
          system: {
            ...DEFAULT_SETTINGS.system,
            ...loadedSettings.system,
            apiConfig: {
              ...DEFAULT_SETTINGS.system.apiConfig,
              ...loadedSettings.system?.apiConfig
            },
            apiKeys: {
              ...DEFAULT_SETTINGS.system.apiKeys,
              ...loadedSettings.system?.apiKeys
            },
            mcpServers: loadedSettings.system?.mcpServers || DEFAULT_SETTINGS.system.mcpServers
          }
        }
        
        set(state => ({
          settings: mergedSettings,
          form: { ...state.form, isLoading: false }
        }))
      } catch (error) {
        console.error('加载设置失败:', error)
        set(state => ({
          form: { 
            ...state.form, 
            isLoading: false,
            error: `加载设置失败: ${error}`
          }
        }))
      }
    },
    
    // 更新设置
    updateSettings: async (request: UpdateSettingsRequest) => {
      try {
        set(state => ({
          form: { ...state.form, isLoading: true, error: undefined }
        }))
        
        await invoke('update_app_settings', { request })
        
        // 更新本地状态
        set(state => ({
          settings: {
            ...state.settings,
            [request.section]: {
              ...state.settings[request.section],
              ...request.settings
            },
            lastUpdated: Date.now()
          },
          form: { 
            ...state.form, 
            isLoading: false,
            isDirty: false 
          }
        }))
      } catch (error) {
        console.error('更新设置失败:', error)
        set(state => ({
          form: { 
            ...state.form, 
            isLoading: false,
            error: `更新设置失败: ${error}`
          }
        }))
        throw error
      }
    },
    
    // 重置设置
    resetSettings: async () => {
      try {
        set(state => ({
          form: { ...state.form, isLoading: true, error: undefined }
        }))
        
        await invoke('reset_app_settings')
        
        set(state => ({
          settings: { ...DEFAULT_SETTINGS, lastUpdated: Date.now() },
          form: { 
            ...state.form, 
            isLoading: false,
            isDirty: false 
          }
        }))
      } catch (error) {
        console.error('重置设置失败:', error)
        set(state => ({
          form: { 
            ...state.form, 
            isLoading: false,
            error: `重置设置失败: ${error}`
          }
        }))
        throw error
      }
    },
    
    // 导出设置
    exportSettings: async () => {
      try {
        const exportData = await invoke<string>('export_app_settings')
        return exportData
      } catch (error) {
        console.error('导出设置失败:', error)
        throw error
      }
    },
    
    // 导入设置
    importSettings: async (data: string) => {
      try {
        set(state => ({
          form: { ...state.form, isLoading: true, error: undefined }
        }))
        
        const importedSettings = await invoke<AppSettings>('import_app_settings', { data })
        
        set(state => ({
          settings: importedSettings,
          form: { 
            ...state.form, 
            isLoading: false,
            isDirty: false 
          }
        }))
      } catch (error) {
        console.error('导入设置失败:', error)
        set(state => ({
          form: { 
            ...state.form, 
            isLoading: false,
            error: `导入设置失败: ${error}`
          }
        }))
        throw error
      }
    },
    
    // 打开设置对话框
    openSettings: (tab = 'model') => {
      set(state => ({
        form: {
          ...state.form,
          isOpen: true,
          activeTab: tab,
          error: undefined
        }
      }))
    },
    
    // 关闭设置对话框
    closeSettings: () => {
      set(state => ({
        form: {
          ...state.form,
          isOpen: false,
          isDirty: false,
          error: undefined
        }
      }))
    },
    
    // 设置活跃标签页
    setActiveTab: (tab) => {
      set(state => ({
        form: { ...state.form, activeTab: tab }
      }))
    },
    
    // 设置表单脏状态
    setFormDirty: (dirty) => {
      set(state => ({
        form: { ...state.form, isDirty: dirty }
      }))
    },
    
    // 设置加载状态
    setFormLoading: (loading) => {
      set(state => ({
        form: { ...state.form, isLoading: loading }
      }))
    },
    
    // 设置错误信息
    setFormError: (error) => {
      set(state => ({
        form: { ...state.form, error }
      }))
    }
  }))
)

// 监听系统主题变化（仅在 system 模式下）
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', () => {
    const store = useSettingsStore.getState()
    if (store.settings.appearance.theme === 'system') {
      // 触发重新渲染以更新 isDarkMode 计算属性
      useSettingsStore.setState({})
    }
  })
}