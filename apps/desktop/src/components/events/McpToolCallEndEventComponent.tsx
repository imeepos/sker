import { EventMsg } from '../../types/protocol/EventMsg'
import { McpToolCallEndEvent } from '../../types/protocol/McpToolCallEndEvent'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/Button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { Wrench, ChevronDown, ChevronRight, Copy, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { cn, formatTime } from '../../lib/utils'
import { safeJsonStringify } from '../../lib/text-formatting'
import { useState } from 'react'

interface McpToolCallEndEventComponentProps {
  event: EventMsg & { type: 'mcp_tool_call_end' }
  className?: string
  timestamp?: Date
}

export function McpToolCallEndEventComponent({ event, className, timestamp }: McpToolCallEndEventComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const toolData = event as McpToolCallEndEvent

  const isSuccess = 'Ok' in toolData.result
  const borderColor = isSuccess ? 'border-l-green-500' : 'border-l-red-500'
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50'

  const handleCopy = async () => {
    try {
      const toolInfo = `工具调用结束\n调用ID: ${toolData.call_id}\n结果: ${safeJsonStringify(toolData.result, null, 2)}`
      await navigator.clipboard.writeText(toolInfo)
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
              <Wrench className={cn("w-4 h-4", isSuccess ? "text-green-600" : "text-red-600")} />
              <CardTitle className={cn("text-sm font-medium", isSuccess ? "text-green-800" : "text-red-800")}>
                MCP 工具调用结束
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
                    <AlertTriangle className="w-3 h-3 mr-1" />
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
              <div>
                <div className={cn("text-xs font-medium mb-1", isSuccess ? "text-green-700" : "text-red-700")}>
                  调用ID:
                </div>
                <div className={cn("p-2 border rounded text-sm font-mono", 
                  isSuccess ? "bg-green-100 border-green-200" : "bg-red-100 border-red-200"
                )}>
                  {toolData.call_id}
                </div>
              </div>
              
              {isSuccess && toolData.result && (
                <div>
                  <div className="text-xs font-medium text-green-700 mb-1">执行结果:</div>
                  <div className="p-2 bg-green-100 border border-green-200 rounded text-xs font-mono max-h-40 overflow-auto">
                    <pre className="whitespace-pre-wrap">
                      {safeJsonStringify(toolData.result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              {!isSuccess && 'Err' in toolData.result && (
                <div>
                  <div className="text-xs font-medium text-red-700 mb-1">错误信息:</div>
                  <div className="p-2 bg-red-100 border border-red-200 rounded text-xs font-mono max-h-40 overflow-auto">
                    <pre className="whitespace-pre-wrap">
                      {toolData.result.Err}
                    </pre>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>执行时间: {toolData.duration}</span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}