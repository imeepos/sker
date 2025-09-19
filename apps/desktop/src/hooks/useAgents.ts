/**
 * useAgents Hook - Agent状态管理钩子
 */

import { useState, useCallback, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useAgentStore } from '../stores/agentStore'
import type { Agent, AgentConfig, AgentStatus, AgentType } from '../types/multi-agent'

// Agent统计信息
interface AgentStats {
  total: number
  working: number
  idle: number
  error: number
  offline: number
  averageSuccessRate: number
  totalCompletedTasks: number
  totalFailedTasks: number
}

// Agent创建参数
interface CreateAgentParams {
  name: string
  description?: string
  agentType: AgentType
  capabilities: string[]
  maxConcurrentTasks: number
  timeoutMinutes: number
  gitConfig: {
    username: string
    email: string
    sshKey?: string
  }
}

// Agent更新参数
interface UpdateAgentParams {
  id: string
  name?: string
  description?: string
  capabilities?: string[]
  maxConcurrentTasks?: number
  timeoutMinutes?: number
  gitConfig?: {
    username?: string
    email?: string
    sshKey?: string
  }
}

// Hook返回值
interface UseAgentsReturn {
  // 数据
  agents: Agent[]
  selectedAgent: Agent | null
  stats: AgentStats
  
  // 状态
  loading: boolean
  error: string | null
  isConnected: boolean
  
  // 操作方法
  createAgent: (config: CreateAgentParams) => Promise<Agent>
  updateAgent: (params: UpdateAgentParams) => Promise<Agent>
  deleteAgent: (id: string) => Promise<void>
  startAgent: (id: string) => Promise<void>
  stopAgent: (id: string) => Promise<void>
  restartAgent: (id: string) => Promise<void>
  
  // 查询方法
  getAgent: (id: string) => Agent | undefined
  getAgentsByType: (type: AgentType) => Agent[]
  getAgentsByStatus: (status: AgentStatus) => Agent[]
  searchAgents: (query: string) => Agent[]
  
  // 状态管理
  selectAgent: (id: string | null) => void
  refreshAgents: () => Promise<void>
  clearError: () => void
}

