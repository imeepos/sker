import { EventMsg } from '../../types/protocol/EventMsg'
import { TaskStartedEvent } from '../../types/protocol/TaskStartedEvent'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Play, Info } from 'lucide-react'
import { cn, formatTime } from '../../lib/utils'

interface TaskStartedEventComponentProps {
  event: EventMsg & { type: 'task_started' }
  className?: string
  timestamp?: Date
}

export function TaskStartedEventComponent({ event, className, timestamp }: TaskStartedEventComponentProps) {
  const taskData = event as TaskStartedEvent

  return (
    <Card className={cn("border-l-4 border-l-blue-500 bg-blue-50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-sm font-medium text-blue-800">
              任务开始
            </CardTitle>
            <Badge variant="outline" className="text-blue-600 bg-blue-100 border-blue-200">
              开始
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
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Info className="w-3 h-3" />
            <span>任务已启动，正在准备执行</span>
          </div>
          
          {taskData.model_context_window && (
            <div className="text-xs text-muted-foreground">
              模型上下文窗口: {taskData.model_context_window.toString()} tokens
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}