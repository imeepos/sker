import React, { useState, useMemo, useCallback } from 'react'
import { 
  Search, 
  SortAsc, 
  SortDesc,
  CheckSquare,
  Square,
  Pause,
  Play,
  Square as StopIcon,
  Trash2,
  MoreVertical
} from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  ScrollArea
} from '../../ui'
import { cn } from '../../../lib/utils'
import TaskCard, { TaskAction } from './TaskCard'
import type { Task, TaskStatus, TaskPriority, Agent } from '../../../types/multi-agent'

// 过滤器类型
export interface TaskFilters {
  search?: string
  status?: TaskStatus | 'all'
  priority?: TaskPriority | 'all'
  agentId?: string | 'all'
  projectId?: string | 'all'
}

// 排序选项
export type SortOption = 'created_at' | 'updated_at' | 'priority' | 'progress' | 'title'
export type SortDirection = 'asc' | 'desc'

// 批量操作类型
export type BatchAction = 'pause' | 'resume' | 'cancel' | 'delete'

// 组件属性
interface TaskListProps {
  tasks: Task[]
  agents?: Agent[]
  selectedTaskId?: string
  onTaskSelect?: (taskId: string) => void
  filters?: TaskFilters
  onFiltersChange?: (filters: TaskFilters) => void
  onBatchAction?: (action: BatchAction, taskIds: string[]) => Promise<void>
  onTaskAction?: (action: TaskAction, taskId: string) => Promise<void>
  loading?: boolean
  showFilters?: boolean
  showBatchActions?: boolean
  enableVirtualScrolling?: boolean
}

