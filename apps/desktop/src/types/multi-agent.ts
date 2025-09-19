/**
 * 多Agent协同开发系统 - 核心类型定义
 * 基于现有的chat.ts和events.ts架构，扩展支持多Agent功能
 */

import type { EventMsg } from './protocol'
import type { ConversationEvent } from './chat'

// ============================================================================
// Agent 相关类型定义
// ============================================================================

/** Agent状态枚举 */
export type AgentStatus = 'idle' | 'working' | 'error' | 'offline'

/** Agent类型枚举 */
export type AgentType = 'developer' | 'reviewer' | 'tester' | 'designer' | 'manager'

/** Agent能力类型 */
export type AgentCapability = 
  | 'frontend_development'
  | 'backend_development'
  | 'testing'
  | 'code_review'
  | 'devops'
  | 'ui_design'
  | 'database'
  | 'api_design'
  | 'documentation'
  | 'debugging'

/** Agent配置信息 */
export interface AgentConfig {
  name: string
  description?: string
  agentType: AgentType
  capabilities: AgentCapability[]
  maxConcurrentTasks: number
  timeoutMinutes: number
  promptTemplate?: string
  gitConfig?: {
    username: string
    email: string
    sshKey?: string
  }
  performanceSettings?: {
    temperature: number
    maxTokens: number
    model: string
  }
}

/** Agent实体 */
export interface Agent {
  id: string
  name: string
  description?: string
  status: AgentStatus
  agentType: AgentType
  capabilities: AgentCapability[]
  currentTask?: string
  successRate: number
  completedTasks: number
  failedTasks: number
  lastActivity: Date
  createdAt: Date
  config: AgentConfig
  maxConcurrentTasks: number
  timeoutMinutes: number
  gitConfig?: {
    username: string
    email: string
    sshKey?: string
  }
  metrics?: {
    averageCompletionTime: number // 分钟
    codeQualityScore: number // 0-100
    testCoverage: number // 百分比
  }
}

// ============================================================================
// Project 相关类型定义
// ============================================================================

/** 项目状态枚举 */
export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'cancelled'

/** 文档类型 */
export type DocumentType = 'user_story' | 'api_spec' | 'test_plan' | 'architecture_doc'

/** 需求文档 */
export interface RequirementDocument {
  id?: string
  title: string
  content: string
  documentType: DocumentType
  version: string
  priority: 'low' | 'medium' | 'high'
  uploadedAt?: Date
  processedAt?: Date
  llmProcessing?: {
    status: 'pending' | 'processing' | 'completed' | 'failed'
    extractedRequirements?: string[]
    suggestedTasks?: string[]
    estimatedComplexity?: 'low' | 'medium' | 'high'
  }
}

/** 项目配置 */
export interface ProjectConfig {
  name: string
  description: string
  gitRepository?: string
  mainBranch?: string
  technologyStack: string[]
  codingStandards?: Record<string, any>
  qualityGates?: {
    testCoverage: number
    codeQuality: number
    securityScan: boolean
  }
}

/** 项目实体 */
export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  progress: number // 0-1
  assignedAgents: Agent[]
  totalTasks: number
  completedTasks: number
  activeTasks: number
  failedTasks: number
  createdAt: Date
  updatedAt: Date
  config: ProjectConfig
  requirements: RequirementDocument[]
  technologyStack: string[]
  repository?: {
    url: string
    branch: string
    lastCommit?: string
  }
  metrics?: {
    estimatedDuration: number // 小时
    actualDuration?: number // 小时
    qualityScore: number // 0-100
    teamEfficiency: number // 0-100
  }
}

// ============================================================================
// Task 相关类型定义
// ============================================================================

/** 任务状态枚举 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'

/** 任务优先级 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

/** 任务配置 */
export interface TaskConfig {
  title: string
  description: string
  priority: TaskPriority
  estimatedHours?: number
  dependencies?: string[] // 依赖的任务ID
  requiredCapabilities: AgentCapability[]
  acceptance_criteria?: string[]
  deliverables?: string[]
}

/** 执行结果 */
export interface ExecutionResult {
  success: boolean
  deliverables: string[]
  gitCommits: string[]
  testResults?: {
    passed: number
    failed: number
    total: number
    coverage?: number
  }
  codeQuality?: {
    score: number
    issues: Array<{
      severity: 'low' | 'medium' | 'high'
      message: string
      file?: string
      line?: number
    }>
  }
  duration: number // 分钟
  output?: string
  error?: string
}

