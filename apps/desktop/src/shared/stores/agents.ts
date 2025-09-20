// 智能体状态管理
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Agent, AgentTemplate, ExecuteAgentResponse } from '@/features/agents/api/agentsApi';

export interface AgentExecution {
  id: string;
  agent_id: string;
  input: string;
  output?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: number;
  completed_at?: number;
  error?: string;
  metadata?: Record<string, any>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AgentFilters {
  search: string;
  tags: string[];
  is_public?: boolean;
  created_by?: string;
  is_active?: boolean;
}

export interface AgentSortOptions {
  field: 'name' | 'created_at' | 'updated_at' | 'last_used';
  direction: 'asc' | 'desc';
}

export interface AgentStats {
  total_executions: number;
  total_tokens: number;
  avg_response_time: number;
  last_used_at?: number;
}

export interface AgentsStore {
  // 智能体数据
  agents: Agent[];
  selectedAgent: Agent | null;
  agentStats: Record<string, AgentStats>;
  
  // 模板数据
  templates: AgentTemplate[];
  selectedTemplate: AgentTemplate | null;
  
  // 执行管理
  executions: AgentExecution[];
  activeExecutions: Set<string>;
  
  // UI状态
  filters: AgentFilters;
  sortOptions: AgentSortOptions;
  viewMode: 'grid' | 'list';
  sidebarCollapsed: boolean;
  
  // 分页状态
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  
  // 加载状态
  loading: {
    agents: boolean;
    templates: boolean;
    execution: boolean;
    stats: boolean;
  };
  
  // 错误状态
  errors: {
    agents?: string;
    templates?: string;
    execution?: string;
    stats?: string;
  };
  
  // Actions - 智能体管理
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  removeAgent: (agentId: string) => void;
  setSelectedAgent: (agent: Agent | null) => void;
  
  // Actions - 模板管理
  setTemplates: (templates: AgentTemplate[]) => void;
  setSelectedTemplate: (template: AgentTemplate | null) => void;
  
  // Actions - 执行管理
  startExecution: (execution: Omit<AgentExecution, 'id' | 'status' | 'started_at'>) => string;
  updateExecution: (executionId: string, updates: Partial<AgentExecution>) => void;
  completeExecution: (executionId: string, result: ExecuteAgentResponse) => void;
  failExecution: (executionId: string, error: string) => void;
  clearExecution: (executionId: string) => void;
  clearAllExecutions: () => void;
  
  // Actions - 统计管理
  setAgentStats: (agentId: string, stats: AgentStats) => void;
  updateAgentStats: (agentId: string, updates: Partial<AgentStats>) => void;
  
  // Actions - 过滤和搜索
  setFilters: (filters: Partial<AgentFilters>) => void;
  resetFilters: () => void;
  setSortOptions: (options: AgentSortOptions) => void;
  
  // Actions - UI状态
  setViewMode: (mode: 'grid' | 'list') => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Actions - 分页
  setPagination: (pagination: Partial<AgentsStore['pagination']>) => void;
  nextPage: () => void;
  prevPage: () => void;
  
  // Actions - 加载状态
  setLoading: (key: keyof AgentsStore['loading'], loading: boolean) => void;
  
  // Actions - 错误处理
  setError: (key: keyof AgentsStore['errors'], error: string | undefined) => void;
  clearErrors: () => void;
  
  // Getters
  getFilteredAgents: () => Agent[];
  getSortedAgents: (agents: Agent[]) => Agent[];
  getPaginatedAgents: (agents: Agent[]) => Agent[];
  getExecutionsByAgent: (agentId: string) => AgentExecution[];
  getActiveExecutionsCount: () => number;
  getAgentById: (agentId: string) => Agent | undefined;
  getTemplateById: (templateId: string) => AgentTemplate | undefined;
}

const defaultFilters: AgentFilters = {
  search: '',
  tags: [],
  is_public: undefined,
  created_by: undefined,
  is_active: undefined,
};

const defaultSortOptions: AgentSortOptions = {
  field: 'updated_at',
  direction: 'desc',
};

export const useAgentsStore = create<AgentsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      agents: [],
      selectedAgent: null,
      agentStats: {},
      templates: [],
      selectedTemplate: null,
      executions: [],
      activeExecutions: new Set(),
      filters: defaultFilters,
      sortOptions: defaultSortOptions,
      viewMode: 'grid',
      sidebarCollapsed: false,
      pagination: {
        page: 1,
        pageSize: 12,
        total: 0,
      },
      loading: {
        agents: false,
        templates: false,
        execution: false,
        stats: false,
      },
      errors: {},
      
