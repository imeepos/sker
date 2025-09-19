/**
 * ProjectManagementDemo组件 - 项目管理模块演示
 * 展示所有项目管理组件的集成使用
 */

import React, { useState } from 'react'
import {
  ProjectList,
  ProjectCard,
  ProjectDetails,
  ProjectCreationWizard,
  RequirementUploader,
  TaskAllocationMatrix,
  ProjectProgressChart
} from './index'
import { useProjects } from '../../../hooks/useProjects'
import type { Project, RequirementDocument } from '../../../types/multi-agent'

export const ProjectManagementDemo: React.FC = () => {
  const {
    projects,
    selectedProject,
    selectProject,
    loading,
    error
  } = useProjects()

  const [showWizard, setShowWizard] = useState(false)
  const [currentTab, setCurrentTab] = useState<'list' | 'details' | 'matrix' | 'chart'>('list')

  // 处理项目创建
  const handleProjectCreate = async (project: Project) => {
    try {
      console.log('创建项目:', project)
      setShowWizard(false)
    } catch (error) {
      console.error('创建项目失败:', error)
    }
  }

  // 处理需求文档上传
  const handleRequirementUpload = async (documents: RequirementDocument[]) => {
    try {
      console.log('上传需求文档:', documents)
    } catch (error) {
      console.error('上传文档失败:', error)
    }
  }

  // 模拟项目数据（用于演示）
  const mockProjects: Project[] = [
    {
      id: '1',
      name: '多Agent协同开发系统',
      description: '构建一个支持多Agent协同开发的智能系统平台',
      status: 'active',
      progress: 0.65,
      assignedAgents: [
        {
          id: 'agent1',
          name: '前端开发Agent',
          description: '专门负责前端开发',
          status: 'working',
          agentType: 'developer',
          capabilities: ['frontend_development', 'ui_design'],
          currentTask: 'task1',
          successRate: 0.85,
          completedTasks: 12,
          failedTasks: 2,
          lastActivity: new Date(),
          createdAt: new Date('2024-01-01'),
          maxConcurrentTasks: 3,
          timeoutMinutes: 60,
          config: {
            name: '前端开发Agent',
            agentType: 'developer',
            capabilities: ['frontend_development', 'ui_design'],
            maxConcurrentTasks: 3,
            timeoutMinutes: 60
          }
        }
      ],
      totalTasks: 25,
      completedTasks: 16,
      activeTasks: 6,
      failedTasks: 3,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      config: {
        name: '多Agent协同开发系统',
        description: '构建一个支持多Agent协同开发的智能系统平台',
        technologyStack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        qualityGates: {
          testCoverage: 80,
          codeQuality: 85,
          securityScan: true
        }
      },
      requirements: [
        {
          id: 'req1',
          title: '系统架构设计',
          content: '设计支持多Agent协同工作的系统架构...',
          documentType: 'architecture_doc',
          version: '1.0',
          priority: 'high',
          uploadedAt: new Date()
        }
      ],
      technologyStack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      repository: {
        url: 'https://github.com/example/multi-agent-system',
        branch: 'main'
      }
    }
  ]

  const displayProjects = projects.length > 0 ? projects : mockProjects

  return (
    <div className="h-full flex flex-col">
      {/* 头部导航 */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h1 className="text-xl font-semibold text-gray-900">
          项目管理模块演示
        </h1>
        
        <div className="flex items-center space-x-2">
          <div className="flex border border-gray-200 rounded-lg">
            {[
              { key: 'list', label: '项目列表' },
              { key: 'details', label: '项目详情' },
              { key: 'matrix', label: '分配矩阵' },
              { key: 'chart', label: '进度图表' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setCurrentTab(tab.key as any)}
                className={`px-3 py-1 text-sm ${
                  currentTab === tab.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                } ${tab.key === 'list' ? 'rounded-l-lg' : ''} ${
                  tab.key === 'chart' ? 'rounded-r-lg' : 'border-r'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 错误和加载状态 */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
          错误: {error}
        </div>
      )}

      {loading && (
        <div className="p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-700">
          正在加载...
        </div>
      )}

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-hidden">
        {currentTab === 'list' && (
          <div className="h-full flex">
            <div className="w-1/2 border-r">
              <ProjectList
                projects={displayProjects}
                selectedProjectId={selectedProject?.id}
                onProjectSelect={selectProject}
                onCreateProject={() => setShowWizard(true)}
              />
            </div>
            <div className="w-1/2 p-4">
              <h3 className="text-lg font-medium mb-4">项目卡片预览</h3>
              {displayProjects.length > 0 && (
                <ProjectCard
                  project={displayProjects[0]}
                  showProgress={true}
                  showTeam={true}
                />
              )}
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">需求文档上传器</h3>
                <RequirementUploader
                  onUpload={handleRequirementUpload}
                  maxFiles={5}
                />
              </div>
            </div>
          </div>
        )}

        {currentTab === 'details' && selectedProject && (
          <ProjectDetails
            project={selectedProject}
            onEdit={() => console.log('编辑项目')}
            onStatusChange={(status) => console.log('状态变更:', status)}
            onAgentAssign={() => console.log('分配Agent')}
            onTaskCreate={() => console.log('创建任务')}
          />
        )}

        {currentTab === 'details' && !selectedProject && displayProjects.length > 0 && (
          <ProjectDetails
            project={displayProjects[0]}
            onEdit={() => console.log('编辑项目')}
            onStatusChange={(status) => console.log('状态变更:', status)}
            onAgentAssign={() => console.log('分配Agent')}
            onTaskCreate={() => console.log('创建任务')}
          />
        )}

        {currentTab === 'matrix' && (
          <div className="h-full p-6">
            <TaskAllocationMatrix
              project={selectedProject || displayProjects[0]}
              onReassignTask={(taskId, agentId) => 
                console.log('重新分配任务:', taskId, 'to', agentId)
              }
              onTaskClick={(taskId) => console.log('任务点击:', taskId)}
              onAgentClick={(agentId) => console.log('Agent点击:', agentId)}
            />
          </div>
        )}

        {currentTab === 'chart' && (
          <div className="h-full p-6">
            <ProjectProgressChart
              projectId={selectedProject?.id || displayProjects[0]?.id || '1'}
            />
          </div>
        )}

        {currentTab === 'details' && !selectedProject && displayProjects.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-4">📋</div>
              <p>还没有项目</p>
              <button
                onClick={() => setShowWizard(true)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                创建第一个项目
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 项目创建向导 */}
      <ProjectCreationWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={handleProjectCreate}
      />
    </div>
  )
}

export default ProjectManagementDemo