/** 执行会话 */
export interface ExecutionSession {
  id: string
  taskId: string
  agentId: string
  status: TaskStatus
  startedAt: Date
  completedAt?: Date
  progress: number // 0-100
  executionLog: Array<{
    timestamp: Date
    level: 'info' | 'warn' | 'error'
    message: string
    details?: any
  }>
  result?: ExecutionResult
  gitBranch?: string
}

/** 任务实体 */
export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignedAgent?: Agent
  progress: number // 0-100
  startTime?: Date
  endTime?: Date
  estimatedHours?: number
  actualHours?: number
  dependencies: string[]
  requiredCapabilities: AgentCapability[]
  acceptance_criteria: string[]
  deliverables: string[]
  executionSessions: ExecutionSession[]
  events: ConversationEvent[]
  createdAt: Date
  updatedAt: Date
  llmGenerated?: {
    decomposedFrom?: string // 原始需求ID
    reasoning?: string
    confidence: number // 0-100
  }
}

// ============================================================================
// Conflict 相关类型定义
// ============================================================================

/** 冲突类型 */
export type ConflictType = 'git_merge' | 'task_assignment' | 'resource_contention' | 'dependency_cycle' | 'agent_unavailable'

/** 冲突严重程度 */
export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical'

/** 解决策略 */
export type ResolutionStrategy = 'auto_merge' | 'manual_merge' | 'reject_changes' | 'create_new_branch' | 'pause_tasks'

/** 人工决策 */
export interface HumanDecision {
  strategy: ResolutionStrategy
  reasoning: string
  decidedAt: string
  decidedBy: string
}

/** 冲突实体 */
export interface Conflict {
  id: string
  type: ConflictType
  severity: ConflictSeverity
  description: string
  context: Record<string, any>
  relatedTasks: string[]
  relatedAgents: string[]
  detectedAt: Date
  resolvedAt?: Date
  humanDecision?: HumanDecision
  autoResolutionAttempts: number
  status: 'active' | 'resolved' | 'escalated'
}

// ============================================================================
// 多Agent事件扩展
// ============================================================================

/** 多Agent系统事件类型 */
export type MultiAgentEventType = 
  | 'agent_status_changed'
  | 'task_assigned'
  | 'task_progress_updated'
  | 'task_execution_started'
  | 'task_execution_completed'
  | 'conflict_detected'
  | 'conflict_resolved'
  | 'project_created'
  | 'project_updated'
  | 'agent_created'
  | 'agent_updated'
  | 'llm_decomposition_started'
  | 'llm_decomposition_completed'
  | 'human_intervention_required'

/** Agent状态变更事件 */
export interface AgentStatusChangedEvent {
  type: 'agent_status_changed'
  agentId: string
  agentName: string
  oldStatus: AgentStatus
  newStatus: AgentStatus
  reason?: string
}

/** 任务分配事件 */
export interface TaskAssignedEvent {
  type: 'task_assigned'
  taskId: string
  taskTitle: string
  agentId: string
  agentName: string
  projectId: string
}

/** 任务进度更新事件 */
export interface TaskProgressEvent {
  type: 'task_progress_updated'
  taskId: string
  agentId: string
  progress: number
  statusMessage?: string
}

/** 冲突检测事件 */
export interface ConflictDetectedEvent {
  type: 'conflict_detected'
  conflictId: string
  conflictType: ConflictType
  severity: ConflictSeverity
  description: string
  affectedAgents: string[]
  affectedTasks: string[]
}

/** 人工干预请求事件 */
export interface HumanInterventionRequiredEvent {
  type: 'human_intervention_required'
  conflictId: string
  reason: string
  context: Record<string, any>
  urgency: 'low' | 'medium' | 'high'
}

/** LLM分解事件 */
export interface LlmDecompositionEvent {
  type: 'llm_decomposition_started' | 'llm_decomposition_completed'
  projectId: string
  documentId: string
  tasksGenerated?: number
  reasoning?: string
}

// ============================================================================
// API 接口类型定义
// ============================================================================

/** Tauri命令参数类型 */
export interface CreateAgentParams {
  config: AgentConfig
}

export interface UpdateAgentParams {
  agentId: string
  updates: Partial<Agent>
}

export interface CreateProjectParams {
  config: ProjectConfig
  requirements?: RequirementDocument[]
}

export interface UpdateProjectParams {
  projectId: string
  updates: Partial<Project>
}

export interface CreateTaskParams {
  projectId: string
  config: TaskConfig
}

export interface AssignTaskParams {
  taskId: string
  agentId: string
}

