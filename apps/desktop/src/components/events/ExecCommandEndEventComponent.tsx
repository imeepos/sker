import { EventMsg } from '../../types/protocol/EventMsg'
import { ExecCommandEndEvent } from '../../types/protocol/ExecCommandEndEvent'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/Button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { Terminal, ChevronDown, ChevronRight, Copy, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { cn, formatTime } from '../../lib/utils'
import { useState } from 'react'

interface ExecCommandEndEventComponentProps {
  event: EventMsg & { type: 'exec_command_end' }
  className?: string
  timestamp?: Date
}

export function ExecCommandEndEventComponent({ event, className, timestamp }: ExecCommandEndEventComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const execData = event as ExecCommandEndEvent

  const isSuccess = execData.exit_code === 0
  const borderColor = isSuccess ? 'border-l-green-500' : 'border-l-red-500'
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50'

  const handleCopy = async () => {
    try {
      const execInfo = `命令执行结束\n退出代码: ${execData.exit_code}`
      await navigator.clipboard.writeText(execInfo)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <Card className={cn("border-l-4", borderColor, bgColor, className)}>
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
              <Terminal className={cn("w-4 h-4", isSuccess ? "text-green-600" : "text-red-600")} />
              <CardTitle className={cn("text-sm font-medium", isSuccess ? "text-green-800" : "text-red-800")}>
                命令执行结束
              </CardTitle>
              <Badge variant={isSuccess ? "outline" : "destructive"} className={cn(
                isSuccess ? "text-green-600 bg-green-100 border-green-200" : ""
              )}>
                {isSuccess ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    成功
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    失败
                  </>
                )}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className={cn("text-xs font-medium mb-1", isSuccess ? "text-green-700" : "text-red-700")}>
                    退出代码:
                  </div>
                  <div className={cn("p-2 border rounded text-sm font-mono text-center", 
                    isSuccess ? "bg-green-100 border-green-200 text-green-800" : "bg-red-100 border-red-200 text-red-800"
                  )}>
                    {execData.exit_code}
                  </div>
                </div>
                
              </div>
              
              <div className={cn("flex items-center gap-2 text-xs", 
                isSuccess ? "text-green-600" : "text-red-600"
              )}>
                {isSuccess ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                <span>
                  {isSuccess ? '命令执行成功完成' : '命令执行失败'}
                </span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}