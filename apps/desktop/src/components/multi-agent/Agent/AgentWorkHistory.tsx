/**
 * AgentWorkHistory组件 - Agent工作历史展示组件
 */

import React, { useState, useMemo, useEffect } from 'react'
import { 
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Filter,
  TrendingUp,
  BarChart3,
  Activity,
  RefreshCw
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '../../ui'

// 工作记录接口
interface WorkRecord {
  id: string
  taskId: string
  taskTitle: string
  taskType: 'development' | 'review' | 'testing' | 'management'
  status: 'completed' | 'failed' | 'cancelled' | 'timeout'
  startTime: string
  endTime?: string
  duration?: number // 分钟
  errorMessage?: string
  tags: string[]
  metrics?: {
    linesOfCode?: number
    filesChanged?: number
    testsAdded?: number
    bugsFound?: number
  }
}

// 统计数据接口
interface WorkStats {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  averageDuration: number
  successRate: number
  productivityTrend: Array<{ date: string; tasksCompleted: number }>
  skillUsage: Array<{ skill: string; count: number }>
}

interface AgentWorkHistoryProps {
  agentId: string
  className?: string
}

// 任务类型配置
const TASK_TYPE_CONFIG = {
  development: {
    label: '开发',
    color: 'bg-blue-100 text-blue-800',
    icon: '💻'
  },
  review: {
    label: '审查',
    color: 'bg-purple-100 text-purple-800',
    icon: '🔍'
  },
  testing: {
    label: '测试',
    color: 'bg-green-100 text-green-800',
    icon: '🧪'
  },
  management: {
    label: '管理',
    color: 'bg-orange-100 text-orange-800',
    icon: '📋'
  }
}

// 状态配置
const STATUS_CONFIG = {
  completed: {
    label: '完成',
    color: 'text-green-600',
    bg: 'bg-green-100',
    icon: CheckCircle2
  },
  failed: {
    label: '失败',
    color: 'text-red-600',
    bg: 'bg-red-100',
    icon: XCircle
  },
  cancelled: {
    label: '取消',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    icon: XCircle
  },
  timeout: {
    label: '超时',
    color: 'text-orange-600',
    bg: 'bg-orange-100',
    icon: AlertTriangle
  }
}

// 模拟数据生成
const generateMockWorkHistory = (): WorkRecord[] => {
  const records: WorkRecord[] = []
  const now = new Date()
  
  // 生成最近30天的工作记录
  for (let i = 0; i < 50; i++) {
    const date = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    const taskTypes = Object.keys(TASK_TYPE_CONFIG) as Array<keyof typeof TASK_TYPE_CONFIG>
    const statuses = Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>
    
    const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const duration = Math.floor(Math.random() * 120) + 15 // 15-135分钟
    
    records.push({
      id: `record-${i}`,
      taskId: `task-${Math.floor(Math.random() * 1000)}`,
      taskTitle: `${TASK_TYPE_CONFIG[taskType].label}任务 #${i + 1}`,
      taskType,
      status,
      startTime: date.toISOString(),
      endTime: status !== 'cancelled' ? new Date(date.getTime() + duration * 60 * 1000).toISOString() : undefined,
      duration: status !== 'cancelled' ? duration : undefined,
      errorMessage: status === 'failed' ? '执行过程中遇到错误' : undefined,
      tags: ['React', 'TypeScript', 'API'].slice(0, Math.floor(Math.random() * 3) + 1),
      metrics: taskType === 'development' ? {
        linesOfCode: Math.floor(Math.random() * 500) + 100,
        filesChanged: Math.floor(Math.random() * 10) + 1,
        testsAdded: Math.floor(Math.random() * 5)
      } : undefined
    })
  }
  
  return records.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
}

// 计算统计数据
const calculateStats = (records: WorkRecord[]): WorkStats => {
  const completedTasks = records.filter(r => r.status === 'completed').length
  const failedTasks = records.filter(r => r.status === 'failed').length
  const totalTasks = records.length
  
  const durations = records.filter(r => r.duration).map(r => r.duration!)
  const averageDuration = durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0
  
  const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  
  // 计算生产力趋势（最近7天）
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split('T')[0]
  }).reverse()
  
  const productivityTrend = last7Days.map(date => {
    const tasksCompleted = records.filter(r => 
      r.status === 'completed' && 
      r.startTime.split('T')[0] === date
    ).length
    return { date, tasksCompleted }
  })
  
  // 计算技能使用统计
  const skillUsage = new Map<string, number>()
  records.forEach(record => {
    record.tags.forEach(tag => {
      skillUsage.set(tag, (skillUsage.get(tag) || 0) + 1)
    })
  })
  
  return {
    totalTasks,
    completedTasks,
    failedTasks,
    averageDuration,
    successRate,
    productivityTrend,
    skillUsage: Array.from(skillUsage.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }
}

