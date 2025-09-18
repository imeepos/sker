import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { Avatar } from '../ui/avatar'
import { ChatProInput } from './ChatProInput'
import { EventsList } from './EventsList'
import { useChatStore } from '../../stores/chat'
import { 
  MoreHorizontal, 
  Phone, 
  Video, 
  Info, 
  Star, 
  Search,
  Circle,
  Users
} from 'lucide-react'
import type { Conversation } from './ThreeColumnLayout'
import type { ChatProEvent } from './index'

interface ChatContentProps {
  /** 当前对话信息 */
  conversation: Conversation
  /** 事件列表 */
  events?: ChatProEvent[]
  /** 是否正在处理中 */
  isProcessing?: boolean
  /** 发送消息回调 */
  onSendMessage?: (message: string, attachments?: File[]) => void
  /** 停止处理回调 */
  onStopProcessing?: () => void
  /** 清除会话回调 */
  onClearChat?: () => void
  /** 自定义样式类名 */
  className?: string
}

/**
 * 聊天内容区域组件
 * 
 * 显示具体对话的聊天内容，包含消息列表和输入框
 */
export function ChatContent({
  conversation,
  events = [],
  isProcessing = false,
  onSendMessage,
  onStopProcessing,
  onClearChat: _onClearChat,
  className
}: ChatContentProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
  // 从Store获取聚合的事件数据
  const getAggregatedEvents = useChatStore(state => state.getAggregatedEvents)

  // 自动滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight
        }, 0)
      }
    }
  }, [events])

  // 处理发送消息
  const handleSendMessage = useCallback((message: string, attachments?: File[]) => {
    onSendMessage?.(message, attachments)
  }, [onSendMessage])

  // 处理事件选择
  const handleEventSelect = useCallback((eventId: string) => {
    setSelectedEventId(prev => prev === eventId ? null : eventId)
  }, [])

  // 获取头像内容
  const getAvatarContent = useCallback(() => {
    if (conversation.avatar) {
      return <img src={conversation.avatar} alt={conversation.title} className="w-full h-full object-cover" />
    }
    
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
  }, [conversation])

  // 获取在线状态文本
  const getStatusText = useCallback(() => {
    if (conversation.isGroup) {
      return `群聊 · ${events.length} 条消息`
    }
    
    switch (conversation.status) {
      case 'online':
        return '在线'
      case 'away':
        return '离开'
      case 'offline':
        return '离线'
      default:
        return '未知状态'
    }
  }, [conversation, events.length])

  return (
    <div className={cn('h-full flex flex-col bg-background', className)}>
      {/* 头部信息栏 */}
      <div className="flex-shrink-0 px-4 py-3 border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 头像 */}
            <div className="relative">
              <Avatar className="w-10 h-10">
                {getAvatarContent()}
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
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lg">{conversation.title}</h2>
                {conversation.isStarred && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {getStatusText()}
              </p>
            </div>
          </div>

          {/* 操作按钮组 */}
          <div className="flex items-center gap-2">
            {!conversation.isGroup && (
              <>
                <Button variant="ghost" size="icon" title="语音通话">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" title="视频通话">
                  <Video className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" title="搜索消息">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" title="对话信息">
              <Info className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" title="更多选项">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex min-h-0">
        {/* 消息列表区域 - 优化布局 */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea ref={scrollAreaRef} className="flex-1">
            <div className="px-6 py-4 space-y-6 pb-8">
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted mb-4 flex items-center justify-center">
                    {getAvatarContent()}
                  </div>
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    开始与 {conversation.title} 对话
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {conversation.isGroup 
                      ? '欢迎来到群聊，发送消息开始交流吧' 
                      : '输入消息开始与智能助手对话'
                    }
                  </p>
                </div>
              ) : (
                <EventsList
                  events={events}
                  eventLayers={getAggregatedEvents(conversation.id)}
                  selectedEventId={selectedEventId}
                  onEventSelect={handleEventSelect}
                  isProcessing={isProcessing}
                  conversationId={conversation.id}
                  enableLayeredView={true}
                />
              )}
            </div>
          </ScrollArea>

          {/* 输入区域 - 优化布局 */}
          <div className="border-t bg-slate-50/50 dark:bg-slate-900/50">
            <div className="px-6 py-4 flex-shrink-0">
              <ChatProInput
                onSendMessage={handleSendMessage}
                disabled={isProcessing}
                placeholder={
                  isProcessing 
                    ? '正在处理中...' 
                    : `发送消息给 ${conversation.title}...`
                }
              />
            </div>
          </div>
        </div>

        {/* 右侧详细信息面板（当选中事件时显示） */}
        {selectedEventId && (
          <>
            <Separator orientation="vertical" />
            <div className="w-80 flex flex-col bg-muted/30">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">消息详情</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEventId(null)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4">
                  {(() => {
                    const selectedEvent = events.find(e => e.id === selectedEventId)
                    if (!selectedEvent) return null
                    
                    return (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            消息类型
                          </label>
                          <p className="mt-1 text-sm font-mono bg-muted px-2 py-1 rounded">
                            {selectedEvent.event.type}
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            发送时间
                          </label>
                          <p className="mt-1 text-sm">
                            {selectedEvent.timestamp.toLocaleString('zh-CN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            状态
                          </label>
                          <div className="mt-1">
                            <span className={cn(
                              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                              selectedEvent.status === 'completed' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                              selectedEvent.status === 'error' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                              selectedEvent.status === 'processing' && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                              !selectedEvent.status && 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                            )}>
                              {selectedEvent.status || 'pending'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            原始数据
                          </label>
                          <pre className="mt-1 text-xs bg-muted p-3 rounded-md overflow-auto max-h-60 whitespace-pre-wrap">
                            {JSON.stringify(selectedEvent.event, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </div>

      {/* 处理状态栏 - 优化样式 */}
      {isProcessing && (
        <div className="border-t bg-blue-50/50 dark:bg-blue-950/50">
          <div className="px-6 py-3 flex items-center justify-between text-sm flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-blue-700 dark:text-blue-300 font-medium">正在处理消息...</span>
            </div>
            {onStopProcessing && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onStopProcessing}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 h-8 px-3"
              >
                停止
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}