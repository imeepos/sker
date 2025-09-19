/**
 * Tauri集成服务层 - 多Agent系统API封装
 * 基于现有的EventListenerManager架构，扩展支持多Agent功能
 */

import { invoke } from '@tauri-apps/api/core'
import type {
  Agent,
  Project,
  Task,
  Conflict,
  AgentConfig,
  ProjectConfig,
  TaskConfig,
  HumanDecision,
  CreateAgentParams,
  UpdateAgentParams,
  CreateProjectParams,
  UpdateProjectParams,
  CreateTaskParams,
  AssignTaskParams,
  UpdateTaskStatusParams,
  ResolveConflictParams,
  ApiResponse,
  AgentListResponse,
  ProjectListResponse,
  TaskListResponse,
  ConflictListResponse
} from '../types/multi-agent'
import { eventListenerManager } from './EventListenerManager'

// ============================================================================
// Tauri命令封装类
// ============================================================================

export class TauriMultiAgentService {
  
  // ========== Agent管理API ==========
  
  /**
   * 获取所有Agent列表
   */
  static async getAgents(): Promise<Agent[]> {
    try {
      const response = await invoke<AgentListResponse>('get_agents')
      if (response.success && response.data) {
        return response.data
      }
      throw new Error(response.error || '获取Agent列表失败')
    } catch (error) {
      console.error('[TauriService] 获取Agent列表失败:', error)
      throw error
    }
  }
  
  /**
   * 根据ID获取Agent详情
   */
  static async getAgent(agentId: string): Promise<Agent> {
    try {
      const response = await invoke<ApiResponse<Agent>>('get_agent', { agentId })
      if (response.success && response.data) {
        return response.data
      }
      throw new Error(response.error || '获取Agent详情失败')
    } catch (error) {
      console.error('[TauriService] 获取Agent详情失败:', error)
      throw error
    }
  }
  
  /**
   * 创建新Agent
   */
  static async createAgent(config: AgentConfig): Promise<Agent> {
    try {
      const params: CreateAgentParams = { config }
      const response = await invoke<ApiResponse<Agent>>('create_agent', params as unknown as Record<string, unknown>)
      if (response.success && response.data) {
        return response.data
      }
      throw new Error(response.error || '创建Agent失败')
    } catch (error) {
      console.error('[TauriService] 创建Agent失败:', error)
      throw error
    }
  }
  
  /**
   * 更新Agent信息
   */
  static async updateAgent(agentId: string, updates: Partial<Agent>): Promise<Agent> {
    try {
      const params: UpdateAgentParams = { agentId, updates }
      const response = await invoke<ApiResponse<Agent>>('update_agent', params as unknown as Record<string, unknown>)
      if (response.success && response.data) {
        return response.data
      }
      throw new Error(response.error || '更新Agent失败')
    } catch (error) {
      console.error('[TauriService] 更新Agent失败:', error)
      throw error
    }
  }
  
  /**
   * 删除Agent
   */
  static async deleteAgent(agentId: string): Promise<void> {
    try {
      const response = await invoke<ApiResponse<void>>('delete_agent', { agentId })
      if (!response.success) {
        throw new Error(response.error || '删除Agent失败')
      }
    } catch (error) {
      console.error('[TauriService] 删除Agent失败:', error)
      throw error
    }
  }
  
  /**
   * 更新Agent状态
   */
  static async updateAgentStatus(agentId: string, status: Agent['status']): Promise<void> {
    try {
      const response = await invoke<ApiResponse<void>>('update_agent_status', { agentId, status })
      if (!response.success) {
        throw new Error(response.error || '更新Agent状态失败')
      }
    } catch (error) {
      console.error('[TauriService] 更新Agent状态失败:', error)
      throw error
    }
  }
  
  // ========== Project管理API ==========
  
  /**
   * 获取所有项目列表
   */
  static async getProjects(): Promise<Project[]> {
    try {
      const response = await invoke<ProjectListResponse>('get_projects')
      if (response.success && response.data) {
        return response.data
      }
      throw new Error(response.error || '获取项目列表失败')
    } catch (error) {
      console.error('[TauriService] 获取项目列表失败:', error)
      throw error
    }
  }
  
  /**
   * 根据ID获取项目详情
   */
  static async getProject(projectId: string): Promise<Project> {
    try {
      const response = await invoke<ApiResponse<Project>>('get_project', { projectId })
      if (response.success && response.data) {
        return response.data
      }
      throw new Error(response.error || '获取项目详情失败')
    } catch (error) {
      console.error('[TauriService] 获取项目详情失败:', error)
      throw error
    }
  }
  
