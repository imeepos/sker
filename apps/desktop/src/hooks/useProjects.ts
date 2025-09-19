/**
 * useProjects Hook - 项目数据管理钩子
 * 提供项目的CRUD操作、状态管理和实时更新功能
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { 
  Project, 
  ProjectConfig,
  ProjectStatus, 
  RequirementDocument,
  ApiResponse
} from '../types/multi-agent'

// WebSocket消息类型
interface WebSocketMessage {
  type: 'project_created' | 'project_updated' | 'project_status_changed' | 'project_progress_updated' | 'agent_assigned'
  payload: any
}

// 项目操作结果
interface ProjectActionResult {
  success: boolean
  message?: string
  error?: string
  data?: Project
}

// 项目统计信息
interface ProjectStats {
  total: number
  planning: number
  active: number
  paused: number
  completed: number
  cancelled: number
  completionRate: number
  averageProgress: number
  totalTasks: number
  completedTasks: number
  activeTasks: number
  failedTasks: number
}

// 项目筛选条件
interface ProjectFilters {
  search?: string
  status?: ProjectStatus | 'all'
  assignedAgent?: string
  technologyStack?: string[]
}

// Hook返回类型
interface UseProjectsReturn {
  // 数据状态
  projects: Project[]
  selectedProject: Project | null
  projectStats: ProjectStats
  wsConnected: boolean
  loading: boolean
  error: string | null

  // 项目管理操作
  createProject: (config: ProjectConfig, requirements?: RequirementDocument[]) => Promise<ProjectActionResult>
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<ProjectActionResult>
  deleteProject: (projectId: string) => Promise<ProjectActionResult>
  duplicateProject: (projectId: string, newName: string) => Promise<ProjectActionResult>

  // 项目选择和导航
  selectProject: (projectId: string | null) => void
  getProjectById: (projectId: string) => Project | undefined

  // 需求文档管理
  uploadRequirements: (projectId: string, documents: RequirementDocument[]) => Promise<ProjectActionResult>
  updateRequirement: (projectId: string, documentId: string, updates: Partial<RequirementDocument>) => Promise<ProjectActionResult>
  deleteRequirement: (projectId: string, documentId: string) => Promise<ProjectActionResult>

  // Agent分配管理
  assignAgentToProject: (projectId: string, agentId: string) => Promise<ProjectActionResult>
  unassignAgentFromProject: (projectId: string, agentId: string) => Promise<ProjectActionResult>

  // 进度和状态管理
  updateProjectProgress: (projectId: string) => Promise<ProjectActionResult>
  updateProjectStatus: (projectId: string, status: ProjectStatus) => Promise<ProjectActionResult>

  // 数据刷新和搜索
  refreshProjects: () => Promise<void>
  filterProjects: (filters: ProjectFilters) => Project[]
  searchProjects: (query: string) => Project[]

  // 批量操作
  batchUpdateStatus: (projectIds: string[], status: ProjectStatus) => Promise<ProjectActionResult>
  batchDelete: (projectIds: string[]) => Promise<ProjectActionResult>
}

// 默认WebSocket URL
const DEFAULT_WS_URL = 'ws://localhost:8080/ws/projects'

export const useProjects = (
  wsUrl: string = DEFAULT_WS_URL,
  autoRefresh: boolean = true,
  refreshInterval: number = 30000
): UseProjectsReturn => {
  // 状态管理
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // WebSocket引用
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  // 自动刷新定时器
  const refreshTimerRef = useRef<number | null>(null)

  // WebSocket连接管理
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setWsConnected(true)
        setError(null)
        reconnectAttempts.current = 0
        console.log('项目管理WebSocket已连接')
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          handleWebSocketMessage(message)
        } catch (err) {
          console.error('WebSocket消息解析失败:', err)
        }
      }

      ws.onclose = () => {
        setWsConnected(false)
        console.log('项目管理WebSocket连接断开')
        
        // 重连逻辑
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connectWebSocket()
          }, delay)
        } else {
          setError('WebSocket连接失败，请检查网络连接')
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket错误:', error)
        setError('WebSocket连接发生错误')
      }
    } catch (err) {
      console.error('WebSocket连接失败:', err)
      setError('无法建立WebSocket连接')
    }
  }, [wsUrl])

  // 处理WebSocket消息
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'project_created':
        addProject(message.payload.project)
        break
      case 'project_updated':
        updateProjectLocal(message.payload.projectId, message.payload.updates)
        break
      case 'project_status_changed':
        updateProjectStatus(message.payload.projectId, message.payload.status)
        break
      case 'project_progress_updated':
        updateProjectProgressLocal(message.payload.projectId, message.payload.progress)
        break
      case 'agent_assigned':
        handleAgentAssignment(message.payload)
        break
      default:
        console.warn('未知的WebSocket消息类型:', message.type)
    }
  }, [])

  // 本地项目状态更新方法
  const addProject = useCallback((project: Project) => {
    setProjects(prevProjects => [...prevProjects, project])
  }, [])

  const updateProjectLocal = useCallback((projectId: string, updates: Partial<Project>) => {
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === projectId 
          ? { ...project, ...updates, updatedAt: new Date() }
          : project
      )
    )
    
    // 更新选中的项目
    setSelectedProject(prev => 
      prev?.id === projectId 
        ? { ...prev, ...updates, updatedAt: new Date() }
        : prev
    )
  }, [])

  const updateProjectStatusLocal = useCallback((projectId: string, status: ProjectStatus) => {
    updateProjectLocal(projectId, { status })
  }, [updateProjectLocal])

  const updateProjectProgressLocal = useCallback((projectId: string, progress: number) => {
    updateProjectLocal(projectId, { progress })
  }, [updateProjectLocal])

  const handleAgentAssignment = useCallback((payload: any) => {
    const { projectId, agent } = payload
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === projectId 
          ? { 
              ...project, 
              assignedAgents: [...project.assignedAgents, agent],
              updatedAt: new Date()
            }
          : project
      )
    )
  }, [])

  // 获取项目列表
  const refreshProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response: ApiResponse<Project[]> = await invoke('get_projects')
      
      if (response.success && response.data) {
        setProjects(response.data)
      } else {
        setError(response.error || '获取项目列表失败')
      }
    } catch (err) {
      console.error('获取项目列表失败:', err)
      setError(err instanceof Error ? err.message : '获取项目列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 项目管理操作
  const createProject = useCallback(async (
    config: ProjectConfig, 
    requirements: RequirementDocument[] = []
  ): Promise<ProjectActionResult> => {
    try {
      setLoading(true)
      const params = { config, requirements }
      const response: ApiResponse<Project> = await invoke('create_project', params)
      
      if (response.success && response.data) {
        addProject(response.data)
        return { 
          success: true, 
          message: '项目创建成功',
          data: response.data
        }
      } else {
        return { success: false, error: response.error || '创建项目失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建项目失败'
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [addProject])

  const updateProject = useCallback(async (
    projectId: string, 
    updates: Partial<Project>
  ): Promise<ProjectActionResult> => {
    try {
      const params = { projectId, updates }
      const response: ApiResponse<Project> = await invoke('update_project', params)
      
      if (response.success && response.data) {
        updateProjectLocal(projectId, updates)
        return { 
          success: true, 
          message: '项目更新成功',
          data: response.data
        }
      } else {
        return { success: false, error: response.error || '更新项目失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新项目失败'
      return { success: false, error: errorMessage }
    }
  }, [updateProjectLocal])

  const deleteProject = useCallback(async (projectId: string): Promise<ProjectActionResult> => {
    try {
      const response: ApiResponse<void> = await invoke('delete_project', { projectId })
      
      if (response.success) {
        setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId))
        if (selectedProject?.id === projectId) {
          setSelectedProject(null)
        }
        return { success: true, message: '项目删除成功' }
      } else {
        return { success: false, error: response.error || '删除项目失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除项目失败'
      return { success: false, error: errorMessage }
    }
  }, [selectedProject])

  const duplicateProject = useCallback(async (
    projectId: string, 
    newName: string
  ): Promise<ProjectActionResult> => {
    try {
      const response: ApiResponse<Project> = await invoke('duplicate_project', { 
        projectId, 
        newName 
      })
      
      if (response.success && response.data) {
        addProject(response.data)
        return { 
          success: true, 
          message: '项目复制成功',
          data: response.data
        }
      } else {
        return { success: false, error: response.error || '复制项目失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '复制项目失败'
      return { success: false, error: errorMessage }
    }
  }, [addProject])

  // 项目选择和导航
  const selectProject = useCallback((projectId: string | null) => {
    if (projectId === null) {
      setSelectedProject(null)
    } else {
      const project = projects.find(p => p.id === projectId)
      setSelectedProject(project || null)
    }
  }, [projects])

  const getProjectById = useCallback((projectId: string): Project | undefined => {
    return projects.find(project => project.id === projectId)
  }, [projects])

  // 需求文档管理
  const uploadRequirements = useCallback(async (
    projectId: string, 
    documents: RequirementDocument[]
  ): Promise<ProjectActionResult> => {
    try {
      const response: ApiResponse<RequirementDocument[]> = await invoke('upload_requirements', {
        projectId,
        documents
      })
      
      if (response.success && response.data) {
        updateProjectLocal(projectId, { 
          requirements: response.data,
          updatedAt: new Date()
        })
        return { success: true, message: '需求文档上传成功' }
      } else {
        return { success: false, error: response.error || '上传需求文档失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传需求文档失败'
      return { success: false, error: errorMessage }
    }
  }, [updateProjectLocal])

  const updateRequirement = useCallback(async (
    projectId: string, 
    documentId: string, 
    updates: Partial<RequirementDocument>
  ): Promise<ProjectActionResult> => {
    try {
      const response: ApiResponse<RequirementDocument> = await invoke('update_requirement', {
        projectId,
        documentId,
        updates
      })
      
      if (response.success && response.data) {
        const project = projects.find(p => p.id === projectId)
        if (project) {
          const updatedRequirements = project.requirements.map(req =>
            req.id === documentId ? { ...req, ...updates } : req
          )
          updateProjectLocal(projectId, { requirements: updatedRequirements })
        }
        return { success: true, message: '需求文档更新成功' }
      } else {
        return { success: false, error: response.error || '更新需求文档失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新需求文档失败'
      return { success: false, error: errorMessage }
    }
  }, [projects, updateProjectLocal])

  const deleteRequirement = useCallback(async (
    projectId: string, 
    documentId: string
  ): Promise<ProjectActionResult> => {
    try {
      const response: ApiResponse<void> = await invoke('delete_requirement', {
        projectId,
        documentId
      })
      
      if (response.success) {
        const project = projects.find(p => p.id === projectId)
        if (project) {
          const updatedRequirements = project.requirements.filter(req => req.id !== documentId)
          updateProjectLocal(projectId, { requirements: updatedRequirements })
        }
        return { success: true, message: '需求文档删除成功' }
      } else {
        return { success: false, error: response.error || '删除需求文档失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除需求文档失败'
      return { success: false, error: errorMessage }
    }
  }, [projects, updateProjectLocal])

  // Agent分配管理
  const assignAgentToProject = useCallback(async (
    projectId: string, 
    agentId: string
  ): Promise<ProjectActionResult> => {
    try {
      const response: ApiResponse<void> = await invoke('assign_agent_to_project', {
        projectId,
        agentId
      })
      
      if (response.success) {
        return { success: true, message: 'Agent分配成功' }
      } else {
        return { success: false, error: response.error || 'Agent分配失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Agent分配失败'
      return { success: false, error: errorMessage }
    }
  }, [])

  const unassignAgentFromProject = useCallback(async (
    projectId: string, 
    agentId: string
  ): Promise<ProjectActionResult> => {
    try {
      const response: ApiResponse<void> = await invoke('unassign_agent_from_project', {
        projectId,
        agentId
      })
      
      if (response.success) {
        const project = projects.find(p => p.id === projectId)
        if (project) {
          const updatedAgents = project.assignedAgents.filter(agent => agent.id !== agentId)
          updateProjectLocal(projectId, { assignedAgents: updatedAgents })
        }
        return { success: true, message: 'Agent移除成功' }
      } else {
        return { success: false, error: response.error || 'Agent移除失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Agent移除失败'
      return { success: false, error: errorMessage }
    }
  }, [projects, updateProjectLocal])

  // 进度和状态管理
  const updateProjectProgress = useCallback(async (projectId: string): Promise<ProjectActionResult> => {
    try {
      const response: ApiResponse<{ progress: number }> = await invoke('calculate_project_progress', {
        projectId
      })
      
      if (response.success && response.data) {
        updateProjectProgressLocal(projectId, response.data.progress)
        return { success: true, message: '项目进度更新成功' }
      } else {
        return { success: false, error: response.error || '更新项目进度失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新项目进度失败'
      return { success: false, error: errorMessage }
    }
  }, [updateProjectProgressLocal])

  const updateProjectStatus = useCallback(async (
    projectId: string, 
    status: ProjectStatus
  ): Promise<ProjectActionResult> => {
    try {
      const response: ApiResponse<void> = await invoke('update_project_status', {
        projectId,
        status
      })
      
      if (response.success) {
        updateProjectStatusLocal(projectId, status)
        return { success: true, message: '项目状态更新成功' }
      } else {
        return { success: false, error: response.error || '更新项目状态失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新项目状态失败'
      return { success: false, error: errorMessage }
    }
  }, [updateProjectStatusLocal])

  // 过滤和搜索方法
  const filterProjects = useCallback((filters: ProjectFilters): Project[] => {
    return projects.filter(project => {
      const matchesSearch = !filters.search || 
        project.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        project.description?.toLowerCase().includes(filters.search.toLowerCase())
      
      const matchesStatus = !filters.status || 
        filters.status === 'all' || 
        project.status === filters.status
      
      const matchesAgent = !filters.assignedAgent || 
        filters.assignedAgent === 'all' || 
        project.assignedAgents.some(agent => agent.id === filters.assignedAgent)
      
      const matchesTechnology = !filters.technologyStack?.length ||
        filters.technologyStack.some(tech => 
          project.technologyStack.includes(tech)
        )
      
      return matchesSearch && matchesStatus && matchesAgent && matchesTechnology
    })
  }, [projects])

  const searchProjects = useCallback((query: string): Project[] => {
    if (!query.trim()) return projects
    
    const lowercaseQuery = query.toLowerCase()
    return projects.filter(project => 
      project.name.toLowerCase().includes(lowercaseQuery) ||
      project.description?.toLowerCase().includes(lowercaseQuery) ||
      project.technologyStack.some(tech => 
        tech.toLowerCase().includes(lowercaseQuery)
      )
    )
  }, [projects])

  // 批量操作
  const batchUpdateStatus = useCallback(async (
    projectIds: string[], 
    status: ProjectStatus
  ): Promise<ProjectActionResult> => {
    try {
      const response: ApiResponse<void> = await invoke('batch_update_project_status', {
        projectIds,
        status
      })
      
      if (response.success) {
        projectIds.forEach(id => updateProjectStatusLocal(id, status))
        return { success: true, message: `已更新 ${projectIds.length} 个项目的状态` }
      } else {
        return { success: false, error: response.error || '批量更新状态失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量更新状态失败'
      return { success: false, error: errorMessage }
    }
  }, [updateProjectStatusLocal])

  const batchDelete = useCallback(async (projectIds: string[]): Promise<ProjectActionResult> => {
    try {
      const response: ApiResponse<void> = await invoke('batch_delete_projects', {
        projectIds
      })
      
      if (response.success) {
        setProjects(prevProjects => 
          prevProjects.filter(project => !projectIds.includes(project.id))
        )
        if (selectedProject && projectIds.includes(selectedProject.id)) {
          setSelectedProject(null)
        }
        return { success: true, message: `已删除 ${projectIds.length} 个项目` }
      } else {
        return { success: false, error: response.error || '批量删除失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量删除失败'
      return { success: false, error: errorMessage }
    }
  }, [selectedProject])

  // 计算项目统计信息
  const projectStats = useMemo((): ProjectStats => {
    const total = projects.length
    const statusCounts = {
      planning: 0,
      active: 0,
      paused: 0,
      completed: 0,
      cancelled: 0
    }

    let totalProgress = 0
    let totalTasks = 0
    let completedTasks = 0
    let activeTasks = 0
    let failedTasks = 0

    projects.forEach(project => {
      statusCounts[project.status]++
      totalProgress += project.progress
      totalTasks += project.totalTasks
      completedTasks += project.completedTasks
      activeTasks += project.activeTasks
      failedTasks += project.failedTasks
    })

    const completionRate = total > 0 ? statusCounts.completed / total : 0
    const averageProgress = total > 0 ? totalProgress / total : 0

    return {
      total,
      ...statusCounts,
      completionRate,
      averageProgress,
      totalTasks,
      completedTasks,
      activeTasks,
      failedTasks
    }
  }, [projects])

  // 初始化和清理
  useEffect(() => {
    // 连接WebSocket
    connectWebSocket()
    
    // 初始加载数据
    refreshProjects()

    return () => {
      // 清理WebSocket连接
      if (wsRef.current) {
        wsRef.current.close()
      }
      
      // 清理重连定时器
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      
      // 清理刷新定时器
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [connectWebSocket, refreshProjects])

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return

    refreshTimerRef.current = setInterval(refreshProjects, refreshInterval)

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [autoRefresh, refreshInterval, refreshProjects])

  return {
    // 数据状态
    projects,
    selectedProject,
    projectStats,
    wsConnected,
    loading,
    error,

    // 项目管理操作
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,

    // 项目选择和导航
    selectProject,
    getProjectById,

    // 需求文档管理
    uploadRequirements,
    updateRequirement,
    deleteRequirement,

    // Agent分配管理
    assignAgentToProject,
    unassignAgentFromProject,

    // 进度和状态管理
    updateProjectProgress,
    updateProjectStatus,

    // 数据刷新和搜索
    refreshProjects,
    filterProjects,
    searchProjects,

    // 批量操作
    batchUpdateStatus,
    batchDelete
  }
}

export default useProjects