export const AgentWorkHistory: React.FC<AgentWorkHistoryProps> = ({
  agentId,
  className
}) => {
  const [records, setRecords] = useState<WorkRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<{
    taskType: string
    status: string
    dateRange: string
  }>({
    taskType: 'all',
    status: 'all',
    dateRange: '7days'
  })
  
  // 加载工作历史数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // 这里应该调用实际的API
        // const data = await invoke<WorkRecord[]>('get_agent_work_history', { agentId })
        const data = generateMockWorkHistory()
        setRecords(data)
      } catch (error) {
        console.error('Failed to load work history:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [agentId])
  
  // 过滤记录
  const filteredRecords = useMemo(() => {
    let filtered = records
    
    // 按任务类型过滤
    if (filter.taskType !== 'all') {
      filtered = filtered.filter(r => r.taskType === filter.taskType)
    }
    
    // 按状态过滤
    if (filter.status !== 'all') {
      filtered = filtered.filter(r => r.status === filter.status)
    }
    
    // 按日期范围过滤
    const now = new Date()
    let startDate: Date
    
    switch (filter.dateRange) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(0)
    }
    
    filtered = filtered.filter(r => new Date(r.startTime) >= startDate)
    
    return filtered
  }, [records, filter])
  
  // 计算统计数据
  const stats = useMemo(() => calculateStats(filteredRecords), [filteredRecords])
  
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500">加载工作历史...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总任务数</p>
                <p className="text-2xl font-bold">{stats.totalTasks}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">成功率</p>
                <p className="text-2xl font-bold text-green-600">{stats.successRate.toFixed(1)}%</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">平均耗时</p>
                <p className="text-2xl font-bold">{stats.averageDuration.toFixed(0)}分</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">失败任务</p>
                <p className="text-2xl font-bold text-red-600">{stats.failedTasks}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 生产力趋势和技能使用 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 生产力趋势 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              生产力趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-end justify-between gap-1">
              {stats.productivityTrend.map((data, index) => {
                const maxTasks = Math.max(...stats.productivityTrend.map(d => d.tasksCompleted))
                const height = maxTasks > 0 ? (data.tasksCompleted / maxTasks) * 100 : 0
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-sm min-h-1 transition-all duration-300"
                      style={{ height: `${Math.max(height, 8)}%` }}
                      title={`${data.date}: ${data.tasksCompleted}个任务`}
                    />
                    <span className="text-xs text-gray-500 mt-1">
                      {new Date(data.date).getDate()}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* 技能使用统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              技能使用频率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.skillUsage.slice(0, 6).map((skill, index) => {
                const maxCount = stats.skillUsage[0]?.count || 1
                const percentage = (skill.count / maxCount) * 100
                
                return (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm font-medium min-w-0 flex-shrink-0 w-16 truncate">
                      {skill.skill}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">
                      {skill.count}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 过滤器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">任务类型</label>
              <select
                value={filter.taskType}
                onChange={(e) => setFilter(prev => ({ ...prev, taskType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">全部类型</option>
                {Object.entries(TASK_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">任务状态</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">全部状态</option>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">时间范围</label>
              <select
                value={filter.dateRange}
                onChange={(e) => setFilter(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="7days">最近7天</option>
                <option value="30days">最近30天</option>
                <option value="90days">最近90天</option>
                <option value="all">全部时间</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 工作记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              工作记录 ({filteredRecords.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecords.length > 0 ? (
            <div className="space-y-3">
              {filteredRecords.slice(0, 20).map(record => {
                const statusConfig = STATUS_CONFIG[record.status]
                const taskTypeConfig = TASK_TYPE_CONFIG[record.taskType]
                const StatusIcon = statusConfig.icon
                
                return (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">{record.taskTitle}</h4>
                          <Badge className={taskTypeConfig.color}>
                            {taskTypeConfig.icon} {taskTypeConfig.label}
                          </Badge>
                          <div className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                            statusConfig.bg,
                            statusConfig.color
                          )}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(record.startTime).toLocaleString('zh-CN')}
                          </span>
                          {record.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {record.duration}分钟
                            </span>
                          )}
                        </div>
                        
                        {record.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {record.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {record.errorMessage && (
                          <p className="text-sm text-red-600 bg-red-50 p-2 rounded mt-2">
                            {record.errorMessage}
                          </p>
                        )}
                        
                        {record.metrics && (
                          <div className="flex gap-4 text-xs text-gray-500 mt-2">
                            {record.metrics.linesOfCode && (
                              <span>代码行数: {record.metrics.linesOfCode}</span>
                            )}
                            {record.metrics.filesChanged && (
                              <span>修改文件: {record.metrics.filesChanged}</span>
                            )}
                            {record.metrics.testsAdded && (
                              <span>新增测试: {record.metrics.testsAdded}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {filteredRecords.length > 20 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    显示前20条记录，共{filteredRecords.length}条
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无工作记录</p>
              <p className="text-sm text-gray-400 mt-1">尝试调整筛选条件查看更多记录</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}