  /**
   * 创建新项目
   */
  static async createProject(config: ProjectConfig): Promise<Project> {
    try {
      const params: CreateProjectParams = { config }
      const response = await invoke<ApiResponse<Project>>('create_project', params as unknown as Record<string, unknown>)
      if (response.success && response.data) {
        return response.data
      }
      throw new Error(response.error || '创建项目失败')
    } catch (error) {
      console.error('[TauriService] 创建项目失败:', error)
      throw error
    }
  }
  
  /**
   * 更新项目信息
   */
  static async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
    try {
      const params: UpdateProjectParams = { projectId, updates }
      const response = await invoke<ApiResponse<Project>>('update_project', params as unknown as Record<string, unknown>)
      if (response.success && response.data) {
        return response.data
      }
      throw new Error(response.error || '更新项目失败')
    } catch (error) {
      console.error('[TauriService] 更新项目失败:', error)
      throw error
    }
  }
  
  /**
   * 删除项目
   */
  static async deleteProject(projectId: string): Promise<void> {
    try {
      const response = await invoke<ApiResponse<void>>('delete_project', { projectId })
      if (!response.success) {
        throw new Error(response.error || '删除项目失败')
      }
    } catch (error) {
      console.error('[TauriService] 删除项目失败:', error)
      throw error
    }
  }
  
  // ========== Task管理API ==========
  
  /**
   * 获取任务列表（可按项目筛选）
   */
  static async getTasks(projectId?: string): Promise<Task[]> {
    try {
      const response = await invoke<TaskListResponse>('get_tasks', { projectId })
      if (response.success && response.data) {
        return response.data
      }
      throw new Error(response.error || '获取任务列表失败')
    } catch (error) {
      console.error('[TauriService] 获取任务列表失败:', error)
      throw error
    }
  }
  
  /**
   * 根据ID获取任务详情
   */
  static async getTask(taskId: string): Promise<Task> {
    try {
      const response = await invoke<ApiResponse<Task>>('get_task', { taskId })
      if (response.success && response.data) {
        return response.data
      }
      throw new Error(response.error || '获取任务详情失败')
    } catch (error) {
      console.error('[TauriService] 获取任务详情失败:', error)
      throw error
    }
  }
  
  /**
   * 创建新任务
   */
  static async createTask(projectId: string, config: TaskConfig): Promise<Task> {
    try {
      const params: CreateTaskParams = { projectId, config }
      const response = await invoke<ApiResponse<Task>>('create_task', params as unknown as Record<string, unknown>)
      if (response.success && response.data) {
        return response.data
      }
      throw new Error(response.error || '创建任务失败')
    } catch (error) {
      console.error('[TauriService] 创建任务失败:', error)
      throw error
    }
  }
  
  /**
   * 分配任务给Agent
   */
  static async assignTask(taskId: string, agentId: string): Promise<void> {
    try {
      const params: AssignTaskParams = { taskId, agentId }
      const response = await invoke<ApiResponse<void>>('assign_task', params as unknown as Record<string, unknown>)
      if (!response.success) {
        throw new Error(response.error || '分配任务失败')
      }
    } catch (error) {
      console.error('[TauriService] 分配任务失败:', error)
      throw error
    }
  }
  
  /**
   * 更新任务状态
   */
  static async updateTaskStatus(taskId: string, status: Task['status'], progress?: number): Promise<void> {
    try {
      const params: UpdateTaskStatusParams = { taskId, status, progress }
      const response = await invoke<ApiResponse<void>>('update_task_status', params as unknown as Record<string, unknown>)
      if (!response.success) {
        throw new Error(response.error || '更新任务状态失败')
      }
    } catch (error) {
      console.error('[TauriService] 更新任务状态失败:', error)
      throw error
    }
  }
  
  /**
   * 删除任务
   */
  static async deleteTask(taskId: string): Promise<void> {
    try {
      const response = await invoke<ApiResponse<void>>('delete_task', { taskId })
      if (!response.success) {
        throw new Error(response.error || '删除任务失败')
      }
    } catch (error) {
      console.error('[TauriService] 删除任务失败:', error)
      throw error
    }
  }
  
  // ========== Conflict管理API ==========
  
  /**
   * 获取冲突列表
   */
  static async getConflicts(): Promise<Conflict[]> {
    try {
      const response = await invoke<ConflictListResponse>('get_conflicts')
      if (response.success && response.data) {
        return response.data
      }
      throw new Error(response.error || '获取冲突列表失败')
    } catch (error) {
      console.error('[TauriService] 获取冲突列表失败:', error)
      throw error
    }
  }
  
  /**
   * 根据ID获取冲突详情
   */
  static async getConflict(conflictId: string): Promise<Conflict> {
    try {
      const response = await invoke<ApiResponse<Conflict>>('get_conflict', { conflictId })
      if (response.success && response.data) {
        return response.data
      }
      throw new Error(response.error || '获取冲突详情失败')
    } catch (error) {
      console.error('[TauriService] 获取冲突详情失败:', error)
      throw error
    }
  }
  
  /**
   * 解决冲突
   */
  static async resolveConflict(conflictId: string, decision: HumanDecision): Promise<void> {
    try {
      const params: ResolveConflictParams = { conflictId, decision }
      const response = await invoke<ApiResponse<void>>('resolve_conflict', params as unknown as Record<string, unknown>)
      if (!response.success) {
        throw new Error(response.error || '解决冲突失败')
      }
    } catch (error) {
      console.error('[TauriService] 解决冲突失败:', error)
      throw error
    }
  }
  
  // ========== LLM分解API ==========
  
  /**
   * 启动LLM任务分解
   */
  static async startLLMDecomposition(projectId: string, documentId: string): Promise<void> {
    try {
      const response = await invoke<ApiResponse<void>>('start_llm_decomposition', { projectId, documentId })
      if (!response.success) {
        throw new Error(response.error || '启动LLM分解失败')
      }
    } catch (error) {
      console.error('[TauriService] 启动LLM分解失败:', error)
      throw error
    }
  }
  
  /**
   * 获取LLM分解结果
   */
  static async getLLMDecompositionResult(projectId: string): Promise<Task[]> {
    try {
      const response = await invoke<ApiResponse<Task[]>>('get_llm_decomposition_result', { projectId })
      if (response.success && response.data) {
        return response.data
      }
      throw new Error(response.error || '获取LLM分解结果失败')
    } catch (error) {
      console.error('[TauriService] 获取LLM分解结果失败:', error)
      throw error
    }
  }
}

