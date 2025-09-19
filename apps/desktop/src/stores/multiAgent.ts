/**
 * 多Agent协同开发系统 - 状态管理
 * 基于现有的Zustand架构，扩展支持多Agent功能
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  Agent,
  Project,
  Task,
  Conflict,
  AgentStatus,
  // ProjectStatus,
  // TaskStatus,
  MultiAgentNavigationItem,
  ViewState,
  LoadingState,
  ErrorState,
  FilterState,
  // AgentConfig,
  // ProjectConfig,
  // TaskConfig,
  HumanDecision
  // MultiAgentEventType,
  // AgentStatusChangedEvent,
  // TaskProgressEvent,
  // ConflictDetectedEvent
} from '../types/multi-agent'

// ============================================================================
// 状态接口定义
// ============================================================================

interface MultiAgentState {
  // ========== 视图状态 ==========
  viewState: ViewState
  loadingState: LoadingState
  errorState: ErrorState
  filterState: FilterState
  
  // ========== 数据状态 ==========
  agents: Agent[]
  projects: Project[]
  tasks: Task[]
  conflicts: Conflict[]
  
  // ========== 操作历史 ==========
  operationHistory: Array<{
    id: string
    type: string
    timestamp: Date
    description: string
    data?: any
  }>
  
  // ========== 视图操作 ==========
  setCurrentView: (view: MultiAgentNavigationItem) => void
  setSelectedAgent: (agentId: string | null) => void
  setSelectedProject: (projectId: string | null) => void
  setSelectedTask: (taskId: string | null) => void
  setSelectedConflict: (conflictId: string | null) => void
  
  // ========== 加载状态管理 ==========
  setLoading: (entity: keyof LoadingState, loading: boolean) => void
  setError: (entity: keyof ErrorState, error: string | null) => void
  clearAllErrors: () => void
  
  // ========== 过滤器操作 ==========
  updateAgentFilter: (filter: Partial<FilterState['agents']>) => void
  updateProjectFilter: (filter: Partial<FilterState['projects']>) => void
  updateTaskFilter: (filter: Partial<FilterState['tasks']>) => void
  updateConflictFilter: (filter: Partial<FilterState['conflicts']>) => void
  clearAllFilters: () => void
  
  // ========== Agent操作 ==========
  setAgents: (agents: Agent[]) => void
  addAgent: (agent: Agent) => void
  updateAgent: (agentId: string, updates: Partial<Agent>) => void
  removeAgent: (agentId: string) => void
  updateAgentStatus: (agentId: string, status: AgentStatus, reason?: string) => void
  
  // ========== Project操作 ==========
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  updateProject: (projectId: string, updates: Partial<Project>) => void
  removeProject: (projectId: string) => void
  
  // ========== Task操作 ==========
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  removeTask: (taskId: string) => void
  assignTask: (taskId: string, agentId: string) => void
  updateTaskProgress: (taskId: string, progress: number, statusMessage?: string) => void
  
  // ========== Conflict操作 ==========
  setConflicts: (conflicts: Conflict[]) => void
  addConflict: (conflict: Conflict) => void
  updateConflict: (conflictId: string, updates: Partial<Conflict>) => void
  removeConflict: (conflictId: string) => void
  resolveConflict: (conflictId: string, decision: HumanDecision) => void
  
  // ========== 操作历史 ==========
  addOperation: (type: string, description: string, data?: any) => void
  clearOperationHistory: () => void
  
  // ========== 事件处理 ==========
  handleMultiAgentEvent: (eventType: string, eventData: any) => void
  
  // ========== 选择器函数 ==========
  getSelectedAgent: () => Agent | null
  getSelectedProject: () => Project | null
  getSelectedTask: () => Task | null
  getSelectedConflict: () => Conflict | null
  getFilteredAgents: () => Agent[]
  getFilteredProjects: () => Project[]
  getFilteredTasks: () => Task[]
  getFilteredConflicts: () => Conflict[]
  getAgentsByStatus: (status: AgentStatus) => Agent[]
  getTasksByProject: (projectId: string) => Task[]
  getTasksByAgent: (agentId: string) => Task[]
  getProjectsByAgent: (agentId: string) => Project[]
  getActiveConflicts: () => Conflict[]
}

// ============================================================================
// 默认状态
// ============================================================================

const initialViewState: ViewState = {
  currentView: 'messages',
  selectedAgentId: null,
  selectedProjectId: null,
  selectedTaskId: null,
  selectedConflictId: null
}

const initialLoadingState: LoadingState = {
  agents: false,
  projects: false,
  tasks: false,
  conflicts: false,
  global: false
}

const initialErrorState: ErrorState = {
  agents: null,
  projects: null,
  tasks: null,
  conflicts: null,
  global: null
}

const initialFilterState: FilterState = {
  agents: {},
  projects: {},
  tasks: {},
  conflicts: {}
}

// ============================================================================
// Store创建
// ============================================================================

export const useMultiAgentStore = create<MultiAgentState>()(
  subscribeWithSelector((set, get) => ({
    // ========== 初始状态 ==========
    viewState: initialViewState,
    loadingState: initialLoadingState,
    errorState: initialErrorState,
    filterState: initialFilterState,
    
    agents: [],
    projects: [],
    tasks: [],
    conflicts: [],
    operationHistory: [],
    
    // ========== 视图操作 ==========
    setCurrentView: (view) => {
      set((state) => ({
        viewState: { ...state.viewState, currentView: view }
      }))
      
      get().addOperation('view_change', `切换到视图: ${view}`, { view })
    },
    
    setSelectedAgent: (agentId) => {
      set((state) => ({
        viewState: { ...state.viewState, selectedAgentId: agentId }
      }))
    },
    
    setSelectedProject: (projectId) => {
      set((state) => ({
        viewState: { ...state.viewState, selectedProjectId: projectId }
      }))
    },
    
    setSelectedTask: (taskId) => {
      set((state) => ({
        viewState: { ...state.viewState, selectedTaskId: taskId }
      }))
    },
    
    setSelectedConflict: (conflictId) => {
      set((state) => ({
        viewState: { ...state.viewState, selectedConflictId: conflictId }
      }))
    },
    
    // ========== 加载状态管理 ==========
    setLoading: (entity, loading) => {
      set((state) => ({
        loadingState: { ...state.loadingState, [entity]: loading }
      }))
    },
    
    setError: (entity, error) => {
      set((state) => ({
        errorState: { ...state.errorState, [entity]: error }
      }))
    },
    
    clearAllErrors: () => {
      set({ errorState: initialErrorState })
    },
    
    // ========== 过滤器操作 ==========
    updateAgentFilter: (filter) => {
      set((state) => ({
        filterState: {
          ...state.filterState,
          agents: { ...state.filterState.agents, ...filter }
        }
      }))
    },
    
    updateProjectFilter: (filter) => {
      set((state) => ({
        filterState: {
          ...state.filterState,
          projects: { ...state.filterState.projects, ...filter }
        }
      }))
    },
    
    updateTaskFilter: (filter) => {
      set((state) => ({
        filterState: {
          ...state.filterState,
          tasks: { ...state.filterState.tasks, ...filter }
        }
      }))
    },
    
    updateConflictFilter: (filter) => {
      set((state) => ({
        filterState: {
          ...state.filterState,
          conflicts: { ...state.filterState.conflicts, ...filter }
        }
      }))
    },
    
    clearAllFilters: () => {
      set({ filterState: initialFilterState })
    },
    
    // ========== Agent操作 ==========
    setAgents: (agents) => {
      set({ agents })
    },
    
    addAgent: (agent) => {
      set((state) => ({
        agents: [...state.agents, agent]
      }))
      
      get().addOperation('agent_created', `创建Agent: ${agent.name}`, { agentId: agent.id })
    },
    
    updateAgent: (agentId, updates) => {
      set((state) => ({
        agents: state.agents.map(agent =>
          agent.id === agentId ? { ...agent, ...updates } : agent
        )
      }))
      
      get().addOperation('agent_updated', `更新Agent: ${agentId}`, { agentId, updates })
    },
    
    removeAgent: (agentId) => {
      const agent = get().agents.find(a => a.id === agentId)
      
      set((state) => ({
        agents: state.agents.filter(agent => agent.id !== agentId),
        viewState: {
          ...state.viewState,
          selectedAgentId: state.viewState.selectedAgentId === agentId ? null : state.viewState.selectedAgentId
        }
      }))
      
      get().addOperation('agent_removed', `删除Agent: ${agent?.name || agentId}`, { agentId })
    },
    
    updateAgentStatus: (agentId, status, reason) => {
      const agent = get().agents.find(a => a.id === agentId)
      const oldStatus = agent?.status
      
      get().updateAgent(agentId, { 
        status, 
        lastActivity: new Date() 
      })
      
      // 触发状态变更事件
      if (agent && oldStatus !== status) {
        get().handleMultiAgentEvent('agent_status_changed', {
          agentId,
          agentName: agent.name,
          oldStatus,
          newStatus: status,
          reason
        })
      }
    },
    
    // ========== Project操作 ==========
    setProjects: (projects) => {
      set({ projects })
    },
    
    addProject: (project) => {
      set((state) => ({
        projects: [...state.projects, project]
      }))
      
      get().addOperation('project_created', `创建项目: ${project.name}`, { projectId: project.id })
    },
    
    updateProject: (projectId, updates) => {
      set((state) => ({
        projects: state.projects.map(project =>
          project.id === projectId ? { ...project, ...updates, updatedAt: new Date() } : project
        )
      }))
      
      get().addOperation('project_updated', `更新项目: ${projectId}`, { projectId, updates })
    },
    
    removeProject: (projectId) => {
      const project = get().projects.find(p => p.id === projectId)
      
      set((state) => ({
        projects: state.projects.filter(project => project.id !== projectId),
        // 同时删除相关任务
        tasks: state.tasks.filter(task => task.projectId !== projectId),
        viewState: {
          ...state.viewState,
          selectedProjectId: state.viewState.selectedProjectId === projectId ? null : state.viewState.selectedProjectId
        }
      }))
      
      get().addOperation('project_removed', `删除项目: ${project?.name || projectId}`, { projectId })
    },
    
    // ========== Task操作 ==========
    setTasks: (tasks) => {
      set({ tasks })
    },
    
    addTask: (task) => {
      set((state) => ({
        tasks: [...state.tasks, task]
      }))
      
      // 更新项目的任务计数
      const project = get().projects.find(p => p.id === task.projectId)
      if (project) {
        get().updateProject(task.projectId, {
          totalTasks: project.totalTasks + 1
        })
      }
      
      get().addOperation('task_created', `创建任务: ${task.title}`, { taskId: task.id })
    },
    
    updateTask: (taskId, updates) => {
      const oldTask = get().tasks.find(t => t.id === taskId)
      
      set((state) => ({
        tasks: state.tasks.map(task =>
          task.id === taskId ? { ...task, ...updates, updatedAt: new Date() } : task
        )
      }))
      
      // 如果状态发生变化，更新项目统计
      if (oldTask && updates.status && oldTask.status !== updates.status) {
        const project = get().projects.find(p => p.id === oldTask.projectId)
        if (project) {
          const tasks = get().tasks.filter(t => t.projectId === project.id)
          const completedTasks = tasks.filter(t => t.status === 'completed').length
          const activeTasks = tasks.filter(t => t.status === 'in_progress').length
          const failedTasks = tasks.filter(t => t.status === 'failed').length
          
          get().updateProject(project.id, {
            completedTasks,
            activeTasks,
            failedTasks,
            progress: project.totalTasks > 0 ? completedTasks / project.totalTasks : 0
          })
        }
      }
      
      get().addOperation('task_updated', `更新任务: ${taskId}`, { taskId, updates })
    },
    
    removeTask: (taskId) => {
      const task = get().tasks.find(t => t.id === taskId)
      
      set((state) => ({
        tasks: state.tasks.filter(task => task.id !== taskId),
        viewState: {
          ...state.viewState,
          selectedTaskId: state.viewState.selectedTaskId === taskId ? null : state.viewState.selectedTaskId
        }
      }))
      
      // 更新项目的任务计数
      if (task) {
        const project = get().projects.find(p => p.id === task.projectId)
        if (project) {
          get().updateProject(task.projectId, {
            totalTasks: Math.max(0, project.totalTasks - 1)
          })
        }
      }
      
      get().addOperation('task_removed', `删除任务: ${task?.title || taskId}`, { taskId })
    },
    
    assignTask: (taskId, agentId) => {
      const task = get().tasks.find(t => t.id === taskId)
      const agent = get().agents.find(a => a.id === agentId)
      
      if (task && agent) {
        get().updateTask(taskId, {
          assignedAgent: agent,
          status: 'in_progress'
        })
        
        get().updateAgent(agentId, {
          currentTask: task.title,
          status: 'working'
        })
        
        // 触发任务分配事件
        get().handleMultiAgentEvent('task_assigned', {
          taskId,
          taskTitle: task.title,
          agentId,
          agentName: agent.name,
          projectId: task.projectId
        })
      }
    },
    
    updateTaskProgress: (taskId, progress, statusMessage) => {
      get().updateTask(taskId, { progress })
      
      const task = get().tasks.find(t => t.id === taskId)
      if (task?.assignedAgent) {
        // 触发进度更新事件
        get().handleMultiAgentEvent('task_progress_updated', {
          taskId,
          agentId: task.assignedAgent.id,
          progress,
          statusMessage
        })
      }
    },
    
    // ========== Conflict操作 ==========
    setConflicts: (conflicts) => {
      set({ conflicts })
    },
    
    addConflict: (conflict) => {
      set((state) => ({
        conflicts: [...state.conflicts, conflict]
      }))
      
      // 触发冲突检测事件
      get().handleMultiAgentEvent('conflict_detected', {
        conflictId: conflict.id,
        conflictType: conflict.type,
        severity: conflict.severity,
        description: conflict.description,
        affectedAgents: conflict.relatedAgents,
        affectedTasks: conflict.relatedTasks
      })
      
      get().addOperation('conflict_detected', `检测到冲突: ${conflict.description}`, { conflictId: conflict.id })
    },
    
    updateConflict: (conflictId, updates) => {
      set((state) => ({
        conflicts: state.conflicts.map(conflict =>
          conflict.id === conflictId ? { ...conflict, ...updates } : conflict
        )
      }))
      
      get().addOperation('conflict_updated', `更新冲突: ${conflictId}`, { conflictId, updates })
    },
    
    removeConflict: (conflictId) => {
      const conflict = get().conflicts.find(c => c.id === conflictId)
      
      set((state) => ({
        conflicts: state.conflicts.filter(conflict => conflict.id !== conflictId),
        viewState: {
          ...state.viewState,
          selectedConflictId: state.viewState.selectedConflictId === conflictId ? null : state.viewState.selectedConflictId
        }
      }))
      
      get().addOperation('conflict_removed', `删除冲突: ${conflict?.description || conflictId}`, { conflictId })
    },
    
    resolveConflict: (conflictId, decision) => {
      get().updateConflict(conflictId, {
        status: 'resolved',
        resolvedAt: new Date(),
        humanDecision: decision
      })
      
      get().addOperation('conflict_resolved', `解决冲突: ${conflictId}`, { conflictId, decision })
    },
    
    // ========== 操作历史 ==========
    addOperation: (type, description, data) => {
      const operation = {
        id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        timestamp: new Date(),
        description,
        data
      }
      
      set((state) => ({
        operationHistory: [operation, ...state.operationHistory].slice(0, 100) // 保留最近100条
      }))
    },
    
    clearOperationHistory: () => {
      set({ operationHistory: [] })
    },
    
    // ========== 事件处理 ==========
    handleMultiAgentEvent: (eventType, eventData) => {
      console.log('[MultiAgent] 处理事件:', eventType, eventData)
      
      // 这里可以扩展其他事件处理逻辑
      // 例如：通知系统、日志记录、性能监控等
      
      get().addOperation(`event_${eventType}`, `多Agent事件: ${eventType}`, eventData)
    },
    
    // ========== 选择器函数 ==========
    getSelectedAgent: () => {
      const { agents, viewState } = get()
      return viewState.selectedAgentId ? agents.find(a => a.id === viewState.selectedAgentId) || null : null
    },
    
    getSelectedProject: () => {
      const { projects, viewState } = get()
      return viewState.selectedProjectId ? projects.find(p => p.id === viewState.selectedProjectId) || null : null
    },
    
    getSelectedTask: () => {
      const { tasks, viewState } = get()
      return viewState.selectedTaskId ? tasks.find(t => t.id === viewState.selectedTaskId) || null : null
    },
    
    getSelectedConflict: () => {
      const { conflicts, viewState } = get()
      return viewState.selectedConflictId ? conflicts.find(c => c.id === viewState.selectedConflictId) || null : null
    },
    
    getFilteredAgents: () => {
      const { agents, filterState } = get()
      const filter = filterState.agents
      
      return agents.filter(agent => {
        if (filter.status && filter.status.length > 0 && !filter.status.includes(agent.status)) {
          return false
        }
        
        if (filter.capabilities && filter.capabilities.length > 0) {
          const hasCapability = filter.capabilities.some(cap => agent.capabilities.includes(cap))
          if (!hasCapability) return false
        }
        
        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase()
          const searchText = `${agent.name} ${agent.description || ''} ${agent.capabilities.join(' ')}`.toLowerCase()
          if (!searchText.includes(query)) return false
        }
        
        return true
      })
    },
    
    getFilteredProjects: () => {
      const { projects, filterState } = get()
      const filter = filterState.projects
      
      return projects.filter(project => {
        if (filter.status && filter.status.length > 0 && !filter.status.includes(project.status)) {
          return false
        }
        
        if (filter.assignedAgents && filter.assignedAgents.length > 0) {
          const hasAssignedAgent = filter.assignedAgents.some(agentId => 
            project.assignedAgents.some(agent => agent.id === agentId)
          )
          if (!hasAssignedAgent) return false
        }
        
        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase()
          const searchText = `${project.name} ${project.description}`.toLowerCase()
          if (!searchText.includes(query)) return false
        }
        
        return true
      })
    },
    
    getFilteredTasks: () => {
      const { tasks, filterState } = get()
      const filter = filterState.tasks
      
      return tasks.filter(task => {
        if (filter.status && filter.status.length > 0 && !filter.status.includes(task.status)) {
          return false
        }
        
        if (filter.priority && filter.priority.length > 0 && !filter.priority.includes(task.priority)) {
          return false
        }
        
        if (filter.assignedAgent && task.assignedAgent?.id !== filter.assignedAgent) {
          return false
        }
        
        if (filter.projectId && task.projectId !== filter.projectId) {
          return false
        }
        
        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase()
          const searchText = `${task.title} ${task.description}`.toLowerCase()
          if (!searchText.includes(query)) return false
        }
        
        return true
      })
    },
    
    getFilteredConflicts: () => {
      const { conflicts, filterState } = get()
      const filter = filterState.conflicts
      
      return conflicts.filter(conflict => {
        if (filter.type && filter.type.length > 0 && !filter.type.includes(conflict.type)) {
          return false
        }
        
        if (filter.severity && filter.severity.length > 0 && !filter.severity.includes(conflict.severity)) {
          return false
        }
        
        if (filter.status && filter.status.length > 0 && !filter.status.includes(conflict.status)) {
          return false
        }
        
        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase()
          const searchText = `${conflict.description}`.toLowerCase()
          if (!searchText.includes(query)) return false
        }
        
        return true
      })
    },
    
    getAgentsByStatus: (status) => {
      return get().agents.filter(agent => agent.status === status)
    },
    
    getTasksByProject: (projectId) => {
      return get().tasks.filter(task => task.projectId === projectId)
    },
    
    getTasksByAgent: (agentId) => {
      return get().tasks.filter(task => task.assignedAgent?.id === agentId)
    },
    
    getProjectsByAgent: (agentId) => {
      return get().projects.filter(project => 
        project.assignedAgents.some(agent => agent.id === agentId)
      )
    },
    
    getActiveConflicts: () => {
      return get().conflicts.filter(conflict => conflict.status === 'active')
    }
  }))
)

// ============================================================================
// 选择器Hooks - 基于现有架构模式
// ============================================================================

// 基础选择器
export const useCurrentView = () => useMultiAgentStore(state => state.viewState.currentView)
export const useSelectedAgent = () => useMultiAgentStore(state => state.getSelectedAgent())
export const useSelectedProject = () => useMultiAgentStore(state => state.getSelectedProject())
export const useSelectedTask = () => useMultiAgentStore(state => state.getSelectedTask())
export const useSelectedConflict = () => useMultiAgentStore(state => state.getSelectedConflict())

// 数据选择器
export const useAgents = () => useMultiAgentStore(state => state.getFilteredAgents())
export const useProjects = () => useMultiAgentStore(state => state.getFilteredProjects())
export const useTasks = () => useMultiAgentStore(state => state.getFilteredTasks())
export const useConflicts = () => useMultiAgentStore(state => state.getFilteredConflicts())

// 状态选择器
export const useLoadingState = () => useMultiAgentStore(state => state.loadingState)
export const useErrorState = () => useMultiAgentStore(state => state.errorState)
export const useIsLoading = (entity: keyof LoadingState) => 
  useMultiAgentStore(state => state.loadingState[entity])

// 特定查询选择器
export const useAgentsByStatus = (status: AgentStatus) => 
  useMultiAgentStore(state => state.getAgentsByStatus(status))
export const useTasksByProject = (projectId: string) => 
  useMultiAgentStore(state => state.getTasksByProject(projectId))
export const useTasksByAgent = (agentId: string) => 
  useMultiAgentStore(state => state.getTasksByAgent(agentId))
export const useActiveConflicts = () => 
  useMultiAgentStore(state => state.getActiveConflicts())

// 统计选择器
export const useAgentStats = () => useMultiAgentStore(state => {
  const agents = state.agents
  return {
    total: agents.length,
    idle: agents.filter(a => a.status === 'idle').length,
    working: agents.filter(a => a.status === 'working').length,
    error: agents.filter(a => a.status === 'error').length,
    offline: agents.filter(a => a.status === 'offline').length
  }
})

export const useTaskStats = () => useMultiAgentStore(state => {
  const tasks = state.tasks
  return {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length
  }
})

export const useProjectStats = () => useMultiAgentStore(state => {
  const projects = state.projects
  return {
    total: projects.length,
    planning: projects.filter(p => p.status === 'planning').length,
    active: projects.filter(p => p.status === 'active').length,
    paused: projects.filter(p => p.status === 'paused').length,
    completed: projects.filter(p => p.status === 'completed').length,
    cancelled: projects.filter(p => p.status === 'cancelled').length
  }
})