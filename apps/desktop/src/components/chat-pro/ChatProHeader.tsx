import { Button } from '../ui/Button'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import { 
  Settings, 
  MessageSquare, 
  Trash2, 
  Square,
  Zap,
  Bot,
  Activity
} from 'lucide-react'

interface ChatProHeaderProps {
  /** 会话标题 */
  title?: string
  /** 当前使用的模型 */
  model?: string
  /** 是否正在处理中 */
  isProcessing?: boolean
  /** 事件总数 */
  eventCount?: number
  /** 自定义样式类名 */
  className?: string
  /** 停止处理回调 */
  onStopProcessing?: () => void
  /** 清除聊天记录回调 */
  onClearChat?: () => void
  /** 打开设置回调 */
  onOpenSettings?: () => void
}

/**
 * ChatPro 头部组件 - 显示会话信息和操作按钮
 * 
 * 特性:
 * - 显示会话标题和模型信息
 * - 实时处理状态指示
 * - 事件统计显示
 * - 操作按钮集合
 * - 符合 ag-ui 设计规范
 */
export function ChatProHeader({
  title = '聊天会话',
  model,
  isProcessing = false,
  eventCount = 0,
  className,
  onStopProcessing,
  onClearChat,
  onOpenSettings
}: ChatProHeaderProps) {
  return (
    <div className={cn('px-4 py-3 bg-background border-b', className)}>
      <div className="flex items-center justify-between">
        {/* 左侧信息区域 */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-semibold truncate max-w-xs">
              {title}
            </h1>
          </div>

          {/* 状态指示器 */}
          <div className="flex items-center gap-2">
            {isProcessing ? (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                <Zap className="w-3 h-3 mr-1 animate-pulse" />
                处理中
              </Badge>
            ) : (
              <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">
                <Activity className="w-3 h-3 mr-1" />
                就绪
              </Badge>
            )}

            {/* 事件计数 */}
            {eventCount > 0 && (
              <Badge variant="outline">
                <MessageSquare className="w-3 h-3 mr-1" />
                {eventCount} 事件
              </Badge>
            )}

            {/* 模型信息 */}
            {model && (
              <Badge variant="outline" className="font-mono text-xs">
                {model}
              </Badge>
            )}
          </div>
        </div>

        {/* 右侧操作区域 */}
        <div className="flex items-center gap-2">
          {/* 停止处理按钮 */}
          {isProcessing && onStopProcessing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onStopProcessing}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Square className="w-4 h-4 mr-1" />
              停止
            </Button>
          )}

          {/* 清除聊天记录 */}
          {onClearChat && eventCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearChat}
              className="text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}

          {/* 设置按钮 */}
          {onOpenSettings && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenSettings}
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 处理状态详细信息 */}
      {isProcessing && (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>正在与 {model || '智能助手'} 交互...</span>
          </div>
        </div>
      )}
    </div>
  )
}