// ============================================================================
// Tauri事件监听服务 - 基于现有EventListenerManager
// ============================================================================

export class TauriMultiAgentEventService {
  // private listeners: Map<string, UnlistenFn> = new Map()
  
  /**
   * 监听Agent状态变化事件
   */
  async listenToAgentEvents(callback: (event: any) => void): Promise<void> {
    try {
      await eventListenerManager.addListener('multi_agent_events', (tauri_event: any) => {
        const eventData = tauri_event.payload
        if (eventData && eventData.type && eventData.type.startsWith('agent_')) {
          callback(eventData)
        }
      })
      console.log('[TauriEventService] Agent事件监听已启动')
    } catch (error) {
      console.error('[TauriEventService] 监听Agent事件失败:', error)
      throw error
    }
  }
  
  /**
   * 监听任务进度更新事件
   */
  async listenToTaskEvents(callback: (event: any) => void): Promise<void> {
    try {
      await eventListenerManager.addListener('multi_agent_events', (tauri_event: any) => {
        const eventData = tauri_event.payload
        if (eventData && eventData.type && eventData.type.startsWith('task_')) {
          callback(eventData)
        }
      })
      console.log('[TauriEventService] 任务事件监听已启动')
    } catch (error) {
      console.error('[TauriEventService] 监听任务事件失败:', error)
      throw error
    }
  }
  
  /**
   * 监听项目更新事件
   */
  async listenToProjectEvents(callback: (event: any) => void): Promise<void> {
    try {
      await eventListenerManager.addListener('multi_agent_events', (tauri_event: any) => {
        const eventData = tauri_event.payload
        if (eventData && eventData.type && eventData.type.startsWith('project_')) {
          callback(eventData)
        }
      })
      console.log('[TauriEventService] 项目事件监听已启动')
    } catch (error) {
      console.error('[TauriEventService] 监听项目事件失败:', error)
      throw error
    }
  }
  
  /**
   * 监听冲突检测事件
   */
  async listenToConflictEvents(callback: (event: any) => void): Promise<void> {
    try {
      await eventListenerManager.addListener('multi_agent_events', (tauri_event: any) => {
        const eventData = tauri_event.payload
        if (eventData && eventData.type && eventData.type.startsWith('conflict_')) {
          callback(eventData)
        }
      })
      console.log('[TauriEventService] 冲突事件监听已启动')
    } catch (error) {
      console.error('[TauriEventService] 监听冲突事件失败:', error)
      throw error
    }
  }
  
  /**
   * 监听LLM分解事件
   */
  async listenToLLMEvents(callback: (event: any) => void): Promise<void> {
    try {
      await eventListenerManager.addListener('multi_agent_events', (tauri_event: any) => {
        const eventData = tauri_event.payload
        if (eventData && eventData.type && eventData.type.startsWith('llm_')) {
          callback(eventData)
        }
      })
      console.log('[TauriEventService] LLM事件监听已启动')
    } catch (error) {
      console.error('[TauriEventService] 监听LLM事件失败:', error)
      throw error
    }
  }
  