      // Agent management actions
      setAgents: (agents) => set({ agents, pagination: { ...get().pagination, total: agents.length } }),
      
      addAgent: (agent) => set((state) => ({
        agents: [...state.agents, agent],
        pagination: { ...state.pagination, total: state.agents.length + 1 },
      })),
      
      updateAgent: (agentId, updates) => set((state) => ({
        agents: state.agents.map((agent) =>
          agent.id === agentId ? { ...agent, ...updates } : agent
        ),
        selectedAgent: state.selectedAgent?.id === agentId 
          ? { ...state.selectedAgent, ...updates } 
          : state.selectedAgent,
      })),
      
      removeAgent: (agentId) => set((state) => ({
        agents: state.agents.filter((agent) => agent.id !== agentId),
        selectedAgent: state.selectedAgent?.id === agentId ? null : state.selectedAgent,
        pagination: { ...state.pagination, total: Math.max(0, state.pagination.total - 1) },
      })),
      
      setSelectedAgent: (agent) => set({ selectedAgent: agent }),
      
      // Template management actions
      setTemplates: (templates) => set({ templates }),
      setSelectedTemplate: (template) => set({ selectedTemplate: template }),
      
      // Execution management actions
      startExecution: (execution) => {
        const id = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newExecution: AgentExecution = {
          ...execution,
          id,
          status: 'running',
          started_at: Date.now(),
        };
        
        set((state) => ({
          executions: [...state.executions, newExecution],
          activeExecutions: new Set([...state.activeExecutions, id]),
        }));
        
        return id;
      },
      
      updateExecution: (executionId, updates) => set((state) => ({
        executions: state.executions.map((exec) =>
          exec.id === executionId ? { ...exec, ...updates } : exec
        ),
      })),
      
      completeExecution: (executionId, result) => set((state) => {
        const newActiveExecutions = new Set(state.activeExecutions);
        newActiveExecutions.delete(executionId);
        
        return {
          executions: state.executions.map((exec) =>
            exec.id === executionId
              ? {
                  ...exec,
                  status: 'completed' as const,
                  output: result.output,
                  completed_at: Date.now(),
                  metadata: result.metadata,
                  usage: result.usage,
                }
              : exec
          ),
          activeExecutions: newActiveExecutions,
        };
      }),
      
      failExecution: (executionId, error) => set((state) => {
        const newActiveExecutions = new Set(state.activeExecutions);
        newActiveExecutions.delete(executionId);
        
        return {
          executions: state.executions.map((exec) =>
            exec.id === executionId
              ? {
                  ...exec,
                  status: 'failed' as const,
                  error,
                  completed_at: Date.now(),
                }
              : exec
          ),
          activeExecutions: newActiveExecutions,
        };
      }),
      
      clearExecution: (executionId) => set((state) => {
        const newActiveExecutions = new Set(state.activeExecutions);
        newActiveExecutions.delete(executionId);
        
        return {
          executions: state.executions.filter((exec) => exec.id !== executionId),
          activeExecutions: newActiveExecutions,
        };
      }),
      
      clearAllExecutions: () => set({
        executions: [],
        activeExecutions: new Set(),
      }),
      
      // Stats management actions
      setAgentStats: (agentId, stats) => set((state) => ({
        agentStats: { ...state.agentStats, [agentId]: stats },
      })),
      
      updateAgentStats: (agentId, updates) => set((state) => ({
        agentStats: {
          ...state.agentStats,
          [agentId]: { ...state.agentStats[agentId], ...updates },
        },
      })),
      
