import { ReactNode } from 'react'
import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BaseLayout } from '../BaseLayout'
import { ConversationList } from '../../components/chat-pro/ConversationList'

export interface Conversation {
  id: string
  title: string
  lastMessage?: string
  timestamp: Date
  unreadCount?: number
  avatar?: string
  isGroup?: boolean
  isStarred?: boolean
  status?: 'online' | 'offline' | 'away'
}

interface MessagesLayoutProps {
  /** 自定义样式类名 */
  className?: string
  /** 对话列表 */
  conversations?: Conversation[]
  /** 创建新对话回调 */
  onCreateConversation?: () => void
  /** 删除对话回调 */
  onDeleteConversation?: (conversationId: string) => void
  /** 主要内容 */
  children: ReactNode
}

/**
 * 消息页面专用布局 - 带对话列表侧边栏
 */
export function MessagesLayout({
  className,
  conversations = [],
  onCreateConversation,
  onDeleteConversation,
  children
}: MessagesLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()

  // 从 URL 中获取当前选中的对话 ID
  const getSelectedConversationId = (): string | null => {
    const match = location.pathname.match(/^\/messages\/(.+)$/)
    return match ? match[1] : null
  }

  const selectedConversationId = getSelectedConversationId()

  // 处理对话选择
  const handleConversationSelect = useCallback((conversationId: string) => {
    navigate(`/messages/${conversationId}`)
  }, [navigate])

  const sidebar = (
    <ConversationList
      conversations={conversations}
      selectedConversationId={selectedConversationId}
      onConversationSelect={handleConversationSelect}
      onCreateConversation={onCreateConversation}
      onDeleteConversation={onDeleteConversation}
    />
  )

  return (
    <BaseLayout
      className={className}
      showNavigation={true}
      sidebar={sidebar}
    >
      {children}
    </BaseLayout>
  )
}