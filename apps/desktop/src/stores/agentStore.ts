/**
 * Agent状态管理器 - 使用Zustand进行状态管理
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Agent } from '../types/multi-agent'

interface AgentState {
  // 状态数据
  agents: Agent[]
  selectedAgentId: string | null
  
  // 操作方法
  setAgents: (agents: Agent[]) => void
  addAgent: (agent: Agent) => void
  updateAgent: (updatedAgent: Agent) => void
  removeAgent: (agentId: string) => void
  setSelectedAgentId: (agentId: string | null) => void
}

export const useAgentStore = create<AgentState>()(
  devtools(
    (set) => ({
      // 初始状态
      agents: [],
      selectedAgentId: null,
      
      // 操作方法
      setAgents: (agents) => 
        set({ agents }, false, 'setAgents'),
        
      addAgent: (agent) =>
        set((state) => ({ 
          agents: [...state.agents, agent] 
        }), false, 'addAgent'),
        
      updateAgent: (updatedAgent) =>
        set((state) => ({
          agents: state.agents.map(agent => 
            agent.id === updatedAgent.id ? updatedAgent : agent
          )
        }), false, 'updateAgent'),
        
      removeAgent: (agentId) =>
        set((state) => ({
          agents: state.agents.filter(agent => agent.id !== agentId),
          selectedAgentId: state.selectedAgentId === agentId ? null : state.selectedAgentId
        }), false, 'removeAgent'),
        
      setSelectedAgentId: (agentId) =>
        set({ selectedAgentId: agentId }, false, 'setSelectedAgentId'),
    }),
    {
      name: 'agent-store',
    }
  )
)