      // Filter and search actions
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
        pagination: { ...state.pagination, page: 1 }, // Reset to first page when filtering
      })),
      
      resetFilters: () => set({
        filters: defaultFilters,
        pagination: { ...get().pagination, page: 1 },
      }),
      
      setSortOptions: (options) => set({ sortOptions: options }),
      
      // UI state actions
      setViewMode: (mode) => set({ viewMode: mode }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      // Pagination actions
      setPagination: (pagination) => set((state) => ({
        pagination: { ...state.pagination, ...pagination },
      })),
      
      nextPage: () => set((state) => {
        const maxPage = Math.ceil(state.pagination.total / state.pagination.pageSize);
        return {
          pagination: {
            ...state.pagination,
            page: Math.min(state.pagination.page + 1, maxPage),
          },
        };
      }),
      
      prevPage: () => set((state) => ({
        pagination: {
          ...state.pagination,
          page: Math.max(state.pagination.page - 1, 1),
        },
      })),
      
      // Loading state actions
      setLoading: (key, loading) => set((state) => ({
        loading: { ...state.loading, [key]: loading },
      })),
      
      // Error handling actions
      setError: (key, error) => set((state) => ({
        errors: { ...state.errors, [key]: error },
      })),
      
      clearErrors: () => set({ errors: {} }),
      
      // Getters
      getFilteredAgents: () => {
        const { agents, filters } = get();
        
        return agents.filter((agent) => {
          // Search filter
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesName = agent.name.toLowerCase().includes(searchLower);
            const matchesDescription = agent.description.toLowerCase().includes(searchLower);
            const matchesTags = agent.tags.some(tag => tag.toLowerCase().includes(searchLower));
            
            if (!matchesName && !matchesDescription && !matchesTags) {
              return false;
            }
          }
          
          // Tags filter
          if (filters.tags.length > 0) {
            const hasMatchingTag = filters.tags.some(tag => agent.tags.includes(tag));
            if (!hasMatchingTag) return false;
          }
          
          // Public filter
          if (filters.is_public !== undefined && agent.is_public !== filters.is_public) {
            return false;
          }
          
          // Created by filter
          if (filters.created_by && agent.created_by !== filters.created_by) {
            return false;
          }
          
          // Active filter
          if (filters.is_active !== undefined && agent.is_active !== filters.is_active) {
            return false;
          }
          
          return true;
        });
      },
      
      getSortedAgents: (agents) => {
        const { sortOptions } = get();
        
        return [...agents].sort((a, b) => {
          let aValue: any;
          let bValue: any;
          
          switch (sortOptions.field) {
            case 'name':
              aValue = a.name.toLowerCase();
              bValue = b.name.toLowerCase();
              break;
            case 'created_at':
              aValue = a.created_at;
              bValue = b.created_at;
              break;
            case 'updated_at':
              aValue = a.updated_at;
              bValue = b.updated_at;
              break;
            case 'last_used':
              const statsA = get().agentStats[a.id];
              const statsB = get().agentStats[b.id];
              aValue = statsA?.last_used_at || 0;
              bValue = statsB?.last_used_at || 0;
              break;
            default:
              return 0;
          }
          
          if (aValue < bValue) return sortOptions.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortOptions.direction === 'asc' ? 1 : -1;
          return 0;
        });
      },
      
      getPaginatedAgents: (agents) => {
        const { pagination } = get();
        const startIndex = (pagination.page - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        return agents.slice(startIndex, endIndex);
      },
      
      getExecutionsByAgent: (agentId) => {
        return get().executions.filter((exec) => exec.agent_id === agentId);
      },
      
      getActiveExecutionsCount: () => {
        return get().activeExecutions.size;
      },
      
      getAgentById: (agentId) => {
        return get().agents.find((agent) => agent.id === agentId);
      },
      
      getTemplateById: (templateId) => {
        return get().templates.find((template) => template.id === templateId);
      },
    }),
    {
      name: 'agents-store',
      partialize: (state) => ({
        // 持久化的状态
        filters: state.filters,
        sortOptions: state.sortOptions,
        viewMode: state.viewMode,
        sidebarCollapsed: state.sidebarCollapsed,
        pagination: state.pagination,
        // 不持久化执行状态和错误状态
      }),
    }
  )
);

// 选择器 hooks
export const useAgentsList = () => {
  const store = useAgentsStore();
  const filteredAgents = store.getFilteredAgents();
  const sortedAgents = store.getSortedAgents(filteredAgents);
  const paginatedAgents = store.getPaginatedAgents(sortedAgents);
  
  return {
    agents: paginatedAgents,
    totalCount: filteredAgents.length,
    isLoading: store.loading.agents,
    error: store.errors.agents,
  };
};

export const useAgentExecution = (agentId?: string) => {
  const store = useAgentsStore();
  
  return {
    executions: agentId ? store.getExecutionsByAgent(agentId) : store.executions,
    activeExecutions: store.activeExecutions,
    activeCount: store.getActiveExecutionsCount(),
    isExecuting: store.loading.execution,
    error: store.errors.execution,
    startExecution: store.startExecution,
    updateExecution: store.updateExecution,
    completeExecution: store.completeExecution,
    failExecution: store.failExecution,
    clearExecution: store.clearExecution,
    clearAllExecutions: store.clearAllExecutions,
  };
};

export const useAgentTemplates = () => {
  const store = useAgentsStore();
  
  return {
    templates: store.templates,
    selectedTemplate: store.selectedTemplate,
    isLoading: store.loading.templates,
    error: store.errors.templates,
    setTemplates: store.setTemplates,
    setSelectedTemplate: store.setSelectedTemplate,
    getTemplateById: store.getTemplateById,
  };
};