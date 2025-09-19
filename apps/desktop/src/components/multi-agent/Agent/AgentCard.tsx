/**
 * AgentCard组件 - Agent状态展示卡片
 */

import React, { memo } from 'react'
import { cn } from '../../../lib/utils'
import type { Agent } from '../../../types/multi-agent'

interface AgentCardProps {
  agent: Agent
  isSelected?: boolean
  onClick?: () => void
  showDetails?: boolean
  className?: string
}

// 状态指示器样式
const getStatusStyle = (status: Agent['status']) => {
  switch (status) {
    case 'idle':
      return 'bg-gray-400'
    case 'working':
      return 'bg-green-500 animate-pulse'
    case 'error':
      return 'bg-red-500'
    case 'offline':
      return 'bg-gray-300'
    default:
      return 'bg-gray-400'
  }
}

// 状态文本映射
const getStatusText = (status: Agent['status']) => {
  switch (status) {
    case 'idle':
      return '空闲'
    case 'working':
      return '工作中'
    case 'error':
      return '错误'
    case 'offline':
      return '离线'
    default:
      return status
  }
}

// 状态文本颜色
const getStatusTextColor = (status: Agent['status']) => {
  switch (status) {
    case 'idle':
      return 'text-gray-600'
    case 'working':
      return 'text-green-600'
    case 'error':
      return 'text-red-600'
    case 'offline':
      return 'text-gray-500'
    default:
      return 'text-gray-600'
  }
}

export const AgentCard: React.FC<AgentCardProps> = memo(({
  agent,
  isSelected = false,
  onClick,
  showDetails = false,
  className
}) => {
  // 显示的技能标签（最多2个，其余用+N显示）
  const displayedCapabilities = agent.capabilities.slice(0, 2)
  const remainingCapabilities = agent.capabilities.length - 2

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative p-4 bg-white border rounded-lg cursor-pointer transition-all duration-200",
        "hover:border-blue-300 hover:shadow-md",
        isSelected && "border-blue-500 bg-blue-50 shadow-md",
        onClick && "hover:bg-gray-50",
        isSelected && onClick && "hover:bg-blue-50",
        className
      )}
    >
      {/* Agent头像和基本信息 */}
      <div className="flex items-start gap-3">
        {/* 头像区域 */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-blue-600">
              {agent.name.charAt(0)}
            </span>
          </div>
          {/* 状态指示器 */}
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white">
            <div className={cn("w-full h-full rounded-full", getStatusStyle(agent.status))} />
          </div>
        </div>

        {/* 基本信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 truncate">
              {agent.name}
            </h3>
            <span className={cn("text-xs font-medium", getStatusTextColor(agent.status))}>
              {getStatusText(agent.status)}
            </span>
          </div>
          
          {agent.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {agent.description}
            </p>
          )}
        </div>
      </div>

      {/* 当前任务信息 */}
      {agent.currentTask && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
          <span className="text-gray-500">当前任务: </span>
          <span className="text-gray-700">{agent.currentTask}</span>
        </div>
      )}

      {/* 详细信息区域 */}
      {showDetails && (
        <div className="mt-3 space-y-2">
          {/* 性能指标 */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">成功率</span>
            <span className="font-medium text-green-600">
              {Math.round(agent.successRate * 100)}%
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">完成任务</span>
            <span className="font-medium">{agent.completedTasks}</span>
          </div>

          {agent.failedTasks > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">失败任务</span>
              <span className="font-medium text-red-600">{agent.failedTasks}</span>
            </div>
          )}
        </div>
      )}

      {/* 技能标签 */}
      <div className="mt-3 flex flex-wrap gap-1">
        {displayedCapabilities.map((capability, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
          >
            {capability}
          </span>
        ))}
        {remainingCapabilities > 0 && (
          <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
            +{remainingCapabilities}
          </span>
        )}
        {agent.capabilities.length === 0 && (
          <span className="text-xs text-gray-400">暂无技能</span>
        )}
      </div>

      {/* Agent类型标识 */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {agent.agentType === 'developer' && '开发者'}
          {agent.agentType === 'reviewer' && '代码审查'}
          {agent.agentType === 'tester' && '测试员'}
          {agent.agentType === 'manager' && '项目经理'}
        </span>
        
        {agent.lastActivity && (
          <span className="text-xs text-gray-400">
            {new Date(agent.lastActivity).toLocaleString('zh-CN', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        )}
      </div>

      {/* 选中状态的视觉反馈 */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
      )}

      {/* Hover效果增强 */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg pointer-events-none" />
    </div>
  )
})

AgentCard.displayName = 'AgentCard'