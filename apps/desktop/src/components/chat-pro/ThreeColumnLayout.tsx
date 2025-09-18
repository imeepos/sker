import { useState, useCallback } from 'react'
import { cn } from '../../lib/utils'
import { LeftSidebar } from './LeftSidebar'
import { ConversationList } from './ConversationList'
import { ChatContent } from './ChatContent'
import { ChatProEvent } from './index'

export type NavigationItem = 
  | 'messages' 
  | 'calendar' 
  | 'cloud-docs' 
  | 'tables' 
  | 'video-meeting' 
  | 'workbench' 
  | 'contacts' 
  | 'ai-assistant' 
  | 'community' 
  | 'settings'

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

interface ThreeColumnLayoutProps {
  /** 自定义样式类名 */
  className?: string
  /** 初始选中的导航项 */
  defaultNavigation?: NavigationItem
  /** 初始选中的对话ID */
  defaultConversationId?: string
  /** 对话列表 */
  conversations?: Conversation[]
  /** 当前会话的事件列表 */
  events?: ChatProEvent[]
  /** 是否正在处理中 */
  isProcessing?: boolean
  /** 导航切换回调 */
  onNavigationChange?: (item: NavigationItem) => void
  /** 对话选择回调 */
  onConversationSelect?: (conversationId: string) => void
  /** 发送消息回调 */
  onSendMessage?: (message: string, attachments?: File[]) => void
  /** 停止处理回调 */
  onStopProcessing?: () => void
  /** 清除会话回调 */
  onClearChat?: () => void
  /** 创建新对话回调 */
  onCreateConversation?: () => void
  /** 删除对话回调 */
  onDeleteConversation?: (conversationId: string) => void
}

/**
 * 三栏布局聊天界面 - 仿微信风格
 * 
 * 布局结构：
 * - 左侧：功能导航栏 (70px)
 * - 中间：对话列表 (320px)
 * - 右侧：聊天内容区域 (剩余空间)
 */
export function ThreeColumnLayout({
  className,
  defaultNavigation = 'messages',
  defaultConversationId,
  conversations = [],
  events = [],
  isProcessing = false,
  onNavigationChange,
  onConversationSelect,
  onSendMessage,
  onStopProcessing,
  onClearChat,
  onCreateConversation,
  onDeleteConversation
}: ThreeColumnLayoutProps) {
  const [selectedNavigation, setSelectedNavigation] = useState<NavigationItem>(defaultNavigation)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(defaultConversationId || null)

  // 处理导航切换
  const handleNavigationChange = useCallback((item: NavigationItem) => {
    setSelectedNavigation(item)
    onNavigationChange?.(item)
    
    // 如果切换到非消息页面，清除选中的对话
    if (item !== 'messages') {
      setSelectedConversationId(null)
    }
  }, [onNavigationChange])

  // 处理对话选择
  const handleConversationSelect = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId)
    onConversationSelect?.(conversationId)
  }, [onConversationSelect])

  // 获取当前选中的对话信息
  const selectedConversation = selectedConversationId 
    ? conversations.find(c => c.id === selectedConversationId)
    : null

  return (
    <div className={cn('h-full flex bg-background overflow-hidden', className)}>
      {/* 左侧功能导航栏 */}
      <div className="w-[70px] h-full border-r bg-slate-50 dark:bg-slate-900 flex-shrink-0 overflow-hidden">
        <LeftSidebar
          selectedItem={selectedNavigation}
          onItemSelect={handleNavigationChange}
        />
      </div>

      {/* 中间对话列表 */}
      <div className="w-[320px] h-full border-r bg-background flex-shrink-0 overflow-hidden">
        {selectedNavigation === 'messages' ? (
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onConversationSelect={handleConversationSelect}
            onCreateConversation={onCreateConversation}
            onDeleteConversation={onDeleteConversation}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <h3 className="font-medium mb-2">功能开发中</h3>
              <p className="text-sm">{getNavigationLabel(selectedNavigation)} 功能即将上线</p>
            </div>
          </div>
        )}
      </div>

      {/* 右侧聊天内容区域 */}
      <div className="flex-1 h-full min-w-0 overflow-hidden">
        {selectedNavigation === 'messages' && selectedConversation ? (
          <ChatContent
            conversation={selectedConversation}
            events={events}
            isProcessing={isProcessing}
            onSendMessage={onSendMessage}
            onStopProcessing={onStopProcessing}
            onClearChat={onClearChat}
          />
        ) : selectedNavigation === 'messages' ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <h3 className="font-medium mb-2">选择对话</h3>
              <p className="text-sm">请从左侧列表中选择一个对话开始聊天</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <h3 className="font-medium mb-2">{getNavigationLabel(selectedNavigation)}</h3>
              <p className="text-sm">该功能界面正在开发中</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// 获取导航项的显示标签
function getNavigationLabel(item: NavigationItem): string {
  const labels: Record<NavigationItem, string> = {
    'messages': '消息',
    'calendar': '日历',
    'cloud-docs': '云文档',
    'tables': '多维表格',
    'video-meeting': '视频会议',
    'workbench': '工作台',
    'contacts': '通讯录',
    'ai-assistant': 'AI助手',
    'community': '社区',
    'settings': '设置'
  }
  
  return labels[item] || item
}