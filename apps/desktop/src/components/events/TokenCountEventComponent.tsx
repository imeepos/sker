import { EventMsg } from '../../types/protocol/EventMsg'
import { TokenCountEvent } from '../../types/protocol/TokenCountEvent'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { BarChart3, TrendingUp } from 'lucide-react'
import { cn, formatTime } from '../../lib/utils'

interface TokenCountEventComponentProps {
  event: EventMsg & { type: 'token_count' }
  className?: string
  timestamp?: Date
}

export function TokenCountEventComponent({ event, className, timestamp }: TokenCountEventComponentProps) {
  const tokenData = event as TokenCountEvent
  const usage = tokenData.info?.last_token_usage

  const formatTokenCount = (count: number | bigint) => {
    const num = typeof count === 'bigint' ? Number(count) : count
    return num.toLocaleString()
  }

  return (
    <Card className={cn("border-l-4 border-l-purple-500 bg-purple-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-600" />
            <CardTitle className="text-sm font-medium text-purple-800">
              Token 使用统计
            </CardTitle>
            <Badge variant="outline" className="text-purple-600 bg-purple-100 border-purple-200">
              统计
            </Badge>
          </div>
          
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {formatTime(timestamp)}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {usage ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-2 bg-purple-100 rounded">
                <div className="text-xs text-purple-600 font-medium">输入</div>
                <div className="text-sm font-bold text-purple-800">
                  {formatTokenCount(usage.input_tokens)}
                </div>
              </div>
              
              <div className="text-center p-2 bg-purple-100 rounded">
                <div className="text-xs text-purple-600 font-medium">输出</div>
                <div className="text-sm font-bold text-purple-800">
                  {formatTokenCount(usage.output_tokens)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-purple-700">
              <TrendingUp className="w-3 h-3" />
              <span>
                总计: {formatTokenCount(Number(usage.input_tokens) + Number(usage.output_tokens))} tokens
              </span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">暂无Token使用信息</div>
        )}
      </CardContent>
    </Card>
  )
}