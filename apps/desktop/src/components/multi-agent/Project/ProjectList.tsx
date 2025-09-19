/**
 * ProjectList组件 - 项目列表容器组件
 * 支持搜索、筛选、排序和不同视图模式
 */

import React, { memo, useMemo, useCallback, useState } from 'react'
import type { Project, ProjectStatus } from '../../../types/multi-agent'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/input'
import { ProjectCard } from './ProjectCard'

interface ProjectListProps {
  projects: Project[]
  selectedProjectId?: string | null
  onProjectSelect?: (projectId: string) => void
  onCreateProject?: () => void
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
  className?: string
}

type SortBy = 'name' | 'created' | 'updated' | 'progress'

export const ProjectList: React.FC<ProjectListProps> = memo(({
  projects,
  selectedProjectId,
  onProjectSelect,
  onCreateProject,
  viewMode = 'grid',
  onViewModeChange,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortBy>('updated')

  // 处理项目点击事件
  const handleProjectClick = useCallback((projectId: string) => {
    onProjectSelect?.(projectId)
  }, [onProjectSelect])
  
  // 处理创建项目事件
  const handleCreateClick = useCallback(() => {
    onCreateProject?.()
  }, [onCreateProject])
  
  // 筛选和排序逻辑
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus
      return matchesSearch && matchesStatus
    })
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': 
          return a.name.localeCompare(b.name)
        case 'created': 
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'progress': 
          return b.progress - a.progress
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })
  }, [projects, searchQuery, selectedStatus, sortBy])

  // 统计信息
  const stats = useMemo(() => {
    const total = projects.length
    const active = projects.filter(p => p.status === 'active').length
    const completed = projects.filter(p => p.status === 'completed').length
    const planning = projects.filter(p => p.status === 'planning').length
    
    return { total, active, completed, planning }
  }, [projects])

  const statusOptions: Array<{ value: ProjectStatus | 'all'; label: string }> = [
    { value: 'all', label: '全部' },
    { value: 'active', label: '进行中' },
    { value: 'planning', label: '规划中' },
    { value: 'paused', label: '已暂停' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' }
  ]

  const sortOptions: Array<{ value: SortBy; label: string }> = [
    { value: 'updated', label: '最近更新' },
    { value: 'created', label: '创建时间' },
    { value: 'name', label: '项目名称' },
    { value: 'progress', label: '完成进度' }
  ]

  return (
    <div className={`h-full flex flex-col bg-gray-50 ${className}`}>
      {/* 头部 */}
      <div className="bg-white border-b p-4 space-y-4">
        {/* 标题和操作按钮 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">项目管理</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              <span>总计 {stats.total}</span>
              <span className="text-green-600">已完成 {stats.completed}</span>
              <span className="text-blue-600">进行中 {stats.active}</span>
              <span className="text-orange-600">规划中 {stats.planning}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* 视图切换按钮 */}
            {onViewModeChange && (
              <div className="flex border border-gray-200 rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onViewModeChange('grid')}
                  className="rounded-r-none border-r-0"
                >
                  网格
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onViewModeChange('list')}
                  className="rounded-l-none"
                >
                  列表
                </Button>
              </div>
            )}
            
            {/* 创建项目按钮 */}
            {onCreateProject && (
              <Button onClick={handleCreateClick}>
                创建项目
              </Button>
            )}
          </div>
        </div>
        
        {/* 搜索和筛选 */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="搜索项目名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as ProjectStatus | 'all')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* 项目列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredAndSortedProjects.length > 0 ? (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-3'
          }>
            {filteredAndSortedProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleProjectClick(project.id)}
                isSelected={selectedProjectId === project.id}
                showProgress={true}
                showTeam={true}
                className={viewMode === 'list' ? 'max-w-none' : ''}
              />
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">
                {searchQuery || selectedStatus !== 'all' ? '未找到匹配的项目' : '暂无项目'}
              </p>
              <p className="text-sm mb-4">
                {searchQuery || selectedStatus !== 'all' 
                  ? '尝试调整搜索条件或筛选器' 
                  : '创建您的第一个项目开始多Agent协同开发'
                }
              </p>
              {onCreateProject && !searchQuery && selectedStatus === 'all' && (
                <Button onClick={handleCreateClick}>
                  创建项目
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

ProjectList.displayName = 'ProjectList'