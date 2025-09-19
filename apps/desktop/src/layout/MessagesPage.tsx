import { useParams } from 'react-router-dom'
import { ChatContent } from '../components/chat-pro/ChatContent'
import { ChatProEvent } from '../components/chat-pro'

interface MessagesPageProps {
  /** 对话列表 */
  conversations?: Array<{
    id: string
    title: string
    lastMessage?: string
    timestamp: Date
    unreadCount?: number
    avatar?: string
    isGroup?: boolean
    isStarred?: boolean
    status?: 'online' | 'offline' | 'away'
  }>
  /** 当前会话的事件列表 */
  events?: ChatProEvent[]
  /** 是否正在处理中 */
  isProcessing?: boolean
  /** 发送消息回调 */
  onSendMessage?: (message: string, attachments?: File[]) => void
  /** 停止处理回调 */
  onStopProcessing?: () => void
  /** 清除会话回调 */
  onClearChat?: () => void
}

/**
 * 消息页面组件 - 处理消息相关的路由
 */
export function MessagesPage({
  conversations = [],
  events = [],
  isProcessing = false,
  onSendMessage,
  onStopProcessing,
  onClearChat
}: MessagesPageProps) {
  const { conversationId } = useParams<{ conversationId: string }>()

  // 获取当前选中的对话信息
  const selectedConversation = conversationId 
    ? conversations.find(c => c.id === conversationId)
    : null

  if (!conversationId) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <h3 className="font-medium mb-2">选择对话</h3>
          <p className="text-sm">请从左侧列表中选择一个对话开始聊天</p>
        </div>
      </div>
    )
  }

  if (!selectedConversation) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <h3 className="font-medium mb-2">对话不存在</h3>
          <p className="text-sm">请选择一个有效的对话</p>
        </div>
      </div>
    )
  }

  return (
    <ChatContent
      conversation={selectedConversation}
      events={events}
      isProcessing={isProcessing}
      onSendMessage={onSendMessage}
      onStopProcessing={onStopProcessing}
      onClearChat={onClearChat}
    />
  )
}