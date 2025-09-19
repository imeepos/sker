import React, { useMemo } from 'react'
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Users,
  Target,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Badge
} from '../../ui'
import { cn } from '../../../lib/utils'
import type { Task, Agent } from '../../../types/multi-agent'

// 性能指标数据接口
interface MetricsData {
  completionTime: {
    average: number
    trend: 'up' | 'down' | 'stable'
    data: Array<{ period: string; value: number }>
  }
  successRate: {
    current: number
    trend: 'up' | 'down' | 'stable'
    data: Array<{ period: string; value: number }>
  }
  agentPerformance: Array<{
    agentId: string
    agentName: string
    completedTasks: number
    averageTime: number
    successRate: number
    efficiency: number
  }>
  taskDistribution: Array<{
    status: string
    count: number
    percentage: number
  }>
}

// 组件属性
interface TaskMetricsChartProps {
  tasks: Task[]
  agents: Agent[]
  timeRange?: 'day' | 'week' | 'month' | 'quarter'
  showTrends?: boolean
  showComparisons?: boolean
}

// 计算性能指标
const calculateMetrics = (tasks: Task[], agents: Agent[], timeRange: string): MetricsData => {
  // 计算完成时间相关指标
  const completedTasks = tasks.filter(task => 
    task.status === 'completed' && task.startTime && task.endTime
  )
  
  const completionTimes = completedTasks.map(task => {
    const start = new Date(task.startTime!).getTime()
    const end = new Date(task.endTime!).getTime()
    return (end - start) / (1000 * 60) // 转换为分钟
  })
  
  const averageCompletionTime = completionTimes.length > 0 
    ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length 
    : 0

  // 计算成功率
  const totalTasks = tasks.length
  const successfulTasks = tasks.filter(task => task.status === 'completed').length
  const currentSuccessRate = totalTasks > 0 ? (successfulTasks / totalTasks) * 100 : 0

  // 计算Agent性能
  const agentPerformance = agents.map(agent => {
    const agentTasks = tasks.filter(task => task.assignedAgent?.id === agent.id)
    const agentCompleted = agentTasks.filter(task => task.status === 'completed')
    
    const agentCompletionTimes = agentCompleted
      .filter(task => task.startTime && task.endTime)
      .map(task => {
        const start = new Date(task.startTime!).getTime()
        const end = new Date(task.endTime!).getTime()
        return (end - start) / (1000 * 60)
      })
    
    const agentAverageTime = agentCompletionTimes.length > 0
      ? agentCompletionTimes.reduce((sum, time) => sum + time, 0) / agentCompletionTimes.length
      : 0
    
    const agentSuccessRate = agentTasks.length > 0 
      ? (agentCompleted.length / agentTasks.length) * 100 
      : 0
    
    // 效率指标：完成任务数量相对于平均时间的比率
    const efficiency = agentAverageTime > 0 ? agentCompleted.length / agentAverageTime * 100 : 0

    return {
      agentId: agent.id,
      agentName: agent.name,
      completedTasks: agentCompleted.length,
      averageTime: agentAverageTime,
      successRate: agentSuccessRate,
      efficiency: Math.min(efficiency, 100) // 限制在100以内
    }
  })

  // 计算任务状态分布
  const statusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const taskDistribution = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage: totalTasks > 0 ? (count / totalTasks) * 100 : 0
  }))

  // 模拟趋势数据（实际应用中应该从历史数据计算）
  const mockTrendData = (baseValue: number) => {
    const periods = timeRange === 'day' ? 24 : timeRange === 'week' ? 7 : 30
    return Array.from({ length: periods }, (_, i) => ({
      period: `${i + 1}`,
      value: baseValue + (Math.random() - 0.5) * baseValue * 0.2
    }))
  }

  return {
    completionTime: {
      average: averageCompletionTime,
      trend: 'stable',
      data: mockTrendData(averageCompletionTime)
    },
    successRate: {
      current: currentSuccessRate,
      trend: 'up',
      data: mockTrendData(currentSuccessRate)
    },
    agentPerformance,
    taskDistribution
  }
}

// 状态颜色映射
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500'
    case 'in_progress':
      return 'bg-blue-500'
    case 'pending':
      return 'bg-gray-400'
    case 'failed':
      return 'bg-red-500'
    case 'cancelled':
      return 'bg-gray-500'
    default:
      return 'bg-gray-400'
  }
}

// 状态中文映射
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'in_progress':
      return '进行中'
    case 'pending':
      return '待处理'
    case 'failed':
      return '失败'
    case 'cancelled':
      return '已取消'
    default:
      return status
  }
}

