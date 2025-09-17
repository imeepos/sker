import { cn } from '../../lib/utils'
import { ToolCall, ToolCallStatus } from '../../types/chat'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Loader2, CheckCircle, XCircle, Clock, Play } from 'lucide-react'

interface ToolCallIndicatorProps {
  toolCall: ToolCall
  className?: string
}

const getStatusIcon = (status: ToolCallStatus) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-3 h-3" />
    case 'running':
      return <Loader2 className="w-3 h-3 animate-spin" />
    case 'success':
      return <CheckCircle className="w-3 h-3" />
    case 'error':
      return <XCircle className="w-3 h-3" />
    default:
      return <Play className="w-3 h-3" />
  }
}

const getStatusColor = (status: ToolCallStatus) => {
  switch (status) {
    case 'pending':
      return 'text-muted-foreground bg-muted'
    case 'running':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'success':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'error':
      return 'text-red-600 bg-red-50 border-red-200'
    default:
      return 'text-muted-foreground bg-muted'
  }
}

const getStatusText = (status: ToolCallStatus) => {
  switch (status) {
    case 'pending':
      return '等待中'
    case 'running':
      return '执行中'
    case 'success':
      return '成功'
    case 'error':
      return '失败'
    default:
      return '未知'
  }
}

export function ToolCallIndicator({ toolCall, className }: ToolCallIndicatorProps) {
  const statusColor = getStatusColor(toolCall.status)
  const statusIcon = getStatusIcon(toolCall.status)
  const statusText = getStatusText(toolCall.status)
  
  // 计算执行时间
  const duration = toolCall.endTime 
    ? toolCall.endTime - toolCall.startTime
    : Date.now() - toolCall.startTime

  return (
    <Card className={cn(
      "border-l-4 transition-all duration-200",
      toolCall.status === 'running' && "border-l-blue-500",
      toolCall.status === 'success' && "border-l-green-500", 
      toolCall.status === 'error' && "border-l-red-500",
      toolCall.status === 'pending' && "border-l-gray-400",
      className
    )}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("gap-1 text-xs", statusColor)}>
              {statusIcon}
              {statusText}
            </Badge>
            <span className="font-medium text-sm">{toolCall.name}</span>
          </div>
          {toolCall.status !== 'pending' && (
            <span className="text-xs text-muted-foreground">
              {duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`}
            </span>
          )}
        </div>
        
        {/* 参数展示 */}
        {Object.keys(toolCall.arguments).length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">参数：</span>
            <code className="ml-1 px-1.5 py-0.5 bg-muted rounded text-xs">
              {JSON.stringify(toolCall.arguments, null, 0)}
            </code>
          </div>
        )}
        
        {/* 错误信息 */}
        {toolCall.status === 'error' && toolCall.error && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
            <span className="font-medium">错误：</span>
            {toolCall.error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}