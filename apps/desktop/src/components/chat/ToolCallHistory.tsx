import { cn } from '../../lib/utils'
import { ToolCall } from '../../types/chat'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { ToolCallIndicator } from './ToolCallIndicator'
import { ToolCallResult } from './ToolCallResult'
import { Separator } from '../ui/separator'
import { Zap } from 'lucide-react'

interface ToolCallHistoryProps {
  toolCalls: ToolCall[]
  className?: string
}

export function ToolCallHistory({ toolCalls, className }: ToolCallHistoryProps) {
  if (!toolCalls || toolCalls.length === 0) {
    return null
  }

  // 统计信息
  const stats = {
    total: toolCalls.length,
    running: toolCalls.filter(tc => tc.status === 'running').length,
    success: toolCalls.filter(tc => tc.status === 'success').length,
    error: toolCalls.filter(tc => tc.status === 'error').length,
    pending: toolCalls.filter(tc => tc.status === 'pending').length
  }

  // 计算总执行时间
  const totalTime = toolCalls.reduce((total, tc) => {
    if (tc.endTime) {
      return total + (tc.endTime - tc.startTime)
    }
    return total
  }, 0)

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4" />
            工具调用记录
          </CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>总计: {stats.total}</span>
            {stats.running > 0 && (
              <span className="text-blue-600">执行中: {stats.running}</span>
            )}
            {stats.success > 0 && (
              <span className="text-green-600">成功: {stats.success}</span>
            )}
            {stats.error > 0 && (
              <span className="text-red-600">失败: {stats.error}</span>
            )}
            {totalTime > 0 && (
              <span>
                总耗时: {totalTime < 1000 ? `${totalTime}ms` : `${(totalTime / 1000).toFixed(1)}s`}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {toolCalls.map((toolCall, index) => (
          <div key={toolCall.id}>
            {/* 工具调用指示器 */}
            <ToolCallIndicator toolCall={toolCall} />
            
            {/* 工具调用结果 */}
            {toolCall.status === 'success' && toolCall.result && (
              <div className="mt-2">
                <ToolCallResult toolCall={toolCall} />
              </div>
            )}
            
            {/* 分隔线 */}
            {index < toolCalls.length - 1 && (
              <Separator className="my-3" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}