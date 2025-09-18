import { EventMsg } from '../../types/protocol/EventMsg'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { CheckCircle2, Clock } from 'lucide-react'
import { cn, formatTime } from '../../lib/utils'

interface TaskCompleteEventComponentProps {
  event: EventMsg & { type: 'task_complete' }
  className?: string
  timestamp?: Date
}

export function TaskCompleteEventComponent({ className, timestamp }: TaskCompleteEventComponentProps) {

  return (
    <Card className={cn("border-l-4 border-l-green-500 bg-green-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <CardTitle className="text-sm font-medium text-green-800">
              任务完成
            </CardTitle>
            <Badge variant="outline" className="text-green-600 bg-green-100 border-green-200">
              完成
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
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Clock className="w-3 h-3" />
            <span>任务已成功完成</span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            所有操作已完成，结果已准备就绪
          </div>
        </div>
      </CardContent>
    </Card>
  )
}