// 趋势指示器组件
const TrendIndicator: React.FC<{ 
  trend: 'up' | 'down' | 'stable'
  value?: number 
}> = ({ trend, value }) => {
  const getConfig = () => {
    switch (trend) {
      case 'up':
        return { 
          icon: TrendingUp, 
          color: 'text-green-600', 
          bg: 'bg-green-100',
          label: value ? `+${value.toFixed(1)}%` : '上升'
        }
      case 'down':
        return { 
          icon: TrendingUp, 
          color: 'text-red-600', 
          bg: 'bg-red-100',
          label: value ? `-${value.toFixed(1)}%` : '下降',
          rotation: 'rotate-180'
        }
      case 'stable':
        return { 
          icon: Activity, 
          color: 'text-gray-600', 
          bg: 'bg-gray-100',
          label: '稳定'
        }
    }
  }

  const config = getConfig()
  const Icon = config.icon

  return (
    <div className={cn("flex items-center gap-1 px-2 py-1 rounded text-xs", config.bg)}>
      <Icon className={cn("w-3 h-3", config.color, config.rotation)} />
      <span className={config.color}>{config.label}</span>
    </div>
  )
}

// 简单条形图组件
const SimpleBarChart: React.FC<{ 
  data: Array<{ label: string; value: number; color?: string }>
  maxValue?: number
}> = ({ data, maxValue }) => {
  const max = maxValue || Math.max(...data.map(d => d.value))
  
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="w-16 text-sm text-right">{item.label}</div>
          <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
            <div
              className={cn("h-full rounded-full", item.color || "bg-blue-500")}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <div className="w-12 text-sm text-right">{item.value.toFixed(0)}</div>
        </div>
      ))}
    </div>
  )
}

// 主组件
export const TaskMetricsChart: React.FC<TaskMetricsChartProps> = ({
  tasks,
  agents,
  timeRange = 'week',
  showTrends = true,
  showComparisons = true
}) => {
  const metrics = useMemo(() => {
    return calculateMetrics(tasks, agents, timeRange)
  }, [tasks, agents, timeRange])

  const timeRangeLabels = {
    day: '今日',
    week: '本周',
    month: '本月',
    quarter: '本季度'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* 执行时间趋势 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4" />
            平均执行时间
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {metrics.completionTime.average.toFixed(1)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">分钟</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {timeRangeLabels[timeRange]}平均值
                </div>
              </div>
              {showTrends && (
                <TrendIndicator trend={metrics.completionTime.trend} />
              )}
            </div>
            
            {/* 简单的趋势线 */}
            <div className="h-16 bg-gray-50 rounded flex items-end gap-1 p-2">
              {metrics.completionTime.data.slice(-7).map((point, index) => {
                const maxValue = Math.max(...metrics.completionTime.data.map(d => d.value))
                const height = Math.max((point.value / maxValue) * 100, 5)
                return (
                  <div
                    key={index}
                    className="bg-blue-500 rounded-sm flex-1"
                    style={{ height: `${height}%` }}
                    title={`${point.period}: ${point.value.toFixed(1)}分钟`}
                  />
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 成功率指标 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="w-4 h-4" />
            任务成功率
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {metrics.successRate.current.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {timeRangeLabels[timeRange]}成功率
                </div>
              </div>
              {showTrends && (
                <TrendIndicator trend={metrics.successRate.trend} />
              )}
            </div>
            
            {/* 成功率环形图 */}
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gray-200">
                <div 
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-green-600"
                  style={{
                    background: `conic-gradient(#22c55e 0deg ${metrics.successRate.current * 3.6}deg, #e5e7eb ${metrics.successRate.current * 3.6}deg 360deg)`
                  }}
                />
                <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 任务状态分布 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChart className="w-4 h-4" />
            任务状态分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.taskDistribution.map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <div className={cn("w-3 h-3 rounded-full", getStatusColor(item.status))} />
                <div className="flex-1 flex justify-between">
                  <span className="text-sm">{getStatusLabel(item.status)}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent性能对比 */}
      {showComparisons && (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4" />
              Agent性能对比
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 完成任务数量 */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  完成任务数量
                </h4>
                <SimpleBarChart
                  data={metrics.agentPerformance.map(agent => ({
                    label: agent.agentName,
                    value: agent.completedTasks,
                    color: 'bg-blue-500'
                  }))}
                />
              </div>

              {/* 效率指标 */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  效率指标
                </h4>
                <SimpleBarChart
                  data={metrics.agentPerformance.map(agent => ({
                    label: agent.agentName,
                    value: agent.efficiency,
                    color: 'bg-green-500'
                  }))}
                  maxValue={100}
                />
              </div>
            </div>

            {/* Agent详细数据表格 */}
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3">详细数据</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">Agent</th>
                      <th className="text-center p-3">完成任务</th>
                      <th className="text-center p-3">平均耗时</th>
                      <th className="text-center p-3">成功率</th>
                      <th className="text-center p-3">效率分数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.agentPerformance.map((agent, index) => (
                      <tr key={agent.agentId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="p-3 font-medium">{agent.agentName}</td>
                        <td className="text-center p-3">{agent.completedTasks}</td>
                        <td className="text-center p-3">{agent.averageTime.toFixed(1)}分钟</td>
                        <td className="text-center p-3">
                          <Badge variant={agent.successRate >= 80 ? 'secondary' : 'outline'}>
                            {agent.successRate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="text-center p-3">
                          <Badge variant={agent.efficiency >= 70 ? 'secondary' : 'outline'}>
                            {agent.efficiency.toFixed(1)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default TaskMetricsChart