  /**
   * 监听人工干预请求事件
   */
  async listenToHumanInterventionEvents(callback: (event: any) => void): Promise<void> {
    try {
      await eventListenerManager.addListener('multi_agent_events', (tauri_event: any) => {
        const eventData = tauri_event.payload
        if (eventData && eventData.type === 'human_intervention_required') {
          callback(eventData)
        }
      })
      console.log('[TauriEventService] 人工干预事件监听已启动')
    } catch (error) {
      console.error('[TauriEventService] 监听人工干预事件失败:', error)
      throw error
    }
  }
  
  /**
   * 启动所有多Agent事件监听
   */
  async startAllEventListeners(callbacks: {
    onAgentEvent?: (event: any) => void
    onTaskEvent?: (event: any) => void
    onProjectEvent?: (event: any) => void
    onConflictEvent?: (event: any) => void
    onLLMEvent?: (event: any) => void
    onHumanInterventionEvent?: (event: any) => void
  }): Promise<void> {
    try {
      // 注册统一的事件处理器
      await eventListenerManager.addListener('multi_agent_events', (tauri_event: any) => {
        const eventData = tauri_event.payload
        if (!eventData || !eventData.type) return
        
        console.log('[TauriEventService] 收到多Agent事件:', eventData.type, eventData)
        
        // 根据事件类型分发到相应的回调
        if (eventData.type.startsWith('agent_') && callbacks.onAgentEvent) {
          callbacks.onAgentEvent(eventData)
        } else if (eventData.type.startsWith('task_') && callbacks.onTaskEvent) {
          callbacks.onTaskEvent(eventData)
        } else if (eventData.type.startsWith('project_') && callbacks.onProjectEvent) {
          callbacks.onProjectEvent(eventData)
        } else if (eventData.type.startsWith('conflict_') && callbacks.onConflictEvent) {
          callbacks.onConflictEvent(eventData)
        } else if (eventData.type.startsWith('llm_') && callbacks.onLLMEvent) {
          callbacks.onLLMEvent(eventData)
        } else if (eventData.type === 'human_intervention_required' && callbacks.onHumanInterventionEvent) {
          callbacks.onHumanInterventionEvent(eventData)
        }
      })
      
      console.log('[TauriEventService] 所有多Agent事件监听已启动')
    } catch (error) {
      console.error('[TauriEventService] 启动多Agent事件监听失败:', error)
      throw error
    }
  }
  
  /**
   * 停止指定事件监听
   */
  stopListening(eventName: string): void {
    try {
      eventListenerManager.removeListener(eventName)
      console.log('[TauriEventService] 停止监听事件:', eventName)
    } catch (error) {
      console.error('[TauriEventService] 停止监听事件失败:', error)
    }
  }
  
  /**
   * 停止所有事件监听
   */
  stopAllListening(): void {
    try {
      // 移除多Agent事件监听
      eventListenerManager.removeListener('multi_agent_events')
      console.log('[TauriEventService] 所有多Agent事件监听已停止')
    } catch (error) {
      console.error('[TauriEventService] 停止所有事件监听失败:', error)
    }
  }
}

// ============================================================================
// 导出单例实例
// ============================================================================

// 导出Tauri服务类
export const tauriMultiAgentService = TauriMultiAgentService

// 导出事件监听服务实例
export const tauriMultiAgentEventService = new TauriMultiAgentEventService()

// ============================================================================
// 错误处理和重试机制
// ============================================================================

/**
 * 带重试机制的API调用封装
 */
export async function withRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall()
    } catch (error) {
      lastError = error
      console.warn(`[TauriService] API调用失败 (尝试 ${attempt}/${maxRetries}):`, error)
      
      if (attempt < maxRetries) {
        // 指数退避延迟
        const delay = retryDelay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

/**
 * 带超时的API调用封装
 */
export async function withTimeout<T>(
  apiCall: () => Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  return Promise.race([
    apiCall(),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('API调用超时')), timeoutMs)
    })
  ])
}

/**
 * 综合封装：带重试和超时的API调用
 */
export async function safeTauriCall<T>(
  apiCall: () => Promise<T>,
  options: {
    maxRetries?: number
    retryDelay?: number
    timeoutMs?: number
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeoutMs = 30000
  } = options
  
  return withRetry(
    () => withTimeout(apiCall, timeoutMs),
    maxRetries,
    retryDelay
  )
}