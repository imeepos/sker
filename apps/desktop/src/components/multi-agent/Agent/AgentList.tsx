/**
 * Agent列表组件 - 占位符实现
 */

import React, { memo, useMemo, useCallback } from 'react'
import type { Agent } from '../../../types/multi-agent'

interface AgentListProps {
  agents: Agent[]
  selectedAgentId?: string | null
  onAgentSelect?: (agentId: string) => void
  onCreateAgent?: () => void
  searchPlaceholder?: string
  className?: string
}

export const AgentList: React.FC<AgentListProps> = memo(({
  agents,
  selectedAgentId,
  onAgentSelect,
  onCreateAgent,
  searchPlaceholder = "搜索Agent...",
  className
}) => {
  // 处理Agent点击事件
  const handleAgentClick = useCallback((agentId: string) => {
    onAgentSelect?.(agentId)
  }, [onAgentSelect])
  
  // 处理创建Agent事件
  const handleCreateClick = useCallback(() => {
    onCreateAgent?.()
  }, [onCreateAgent])
  
  // 过滤和排序agents
  const sortedAgents = useMemo(() => {
    return [...agents].sort((a, b) => {
      // 按状态排序：working > idle > error > offline
      const statusOrder = { working: 0, idle: 1, error: 2, offline: 3 }
      const aOrder = statusOrder[a.status] ?? 4
      const bOrder = statusOrder[b.status] ?? 4
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }
      
      // 同状态下按名称排序
      return a.name.localeCompare(b.name)
    })
  }, [agents])
  
  return (
    <div className={`h-full flex flex-col ${className || ''}`}>
      {/* 头部 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Agent管理</h2>
          {onCreateAgent && (
            <button 
              onClick={handleCreateClick}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              创建Agent
            </button>
          )}
        </div>
        <input
          type="text"
          placeholder={searchPlaceholder}
          className="w-full px-3 py-2 border rounded-md text-sm"
        />
      </div>
      
      {/* Agent列表 */}
      <div className="flex-1 overflow-y-auto">
        {agents.length > 0 ? (
          <div className="p-2 space-y-2">
            {sortedAgents.map(agent => (
              <div
                key={agent.id}
                onClick={() => handleAgentClick(agent.id)}
                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                  selectedAgentId === agent.id ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{agent.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded ${
                    agent.status === 'working' ? 'bg-green-100 text-green-700' :
                    agent.status === 'idle' ? 'bg-gray-100 text-gray-700' :
                    agent.status === 'error' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {agent.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {agent.currentTask || '空闲状态'}
                </p>
                <div className="flex items-center text-xs text-gray-500 mt-2">
                  <span>成功率: {Math.round(agent.successRate * 100)}%</span>
                  <span className="ml-4">技能: {agent.capabilities.length}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p>暂无Agent</p>
              <p className="text-sm mt-1">点击"创建Agent"开始</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

AgentList.displayName = 'AgentList'