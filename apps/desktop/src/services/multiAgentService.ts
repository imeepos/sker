/**
 * 多Agent协同开发系统 - 整合服务层
 * 协调Tauri服务、状态管理和事件处理
 */

import { 
  tauriMultiAgentService, 
  tauriMultiAgentEventService, 
  safeTauriCall 
} from './tauriService'
import { useMultiAgentStore } from '../stores/multiAgent'
import type {
  Agent,
  Project,
  Task,
  // Conflict,
  AgentConfig,
  ProjectConfig,
  TaskConfig,
  HumanDecision
  // AgentStatus,
  // TaskStatus,
  // MultiAgentEventType
} from '../types/multi-agent'

// ============================================================================
// 多Agent服务协调类
// ============================================================================

export class MultiAgentService {
  private static instance: MultiAgentService
  private isInitialized = false
  
  private constructor() {}
  
  /**
   * 获取单例实例
   */
  static getInstance(): MultiAgentService {
    if (!MultiAgentService.instance) {
      MultiAgentService.instance = new MultiAgentService()
    }
    return MultiAgentService.instance
  }
  
  /**
   * 初始化多Agent服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[MultiAgentService] 服务已初始化')
      return
    }
    
    try {
      console.log('[MultiAgentService] 开始初始化...')
      
      // 启动事件监听
      await this.startEventListening()
      
      // 初始化数据加载
      await this.loadInitialData()
      
      this.isInitialized = true
      console.log('[MultiAgentService] 初始化完成')
    } catch (error) {
      console.error('[MultiAgentService] 初始化失败:', error)
      throw error
    }
  }
  
  /**
   * 销毁服务
   */
  destroy(): void {
    if (!this.isInitialized) return
    
    try {
      // 停止事件监听
      tauriMultiAgentEventService.stopAllListening()
      
      this.isInitialized = false
      console.log('[MultiAgentService] 服务已销毁')
    } catch (error) {
      console.error('[MultiAgentService] 销毁服务失败:', error)
    }
  }
  
  // ========== 私有方法 ==========
  
  /**
   * 启动事件监听
   */
  private async startEventListening(): Promise<void> {
    // const store = useMultiAgentStore.getState()
    
    await tauriMultiAgentEventService.startAllEventListeners({
      onAgentEvent: (event) => {
        console.log('[MultiAgentService] 处理Agent事件:', event)
        this.handleAgentEvent(event)
      },
      
      onTaskEvent: (event) => {
        console.log('[MultiAgentService] 处理任务事件:', event)
        this.handleTaskEvent(event)
      },
      
      onProjectEvent: (event) => {
        console.log('[MultiAgentService] 处理项目事件:', event)
        this.handleProjectEvent(event)
      },
      
      onConflictEvent: (event) => {
        console.log('[MultiAgentService] 处理冲突事件:', event)
        this.handleConflictEvent(event)
      },
      
      onLLMEvent: (event) => {
        console.log('[MultiAgentService] 处理LLM事件:', event)
        this.handleLLMEvent(event)
      },
      
      onHumanInterventionEvent: (event) => {
        console.log('[MultiAgentService] 处理人工干预事件:', event)
        this.handleHumanInterventionEvent(event)
      }
    })
  }
  
  /**
   * 加载初始数据
   */
  private async loadInitialData(): Promise<void> {
    const store = useMultiAgentStore.getState()
    
    try {
      // 并行加载所有基础数据
      const [agents, projects, tasks, conflicts] = await Promise.allSettled([
        this.loadAgents(),
        this.loadProjects(), 
        this.loadTasks(),
        this.loadConflicts()
      ])
      
      // 处理加载结果
      if (agents.status === 'rejected') {
        console.error('[MultiAgentService] 加载Agent数据失败:', agents.reason)
        store.setError('agents', '加载Agent数据失败')
      }
      
      if (projects.status === 'rejected') {
        console.error('[MultiAgentService] 加载项目数据失败:', projects.reason)
        store.setError('projects', '加载项目数据失败')
      }
      
      if (tasks.status === 'rejected') {
        console.error('[MultiAgentService] 加载任务数据失败:', tasks.reason)
        store.setError('tasks', '加载任务数据失败')
      }
      
      if (conflicts.status === 'rejected') {
        console.error('[MultiAgentService] 加载冲突数据失败:', conflicts.reason)
        store.setError('conflicts', '加载冲突数据失败')
      }
      
      console.log('[MultiAgentService] 初始数据加载完成')
    } catch (error) {
      console.error('[MultiAgentService] 加载初始数据失败:', error)
      store.setError('global', '加载初始数据失败')
    }
  }
  
