import React, { useState, useEffect, useMemo } from 'react'
import { 
  Activity, 
  ChevronUp, 
  ChevronDown,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  GitBranch,
  FileText,
  TrendingUp
} from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Badge,
  Button,
  ScrollArea
} from '../../ui'
import { cn } from '../../../lib/utils'
import type { TaskStatus, ExecutionSession } from '../../../types/multi-agent'

// 时间线项目属性
interface TimelineItemProps {
  session: ExecutionSession
  isExpanded: boolean
  onToggleExpand: () => void
  onClick?: () => void
}

// 执行详情属性  
interface ExecutionDetailsProps {
  session: ExecutionSession
}

// 组件属性
interface TaskExecutionTimelineProps {
  sessions?: ExecutionSession[]
  onSessionClick?: (session: ExecutionSession) => void
  autoRefresh?: boolean
  refreshInterval?: number
  showMetrics?: boolean
}

// 会话状态样式映射
const getSessionStatusStyle = (status: TaskStatus) => {
  switch (status) {
    case 'pending':
      return { 
        color: 'border-gray-400 bg-gray-100', 
        icon: Clock,
        badgeVariant: 'secondary' as const
      }
    case 'in_progress':
      return { 
        color: 'border-blue-500 bg-blue-100', 
        icon: Play,
        badgeVariant: 'default' as const
      }
    case 'completed':
      return { 
        color: 'border-green-500 bg-green-100', 
        icon: CheckCircle,
        badgeVariant: 'secondary' as const
      }
    case 'failed':
      return { 
        color: 'border-red-500 bg-red-100', 
        icon: XCircle,
        badgeVariant: 'destructive' as const
      }
    case 'cancelled':
      return { 
        color: 'border-gray-400 bg-gray-100', 
        icon: Pause,
        badgeVariant: 'outline' as const
      }
    default:
      return { 
        color: 'border-gray-400 bg-gray-100', 
        icon: Clock,
        badgeVariant: 'outline' as const
      }
  }
}

// 会话状态图标
const getSessionStatusIcon = (status: TaskStatus) => {
  const config = getSessionStatusStyle(status)
  const Icon = config.icon
  return <Icon className="w-4 h-4" />
}

// 格式化时间
const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(date))
}

