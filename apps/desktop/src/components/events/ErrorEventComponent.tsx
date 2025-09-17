import { EventMsg } from '../../types/protocol/EventMsg'
import { ErrorEvent } from '../../types/protocol/ErrorEvent'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/Button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { AlertTriangle, ChevronDown, ChevronRight, Copy, CheckCircle2 } from 'lucide-react'
import { cn, formatTime } from '../../lib/utils'
import { safeJsonStringify } from '../../lib/text-formatting'
import { useState } from 'react'

interface ErrorEventComponentProps {
  event: EventMsg & { type: 'error' }
  className?: string
  timestamp?: Date
}

export function ErrorEventComponent({ event, className, timestamp }: ErrorEventComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const errorData = event as ErrorEvent

  const handleCopy = async () => {
    try {
      const errorText = `错误信息: ${errorData.message || '未知错误'}\n详细信息: ${safeJsonStringify(errorData, null, 2)}`
      await navigator.clipboard.writeText(errorText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <Card className={cn("border-l-4 border-l-red-500 bg-red-50", className)}>
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
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <CardTitle className="text-sm font-medium text-red-800">
                错误事件
              </CardTitle>
              <Badge variant="destructive">
                错误
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
              {errorData.message && (
                <div>
                  <div className="text-xs font-medium text-red-700 mb-1">错误消息:</div>
                  <div className="p-2 bg-red-100 border border-red-200 rounded text-sm text-red-800">
                    {errorData.message}
                  </div>
                </div>
              )}
              
              <div>
                <div className="text-xs font-medium text-red-700 mb-1">完整错误信息:</div>
                <div className="p-2 bg-red-100 border border-red-200 rounded text-xs font-mono max-h-40 overflow-auto">
                  <pre className="whitespace-pre-wrap">
                    {safeJsonStringify(errorData, null, 2)}
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