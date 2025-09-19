import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { 
  Task, 
  TaskStatus, 
  ApiResponse
} from '../types/multi-agent'
import type { TaskFilters } from '../components/multi-agent/Task/TaskList'

// WebSocket消息类型
interface WebSocketMessage {
  type: 'task_status_changed' | 'task_progress_updated' | 'execution_log_added' | 'task_completed' | 'task_assigned'
  payload: any
}

// 执行日志条目
interface ExecutionLog {
  id: string
  taskId: string
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  details?: any
  sessionId?: string
}

// 任务操作结果
interface TaskActionResult {
  success: boolean
  message?: string
  error?: string
}

// 任务统计信息
interface TaskStats {
  total: number
  pending: number
  in_progress: number
  completed: number
  failed: number
  cancelled: number
  completionRate: number
  averageCompletionTime: number
}

// Hook返回类型
interface UseTaskMonitorReturn {
  // 数据状态
  tasks: Task[]
  executionLogs: Map<string, ExecutionLog[]>
  taskStats: TaskStats
  wsConnected: boolean
  loading: boolean
  error: string | null

  // 操作方法
  pauseTask: (taskId: string) => Promise<TaskActionResult>
  resumeTask: (taskId: string) => Promise<TaskActionResult>
  cancelTask: (taskId: string) => Promise<TaskActionResult>
  deleteTask: (taskId: string) => Promise<TaskActionResult>
  
  // 批量操作
  batchPauseTask: (taskIds: string[]) => Promise<TaskActionResult>
  batchResumeTask: (taskIds: string[]) => Promise<TaskActionResult>
  batchCancelTask: (taskIds: string[]) => Promise<TaskActionResult>
  batchDeleteTask: (taskIds: string[]) => Promise<TaskActionResult>

  // 数据管理
  refreshTasks: () => Promise<void>
  getTaskById: (taskId: string) => Task | undefined
  getTaskLogs: (taskId: string) => ExecutionLog[]
  clearTaskLogs: (taskId: string) => void
  
  // 过滤和搜索
  filterTasks: (filters: TaskFilters) => Task[]
  searchTasks: (query: string) => Task[]
}

// 默认WebSocket URL (可以通过环境变量配置)
const DEFAULT_WS_URL = 'ws://localhost:8080/ws/tasks'

