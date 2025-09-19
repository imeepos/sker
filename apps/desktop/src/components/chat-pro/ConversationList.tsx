import { useState, useCallback } from 'react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import { Badge } from '../ui/badge'
import { Avatar } from '../ui/avatar'
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Star,
  MessageSquare,
  Users,
  Circle
} from 'lucide-react'
import type { Conversation } from '../../layout'

interface ConversationListProps {
  /** 对话列表 */
  conversations: Conversation[]
  /** 当前选中的对话ID */
  selectedConversationId: string | null
  /** 对话选择回调 */
  onConversationSelect: (conversationId: string) => void
  /** 创建新对话回调 */
  onCreateConversation?: () => void
  /** 删除对话回调 */
  onDeleteConversation?: (conversationId: string) => void
  /** 自定义样式类名 */
  className?: string
}

/**
 * 对话列表组件
 * 
 * 仿微信风格的对话列表，包含搜索、筛选、操作等功能
 */
export function ConversationList({
  conversations,
  selectedConversationId,
  onConversationSelect,
  onCreateConversation,
  onDeleteConversation: _onDeleteConversation,
  className
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all')

  // 处理对话选择
  const handleConversationClick = useCallback((conversationId: string) => {
    onConversationSelect(conversationId)
  }, [onConversationSelect])

  // 过滤对话列表
  const filteredConversations = conversations.filter(conversation => {
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!conversation.title.toLowerCase().includes(query) && 
          !conversation.lastMessage?.toLowerCase().includes(query)) {
        return false
      }
    }
    
    // 筛选过滤
    switch (filter) {
      case 'unread':
        return (conversation.unreadCount || 0) > 0
      case 'starred':
        return conversation.isStarred
      default:
        return true
    }
  })

  // 格式化时间显示
  const formatTime = useCallback((timestamp: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`
    
    return timestamp.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }, [])

  // 获取头像显示内容
  const getAvatarContent = useCallback((conversation: Conversation) => {
    if (conversation.avatar) {
      return <img src={conversation.avatar} alt={conversation.title} className="w-full h-full object-cover" />
    }
    
    // 使用标题首字符作为头像
    const firstChar = conversation.title.charAt(0).toUpperCase()
    return (
      <div className={cn(
        'w-full h-full flex items-center justify-center text-white font-medium',
        conversation.isGroup 
          ? 'bg-gradient-to-br from-green-500 to-teal-600'
          : 'bg-gradient-to-br from-blue-500 to-purple-600'
      )}>
        {firstChar}
      </div>
    )
  }, [])

  return (
    <div className={cn('h-full flex flex-col bg-background', className)}>
      {/* 头部区域 */}
      <div className="flex-shrink-0 p-3 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">消息</h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={onCreateConversation}
              title="新建对话"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              title="更多选项"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索对话..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>

        {/* 筛选标签 */}
        <div className="flex gap-2 mt-3">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="h-7 text-xs"
          >
            全部
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
            className="h-7 text-xs"
          >
            未读
          </Button>
          <Button
            variant={filter === 'starred' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('starred')}
            className="h-7 text-xs"
          >
            <Star className="w-3 h-3 mr-1" />
            收藏
          </Button>
        </div>
      </div>

      {/* 对话列表 */}
      <ScrollArea className="flex-1 w-full">
        <div className="p-1 h-full">
          {filteredConversations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-muted-foreground mb-2">
                {searchQuery ? '未找到匹配的对话' : '还没有对话'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? '尝试使用其他关键词搜索' : '点击 + 按钮创建新对话'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const isSelected = selectedConversationId === conversation.id
              
              return (
                <div
                  key={conversation.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                    'hover:bg-slate-50 dark:hover:bg-slate-800',
                    isSelected && 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'
                  )}
                  onClick={() => handleConversationClick(conversation.id)}
                >
                  {/* 头像 */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-12 h-12">
                      {getAvatarContent(conversation)}
                    </Avatar>
                    
                    {/* 在线状态指示器 */}
                    {!conversation.isGroup && conversation.status && (
                      <div className="absolute -bottom-1 -right-1">
                        <Circle 
                          className={cn(
                            'w-3 h-3 border-2 border-background rounded-full',
                            conversation.status === 'online' && 'fill-green-500 text-green-500',
                            conversation.status === 'away' && 'fill-yellow-500 text-yellow-500',
                            conversation.status === 'offline' && 'fill-gray-400 text-gray-400'
                          )}
                        />
                      </div>
                    )}
                    
                    {/* 群组标识 */}
                    {conversation.isGroup && (
                      <div className="absolute -bottom-1 -right-1">
                        <Users className="w-4 h-4 bg-background rounded-full p-0.5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* 对话信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className={cn(
                          'font-medium truncate',
                          (conversation.unreadCount || 0) > 0 && 'text-foreground',
                          (conversation.unreadCount || 0) === 0 && 'text-muted-foreground'
                        )}>
                          {conversation.title}
                        </h3>
                        {conversation.isStarred && (
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatTime(conversation.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className={cn(
                        'text-sm truncate',
                        (conversation.unreadCount || 0) > 0 
                          ? 'text-foreground font-medium' 
                          : 'text-muted-foreground'
                      )}>
                        {conversation.lastMessage || '暂无消息'}
                      </p>
                      
                      {/* 未读消息数 */}
                      {(conversation.unreadCount || 0) > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="ml-2 h-5 min-w-[20px] text-xs px-1.5 rounded-full flex-shrink-0"
                        >
                          {conversation.unreadCount! > 99 ? '99+' : conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}