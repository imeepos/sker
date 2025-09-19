import { useEffect, useMemo } from 'react'
import { Button } from '../components/ui/Button'
import { SettingsDialog } from '../components/settings'
import { AppLayout, MessagesPage, AgentsPage } from '../layout'
import { useAuth } from '../components/auth'
import { useChatStore } from '../stores/chat'
import { useSettingsStore } from '../stores/settings'
import { Bot, LogOut, User } from 'lucide-react'
import type { Conversation as ChatProConversation } from '../layout'
import type { ChatProEvent } from '../components/chat-pro/index'
import { checkForAppUpdatesQuiet } from '../lib/updater'

// Agent页面包装组件
function AgentsWrapper() {
  return (
    <AgentsPage
      onCreateAgent={() => {
        console.log('创建Agent功能待实现')
      }}
      onEditAgent={(agent) => {
        console.log('编辑Agent功能待实现', agent)
      }}
      onDeleteAgent={(agentId) => {
        console.log('删除Agent功能待实现', agentId)
      }}
    />
  )
}

// 消息页面包装组件
function MessagesWrapper() {
  const {
    conversations,
    sendMessage,
    isLoading,
    getConversationEvents,
    conversationEvents
  } = useChatStore()

  // 将chat store的对话数据转换为chat-pro组件需要的格式
  const chatProConversations: ChatProConversation[] = useMemo(() => {
    return conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      lastMessage: conv.messages.length > 0 
        ? conv.messages[conv.messages.length - 1].content.slice(0, 50) 
        : undefined,
      timestamp: new Date(conv.updatedAt),
      unreadCount: 0,
      isGroup: false,
      isStarred: false,
      status: 'online' as const
    }))
  }, [conversations])
  
  // 获取完整的对话事件
  const currentEvents: ChatProEvent[] = useMemo(() => {
    // 从 URL 获取当前对话 ID
    const conversationId = window.location.pathname.split('/messages/')[1]
    if (!conversationId) return []
    
    const events = getConversationEvents(conversationId)
    
    return events.map(evt => ({
      id: evt.id,
      event: evt.event,
      timestamp: new Date(evt.timestamp),
      status: evt.status || 'completed'
    }))
  }, [conversationEvents, getConversationEvents])

  return (
    <MessagesPage
      conversations={chatProConversations}
      events={currentEvents}
      isProcessing={isLoading}
      onSendMessage={(message: string, _attachments?: File[]) => {
        sendMessage(message)
      }}
      onClearChat={() => {
        console.log('清空对话功能待实现')
      }}
      onStopProcessing={() => {
        console.log('停止处理功能待实现')
      }}
    />
  )
}

export function Home() {
  const { user, logout } = useAuth()
  const {
    conversations,
    createConversation,
    deleteConversation,
    loadConversations
  } = useChatStore()
  const { loadSettings } = useSettingsStore()
  
  // 将chat store的对话数据转换为chat-pro组件需要的格式
  const chatProConversations: ChatProConversation[] = useMemo(() => {
    return conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      lastMessage: conv.messages.length > 0 
        ? conv.messages[conv.messages.length - 1].content.slice(0, 50) 
        : undefined,
      timestamp: new Date(conv.updatedAt),
      unreadCount: 0,
      isGroup: false,
      isStarred: false,
      status: 'online' as const
    }))
  }, [conversations])

  useEffect(() => {
    loadConversations()
    loadSettings()
    
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
            <div className="flex items-center gap-2 mr-4">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {user?.username}
              </span>
            </div>

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
        <AppLayout
          conversations={chatProConversations}
          onCreateConversation={createConversation}
          onDeleteConversation={deleteConversation}
          onCreateAgent={() => {
            console.log('创建Agent功能待实现')
          }}
          onCreateProject={() => {
            console.log('创建项目功能待实现')
          }}
        />
      </div>

      {/* 设置对话框 */}
      <SettingsDialog />
    </div>
  )
}

// 导出包装组件供路由使用
export { AgentsWrapper, MessagesWrapper }