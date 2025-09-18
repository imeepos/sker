import { useState } from 'react'
import { ExecApprovalRequestEvent } from '../../types/protocol/ExecApprovalRequestEvent'
import { EventMsg } from '../../types/protocol/EventMsg'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/Button'
import { cn, formatTime } from '../../lib/utils'
import { AlertTriangle, Terminal, Folder, Clock } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'

interface ExecApprovalRequestEventComponentProps {
  event: EventMsg & { type: 'exec_approval_request' }
  className?: string
  timestamp?: Date
  conversationId: string
  eventId: string
}

// 临时Event类型定义
interface ProtocolEvent {
  id: string
  msg: EventMsg
}

/**
 * 执行命令审批请求组件 - 提供交互式审批界面
 */
export function ExecApprovalRequestEventComponent({ 
  event, 
  className, 
  timestamp, 
  conversationId,
  eventId
}: ExecApprovalRequestEventComponentProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isApproved, setIsApproved] = useState(false)

  const approvalEvent = event as any
  const { command, cwd, reason, call_id } = approvalEvent

  // 处理审批决策
  const handleApproval = async (decision: 'approved' | 'approved_for_session' | 'denied' | 'abort') => {
    if (isProcessing || isApproved) return

    setIsProcessing(true)
    
    console.log('开始处理审批决策:', {
      conversationId,
      eventId,
      decision,
      call_id
    })
    
    try {
      // 使用传递的eventId，这现在应该是后端的真实事件ID
      await invoke('approve_exec_command', {
        conversationId,
        approvalId: eventId,
        decision
      })
      
      setIsApproved(true)
      
      // 显示成功提示
      const decisionMap = {
        approved: '已批准',
        approved_for_session: '已批准（会话期间自动批准）',
        denied: '已拒绝',
        abort: '已中止'
      }
      
      console.log(`✅ 审批已提交: 命令执行${decisionMap[decision]}, eventId: ${eventId}`)
    } catch (error) {
      console.error('审批失败:', error)
      // TODO: 替换为更好的用户通知方式
      alert(`审批失败: ${error}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className={cn("border-l-4 border-l-amber-500 bg-amber-50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <CardTitle className="text-sm font-medium text-amber-800">执行命令审批请求</CardTitle>
            {isApproved ? (
              <Badge variant="outline" className="text-green-600 bg-green-100 border-green-200">
                已处理
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 bg-amber-100 border-amber-200">
                等待审批
              </Badge>
            )}
          </div>
          {timestamp && <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 命令信息 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Terminal className="w-4 h-4 text-gray-600" />
            <span className="font-medium">要执行的命令:</span>
          </div>
          <div className="bg-gray-100 rounded-md p-3 font-mono text-sm">
            {command.join(' ')}
          </div>
        </div>

        {/* 工作目录 */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Folder className="w-4 h-4" />
          <span className="font-medium">工作目录:</span>
          <span className="font-mono">{cwd}</span>
        </div>

        {/* 原因说明 */}
        {reason && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center gap-2 text-sm text-blue-800 mb-1">
              <Clock className="w-4 h-4" />
              <span className="font-medium">原因:</span>
            </div>
            <p className="text-sm text-blue-700">{reason}</p>
          </div>
        )}

        {/* 审批按钮 */}
        {!isApproved && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              size="sm"
              variant="default"
              disabled={isProcessing}
              onClick={() => handleApproval('approved')}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? '处理中...' : '批准'}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              disabled={isProcessing}
              onClick={() => handleApproval('approved_for_session')}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              批准（会话期间自动批准）
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              disabled={isProcessing}
              onClick={() => handleApproval('denied')}
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              拒绝
            </Button>
            
            <Button
              size="sm"
              variant="destructive"
              disabled={isProcessing}
              onClick={() => handleApproval('abort')}
            >
              中止会话
            </Button>
          </div>
        )}

        {/* 调用ID */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          调用ID: {call_id}
        </div>
      </CardContent>
    </Card>
  )
}