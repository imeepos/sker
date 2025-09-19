/**
 * 任务列表组件 - 占位符实现
 */

import React from 'react'
import type { Task } from '../../../types/multi-agent'

interface TaskListProps {
  tasks: Task[]
  selectedTaskId?: string | null
  onTaskSelect?: (taskId: string) => void
  onCreateTask?: () => void
  searchPlaceholder?: string
  className?: string
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  selectedTaskId,
  onTaskSelect,
  onCreateTask,
  searchPlaceholder = "搜索任务...",
  className
}) => {
  return (
    <div className={`h-full flex flex-col ${className || ''}`}>
      {/* 头部 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">任务监控</h2>
          {onCreateTask && (
            <button 
              onClick={onCreateTask}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              创建任务
            </button>
          )}
        </div>
        <input
          type="text"
          placeholder={searchPlaceholder}
          className="w-full px-3 py-2 border rounded-md text-sm"
        />
      </div>
      
      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto">
        {tasks.length > 0 ? (
          <div className="p-2 space-y-2">
            {tasks.map(task => (
              <div
                key={task.id}
                onClick={() => onTaskSelect?.(task.id)}
                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                  selectedTaskId === task.id ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{task.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded ${
                    task.status === 'completed' ? 'bg-green-100 text-green-700' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    task.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {task.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {task.description}
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>进度</span>
                    <span>{Math.round(task.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full transition-all"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center text-xs text-gray-500 mt-2">
                  <span>优先级: {task.priority}</span>
                  <span className="ml-4">
                    Agent: {task.assignedAgent?.name || '未分配'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p>暂无任务</p>
              <p className="text-sm mt-1">点击"创建任务"开始</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}