  // ========== 事件处理方法 ==========
  
  private handleAgentEvent(event: any): void {
    const store = useMultiAgentStore.getState()
    
    switch (event.type) {
      case 'agent_status_changed':
        store.updateAgentStatus(event.agentId, event.newStatus, event.reason)
        break
        
      case 'agent_created':
        if (event.agent) {
          store.addAgent(event.agent)
        }
        break
        
      case 'agent_updated':
        if (event.agentId && event.updates) {
          store.updateAgent(event.agentId, event.updates)
        }
        break
        
      default:
        console.log('[MultiAgentService] 未处理的Agent事件:', event.type)
    }
  }
  
  private handleTaskEvent(event: any): void {
    const store = useMultiAgentStore.getState()
    
    switch (event.type) {
      case 'task_assigned':
        // 任务分配事件已在assignTask方法中处理
        break
        
      case 'task_progress_updated':
        store.updateTaskProgress(event.taskId, event.progress, event.statusMessage)
        break
        
      case 'task_execution_started':
        if (event.taskId) {
          store.updateTask(event.taskId, { status: 'in_progress' })
        }
        break
        
      case 'task_execution_completed':
        if (event.taskId && event.result) {
          store.updateTask(event.taskId, { 
            status: event.result.success ? 'completed' : 'failed',
            progress: 100
          })
        }
        break
        
      default:
        console.log('[MultiAgentService] 未处理的任务事件:', event.type)
    }
  }
  
  private handleProjectEvent(event: any): void {
    const store = useMultiAgentStore.getState()
    
    switch (event.type) {
      case 'project_created':
        if (event.project) {
          store.addProject(event.project)
        }
        break
        
      case 'project_updated':
        if (event.projectId && event.updates) {
          store.updateProject(event.projectId, event.updates)
        }
        break
        
      default:
        console.log('[MultiAgentService] 未处理的项目事件:', event.type)
    }
  }
  
  private handleConflictEvent(event: any): void {
    const store = useMultiAgentStore.getState()
    
    switch (event.type) {
      case 'conflict_detected':
        if (event.conflict) {
          store.addConflict(event.conflict)
        }
        break
        
      case 'conflict_resolved':
        if (event.conflictId) {
          store.updateConflict(event.conflictId, { 
            status: 'resolved',
            resolvedAt: new Date()
          })
        }
        break
        
      default:
        console.log('[MultiAgentService] 未处理的冲突事件:', event.type)
    }
  }
  
  private handleLLMEvent(event: any): void {
    const store = useMultiAgentStore.getState()
    
    switch (event.type) {
      case 'llm_decomposition_started':
        console.log('[MultiAgentService] LLM分解开始:', event.projectId)
        break
        
      case 'llm_decomposition_completed':
        if (event.tasks && Array.isArray(event.tasks)) {
          // 添加LLM生成的任务
          event.tasks.forEach((task: Task) => {
            store.addTask(task)
          })
          console.log('[MultiAgentService] LLM分解完成，生成任务数:', event.tasks.length)
        }
        break
        
      default:
        console.log('[MultiAgentService] 未处理的LLM事件:', event.type)
    }
  }
  
