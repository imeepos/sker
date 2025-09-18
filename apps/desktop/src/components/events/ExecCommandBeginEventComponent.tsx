import { EventMsg } from '../../types/protocol/EventMsg'
import { ExecCommandBeginEvent } from '../../types/protocol/ExecCommandBeginEvent'
import { Button } from '../ui/Button'
import { ChevronDown, ChevronRight, Copy, CheckCircle2, Terminal, Folder } from 'lucide-react'
import { cn, formatTime } from '../../lib/utils'
import { useState } from 'react'

interface ExecCommandBeginEventComponentProps {
  event: EventMsg & { type: 'exec_command_begin' }
  className?: string
  timestamp?: Date
}

export function ExecCommandBeginEventComponent({ event, className, timestamp }: ExecCommandBeginEventComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const execData = event as ExecCommandBeginEvent

  const handleCopy = async () => {
    try {
      const commandInfo = `命令执行开始\n命令: ${execData.command}\n工作目录: ${execData.cwd || '未指定'}`
      await navigator.clipboard.writeText(commandInfo)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <div className={cn(
      "group relative bg-blue-50/50 border border-blue-200 rounded-lg p-3 transition-all duration-200",
      "hover:bg-blue-50 hover:border-blue-300",
      className
    )}>
      {/* 左侧指示线 */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-l-lg" />
      
      {/* 主要内容 */}
      <div className="ml-2">
        {/* 标题栏 - 简洁设计 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900 text-sm">开始执行</span>
            <div className="flex items-center gap-1 text-blue-700 text-xs bg-blue-100 px-2 py-0.5 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              进行中
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {timestamp && (
              <span className="text-xs text-blue-600/70 font-mono">
                {formatTime(timestamp)}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {copied ? (
                <CheckCircle2 className="w-3 h-3 text-green-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>

        {/* 命令预览 - 始终显示 */}
        <div className="bg-slate-900 border border-blue-200 rounded px-3 py-2 mb-2 font-mono text-sm text-green-400">
          $ {execData.command}
        </div>

        {/* 详细信息切换 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 transition-colors"
        >
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          {isExpanded ? '隐藏详情' : '显示详情'}
        </button>

        {/* 详细信息 - 可折叠 */}
        {isExpanded && execData.cwd && (
          <div className="mt-2 text-xs text-gray-600 bg-white/70 p-2 rounded border border-blue-100">
            <div className="flex items-center gap-2">
              <Folder className="w-3 h-3 text-blue-600" />
              <span className="font-medium">工作目录:</span>
              <span className="font-mono">{execData.cwd}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}