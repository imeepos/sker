/**
 * Agent详情组件 - Agent详细信息展示组件
 */

import React, { useState, useMemo } from 'react'
import { 
  Edit3, 
  Trash2, 
  Play, 
  Square, 
  RotateCcw, 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Settings,
  GitBranch,
  Mail,
  User,
  Calendar,
  TrendingUp,
  AlertCircle,
  Zap
} from 'lucide-react'
import { cn } from '../../../lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui'
import { SkillRadar } from '../Charts/SkillRadar'
import { AgentWorkHistory } from './AgentWorkHistory'
import type { Agent } from '../../../types/multi-agent'

interface AgentDetailsProps {
  agent: Agent
  onEdit?: () => void
  onDelete?: () => void
  onStart?: () => void
  onStop?: () => void
  onRestart?: () => void
  className?: string
}

// 状态配置
const getStatusConfig = (status: Agent['status']) => {
  switch (status) {
    case 'working':
      return {
        color: 'text-green-600',
        bg: 'bg-green-100',
        icon: Activity,
        label: '工作中',
        description: 'Agent正在执行任务'
      }
    case 'idle':
      return {
        color: 'text-gray-600',
        bg: 'bg-gray-100',
        icon: Clock,
        label: '空闲',
        description: 'Agent等待任务分配'
      }
    case 'error':
      return {
        color: 'text-red-600',
        bg: 'bg-red-100',
        icon: AlertCircle,
        label: '错误',
        description: 'Agent遇到错误，需要处理'
      }
    case 'offline':
      return {
        color: 'text-gray-500',
        bg: 'bg-gray-100',
        icon: XCircle,
        label: '离线',
        description: 'Agent已停止运行'
      }
    default:
      return {
        color: 'text-gray-600',
        bg: 'bg-gray-100',
        icon: Clock,
        label: status,
        description: '未知状态'
      }
  }
}

// Agent类型配置
const getAgentTypeConfig = (type: Agent['agentType']) => {
  switch (type) {
    case 'developer':
      return {
        label: '开发者',
        description: '负责代码开发和实现',
        color: 'text-blue-600'
      }
    case 'reviewer':
      return {
        label: '代码审查员',
        description: '负责代码审查和质量把控',
        color: 'text-purple-600'
      }
    case 'tester':
      return {
        label: '测试员',
        description: '负责测试和质量保证',
        color: 'text-green-600'
      }
    case 'manager':
      return {
        label: '项目经理',
        description: '负责项目管理和协调',
        color: 'text-orange-600'
      }
    default:
      return {
        label: type,
        description: '未知类型',
        color: 'text-gray-600'
      }
  }
}

export const AgentDetails: React.FC<AgentDetailsProps> = ({
  agent,
  onEdit,
  onDelete,
  onStart,
  onStop,
  onRestart,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'settings'>('overview')
  
  const statusConfig = getStatusConfig(agent.status)
  const typeConfig = getAgentTypeConfig(agent.agentType)
  const StatusIcon = statusConfig.icon
  
  // 计算效率分数
  const efficiencyScore = useMemo(() => {
    const totalTasks = agent.completedTasks + agent.failedTasks
    if (totalTasks === 0) return 0
    
    // 基于成功率和任务完成数量计算效率
    const successRateWeight = 0.7
    const volumeWeight = 0.3
    const volumeScore = Math.min(totalTasks / 100, 1) // 最多100个任务为满分
    
    return Math.round((agent.successRate * successRateWeight + volumeScore * volumeWeight) * 100)
  }, [agent.successRate, agent.completedTasks, agent.failedTasks])
  
  return (
    <div className={cn("h-full flex flex-col bg-white", className)}>
      {/* 头部区域 */}
      <div className="flex-shrink-0 border-b bg-gray-50">
        <div className="p-6">
          <div className="flex items-start justify-between">
            {/* Agent基本信息 */}
            <div className="flex items-start gap-4">
              {/* 头像 */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                  <span className="text-2xl font-bold">
                    {agent.name.charAt(0)}
                  </span>
                </div>
                {/* 状态指示器 */}
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center",
                  statusConfig.bg
                )}>
                  <StatusIcon className={cn("w-3 h-3", statusConfig.color)} />
                </div>
              </div>
              
              {/* 基本信息 */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
                  <span className={cn(
                    "px-2 py-1 text-xs font-medium rounded-full",
                    statusConfig.bg,
                    statusConfig.color
                  )}>
                    {statusConfig.label}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-2">{agent.description || '暂无描述'}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className={cn("flex items-center gap-1", typeConfig.color)}>
                    <User className="w-4 h-4" />
                    {typeConfig.label}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    最后活动: {new Date(agent.lastActivity).toLocaleString('zh-CN')}
                  </span>
                </div>
                
                {agent.currentTask && (
                  <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">当前任务: </span>
                      {agent.currentTask}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              {/* 控制按钮 */}
              {agent.status === 'offline' && onStart && (
                <button 
                  onClick={onStart}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  启动
                </button>
              )}
              
              {(agent.status === 'working' || agent.status === 'idle') && onStop && (
                <button 
                  onClick={onStop}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <Square className="w-4 h-4" />
                  停止
                </button>
              )}
              
              {onRestart && (
                <button 
                  onClick={onRestart}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  重启
                </button>
              )}
              
              {/* 编辑和删除 */}
              {onEdit && (
                <button 
                  onClick={onEdit}
                  className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  编辑
                </button>
              )}
              
              {onDelete && (
                <button 
                  onClick={onDelete}
                  className="flex items-center gap-1 px-3 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* 标签导航 */}
        <div className="px-6">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: '概览', icon: Activity },
              { key: 'history', label: '工作历史', icon: Clock },
              { key: 'settings', label: '配置', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={cn(
                    "flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors",
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 性能指标卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 成功率 */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">成功率</p>
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round(agent.successRate * 100)}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* 完成任务 */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">完成任务</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {agent.completedTasks}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* 效率分数 */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">效率分数</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {efficiencyScore}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Zap className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* 技能雷达图和基本信息 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 技能雷达图 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    技能分析
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SkillRadar
                    capabilities={agent.capabilities}
                    agentName={agent.name}
                  />
                </CardContent>
              </Card>
              
              {/* 详细信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    详细信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">基本配置</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Agent类型:</span>
                        <span className={typeConfig.color}>{typeConfig.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">最大并发任务:</span>
                        <span>{agent.maxConcurrentTasks || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">超时时间:</span>
                        <span>{agent.timeoutMinutes ? `${agent.timeoutMinutes}分钟` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">任务统计</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">总任务数:</span>
                        <span>{agent.completedTasks + agent.failedTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">失败任务:</span>
                        <span className="text-red-600">{agent.failedTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">平均执行时间:</span>
                        <span>N/A</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Git配置</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">用户名:</span>
                        <span>{agent.gitConfig?.username || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">邮箱:</span>
                        <span>{agent.gitConfig?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">SSH密钥:</span>
                        <span>{agent.gitConfig?.sshKey ? '已配置' : '未配置'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* 技能列表 */}
            <Card>
              <CardHeader>
                <CardTitle>技能清单</CardTitle>
              </CardHeader>
              <CardContent>
                {agent.capabilities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {agent.capabilities.map((capability, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">暂无配置技能</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {activeTab === 'history' && (
          <AgentWorkHistory agentId={agent.id} />
        )}
        
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>配置管理</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">
                  配置管理功能开发中...
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}