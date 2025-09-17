import { EventMsg } from '../../types/protocol/EventMsg'
import { WebSearchEndEvent } from '../../types/protocol/WebSearchEndEvent'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/Button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { Search, ChevronDown, ChevronRight, Copy, CheckCircle2, Globe } from 'lucide-react'
import { cn, formatTime } from '../../lib/utils'
import { safeJsonStringify } from '../../lib/text-formatting'
import { useState } from 'react'

interface WebSearchEndEventComponentProps {
  event: EventMsg & { type: 'web_search_end' }
  className?: string
  timestamp?: Date
}

export function WebSearchEndEventComponent({ event, className, timestamp }: WebSearchEndEventComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const searchData = event as WebSearchEndEvent

  const handleCopy = async () => {
    try {
      const searchInfo = `网络搜索结束\n结果: ${safeJsonStringify(searchData, null, 2)}`
      await navigator.clipboard.writeText(searchInfo)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <Card className={cn("border-l-4 border-l-green-500 bg-green-50", className)}>
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
              <Search className="w-4 h-4 text-green-600" />
              <CardTitle className="text-sm font-medium text-green-800">
                网络搜索完成
              </CardTitle>
              <Badge variant="outline" className="text-green-600 bg-green-100 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                完成
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
                <div className="text-xs font-medium text-green-700 mb-1">搜索结果:</div>
                <div className="p-2 bg-green-100 border border-green-200 rounded text-xs font-mono max-h-40 overflow-auto">
                  <pre className="whitespace-pre-wrap">
                    {safeJsonStringify(searchData, null, 2)}
                  </pre>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-green-600">
                <Globe className="w-3 h-3" />
                <span>搜索已完成，结果已获取</span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}