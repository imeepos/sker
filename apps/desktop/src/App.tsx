import { useEffect } from 'react'
import { ConversationSidebar } from './components/chat/ConversationSidebar'
import { ChatWindow } from './components/chat/ChatWindow'
import { Button } from './components/ui/Button'
import { SettingsDialog } from './components/settings'
import { useChatStore } from './stores/chat'
import { useSettingsStore } from './stores/settings'
import { Bot, Settings } from 'lucide-react'
// 导入全局清理工具 - 确保在应用启动时清理旧的监听器
import './utils/globalCleanup'

function App() {
  const { loadConversations } = useChatStore()
  const { openSettings, loadSettings } = useSettingsStore()

  useEffect(() => {
    // 初始化时加载对话历史和设置
    loadConversations()
    loadSettings()
  }, [loadConversations, loadSettings])

  // 开发模式下的手动清理功能
  const handleManualCleanup = () => {
    if ((window as any).__CLEANUP_MANAGER__) {
      (window as any).__CLEANUP_MANAGER__.manualCleanup()
      console.log('手动清理完成')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* 顶部标题栏 */}
      <header className="shrink-0 border-b bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            <h1 className="font-semibold text-lg">Sker Code Assistant</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 开发模式下显示清理按钮 */}
            {import.meta.env.DEV && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleManualCleanup}
                title="清理旧监听器（开发模式）"
              >
                清理
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => openSettings()}
              title="打开设置"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧边栏 - 对话历史 */}
        <div className="w-80 border-r bg-card">
          <ConversationSidebar className="h-full border-0" />
        </div>

        {/* 主对话区域 */}
        <div className="flex-1 flex flex-col">
          <ChatWindow className="h-full border-0" />
        </div>
      </div>

      {/* 状态栏（可选） */}
      <footer className="shrink-0 border-t bg-muted/30 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>就绪</span>
          <span>Powered by Sker AI</span>
        </div>
      </footer>

      {/* 设置对话框 */}
      <SettingsDialog />
    </div>
  )
}

export default App
