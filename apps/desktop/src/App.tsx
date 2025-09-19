import { useEffect, useState, useMemo } from 'react'
import { Button } from './components/ui/Button'
import { SettingsDialog } from './components/settings'
import { ThreeColumnLayout } from './components/chat-pro/ThreeColumnLayout'
import { AuthProvider, AuthGuard, useAuth } from './components/auth'
import { useChatStore } from './stores/chat'
import { useSettingsStore } from './stores/settings'
import { Bot, Settings, Layout, ArrowLeft, LogOut, User } from 'lucide-react'
import type { Conversation as ChatProConversation } from './components/chat-pro/ThreeColumnLayout'
import type { ChatProEvent } from './components/chat-pro/index'
// 导入全局清理工具 - 确保在应用启动时清理旧的监听器
import './utils/globalCleanup'
import { checkForAppUpdatesQuiet } from './lib/updater'

type ViewMode = 'default' | 'three-column'

function AppContent() {
  const { user, logout } = useAuth()
  const {
    conversations,
    activeConversationId,
    createConversation,
    deleteConversation,
    setActiveConversation,
    sendMessage,
    isLoading,
    loadConversations,
    getConversationEvents,
    conversationEvents
  } = useChatStore()
  const { openSettings, loadSettings } = useSettingsStore()
  const [viewMode, setViewMode] = useState<ViewMode>('default')
  
  // 将chat store的对话数据转换为chat-pro组件需要的格式
  const chatProConversations: ChatProConversation[] = useMemo(() => {
    return conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      lastMessage: conv.messages.length > 0 
        ? conv.messages[conv.messages.length - 1].content.slice(0, 50) 
        : undefined,
      timestamp: new Date(conv.updatedAt),
      unreadCount: 0, // 暂时设为0，可以后续实现
      isGroup: false,
      isStarred: false,
      status: 'online' as const
    }))
  }, [conversations])
  
  // 获取完整的对话事件，包括消息、工具调用、错误等所有事件
  const currentEvents: ChatProEvent[] = useMemo(() => {
    if (!activeConversationId) return []
    
    // 直接从事件存储中获取完整事件
    const events = getConversationEvents(activeConversationId)
    
    return events.map(evt => ({
      id: evt.id,
      event: evt.event,
      timestamp: new Date(evt.timestamp),
      status: evt.status || 'completed'
    }))
  }, [activeConversationId, conversationEvents, getConversationEvents])

  useEffect(() => {
    // 初始化时加载对话历史和设置
    loadConversations()
    loadSettings()
    
    // 延迟3秒后静默检查更新
    const updateCheckTimer = setTimeout(async () => {
      try {
        await checkForAppUpdatesQuiet()
      } catch (error) {
        console.error('自动更新检查失败:', error)
      }
    }, 3000)
    
    return () => {
      clearTimeout(updateCheckTimer)
    }
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
            <h1 className="font-semibold text-lg">
              {viewMode === 'three-column' ? '三栏布局聊天界面' : 'Sker Code Assistant'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 用户信息 */}
            <div className="flex items-center gap-2 mr-4">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {user?.username}
              </span>
            </div>

            {/* 界面模式切换按钮 */}
            {viewMode !== 'default' && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setViewMode('default')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                返回默认界面
              </Button>
            )}
            
            {viewMode === 'default' && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setViewMode('three-column')}
                className="gap-2"
              >
                <Layout className="w-4 h-4" />
                三栏布局
              </Button>
            )}
            
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

            <Button 
              variant="ghost" 
              size="icon"
              onClick={logout}
              title="注销"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        <ThreeColumnLayout
          conversations={chatProConversations}
          events={currentEvents}
          isProcessing={isLoading}
          defaultConversationId={activeConversationId || undefined}
          onConversationSelect={setActiveConversation}
          onSendMessage={(message: string, _attachments?: File[]) => {
            // 暂时忽略文件附件，只发送消息内容
            sendMessage(message)
          }}
          onCreateConversation={createConversation}
          onDeleteConversation={deleteConversation}
          onClearChat={() => {
            // 实现清空当前对话的逻辑
            console.log('清空对话功能待实现')
          }}
          onStopProcessing={() => {
            // 实现停止处理的逻辑
            console.log('停止处理功能待实现')
          }}
        />
      </div>

      {/* 设置对话框 */}
      <SettingsDialog />
    </div>
  )
}

// 主应用组件，包含认证提供者和守卫
function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <AppContent />
      </AuthGuard>
    </AuthProvider>
  );
}

export default App
