/**
 * Agent详情组件 - 占位符实现
 */

import React from 'react'
import type { Agent } from '../../../types/multi-agent'

interface AgentDetailsProps {
  agent: Agent
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export const AgentDetails: React.FC<AgentDetailsProps> = ({
  agent,
  onEdit,
  onDelete,
  className
}) => {
  return (
    <div className={`h-full overflow-y-auto ${className || ''}`}>
      {/* 头部 */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-lg font-semibold text-blue-600">
                {agent.name.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-semibold">{agent.name}</h1>
              <p className="text-sm text-gray-600">{agent.description}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {onEdit && (
              <button 
                onClick={onEdit}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              >
                编辑
              </button>
            )}
            {onDelete && (
              <button 
                onClick={onDelete}
                className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
              >
                删除
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* 基本信息 */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">基本信息</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">类型:</span>
                <span className="ml-2">{agent.agentType}</span>
              </div>
              <div>
                <span className="text-gray-600">状态:</span>
                <span className="ml-2">{agent.status}</span>
              </div>
              <div>
                <span className="text-gray-600">当前任务:</span>
                <span className="ml-2">{agent.currentTask || '无'}</span>
              </div>
              <div>
                <span className="text-gray-600">最后活动:</span>
                <span className="ml-2">{agent.lastActivity.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">性能指标</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">成功率:</span>
                <span className="ml-2 font-medium text-green-600">
                  {Math.round(agent.successRate * 100)}%
                </span>
              </div>
              <div>
                <span className="text-gray-600">完成任务:</span>
                <span className="ml-2">{agent.completedTasks}</span>
              </div>
              <div>
                <span className="text-gray-600">失败任务:</span>
                <span className="ml-2">{agent.failedTasks}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 技能列表 */}
        <div className="mt-6">
          <h3 className="font-medium mb-3">技能清单</h3>
          <div className="flex flex-wrap gap-2">
            {agent.capabilities.map(capability => (
              <span 
                key={capability}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {capability}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}