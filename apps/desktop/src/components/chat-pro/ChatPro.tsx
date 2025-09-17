import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '../ui/Button'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import { EventMsg } from '../../types/protocol/EventMsg'
import { ChatProInput } from './ChatProInput'
import { EventsList } from './EventsList'
import { ChatProHeader } from './ChatProHeader'
import { MessageSquare, Zap } from 'lucide-react'
import { safeJsonStringify } from '../../lib/text-formatting'

interface ChatProEvent {
  id: string
  event: EventMsg
  timestamp: Date
  status?: 'pending' | 'processing' | 'completed' | 'error'
}

interface ChatProProps {
  /** 事件列表 */
  events?: ChatProEvent[]
  /** 是否正在处理中 */
  isProcessing?: boolean
  /** 会话标题 */
  title?: string
  /** 模型名称 */
  model?: string
  /** 是否启用输入 */
  enableInput?: boolean
  /** 自定义样式类名 */
  className?: string
  /** 发送消息回调 */
  onSendMessage?: (message: string, attachments?: File[]) => void
  /** 停止处理回调 */
  onStopProcessing?: () => void
  /** 清除会话回调 */
  onClearChat?: () => void
  /** 设置回调 */
  onOpenSettings?: () => void
}

/**
 * ChatPro 组件 - 使用 events 系统的专业聊天界面
 * 
 * 特性:
 * - 使用 EventMsgRenderer 渲染所有消息事件
 * - 支持实时事件流显示
 * - 统一的 ag-ui 设计规范
 * - 完整的交互功能
 * - 响应式布局
 */
export function ChatPro({
  events = [],
  isProcessing = false,
  title = '聊天会话',
  model,
  enableInput = true,
  className,
  onSendMessage,
  onStopProcessing,
  onClearChat,
  onOpenSettings
}: ChatProProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        // 使用 setTimeout 确保 DOM 更新完成后再滚动
        setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight
        }, 0)
      }
    }
  }, [events])

  const handleSendMessage = useCallback((message: string, attachments?: File[]) => {
    onSendMessage?.(message, attachments)
  }, [onSendMessage])

  const handleEventSelect = useCallback((eventId: string) => {
    setSelectedEventId(prev => prev === eventId ? null : eventId)
  }, [])

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* 头部区域 */}
      <ChatProHeader
        title={title}
        model={model}
        isProcessing={isProcessing}
        eventCount={events.length}
        onStopProcessing={onStopProcessing}
        onClearChat={onClearChat}
        onOpenSettings={onOpenSettings}
      />

      <Separator />

      {/* 主内容区域 */}
      <div className="flex-1 flex min-h-0">
        {/* 事件列表区域 */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea ref={scrollAreaRef} className="flex-1">
            <div className="p-4 space-y-3 pb-6">
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    开始新对话
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    输入您的消息开始与智能助手对话，所有交互事件都会在这里显示
                  </p>
                </div>
              ) : (
                <EventsList
                  events={events}
                  selectedEventId={selectedEventId}
                  onEventSelect={handleEventSelect}
                  isProcessing={isProcessing}
                />
              )}
            </div>
          </ScrollArea>

          {/* 输入区域 */}
          {enableInput && (
            <>
              <Separator />
              <div className="p-4 flex-shrink-0 bg-background">
                <ChatProInput
                  onSendMessage={handleSendMessage}
                  disabled={isProcessing}
                  placeholder={
                    isProcessing 
                      ? '正在处理中...' 
                      : '输入消息，支持 Markdown 格式...'
                  }
                />
              </div>
            </>
          )}
        </div>

        {/* 侧边栏 - 选中事件的详细信息 */}
        {selectedEventId && (
          <>
            <Separator orientation="vertical" />
            <div className="w-80 flex flex-col bg-muted/30">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">事件详情</h3>
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
                            事件类型
                          </label>
                          <div className="mt-1">
                            <Badge variant="outline">{selectedEvent.event.type}</Badge>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            时间戳
                          </label>
                          <p className="mt-1 text-sm font-mono">
                            {selectedEvent.timestamp.toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            状态
                          </label>
                          <div className="mt-1">
                            <Badge 
                              variant={
                                selectedEvent.status === 'completed' ? 'default' :
                                selectedEvent.status === 'error' ? 'destructive' :
                                selectedEvent.status === 'processing' ? 'secondary' :
                                'outline'
                              }
                            >
                              {selectedEvent.status || 'pending'}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            原始数据
                          </label>
                          <pre className="mt-1 text-xs bg-muted p-2 rounded-md overflow-auto max-h-60">
                            {safeJsonStringify(selectedEvent.event, null, 2)}
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

      {/* 状态栏 */}
      {isProcessing && (
        <>
          <Separator />
          <div className="px-4 py-2 bg-muted/50 flex items-center justify-between text-sm flex-shrink-0">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500 animate-pulse" />
              <span className="text-muted-foreground">正在处理中...</span>
            </div>
            {onStopProcessing && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onStopProcessing}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                停止
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}