/**
 * Agent列表组件 - Agent列表容器组件
 */

import React, { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react'
import { Search, Plus, Filter, Grid, List, Users, ChevronDown } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { AgentCard } from './AgentCard'
import type { Agent, AgentCapability } from '../../../types/multi-agent'

interface AgentListProps {
  agents: Agent[]
  selectedAgentId?: string | null
  onAgentSelect?: (agentId: string) => void
  onCreateAgent?: () => void
  searchPlaceholder?: string
  className?: string
}

// 过滤选项
interface FilterOptions {
  status: Agent['status'][] | 'all'
  agentType: Agent['agentType'][] | 'all'
  capabilities: AgentCapability[]
}

// 排序选项
type SortOption = 'name' | 'status' | 'successRate' | 'completedTasks' | 'lastActivity'

// 视图模式
type ViewMode = 'grid' | 'list'

export const AgentList: React.FC<AgentListProps> = memo(({
  agents,
  selectedAgentId,
  onAgentSelect,
  onCreateAgent,
  searchPlaceholder = "搜索Agent...",
  className
}) => {
  // 状态管理
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('status')
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    agentType: 'all',
    capabilities: []
  })
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading] = useState(false)
  
  // 虚拟滚动相关
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 })
  
  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 200)
    
    return () => clearTimeout(timer)
  }, [searchQuery])
  
  // 处理Agent点击事件
  const handleAgentClick = useCallback((agentId: string) => {
    onAgentSelect?.(agentId)
  }, [onAgentSelect])
  
  // 处理创建Agent事件
  const handleCreateClick = useCallback(() => {
    onCreateAgent?.()
  }, [onCreateAgent])
  
  // 搜索过滤逻辑
  const filteredAgents = useMemo(() => {
    if (!debouncedQuery && filters.status === 'all' && filters.agentType === 'all' && filters.capabilities.length === 0) {
      return agents
    }
    
    return agents.filter(agent => {
      // 搜索匹配
      const matchesSearch = !debouncedQuery || 
        agent.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        agent.description?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        agent.capabilities.some(cap => 
          cap.toLowerCase().includes(debouncedQuery.toLowerCase())
        )
      
      // 状态过滤
      const matchesStatus = filters.status === 'all' || 
        (Array.isArray(filters.status) && filters.status.includes(agent.status))
      
      // 类型过滤
      const matchesType = filters.agentType === 'all' || 
        (Array.isArray(filters.agentType) && filters.agentType.includes(agent.agentType))
      
      // 技能过滤
      const matchesCapabilities = filters.capabilities.length === 0 || 
        filters.capabilities.some(cap => agent.capabilities.includes(cap))
      
      return matchesSearch && matchesStatus && matchesType && matchesCapabilities
    })
  }, [agents, debouncedQuery, filters])
  
  // 排序逻辑
  const sortedAgents = useMemo(() => {
    return [...filteredAgents].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'status': {
          // 按状态排序：working > idle > error > offline
          const statusOrder = { working: 0, idle: 1, error: 2, offline: 3 }
          const aOrder = statusOrder[a.status] ?? 4
          const bOrder = statusOrder[b.status] ?? 4
          
          if (aOrder !== bOrder) {
            return aOrder - bOrder
          }
          
          // 同状态下按名称排序
          return a.name.localeCompare(b.name)
        }
        case 'successRate':
          return b.successRate - a.successRate
        case 'completedTasks':
          return b.completedTasks - a.completedTasks
        case 'lastActivity':
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        default:
          return 0
      }
    })
  }, [filteredAgents, sortBy])
  
  // 虚拟滚动的可见Agent列表
  const visibleAgents = useMemo(() => {
    if (sortedAgents.length <= 100) {
      return sortedAgents // 少于100个不需要虚拟滚动
    }
    return sortedAgents.slice(visibleRange.start, visibleRange.end)
  }, [sortedAgents, visibleRange])
  
  
  // 状态统计
  const statusStats = useMemo(() => {
    const stats = { working: 0, idle: 0, error: 0, offline: 0 }
    filteredAgents.forEach(agent => {
      stats[agent.status] = (stats[agent.status] || 0) + 1
    })
    return stats
  }, [filteredAgents])
  
  return (
    <div className={cn("h-full flex flex-col bg-white", className)}>
      {/* 头部区域 */}
      <div className="flex-shrink-0 border-b bg-gray-50">
        {/* 标题和操作按钮 */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Agent管理</h2>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                {filteredAgents.length}/{agents.length}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* 视图切换 */}
              <div className="flex items-center border rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 text-sm border-r transition-colors",
                    viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 text-sm transition-colors",
                    viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              {/* 过滤器按钮 */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-1 px-3 py-2 text-sm border rounded-md transition-colors",
                  showFilters ? 'bg-blue-50 text-blue-600 border-blue-300' : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <Filter className="w-4 h-4" />
                过滤
                <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
              </button>
              
              {/* 创建Agent按钮 */}
              {onCreateAgent && (
                <button 
                  onClick={handleCreateClick}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  创建Agent
                </button>
              )}
            </div>
          </div>
          
          {/* 搜索栏 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* 过滤器面板 */}
        {showFilters && (
          <div className="px-4 pb-4 border-t bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* 状态过滤 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                <select
                  value={Array.isArray(filters.status) ? filters.status.join(',') : 'all'}
                  onChange={(e) => {
                    const value = e.target.value
                    setFilters(prev => ({
                      ...prev,
                      status: value === 'all' ? 'all' : [value as Agent['status']]
                    }))
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">全部状态</option>
                  <option value="working">工作中</option>
                  <option value="idle">空闲</option>
                  <option value="error">错误</option>
                  <option value="offline">离线</option>
                </select>
              </div>
              
              {/* 类型过滤 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
                <select
                  value={Array.isArray(filters.agentType) ? filters.agentType.join(',') : 'all'}
                  onChange={(e) => {
                    const value = e.target.value
                    setFilters(prev => ({
                      ...prev,
                      agentType: value === 'all' ? 'all' : [value as Agent['agentType']]
                    }))
                  }}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">全部类型</option>
                  <option value="developer">开发者</option>
                  <option value="reviewer">代码审查</option>
                  <option value="tester">测试员</option>
                  <option value="manager">项目经理</option>
                </select>
              </div>
              
              {/* 排序选项 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">排序</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="status">按状态</option>
                  <option value="name">按名称</option>
                  <option value="successRate">按成功率</option>
                  <option value="completedTasks">按完成任务</option>
                  <option value="lastActivity">按最后活动</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* 状态统计 */}
        <div className="px-4 py-2 bg-gray-50 border-t">
          <div className="flex items-center gap-6 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              工作中: {statusStats.working}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              空闲: {statusStats.idle}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              错误: {statusStats.error}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
              离线: {statusStats.offline}
            </span>
          </div>
        </div>
      </div>
      
      {/* Agent列表区域 */}
      <div className="flex-1 overflow-y-auto" ref={containerRef}>
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">加载中...</p>
            </div>
          </div>
        ) : visibleAgents.length > 0 ? (
          <div className="p-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleAgents.map(agent => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    isSelected={selectedAgentId === agent.id}
                    onClick={() => handleAgentClick(agent.id)}
                    showDetails={true}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {visibleAgents.map(agent => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    isSelected={selectedAgentId === agent.id}
                    onClick={() => handleAgentClick(agent.id)}
                    showDetails={false}
                    className="w-full"
                  />
                ))}
              </div>
            )}
            
            {/* 虚拟滚动加载更多 */}
            {sortedAgents.length > visibleRange.end && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setVisibleRange(prev => ({ ...prev, end: prev.end + 50 }))}
                  className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  加载更多 ({sortedAgents.length - visibleRange.end} 个剩余)
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              {agents.length === 0 ? (
                <>
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-lg font-medium mb-1">暂无Agent</p>
                  <p className="text-sm mb-4">点击"创建Agent"开始构建您的团队</p>
                  {onCreateAgent && (
                    <button 
                      onClick={handleCreateClick}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      创建第一个Agent
                    </button>
                  )}
                </>
              ) : (
                <>
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-lg font-medium mb-1">未找到匹配的Agent</p>
                  <p className="text-sm">尝试调整搜索条件或过滤器</p>
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setFilters({ status: 'all', agentType: 'all', capabilities: [] })
                    }}
                    className="mt-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    清除筛选条件
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

AgentList.displayName = 'AgentList'