  private handleHumanInterventionEvent(event: any): void {
    console.log('[MultiAgentService] 需要人工干预:', event)
    
    // 这里可以触发UI通知或弹窗
    // 例如：显示冲突解决对话框
    const store = useMultiAgentStore.getState()
    
    if (event.conflictId) {
      // 切换到冲突处理视图
      store.setCurrentView('conflicts')
      store.setSelectedConflict(event.conflictId)
    }
  }
  
  // ========== 公共API方法 ==========
  
  /**
   * 加载Agent数据
   */
  async loadAgents(): Promise<void> {
    const store = useMultiAgentStore.getState()
    
    store.setLoading('agents', true)
    store.setError('agents', null)
    
    try {
      const agents = await safeTauriCall(() => tauriMultiAgentService.getAgents())
      store.setAgents(agents)
      console.log('[MultiAgentService] 加载Agent数据成功:', agents.length)
    } catch (error) {
      console.error('[MultiAgentService] 加载Agent数据失败:', error)
      store.setError('agents', '加载Agent数据失败')
      throw error
    } finally {
      store.setLoading('agents', false)
    }
  }
  
  /**
   * 创建Agent
   */
  async createAgent(config: AgentConfig): Promise<Agent> {
    const store = useMultiAgentStore.getState()
    
    try {
      const agent = await safeTauriCall(() => tauriMultiAgentService.createAgent(config))
      store.addAgent(agent)
      console.log('[MultiAgentService] 创建Agent成功:', agent.id)
      return agent
    } catch (error) {
      console.error('[MultiAgentService] 创建Agent失败:', error)
      throw error
    }
  }
  
  /**
   * 更新Agent
   */
  async updateAgent(agentId: string, updates: Partial<Agent>): Promise<Agent> {
    const store = useMultiAgentStore.getState()
    
    try {
      const agent = await safeTauriCall(() => tauriMultiAgentService.updateAgent(agentId, updates))
      store.updateAgent(agentId, agent)
      console.log('[MultiAgentService] 更新Agent成功:', agentId)
      return agent
    } catch (error) {
      console.error('[MultiAgentService] 更新Agent失败:', error)
      throw error
    }
  }
  
  /**
   * 删除Agent
   */
  async deleteAgent(agentId: string): Promise<void> {
    const store = useMultiAgentStore.getState()
    
    try {
      await safeTauriCall(() => tauriMultiAgentService.deleteAgent(agentId))
      store.removeAgent(agentId)
      console.log('[MultiAgentService] 删除Agent成功:', agentId)
    } catch (error) {
      console.error('[MultiAgentService] 删除Agent失败:', error)
      throw error
    }
  }
  
  /**
   * 加载项目数据
   */
  async loadProjects(): Promise<void> {
    const store = useMultiAgentStore.getState()
    
    store.setLoading('projects', true)
    store.setError('projects', null)
    
    try {
      const projects = await safeTauriCall(() => tauriMultiAgentService.getProjects())
      store.setProjects(projects)
      console.log('[MultiAgentService] 加载项目数据成功:', projects.length)
    } catch (error) {
      console.error('[MultiAgentService] 加载项目数据失败:', error)
      store.setError('projects', '加载项目数据失败')
      throw error
    } finally {
      store.setLoading('projects', false)
    }
  }
  
  /**
   * 创建项目
   */
  async createProject(config: ProjectConfig): Promise<Project> {
    const store = useMultiAgentStore.getState()
    
    try {
      const project = await safeTauriCall(() => tauriMultiAgentService.createProject(config))
      store.addProject(project)
      console.log('[MultiAgentService] 创建项目成功:', project.id)
      return project
    } catch (error) {
      console.error('[MultiAgentService] 创建项目失败:', error)
      throw error
    }
  }
  
  /**
   * 加载任务数据
   */
  async loadTasks(projectId?: string): Promise<void> {
    const store = useMultiAgentStore.getState()
    
    store.setLoading('tasks', true)
    store.setError('tasks', null)
    
    try {
      const tasks = await safeTauriCall(() => tauriMultiAgentService.getTasks(projectId))
      store.setTasks(tasks)
      console.log('[MultiAgentService] 加载任务数据成功:', tasks.length)
    } catch (error) {
      console.error('[MultiAgentService] 加载任务数据失败:', error)
      store.setError('tasks', '加载任务数据失败')
      throw error
    } finally {
      store.setLoading('tasks', false)
    }
  }
  
