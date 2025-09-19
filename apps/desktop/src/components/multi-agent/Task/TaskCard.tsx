import React from 'react'
import { 
  Clock, 
  Play, 
  CheckCircle, 
  XCircle, 
  Pause, 
  Square,
  User,
  Calendar,
  AlertTriangle,
  ArrowUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '../../ui'
import { cn } from '../../../lib/utils'
import type { Task, TaskStatus, TaskPriority } from '../../../types/multi-agent'

// 任务操作类型
export type TaskAction = 'pause' | 'resume' | 'cancel' | 'view_details'

// 组件属性
interface TaskCardProps {
  task: Task
  isSelected?: boolean
  onClick?: () => void
  onAction?: (action: TaskAction, taskId: string) => void
  showActions?: boolean
  realTimeUpdate?: boolean
}

// 任务状态样式映射
const getTaskStatusStyle = (status: TaskStatus) => {
  switch (status) {
    case 'pending':
      return { 
        color: 'text-gray-500', 
        bg: 'bg-gray-100', 
        icon: Clock,
        borderColor: 'border-gray-200'
      }
    case 'in_progress':
      return { 
        color: 'text-blue-500', 
        bg: 'bg-blue-100', 
        icon: Play,
        borderColor: 'border-blue-200'
      }
    case 'completed':
      return { 
        color: 'text-green-500', 
        bg: 'bg-green-100', 
        icon: CheckCircle,
        borderColor: 'border-green-200'
      }
    case 'failed':
      return { 
        color: 'text-red-500', 
        bg: 'bg-red-100', 
        icon: XCircle,
        borderColor: 'border-red-200'
      }
    case 'cancelled':
      return { 
        color: 'text-gray-400', 
        bg: 'bg-gray-100', 
        icon: Square,
        borderColor: 'border-gray-200'
      }
    default:
      return { 
        color: 'text-gray-500', 
        bg: 'bg-gray-100', 
        icon: Clock,
        borderColor: 'border-gray-200'
      }
  }
}

// 优先级样式映射
const getPriorityStyle = (priority: TaskPriority) => {
  switch (priority) {
    case 'urgent':
      return { 
        color: 'text-red-600', 
        bg: 'bg-red-50', 
        variant: 'destructive' as const
      }
    case 'high':
      return { 
        color: 'text-orange-600', 
        bg: 'bg-orange-50', 
        variant: 'secondary' as const
      }
    case 'medium':
      return { 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-50', 
        variant: 'secondary' as const
      }
    case 'low':
      return { 
        color: 'text-green-600', 
        bg: 'bg-green-50', 
        variant: 'outline' as const
      }
    default:
      return { 
        color: 'text-gray-600', 
        bg: 'bg-gray-50', 
        variant: 'outline' as const
      }
  }
}

// 格式化时间
const formatTime = (date?: Date) => {
  if (!date) return '--'
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  }).format(new Date(date))
}

// 计算执行时间
const calculateDuration = (startTime?: Date, endTime?: Date) => {
  if (!startTime) return '--'
  const end = endTime || new Date()
  const diffMinutes = Math.floor((end.getTime() - startTime.getTime()) / (1000 * 60))
  
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟`
  } else {
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return `${hours}小时${minutes > 0 ? ` ${minutes}分钟` : ''}`
  }
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isSelected = false,
  onClick,
  onAction,
  showActions = true,
  realTimeUpdate = false
}) => {
  const statusStyle = getTaskStatusStyle(task.status)
  const priorityStyle = getPriorityStyle(task.priority)
  const StatusIcon = statusStyle.icon

  const handleAction = (action: TaskAction) => {
    onAction?.(action, task.id)
  }

  return (
    <Card 
      className={cn(
        "task-card transition-all duration-200 hover:shadow-md cursor-pointer",
        "border-l-4",
        statusStyle.borderColor,
        isSelected && "ring-2 ring-blue-500 ring-opacity-50 shadow-lg",
        realTimeUpdate && task.status === 'in_progress' && "animate-pulse"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full",
              statusStyle.bg
            )}>
              <StatusIcon className={cn("w-4 h-4", statusStyle.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-medium line-clamp-1">
                {task.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={priorityStyle.variant} className="text-xs">
                  {task.priority === 'urgent' && <ArrowUp className="w-3 h-3 mr-1" />}
                  {task.priority}
                </Badge>
                <span className={cn("text-xs font-medium capitalize", statusStyle.color)}>
                  {task.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* 任务描述 */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {task.description}
        </p>

        {/* 进度条 */}
        <div className="task-progress">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-muted-foreground">执行进度</span>
            <span className="text-sm font-medium">{Math.round(task.progress * 100)}%</span>
          </div>
          <div className="progress-bar w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                task.status === 'in_progress' ? "bg-blue-500" : "bg-green-500"
              )}
              style={{ width: `${task.progress * 100}%` }}
            />
          </div>
        </div>

        {/* 任务信息 */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="truncate">
              {task.assignedAgent?.name || '未分配'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>
              {formatTime(task.startTime)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>
              {calculateDuration(task.startTime, task.endTime)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>
              {task.estimatedHours ? `预计${task.estimatedHours}h` : '--'}
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        {showActions && (
          <div className="flex gap-2 pt-2 border-t">
            {task.status === 'in_progress' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation()
                  handleAction('pause')
                }}
                className="flex-1"
              >
                <Pause className="w-3 h-3 mr-1" />
                暂停
              </Button>
            )}
            
            {task.status === 'pending' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation()
                  handleAction('resume')
                }}
                className="flex-1"
              >
                <Play className="w-3 h-3 mr-1" />
                开始
              </Button>
            )}
            
            {(task.status === 'in_progress' || task.status === 'pending') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation()
                  handleAction('cancel')
                }}
                className="flex-1"
              >
                <Square className="w-3 h-3 mr-1" />
                取消
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation()
                handleAction('view_details')
              }}
              className="flex-1"
            >
              查看详情
            </Button>
          </div>
        )}

        {/* 实时更新指示器 */}
        {realTimeUpdate && (
          <div className="flex items-center justify-center pt-2">
            <div className="flex items-center gap-1 text-xs text-blue-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              实时更新
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TaskCard