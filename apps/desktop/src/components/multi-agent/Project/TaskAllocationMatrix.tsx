/**
 * TaskAllocationMatrix组件 - 任务分配矩阵可视化组件
 * 展示任务-Agent分配关系、工作负载均衡分析和技能匹配度
 */

import React, { memo, useMemo, useState } from 'react'
import type { 
  Project, 
  Agent, 
  Task, 
  AgentCapability, 
  TaskStatus 
} from '../../../types/multi-agent'

interface TaskAllocationMatrixProps {
  project: Project
  tasks?: Task[]
  onReassignTask?: (taskId: string, agentId: string) => void
  onTaskClick?: (taskId: string) => void
  onAgentClick?: (agentId: string) => void
  className?: string
}

// 工作负载数据
interface WorkloadData {
  agentId: string
  agentName: string
  totalTasks: number
  activeTasks: number
  completedTasks: number
  failedTasks: number
  workloadPercentage: number
  efficiency: number
  capabilities: AgentCapability[]
}

// 任务-Agent匹配数据
interface TaskAgentMatch {
  taskId: string
  taskTitle: string
  taskStatus: TaskStatus
  taskCapabilities: AgentCapability[]
  assignedAgent?: Agent
  suitableAgents: Array<{
    agent: Agent
    matchScore: number
    reasons: string[]
  }>
}

