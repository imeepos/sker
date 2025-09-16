import { Label } from '../ui/label'
import { Button } from '../ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'
import { Slider } from '../ui/slider'
import { useSettingsStore } from '../../stores/settings'
import { ThemeMode, Language } from '../../types/settings'

export function AppearanceSettings() {
  const {
    settings,
    updateSettings,
    form,
    setFormDirty,
    isDarkMode,
  } = useSettingsStore()

  const handleThemeChange = (value: string) => {
    setFormDirty(true)
    updateSettings({
      section: 'appearance',
      settings: { theme: value as ThemeMode }
    })
  }

  const handleFontSizeChange = (value: number[]) => {
    setFormDirty(true)
    updateSettings({
      section: 'appearance',
      settings: { fontSize: value[0] }
    })
  }

  const handleFontFamilyChange = (value: string) => {
    setFormDirty(true)
    updateSettings({
      section: 'appearance',
      settings: { fontFamily: value }
    })
  }

  const handleLanguageChange = (value: string) => {
    setFormDirty(true)
    updateSettings({
      section: 'appearance',
      settings: { language: value as Language }
    })
  }

  const handleCompactModeChange = (checked: boolean) => {
    setFormDirty(true)
    updateSettings({
      section: 'appearance',
      settings: { compactMode: checked }
    })
  }

  const resetToDefaults = async () => {
    try {
      await updateSettings({
        section: 'appearance',
        settings: {
          theme: 'system',
          fontSize: 14,
          fontFamily: 'system-ui',
          language: 'zh-CN',
          compactMode: false,
        }
      })
    } catch (error) {
      console.error('重置外观设置失败:', error)
    }
  }

  const fontOptions = [
    { value: 'system-ui', label: '系统字体' },
    { value: '"SF Pro Display", system-ui', label: 'SF Pro Display' },
    { value: '"Microsoft YaHei", sans-serif', label: '微软雅黑' },
    { value: '"Segoe UI", system-ui', label: 'Segoe UI' },
    { value: 'Inter, sans-serif', label: 'Inter' },
    { value: '"Source Han Sans", sans-serif', label: '思源黑体' },
    { value: 'monospace', label: '等宽字体' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">外观主题</h3>
        <p className="text-sm text-muted-foreground">
          自定义应用的外观和视觉效果
        </p>
      </div>

      {/* 当前主题状态显示 */}
      <div className="p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">当前主题状态</span>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-white border'}`} />
            <span className="text-sm text-muted-foreground">
              {isDarkMode ? '深色模式' : '浅色模式'}
            </span>
          </div>
        </div>
      </div>

      {/* 主题模式选择 */}
      <div className="space-y-2">
        <Label>主题模式</Label>
        <Select
          value={settings.appearance.theme}
          onValueChange={handleThemeChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">浅色模式</SelectItem>
            <SelectItem value="dark">深色模式</SelectItem>
            <SelectItem value="system">跟随系统</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          选择应用的主题外观，"跟随系统"会根据系统设置自动切换
        </p>
      </div>

      {/* 字体大小 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>字体大小</Label>
          <span className="text-sm text-muted-foreground">
            {settings.appearance.fontSize}px
          </span>
        </div>
        <Slider
          value={[settings.appearance.fontSize]}
          onValueChange={handleFontSizeChange}
          min={12}
          max={20}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>小</span>
          <span>标准</span>
          <span>大</span>
        </div>
      </div>

      {/* 字体系列 */}
      <div className="space-y-2">
        <Label>字体系列</Label>
        <Select
          value={settings.appearance.fontFamily}
          onValueChange={handleFontFamilyChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontOptions.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <span style={{ fontFamily: font.value }}>
                  {font.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          选择应用使用的字体系列，会影响整体的文字显示效果
        </p>
      </div>

      {/* 语言设置 */}
      <div className="space-y-2">
        <Label>界面语言</Label>
        <Select
          value={settings.appearance.language}
          onValueChange={handleLanguageChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="zh-CN">简体中文</SelectItem>
            <SelectItem value="en-US">English</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          选择应用界面显示的语言（重启后生效）
        </p>
      </div>

      {/* 紧凑模式 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>紧凑模式</Label>
          <p className="text-xs text-muted-foreground">
            减少界面间距，显示更多内容
          </p>
        </div>
        <Switch
          checked={settings.appearance.compactMode}
          onCheckedChange={handleCompactModeChange}
        />
      </div>

      {/* 预览区域 */}
      <div className="space-y-2">
        <Label>预览效果</Label>
        <div 
          className="p-4 border rounded-lg bg-background"
          style={{
            fontSize: `${settings.appearance.fontSize}px`,
            fontFamily: settings.appearance.fontFamily,
          }}
        >
          <div className="space-y-2">
            <h4 className="font-semibold">示例对话</h4>
            <div className="text-muted-foreground">
              用户：你好，请帮我写一个简单的函数。
            </div>
            <div className="text-foreground">
              助手：当然可以！请告诉我您需要什么功能的函数，我会为您编写一个简洁明了的实现。
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2 pt-4 border-t">
        <Button
          variant="outline"
          onClick={resetToDefaults}
          disabled={form.isLoading}
        >
          恢复默认设置
        </Button>
        
        <div className="flex-1" />
        
        {form.error && (
          <span className="text-sm text-destructive self-center">
            {form.error}
          </span>
        )}
        
        {form.isLoading && (
          <span className="text-sm text-muted-foreground self-center">
            正在保存...
          </span>
        )}
      </div>
    </div>
  )
}