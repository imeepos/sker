/**
 * ProjectDetails组件 - 项目详细信息展示
 * 展示项目的完整详细信息，包括概览、统计指标、Agent管理等
 */

import React, { memo, useState } from 'react'
import { Button } from '../../ui/Button'
import type { Project, ProjectStatus } from '../../../types/multi-agent'

interface ProjectDetailsProps {
  project: Project
  onEdit?: () => void
  onStatusChange?: (status: ProjectStatus) => void
  onAgentAssign?: () => void
  onTaskCreate?: () => void
  className?: string
}

// 统计卡片组件
const StatCard: React.FC<{
  title: string
  value: number | string
  icon: React.ReactNode
  color?: string
  description?: string
}> = ({ title, value, icon, color = 'text-gray-600', description }) => (
  <div className="bg-white p-4 rounded-lg border shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <div className={`text-2xl ${color} opacity-80`}>
        {icon}
      </div>
    </div>
  </div>
)

// 项目信息部分
const ProjectInfoSection: React.FC<{ project: Project }> = ({ project }) => {
  const getStatusColor = (status: ProjectStatus) => {
    const colors = {
      planning: 'bg-blue-100 text-blue-800 border-blue-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      paused: 'bg-orange-100 text-orange-800 border-orange-200',
      completed: 'bg-green-100 text-green-900 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusText = (status: ProjectStatus) => {
    const texts = {
      planning: '规划中',
      active: '进行中',
      paused: '已暂停',
      completed: '已完成',
      cancelled: '已取消'
    }
    return texts[status] || status
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
          <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(project.status)}`}>
            {getStatusText(project.status)}
          </span>
        </div>
        
        {project.description && (
          <p className="text-gray-600">{project.description}</p>
        )}
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>创建时间:</span>
            <span>{project.createdAt.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>最后更新:</span>
            <span>{project.updatedAt.toLocaleDateString()}</span>
          </div>
          {project.repository && (
            <>
              <div className="flex justify-between">
                <span>Git仓库:</span>
                <span className="text-blue-600 truncate max-w-48">{project.repository.url}</span>
              </div>
              <div className="flex justify-between">
                <span>主分支:</span>
                <span>{project.repository.branch}</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* 质量门禁信息 */}
      {project.config.qualityGates && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">质量门禁</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">测试覆盖率要求:</span>
              <span>{project.config.qualityGates.testCoverage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">代码质量要求:</span>
              <span>{project.config.qualityGates.codeQuality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">安全扫描:</span>
              <span>{project.config.qualityGates.securityScan ? '启用' : '禁用'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Agent分配列表组件
const AgentAssignmentList: React.FC<{ 
  project: Project 
  onAssign?: () => void
}> = ({ project, onAssign }) => {
  if (project.assignedAgents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">🤖</div>
        <p className="text-sm mb-3">还没有分配Agent</p>
        {onAssign && (
          <Button onClick={onAssign} size="sm">
            分配Agent
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {project.assignedAgents.map(agent => (
        <div key={agent.id} className="bg-gray-50 p-3 rounded-lg border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium">
              {agent.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {agent.name}
              </h4>
              <p className="text-xs text-gray-600">
                {agent.agentType} • {agent.capabilities.join(', ')}
              </p>
              <div className="flex items-center mt-1">
                <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                  agent.status === 'working' ? 'bg-green-400' :
                  agent.status === 'idle' ? 'bg-gray-400' :
                  agent.status === 'error' ? 'bg-red-400' : 'bg-gray-300'
                }`} />
                <span className="text-xs text-gray-500">{agent.status}</span>
              </div>
            </div>
          </div>
          
          {agent.metrics && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">成功率:</span>
                  <span className="ml-1 font-medium">{Math.round(agent.successRate * 100)}%</span>
                </div>
                <div>
                  <span className="text-gray-500">完成任务:</span>
                  <span className="ml-1 font-medium">{agent.completedTasks}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {onAssign && (
        <button
          onClick={onAssign}
          className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors text-center"
        >
          <div className="text-2xl mb-1">➕</div>
          <p className="text-sm">添加Agent</p>
        </button>
      )}
    </div>
  )
}

