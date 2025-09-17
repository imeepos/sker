import { EventMsg } from '../../types/protocol/EventMsg'
import { WebSearchBeginEvent } from '../../types/protocol/WebSearchBeginEvent'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/Button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { Search, ChevronDown, ChevronRight, Copy, CheckCircle2, Globe } from 'lucide-react'
import { cn, formatTime } from '../../lib/utils'
import { useState } from 'react'

interface WebSearchBeginEventComponentProps {
  event: EventMsg & { type: 'web_search_begin' }
  className?: string
  timestamp?: Date
}

export function WebSearchBeginEventComponent({ event, className, timestamp }: WebSearchBeginEventComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const searchData = event as WebSearchBeginEvent

  const handleCopy = async () => {
    try {
      const searchInfo = `网络搜索开始\n调用ID: ${searchData.call_id}`
      await navigator.clipboard.writeText(searchInfo)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <Card className={cn("border-l-4 border-l-indigo-500 bg-indigo-50", className)}>
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
              <Search className="w-4 h-4 text-indigo-600" />
              <CardTitle className="text-sm font-medium text-indigo-800">
                网络搜索开始
              </CardTitle>
              <Badge variant="outline" className="text-indigo-600 bg-indigo-100 border-indigo-200">
                <Globe className="w-3 h-3 mr-1" />
                搜索中
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
                <div className="text-xs font-medium text-indigo-700 mb-1">调用ID:</div>
                <div className="p-2 bg-indigo-100 border border-indigo-200 rounded text-sm text-indigo-800 font-mono">
                  {searchData.call_id}
                </div>
              </div>
              
              <div className="text-xs text-indigo-600">
                正在搜索网络资源，请稍候...
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}