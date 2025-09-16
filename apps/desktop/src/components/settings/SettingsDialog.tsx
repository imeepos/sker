import { X } from 'lucide-react'
import { Button } from '../ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { useSettingsStore } from '../../stores/settings'
import { ModelSettings } from './ModelSettings'
import { AppearanceSettings } from './AppearanceSettings'
import { ConversationSettings } from './ConversationSettings'
import { DataSettings } from './DataSettings'
import { SystemSettings } from './SystemSettings'

export function SettingsDialog() {
  const {
    form,
    closeSettings,
    setActiveTab,
    isDarkMode,
  } = useSettingsStore()

  const handleClose = () => {
    if (form.isDirty) {
      // 可以在这里添加确认对话框
      if (confirm('有未保存的更改，确定要关闭吗？')) {
        closeSettings()
      }
    } else {
      closeSettings()
    }
  }

  return (
    <Dialog open={form.isOpen} onOpenChange={() => handleClose()}>
      <DialogContent className="max-w-4xl w-[90vw] h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">应用设置</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 flex min-h-0">
          <Tabs 
            value={form.activeTab} 
            onValueChange={(value) => setActiveTab(value as any)}
            className="flex flex-1"
          >
            {/* 左侧标签列表 */}
            <div className="w-48 flex-shrink-0 border-r border-border">
              <TabsList className="flex flex-col h-full w-full justify-start bg-transparent border-0 p-0 space-y-1">
                <TabsTrigger 
                  value="model" 
                  className="w-full justify-start px-4 py-3 text-left rounded-lg border-0 bg-transparent hover:bg-muted/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
                >
                  AI 模型
                </TabsTrigger>
                <TabsTrigger 
                  value="appearance" 
                  className="w-full justify-start px-4 py-3 text-left rounded-lg border-0 bg-transparent hover:bg-muted/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
                >
                  外观主题
                </TabsTrigger>
                <TabsTrigger 
                  value="conversation" 
                  className="w-full justify-start px-4 py-3 text-left rounded-lg border-0 bg-transparent hover:bg-muted/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
                >
                  对话设置
                </TabsTrigger>
                <TabsTrigger 
                  value="data" 
                  className="w-full justify-start px-4 py-3 text-left rounded-lg border-0 bg-transparent hover:bg-muted/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
                >
                  数据管理
                </TabsTrigger>
                <TabsTrigger 
                  value="system" 
                  className="w-full justify-start px-4 py-3 text-left rounded-lg border-0 bg-transparent hover:bg-muted/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
                >
                  系统设置
                </TabsTrigger>
              </TabsList>
            </div>

            {/* 右侧内容区域 */}
            <div className="flex-1 px-6 py-4 overflow-y-auto">
              <TabsContent value="model" className="mt-0">
                <ModelSettings />
              </TabsContent>
              
              <TabsContent value="appearance" className="mt-0">
                <AppearanceSettings />
              </TabsContent>
              
              <TabsContent value="conversation" className="mt-0">
                <ConversationSettings />
              </TabsContent>
              
              <TabsContent value="data" className="mt-0">
                <DataSettings />
              </TabsContent>
              
              <TabsContent value="system" className="mt-0">
                <SystemSettings />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* 底部状态栏 */}
        {(form.isLoading || form.error || form.isDirty) && (
          <div className="flex-shrink-0 border-t border-border px-6 py-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {form.isLoading && (
                  <span className="text-muted-foreground">正在保存设置...</span>
                )}
                {form.error && (
                  <span className="text-destructive">{form.error}</span>
                )}
                {form.isDirty && !form.isLoading && !form.error && (
                  <span className="text-muted-foreground">有未保存的更改</span>
                )}
              </div>
              
              <div className="text-muted-foreground">
                当前主题：{isDarkMode ? '深色' : '浅色'}模式
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}