// 需求文档列表组件
const RequirementDocumentsList: React.FC<{ project: Project }> = ({ project }) => {
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)

  if (project.requirements.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📄</div>
        <p className="text-sm">还没有上传需求文档</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {project.requirements.map(doc => (
        <div key={doc.id} className="border rounded-lg">
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id!)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{doc.title}</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  <span>类型: {doc.documentType}</span>
                  <span>优先级: {doc.priority}</span>
                  <span>版本: {doc.version}</span>
                </div>
              </div>
              <div className="text-gray-400">
                {expandedDoc === doc.id ? '▲' : '▼'}
              </div>
            </div>
          </div>
          
          {expandedDoc === doc.id && (
            <div className="px-4 pb-4 border-t bg-gray-50">
              <div className="mt-3">
                <h5 className="text-sm font-medium text-gray-700 mb-2">文档内容:</h5>
                <div className="bg-white p-3 rounded border text-sm max-h-60 overflow-y-auto">
                  {doc.content}
                </div>
              </div>
              
              {doc.llmProcessing && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">LLM处理结果:</h5>
                  <div className="bg-blue-50 p-3 rounded border text-sm">
                    <div className="mb-2">
                      <span className="font-medium">状态:</span>
                      <span className="ml-2">{doc.llmProcessing.status}</span>
                    </div>
                    {doc.llmProcessing.extractedRequirements && (
                      <div className="mb-2">
                        <span className="font-medium">提取的需求:</span>
                        <ul className="ml-4 mt-1 list-disc">
                          {doc.llmProcessing.extractedRequirements.map((req, idx) => (
                            <li key={idx}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {doc.llmProcessing.suggestedTasks && (
                      <div>
                        <span className="font-medium">建议任务:</span>
                        <ul className="ml-4 mt-1 list-disc">
                          {doc.llmProcessing.suggestedTasks.map((task, idx) => (
                            <li key={idx}>{task}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = memo(({
  project,
  onEdit,
  onStatusChange,
  onAgentAssign,
  onTaskCreate,
  className = ''
}) => {
  const progressPercentage = Math.round(project.progress * 100)

  return (
    <div className={`h-full overflow-y-auto bg-gray-50 ${className}`}>
      {/* 头部操作栏 */}
      <div className="bg-white border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-1">项目详情和管理</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {onTaskCreate && (
              <Button onClick={onTaskCreate} variant="outline">
                创建任务
              </Button>
            )}
            {onEdit && (
              <Button onClick={onEdit} variant="outline">
                编辑项目
              </Button>
            )}
            {onStatusChange && (
              <select 
                value={project.status}
                onChange={(e) => onStatusChange(e.target.value as ProjectStatus)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="planning">规划中</option>
                <option value="active">进行中</option>
                <option value="paused">已暂停</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 项目基本信息 */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">项目信息</h2>
          <ProjectInfoSection project={project} />
        </div>
        
        {/* 项目统计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="总任务" 
            value={project.totalTasks}
            icon="📋"
            description="项目任务总数"
          />
          <StatCard 
            title="已完成" 
            value={project.completedTasks}
            icon="✅"
            color="text-green-600"
            description={`${project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0}% 完成率`}
          />
          <StatCard 
            title="进行中" 
            value={project.activeTasks}
            icon="⚡"
            color="text-blue-600"
            description="正在执行的任务"
          />
          <StatCard 
            title="参与Agent" 
            value={project.assignedAgents.length}
            icon="🤖"
            color="text-purple-600"
            description="分配的Agent数量"
          />
        </div>

        {/* 整体进度 */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">整体进度</h2>
            <span className="text-2xl font-bold text-blue-600">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          {project.failedTasks > 0 && (
            <p className="text-sm text-red-600 mt-2">
              ⚠️ 有 {project.failedTasks} 个任务执行失败
            </p>
          )}
        </div>
        
        {/* 参与Agent */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              参与Agent ({project.assignedAgents.length})
            </h2>
          </div>
          <AgentAssignmentList project={project} onAssign={onAgentAssign} />
        </div>
        
        {/* 技术栈 */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">技术栈</h2>
          {project.technologyStack.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {project.technologyStack.map((tech, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full border border-blue-200"
                >
                  {tech}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">还没有配置技术栈</p>
          )}
        </div>

        {/* 需求文档 */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            需求文档 ({project.requirements.length})
          </h2>
          <RequirementDocumentsList project={project} />
        </div>
      </div>
    </div>
  )
})

ProjectDetails.displayName = 'ProjectDetails'