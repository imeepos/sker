import { EventMsg } from '../../types/protocol/EventMsg'
import { McpToolCallBeginEvent } from '../../types/protocol/McpToolCallBeginEvent'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/Button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { Wrench, ChevronDown, ChevronRight, Copy, CheckCircle2, Play } from 'lucide-react'
import { cn, formatTime } from '../../lib/utils'
import { safeJsonStringify } from '../../lib/text-formatting'
import { useState } from 'react'

interface McpToolCallBeginEventComponentProps {
  event: EventMsg & { type: 'mcp_tool_call_begin' }
  className?: string
  timestamp?: Date
}

export function McpToolCallBeginEventComponent({ event, className, timestamp }: McpToolCallBeginEventComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const toolData = event as McpToolCallBeginEvent

  const handleCopy = async () => {
    try {
      const toolInfo = `工具调用开始\n调用ID: ${toolData.call_id}\n工具: ${safeJsonStringify(toolData.invocation, null, 2)}`
      await navigator.clipboard.writeText(toolInfo)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <Card className={cn("border-l-4 border-l-yellow-500 bg-yellow-50", className)}>
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
              <Wrench className="w-4 h-4 text-yellow-600" />
              <CardTitle className="text-sm font-medium text-yellow-800">
                MCP 工具调用开始
              </CardTitle>
              <Badge variant="outline" className="text-yellow-600 bg-yellow-100 border-yellow-200">
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
                <div className="text-xs font-medium text-yellow-700 mb-1">调用ID:</div>
                <div className="p-2 bg-yellow-100 border border-yellow-200 rounded text-sm font-mono">
                  {toolData.call_id}
                </div>
              </div>
              
              <div>
                <div className="text-xs font-medium text-yellow-700 mb-1">工具信息:</div>
                <div className="p-2 bg-yellow-100 border border-yellow-200 rounded text-xs font-mono max-h-40 overflow-auto">
                  <pre className="whitespace-pre-wrap">
                    {safeJsonStringify(toolData.invocation, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}