// 计算持续时间
const calculateDuration = (startedAt: Date, completedAt?: Date) => {
  const end = completedAt || new Date()
  const diffMinutes = Math.floor((end.getTime() - startedAt.getTime()) / (1000 * 60))
  
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟`
  } else {
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return `${hours}小时${minutes > 0 ? ` ${minutes}分钟` : ''}`
  }
}

// 执行详情组件
const ExecutionDetails: React.FC<ExecutionDetailsProps> = ({ session }) => {
  return (
    <div className="space-y-4">
      {/* 执行概要 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">执行Agent:</span>
            <span>{session.agentId}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">开始时间:</span>
            <span>{formatTime(session.startedAt)}</span>
          </div>
          {session.completedAt && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">完成时间:</span>
              <span>{formatTime(session.completedAt)}</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">执行进度:</span>
            <span>{Math.round(session.progress)}%</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">执行时长:</span>
            <span>{calculateDuration(session.startedAt, session.completedAt)}</span>
          </div>
          {session.gitBranch && (
            <div className="flex items-center gap-2 text-sm">
              <GitBranch className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">分支:</span>
              <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                {session.gitBranch}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 进度条 */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">执行进度</span>
          <span className="text-sm text-muted-foreground">{Math.round(session.progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-300",
              session.status === 'completed' ? 'bg-green-500' :
              session.status === 'failed' ? 'bg-red-500' :
              session.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
            )}
            style={{ width: `${session.progress}%` }}
          />
        </div>
      </div>

      {/* 执行结果 */}
      {session.result && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            执行结果
          </h4>
          <div className="bg-gray-50 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {session.result.success ? '执行成功' : '执行失败'}
              </span>
              <Badge variant={session.result.success ? 'secondary' : 'destructive'}>
                {session.result.success ? 'SUCCESS' : 'FAILED'}
              </Badge>
            </div>
            
            {session.result.deliverables && session.result.deliverables.length > 0 && (
              <div>
                <span className="text-sm font-medium">交付物:</span>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {session.result.deliverables.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {session.result.gitCommits && session.result.gitCommits.length > 0 && (
              <div>
                <span className="text-sm font-medium">Git提交:</span>
                <div className="space-y-1">
                  {session.result.gitCommits.map((commit, index) => (
                    <div key={index} className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {commit}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {session.result.testResults && (
              <div>
                <span className="text-sm font-medium">测试结果:</span>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>通过: {session.result.testResults.passed}</div>
                  <div>失败: {session.result.testResults.failed}</div>
                  <div>总计: {session.result.testResults.total}</div>
                  {session.result.testResults.coverage && (
                    <div>覆盖率: {session.result.testResults.coverage}%</div>
                  )}
                </div>
              </div>
            )}
            
            {session.result.error && (
              <div>
                <span className="text-sm font-medium text-red-600">错误信息:</span>
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded font-mono">
                  {session.result.error}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 执行日志预览 */}
      {session.executionLog && session.executionLog.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            执行日志 ({session.executionLog.length} 条)
          </h4>
          <ScrollArea className="h-32">
            <div className="space-y-1">
              {session.executionLog.slice(-10).map((log, index) => (
                <div key={index} className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {formatTime(log.timestamp)}
                    </span>
                    <Badge 
                      variant={
                        log.level === 'error' ? 'destructive' :
                        log.level === 'warn' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {log.level.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="font-mono text-xs bg-gray-100 p-1 rounded">
                    {log.message}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

// 时间线项目组件
const TimelineItem: React.FC<TimelineItemProps> = ({
  session,
  isExpanded,
  onToggleExpand,
  onClick
}) => {
  const statusStyle = getSessionStatusStyle(session.status)

  return (
    <div className="relative flex items-start gap-4 pb-8">
      {/* 时间线节点 */}
      <div className={cn(
        "relative z-10 w-8 h-8 rounded-full border-2 bg-background flex items-center justify-center",
        statusStyle.color
      )}>
        {getSessionStatusIcon(session.status)}
      </div>
      
      {/* 会话内容 */}
      <div className="flex-1">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">执行会话 #{session.id.slice(-8)}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={statusStyle.badgeVariant}>
                  {session.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleExpand()
                  }}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Agent: {session.agentId} • 
              开始: {formatTime(session.startedAt)} • 
              耗时: {calculateDuration(session.startedAt, session.completedAt)}
            </div>
          </CardHeader>
          
          {isExpanded && (
            <CardContent>
              <ExecutionDetails session={session} />
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

// 主组件
export const TaskExecutionTimeline: React.FC<TaskExecutionTimelineProps> = ({
  sessions = [],
  onSessionClick,
  autoRefresh = true,
  refreshInterval = 5000,
  showMetrics = true
}) => {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())

  // 排序会话，最新的在前
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    )
  }, [sessions])

  // 计算总体统计
  const stats = useMemo(() => {
    const totalSessions = sessions.length
    const completedSessions = sessions.filter(s => s.status === 'completed').length
    const failedSessions = sessions.filter(s => s.status === 'failed').length
    const inProgressSessions = sessions.filter(s => s.status === 'in_progress').length
    
    const totalDuration = sessions
      .filter(s => s.completedAt)
      .reduce((sum, s) => {
        const duration = (new Date(s.completedAt!).getTime() - new Date(s.startedAt).getTime()) / (1000 * 60)
        return sum + duration
      }, 0)
    
    const averageDuration = completedSessions > 0 ? totalDuration / completedSessions : 0
    const successRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0

    return {
      totalSessions,
      completedSessions,
      failedSessions,
      inProgressSessions,
      averageDuration,
      successRate
    }
  }, [sessions])

  // 切换会话展开状态
  const toggleSessionExpansion = (sessionId: string) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId)
      } else {
        newSet.add(sessionId)
      }
      return newSet
    })
  }

  // 自动刷新活跃会话状态
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // 这里可以触发活跃会话的状态刷新
      const activeSessions = sessions.filter(s => s.status === 'in_progress')
      if (activeSessions.length > 0) {
        console.log(`刷新 ${activeSessions.length} 个活跃会话的状态`)
        // 实际实现中可以调用 refreshSessionStatus API
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [sessions, autoRefresh, refreshInterval])

  return (
    <Card className="task-execution-timeline">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          任务执行时间线
          {autoRefresh && (
            <Badge variant="outline" className="ml-auto">
              实时更新
            </Badge>
          )}
        </CardTitle>
        
        {/* 统计信息 */}
        {showMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <div className="text-sm text-muted-foreground">总执行次数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{Math.round(stats.successRate)}%</div>
              <div className="text-sm text-muted-foreground">成功率</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(stats.averageDuration)}</div>
              <div className="text-sm text-muted-foreground">平均时长(分钟)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgressSessions}</div>
              <div className="text-sm text-muted-foreground">进行中</div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {sortedSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Activity className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg">暂无执行记录</p>
            <p className="text-sm">任务开始执行后将显示执行时间线</p>
          </div>
        ) : (
          <div className="relative">
            {/* 时间线主轴 */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            
            {sortedSessions.map((session) => (
              <TimelineItem
                key={session.id}
                session={session}
                isExpanded={expandedSessions.has(session.id)}
                onToggleExpand={() => toggleSessionExpansion(session.id)}
                onClick={() => onSessionClick?.(session)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TaskExecutionTimeline