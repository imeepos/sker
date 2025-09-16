import { useState } from 'react'
import { Label } from '../ui/label'
import { Button } from '../ui/Button'
import { Switch } from '../ui/switch'
import { Slider } from '../ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useSettingsStore } from '../../stores/settings'
import { useChatStore } from '../../stores/chat'
import { Download, Upload, Trash2, Database } from 'lucide-react'

export function DataSettings() {
  const {
    settings,
    updateSettings,
    form,
    setFormDirty,
    exportSettings,
    importSettings,
  } = useSettingsStore()

  const { conversations } = useChatStore()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleAutoBackupChange = (checked: boolean) => {
    setFormDirty(true)
    updateSettings({
      section: 'data',
      settings: { autoBackup: checked }
    })
  }

  const handleBackupIntervalChange = (value: number[]) => {
    setFormDirty(true)
    updateSettings({
      section: 'data',
      settings: { backupInterval: value[0] }
    })
  }

  const handleMaxBackupFilesChange = (value: number[]) => {
    setFormDirty(true)
    updateSettings({
      section: 'data',
      settings: { maxBackupFiles: value[0] }
    })
  }

  const handleExportFormatChange = (value: string) => {
    setFormDirty(true)
    updateSettings({
      section: 'data',
      settings: { exportFormat: value as 'json' | 'markdown' | 'csv' }
    })
  }

  // 导出设置
  const handleExportSettings = async () => {
    try {
      setIsExporting(true)
      const exportData = await exportSettings()
      
      // 创建下载链接
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sker-settings-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('导出设置失败:', error)
    } finally {
      setIsExporting(false)
    }
  }

  // 导入设置
  const handleImportSettings = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        setIsImporting(true)
        const text = await file.text()
        await importSettings(text)
      } catch (error) {
        console.error('导入设置失败:', error)
      } finally {
        setIsImporting(false)
      }
    }
    input.click()
  }

  // 导出对话数据
  const handleExportConversations = async () => {
    try {
      setIsExporting(true)
      
      let exportData: string
      const timestamp = new Date().toISOString().split('T')[0]
      let filename: string

      switch (settings.data.exportFormat) {
        case 'json':
          exportData = JSON.stringify(conversations, null, 2)
          filename = `sker-conversations-${timestamp}.json`
          break
        case 'markdown':
          exportData = conversations.map(conv => {
            const messages = conv.messages.map(msg => 
              `## ${msg.role === 'user' ? '用户' : 'AI助手'}\n\n${msg.content}\n`
            ).join('\n')
            return `# ${conv.title}\n\n${messages}`
          }).join('\n---\n\n')
          filename = `sker-conversations-${timestamp}.md`
          break
        case 'csv':
          const csvHeader = 'ID,标题,角色,内容,时间\n'
          const csvRows = conversations.flatMap(conv =>
            conv.messages.map(msg =>
              `"${conv.id}","${conv.title}","${msg.role}","${msg.content.replace(/"/g, '""')}","${new Date(msg.timestamp).toLocaleString()}"`
            )
          )
          exportData = csvHeader + csvRows.join('\n')
          filename = `sker-conversations-${timestamp}.csv`
          break
        default:
          throw new Error('不支持的导出格式')
      }

      const blob = new Blob([exportData], { 
        type: settings.data.exportFormat === 'json' ? 'application/json' : 'text/plain' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('导出对话失败:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const resetToDefaults = async () => {
    try {
      await updateSettings({
        section: 'data',
        settings: {
          autoBackup: true,
          backupInterval: 24,
          maxBackupFiles: 7,
          exportFormat: 'json',
        }
      })
    } catch (error) {
      console.error('重置数据设置失败:', error)
    }
  }

  const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">数据管理</h3>
        <p className="text-sm text-muted-foreground">
          管理对话数据的备份、导出和存储选项
        </p>
      </div>

      {/* 数据统计 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-muted/30 rounded-lg border text-center">
          <Database className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <div className="text-2xl font-bold">{conversations.length}</div>
          <div className="text-xs text-muted-foreground">对话总数</div>
        </div>
        <div className="p-4 bg-muted/30 rounded-lg border text-center">
          <div className="text-2xl font-bold">{totalMessages}</div>
          <div className="text-xs text-muted-foreground">消息总数</div>
        </div>
        <div className="p-4 bg-muted/30 rounded-lg border text-center">
          <div className="text-2xl font-bold">~</div>
          <div className="text-xs text-muted-foreground">数据库大小</div>
        </div>
      </div>

      {/* 自动备份 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>自动备份</Label>
          <p className="text-xs text-muted-foreground">
            定期自动备份对话数据到本地文件
          </p>
        </div>
        <Switch
          checked={settings.data.autoBackup}
          onCheckedChange={handleAutoBackupChange}
        />
      </div>

      {/* 备份间隔 */}
      {settings.data.autoBackup && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>备份间隔</Label>
            <span className="text-sm text-muted-foreground">
              {settings.data.backupInterval} 小时
            </span>
          </div>
          <Slider
            value={[settings.data.backupInterval]}
            onValueChange={handleBackupIntervalChange}
            min={1}
            max={168}
            step={1}
            className="w-full"
          />
        </div>
      )}

      {/* 最大备份文件数 */}
      {settings.data.autoBackup && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>保留备份数量</Label>
            <span className="text-sm text-muted-foreground">
              {settings.data.maxBackupFiles} 个
            </span>
          </div>
          <Slider
            value={[settings.data.maxBackupFiles]}
            onValueChange={handleMaxBackupFilesChange}
            min={1}
            max={30}
            step={1}
            className="w-full"
          />
        </div>
      )}

      {/* 导出格式 */}
      <div className="space-y-2">
        <Label>默认导出格式</Label>
        <Select
          value={settings.data.exportFormat}
          onValueChange={handleExportFormatChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="json">JSON 格式</SelectItem>
            <SelectItem value="markdown">Markdown 格式</SelectItem>
            <SelectItem value="csv">CSV 格式</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          选择导出对话数据时的默认格式
        </p>
      </div>

      {/* 数据操作 */}
      <div className="space-y-4">
        <Label>数据操作</Label>
        
        <div className="space-y-3">
          {/* 导出设置 */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">导出应用设置</div>
              <div className="text-xs text-muted-foreground">
                导出当前的所有应用设置配置
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSettings}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? '导出中...' : '导出'}
            </Button>
          </div>

          {/* 导入设置 */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">导入应用设置</div>
              <div className="text-xs text-muted-foreground">
                从备份文件恢复应用设置
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportSettings}
              disabled={isImporting}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? '导入中...' : '导入'}
            </Button>
          </div>

          {/* 导出对话 */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">导出对话数据</div>
              <div className="text-xs text-muted-foreground">
                导出所有对话记录为 {settings.data.exportFormat.toUpperCase()} 格式
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportConversations}
              disabled={isExporting || conversations.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? '导出中...' : '导出'}
            </Button>
          </div>

          {/* 清空数据 */}
          <div className="flex items-center justify-between p-3 border rounded-lg border-destructive/50">
            <div>
              <div className="font-medium text-destructive">清空所有数据</div>
              <div className="text-xs text-muted-foreground">
                ⚠️ 此操作不可恢复，请谨慎操作
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => {
                if (confirm('确定要清空所有对话数据吗？此操作不可恢复！')) {
                  // TODO: 实现清空数据功能
                  console.log('清空所有数据')
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              清空
            </Button>
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