export interface UpdateTaskStatusParams {
  taskId: string
  status: TaskStatus
  progress?: number
}

export interface ResolveConflictParams {
  conflictId: string
  decision: HumanDecision
}

/** API响应类型 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: Date
}

export interface AgentListResponse extends ApiResponse<Agent[]> {}
export interface ProjectListResponse extends ApiResponse<Project[]> {}
export interface TaskListResponse extends ApiResponse<Task[]> {}
export interface ConflictListResponse extends ApiResponse<Conflict[]> {}

// ============================================================================
// UI状态管理类型
// ============================================================================

/** 导航项目扩展 */
export type MultiAgentNavigationItem = 
  | 'messages'           // 现有：聊天对话
  | 'agents'             // 新增：Agent管理
  | 'projects'           // 新增：项目管理
  | 'tasks'              // 新增：任务监控
  | 'conflicts'          // 新增：冲突处理
  | 'calendar' 
  | 'cloud-docs' 
  | 'tables' 
  | 'video-meeting' 
  | 'workbench' 
  | 'contacts' 
  | 'ai-assistant' 
  | 'community' 
  | 'settings'           // 现有：系统设置

/** 视图状态 */
export interface ViewState {
  currentView: MultiAgentNavigationItem
  selectedAgentId: string | null
  selectedProjectId: string | null
  selectedTaskId: string | null
  selectedConflictId: string | null
}

/** 加载状态 */
export interface LoadingState {
  agents: boolean
  projects: boolean
  tasks: boolean
  conflicts: boolean
  global: boolean
}

/** 错误状态 */
export interface ErrorState {
  agents: string | null
  projects: string | null
  tasks: string | null
  conflicts: string | null
  global: string | null
}

/** 过滤器状态 */
export interface FilterState {
  agents: {
    status?: AgentStatus[]
    capabilities?: AgentCapability[]
    searchQuery?: string
  }
  projects: {
    status?: ProjectStatus[]
    assignedAgents?: string[]
    searchQuery?: string
  }
  tasks: {
    status?: TaskStatus[]
    priority?: TaskPriority[]
    assignedAgent?: string
    projectId?: string
    searchQuery?: string
  }
  conflicts: {
    type?: ConflictType[]
    severity?: ConflictSeverity[]
    status?: ('active' | 'resolved' | 'escalated')[]
    searchQuery?: string
  }
}

// ============================================================================
// 工具函数和常量
// ============================================================================

/** Agent状态颜色映射 */
export const AGENT_STATUS_COLORS = {
  idle: 'text-gray-400',
  working: 'text-green-500',
  error: 'text-red-500',
  offline: 'text-gray-300'
} as const

/** 任务状态颜色映射 */
export const TASK_STATUS_COLORS = {
  pending: 'text-gray-400',
  in_progress: 'text-blue-500',
  completed: 'text-green-500',
  failed: 'text-red-500',
  cancelled: 'text-gray-500'
} as const

/** 项目状态颜色映射 */
export const PROJECT_STATUS_COLORS = {
  planning: 'text-blue-400',
  active: 'text-green-500',
  paused: 'text-yellow-500',
  completed: 'text-green-600',
  cancelled: 'text-red-500'
} as const

/** 冲突严重程度颜色映射 */
export const CONFLICT_SEVERITY_COLORS = {
  low: 'text-green-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  critical: 'text-red-500'
} as const

/** 默认配置常量 */
export const DEFAULT_AGENT_CONFIG: Partial<AgentConfig> = {
  maxConcurrentTasks: 3,
  timeoutMinutes: 60,
  performanceSettings: {
    temperature: 0.7,
    maxTokens: 4096,
    model: 'gpt-4'
  }
}

export const DEFAULT_PROJECT_CONFIG: Partial<ProjectConfig> = {
  mainBranch: 'main',
  qualityGates: {
    testCoverage: 80,
    codeQuality: 85,
    securityScan: true
  }
}

/** 类型守卫函数 */
export const isMultiAgentEvent = (event: EventMsg): event is EventMsg & { type: MultiAgentEventType } => {
  const multiAgentTypes: MultiAgentEventType[] = [
    'agent_status_changed',
    'task_assigned',
    'task_progress_updated',
    'task_execution_started',
    'task_execution_completed',
    'conflict_detected',
    'conflict_resolved',
    'project_created',
    'project_updated',
    'agent_created',
    'agent_updated',
    'llm_decomposition_started',
    'llm_decomposition_completed',
    'human_intervention_required'
  ]
  return multiAgentTypes.includes(event.type as MultiAgentEventType)
}