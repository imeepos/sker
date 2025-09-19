/**
 * 项目详情组件 - 占位符实现
 */

import React from 'react'
import type { Project } from '../../../types/multi-agent'

interface ProjectDetailsProps {
  project: Project
  onEdit?: () => void
  className?: string
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  project,
  onEdit,
  className
}) => {
  return (
    <div className={`h-full overflow-y-auto ${className || ''}`}>
      {/* 头部 */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">{project.name}</h1>
            <p className="text-sm text-gray-600 mt-1">{project.description}</p>
          </div>
          
          <div className="flex gap-2">
            {onEdit && (
              <button 
                onClick={onEdit}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              >
                编辑
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* 项目概览 */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-medium mb-3">项目信息</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">状态:</span>
                <span className="ml-2">{project.status}</span>
              </div>
              <div>
                <span className="text-gray-600">创建时间:</span>
                <span className="ml-2">{project.createdAt.toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-600">最后更新:</span>
                <span className="ml-2">{project.updatedAt.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">进度统计</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">总任务:</span>
                <span className="ml-2">{project.totalTasks}</span>
              </div>
              <div>
                <span className="text-gray-600">已完成:</span>
                <span className="ml-2 text-green-600">{project.completedTasks}</span>
              </div>
              <div>
                <span className="text-gray-600">进行中:</span>
                <span className="ml-2 text-blue-600">{project.activeTasks}</span>
              </div>
              <div>
                <span className="text-gray-600">已失败:</span>
                <span className="ml-2 text-red-600">{project.failedTasks}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 进度条 */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">整体进度</span>
            <span>{Math.round(project.progress * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${project.progress * 100}%` }}
            />
          </div>
        </div>
        
        {/* 参与Agent */}
        <div className="mb-6">
          <h3 className="font-medium mb-3">参与Agent ({project.assignedAgents.length})</h3>
          <div className="grid grid-cols-2 gap-2">
            {project.assignedAgents.map(agent => (
              <div key={agent.id} className="p-2 border rounded text-sm">
                <div className="font-medium">{agent.name}</div>
                <div className="text-gray-600">{agent.agentType}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 技术栈 */}
        <div>
          <h3 className="font-medium mb-3">技术栈</h3>
          <div className="flex flex-wrap gap-2">
            {project.technologyStack.map((tech, index) => (
              <span 
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}