// 工作负载卡片组件
const WorkloadCard: React.FC<{
  workload: WorkloadData
  onClick?: () => void
  isHighlighted?: boolean
}> = ({ workload, onClick, isHighlighted = false }) => {
  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500 text-white'
    if (percentage >= 70) return 'bg-orange-500 text-white'
    if (percentage >= 50) return 'bg-yellow-500 text-white'
    return 'bg-green-500 text-white'
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 85) return 'text-green-600'
    if (efficiency >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div 
      className={`bg-white border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
        isHighlighted ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900 truncate">
          {workload.agentName}
        </h3>
        <span className={`px-2 py-1 text-xs rounded-full ${getWorkloadColor(workload.workloadPercentage)}`}>
          {Math.round(workload.workloadPercentage)}%
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">总任务:</span>
          <span className="font-medium">{workload.totalTasks}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">进行中:</span>
          <span className="text-blue-600 font-medium">{workload.activeTasks}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">已完成:</span>
          <span className="text-green-600 font-medium">{workload.completedTasks}</span>
        </div>
        {workload.failedTasks > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">失败:</span>
            <span className="text-red-600 font-medium">{workload.failedTasks}</span>
          </div>
        )}
        <div className="flex justify-between text-sm pt-2 border-t">
          <span className="text-gray-600">效率:</span>
          <span className={`font-medium ${getEfficiencyColor(workload.efficiency)}`}>
            {workload.efficiency}%
          </span>
        </div>
      </div>

      {/* 技能标签 */}
      <div className="mt-3">
        <div className="flex flex-wrap gap-1">
          {workload.capabilities.slice(0, 3).map(cap => (
            <span 
              key={cap}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
            >
              {cap}
            </span>
          ))}
          {workload.capabilities.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded">
              +{workload.capabilities.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// 任务分配卡片组件
const TaskAllocationCard: React.FC<{
  taskMatch: TaskAgentMatch
  onReassign?: (agentId: string) => void
  onTaskClick?: () => void
}> = ({ taskMatch, onReassign, onTaskClick }) => {
  const [showReassignMenu, setShowReassignMenu] = useState(false)

  const getStatusColor = (status: TaskStatus) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getStatusText = (status: TaskStatus) => {
    const texts = {
      pending: '待分配',
      in_progress: '进行中',
      completed: '已完成',
      failed: '已失败',
      cancelled: '已取消'
    }
    return texts[status] || status
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 cursor-pointer" onClick={onTaskClick}>
          <h4 className="font-medium text-gray-900 mb-1 hover:text-blue-600">
            {taskMatch.taskTitle}
          </h4>
          <span className={`inline-block px-2 py-1 text-xs rounded ${getStatusColor(taskMatch.taskStatus)}`}>
            {getStatusText(taskMatch.taskStatus)}
          </span>
        </div>
      </div>

      {/* 需要的技能 */}
      <div className="mb-3">
        <p className="text-xs text-gray-600 mb-1">需要技能:</p>
        <div className="flex flex-wrap gap-1">
          {taskMatch.taskCapabilities.map(cap => (
            <span 
              key={cap}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200"
            >
              {cap}
            </span>
          ))}
        </div>
      </div>

      {/* 当前分配 */}
      {taskMatch.assignedAgent ? (
        <div className="mb-3 p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-600 mb-1">当前分配:</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">
              {taskMatch.assignedAgent.name}
            </span>
            {onReassign && taskMatch.taskStatus === 'pending' && (
              <button
                onClick={() => setShowReassignMenu(!showReassignMenu)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                重新分配
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-3 p-2 bg-orange-50 rounded border border-orange-200">
          <p className="text-xs text-orange-700">⚠️ 未分配Agent</p>
        </div>
      )}

      {/* 重新分配菜单 */}
      {showReassignMenu && onReassign && (
        <div className="border-t pt-3">
          <p className="text-xs text-gray-600 mb-2">推荐Agent:</p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {taskMatch.suitableAgents.slice(0, 3).map(({ agent, matchScore, reasons }) => (
              <button
                key={agent.id}
                onClick={() => {
                  onReassign(agent.id)
                  setShowReassignMenu(false)
                }}
                className="w-full text-left p-2 rounded bg-gray-50 hover:bg-blue-50 border hover:border-blue-200 transition-colors"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{agent.name}</span>
                  <span className="text-xs text-green-600">{matchScore}%</span>
                </div>
                <p className="text-xs text-gray-600">
                  {reasons.slice(0, 2).join(', ')}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const TaskAllocationMatrix: React.FC<TaskAllocationMatrixProps> = memo(({
  project,
  tasks = [],
  onReassignTask,
  onTaskClick,
  onAgentClick,
  className = ''
}) => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'workload' | 'allocation'>('workload')

  // 计算工作负载数据
  const workloadData = useMemo((): WorkloadData[] => {
    return project.assignedAgents.map(agent => {
      const agentTasks = tasks.filter(task => task.assignedAgent?.id === agent.id)
      const totalTasks = agentTasks.length
      const activeTasks = agentTasks.filter(task => task.status === 'in_progress').length
      const completedTasks = agentTasks.filter(task => task.status === 'completed').length
      const failedTasks = agentTasks.filter(task => task.status === 'failed').length

      // 简单的工作负载计算：基于任务数量和agent的最大并发任务数
      const maxConcurrentTasks = agent.config.maxConcurrentTasks || 3
      const workloadPercentage = Math.min((activeTasks / maxConcurrentTasks) * 100, 100)
      
      // 效率计算：基于成功率和完成的任务数
      const efficiency = totalTasks > 0 
        ? Math.round(((completedTasks / totalTasks) * agent.successRate) * 100)
        : agent.successRate * 100

      return {
        agentId: agent.id,
        agentName: agent.name,
        totalTasks,
        activeTasks,
        completedTasks,
        failedTasks,
        workloadPercentage,
        efficiency,
        capabilities: agent.capabilities
      }
    })
  }, [project.assignedAgents, tasks])

  // 计算任务-Agent匹配数据
  const taskMatches = useMemo((): TaskAgentMatch[] => {
    return tasks.map(task => {
      // 计算每个Agent与任务的匹配度
      const suitableAgents = project.assignedAgents
        .map(agent => {
          const matchedCapabilities = task.requiredCapabilities.filter(cap => 
            agent.capabilities.includes(cap)
          )
          const matchScore = Math.round(
            (matchedCapabilities.length / task.requiredCapabilities.length) * 100
          )

          const reasons = []
          if (matchedCapabilities.length > 0) {
            reasons.push(`匹配技能: ${matchedCapabilities.join(', ')}`)
          }
          if (agent.status === 'idle') {
            reasons.push('当前空闲')
          }
          if (agent.successRate > 0.8) {
            reasons.push('高成功率')
          }

          return { agent, matchScore, reasons }
        })
        .filter(match => match.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)

      return {
        taskId: task.id,
        taskTitle: task.title,
        taskStatus: task.status,
        taskCapabilities: task.requiredCapabilities,
        assignedAgent: task.assignedAgent,
        suitableAgents
      }
    })
  }, [tasks, project.assignedAgents])

  // 处理重新分配
  const handleReassign = (taskId: string, agentId: string) => {
    onReassignTask?.(taskId, agentId)
  }

  // 负载均衡分析
  const loadBalanceAnalysis = useMemo(() => {
    if (workloadData.length === 0) return null

    const avgWorkload = workloadData.reduce((sum, agent) => sum + agent.workloadPercentage, 0) / workloadData.length
    const overloadedAgents = workloadData.filter(agent => agent.workloadPercentage > 80)
    const underutilizedAgents = workloadData.filter(agent => agent.workloadPercentage < 30)

    return {
      avgWorkload: Math.round(avgWorkload),
      overloadedCount: overloadedAgents.length,
      underutilizedCount: underutilizedAgents.length,
      isBalanced: overloadedAgents.length === 0 && underutilizedAgents.length <= 1
    }
  }, [workloadData])

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 头部控制 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">任务分配矩阵</h3>
          <p className="text-sm text-gray-600 mt-1">
            分析项目中的任务分配和Agent工作负载
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex border border-gray-200 rounded-lg">
            <button
              onClick={() => setViewMode('workload')}
              className={`px-3 py-1 text-sm rounded-l-lg ${
                viewMode === 'workload'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              工作负载
            </button>
            <button
              onClick={() => setViewMode('allocation')}
              className={`px-3 py-1 text-sm rounded-r-lg border-l ${
                viewMode === 'allocation'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              任务分配
            </button>
          </div>
        </div>
      </div>

      {/* 负载均衡分析 */}
      {loadBalanceAnalysis && (
        <div className={`p-4 rounded-lg border ${
          loadBalanceAnalysis.isBalanced 
            ? 'bg-green-50 border-green-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">负载均衡分析</h4>
              <p className="text-sm text-gray-600 mt-1">
                平均工作负载: {loadBalanceAnalysis.avgWorkload}%
                {loadBalanceAnalysis.overloadedCount > 0 && 
                  ` • ${loadBalanceAnalysis.overloadedCount} 个Agent超负荷`
                }
                {loadBalanceAnalysis.underutilizedCount > 0 && 
                  ` • ${loadBalanceAnalysis.underutilizedCount} 个Agent利用率低`
                }
              </p>
            </div>
            <div className="text-2xl">
              {loadBalanceAnalysis.isBalanced ? '✅' : '⚠️'}
            </div>
          </div>
        </div>
      )}

      {/* 内容区域 */}
      {viewMode === 'workload' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workloadData.map(workload => (
            <WorkloadCard
              key={workload.agentId}
              workload={workload}
              onClick={() => {
                setSelectedAgent(selectedAgent === workload.agentId ? null : workload.agentId)
                onAgentClick?.(workload.agentId)
              }}
              isHighlighted={selectedAgent === workload.agentId}
            />
          ))}
          
          {workloadData.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p>项目还没有分配Agent</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {taskMatches.map(taskMatch => (
            <TaskAllocationCard
              key={taskMatch.taskId}
              taskMatch={taskMatch}
              onReassign={(agentId) => handleReassign(taskMatch.taskId, agentId)}
              onTaskClick={() => onTaskClick?.(taskMatch.taskId)}
            />
          ))}
          
          {taskMatches.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p>项目还没有创建任务</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

TaskAllocationMatrix.displayName = 'TaskAllocationMatrix'