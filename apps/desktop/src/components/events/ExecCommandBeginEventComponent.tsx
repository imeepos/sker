import { EventMsg } from '../../types/protocol/EventMsg'
import { ExecCommandBeginEvent } from '../../types/protocol/ExecCommandBeginEvent'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/Button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { Terminal, ChevronDown, ChevronRight, Copy, CheckCircle2, Play } from 'lucide-react'
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
    <Card className={cn("border-l-4 border-l-cyan-500 bg-cyan-50", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <Terminal className="w-4 h-4 text-cyan-600" />
              <CardTitle className="text-sm font-medium text-cyan-800">
                命令执行开始
              </CardTitle>
              <Badge variant="outline" className="text-cyan-600 bg-cyan-100 border-cyan-200">
                <Play className="w-3 h-3 mr-1" />
                执行中
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {timestamp && (
                <span className="text-xs text-muted-foreground">
                  {formatTime(timestamp)}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2"
              >
                {copied ? (
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-cyan-700 mb-1">执行命令:</div>
                <div className="p-2 bg-gray-900 border border-cyan-200 rounded text-sm font-mono text-green-400">
                  $ {execData.command}
                </div>
              </div>
              
              {execData.cwd && (
                <div>
                  <div className="text-xs font-medium text-cyan-700 mb-1">工作目录:</div>
                  <div className="p-2 bg-cyan-100 border border-cyan-200 rounded text-sm font-mono text-cyan-800">
                    {execData.cwd}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-cyan-600">
                命令正在执行，请等待输出结果...
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}