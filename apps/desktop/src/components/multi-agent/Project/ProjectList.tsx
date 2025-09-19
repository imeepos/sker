/**
 * 项目列表组件 - 占位符实现
 */

import React, { memo, useMemo, useCallback } from 'react'
import type { Project } from '../../../types/multi-agent'

interface ProjectListProps {
  projects: Project[]
  selectedProjectId?: string | null
  onProjectSelect?: (projectId: string) => void
  onCreateProject?: () => void
  searchPlaceholder?: string
  className?: string
}

export const ProjectList: React.FC<ProjectListProps> = memo(({
  projects,
  selectedProjectId,
  onProjectSelect,
  onCreateProject,
  searchPlaceholder = "搜索项目...",
  className
}) => {
  // 处理项目点击事件
  const handleProjectClick = useCallback((projectId: string) => {
    onProjectSelect?.(projectId)
  }, [onProjectSelect])
  
  // 处理创建项目事件
  const handleCreateClick = useCallback(() => {
    onCreateProject?.()
  }, [onCreateProject])
  
  // 按状态和更新时间排序项目
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      // 按状态优先级排序：active > planning > paused > completed > cancelled
      const statusOrder = { 
        active: 0, 
        planning: 1, 
        paused: 2, 
        completed: 3, 
        cancelled: 4 
      }
      const aOrder = statusOrder[a.status] ?? 5
      const bOrder = statusOrder[b.status] ?? 5
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }
      
      // 同状态下按更新时间排序（新的在前）
      return b.updatedAt.getTime() - a.updatedAt.getTime()
    })
  }, [projects])
  
  return (
    <div className={`h-full flex flex-col ${className || ''}`}>
      {/* 头部 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">项目管理</h2>
          {onCreateProject && (
            <button 
              onClick={handleCreateClick}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              创建项目
            </button>
          )}
        </div>
        <input
          type="text"
          placeholder={searchPlaceholder}
          className="w-full px-3 py-2 border rounded-md text-sm"
        />
      </div>
      
      {/* 项目列表 */}
      <div className="flex-1 overflow-y-auto">
        {projects.length > 0 ? (
          <div className="p-2 space-y-2">
            {sortedProjects.map(project => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                  selectedProjectId === project.id ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{project.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded ${
                    project.status === 'active' ? 'bg-green-100 text-green-700' :
                    project.status === 'planning' ? 'bg-blue-100 text-blue-700' :
                    project.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {project.description}
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>进度</span>
                    <span>{Math.round(project.progress * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full transition-all"
                      style={{ width: `${project.progress * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center text-xs text-gray-500 mt-2">
                  <span>任务: {project.completedTasks}/{project.totalTasks}</span>
                  <span className="ml-4">Agent: {project.assignedAgents.length}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p>暂无项目</p>
              <p className="text-sm mt-1">点击"创建项目"开始</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

ProjectList.displayName = 'ProjectList'