// 排序函数
const sortTasks = (tasks: Task[], sortBy: SortOption, direction: SortDirection): Task[] => {
  return [...tasks].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortBy) {
      case 'created_at':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      case 'updated_at':
        aValue = new Date(a.updatedAt).getTime()
        bValue = new Date(b.updatedAt).getTime()
        break
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        aValue = priorityOrder[a.priority]
        bValue = priorityOrder[b.priority]
        break
      case 'progress':
        aValue = a.progress
        bValue = b.progress
        break
      case 'title':
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        break
      default:
        return 0
    }

    if (direction === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  agents = [],
  selectedTaskId,
  onTaskSelect,
  filters = {},
  onFiltersChange,
  onBatchAction,
  onTaskAction,
  loading = false,
  showFilters = true,
  showBatchActions = true,
  enableVirtualScrolling = false
}) => {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<SortOption>('updated_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showBatchMenu, setShowBatchMenu] = useState(false)

  // 过滤和排序任务
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
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

    return sortTasks(filtered, sortBy, sortDirection)
  }, [tasks, filters, sortBy, sortDirection])

  // 更新过滤器
  const updateFilter = useCallback((key: keyof TaskFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    onFiltersChange?.(newFilters)
  }, [filters, onFiltersChange])

  // 处理任务选择
  const handleTaskSelect = useCallback((taskId: string) => {
    onTaskSelect?.(taskId)
  }, [onTaskSelect])

  // 处理批量选择
  const handleBatchSelect = useCallback((taskId: string, selected: boolean) => {
    const newSelection = new Set(selectedTasks)
    if (selected) {
      newSelection.add(taskId)
    } else {
      newSelection.delete(taskId)
    }
    setSelectedTasks(newSelection)
  }, [selectedTasks])

  // 全选/取消全选
  const handleSelectAll = useCallback(() => {
    if (selectedTasks.size === filteredAndSortedTasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(filteredAndSortedTasks.map(t => t.id)))
    }
  }, [selectedTasks.size, filteredAndSortedTasks])

  // 执行批量操作
  const handleBatchAction = useCallback(async (action: BatchAction) => {
    if (selectedTasks.size === 0) return
    
    try {
      await onBatchAction?.(action, Array.from(selectedTasks))
      setSelectedTasks(new Set()) // 清空选择
      setShowBatchMenu(false)
    } catch (error) {
      console.error('批量操作失败:', error)
    }
  }, [selectedTasks, onBatchAction])

  // 处理排序
  const handleSort = useCallback((option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(option)
      setSortDirection('desc')
    }
  }, [sortBy])

  // 状态统计
  const statusStats = useMemo(() => {
    const stats = { pending: 0, in_progress: 0, completed: 0, failed: 0, cancelled: 0 }
    filteredAndSortedTasks.forEach(task => {
      stats[task.status]++
    })
    return stats
  }, [filteredAndSortedTasks])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            <span className="ml-2">加载任务列表...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="task-list">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            任务列表
            <Badge variant="outline" className="ml-2">
              {filteredAndSortedTasks.length}
            </Badge>
          </CardTitle>
          
          {showBatchActions && selectedTasks.size > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                已选择 {selectedTasks.size} 个任务
              </Badge>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBatchMenu(!showBatchMenu)}
                >
                  <MoreVertical className="w-4 h-4" />
                  批量操作
                </Button>
                {showBatchMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border rounded-md shadow-lg z-50 min-w-[120px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleBatchAction('pause')}
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      暂停
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleBatchAction('resume')}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      继续
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleBatchAction('cancel')}
                    >
                      <StopIcon className="w-4 h-4 mr-2" />
                      取消
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-red-600"
                      onClick={() => handleBatchAction('delete')}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      删除
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 状态统计 */}
        <div className="flex gap-2 mt-2">
          <Badge variant="outline" className="text-gray-600">
            待处理: {statusStats.pending}
          </Badge>
          <Badge variant="outline" className="text-blue-600">
            进行中: {statusStats.in_progress}
          </Badge>
          <Badge variant="outline" className="text-green-600">
            已完成: {statusStats.completed}
          </Badge>
          <Badge variant="outline" className="text-red-600">
            失败: {statusStats.failed}
          </Badge>
        </div>
      </CardHeader>

      {/* 过滤和搜索 */}
      {showFilters && (
        <CardContent className="border-b pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 搜索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索任务..."
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 状态过滤 */}
            <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="in_progress">进行中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>

            {/* 优先级过滤 */}
            <Select value={filters.priority || 'all'} onValueChange={(value) => updateFilter('priority', value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择优先级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部优先级</SelectItem>
                <SelectItem value="urgent">紧急</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>

            {/* Agent过滤 */}
            <Select value={filters.agentId || 'all'} onValueChange={(value) => updateFilter('agentId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部Agent</SelectItem>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 排序 */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">排序:</span>
            <Button
              variant={sortBy === 'updated_at' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('updated_at')}
              className="gap-1"
            >
              更新时间
              {sortBy === 'updated_at' && (
                sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
              )}
            </Button>
            <Button
              variant={sortBy === 'priority' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('priority')}
              className="gap-1"
            >
              优先级
              {sortBy === 'priority' && (
                sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
              )}
            </Button>
            <Button
              variant={sortBy === 'progress' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('progress')}
              className="gap-1"
            >
              进度
              {sortBy === 'progress' && (
                sortDirection === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
              )}
            </Button>
          </div>

          {/* 批量选择 */}
          {showBatchActions && (
            <div className="flex items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="gap-1"
              >
                {selectedTasks.size === filteredAndSortedTasks.length ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {selectedTasks.size === filteredAndSortedTasks.length ? '取消全选' : '全选'}
              </Button>
            </div>
          )}
        </CardContent>
      )}

      {/* 任务列表 */}
      <CardContent className="p-0">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <CheckSquare className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg">暂无任务</p>
            <p className="text-sm">根据当前筛选条件未找到任务</p>
          </div>
        ) : (
          <ScrollArea className={cn("p-4", enableVirtualScrolling && "h-[600px]")}>
            <div className="space-y-4">
              {filteredAndSortedTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3">
                  {showBatchActions && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-4 p-1 h-6 w-6"
                      onClick={() => handleBatchSelect(task.id, !selectedTasks.has(task.id))}
                    >
                      {selectedTasks.has(task.id) ? (
                        <CheckSquare className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  <div className="flex-1">
                    <TaskCard
                      task={task}
                      isSelected={selectedTaskId === task.id}
                      onClick={() => handleTaskSelect(task.id)}
                      onAction={onTaskAction}
                      showActions={true}
                      realTimeUpdate={task.status === 'in_progress'}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

export default TaskList