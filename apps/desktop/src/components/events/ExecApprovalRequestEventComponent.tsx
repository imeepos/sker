import { useState } from 'react'
import { EventMsg } from '../../types/protocol/EventMsg'
import { Button } from '../ui/Button'
import { cn, formatTime } from '../../lib/utils'
import { Terminal, Folder, Check, X, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'

interface ExecApprovalRequestEventComponentProps {
  event: EventMsg & { type: 'exec_approval_request' }
  className?: string
  timestamp?: Date
  conversationId: string
  eventId: string
}

/**
 * 执行命令审批请求组件 - 优化后的简洁设计
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
  const [showDetails, setShowDetails] = useState(false)

  const approvalEvent = event as any
  const { command, cwd, reason, call_id } = approvalEvent

  // 处理审批决策
  const handleApproval = async (decision: 'approved' | 'approved_for_session' | 'denied' | 'abort') => {
    if (isProcessing || isApproved) return

    setIsProcessing(true)
    
    try {
      await invoke('approve_exec_command', {
        conversationId,
        eventId,
        decision,
        callId: call_id
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
      alert(`审批失败: ${error}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={cn(
      "group relative bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4 transition-all duration-200",
      "hover:shadow-sm hover:border-amber-300",
      className
    )}>
      {/* 左侧指示线 */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-yellow-500 rounded-l-lg" />
      
      {/* 主要内容 */}
      <div className="ml-2">
        {/* 标题栏 - 简洁设计 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-600" />
            <span className="font-medium text-amber-900">命令执行请求</span>
            {isApproved && (
              <div className="flex items-center gap-1 text-green-700 text-xs bg-green-100 px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3" />
                已处理
              </div>
            )}
          </div>
          {timestamp && (
            <span className="text-xs text-amber-600/70 font-mono">
              {formatTime(timestamp)}
            </span>
          )}
        </div>

        {/* 命令预览 - 主要信息 */}
        <div className="bg-white/70 border border-amber-200 rounded-md px-3 py-2 mb-3 font-mono text-sm text-gray-800 break-all">
          {command.join(' ')}
        </div>

        {/* 详细信息切换 */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 mb-2 transition-colors"
        >
          {showDetails ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          {showDetails ? '隐藏详情' : '显示详情'}
        </button>

        {/* 详细信息 - 可折叠 */}
        {showDetails && (
          <div className="space-y-2 mb-3 text-xs text-gray-600 bg-white/50 p-2 rounded border border-amber-100">
            <div className="flex items-center gap-2">
              <Folder className="w-3 h-3 text-amber-600" />
              <span className="font-medium">工作目录:</span>
              <span className="font-mono">{cwd}</span>
            </div>
            
            {reason && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5" />
                <span className="font-medium">执行原因:</span>
                <span className="flex-1">{reason}</span>
              </div>
            )}
          </div>
        )}

        {/* 操作按钮 - 优化布局 */}
        {!isApproved && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={isProcessing}
              onClick={() => handleApproval('approved')}
              className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 px-3"
            >
              <Check className="w-3 h-3 mr-1" />
              {isProcessing ? '处理中...' : '批准'}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              disabled={isProcessing}
              onClick={() => handleApproval('denied')}
              className="border-red-300 text-red-600 hover:bg-red-50 text-xs h-7 px-3"
            >
              <X className="w-3 h-3 mr-1" />
              拒绝
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              disabled={isProcessing}
              onClick={() => handleApproval('approved_for_session')}
              className="border-amber-300 text-amber-700 hover:bg-amber-50 text-xs h-7 px-3"
            >
              <Check className="w-3 h-3 mr-1" />
              自动批准
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}