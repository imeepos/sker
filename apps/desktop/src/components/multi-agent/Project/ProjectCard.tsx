/**
 * ProjectCard组件 - 项目状态展示卡片
 * 显示项目基本信息、进度、参与Agent和技术栈
 */

import React, { memo } from 'react'
import type { Project, ProjectStatus } from '../../../types/multi-agent'

interface ProjectCardProps {
  project: Project
  onClick?: () => void
  isSelected?: boolean
  showProgress?: boolean
  showTeam?: boolean
  className?: string
}

// 状态颜色映射
const getStatusColor = (status: ProjectStatus) => {
  const colorMap = {
    planning: 'bg-blue-100 text-blue-700 border-blue-200',
    active: 'bg-green-100 text-green-700 border-green-200', 
    paused: 'bg-orange-100 text-orange-700 border-orange-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200'
  }
  return colorMap[status] || 'bg-gray-100 text-gray-700 border-gray-200'
}

// 状态文本映射
const getStatusText = (status: ProjectStatus) => {
  const statusMap = {
    planning: '规划中',
    active: '进行中',
    paused: '已暂停',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

// Agent头像组件
const AgentAvatarGroup: React.FC<{ agents: Project['assignedAgents']; maxShow?: number }> = ({ 
  agents, 
  maxShow = 4 
}) => {
  const displayAgents = agents.slice(0, maxShow)
  const remainingCount = agents.length - maxShow

  if (agents.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        暂无分配Agent
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-1">
      <div className="flex -space-x-2">
        {displayAgents.map((agent) => (
          <div
            key={agent.id}
            className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium border-2 border-white"
            title={agent.name}
          >
            {agent.name.charAt(0).toUpperCase()}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs font-medium border-2 border-white">
            +{remainingCount}
          </div>
        )}
      </div>
      <span className="text-sm text-gray-600 ml-2">
        {agents.length} 个Agent
      </span>
    </div>
  )
}

// 技术栈标签组件
const TechStackTags: React.FC<{ techStack: string[]; maxShow?: number }> = ({ 
  techStack, 
  maxShow = 3 
}) => {
  const displayTechs = techStack.slice(0, maxShow)
  const remainingCount = techStack.length - maxShow

  if (techStack.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1">
      {displayTechs.map((tech, index) => (
        <span 
          key={index}
          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border"
        >
          {tech}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded border">
          +{remainingCount}
        </span>
      )}
    </div>
  )
}

export const ProjectCard: React.FC<ProjectCardProps> = memo(({
  project,
  onClick,
  isSelected = false,
  showProgress = true,
  showTeam = true,
  className = ''
}) => {
  const progressPercentage = Math.round(project.progress * 100)

  return (
    <div
      className={`
        bg-white border rounded-lg p-4 cursor-pointer transition-all duration-200
        hover:shadow-md hover:border-blue-300 hover:bg-blue-50/30
        ${isSelected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200'}
        ${className}
      `}
      onClick={onClick}
    >
      {/* 项目头部信息 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate" title={project.name}>
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2" title={project.description}>
              {project.description}
            </p>
          )}
        </div>
        <div className={`px-2 py-1 text-xs rounded border font-medium ${getStatusColor(project.status)}`}>
          {getStatusText(project.status)}
        </div>
      </div>

      {/* 进度条 */}
      {showProgress && (
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">进度</span>
            <span className="font-medium text-gray-900">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* 任务统计 */}
      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
        <div className="flex items-center space-x-4">
          <span>
            总任务: <span className="font-medium text-gray-900">{project.totalTasks}</span>
          </span>
          <span className="text-green-600">
            已完成: <span className="font-medium">{project.completedTasks}</span>
          </span>
          {project.activeTasks > 0 && (
            <span className="text-blue-600">
              进行中: <span className="font-medium">{project.activeTasks}</span>
            </span>
          )}
          {project.failedTasks > 0 && (
            <span className="text-red-600">
              失败: <span className="font-medium">{project.failedTasks}</span>
            </span>
          )}
        </div>
      </div>

      {/* 参与Agent头像组 */}
      {showTeam && (
        <div className="mb-3">
          <AgentAvatarGroup agents={project.assignedAgents} />
        </div>
      )}

      {/* 技术栈标签 */}
      <div className="mb-2">
        <TechStackTags techStack={project.technologyStack} />
      </div>

      {/* 底部信息 */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
        <span>创建时间: {project.createdAt.toLocaleDateString()}</span>
        <span>更新时间: {project.updatedAt.toLocaleDateString()}</span>
      </div>
    </div>
  )
})

ProjectCard.displayName = 'ProjectCard'