  /**
   * 创建任务
   */
  async createTask(projectId: string, config: TaskConfig): Promise<Task> {
    const store = useMultiAgentStore.getState()
    
    try {
      const task = await safeTauriCall(() => tauriMultiAgentService.createTask(projectId, config))
      store.addTask(task)
      console.log('[MultiAgentService] 创建任务成功:', task.id)
      return task
    } catch (error) {
      console.error('[MultiAgentService] 创建任务失败:', error)
      throw error
    }
  }
  
  /**
   * 分配任务
   */
  async assignTask(taskId: string, agentId: string): Promise<void> {
    const store = useMultiAgentStore.getState()
    
    try {
      await safeTauriCall(() => tauriMultiAgentService.assignTask(taskId, agentId))
      store.assignTask(taskId, agentId)
      console.log('[MultiAgentService] 任务分配成功:', taskId, '->', agentId)
    } catch (error) {
      console.error('[MultiAgentService] 任务分配失败:', error)
      throw error
    }
  }
  
  /**
   * 加载冲突数据
   */
  async loadConflicts(): Promise<void> {
    const store = useMultiAgentStore.getState()
    
    store.setLoading('conflicts', true)
    store.setError('conflicts', null)
    
    try {
      const conflicts = await safeTauriCall(() => tauriMultiAgentService.getConflicts())
      store.setConflicts(conflicts)
      console.log('[MultiAgentService] 加载冲突数据成功:', conflicts.length)
    } catch (error) {
      console.error('[MultiAgentService] 加载冲突数据失败:', error)
      store.setError('conflicts', '加载冲突数据失败')
      throw error
    } finally {
      store.setLoading('conflicts', false)
    }
  }
  
  /**
   * 解决冲突
   */
  async resolveConflict(conflictId: string, decision: HumanDecision): Promise<void> {
    const store = useMultiAgentStore.getState()
    
    try {
      await safeTauriCall(() => tauriMultiAgentService.resolveConflict(conflictId, decision))
      store.resolveConflict(conflictId, decision)
      console.log('[MultiAgentService] 冲突解决成功:', conflictId)
    } catch (error) {
      console.error('[MultiAgentService] 冲突解决失败:', error)
      throw error
    }
  }
  
  /**
   * 启动LLM任务分解
   */
  async startLLMDecomposition(projectId: string, documentId: string): Promise<void> {
    try {
      await safeTauriCall(() => tauriMultiAgentService.startLLMDecomposition(projectId, documentId))
      console.log('[MultiAgentService] LLM分解启动成功:', projectId, documentId)
    } catch (error) {
      console.error('[MultiAgentService] LLM分解启动失败:', error)
      throw error
    }
  }
  
  /**
   * 刷新所有数据
   */
  async refreshAllData(): Promise<void> {
    console.log('[MultiAgentService] 开始刷新所有数据...')
    
    try {
      await Promise.allSettled([
        this.loadAgents(),
        this.loadProjects(),
        this.loadTasks(),
        this.loadConflicts()
      ])
      console.log('[MultiAgentService] 所有数据刷新完成')
    } catch (error) {
      console.error('[MultiAgentService] 刷新数据失败:', error)
      throw error
    }
  }
}

// ============================================================================
// 导出单例实例
// ============================================================================

export const multiAgentService = MultiAgentService.getInstance()

// ============================================================================
// 便捷函数导出
// ============================================================================

/**
 * 初始化多Agent服务的便捷函数
 */
export async function initializeMultiAgentService(): Promise<void> {
  return multiAgentService.initialize()
}

/**
 * 销毁多Agent服务的便捷函数
 */
export function destroyMultiAgentService(): void {
  multiAgentService.destroy()
}