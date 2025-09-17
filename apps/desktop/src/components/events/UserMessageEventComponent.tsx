import { EventMsg } from '../../types/protocol/EventMsg'
import { UserMessageEvent } from '../../types/protocol/UserMessageEvent'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/Button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { User, ChevronDown, ChevronRight, Copy, CheckCircle2 } from 'lucide-react'
import { cn, formatTime } from '../../lib/utils'
import { safeJsonStringify } from '../../lib/text-formatting'
import { useState } from 'react'

interface UserMessageEventComponentProps {
  event: EventMsg & { type: 'user_message' }
  className?: string
  timestamp?: Date
}

export function UserMessageEventComponent({ event, className, timestamp }: UserMessageEventComponentProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [copied, setCopied] = useState(false)

  const messageData = event as UserMessageEvent

  const handleCopy = async () => {
    try {
      const messageText = safeJsonStringify(messageData.message, null, 2)
      await navigator.clipboard.writeText(messageText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <Card className={cn("border-l-4 border-l-emerald-500 bg-emerald-50", className)}>
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
              <User className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm font-medium text-emerald-800">
                用户消息
              </CardTitle>
              <Badge variant="outline" className="text-emerald-600 bg-emerald-100 border-emerald-200">
                用户
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
            <div className="p-3 bg-emerald-100 border border-emerald-200 rounded text-sm">
              <pre className="whitespace-pre-wrap font-mono text-emerald-800">
                {safeJsonStringify(messageData.message, null, 2)}
              </pre>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}