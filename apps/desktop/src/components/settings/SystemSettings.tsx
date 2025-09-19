import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/Button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'
import { useSettingsStore } from '../../stores/settings'
import { ApiProvider, ApiConfig } from '../../types/settings'
import { McpServerManager } from './McpServerManager'
import { Save, Eye, EyeOff, TestTube, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { checkForAppUpdates } from '../../lib/updater'

export function SystemSettings() {
  const { settings, updateSettings, setFormDirty, setFormError } = useSettingsStore()
  const [localApiConfig, setLocalApiConfig] = useState<ApiConfig>(settings.system.apiConfig)
  const [showApiKey, setShowApiKey] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'updating'>('idle')

  // 处理API配置变化
  const handleApiConfigChange = (field: keyof ApiConfig, value: string) => {
    const newConfig = { ...localApiConfig, [field]: value }
    setLocalApiConfig(newConfig)
    setFormDirty(true)
  }

  // 处理提供商变化
  const handleProviderChange = (provider: ApiProvider) => {
    const newConfig: ApiConfig = {
      provider,
      apiKey: localApiConfig.apiKey,
      baseUrl: provider === 'custom' ? localApiConfig.baseUrl || '' : undefined,
      customName: provider === 'custom' ? localApiConfig.customName || '自定义代理' : undefined,
    }
    setLocalApiConfig(newConfig)
    setFormDirty(true)
  }

  // 保存设置
  const handleSave = async () => {
    try {
      await updateSettings({
        section: 'system',
        settings: {
          apiConfig: localApiConfig,
        },
      })
      setFormError(undefined)
    } catch (error) {
      console.error('保存API配置失败:', error)
    }
  }

  // 测试API连接
  const handleTestConnection = async () => {
    setTestStatus('testing')
    setTestMessage('正在测试连接...')
    
    try {
      // 调用后端API测试连接
      const result = await invoke('test_api_connection', { config: localApiConfig })
      
      setTestStatus('success')
      setTestMessage(`连接测试成功！${result}`)
      
      setTimeout(() => {
        setTestStatus('idle')
        setTestMessage('')
      }, 3000)
    } catch (error) {
      setTestStatus('error')
      setTestMessage(`连接测试失败: ${error}`)
      
      setTimeout(() => {
        setTestStatus('idle')
        setTestMessage('')
      }, 5000)
    }
  }

  // 预设配置
  const presetConfigs = {
    openai: {
      name: 'OpenAI 官方',
      description: '使用 OpenAI 官方 API',
      baseUrl: 'https://api.openai.com/v1'
    },
    bowong: {
      name: 'Bowong 代理',
      description: '你的自定义代理服务器',
      baseUrl: 'https://gateway.bowong.cc/v1',
      token: 'auth-bowong7777'
    },
    anthropic: {
      name: 'Anthropic Claude',
      description: '使用 Anthropic Claude API',
      baseUrl: 'https://api.anthropic.com'
    }
  }

  // 快速配置
  const handleQuickConfig = (configKey: keyof typeof presetConfigs) => {
    const preset = presetConfigs[configKey]
    const newConfig: ApiConfig = {
      provider: configKey === 'bowong' ? 'custom' : configKey as ApiProvider,
      apiKey: configKey === 'bowong' ? (preset as any).token! : '',
      baseUrl: configKey === 'bowong' ? preset.baseUrl : undefined,
      customName: configKey === 'bowong' ? preset.name : undefined,
    }
    setLocalApiConfig(newConfig)
    setFormDirty(true)
  }

  // 检查应用更新
  const handleCheckForUpdates = async () => {
    setUpdateStatus('checking')
    try {
      await checkForAppUpdates()
    } catch (error) {
      console.error('检查更新失败:', error)
    } finally {
      setUpdateStatus('idle')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">系统设置</h3>
        <p className="text-muted-foreground">
          配置 API 密钥、代理设置和系统行为选项。
        </p>
      </div>

      {/* API 配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            API 配置
            {testStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {testStatus === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
          </CardTitle>
          <CardDescription>
            配置 AI 服务提供商和 API 密钥
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 快速配置按钮 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => handleQuickConfig('openai')}
              className="h-auto p-4 flex flex-col items-start"
            >
              <div className="font-medium">OpenAI 官方</div>
              <div className="text-xs text-muted-foreground">标准 OpenAI API</div>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickConfig('bowong')}
              className="h-auto p-4 flex flex-col items-start bg-blue-50 border-blue-200 hover:bg-blue-100"
            >
              <div className="font-medium text-blue-700">Bowong 代理</div>
              <div className="text-xs text-blue-600">你的自定义代理</div>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickConfig('anthropic')}
              className="h-auto p-4 flex flex-col items-start"
            >
              <div className="font-medium">Anthropic Claude</div>
              <div className="text-xs text-muted-foreground">Claude API</div>
            </Button>
          </div>

          {/* 提供商选择 */}
          <div className="space-y-2">
            <Label htmlFor="provider">API 提供商</Label>
            <Select
              value={localApiConfig.provider}
              onValueChange={(value) => handleProviderChange(value as ApiProvider)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择 API 提供商" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="custom">自定义代理</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 自定义名称 */}
          {localApiConfig.provider === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="customName">代理名称</Label>
              <Input
                id="customName"
                value={localApiConfig.customName || ''}
                onChange={(e) => handleApiConfigChange('customName', e.target.value)}
                placeholder="例如：Bowong 代理"
              />
            </div>
          )}

          {/* 自定义 Base URL */}
          {localApiConfig.provider === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="baseUrl">API 端点 URL</Label>
              <Input
                id="baseUrl"
                value={localApiConfig.baseUrl || ''}
                onChange={(e) => handleApiConfigChange('baseUrl', e.target.value)}
                placeholder="https://gateway.bowong.cc/v1"
              />
            </div>
          )}

          {/* API 密钥 */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">
              API 密钥 / Token
              {localApiConfig.provider === 'openai' && ' (sk-xxx...)'}
              {localApiConfig.provider === 'anthropic' && ' (sk-ant-xxx...)'}
              {localApiConfig.provider === 'custom' && ' (自定义格式)'}
            </Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={localApiConfig.apiKey}
                onChange={(e) => handleApiConfigChange('apiKey', e.target.value)}
                placeholder={
                  localApiConfig.provider === 'openai' ? 'sk-your-openai-api-key-here' :
                  localApiConfig.provider === 'anthropic' ? 'sk-ant-your-anthropic-key-here' :
                  'auth-bowong7777'
                }
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* 测试连接 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={!localApiConfig.apiKey || testStatus === 'testing'}
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                {testStatus === 'testing' ? '测试中...' : '测试连接'}
              </Button>
              {testMessage && (
                <span className={`text-sm ${
                  testStatus === 'success' ? 'text-green-600' : 
                  testStatus === 'error' ? 'text-red-600' : 
                  'text-muted-foreground'
                }`}>
                  {testMessage}
                </span>
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={!localApiConfig.apiKey}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              保存配置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 网络代理设置 */}
      <Card>
        <CardHeader>
          <CardTitle>网络代理</CardTitle>
          <CardDescription>
            配置网络代理服务器（用于网络访问，非 API 代理）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.system.proxyEnabled}
              onCheckedChange={(checked) => {
                updateSettings({
                  section: 'system',
                  settings: { proxyEnabled: checked }
                })
              }}
            />
            <Label>启用网络代理</Label>
          </div>
          
          {settings.system.proxyEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proxyHost">代理主机</Label>
                <Input
                  id="proxyHost"
                  value={settings.system.proxyHost || ''}
                  onChange={(e) => {
                    updateSettings({
                      section: 'system',
                      settings: { proxyHost: e.target.value }
                    })
                  }}
                  placeholder="127.0.0.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proxyPort">端口</Label>
                <Input
                  id="proxyPort"
                  type="number"
                  value={settings.system.proxyPort || ''}
                  onChange={(e) => {
                    updateSettings({
                      section: 'system',
                      settings: { proxyPort: parseInt(e.target.value) || undefined }
                    })
                  }}
                  placeholder="8080"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 系统行为 */}
      <Card>
        <CardHeader>
          <CardTitle>系统行为</CardTitle>
          <CardDescription>
            应用启动和运行相关设置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoStart">开机自启</Label>
              <div className="text-sm text-muted-foreground">
                系统启动时自动启动应用
              </div>
            </div>
            <Switch
              checked={settings.system.autoStart}
              onCheckedChange={(checked) => {
                updateSettings({
                  section: 'system',
                  settings: { autoStart: checked }
                })
              }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="minimizeToTray">最小化到托盘</Label>
              <div className="text-sm text-muted-foreground">
                关闭窗口时最小化到系统托盘
              </div>
            </div>
            <Switch
              checked={settings.system.minimizeToTray}
              onCheckedChange={(checked) => {
                updateSettings({
                  section: 'system',
                  settings: { minimizeToTray: checked }
                })
              }}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>应用更新</Label>
                <div className="text-sm text-muted-foreground">
                  检查并安装应用程序更新
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleCheckForUpdates}
                disabled={updateStatus === 'checking'}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${updateStatus === 'checking' ? 'animate-spin' : ''}`} />
                {updateStatus === 'checking' ? '检查中...' : '检查更新'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MCP 服务器管理 */}
      <McpServerManager />
    </div>
  )
}