export const useTaskMonitor = (
  wsUrl: string = DEFAULT_WS_URL,
  autoRefresh: boolean = true,
  refreshInterval: number = 30000
): UseTaskMonitorReturn => {
  // 状态管理
  const [tasks, setTasks] = useState<Task[]>([])
  const [executionLogs, setExecutionLogs] = useState<Map<string, ExecutionLog[]>>(new Map())
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
        console.log('任务监控WebSocket已连接')
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
        console.log('任务监控WebSocket连接断开')
        
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
      case 'task_status_changed':
        updateTaskStatus(message.payload.taskId, message.payload.status)
        break
      case 'task_progress_updated':
        updateTaskProgress(message.payload.taskId, message.payload.progress)
        break
      case 'execution_log_added':
        addExecutionLog(message.payload.taskId, message.payload.log)
        break
      case 'task_completed':
        handleTaskCompletion(message.payload)
        break
      case 'task_assigned':
        handleTaskAssignment(message.payload)
        break
      default:
        console.warn('未知的WebSocket消息类型:', message.type)
    }
  }, [])

  // 更新任务状态
  const updateTaskStatus = useCallback((taskId: string, status: TaskStatus) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, status, updatedAt: new Date() }
          : task
      )
    )
  }, [])

  // 更新任务进度
  const updateTaskProgress = useCallback((taskId: string, progress: number) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, progress, updatedAt: new Date() }
          : task
      )
    )
  }, [])

  // 添加执行日志
  const addExecutionLog = useCallback((taskId: string, log: ExecutionLog) => {
    setExecutionLogs(prevLogs => {
      const newLogs = new Map(prevLogs)
      const taskLogs = newLogs.get(taskId) || []
      newLogs.set(taskId, [...taskLogs, log])
      return newLogs
    })
  }, [])

  // 处理任务完成
  const handleTaskCompletion = useCallback((payload: any) => {
    const { taskId } = payload
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: 'completed', 
              endTime: new Date(),
              progress: 1,
              updatedAt: new Date()
            }
          : task
      )
    )
  }, [])

  // 处理任务分配
  const handleTaskAssignment = useCallback((payload: any) => {
    const { taskId, agent } = payload
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, assignedAgent: agent, updatedAt: new Date() }
          : task
      )
    )
  }, [])

  // 获取任务列表
  const refreshTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response: ApiResponse<Task[]> = await invoke('get_tasks')
      
      if (response.success && response.data) {
        setTasks(response.data)
      } else {
        setError(response.error || '获取任务列表失败')
      }
    } catch (err) {
      console.error('获取任务列表失败:', err)
      setError(err instanceof Error ? err.message : '获取任务列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 任务操作方法
  const pauseTask = useCallback(async (taskId: string): Promise<TaskActionResult> => {
    try {
      const response = await invoke('pause_task', { taskId }) as ApiResponse<void>
      if (response.success) {
        updateTaskStatus(taskId, 'pending')
        return { success: true, message: '任务已暂停' }
      } else {
        return { success: false, error: response.error || '暂停任务失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '暂停任务失败'
      return { success: false, error: errorMessage }
    }
  }, [updateTaskStatus])

  const resumeTask = useCallback(async (taskId: string): Promise<TaskActionResult> => {
    try {
      const response = await invoke('resume_task', { taskId }) as ApiResponse<void>
      if (response.success) {
        updateTaskStatus(taskId, 'in_progress')
        return { success: true, message: '任务已继续' }
      } else {
        return { success: false, error: response.error || '继续任务失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '继续任务失败'
      return { success: false, error: errorMessage }
    }
  }, [updateTaskStatus])

  const cancelTask = useCallback(async (taskId: string): Promise<TaskActionResult> => {
    try {
      const response = await invoke('cancel_task', { taskId }) as ApiResponse<void>
      if (response.success) {
        updateTaskStatus(taskId, 'cancelled')
        return { success: true, message: '任务已取消' }
      } else {
        return { success: false, error: response.error || '取消任务失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '取消任务失败'
      return { success: false, error: errorMessage }
    }
  }, [updateTaskStatus])

  const deleteTask = useCallback(async (taskId: string): Promise<TaskActionResult> => {
    try {
      const response = await invoke('delete_task', { taskId }) as ApiResponse<void>
      if (response.success) {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
        setExecutionLogs(prevLogs => {
          const newLogs = new Map(prevLogs)
          newLogs.delete(taskId)
          return newLogs
        })
        return { success: true, message: '任务已删除' }
      } else {
        return { success: false, error: response.error || '删除任务失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除任务失败'
      return { success: false, error: errorMessage }
    }
  }, [])

  // 批量操作方法
  const batchPauseTask = useCallback(async (taskIds: string[]): Promise<TaskActionResult> => {
    try {
      const response = await invoke('batch_pause_tasks', { taskIds }) as ApiResponse<void>
      if (response.success) {
        taskIds.forEach(id => updateTaskStatus(id, 'pending'))
        return { success: true, message: `已暂停 ${taskIds.length} 个任务` }
      } else {
        return { success: false, error: response.error || '批量暂停任务失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量暂停任务失败'
      return { success: false, error: errorMessage }
    }
  }, [updateTaskStatus])

  const batchResumeTask = useCallback(async (taskIds: string[]): Promise<TaskActionResult> => {
    try {
      const response = await invoke('batch_resume_tasks', { taskIds }) as ApiResponse<void>
      if (response.success) {
        taskIds.forEach(id => updateTaskStatus(id, 'in_progress'))
        return { success: true, message: `已继续 ${taskIds.length} 个任务` }
      } else {
        return { success: false, error: response.error || '批量继续任务失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量继续任务失败'
      return { success: false, error: errorMessage }
    }
  }, [updateTaskStatus])

  const batchCancelTask = useCallback(async (taskIds: string[]): Promise<TaskActionResult> => {
    try {
      const response = await invoke('batch_cancel_tasks', { taskIds }) as ApiResponse<void>
      if (response.success) {
        taskIds.forEach(id => updateTaskStatus(id, 'cancelled'))
        return { success: true, message: `已取消 ${taskIds.length} 个任务` }
      } else {
        return { success: false, error: response.error || '批量取消任务失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量取消任务失败'
      return { success: false, error: errorMessage }
    }
  }, [updateTaskStatus])

  const batchDeleteTask = useCallback(async (taskIds: string[]): Promise<TaskActionResult> => {
    try {
      const response = await invoke('batch_delete_tasks', { taskIds }) as ApiResponse<void>
      if (response.success) {
        setTasks(prevTasks => prevTasks.filter(task => !taskIds.includes(task.id)))
        setExecutionLogs(prevLogs => {
          const newLogs = new Map(prevLogs)
          taskIds.forEach(id => newLogs.delete(id))
          return newLogs
        })
        return { success: true, message: `已删除 ${taskIds.length} 个任务` }
      } else {
        return { success: false, error: response.error || '批量删除任务失败' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量删除任务失败'
      return { success: false, error: errorMessage }
    }
  }, [])

  // 数据管理方法
  const getTaskById = useCallback((taskId: string): Task | undefined => {
    return tasks.find(task => task.id === taskId)
  }, [tasks])

  const getTaskLogs = useCallback((taskId: string): ExecutionLog[] => {
    return executionLogs.get(taskId) || []
  }, [executionLogs])

  const clearTaskLogs = useCallback((taskId: string) => {
    setExecutionLogs(prevLogs => {
      const newLogs = new Map(prevLogs)
      newLogs.delete(taskId)
      return newLogs
    })
  }, [])

  // 过滤和搜索方法
  const filterTasks = useCallback((filters: TaskFilters): Task[] => {
    return tasks.filter(task => {
      const matchesSearch = !filters.search || 
        task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.assignedAgent?.name.toLowerCase().includes(filters.search.toLowerCase())
      
      const matchesStatus = !filters.status || 
        filters.status === 'all' || 
        task.status === filters.status
      
      const matchesAgent = !filters.agentId || 
        filters.agentId === 'all' || 
        task.assignedAgent?.id === filters.agentId
      
      const matchesPriority = !filters.priority || 
        filters.priority === 'all' || 
        task.priority === filters.priority
      
      const matchesProject = !filters.projectId || 
        filters.projectId === 'all' || 
        task.projectId === filters.projectId
      
      return matchesSearch && matchesStatus && matchesAgent && matchesPriority && matchesProject
    })
  }, [tasks])

  const searchTasks = useCallback((query: string): Task[] => {
    if (!query.trim()) return tasks
    
    const lowercaseQuery = query.toLowerCase()
    return tasks.filter(task => 
      task.title.toLowerCase().includes(lowercaseQuery) ||
      task.description.toLowerCase().includes(lowercaseQuery) ||
      task.assignedAgent?.name.toLowerCase().includes(lowercaseQuery)
    )
  }, [tasks])

  // 计算任务统计信息
  const taskStats = useMemo((): TaskStats => {
    const total = tasks.length
    const statusCounts = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    }

    let totalCompletionTime = 0
    let completedWithTime = 0

    tasks.forEach(task => {
      statusCounts[task.status]++
      
      if (task.status === 'completed' && task.startTime && task.endTime) {
        const completionTime = (new Date(task.endTime).getTime() - new Date(task.startTime).getTime()) / (1000 * 60) // 分钟
        totalCompletionTime += completionTime
        completedWithTime++
      }
    })

    const completionRate = total > 0 ? statusCounts.completed / total : 0
    const averageCompletionTime = completedWithTime > 0 ? totalCompletionTime / completedWithTime : 0

    return {
      total,
      ...statusCounts,
      completionRate,
      averageCompletionTime
    }
  }, [tasks])

  // 初始化和清理
  useEffect(() => {
    // 连接WebSocket
    connectWebSocket()
    
    // 初始加载数据
    refreshTasks()

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
  }, [connectWebSocket, refreshTasks])

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return

    refreshTimerRef.current = setInterval(refreshTasks, refreshInterval)

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [autoRefresh, refreshInterval, refreshTasks])

  return {
    // 数据状态
    tasks,
    executionLogs,
    taskStats,
    wsConnected,
    loading,
    error,

    // 操作方法
    pauseTask,
    resumeTask,
    cancelTask,
    deleteTask,
    
    // 批量操作
    batchPauseTask,
    batchResumeTask,
    batchCancelTask,
    batchDeleteTask,

    // 数据管理
    refreshTasks,
    getTaskById,
    getTaskLogs,
    clearTaskLogs,
    
    // 过滤和搜索
    filterTasks,
    searchTasks
  }
}

export default useTaskMonitor