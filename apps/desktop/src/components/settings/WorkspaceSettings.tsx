import { useState, useEffect } from 'react'
import { Button } from '../../shared/components/ui/Button'
import { FolderPicker } from '../../shared/components/ui/folder-picker'
import { Input } from '../../shared/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '../../shared/components/ui/card'
import { useToast } from '../../shared/hooks/useToast'

interface WorkspaceSettings {
  defaultWorkspacePath: string
  projectNameTemplate: string
  autoCreateProjectFolder: boolean
  enableGitIntegration: boolean
}

/**
 * 工作空间设置组件
 * 用户可以配置默认工作空间路径和项目创建选项
 */
export function WorkspaceSettings() {
  const { success, error: showError } = useToast()
  const [settings, setSettings] = useState<WorkspaceSettings>({
    defaultWorkspacePath: '',
    projectNameTemplate: '{name}',
    autoCreateProjectFolder: true,
    enableGitIntegration: true
  })
  const [isSaving, setIsSaving] = useState(false)

  // 加载设置
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // TODO: 从 Tauri 存储或 API 加载设置
      // const savedSettings = await invoke('get_workspace_settings')
      // setSettings(savedSettings)
    } catch (error) {
      console.error('加载工作空间设置失败:', error)
    }
  }

  const handleSettingChange = <K extends keyof WorkspaceSettings>(
    key: K,
    value: WorkspaceSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      // TODO: 保存设置到 Tauri 存储或 API
      // await invoke('save_workspace_settings', { settings })
      
      success('设置已保存', '工作空间设置已成功保存')
    } catch (error) {
      console.error('保存工作空间设置失败:', error)
      showError('保存失败', '无法保存工作空间设置，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSettings({
      defaultWorkspacePath: '',
      projectNameTemplate: '{name}',
      autoCreateProjectFolder: true,
      enableGitIntegration: true
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">工作空间设置</h2>
        <p className="mt-1 text-gray-600">
          配置项目工作空间的默认行为和路径
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>默认路径设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              默认工作空间路径
            </label>
            <FolderPicker
              value={settings.defaultWorkspacePath}
              onChange={(path) => handleSettingChange('defaultWorkspacePath', path)}
              placeholder="选择默认工作空间路径"
            />
            <p className="mt-1 text-sm text-gray-500">
              新项目将默认创建在此路径下
            </p>
          </div>

          <div>
            <label htmlFor="projectNameTemplate" className="block text-sm font-medium text-gray-700 mb-2">
              项目文件夹命名模板
            </label>
            <Input
              id="projectNameTemplate"
              value={settings.projectNameTemplate}
              onChange={(e) => handleSettingChange('projectNameTemplate', e.target.value)}
              placeholder="{name}"
            />
            <p className="mt-1 text-sm text-gray-500">
              使用 {'{name}'} 代表项目名称，{'{date}'} 代表当前日期
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>项目创建选项</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                自动创建项目文件夹
              </label>
              <p className="text-sm text-gray-500">
                创建项目时自动在工作空间中创建对应文件夹
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoCreateProjectFolder}
              onChange={(e) => handleSettingChange('autoCreateProjectFolder', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                启用Git集成
              </label>
              <p className="text-sm text-gray-500">
                自动检测并同步Git仓库状态
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableGitIntegration}
              onChange={(e) => handleSettingChange('enableGitIntegration', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
        >
          重置
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : '保存设置'}
        </Button>
      </div>
    </div>
  )
}