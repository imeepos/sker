import { useMemo } from 'react'
import { MessagesLayout, type Conversation } from '../layout/layouts'
import { MessagesPage as MessagesPageComponent } from '../layout/MessagesPage'
import { useChatStore } from '../stores/chat'
import type { ChatProEvent } from '../components/chat-pro/index'

/**
 * 消息页面 - 使用MessagesLayout布局
 */
export function MessagesPage() {
  const {
    conversations,
    sendMessage,
    isLoading,
    getConversationEvents,
    conversationEvents,
    createConversation,
    deleteConversation
  } = useChatStore()

  // 将chat store的对话数据转换为布局组件需要的格式
  const layoutConversations: Conversation[] = useMemo(() => {
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
    <MessagesLayout
      conversations={layoutConversations}
      onCreateConversation={createConversation}
      onDeleteConversation={deleteConversation}
    >
      <MessagesPageComponent
        conversations={layoutConversations}
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
    </MessagesLayout>
  )
}