export const useAgents = (): UseAgentsReturn => {
  const store = useAgentStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(true)
  
  // 初始化时加载Agent数据
  useEffect(() => {
    refreshAgents()
  }, [])
  
  // 监听Agent状态变化的WebSocket事件
  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    
    const setupListener = async () => {
      try {
        unsubscribe = await listen<Agent>('agent-status-changed', (event) => {
          store.updateAgent(event.payload)
        })
        setIsConnected(true)
      } catch (err) {
        console.error('Failed to setup agent status listener:', err)
        setIsConnected(false)
      }
    }
    
    setupListener()
    
    return () => {
      unsubscribe?.()
    }
  }, [store])
  
  // 网络连接状态监听
  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    
    const setupConnectionListener = async () => {
      try {
        unsubscribe = await listen<{ connected: boolean }>('agent-connection-status', (event) => {
          setIsConnected(event.payload.connected)
        })
      } catch (err) {
        console.error('Failed to setup connection listener:', err)
      }
    }
    
    setupConnectionListener()
    
    return () => {
      unsubscribe?.()
    }
  }, [])
  
  // 计算统计信息
  const stats: AgentStats = {
    total: store.agents.length,
    working: store.agents.filter(a => a.status === 'working').length,
    idle: store.agents.filter(a => a.status === 'idle').length,
    error: store.agents.filter(a => a.status === 'error').length,
    offline: store.agents.filter(a => a.status === 'offline').length,
    averageSuccessRate: store.agents.length > 0 
      ? store.agents.reduce((sum, agent) => sum + agent.successRate, 0) / store.agents.length 
      : 0,
    totalCompletedTasks: store.agents.reduce((sum, agent) => sum + agent.completedTasks, 0),
    totalFailedTasks: store.agents.reduce((sum, agent) => sum + agent.failedTasks, 0)
  }
  
  // 创建Agent
  const createAgent = useCallback(async (config: CreateAgentParams): Promise<Agent> => {
    setLoading(true)
    setError(null)
    
    try {
      const agent = await invoke<Agent>('create_agent', { 
        config: {
          name: config.name,
          description: config.description,
          agent_type: config.agentType,
          capabilities: config.capabilities,
          max_concurrent_tasks: config.maxConcurrentTasks,
          timeout_minutes: config.timeoutMinutes,
          git_config: {
            username: config.gitConfig.username,
            email: config.gitConfig.email,
            ssh_key: config.gitConfig.sshKey
          }
        }
      })
      
      store.addAgent(agent)
      return agent
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create agent'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [store])
  
  // 更新Agent
  const updateAgent = useCallback(async (params: UpdateAgentParams): Promise<Agent> => {
    setLoading(true)
    setError(null)
    
    try {
      const agent = await invoke<Agent>('update_agent', {
        id: params.id,
        updates: {
          name: params.name,
          description: params.description,
          capabilities: params.capabilities,
          max_concurrent_tasks: params.maxConcurrentTasks,
          timeout_minutes: params.timeoutMinutes,
          git_config: params.gitConfig ? {
            username: params.gitConfig.username,
            email: params.gitConfig.email,
            ssh_key: params.gitConfig.sshKey
          } : undefined
        }
      })
      
      store.updateAgent(agent)
      return agent
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update agent'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [store])
  
  // 删除Agent
  const deleteAgent = useCallback(async (id: string): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      await invoke('delete_agent', { id })
      store.removeAgent(id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete agent'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [store])
  
  // 启动Agent
  const startAgent = useCallback(async (id: string): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      await invoke('start_agent', { id })
      // Agent状态会通过WebSocket自动更新
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start agent'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])
  
  // 停止Agent
  const stopAgent = useCallback(async (id: string): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      await invoke('stop_agent', { id })
      // Agent状态会通过WebSocket自动更新
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop agent'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])
  
  // 重启Agent
  const restartAgent = useCallback(async (id: string): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      await invoke('restart_agent', { id })
      // Agent状态会通过WebSocket自动更新
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restart agent'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])
  
  // 获取单个Agent
  const getAgent = useCallback((id: string): Agent | undefined => {
    return store.agents.find(agent => agent.id === id)
  }, [store.agents])
  
  // 按类型获取Agent
  const getAgentsByType = useCallback((type: AgentType): Agent[] => {
    return store.agents.filter(agent => agent.agentType === type)
  }, [store.agents])
  
  // 按状态获取Agent
  const getAgentsByStatus = useCallback((status: AgentStatus): Agent[] => {
    return store.agents.filter(agent => agent.status === status)
  }, [store.agents])
  
  // 搜索Agent
  const searchAgents = useCallback((query: string): Agent[] => {
    if (!query.trim()) return store.agents
    
    const lowerQuery = query.toLowerCase()
    return store.agents.filter(agent =>
      agent.name.toLowerCase().includes(lowerQuery) ||
      agent.description?.toLowerCase().includes(lowerQuery) ||
      agent.capabilities.some(cap => cap.toLowerCase().includes(lowerQuery))
    )
  }, [store.agents])
  
  // 选择Agent
  const selectAgent = useCallback((id: string | null) => {
    store.setSelectedAgentId(id)
  }, [store])
  
  // 刷新Agent数据
  const refreshAgents = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      const agents = await invoke<Agent[]>('get_agents')
      store.setAgents(agents)
      setIsConnected(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch agents'
      setError(errorMessage)
      setIsConnected(false)
      
      // 重试机制
      setTimeout(() => {
        if (error) { // 只有在仍有错误时才重试
          refreshAgents()
        }
      }, 5000)
    } finally {
      setLoading(false)
    }
  }, [store, error])
  
  // 清除错误
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  
  return {
    // 数据
    agents: store.agents,
    selectedAgent: store.selectedAgentId ? getAgent(store.selectedAgentId) : null,
    stats,
    
    // 状态
    loading,
    error,
    isConnected,
    
    // 操作方法
    createAgent,
    updateAgent,
    deleteAgent,
    startAgent,
    stopAgent,
    restartAgent,
    
    // 查询方法
    getAgent,
    getAgentsByType,
    getAgentsByStatus,
    searchAgents,
    
    // 状态管理
    selectAgent,
    refreshAgents,
    clearError
  }
}